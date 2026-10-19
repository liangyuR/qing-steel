import { chromium } from '@playwright/test';
import { writeFile, mkdir } from 'node:fs/promises';
import os from 'node:os';
const [base = 'http://127.0.0.1:4173', name = 'after'] = process.argv.slice(2);
const browser = await chromium.launch({ channel: 'chrome' });
const runs = [];
try {
  for (let run = -1; run < 5; run++) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.goto(`${base}/showcase/performance.html`);
    await page.getByRole('button', { name: '开始更新' }).waitFor();
    await page.evaluate(() => {
      window.samples = { frames: [], interactions: [], longTasks: [], timeOpen: [] };
      let last = 0;
      const frame = (now) => {
        if (last) window.samples.frames.push(now - last);
        last = now;
        window.frameID = requestAnimationFrame(frame);
      };
      window.frameID = requestAnimationFrame(frame);
      window.observer = new PerformanceObserver((list) =>
        window.samples.longTasks.push(
          ...list.getEntries().map((e) => ({ start: e.startTime, duration: e.duration })),
        ),
      );
      window.observer.observe({ type: 'longtask', buffered: false });
      document.addEventListener(
        'keydown',
        () => {
          const start = performance.now();
          requestAnimationFrame(() =>
            setTimeout(() => window.samples.interactions.push(performance.now() - start), 0),
          );
        },
        true,
      );
    });
    await page.getByRole('button', { name: '开始更新' }).click();
    const slider = page.getByRole('slider', { name: '交互探针' });
    await slider.focus();
    for (let i = 0; i < 50; i++) {
      await slider.press(i % 2 ? 'ArrowLeft' : 'ArrowRight');
      await page.waitForTimeout(40);
    }
    const start = await page.evaluate(() => performance.now());
    await page.getByRole('button', { name: '打开秒精度时间选择' }).click();
    await page.getByRole('dialog').waitFor();
    const timeOpen = await page.evaluate((start) => ({ start, end: performance.now() }), start);
    await page.keyboard.press('Escape');
    const cellsBefore = await page.evaluate(() => window.qsPerformance.tableCells);
    await page.getByRole('checkbox', { name: '选择 SN-1', exact: true }).check();
    const cellsAfter = await page.evaluate(() => window.qsPerformance.tableCells);
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: '停止更新' }).click();
    const result = await page.evaluate(() => {
      cancelAnimationFrame(window.frameID);
      window.observer.disconnect();
      return { ...window.samples, counters: window.qsPerformance };
    });
    result.timeOpen = timeOpen;
    result.selectionCellRenders = cellsAfter - cellsBefore;
    if (run >= 0) runs.push(result);
    await page.close();
  }
  const percentile = (a, p) =>
    [...a].sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor(a.length * p))] ?? 0;
  const summary = runs.map((r) => ({
    frameMedian: percentile(r.frames, 0.5),
    frameP95: percentile(r.frames, 0.95),
    interactionMedian: percentile(r.interactions, 0.5),
    interactionP95: percentile(r.interactions, 0.95),
    longTasks: r.longTasks.length,
    maxLongTask: Math.max(0, ...r.longTasks.map((t) => t.duration)),
    timeOpen: r.timeOpen.end - r.timeOpen.start,
    timeOpenLongTasks: r.longTasks.filter(
      (t) => t.start < r.timeOpen.end && t.start + t.duration > r.timeOpen.start,
    ),
    selectionCellRenders: r.selectionCellRenders,
    counters: r.counters,
  }));
  await mkdir('performance-results', { recursive: true });
  await writeFile(
    `performance-results/performance-${name}.json`,
    JSON.stringify(
      {
        environment: {
          browser: await browser.version(),
          platform: os.platform(),
          cpu: os.cpus()[0].model,
          logicalCpus: os.cpus().length,
          viewport: '1440x1000',
          timestamp: new Date().toISOString(),
        },
        summary,
        runs,
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify(summary));
} finally {
  await browser.close();
}
