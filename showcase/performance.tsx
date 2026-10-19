import { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ThemeProvider,
  Button,
  Slider,
  TimePicker,
  Table,
  Pagination,
  CameraStrip,
  MeasurementReadings,
  type TableColumn,
} from '../src';
import '../css/react.css';
import './showcase.css';

const metrics = { tableCells: 0, cameraTicks: 0, readingTicks: 0 };
Object.assign(window, { qsPerformance: metrics });
type Row = { id: string; value: number };
const rows: Row[] = Array.from({ length: 10000 }, (_, i) => ({
  id: `SN-${i + 1}`,
  value: ((i * 17) % 997) / 100,
}));
const columns: TableColumn<Row>[] = [
  {
    key: 'id',
    header: '工件编号',
    accessor: (row) => row.id,
    render: (row) => {
      metrics.tableCells++;
      return row.id;
    },
  },
  {
    key: 'value',
    header: '测量值',
    align: 'right',
    accessor: (row) => row.value,
    render: (row) => {
      metrics.tableCells++;
      return row.value.toFixed(2);
    },
  },
];
const key = (row: Row) => row.id;
const image = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 90"><rect width="160" height="90" fill="#171c1f"/><path d="M15 60L45 25L80 50L140 30" fill="none" stroke="#7fd4f0" stroke-width="5"/></svg>')}`;
function useTick(running: boolean, delay: number) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setTick((n) => n + 1), delay);
    return () => clearInterval(timer);
  }, [running, delay]);
  return tick;
}
function Cameras({ running }: { running: boolean }) {
  const tick = useTick(running, 200);
  metrics.cameraTicks = tick;
  const frames = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        id: `cam-${i}`,
        cameraId: String(i + 1),
        label: `相机 ${i + 1}`,
        src: image,
        state: tick % 8 === i ? ('ng' as const) : ('ok' as const),
      })),
    [tick],
  );
  return <CameraStrip frames={frames} defaultValue="cam-0" />;
}
function Readings({ running }: { running: boolean }) {
  const tick = useTick(running, 50);
  metrics.readingTicks = tick;
  return (
    <MeasurementReadings
      items={Array.from({ length: 24 }, (_, i) => ({
        id: String(i),
        label: `读数 ${i + 1}`,
        value: ((tick + i) % 1000) / 100,
        unit: 'mm',
        status: 'ok' as const,
      }))}
    />
  );
}
function Records() {
  const [page, setPage] = useState(1);
  const visible = useMemo(() => rows.slice((page - 1) * 100, page * 100), [page]);
  return (
    <>
      <Pagination
        total={rows.length}
        page={page}
        pageSize={100}
        pageSizeOptions={[100]}
        onPageChange={setPage}
      />
      <div style={{ maxHeight: 320, overflow: 'auto' }}>
        <Table caption="压力场景记录" columns={columns} rows={visible} rowKey={key} selectable />
      </div>
    </>
  );
}
function App() {
  const [running, setRunning] = useState(false);
  return (
    <ThemeProvider>
      <main style={{ padding: 24, maxWidth: 1280, margin: 'auto', display: 'grid', gap: 24 }}>
        <h1>工业工作站性能场景</h1>
        <p>
          本地固定图像 · 10,000 条记录，每页 100 条 · 8 路相机 5 Hz · 24 项读数 20
          Hz。默认停止，关闭页面自动清理。
        </p>
        <div>
          <Button onClick={() => setRunning((v) => !v)}>{running ? '停止更新' : '开始更新'}</Button>{' '}
          <a href="./">返回组件展示</a>
        </div>
        <Slider label="交互探针" defaultValue={50} />
        <TimePicker label="秒精度时间" defaultValue="09:30:15" step={1} />
        <Cameras running={running} />
        <Readings running={running} />
        <Records />
      </main>
    </ThemeProvider>
  );
}
createRoot(document.getElementById('root')!).render(<App />);
