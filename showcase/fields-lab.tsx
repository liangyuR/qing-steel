import { useState, type ReactNode } from 'react';
import {
  Card,
  Checkbox,
  FileInput,
  Grid,
  NumberField,
  SegmentedControl,
  Select,
  Stack,
  Switch,
  Text,
  type SelectOption,
} from '../src';

function Example({
  title,
  name,
  children,
  description,
  wide,
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

function Dot({ tone }: { tone: 'ok' | 'warn' | 'ng' | 'fault' | 'off' }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 8,
        height: 8,
        flex: 'none',
        borderRadius: 999,
        background: tone === 'off' ? 'var(--outline)' : `var(--${tone})`,
      }}
    />
  );
}

const cameras: {
  id: string;
  name: string;
  tone: 'ok' | 'warn' | 'fault' | 'off';
  state: string;
}[] = [
  { id: 'CAM-01', name: '顶部相机', tone: 'ok', state: '在线' },
  { id: 'CAM-02', name: '侧面相机', tone: 'warn', state: '曝光偏高' },
  { id: 'CAM-03', name: '轮廓相机', tone: 'fault', state: '连接中断' },
  { id: 'CAM-04', name: '备用相机', tone: 'off', state: '未启用' },
];

const cameraOptions: SelectOption<ReactNode>[] = cameras.map((camera) => ({
  value: camera.id,
  label: (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <Dot tone={camera.tone} />
      <span className="qs-num">{camera.id}</span>
      <span style={{ opacity: 0.72 }}>{camera.name}</span>
    </span>
  ),
  textValue: camera.id,
  'aria-label': `${camera.name} ${camera.id}，${camera.state}`,
  disabled: camera.tone === 'off',
}));

export function FormsLab() {
  const [exposure, setExposure] = useState<number | ''>(6200);
  const [camera, setCamera] = useState('CAM-01');
  const [picked, setPicked] = useState<File[]>([]);
  const [locked, setLocked] = useState(true);
  const outOfRange = exposure !== '' && (exposure < 100 || exposure > 5000);
  return (
    <>
      <Example
        title="文件输入"
        name="FileInput"
        wide
        description="保留原生 input：标签、表单提交、重置与自动化测试的 setInputFiles 都直接可用。拖放不按 accept 过滤，宿主须自行校验类型与大小；受控的 files 会同步回原生 input，宿主丢弃的文件不会随表单提交。示例只读取文件名，不上传。"
      >
        <Grid minWidth={260}>
          <Stack direction="column" align="stretch" gap={18}>
            <FileInput
              label="标定原图"
              accept=".png,.jpg,.jpeg,.bmp,.tif,.tiff"
              description="PNG、JPEG、BMP 或 TIFF，单图不超过 15 MB。"
            />
            <FileInput label="锁定导入" disabled />
          </Stack>
          <FileInput
            label="样本组原图"
            dropzone
            multiple
            accept="image/*"
            files={picked}
            onFilesChange={(next) => {
              const images = next.filter((file) => file.type.startsWith('image/'));
              if (images.length) setPicked(images);
            }}
            description={
              picked.length
                ? `已选择 ${picked.length} 个文件`
                : '可一次拖入多张图片，非图片会被宿主丢弃。'
            }
          />
        </Grid>
      </Example>
      <Example
        title="越界保留与富选项"
        name="NumberField clamp={false} · Select"
        description='clamp={false} 时越界输入不会在失焦时被改写，失焦后组件标记无效并提示范围（输入过程中不打扰），宿主据此阻止保存；step="any" 允许任意小数。选项可带状态圆点，独立的 aria-label 供辅助技术与测试定位。'
      >
        <NumberField
          label="曝光时间"
          unit="μs"
          min={100}
          max={5000}
          step="any"
          clamp={false}
          value={exposure}
          onValueChange={setExposure}
          description="范围 100–5000 μs。"
        />
        <Select label="当前相机" value={camera} onValueChange={setCamera} options={cameraOptions} />
        <Text variant="label" muted>
          {outOfRange ? '曝光时间超出范围，保存已阻止' : `可以保存 · 相机 ${camera}`}
        </Text>
      </Example>
      <Example
        title="锁定表单"
        name="fieldset disabled"
        description="祖先 fieldset 禁用时，下拉、数值、复选、开关和文件输入一起锁定，仍清晰显示当前值。"
      >
        <Switch label="锁定参数" checked={locked} onCheckedChange={setLocked} />
        <fieldset
          disabled={locked}
          style={{ border: 0, padding: 0, margin: 0, minWidth: 0, display: 'grid', gap: 18 }}
        >
          <Select
            label="检测模式"
            defaultValue="strict"
            options={[
              { value: 'standard', label: '标准' },
              { value: 'strict', label: '严格' },
            ]}
          />
          <NumberField label="胶宽下限" unit="mm" defaultValue={0.35} step={0.01} min={0} />
          <Stack gap={24}>
            <Checkbox label="保存原图" defaultChecked />
            <Switch label="自动复检" defaultChecked />
          </Stack>
        </fieldset>
      </Example>
    </>
  );
}

export function SelectionLab() {
  const [camera, setCamera] = useState('CAM-01');
  return (
    <Example
      title="带状态的分段"
      name="SegmentedControl · ReactNode label"
      description="选项内容可放状态圆点等元素，aria-label 提供“名称 编号”的可访问名称；指示器在快速连续切换时从当前位置继续，不排队。"
    >
      <SegmentedControl
        label="切换相机"
        size="sm"
        value={camera}
        onValueChange={setCamera}
        options={cameras.map((item) => ({
          value: item.id,
          label: (
            <>
              <Dot tone={item.tone} />
              <span className="qs-num">{item.id}</span>
            </>
          ),
          'aria-label': `${item.name} ${item.id}`,
          disabled: item.tone === 'off',
        }))}
      />
      <Text variant="label" muted>
        当前：{cameras.find((item) => item.id === camera)?.name} {camera}
      </Text>
    </Example>
  );
}
