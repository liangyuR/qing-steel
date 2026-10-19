import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
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
  NumberField,
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
} from '../src';

function Mark({
  type = 'grid',
}: {
  type?: 'grid' | 'plus' | 'file' | 'settings' | 'back' | 'help';
}) {
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
      ) : type === 'help' ? (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.6 9.4a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.7" />
          <path d="M12 17h.01" />
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
type Verdict = 'ok' | 'warn' | 'ng' | 'fault';
type CycleRow = {
  id: string;
  time: string;
  sn: string;
  verdict: Verdict;
  reason: string;
  frames: string;
};
const verdictText: Record<Verdict, string> = {
  ok: 'OK',
  warn: '局部超差',
  ng: 'NG',
  fault: '故障',
};
const verdictReason: Record<Verdict, string> = {
  ok: '—',
  warn: '胶宽局部超上限 0.12 mm',
  ng: '断胶 3.4 mm',
  fault: '相机 2 少 1 帧',
};
const cycleRows = (offset: number): CycleRow[] =>
  Array.from({ length: 17 }, (_, i) => {
    const n = i + offset;
    const verdict: Verdict =
      n % 11 === 8 ? 'fault' : n % 7 === 3 ? 'ng' : n % 5 === 2 ? 'warn' : 'ok';
    const seconds = 3600 * 9 + 47 * (60 - n);
    const hh = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const mm = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const ss = String(seconds % 60).padStart(2, '0');
    return {
      id: `cycle-${n}`,
      time: `10-19 ${hh}:${mm}:${ss}`,
      sn: `GS2610${String(4200 - n).padStart(5, '0')}`,
      verdict,
      reason: verdictReason[verdict],
      frames: verdict === 'fault' ? '7/8' : '8/8',
    };
  });
const cycleColumns: TableColumn<CycleRow>[] = [
  { key: 'time', header: '时间', accessor: (row) => row.time, nowrap: true },
  { key: 'sn', header: 'SN', accessor: (row) => row.sn, rowHeader: true, nowrap: true },
  {
    key: 'verdict',
    header: '结果',
    render: (row) => <StatusBadge tone={row.verdict}>{verdictText[row.verdict]}</StatusBadge>,
  },
  { key: 'reason', header: '原因', accessor: (row) => row.reason },
  { key: 'frames', header: '帧', accessor: (row) => row.frames, align: 'right', nowrap: true },
];
function CycleHistory() {
  const { show } = useSnackbar();
  const [offset, setOffset] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const rows = useMemo(() => cycleRows(offset), [offset]);
  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => {
      setOffset((value) => value + 3);
      setLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, [loading]);
  const getRowProps = useCallback(
    (row: CycleRow) => ({
      tone: row.verdict === 'ok' ? undefined : row.verdict,
      tabIndex: 0,
      'aria-label': `查看 SN ${row.sn} 的记录`,
      title: row.verdict === 'ok' ? undefined : row.reason,
      onClick: () => show(`打开 ${row.sn} 的检测记录`),
    }),
    [show],
  );
  return (
    <Example
      title="行级属性、语义色与保留结果刷新"
      name="Table · getRowProps · keepRowsWhileLoading"
      wide
      description="整行可点击或用 Tab 聚焦后按 Enter 打开；异常行带语义色条与浅底。刷新时保留上一页结果并标记为更新中，分页隐藏每页条数选择。"
    >
      <Stack direction="column" align="stretch" gap={12} data-shot="table-rows">
        <Stack justify="space-between">
          <Text variant="label" muted>
            最近 {rows.length} 件 · 每页 6 件
          </Text>
          <Button size="sm" variant="tonal" disabled={loading} onClick={() => setLoading(true)}>
            {loading ? '正在刷新…' : '刷新'}
          </Button>
        </Stack>
        <Table
          caption="检测历史示例"
          columns={cycleColumns}
          rows={rows.slice((page - 1) * 6, page * 6)}
          rowKey={(row) => row.id}
          getRowProps={getRowProps}
          loading={loading}
          keepRowsWhileLoading
        />
        <Pagination
          label="检测历史分页"
          total={rows.length}
          page={page}
          pageSize={6}
          showPageSize={false}
          disabled={loading}
          onPageChange={setPage}
        />
      </Stack>
    </Example>
  );
}
type LimitRow = {
  key: 'position' | 'width' | 'continuity';
  name: string;
  enabled: boolean;
  nominal: number | '';
  lower: number | '';
  upper: number | '';
};
function LimitsEditor() {
  const [limits, setLimits] = useState<LimitRow[]>([
    { key: 'position', name: '位置', enabled: true, nominal: 0, lower: 0.5, upper: 0.5 },
    { key: 'width', name: '胶宽', enabled: false, nominal: 2.4, lower: 0.3, upper: 0.4 },
    { key: 'continuity', name: '连续性', enabled: true, nominal: 1.5, lower: 92, upper: '' },
  ]);
  const [active, setActive] = useState<LimitRow['key']>('position');
  const update = useCallback(
    (key: LimitRow['key'], patch: Partial<LimitRow>) =>
      setLimits((rows) => rows.map((row) => (row.key === key ? { ...row, ...patch } : row))),
    [],
  );
  const columns = useMemo<TableColumn<LimitRow>[]>(() => {
    const field = (key: 'nominal' | 'lower' | 'upper', label: string) => (row: LimitRow) => (
      <NumberField
        aria-label={`${row.name} · ${label}`}
        value={row[key]}
        step={0.05}
        precision={2}
        unit="mm"
        onValueChange={(value) => update(row.key, { [key]: value } as Partial<LimitRow>)}
      />
    );
    return [
      {
        key: 'name',
        header: '判定项',
        rowHeader: true,
        nowrap: true,
        render: (row) =>
          row.key === 'continuity' ? (
            row.name
          ) : (
            <Switch
              label={row.name}
              checked={row.enabled}
              onCheckedChange={(enabled) => update(row.key, { enabled })}
            />
          ),
      },
      {
        key: 'nominal',
        header: '名义值',
        width: 148,
        colSpan: (row) => (row.key === 'continuity' || !row.enabled ? 4 : undefined),
        render: (row) =>
          row.key === 'continuity' ? (
            <Stack gap={16}>
              <span style={{ width: 160 }}>
                <NumberField
                  aria-label="允许断胶长度"
                  value={row.nominal}
                  step={0.1}
                  precision={1}
                  unit="mm"
                  onValueChange={(nominal) => update(row.key, { nominal })}
                />
              </span>
              <span style={{ width: 160 }}>
                <NumberField
                  aria-label="最低有胶比例"
                  value={row.lower}
                  step={1}
                  unit="%"
                  onValueChange={(lower) => update(row.key, { lower })}
                />
              </span>
            </Stack>
          ) : !row.enabled ? (
            <Text muted>不判{row.name}</Text>
          ) : (
            field('nominal', '名义值')(row)
          ),
      },
      { key: 'lower', header: '下公差', width: 148, render: field('lower', '下公差') },
      { key: 'upper', header: '上公差', width: 148, render: field('upper', '上公差') },
      {
        key: 'band',
        header: '合格区间',
        align: 'right',
        nowrap: true,
        render: (row) =>
          [row.nominal, row.lower, row.upper].every((v) => v !== '')
            ? `${(Number(row.nominal) - Number(row.lower)).toFixed(2)} ~ ${(
                Number(row.nominal) + Number(row.upper)
              ).toFixed(2)}`
            : '—',
      },
    ];
  }, [update]);
  const getRowProps = useCallback(
    (row: LimitRow) => ({
      'aria-selected': row.key === active,
      onClick: () => setActive(row.key),
    }),
    [active],
  );
  return (
    <Example
      title="行头、跨列与可编辑单元格"
      name="Table · rowHeader · colSpan"
      wide
      description="首列为行头；关闭的判定项与连续性行跨列显示。点击行空白处选中该行，在输入框和开关内操作不会触发行点击。"
    >
      <div data-shot="table-editable">
        <Table
          caption="判定限值示例"
          columns={columns}
          rows={limits}
          rowKey={(row) => row.key}
          getRowProps={getRowProps}
        />
      </div>
    </Example>
  );
}
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
      <CycleHistory />
      <LimitsEditor />
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
function AppNavigation() {
  const { show } = useSnackbar();
  const [active, setActive] = useState('overview');
  const [collapsed, setCollapsed] = useState(false);
  const items: NavigationItem[] = [
    { value: 'overview', label: '工作概览', icon: <Mark />, group: '工作区' },
    { value: 'records', label: '检测记录', icon: <Mark type="file" />, badge: 8, group: '工作区' },
    { value: 'settings', label: '参数设置', icon: <Mark type="settings" />, group: '管理' },
    {
      value: 'locked',
      label: '权限管理',
      icon: <Mark type="file" />,
      disabled: true,
      group: '管理',
    },
  ];
  return (
    <>
      <Example
        title="导航栏与导航抽屉"
        name="NavigationRail · NavigationDrawer"
        wide
        description="左侧展示紧凑导航，右侧支持展开收起；两者共享当前项。"
      >
        <div className="navigation-demo">
          <NavigationRail
            label="紧凑导航示例"
            items={items}
            value={active}
            onValueChange={setActive}
            header={<Mark />}
          />
          <NavigationDrawer
            label="展开导航示例"
            items={items}
            value={active}
            onValueChange={setActive}
            collapsed={collapsed}
            onCollapsedChange={setCollapsed}
            header={collapsed ? <Mark /> : <Text>青钢工作区</Text>}
          />
          <div className="navigation-demo-content">
            <StatusBadge tone="ok">工作区已连接</StatusBadge>
            <Text as="p">{items.find((item) => item.value === active)?.label}</Text>
            <Text variant="label" muted>
              选择不同导航项，观察选中状态和展开布局。
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
                setActive('overview');
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
            { label: '检测记录', onClick: () => setActive('records') },
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
    </>
  );
}
function LockedParameters() {
  const [locked, setLocked] = useState(true);
  return (
    <Example
      title="锁定表单内的折叠区"
      name="Accordion · forceMount · ignoreFieldsetDisabled"
      wide
      description="外层 fieldset 锁定时，折叠标题仍可展开查看，参数保持禁用；折叠后内容不卸载，未保存的输入值保留。"
    >
      <Switch label="锁定参数（模拟检测运行中）" checked={locked} onCheckedChange={setLocked} />
      <fieldset
        disabled={locked}
        data-shot="accordion-fieldset"
        style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
      >
        <Accordion
          multiple
          forceMount
          ignoreFieldsetDisabled
          defaultValue={['exposure']}
          items={[
            {
              value: 'exposure',
              title: '曝光与增益',
              content: (
                <Grid minWidth={160} gap={12}>
                  <NumberField label="曝光" defaultValue={1200} unit="μs" step={50} />
                  <NumberField label="增益" defaultValue={6} unit="dB" step={0.5} precision={1} />
                </Grid>
              ),
            },
            {
              value: 'debug',
              title: '高级参数（调试）',
              content: (
                <Grid minWidth={160} gap={12}>
                  <NumberField
                    label="搜索半宽"
                    defaultValue={2.5}
                    unit="mm"
                    step={0.1}
                    precision={1}
                  />
                  <TextField label="调试备注" defaultValue="" placeholder="仅本次会话" />
                </Grid>
              ),
            },
          ]}
        />
      </fieldset>
    </Example>
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
      <LockedParameters />
      <Example
        title="上下文帮助"
        name="Popover · openOn=hover · role=tooltip"
        description="悬停或键盘聚焦即显示，点击后固定展开；Escape 或点击外部关闭。说明内容以 tooltip 角色关联到触发按钮。"
      >
        <Stack gap={8} data-shot-help="">
          <Text>复位条件</Text>
          <Popover
            openOn="hover"
            role="tooltip"
            side="bottom"
            trigger={
              <IconButton size="sm" variant="text" aria-label="复位条件说明">
                <Mark type="help" />
              </IconButton>
            }
          >
            真机由 PLC 发 faultReset 复位；PLC 已连接、心跳正常且设备就绪时，也可在本页手动复位。
          </Popover>
        </Stack>
        <Stack gap={8}>
          <Text>曲线读法</Text>
          <Popover
            openOn="hover"
            role="tooltip"
            title="曲线读法"
            side="right"
            trigger={
              <IconButton size="sm" variant="text" aria-label="曲线读法说明">
                <Mark type="help" />
              </IconButton>
            }
          >
            横轴按检测段展开，绿色带为公差，红虚线为绝对限；方向键可逐点查看对应原图。
          </Popover>
        </Stack>
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
