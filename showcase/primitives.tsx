import { forwardRef, useState, type AnchorHTMLAttributes } from 'react';
import {
  Button,
  Card,
  Chip,
  Grid,
  Icon,
  IconButton,
  Stack,
  StatusBadge,
  Text,
  useSnackbar,
} from '../src';

const ArrowIcon = () => (
  <Icon size={16}>
    <path d="M5 12h14m-6-6 6 6-6 6" />
  </Icon>
);
const RefreshIcon = () => (
  <Icon size={16}>
    <path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v5h-5" />
  </Icon>
);
const MoreIcon = () => (
  <Icon size={16}>
    <circle cx="12" cy="5" r="1" />
    <circle cx="12" cy="12" r="1" />
    <circle cx="12" cy="19" r="1" />
  </Icon>
);

const RouterLink = forwardRef<
  HTMLAnchorElement,
  AnchorHTMLAttributes<HTMLAnchorElement> & { to: string; onNavigate: (to: string) => void }
>(function RouterLink({ to, onNavigate, onClick, ...props }, ref) {
  return (
    <a
      {...props}
      ref={ref}
      href={to}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        event.preventDefault();
        onNavigate(to);
      }}
    />
  );
});

export function ButtonLinkExamples() {
  const { show } = useSnackbar();
  const navigate = (to: string) => show({ text: `已前往 ${to}`, tone: 'info' });
  return (
    <>
      <Stack>
        <Button variant="filled" asChild trailingIcon={<ArrowIcon />}>
          <RouterLink to="/recipe/capture" onNavigate={navigate}>
            前往整圈采集
          </RouterLink>
        </Button>
        <Button asChild>
          <RouterLink to="/recipe" onNavigate={navigate}>
            打开配方库
          </RouterLink>
        </Button>
        <Button variant="text" href="#actions">
          回到本节
        </Button>
        <Button asChild disabled>
          <RouterLink to="/inspect" onNavigate={navigate}>
            候选未就绪
          </RouterLink>
        </Button>
      </Stack>
      <Stack>
        <Button tone="warn" onClick={() => show({ text: '已打开诊断', tone: 'warn' })}>
          检测图异常 3
        </Button>
        <Button tone="warn" variant="filled">
          强制复位
        </Button>
        <Button tone="warn" variant="outlined">
          忽略本件
        </Button>
        <Button tone="warn" variant="text">
          查看原因
        </Button>
        <Button tone="warn" variant="outlined" disabled>
          已忽略
        </Button>
      </Stack>
    </>
  );
}

export function CardRegionExamples() {
  const { show } = useSnackbar();
  const [armed, setArmed] = useState(false);
  const [refreshed, setRefreshed] = useState('12:04:31');
  return (
    <Grid minWidth={280} gap={12}>
      <Card
        as="section"
        level="mid"
        title="相机列表 3 / 8"
        actions={
          <IconButton
            size="xs"
            aria-label="刷新相机列表"
            onClick={() => setRefreshed(new Date().toLocaleTimeString('zh-CN', { hour12: false }))}
          >
            <RefreshIcon />
          </IconButton>
        }
      >
        <Stack direction="column" align="flex-start" gap={10}>
          <Stack gap={8}>
            <StatusBadge tone="ok">2 台在线</StatusBadge>
            <StatusBadge tone="neutral">1 台未绑定</StatusBadge>
          </Stack>
          <Text variant="label" muted>
            最近刷新 <span className="qs-num">{refreshed}</span>
          </Text>
        </Stack>
      </Card>
      <Card
        as="section"
        level="mid"
        headingLevel={3}
        title="相机 2 · 触发接线"
        description="保存后由设备确认，未接受的参数会列在下方。"
        actions={
          <>
            <StatusBadge tone={armed ? 'ok' : 'neutral'}>{armed ? '已布防' : '未布防'}</StatusBadge>
            <IconButton size="xs" aria-label="刷新接线状态" onClick={() => setArmed(!armed)}>
              <RefreshIcon />
            </IconButton>
            <IconButton size="xs" aria-label="更多接线操作" onClick={() => show('已打开更多操作')}>
              <MoreIcon />
            </IconButton>
          </>
        }
      >
        <Stack gap={8}>
          <Chip size="sm" label="线路">
            Line 1
          </Chip>
          <Chip size="sm" label="边沿">
            上升沿
          </Chip>
          <Chip size="sm" label="延时">
            120 μs
          </Chip>
        </Stack>
      </Card>
    </Grid>
  );
}

export function ChipKeyValueExamples() {
  return (
    <>
      <Stack gap={8}>
        <Chip label="轮次">R-0012</Chip>
        <Chip label="数量核对">24 / 24</Chip>
        <Chip label="PLC 实际触发">24 次</Chip>
        <Chip label="图像规格" tone="warn" title="多数为 2448 × 2048">
          尺寸不一致
        </Chip>
        <Chip title="型号由 PLC 下发的产品代码匹配">A-01 · v3</Chip>
      </Stack>
      <Stack gap={8}>
        {(
          [
            ['neutral', '空闲'],
            ['neutral', '未开始'],
            ['info', '运行中'],
            ['ok', '已就绪'],
            ['warn', '待复核'],
            ['fault', '设备故障'],
          ] as const
        ).map(([tone, text]) => (
          <StatusBadge key={text} tone={tone}>
            {text}
          </StatusBadge>
        ))}
      </Stack>
    </>
  );
}
