import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Button,
  Dialog,
  NumberField,
  SnackbarProvider,
  Tabs,
  ThemeProvider,
  useSnackbar,
} from '../../../src';
import '../../../css/react.css';

function CollapsedFieldDialog() {
  return (
    <Dialog
      trigger={<Button>打开折叠对话框</Button>}
      title="折叠字段对话框"
      initialFocus="first-field"
    >
      <details>
        <summary>高级参数</summary>
        <NumberField label="折叠字段" defaultValue={1} />
      </details>
      <NumberField label="可见字段" defaultValue={2} />
    </Dialog>
  );
}
function Append() {
  const { show } = useSnackbar();
  const next = useRef(0);
  return (
    <Button onClick={() => show({ text: `提示 ${++next.current}`, duration: 0 })}>追加提示</Button>
  );
}
function TickingLayout() {
  const [, setTick] = useState(0);
  const stage = useRef<HTMLElement>(null);
  useEffect(() => {
    const timer = setInterval(() => setTick((n) => n + 1), 16);
    return () => clearInterval(timer);
  }, []);
  return (
    <SnackbarProvider max={3} placement="top" container={stage}>
      <main ref={stage} style={{ position: 'relative', minHeight: 240 }}>
        <Append />
      </main>
    </SnackbarProvider>
  );
}
createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <div style={{ padding: 24, display: 'grid', gap: 16 }}>
      <CollapsedFieldDialog />
      <Button>背景按钮</Button>
      <Tabs
        label="探针标签"
        items={[
          { value: 'short', label: '短', content: '短面板' },
          { value: 'long', label: '一个很长很长很长的标签页', content: '长面板' },
        ]}
      />
      <TickingLayout />
    </div>
  </ThemeProvider>,
);
