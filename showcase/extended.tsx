import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Accordion,
  AppBar,
  Autocomplete,
  Breadcrumbs,
  Button,
  Card,
  Checkbox,
  DatePicker,
  EmptyState,
  FAB,
  Grid,
  Icon,
  IconButton,
  NavigationDrawer,
  NavigationRail,
  Pagination,
  Popover,
  Select,
  Skeleton,
  Slider,
  Stack,
  StatusBadge,
  Switch,
  Table,
  Text,
  TextField,
  TimePicker,
  Toolbar,
  useSnackbar,
  type TableColumn,
  type TableSort,
  type SelectOption,
  type NavigationItem,
  type NavigationLinkProps,
} from '../src';

function Mark({ type = 'grid' }: { type?: 'grid' | 'plus' | 'file' | 'settings' | 'back' }) {
  return (
    <Icon>
      {type === 'plus' ? (
        <path d="M12 5v14M5 12h14" />
      ) : type === 'file' ? (
        <>
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <path d="M8 8h8M8 12h8M8 16h5" />
        </>
      ) : type === 'settings' ? (
        <>
          <path d="M4 7h16M4 17h16" />
          <circle cx="8" cy="7" r="2" />
          <circle cx="16" cy="17" r="2" />
        </>
      ) : type === 'back' ? (
        <path d="m14 6-6 6 6 6" />
      ) : (
        <>
          <rect x="3" y="3" width="7" height="7" rx="2" />
          <rect x="14" y="3" width="7" height="7" rx="2" />
          <rect x="3" y="14" width="7" height="7" rx="2" />
          <rect x="14" y="14" width="7" height="7" rx="2" />
        </>
      )}
    </Icon>
  );
}
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
const devices: SelectOption[] = [
  { value: 'camera-a', label: 'A 线 · 顶部相机' },
  { value: 'camera-b', label: 'B 线 · 侧面相机' },
  { value: 'camera-c', label: 'C 线 · 轮廓相机' },
  { value: 'offline', label: '备用相机（不可用）', disabled: true },
];
function RemoteSearch() {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState('');
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setOptions(
        devices.filter((device) => device.label.toLowerCase().includes(query.toLowerCase())),
      );
      setLoading(false);
    }, 450);
    return () => clearTimeout(timer);
  }, [query]);
  return (
    <>
      <Autocomplete
        label="异步设备搜索"
        options={options}
        filterOptions={false}
        loading={loading}
        onInputValueChange={setQuery}
        value={selected}
        onValueChange={setSelected}
        placeholder="输入 A、B 或相机"
        description="输入后加载建议；试试没有匹配结果的关键词。"
      />
      <Text variant="label" muted>
        已选设备：{selected || '尚未选择'}
      </Text>
    </>
  );
}
function AdvancedInputs() {
  const { show } = useSnackbar();
  const [date, setDate] = useState('2026-10-19');
  const [time, setTime] = useState('09:30');
  return (
    <>
      <Example
        title="连续数值与范围"
        name="Slider"
        description="方向键调整一个步长，Home / End 跳转边界；范围端点保持有序。"
      >
        <Slider
          label="补光强度"
          defaultValue={40}
          step={1}
          formatValue={(value) => `${value}%`}
          marks={[{ value: 0 }, { value: 50 }, { value: 100 }]}
        />
        <Slider
          range
          label="合格区间"
          defaultValue={[20, 75]}
          formatValue={(value) => `${value} μm`}
          marks={[{ value: 0 }, { value: 50 }, { value: 100 }]}
        />
        <Slider label="锁定增益" defaultValue={30} disabled />
      </Example>
      <Example
        title="输入筛选与建议"
        name="Autocomplete"
        description="输入筛选，方向键选择，Enter 确认，Escape 取消。"
      >
        <Autocomplete
          label="选择设备"
          options={devices}
          placeholder="搜索设备名称"
          description="仅允许选择建议列表中的设备。"
        />
        <RemoteSearch />
      </Example>
      <Example
        title="日期与时间"
        name="DatePicker · TimePicker"
        wide
        description="直接输入或点击图标打开选择面板；Alt + ↓ 打开，Escape 取消。日期支持方向键导航，时间选择后确认，保留范围与步长校验。"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            show(`已安排：${date} ${time}`);
          }}
        >
          <Grid minWidth={200}>
            <DatePicker
              label="计划日期"
              required
              value={date}
              onValueChange={setDate}
              min="2026-10-01"
              max="2026-10-31"
              description="允许日期：2026 年 10 月"
            />
            <TimePicker
              label="开始时间"
              required
              value={time}
              onValueChange={setTime}
              min="08:00"
              max="18:00"
              description="允许时间：08:00–18:00"
            />
            <DatePicker label="归档日期（只读）" defaultValue="2026-10-01" readOnly />
            <TimePicker label="校准时间（禁用）" defaultValue="08:00" disabled />
            <TimePicker
              label="精确采集时间"
              defaultValue="09:30:15"
              step={1}
              description="时／分／秒，1 秒步长。"
            />
            <TimePicker
              label="巡检时间"
              defaultValue="08:00"
              min="08:00"
              max="18:00"
              step={900}
              description="每 15 分钟一次，范围外选项禁用。"
            />
          </Grid>
          <Stack justify="flex-end" style={{ marginTop: 16 }}>
            <Button type="submit">确认计划</Button>
          </Stack>
        </form>
      </Example>
    </>
  );
}
type RecordRow = { id: string; name: string; value: number; status: 'ok' | 'warn' };
const records: RecordRow[] = Array.from({ length: 23 }, (_, i) => ({
  id: `QS-${String(i + 1).padStart(3, '0')}`,
  name: ['顶部轮廓', '侧面边缘', '底部接缝'][i % 3],
  value: Math.round((0.8 + ((i * 7) % 13) * 0.03) * 100) / 100,
  status: i % 5 === 0 ? 'warn' : 'ok',
}));
const columns: TableColumn<RecordRow>[] = [
  { key: 'id', header: '记录编号', accessor: (row) => row.id, sortable: true },
  { key: 'name', header: '测量位置', accessor: (row) => row.name },
  {
    key: 'value',
    header: '测量值 / mm',
    accessor: (row) => row.value,
    render: (row) => row.value.toFixed(2),
    align: 'right',
    sortable: true,
  },
  {
    key: 'status',
    header: '状态',
    accessor: (row) => row.status,
    render: (row) => (
      <StatusBadge tone={row.status}>{row.status === 'ok' ? '正常' : '待复核'}</StatusBadge>
    ),
  },
];
function DataDisplay() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [sort, setSort] = useState<TableSort | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [onlyWarnings, setOnlyWarnings] = useState(false);
  const [loading, setLoading] = useState(false);
  const sorted = useMemo(() => {
    const filtered = records.filter((row) => !onlyWarnings || row.status === 'warn');
    if (!sort) return filtered;
    return [...filtered].sort(
      (a, b) =>
        (sort.key === 'value' ? a.value - b.value : a.id.localeCompare(b.id)) *
        (sort.direction === 'asc' ? 1 : -1),
    );
  }, [onlyWarnings, sort]);
  return (
    <>
      <Example
        title="可排序的数据表"
        name="Table · Pagination"
        wide
        description="点击表头切换升序、降序和默认顺序；全选只作用于当前页，跨页选择会保留。"
      >
        <Stack justify="space-between">
          <Checkbox
            label="仅显示待复核记录"
            checked={onlyWarnings}
            onCheckedChange={(checked) => {
              setOnlyWarnings(checked);
              setPage(1);
            }}
          />
          <Text variant="label" muted>
            已选择 {selected.length} 条记录
          </Text>
        </Stack>
        <Table
          caption="检测记录示例"
          columns={columns}
          rows={sorted.slice((page - 1) * pageSize, page * pageSize)}
          rowKey={(row) => row.id}
          selectable
          selectedKeys={selected}
          onSelectionChange={setSelected}
          sort={sort}
          manualSorting
          onSortChange={(next) => {
            setSort(next);
            setPage(1);
          }}
        />
        <Pagination
          total={sorted.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[5, 10, 20]}
        />
      </Example>
      <Example title="空数据与加载" name="Table">
        <Switch label="显示加载状态" checked={loading} onCheckedChange={setLoading} />
        <Table
          caption="待加载记录"
          columns={columns.slice(0, 2)}
          rows={[]}
          rowKey={(row) => row.id}
          loading={loading}
          emptyState={<EmptyState title="暂无匹配记录" description="请调整筛选条件。" />}
        />
      </Example>
      <Example
        title="内容占位"
        name="Skeleton"
        description="保留内容轮廓，使用静态占位，避免长时间盯屏时的循环闪烁。"
      >
        <div aria-busy="true" aria-label="正在加载卡片" className="skeleton-demo">
          <Stack wrap={false}>
            <Skeleton variant="circular" width={44} height={44} />
            <Stack direction="column" align="stretch" gap={6} style={{ flex: 1 }}>
              <Skeleton width="56%" />
              <Skeleton width="82%" height={10} />
            </Stack>
          </Stack>
          <Skeleton variant="rectangular" height={72} />
          <Grid minWidth={80} gap={12}>
            <Skeleton />
            <Skeleton />
            <Skeleton />
          </Grid>
        </div>
      </Example>
    </>
  );
}
const DemoRoute = createContext<{ path: string; navigate: (path: string) => void }>({
  path: '',
  navigate: () => {},
});
const DemoNavLink = forwardRef<HTMLAnchorElement, NavigationLinkProps>(function DemoNavLink(
  { href, onClick, 'aria-current': _current, ...props },
  ref,
) {
  const { path, navigate } = useContext(DemoRoute);
  return (
    <a
      {...props}
      ref={ref}
      href={href}
      aria-current={path === href ? 'page' : undefined}
      onClick={(event) => {
        onClick(event);
        event.preventDefault();
        navigate(href);
      }}
    />
  );
});
const DemoLink = forwardRef<HTMLAnchorElement, NavigationLinkProps>(function DemoLink(
  { onClick, ...props },
  ref,
) {
  return (
    <a
      {...props}
      ref={ref}
      onClick={(event) => {
        event.preventDefault();
        onClick(event);
      }}
    />
  );
});
const navigationItems: NavigationItem[] = [
  { value: '/overview', href: '/overview', label: '工作概览', icon: <Mark />, group: '工作区' },
  {
    value: '/records',
    href: '/records',
    label: '检测记录',
    icon: <Mark type="file" />,
    badge: 8,
    group: '工作区',
  },
  {
    value: '/recipes',
    href: '/recipes',
    label: '参数设置',
    icon: <Mark type="settings" />,
    group: '管理',
  },
  {
    value: '/access',
    label: '权限管理',
    icon: <Mark type="file" />,
    disabled: true,
    group: '管理',
  },
];
const navigationFooterItems: NavigationItem[] = [
  { value: '/system', href: '/system', label: '系统设置', icon: <Mark type="settings" /> },
];
const navigationLabels: Record<string, string> = {
  '/overview': '工作概览',
  '/records': '检测记录',
  '/recipes': '参数设置',
  '/system': '系统设置',
};
function NavigationBrand({ compact }: { compact?: boolean }) {
  return (
    <span className="navigation-demo-brand">
      <span className="navigation-demo-mark" aria-hidden="true">
        <Mark />
      </span>
      {!compact && <span className="qs-navigation-text">青钢工作区</span>}
    </span>
  );
}
function AppNavigation() {
  const { show } = useSnackbar();
  const [path, navigate] = useState('/overview');
  const [collapsed, setCollapsed] = useState(false);
  const [labels, setLabels] = useState(false);
  const content = useRef<HTMLDivElement>(null);
  const route = useMemo(() => ({ path, navigate }), [path]);
  return (
    <DemoRoute.Provider value={route}>
      <Example
        title="导航栏与导航抽屉"
        name="NavigationRail · NavigationDrawer"
        wide
        description="两者都通过 renderLink 交给宿主链接（示例模拟路由的 Link / NavLink）。左侧紧凑导航由 value 给出选中态并显示小字标签；右侧抽屉不传 value，选中态由链接自身的 aria-current 给出。两者共享当前路径，底部系统设置同样参与选中。"
      >
        <div className="navigation-demo">
          <NavigationRail
            label="紧凑导航示例"
            items={navigationItems}
            footerItems={navigationFooterItems}
            value={path}
            onValueChange={navigate}
            renderLink={(props) => <DemoLink {...props} />}
            collapsedLabels="visible"
            header={<NavigationBrand compact />}
          />
          <NavigationDrawer
            label="展开导航示例"
            items={navigationItems}
            footerItems={navigationFooterItems}
            renderLink={(props) => <DemoNavLink {...props} />}
            collapsed={collapsed}
            onCollapsedChange={setCollapsed}
            collapsedLabels={labels ? 'visible' : 'tooltip'}
            contentRef={content}
            header={<NavigationBrand />}
            footer={
              <StatusBadge tone="ok">
                <span className="qs-navigation-text">设备在线</span>
              </StatusBadge>
            }
          />
          <div className="navigation-demo-content" ref={content}>
            <Text variant="label" muted className="navigation-demo-path">
              {path}
            </Text>
            <Text as="p">{navigationLabels[path]}</Text>
            <Switch label="收起时显示小字标签" checked={labels} onCheckedChange={setLabels} />
            <Text variant="label" muted>
              收起展开时布局宽度只切换一次：文字先淡出，图标与右侧内容随底板平移，再淡入。
            </Text>
            <Skeleton variant="rectangular" height={56} />
          </div>
        </div>
      </Example>
      <Example title="顶栏与操作区" name="AppBar · Toolbar" wide>
        <AppBar
          title="检测工作区"
          subtitle="A 线 / 标准检测方案"
          navigation={
            <IconButton
              aria-label="返回工作概览"
              onClick={() => {
                navigate('/overview');
                show('已返回工作概览');
              }}
            >
              <Mark type="back" />
            </IconButton>
          }
          actions={
            <>
              <StatusBadge tone="ok">在线</StatusBadge>
              <Button size="sm" onClick={() => show('方案已保存')}>
                保存方案
              </Button>
            </>
          }
        />
        <div className="appbar-scroll-demo" tabIndex={0} aria-label="吸顶顶栏示例">
          <AppBar sticky title="检测记录" subtitle="滚动列表，顶栏吸顶后升一级表面并显示分隔线" />
          <ol className="appbar-scroll-demo-list">
            {Array.from({ length: 12 }, (_, index) => (
              <li key={index}>
                <Text variant="data">QS-{String(index + 1).padStart(3, '0')}</Text>
                <Text variant="label" muted>
                  A 线 · 顶部相机
                </Text>
              </li>
            ))}
          </ol>
        </div>
        <Toolbar label="记录工具栏">
          <Button size="sm" leadingIcon={<Mark type="plus" />} onClick={() => show('已创建记录')}>
            新建记录
          </Button>
          <Button size="sm" variant="text" onClick={() => show('已刷新记录')}>
            刷新
          </Button>
          <Button size="sm" variant="text" disabled>
            导出
          </Button>
          <IconButton size="sm" aria-label="记录设置" onClick={() => show('已打开记录设置')}>
            <Mark type="settings" />
          </IconButton>
          <Text variant="label" muted>
            ← → 可切换工具栏操作
          </Text>
        </Toolbar>
      </Example>
      <Example title="路径导航" name="Breadcrumbs">
        <Breadcrumbs
          items={[
            { label: '工作区', onClick: () => show('已返回工作区') },
            { label: '检测记录', onClick: () => navigate('/records') },
            { label: 'QS-001' },
          ]}
        />
        <Text variant="label" muted>
          当前位置保持为文本，前置层级提供返回入口。
        </Text>
      </Example>
      <Example
        title="浮动主操作"
        name="FAB"
        description="包含图标型与带文字型。浮动位置由页面布局决定。"
      >
        <Stack gap={20}>
          <FAB
            icon={<Mark type="plus" />}
            aria-label="新建示例"
            onClick={() => show('已新建示例')}
          />
          <FAB icon={<Mark type="plus" />} label="新建检测" onClick={() => show('已新建检测')} />
          <FAB icon={<Mark type="plus" />} aria-label="不可用操作" size="sm" disabled />
        </Stack>
      </Example>
    </DemoRoute.Provider>
  );
}
function ContentOverlays() {
  const [open, setOpen] = useState(false);
  const [density, setDensity] = useState('comfortable');
  const [units, setUnits] = useState(true);
  const { show } = useSnackbar();
  return (
    <>
      <Example title="单项折叠" name="Accordion">
        <Accordion
          defaultValue="appearance"
          items={[
            {
              value: 'appearance',
              title: '外观与主题',
              content: '共享青钢色彩变量，使用明度区分容器层级。',
            },
            {
              value: 'interaction',
              title: '键盘与交互',
              content: <Text>使用 Enter 展开当前项，方向键在标题间移动。</Text>,
            },
            { value: 'locked', title: '受限设置（不可用）', content: '受限内容', disabled: true },
          ]}
        />
      </Example>
      <Example title="多项展开" name="Accordion">
        <Accordion
          multiple
          defaultValue={['first', 'second']}
          items={[
            {
              value: 'first',
              title: '记录策略',
              content: <Switch label="保存检测结果" defaultChecked />,
            },
            {
              value: 'second',
              title: '通知策略',
              content: <Checkbox label="异常时显示提醒" defaultChecked />,
            },
          ]}
        />
      </Example>
      <Example
        title="锚点浮层"
        name="Popover"
        wide
        description="根据可用空间调整位置，支持外部点击、Escape 关闭与焦点返回。"
      >
        <Stack>
          <Popover
            title="表格显示设置"
            open={open}
            onOpenChange={setOpen}
            trigger={<Button leadingIcon={<Mark type="settings" />}>调整显示</Button>}
          >
            <Stack direction="column" align="stretch" gap={16}>
              <Select
                label="显示密度"
                value={density}
                onValueChange={setDensity}
                options={[
                  { value: 'comfortable', label: '舒适' },
                  { value: 'compact', label: '紧凑' },
                ]}
              />
              <Switch label="显示测量单位" checked={units} onCheckedChange={setUnits} />
              <Button
                onClick={() => {
                  setOpen(false);
                  show('显示偏好已应用');
                }}
              >
                应用显示偏好
              </Button>
            </Stack>
          </Popover>
          <Text variant="label" muted>
            当前：{density === 'comfortable' ? '舒适' : '紧凑'} · {units ? '显示单位' : '隐藏单位'}
          </Text>
        </Stack>
      </Example>
    </>
  );
}
export function ExtendedExamples({ id }: { id: string }) {
  if (id === 'advanced-inputs') return <AdvancedInputs />;
  if (id === 'data-display') return <DataDisplay />;
  if (id === 'app-navigation') return <AppNavigation />;
  return <ContentOverlays />;
}
