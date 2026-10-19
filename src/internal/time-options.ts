// Enumerate valid step positions, not all seconds. Match native input's step base.
export function timeOptions(min: number, max: number, base: number, step: number) {
  const interval = Number.isFinite(step) && step > 0 ? step : 60;
  const result: number[] = [];
  const ranges =
    min <= max
      ? [[min, max]]
      : [
          [0, max],
          [min, 86399],
        ];
  for (const [lo, hi] of ranges) {
    // Subsecond inputs still offer integer-second choices in the panel.
    if (interval < 1) {
      for (let n = Math.ceil(lo); n <= hi; n++) {
        const offset = (n - base) / interval;
        if (Math.abs(offset - Math.round(offset)) < 1e-7) result.push(n);
      }
    } else {
      const start = Math.ceil((lo - base) / interval - 1e-9);
      const end = Math.floor((hi - base) / interval + 1e-9);
      for (let i = start; i <= end; i++) {
        const n = base + i * interval;
        if (Math.abs(n - Math.round(n)) < 1e-7) result.push(Math.round(n));
      }
    }
  }
  const hours = new Map<number, number[]>();
  const minutes = new Map<number, number[]>();
  for (const n of result) {
    const h = Math.floor(n / 3600),
      m = Math.floor(n / 60);
    if (!hours.has(h)) hours.set(h, []);
    if (!minutes.has(m)) minutes.set(m, []);
    hours.get(h)!.push(n);
    minutes.get(m)!.push(n);
  }
  return { slots: result, hours, minutes };
}
