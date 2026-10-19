import { useState, type ReactNode } from 'react';
import {
  Alert,
  AnimatedNumber,
  Button,
  CameraStrip,
  CameraThumbnail,
  Card,
  Grid,
  InspectionStages,
  MeasurementReading,
  MeasurementReadings,
  SegmentedControl,
  Stack,
  Switch,
  Text,
  VerdictCard,
  type CameraFrame,
  type InspectionResult,
  type InspectionStep,
  type InspectionVerdict,
} from '../src';

function Example({
  title,
  name,
  children,
  description,
  wide = false,
}: {
  title: string;
  name: string;
  children: ReactNode;
  description?: string;
  wide?: boolean;
}) {
  return (
    <Card
      className={wide ? 'demo-card wide' : 'demo-card'}
      title={
        <Stack gap={8}>
          <span>{title}</span>
          <code>{name}</code>
        </Stack>
      }
    >
      <div className="demo-stage">{children}</div>
      {description && <p className="demo-caption">{description}</p>}
    </Card>
  );
}
const steps: InspectionStep[] = [
  { id: 'validate', label: '校验' },
  { id: 'acquire', label: '采集' },
  { id: 'drain', label: '收尾' },
  { id: 'judge', label: '判定' },
  { id: 'report', label: '回写' },
  { id: 'release', label: '释放' },
];
function VerdictExamples() {
  const [cycle, setCycle] = useState(1042);
  const [sequence, setSequence] = useState(1);
  const [state, setState] = useState<'idle' | 'running' | 'fault'>('idle');
  const [result, setResult] = useState<InspectionResult | null>({
    id: 'R-1',
    cycleId: 'C-1042',
    verdict: 'ok',
    description: '全部检测段符合要求。',
    serialNumber: 'P-20261019-042',
    durationMs: 186,
  });
  const [stage, setStage] = useState(2);
  const [fault, setFault] = useState(false);
  const [pulse, setPulse] = useState(false);
  function judge(verdict: InspectionVerdict) {
    setSequence(sequence + 1);
    setState('idle');
    setResult({
      id: `R-${sequence + 1}`,
      cycleId: `C-${cycle}`,
      verdict,
      description:
        verdict === 'ok'
          ? '全部检测段符合要求。'
          : verdict === 'ng'
            ? '检测段 S03：胶宽低于下限。'
            : verdict === 'warn'
              ? '局部测量值接近边界，请复核。'
              : '测量未完成，不能作为产品 NG 处理。',
      serialNumber: `P-${cycle}`,
      durationMs: 186,
    });
  }
  return (
    <>
      <Example
        title="整件判定"
        name="VerdictCard"
        wide
        description="OK 使用柔和容器色，NG 使用醒目实色；采集与测量故障使用紫色 ERR。只有新的 NG 结果到达时强调一次。"
      >
        <VerdictCard
          cycleId={`C-${cycle}`}
          result={result}
          state={state}
          faultMessage="相机连接中断，当前工件暂停检测。"
        />
        <Stack>
          <Button onClick={() => judge('ok')}>判定 OK</Button>
          <Button danger onClick={() => judge('ng')}>
            判定 NG
          </Button>
          <Button onClick={() => judge('warn')}>待复核</Button>
          <Button onClick={() => judge('fault')}>测量异常</Button>
          <Button
            variant="outlined"
            onClick={() => {
              setCycle(cycle + 1);
              setState('running');
            }}
          >
            下一件（保留旧结果）
          </Button>
          <Button variant="text" onClick={() => setState('fault')}>
            模拟设备故障
          </Button>
          <Button
            variant="text"
            onClick={() => {
              setState('idle');
              setResult(null);
            }}
          >
            复位判定
          </Button>
        </Stack>
        <Text variant="label" muted>
          当前工件 C-{cycle}；结果来自 {result?.cycleId ?? '—'}。切换工件后不会展示上一件结果。
        </Text>
      </Example>
      <Example
        title="检测阶段推进"
        name="InspectionStages"
        wide
        description="完成项由调用方明确传入。故障发生时停止当前阶段动效，保留已完成阶段；复位后可继续演示。"
      >
        <InspectionStages
          steps={steps}
          currentStepId={stage < steps.length ? steps[stage].id : null}
          completedStepIds={steps.slice(0, stage).map((step) => step.id)}
          fault={
            fault
              ? {
                  stepId: steps[Math.min(stage, steps.length - 1)].id,
                  message: '采集超时：检查连接后复位。',
                }
              : null
          }
          pulse={pulse}
        />
        <Stack>
          <Button
            onClick={() => setStage(Math.min(steps.length, stage + 1))}
            disabled={fault || stage >= steps.length}
          >
            推进阶段
          </Button>
          <Button
            variant="outlined"
            onClick={() => setFault(true)}
            disabled={fault || stage >= steps.length}
          >
            注入阶段故障
          </Button>
          <Button
            variant="text"
            onClick={() => {
              setStage(0);
              setFault(false);
            }}
          >
            复位阶段
          </Button>
          <Switch label="当前阶段呼吸点" checked={pulse} onCheckedChange={setPulse} />
        </Stack>
        <Text variant="label" muted>
          {stage === steps.length
            ? '本轮检测流程已完成。'
            : `已完成 ${stage} / ${steps.length} 个阶段。`}
        </Text>
      </Example>
      <Example title="等待与运行" name="VerdictCard">
        <VerdictCard size="md" cycleId="C-1043" state="running" />
      </Example>
      <Example title="尚无结果" name="VerdictCard">
        <VerdictCard size="md" />
      </Example>
    </>
  );
}
function FrameDrawing({ bad = false }: { bad?: boolean }) {
  return (
    <svg viewBox="0 0 160 88" role="img" aria-label={bad ? '胶路缺口示意图' : '完整胶路示意图'}>
      <path
        d="M24 22h108v44H24Z"
        fill="var(--surface-mid)"
        stroke="var(--outline-variant)"
        strokeWidth="8"
        strokeLinejoin="round"
      />
      <path
        d={bad ? 'M40 22h92v44H24V22h4' : 'M24 22h108v44H24Z'}
        fill="none"
        stroke={bad ? 'var(--ng)' : 'var(--glue)'}
        strokeWidth="3"
        strokeLinecap="round"
      />
      {bad && <circle cx="34" cy="22" r="10" fill="none" stroke="var(--ng)" strokeWidth="1.5" />}
      <path d="M80 37v14M73 44h14" stroke="var(--outline)" strokeWidth="1" />
    </svg>
  );
}
const frames: CameraFrame[] = [
  {
    id: 'F-001',
    cycleId: 'C-1042',
    cameraId: 'CAM-01',
    label: '顶部',
    state: 'ok',
    preview: <FrameDrawing />,
    detail: '128 点 · 42 ms',
    channel: 1,
  },
  {
    id: 'F-002',
    cycleId: 'C-1042',
    cameraId: 'CAM-02',
    label: '侧面',
    state: 'ng',
    preview: <FrameDrawing bad />,
    detail: '缺口 0.42 mm',
    channel: 2,
  },
  {
    id: 'F-003',
    cycleId: 'C-1042',
    cameraId: 'CAM-03',
    label: '底部',
    state: 'warn',
    preview: <FrameDrawing />,
    detail: '接近测量边界',
    channel: 3,
  },
  {
    id: 'F-004',
    cycleId: 'C-1042',
    cameraId: 'CAM-04',
    label: '背面',
    state: 'missing',
    detail: '触发后未收到帧',
    channel: 4,
  },
  {
    id: 'F-005',
    cycleId: 'C-1042',
    cameraId: 'CAM-05',
    label: '轮廓',
    state: 'capturing',
    detail: '等待测量完成',
    channel: 5,
  },
  {
    id: 'F-006',
    cycleId: 'C-1042',
    cameraId: 'CAM-06',
    label: '预留',
    state: 'skipped',
    detail: '当前方案不检测',
    channel: 6,
    disabled: true,
  },
];
function CameraExamples() {
  const [selected, setSelected] = useState<string | null>('F-001');
  const [layout, setLayout] = useState('strip');
  const [newCycle, setNewCycle] = useState(false);
  const frame = frames.find((frame) => frame.id === selected);
  return (
    <>
      <Example
        title="按相机与帧浏览"
        name="CameraStrip"
        wide
        description="稳定帧 ID 驱动选择；左右方向键与 Home / End 可选帧，禁用项会被跳过，横向列表会显示当前选中帧。"
      >
        <Stack justify="space-between">
          <SegmentedControl
            label="相机布局"
            value={layout}
            onValueChange={setLayout}
            options={[
              { value: 'strip', label: '横向帧带' },
              { value: 'grid', label: '网格' },
            ]}
          />
          <Switch label="切换到新工件" checked={newCycle} onCheckedChange={setNewCycle} />
        </Stack>
        <CameraStrip
          frames={frames}
          value={selected}
          onValueChange={setSelected}
          layout={layout as 'strip' | 'grid'}
          cycleId={newCycle ? 'C-1043' : 'C-1042'}
        />
        <Text variant="label" muted>
          选中 {selected ?? '—'} · 当前工件 {newCycle ? 'C-1043' : 'C-1042'}
        </Text>
        {newCycle ? (
          <Alert tone="info">现有帧属于上一件，等待 C-1043 的采集结果。</Alert>
        ) : (
          frame && (
            <div className="industrial-frame-detail">
              <div className="industrial-frame-canvas">
                {frame.state === 'missing' || frame.state === 'capturing' ? (
                  <Text muted>{frame.detail}</Text>
                ) : (
                  frame.preview
                )}
              </div>
              <Stack direction="column" align="flex-start">
                <Text>
                  {frame.cameraId} · {frame.label}
                </Text>
                <Text variant="label" muted>
                  {frame.detail}
                </Text>
                <Text variant="label" muted>
                  示意预览，仅演示布局与状态。
                </Text>
              </Stack>
            </div>
          )
        )}
      </Example>
      <Example title="只读缩略图" name="CameraThumbnail">
        <Stack>
          <CameraThumbnail frame={frames[0]} />
          <CameraThumbnail
            frame={{
              id: 'F-007',
              cameraId: 'CAM-07',
              label: '测量失败',
              state: 'fault',
              detail: '定位分数不足',
              channel: 7,
            }}
          />
        </Stack>
      </Example>
      <Example title="空采集列表" name="CameraStrip">
        <CameraStrip frames={[]} />
      </Example>
    </>
  );
}
function ReadingExamples() {
  const [value, setValue] = useState<number | null>(0.79);
  const [stale, setStale] = useState(false);
  const [animate, setAnimate] = useState(true);
  const [counter, setCounter] = useState(12345);
  return (
    <>
      <Example
        title="单位、精度与有效性"
        name="MeasurementReadings"
        wide
        description="读数不自行推导检测结论。未测与非有限数值显示破折号，历史读数明确标记；阈值仅作展示。"
      >
        <MeasurementReadings
          items={[
            {
              id: 'width',
              label: '胶宽',
              value,
              unit: 'mm',
              precision: 2,
              status: value !== null && value < 0.8 ? 'ng' : 'ok',
              limits: { min: 0.8, max: 1.2 },
              stale,
              animate,
            },
            {
              id: 'offset',
              label: '横向偏移',
              value: -0.035,
              unit: 'mm',
              precision: 3,
              status: 'ok',
              limits: { min: -0.1, max: 0.1 },
              animate,
            },
            {
              id: 'score',
              label: '定位分数',
              value: 0.94,
              precision: 2,
              status: 'warn',
              description: '接近建议阈值',
            },
            { id: 'absent', label: '未到达测量', value: null, unit: 'mm', status: 'ok' },
          ]}
        />
        <Stack>
          <Button
            onClick={() => {
              setValue((current) =>
                current === null ? 0.79 : Number((current + 0.01).toFixed(2)),
              );
              setStale(false);
            }}
          >
            读数 +0.01
          </Button>
          <Button variant="outlined" onClick={() => setValue(null)}>
            模拟缺失读数
          </Button>
          <Switch label="标记历史读数" checked={stale} onCheckedChange={setStale} />
          <Switch label="变化数字动效" checked={animate} onCheckedChange={setAnimate} />
        </Stack>
      </Example>
      <Example
        title="统计与高精度显示"
        name="MeasurementReading · AnimatedNumber"
        description="等宽数字，只有变化位产生动效；同值更新不重复播放。"
      >
        <Grid minWidth={140}>
          <MeasurementReading
            label="累计件数"
            value={counter}
            precision={0}
            useGrouping
            unit="件"
          />
          <MeasurementReading label="本轮用时" value={186.4} precision={1} unit="ms" size="md" />
        </Grid>
        <Stack justify="space-between">
          <Text variant="label" muted>
            独立数字组件
          </Text>
          <Text variant="data-lg">
            <AnimatedNumber value={counter} precision={0} />
          </Text>
        </Stack>
        <Button onClick={() => setCounter(counter + 1)}>增加计数</Button>
      </Example>
      <Example title="异常读数不会显示为零" name="MeasurementReading">
        <MeasurementReading
          label="测量失败"
          value={Number.NaN}
          unit="mm"
          status="fault"
          description="算法未返回有效读数"
        />
        <MeasurementReading
          label="上一件读数"
          value={1.02}
          precision={2}
          unit="mm"
          status="ok"
          stale
          description="保留历史值供对照，不代表当前测量结果"
        />
      </Example>
    </>
  );
}
export function IndustrialExamples({ id }: { id: string }) {
  return id === 'industrial-verdict' ? (
    <VerdictExamples />
  ) : id === 'industrial-cameras' ? (
    <CameraExamples />
  ) : (
    <ReadingExamples />
  );
}
