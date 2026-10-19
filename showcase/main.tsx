import { StrictMode, Suspense, lazy, useRef, useState, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import {
  ThemeProvider,
  SnackbarProvider,
  useTheme,
  useSnackbar,
  Text,
  Heading,
  Icon,
  Stack,
  Grid,
  Surface,
  Card,
  Divider,
  Button,
  IconButton,
  TextField,
  TextArea,
  NumberField,
  FormField,
  Select,
  Checkbox,
  RadioGroup,
  Switch,
  SegmentedControl,
  Chip,
  Badge,
  StatusBadge,
  Tabs,
  List,
  ListItem,
  Tooltip,
  Menu,
  Dialog,
  Drawer,
  Alert,
  Snackbar,
  Progress,
  EmptyState,
  type Theme,
} from '../src';
import '../css/react.css';
import './showcase.css';
import { extendedSections, industrialSections } from './sections';
const ExtendedExamples = lazy(() =>
  import('./extended').then((module) => ({ default: module.ExtendedExamples })),
);
const IndustrialExamples = lazy(() =>
  import('./industrial').then((module) => ({ default: module.IndustrialExamples })),
);

function Glyph({ name = 'grid', size = 18 }: { name?: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    search: (
      <>
        <circle cx="10" cy="10" r="6" />
        <path d="m15 15 5 5" />
      </>
    ),
    sliders: (
      <>
        <path d="M4 7h16M4 17h16" />
        <circle cx="8" cy="7" r="2" />
        <circle cx="16" cy="17" r="2" />
      </>
    ),
    layers: (
      <>
        <path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5" />
      </>
    ),
    bell: (
      <>
        <path d="M5 17h14l-2-3V9a5 5 0 0 0-10 0v5l-2 3ZM10 21h4" />
      </>
    ),
    code: <path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-14-2 16" />,
    box: (
      <>
        <rect x="4" y="6" width="16" height="14" rx="3" />
        <path d="M3 6h18M9 11h6" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    moon: <path d="M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z" />,
    dots: (
      <>
        <circle cx="5" cy="12" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
      </>
    ),
  };
  return <Icon size={size}>{paths[name] ?? paths.grid}</Icon>;
}
const sections = [
  {
    id: 'foundation',
    name: '基础与布局',
    icon: 'layers',
    tags: 'ThemeProvider Text Heading Icon Stack Grid Surface Card Divider',
  },
  {
    id: 'actions',
    name: '按钮与操作',
    icon: 'grid',
    tags: 'Button IconButton Chip Badge StatusBadge',
  },
  {
    id: 'forms',
    name: '输入与表单',
    icon: 'sliders',
    tags: 'TextField TextArea NumberField FormField Select',
  },
  {
    id: 'selection',
    name: '选择控件',
    icon: 'check',
    tags: 'Checkbox RadioGroup Switch SegmentedControl',
  },
  { id: 'navigation', name: '导航与列表', icon: 'layers', tags: 'Tabs List ListItem' },
  { id: 'overlays', name: '浮层与对话框', icon: 'box', tags: 'Tooltip Menu Dialog Drawer' },
  { id: 'feedback', name: '反馈与状态', icon: 'bell', tags: 'Alert Snackbar Progress EmptyState' },
  ...extendedSections,
  ...industrialSections,
];
function DemoCard({
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
function ParameterDialogDemo() {
  const { show } = useSnackbar();
  const [open, setOpen] = useState(false);
  return (
    <Dialog
      trigger={<Button variant="text">参数编辑</Button>}
      open={open}
      onOpenChange={setOpen}
      size="lg"
      initialFocus="first-field"
      title="编辑拍照点参数"
      description="size=lg 为 720 px；打开后焦点落在第一个可编辑输入。"
      footer={
        <>
          <Button variant="text" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button
            variant="filled"
            onClick={() => {
              setOpen(false);
              show({ text: '拍照点参数已保存', tone: 'ok' });
            }}
          >
            保存
          </Button>
        </>
      }
    >
      <Grid minWidth={180} gap={16}>
        <TextField label="拍照点编号" defaultValue="SHOT-03" readOnly />
        <NumberField label="曝光时长" defaultValue={1200} unit="μs" min={100} max={5000} />
        <NumberField label="增益" defaultValue={2.5} precision={1} unit="dB" min={0} max={24} />
      </Grid>
    </Dialog>
  );
}
const stackMessages = [
  { text: '相机 2 曝光已更新', tone: 'info' },
  { text: '拍照点 SHOT-03 已保存', tone: 'ok' },
  { text: '离线工况已切换为慢速节拍', tone: 'info' },
  { text: '标定结果超过 7 天，建议复核', tone: 'warn' },
] as const;
function SnackbarStackButtons() {
  const { show, clear } = useSnackbar();
  const [next, setNext] = useState(0);
  return (
    <Stack gap={8} style={{ position: 'absolute', left: 16, bottom: 16 }}>
      <Button
        size="sm"
        onClick={() => {
          show(stackMessages[next % stackMessages.length]);
          setNext(next + 1);
        }}
      >
        追加提示
      </Button>
      <Button size="sm" variant="text" onClick={clear}>
        全部清除
      </Button>
    </Stack>
  );
}
function SnackbarStackDemo() {
  const stage = useRef<HTMLDivElement>(null);
  return (
    <SnackbarProvider placement="top" max={3} container={stage}>
      <div
        ref={stage}
        style={{
          position: 'relative',
          height: 220,
          overflow: 'hidden',
          borderRadius: 'var(--r-md)',
          background: 'var(--surface-lowest)',
        }}
      >
        <SnackbarStackButtons />
      </div>
    </SnackbarProvider>
  );
}
function App() {
  const { theme, setTheme } = useTheme();
  const { show, clear } = useSnackbar();
  const [search, setSearch] = useState('');
  const [active, setActive] = useState('foundation');
  const [segment, setSegment] = useState('auto');
  const [running, setRunning] = useState(true);
  const [checked, setChecked] = useState(false);
  const [amount, setAmount] = useState<number | ''>(2.5);
  const [name, setName] = useState('标准检测方案');
  const [attempted, setAttempted] = useState(false);
  const [chip, setChip] = useState(true);
  const [filter, setFilter] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [alert, setAlert] = useState(true);
  const [progress, setProgress] = useState(64);
  const [selected, setSelected] = useState('one');
  const [saved, setSaved] = useState(false);
  const [inlineSnack, setInlineSnack] = useState(true);
  const filtered = sections.filter((s) =>
    `${s.name} ${s.tags}`.toLowerCase().includes(search.toLowerCase()),
  );
  const visible = (id: string) => filtered.some((s) => s.id === id);
  function save() {
    setAttempted(true);
    if (!name.trim()) return;
    setSaved(true);
    show({ text: '配置已保存', action: { label: '撤销', onClick: () => setSaved(false) } });
  }
  const group = (id: string, children: ReactNode) => {
    const section = sections.find((s) => s.id === id)!;
    return (
      visible(id) && (
        <section id={id} className="showcase-section">
          <div className="section-heading">
            <div>
              <span className="section-index">
                {String(sections.indexOf(section) + 1).padStart(2, '0')}
              </span>
              <Heading>{section.name}</Heading>
            </div>
            <Text variant="label" muted>
              {section.tags.split(' ').length} COMPONENTS
            </Text>
          </div>
          <div className="demo-grid">{children}</div>
        </section>
      )
    );
  };
  return (
    <div className="showcase-shell">
      <aside className="sidebar">
        <a className="brand" href="#">
          <span className="brand-mark">青</span>
          <span>
            <b>QING / STEEL</b>
            <small>REACT COMPONENTS</small>
          </span>
        </a>
        <div className="sidebar-label">
          组件目录 <span>01 / 02 / IND</span>
        </div>
        <nav aria-label="组件分类">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              onClick={() => {
                setActive(section.id);
                setSearch('');
              }}
              aria-current={active === section.id ? 'location' : undefined}
            >
              <Glyph name={section.icon} />
              <span>{section.name}</span>
              <small>{section.tags.split(' ').length.toString().padStart(2, '0')}</small>
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="live-dot" />
            通用组件 + 工业扩展
          </div>
          <Text variant="label" muted>
            圆润的外壳，精确的内核。
          </Text>
          <Divider />
          <a href="../demo/index.html" className="legacy-link">
            查看原始风格演示 <Glyph name="arrow" size={14} />
          </a>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumbs">
            设计系统 <span>/</span> <b>组件实验室</b>
          </div>
          <Stack gap={12}>
            <span className="react-label">
              <span className="live-dot" /> React + TypeScript
            </span>
            <Select
              aria-label="主题"
              value={theme}
              onValueChange={(value) => setTheme(value as Theme)}
              options={[
                { value: 'dark', label: '深色主题' },
                { value: 'light', label: '浅色主题' },
                { value: 'system', label: '跟随系统' },
              ]}
            />
          </Stack>
        </header>
        <main>
          <div className="hero">
            <div className="hero-copy">
              <div className="eyebrow">QING STEEL / COMPONENT LIBRARY</div>
              <h1>
                让精密，<span>触手可及。</span>
              </h1>
              <p>
                为长时间专注而设计。以青钢的色调、形状与节奏，
                <br className="desktop-break" />
                构建清晰、一致、可靠的 React 界面。
              </p>
              <Stack gap={8}>
                <Chip>Material 3 灵感</Chip>
                <Chip>深浅主题</Chip>
                <Chip>键盘可操作</Chip>
              </Stack>
            </div>
            <div className="hero-specimen">
              <div className="specimen-head">
                <Glyph name="layers" />
                <span>DESIGN DNA</span>
                <span className="specimen-index">QS—01</span>
              </div>
              <div className="specimen-number">
                0.01<span>mm</span>
              </div>
              <div className="specimen-rule" />
              <div className="swatches">
                {['primary', 'secondary-container', 'surface-highest', 'ok', 'warn'].map(
                  (color) => (
                    <span key={color} style={{ background: `var(--${color})` }} />
                  ),
                )}
              </div>
              <div className="specimen-foot">
                <span>柔和表面 · 精确读数</span>
                <span>36 / 44 / 16</span>
              </div>
            </div>
          </div>
          <div className="catalog-toolbar">
            <Stack gap={10}>
              <Heading level={2}>组件总览</Heading>
              <span className="version-pill">FOUNDATIONS</span>
            </Stack>
            <div className="catalog-search">
              <TextField
                aria-label="搜索组件"
                placeholder="搜索组件名称，如 Button…"
                leading={<Glyph name="search" />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                trailing={
                  search && (
                    <IconButton size="sm" aria-label="清空搜索" onClick={() => setSearch('')}>
                      ×
                    </IconButton>
                  )
                }
              />
            </div>
          </div>
          {filtered.length === 0 && (
            <EmptyState
              icon={<Glyph name="search" size={28} />}
              title="没有匹配的组件"
              description="试试中文分类名或英文组件名。"
              action={<Button onClick={() => setSearch('')}>清空搜索</Button>}
            />
          )}
          {group(
            'foundation',
            <>
              <DemoCard title="文字与读数" name="Text · Heading · Icon">
                <Stack direction="column" align="flex-start" gap={12}>
                  <Text variant="label" muted>
                    清晰的层级，让注意力回到内容
                  </Text>
                  <Heading>每一位，都准确。</Heading>
                  <Stack align="baseline">
                    <Text variant="data-lg">128.036</Text>
                    <Text variant="label" muted>
                      mm / 测量读数
                    </Text>
                  </Stack>
                  <Stack gap={12}>
                    {['grid', 'sliders', 'layers', 'bell', 'box', 'check'].map((icon) => (
                      <Glyph key={icon} name={icon} />
                    ))}
                  </Stack>
                </Stack>
              </DemoCard>
              <DemoCard
                title="表面与布局"
                name="Surface · Card · Stack · Grid · Divider"
                description="用明度区分层级，保持紧凑的 16 px 间距。"
              >
                <Grid minWidth={90} gap={8}>
                  {(['low', 'mid', 'high'] as const).map((level, index) => (
                    <Surface level={level} className="surface-sample" key={level}>
                      <Text variant="data">0{index + 1}</Text>
                      <Divider />
                      <Text variant="label" muted>
                        {level}
                      </Text>
                    </Surface>
                  ))}
                </Grid>
                <Stack gap={6} className="theme-note">
                  <Glyph name="moon" size={14} />
                  <Text variant="label" muted>
                    通过右上角切换 ThemeProvider 主题
                  </Text>
                </Stack>
              </DemoCard>
            </>,
          )}
          {group(
            'actions',
            <>
              <DemoCard
                title="按钮"
                name="Button"
                description="Tonal 为默认操作；Filled 用于当前最重要的动作。"
              >
                <Stack>
                  <Button
                    variant="filled"
                    leadingIcon={<Glyph name="plus" />}
                    onClick={() => show('已新建项目')}
                  >
                    新建项目
                  </Button>
                  <Button onClick={save}>保存配置</Button>
                  <Button
                    variant="outlined"
                    onClick={() => show({ text: '示例报告已生成', tone: 'info' })}
                  >
                    生成报告
                  </Button>
                  <Button variant="text" onClick={() => show('已查看全部项目')}>
                    查看全部
                  </Button>
                </Stack>
                <Stack>
                  <Button danger variant="filled" onClick={() => setDialog(true)}>
                    删除项目
                  </Button>
                  <Button size="sm" onClick={() => show('小尺寸按钮已触发')}>
                    小尺寸
                  </Button>
                  <Button disabled>不可操作</Button>
                  <Button loading>处理中</Button>
                </Stack>
              </DemoCard>
              <DemoCard title="图标操作与徽标" name="IconButton · Badge · StatusBadge">
                <Stack>
                  <Tooltip content="添加项目">
                    <IconButton aria-label="添加项目" onClick={() => show('已添加项目')}>
                      <Glyph name="plus" />
                    </IconButton>
                  </Tooltip>
                  <IconButton
                    aria-label="订阅通知"
                    selected={checked}
                    onClick={() => setChecked(!checked)}
                  >
                    <Glyph name="bell" />
                  </IconButton>
                  <Badge count={8} />
                  <Badge count={128} />
                  <Badge />
                </Stack>
                <Stack>
                  {(['ok', 'ng', 'warn', 'fault', 'off'] as const).map((tone, i) => (
                    <StatusBadge key={tone} tone={tone}>
                      {['正常', '不合格', '待检查', '设备故障', '离线'][i]}
                    </StatusBadge>
                  ))}
                </Stack>
              </DemoCard>
              <DemoCard title="操作与筛选标签" name="Chip" wide>
                <Stack>
                  <Chip onClick={() => show('已应用推荐参数')}>应用推荐参数</Chip>
                  <Chip selected={filter} onClick={() => setFilter(!filter)}>
                    仅显示异常
                  </Chip>
                  {chip ? (
                    <Chip onRemove={() => setChip(false)} removeLabel="移除标签 A">
                      标签 A
                    </Chip>
                  ) : (
                    <Button size="sm" variant="text" onClick={() => setChip(true)}>
                      恢复标签
                    </Button>
                  )}
                  <Chip>只读标签</Chip>
                  <Chip disabled selected={false} onClick={() => {}}>
                    禁用筛选
                  </Chip>
                </Stack>
              </DemoCard>
            </>,
          )}
          {group(
            'forms',
            <>
              <DemoCard title="文本输入" name="TextField · FormField">
                <TextField
                  label="方案名称"
                  value={name}
                  required
                  onChange={(e) => setName(e.target.value)}
                  error={attempted && !name.trim() ? '请输入方案名称' : undefined}
                  description="使用易于识别的名称。"
                />
                <FormField label="搜索项目" description="标签与说明会自动关联到输入框。">
                  <TextField placeholder="名称或编号" leading={<Glyph name="search" />} />
                </FormField>
                <Grid minWidth={130}>
                  <TextField label="只读编号" value="QS-2026-001" readOnly />
                  <TextField label="锁定参数" value="不可修改" disabled />
                </Grid>
              </DemoCard>
              <DemoCard title="数值与选择" name="NumberField · Select">
                <NumberField
                  label="测量阈值"
                  unit="mm"
                  min={0}
                  max={10}
                  step={0.1}
                  precision={2}
                  value={amount}
                  onValueChange={setAmount}
                  description="范围 0–10 mm，离开输入框时校正范围与精度。"
                />
                <Select
                  label="运行环境"
                  defaultValue=""
                  placeholder="选择运行环境"
                  options={[
                    {
                      label: '在线环境',
                      options: [
                        { value: 'production', label: '生产环境' },
                        { value: 'debug', label: '调试环境' },
                      ],
                    },
                    {
                      label: '离线环境',
                      options: [
                        { value: 'local', label: '本地回放' },
                        { value: 'archive', label: '归档环境（不可用）', disabled: true },
                      ],
                    },
                  ]}
                />
                <TextField label="错误状态" defaultValue="abc" error="请输入有效的数值格式" />
              </DemoCard>
              <DemoCard title="多行文本" name="TextArea" wide>
                <TextArea
                  label="方案说明"
                  placeholder="记录操作说明、参数用途或交接备注…"
                  defaultValue="适用于日常精密检测。参数变更前，请先验证样本。"
                  description="支持原生表单提交与只读、禁用、错误状态。"
                />
                <Stack justify="space-between">
                  <Text variant="label" muted>
                    {saved ? '当前配置已保存' : '配置尚未保存'}
                  </Text>
                  <Button variant="filled" onClick={save}>
                    保存配置
                  </Button>
                </Stack>
              </DemoCard>
            </>,
          )}
          {group(
            'selection',
            <>
              <DemoCard title="复选与单选" name="Checkbox · RadioGroup">
                <Stack>
                  <Checkbox label="保存检测记录" defaultChecked />
                  <Checkbox label="部分选中" indeterminate />
                  <Checkbox label="不可选" disabled />
                </Stack>
                <Divider />
                <RadioGroup
                  label="检测模式"
                  defaultValue="standard"
                  options={[
                    { value: 'standard', label: '标准' },
                    { value: 'strict', label: '严格' },
                    { value: 'custom', label: '自定义', disabled: true },
                  ]}
                />
              </DemoCard>
              <DemoCard title="开关与分段" name="Switch · SegmentedControl">
                <Stack justify="space-between">
                  <Switch label="自动运行" checked={running} onCheckedChange={setRunning} />
                  <Text variant="label" muted>
                    {running ? '已开启' : '已关闭'}
                  </Text>
                  <Switch label="锁定" disabled />
                </Stack>
                <SegmentedControl
                  label="运行方式"
                  value={segment}
                  onValueChange={setSegment}
                  options={[
                    { value: 'auto', label: '自动' },
                    { value: 'manual', label: '手动' },
                    { value: 'offline', label: '离线' },
                  ]}
                />
                <SegmentedControl
                  multiple
                  label="显示内容"
                  defaultValue={['image']}
                  size="sm"
                  options={[
                    { value: 'image', label: '图像' },
                    { value: 'data', label: '数据' },
                    { value: 'log', label: '日志' },
                  ]}
                />
              </DemoCard>
            </>,
          )}
          {group(
            'navigation',
            <>
              <DemoCard title="标签页" name="Tabs">
                <Tabs
                  label="项目详情"
                  items={[
                    {
                      value: 'overview',
                      label: '概览',
                      icon: <Glyph name="grid" size={16} />,
                      content: (
                        <Stack direction="column" align="flex-start">
                          <StatusBadge tone="ok">系统就绪</StatusBadge>
                          <Text muted>集中呈现关键状态与常用操作。</Text>
                          <Text variant="data">UPTIME 128:36:09</Text>
                        </Stack>
                      ),
                    },
                    {
                      value: 'parameters',
                      label: '参数',
                      content: (
                        <NumberField
                          label="曝光时长"
                          defaultValue={1200}
                          unit="μs"
                          min={100}
                          max={5000}
                        />
                      ),
                    },
                    { value: 'history', label: '历史记录', disabled: true, content: null },
                  ]}
                />
              </DemoCard>
              <DemoCard title="列表" name="List · ListItem">
                <List>
                  {[
                    { id: 'one', title: '标准检测方案', desc: '最近更新 · 今天 10:24' },
                    { id: 'two', title: '精密测量方案', desc: '最近更新 · 昨天 16:08' },
                  ].map((item) => (
                    <ListItem
                      key={item.id}
                      title={item.title}
                      description={item.desc}
                      leading={<Glyph name="box" />}
                      selected={selected === item.id}
                      onClick={() => setSelected(item.id)}
                      trailing={<StatusBadge tone="ok">可用</StatusBadge>}
                    />
                  ))}
                  <ListItem
                    title="归档方案"
                    description="仅供查阅"
                    leading={<Glyph name="layers" />}
                    trailing={<Badge count={3} />}
                  />
                </List>
              </DemoCard>
            </>,
          )}
          {group(
            'overlays',
            <>
              <DemoCard
                title="轻量浮层"
                name="Tooltip · Menu"
                description="支持键盘聚焦、方向键导航与 Escape 关闭；问号提示可点击固定，再次点击、外部点击或 Escape 收起。"
              >
                <Stack>
                  <Tooltip content="保存当前方案，保留已有参数。">
                    <Button variant="outlined">悬停或聚焦查看</Button>
                  </Tooltip>
                  <Tooltip
                    pinnable
                    side="bottom"
                    content="曝光时长决定单帧进光量：过短胶线发暗，过长出现运动拖影。"
                  >
                    <IconButton aria-label="曝光时长说明">
                      <Icon>
                        <circle cx="12" cy="12" r="9" />
                        <path d="M9.6 9.4a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.7M12 17v.01" />
                      </Icon>
                    </IconButton>
                  </Tooltip>
                  <Menu
                    trigger={<Button trailingIcon={<Glyph name="dots" />}>更多操作</Button>}
                    items={[
                      { type: 'label', id: 'label', label: '项目操作' },
                      {
                        id: 'copy',
                        label: '创建副本',
                        icon: (
                          <Icon size={16}>
                            <rect x="8" y="8" width="12" height="12" rx="2" />
                            <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
                          </Icon>
                        ),
                        shortcut: 'Ctrl+D',
                        onSelect: () => show('已创建项目副本'),
                      },
                      {
                        id: 'export',
                        label: '导出配置',
                        icon: (
                          <Icon size={16}>
                            <path d="M12 4v11m-4-4 4 4 4-4M5 20h14" />
                          </Icon>
                        ),
                        disabled: true,
                      },
                      { type: 'separator', id: 'divider' },
                      {
                        id: 'delete',
                        label: '删除项目',
                        icon: (
                          <Icon size={16}>
                            <path d="M4 7h16M10 11v6m4-6v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
                          </Icon>
                        ),
                        danger: true,
                        onSelect: () => setDialog(true),
                      },
                    ]}
                  />
                </Stack>
              </DemoCard>
              <DemoCard
                title="模态容器"
                name="Dialog · Drawer"
                description="焦点限制在浮层内，关闭后返回触发按钮。"
              >
                <Stack>
                  <Dialog
                    trigger={<Button onClick={() => setDialog(true)}>打开对话框</Button>}
                    open={dialog}
                    onOpenChange={setDialog}
                    title="删除示例项目？"
                    description="这是组件交互演示，确认后会显示一条操作反馈。"
                    footer={
                      <>
                        <Button variant="text" onClick={() => setDialog(false)}>
                          取消
                        </Button>
                        <Button
                          danger
                          variant="filled"
                          onClick={() => {
                            setDialog(false);
                            show('示例项目已删除');
                          }}
                        >
                          确认删除
                        </Button>
                      </>
                    }
                  >
                    <Alert tone="warn">删除操作应明确说明影响，并提供取消入口。</Alert>
                  </Dialog>
                  <Drawer
                    trigger={<Button variant="outlined">打开设置抽屉</Button>}
                    open={drawer}
                    onOpenChange={setDrawer}
                    title="显示设置"
                    description="调整当前工作区的显示偏好。"
                    footer={
                      <Button
                        variant="filled"
                        onClick={() => {
                          setDrawer(false);
                          show('显示设置已保存');
                        }}
                      >
                        完成
                      </Button>
                    }
                  >
                    <Stack direction="column" align="stretch" gap={20}>
                      <Select
                        label="主题外观"
                        value={theme}
                        onValueChange={(value) => setTheme(value as Theme)}
                        options={[
                          { value: 'dark', label: '深色' },
                          { value: 'light', label: '浅色' },
                          { value: 'system', label: '跟随系统' },
                        ]}
                      />
                      <Switch label="自动运行" checked={running} onCheckedChange={setRunning} />
                      <Text muted>抽屉与页面共享主题变量，适合参数编辑和详情查看。</Text>
                    </Stack>
                  </Drawer>
                  <ParameterDialogDemo />
                </Stack>
              </DemoCard>
            </>,
          )}
          {group(
            'feedback',
            <>
              <DemoCard title="持续提示" name="Alert">
                {alert ? (
                  <Alert tone="info" title="新的配置可用" onClose={() => setAlert(false)}>
                    保存后将在下一次运行中生效。
                  </Alert>
                ) : (
                  <Button variant="text" onClick={() => setAlert(true)}>
                    恢复信息提示
                  </Button>
                )}
                <Alert tone="warn">部分参数接近上限，请确认测量范围。</Alert>
                <Alert
                  tone="fault"
                  title="设备未连接"
                  action={
                    <Button size="sm" variant="text" onClick={() => show('正在重新连接示例设备')}>
                      重新连接
                    </Button>
                  }
                >
                  检查设备连接后重试。
                </Alert>
                <Alert tone="tertiary" title="候选配方调试">
                  未发布，仅用于离线测试，不作为生产验收。
                </Alert>
              </DemoCard>
              <DemoCard
                title="瞬时反馈"
                name="Snackbar"
                description="新提示替换旧提示；鼠标悬停或键盘聚焦时暂停自动关闭。"
              >
                {inlineSnack && (
                  <Snackbar
                    duration={0}
                    onDismiss={() => setInlineSnack(false)}
                    action={{ label: '撤销', onClick: () => show('已撤销示例操作') }}
                  >
                    配置已保存
                  </Snackbar>
                )}
                <Stack>
                  <Button
                    onClick={() =>
                      show({
                        text: '配置已保存，可继续下一步操作。',
                        tone: 'ok',
                        action: { label: '撤销', onClick: () => setSaved(false) },
                      })
                    }
                  >
                    触发成功提示
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => show({ text: '当前处于离线模式', tone: 'info' })}
                  >
                    触发信息提示
                  </Button>
                  <Button variant="text" onClick={clear}>
                    清除提示
                  </Button>
                </Stack>
              </DemoCard>
              <DemoCard
                title="堆叠与容器"
                name="SnackbarProvider"
                description="placement=top、max=3，提示挂在宿主容器内；超出上限时最早的一条离开。"
              >
                <SnackbarStackDemo />
              </DemoCard>
              <DemoCard title="进度" name="Progress">
                <Stack justify="space-between">
                  <Text>样本处理进度</Text>
                  <Text variant="data">{progress}%</Text>
                </Stack>
                <Progress value={progress} label="样本处理进度" />
                <Stack>
                  <Progress variant="circular" value={progress} label="环形处理进度" />
                  <Progress variant="circular" label="等待处理结果" />
                  <Text variant="label" muted>
                    确定 / 不确定进度
                  </Text>
                </Stack>
                <Progress label="等待任务" />
                <Stack>
                  <Button
                    size="sm"
                    onClick={() => setProgress((p) => Math.min(100, p + 12))}
                    disabled={progress === 100}
                  >
                    推进进度
                  </Button>
                  <Button size="sm" variant="text" onClick={() => setProgress(0)}>
                    重置
                  </Button>
                </Stack>
              </DemoCard>
              <DemoCard title="空状态" name="EmptyState">
                <EmptyState
                  icon={<Glyph name="box" size={28} />}
                  title="还没有检测记录"
                  description="完成首次检测后，结果会显示在这里。"
                  action={
                    <Button
                      size="sm"
                      leadingIcon={<Glyph name="plus" size={16} />}
                      onClick={() => show('已创建示例检测任务')}
                    >
                      创建检测任务
                    </Button>
                  }
                />
              </DemoCard>
            </>,
          )}
          {extendedSections.map((section) => (
            <div key={section.id}>
              {group(
                section.id,
                <Suspense fallback={<p role="status">正在加载组件…</p>}>
                  <ExtendedExamples id={section.id} />
                </Suspense>,
              )}
            </div>
          ))}
          {industrialSections.map((section) => (
            <div key={section.id}>
              {group(
                section.id,
                <Suspense fallback={<p role="status">正在加载组件…</p>}>
                  <IndustrialExamples id={section.id} />
                </Suspense>,
              )}
            </div>
          ))}
          <footer className="page-footer">
            <a href="./performance.html">性能场景 ↗</a>
            <span>
              QING / STEEL <span className="footer-dot">·</span> 精确，也可以温和。
            </span>
            <a href="#" onClick={() => setSearch('')}>
              回到顶部 ↑
            </a>
          </footer>
        </main>
      </div>
    </div>
  );
}
const root: Root = import.meta.hot?.data.root ?? createRoot(document.getElementById('root')!);
if (import.meta.hot) import.meta.hot.data.root = root;
root.render(
  <StrictMode>
    <ThemeProvider>
      <SnackbarProvider>
        <App />
      </SnackbarProvider>
    </ThemeProvider>
  </StrictMode>,
);
