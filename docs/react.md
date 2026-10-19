# Qing Steel React

第一、二批通用组件使用 React + TypeScript。外观复用 `css/tokens.css` 与 `css/components.css`；React 样式入口为 `css/react.css`，第二批补充样式位于其自动引入的 `css/extended.css`。原有 HTML 演示和动效脚本保持可用。

## 本地运行

```sh
npm install
npm run dev
```

打开 `http://127.0.0.1:5173/showcase/`。右上角切换主题；搜索框按中文分类名或英文组件名筛选。原始演示仍位于 `/demo/`。

```sh
npm run typecheck
npm test
npm run test:browser
npm run build
npm run build:demo
```

组件产物位于 `dist/`，包含 ESM 与 TypeScript 声明；完整静态展示站点位于 `dist-demo/`。浏览器验证默认使用本机 Chrome，需要先安装 Chrome。`npm run preview` 可预览静态构建。

## 接入

```tsx
import { ThemeProvider, SnackbarProvider, Button, useSnackbar } from 'qing-steel';
import 'qing-steel/react.css';

function SaveButton() {
  const { show } = useSnackbar();
  return <Button onClick={() => show('配置已保存')}>保存</Button>;
}

export function App() {
  return (
    <ThemeProvider defaultTheme="dark" tokens={{ '--r-lg': '16px' }}>
      <SnackbarProvider>
        <SaveButton />
      </SnackbarProvider>
    </ThemeProvider>
  );
}
```

`react.css` 已包含 tokens 与原始组件 CSS，不必重复导入。React 组件独立处理状态，不需要加载 `qs-motion.js`。React 和 React DOM 是宿主应用提供的 peer dependencies。

## 组件接口

| 组件                           | 主要属性 / 行为                                                                                                                           |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| ThemeProvider / useTheme       | `theme`、`defaultTheme`、`onThemeChange`、`tokens`；`dark / light / system`；支持局部主题与浮层继承                                       |
| Text / Heading                 | `variant=body / label / data / data-lg`、`mono`、`muted`；Heading 的 `level=1…6`                                                          |
| Icon                           | SVG 内容作为 children；`size`、`label`；装饰图标默认不向辅助技术暴露                                                                      |
| Stack / Grid                   | Stack 的 `direction / gap / align / justify / wrap`；Grid 的 `minWidth / gap`                                                             |
| Surface / Card                 | `level=lowest / low / mid / high / highest`、`as=div / section / article / aside`；Card 支持 `title / description / actions / headingLevel`，非 div 或带 `role` 时以标题命名 |
| Divider                        | `vertical` 切换方向                                                                                                                       |
| Button / IconButton            | `variant=filled / tonal / outlined / text`、`size=sm / md`、`tone=danger / warn`（`danger` 等同 `tone="danger"`）、`loading / disabled`；`href` 渲染为链接，`asChild` 合并到唯一子元素（如路由 Link）；图标按钮必须提供 `aria-label`，支持 `selected` 与 `size="xs"` |
| FormField                      | `label / description / error / required / id`；自动关联内部输入控件；显式指定子控件 id 时应与 FormField id 相同                           |
| TextField / TextArea           | 原生 input / textarea 属性，加 `label / description / error`；TextField 支持 `leading / trailing`                                         |
| NumberField                    | `value / defaultValue` 为 number 或空字符串；`onValueChange`、`min / max / step / precision / unit`；失焦时校正范围和精度                 |
| Select                         | 原生 select 属性、`options / placeholder / onValueChange`；options 支持 `{label, options}` 分组                                           |
| Checkbox                       | 原生 checkbox 属性、`label / indeterminate / onCheckedChange`                                                                             |
| Switch                         | 原生 checkbox 属性、`label / onCheckedChange`，使用 switch 语义                                                                           |
| RadioGroup                     | `label / name / options / value / defaultValue / onValueChange / disabled / required / direction`                                         |
| SegmentedControl               | `label / options / value / defaultValue / onValueChange / size / disabled`；`multiple` 时值为字符串数组，否则为字符串                     |
| Chip                           | 无操作时为静态标签并透传 `title` 等原生属性；`onClick` 为操作；`selected` 为筛选；`onRemove / removeLabel` 添加独立移除按钮；`label` 与 children 组成「键 + 值」；`tone=ok / warn / ng / fault`、`size=sm / md` |
| Badge / StatusBadge            | Badge 的 `count / max / label`；StatusBadge 的 `tone=info / ok / warn / ng / fault / off / neutral`，`neutral` 表示灯未亮、空闲、未开始 |
| List / ListItem                | ListItem 的 `title / description / leading / trailing / selected / onClick / disabled`；尾部操作独立于行按钮                              |
| Tabs                           | `label / items / value / defaultValue / onValueChange`；items 为 `{value,label,icon?,disabled?,content}`                                  |
| Tooltip                        | 包裹单个支持 ref 的交互元素；`content / side / delay / pinnable`；`pinnable` 时点击固定展开，再次点击、外部点击或 Escape 收起              |
| Menu                           | `trigger / items / align / label`；items 支持操作、label 与 separator；操作项支持 `icon / shortcut / disabled / danger / onSelect`         |
| Dialog / Drawer                | `trigger / open / defaultOpen / onOpenChange / title / description / footer / closeOnOutside / closeDisabled / size / width / initialFocus` |
| Alert                          | `tone=info/ok/warn/ng/fault/tertiary / title / action / onClose / icon / role / className`，其余 div 属性透传；需处理的异常使用持续提示   |
| Snackbar                       | `duration / onDismiss / tone / action / className`；duration 为 0 时保持显示；内容作为 children                                          |
| SnackbarProvider / useSnackbar | 自动渲染全局提示层；`placement / container / max`；`show(string或{text,tone?,duration?,action?})`、`clear()`；默认同一时间一条提示         |
| Progress                       | `value / max / variant=linear或circular / label / tone`；省略 value 表示不确定进度                                                        |
| EmptyState                     | `title / description / icon / action`，其余原生 div 属性（含 `className`）透传                                                            |

表单控件沿用原生 `value / defaultValue` 或 `checked / defaultChecked` 规则；不要在挂载后切换受控与非受控模式。按钮默认 `type="button"`，需要提交表单时显式设置 `type="submit"`。

### 按钮的链接形态、色调与卡片头部

```tsx
import { Link } from 'react-router-dom';

<Button variant="filled" asChild trailingIcon={<ArrowRight size={15} />}>
  <Link to="/recipe/capture">前往整圈采集</Link>
</Button>
<Button href="/docs/guide.pdf" variant="text">操作手册</Button>
<IconButton asChild aria-label="返回历史列表"><Link to="/history"><ArrowLeft /></Link></IconButton>
<Button tone="warn" size="sm" onClick={openDiagnostics}>检测图异常 3</Button>

<Card as="section" title="触发接线" description="保存后由设备确认"
  actions={<IconButton size="xs" aria-label="刷新"><RefreshCw size={14} /></IconButton>}>
  …
</Card>
<Chip label="轮次">R-0012</Chip>
<StatusBadge tone="neutral">空闲</StatusBadge>
```

- `asChild` 把按钮样式、`leadingIcon / trailingIcon` 与事件合并到唯一子元素：子元素自己的属性优先，`className` 与 `style` 合并，同名事件先执行子元素的再执行按钮的；`ref` 同时交给按钮调用方与子元素。子元素的 `className`、`style`、`children` 为状态函数时（如 `NavLink` 的 `({ isActive }) => ...`），按子元素给出的状态解析后再合并，图标插在解析出的内容两侧。子元素需转发 ref 与原生属性（react-router 的 `Link` / `NavLink` 满足）。
- `disabled` 或 `loading` 的链接形态：`href` 模式去掉 `href` 并标 `role="link"`、`aria-disabled="true"`；`asChild` 模式标 `aria-disabled="true"`、移出 Tab 序列并阻止点击与中键打开，子元素自身的点击回调也不执行。链接形态没有 `aria-pressed`，`IconButton` 的 `selected` 只改变外观。
- `tone="warn"` 用于需要留意但不危险的操作（检测图异常、强制复位等），与 `danger` 的 NG 红区分；在 `outlined / text` 与图标按钮上只染文字与描边。
- `IconButton size="xs"` 为 24 px，放进卡片或面板标题行不撑高；`sm` 为 30 px 正圆。
- Card 的标题槽位为 `.qs-card-title`（`headingLevel` 时渲染为对应标题元素），标题继承 `.qs-card-heading` 的字号、字重与颜色，宿主可沿用 0.8.0 的方式覆写 `.qs-card-heading`；说明为 `.qs-card-description`，操作为右对齐的 `.qs-card-actions`；`as` 为 section / article / aside 或带 `role` 时，未显式命名则以标题命名，可用 `getByRole('region', { name })` 查询。

Select 的单选菜单使用 Radix Select，统一 Qing Steel 的深浅主题、圆角浮层、分组标题、选中勾选和禁用样式。支持方向键、Home / End、文字快速定位与 Escape 关闭；保留 `name / required / form`、原生 `onChange`、表单提交与重置。`multiple` 或 `size > 1` 仍为原生列表框。浮层挂载在 ThemeProvider 内，跟随局部主题。

## 交互与视觉约定

动效遵循现有短／中／长时长令牌；浮层支持退出反馈，分段、Tabs 与导航指示器可连续切换。高频读数自动取消重叠动效，优先显示最新值。性能场景与实测边界见 [动效与性能验证](performance.md)。表格和相机数据应采用不可变更新，未变化项尽量保留引用。

- 默认深色，使用 Qing Steel 现有色彩、字号、圆角、控件高度和间距。
- 数值使用等宽 tabular 数字；数字输入可附单位并右对齐。
- Dialog、Drawer、Menu、Tooltip、Tabs、Slider、Accordion、Popover 使用 Radix 的无障碍交互基础，封装青钢样式。
- 键盘焦点可见；浮层支持 Escape、焦点限制与关闭后恢复；`closeDisabled` 适用于暂时不能中断的操作。
- Snackbar 新消息替换旧消息，悬停或聚焦任一状态存在时暂停自动关闭；操作反馈可以提供撤销。
- 遵循 `prefers-reduced-motion`。不确定进度以匀速平移的条段与旋转的弧段表达“仍在运行”；减少动态效果时退回静态条段或弧段，不引入其他装饰性循环动画。
- 进入用 decel、退出用 accel 且短于进入；浮层带 4–8 px 位移与 .98 缩放，提示气泡用 short 时长；Tabs 指示器可被连续切换打断。

### 反馈与浮层的宿主接口

```tsx
const main = useRef<HTMLElement>(null);

<SnackbarProvider placement="top" container={main} max={3}>
  <main ref={main} style={{ position: 'relative', overflow: 'hidden' }}>…</main>
</SnackbarProvider>

<Dialog title="编辑点位" size="lg" initialFocus="first-field" open={open} onOpenChange={setOpen}>…</Dialog>
<Drawer title="诊断" width={600}>…</Drawer>
<Tooltip pinnable content="曝光时长决定单帧进光量">
  <IconButton aria-label="曝光时长说明">?</IconButton>
</Tooltip>
<Alert tone="tertiary" role="status" className="debug-banner" title="候选配方调试">未发布</Alert>
```

- `SnackbarProvider`：`placement` 为 `bottom`（默认）或 `top`。`container` 接受元素或 ref，提示层通过 portal 挂进该容器并改为 `position: absolute`，容器需自行设置定位且不滚动（如主区外壳）；ref 由子树挂载时在挂载后生效，未就绪时退回默认的视口定位。`max` 默认 1：新提示替换旧提示，新旧两条交叉淡出淡入；大于 1 时堆叠，最新一条靠近 `placement` 边缘，超出上限时最早的一条离开，其余提示用可打断的位移补位。
- `useSnackbar`：没有 Provider 时返回空操作的 `show / clear`，第一次调用 `show` 时在非生产环境警告一次，不再抛错；宿主单元测试不必为此挂 Provider。
- `Dialog / Drawer`：`size` 为 `sm / md / lg / xl`，对话框依次为 420 / 520 / 720 / 960 px，抽屉为 360 / 440 / 560 / 720 px；`width` 接受数字（px）或 CSS 长度，优先于 `size`；不传时保持原宽度（对话框 520 px、抽屉 440 px），始终不超出视口。`initialFocus` 接受 ref、浮层内的 CSS 选择器或 `'first-field'`（第一个未禁用、非只读、可聚焦的输入 / 文本域 / 下拉）；找不到目标、目标不可见（折叠区、`display: none`）或无法聚焦时沿用默认焦点，`'first-field'` 会跳过不可见的字段；关闭后焦点仍回到打开前的元素。
- `Tooltip`：`pinnable` 时触发元素带 `aria-expanded`，固定状态下内容带 `data-pinned`；指针移开或失焦不收起。宿主应只在说明类按钮上使用，内容仍是非交互的提示文本。
- `Alert`：`role` 覆盖默认的播报方式（默认 `ng / fault` 为 `alert`，其余为 `status`）；`icon` 替换语义图标，传 `null` 隐藏；`tertiary` 用于离线、候选调试等非常规模式。
- 展示页所有操作仅作用于示例状态，不访问设备或后端。

## 第二批组件

展示页新增「高级输入」「数据展示」「应用导航」「内容与浮层」四组，所有组件通过同一个 `qing-steel` 入口导入，沿用 `qing-steel/react.css`。

| 组件             | 主要属性 / 行为                                                                                                                                                                                                                        |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Slider           | `label / min / max / step / disabled / name / marks / formatValue`；单值使用 number，`range` 使用 `[number, number]`；`value / defaultValue / onValueChange / onValueCommit`                                                           |
| Autocomplete     | `label / options / value / defaultValue / onValueChange`；`inputValue / defaultInputValue / onInputValueChange` 控制查询；`loading / filterOptions / emptyMessage`；支持 `name / required / disabled / readOnly / description / error` |
| DatePicker       | TextField 属性加 `onValueChange`；值为 `YYYY-MM-DD`，`min / max` 限制日期范围                                                                                                                                                          |
| TimePicker       | TextField 属性加 `onValueChange`；值为 `HH:mm`，启用秒时为 `HH:mm:ss`；`min / max` 限制时间，`step` 单位为秒、默认 60                                                                                                                  |
| Accordion        | `items=[{value,title,content,disabled?}]`；默认单项展开、允许收起，`collapsible=false` 禁止全部收起；`multiple` 支持多项，值类型随之变为 string[]；支持受控与非受控                                                                    |
| Popover          | `trigger / title / children / open / defaultOpen / onOpenChange / side / align`；锚点定位、边缘避让、外部点击和 Escape 关闭；关闭后返回触发按钮                                                                                        |
| Table            | 泛型行数据；`rows / columns / rowKey / caption`；`sort / defaultSort / onSortChange / manualSorting`；`selectable / selectedKeys / defaultSelectedKeys / onSelectionChange / isRowSelectable / getRowLabel`；`loading / emptyState`    |
| Pagination       | `total` 为总条数，`page / defaultPage / onPageChange` 页码从 1 开始；`pageSize / defaultPageSize / onPageSizeChange / pageSizeOptions / disabled / label`                                                                              |
| NavigationRail   | `label / items / value / defaultValue / onValueChange / header / footer`；固定紧凑宽度，图标导航带提示与可访问名称                                                                                                                     |
| NavigationDrawer | NavigationRail 的通用属性，增加 `collapsed / defaultCollapsed / onCollapsedChange / collapsible`；组名、徽标、展开收起；为页面内导航容器，遮罩式导航可放入第一批 Drawer                                                                |
| AppBar           | `title / subtitle / navigation / actions / sticky`，其余原生 header 属性透传；窄屏操作区换行                                                                                                                                           |
| Toolbar          | `label` 必填；子元素作为操作组，左右方向键、Home / End 在可用操作间移动，不拦截输入框光标操作                                                                                                                                          |
| Breadcrumbs      | `items=[{label,href?,onClick?}] / label`；末项为当前位置文本，前置项可使用链接或回调                                                                                                                                                   |
| Skeleton         | `variant=text / rectangular / circular`、`width / height`；装饰性静态占位，不向辅助技术暴露，加载容器可设置 `aria-busy`                                                                                                                |
| FAB              | `icon / label / size=sm或md或lg` 与原生按钮属性；图标型必须提供 `aria-label`；带文字型使用 `label`；定位由应用布局决定                                                                                                                 |

### 输入与异步建议

```tsx
const [range, setRange] = useState<[number, number]>([20, 75]);

<Slider range label="合格区间" value={range} onValueChange={setRange}
  min={0} max={100} step={5} formatValue={value => `${value} μm`} />

<Autocomplete label="选择设备" name="deviceId" required
  options={[{ value: 'camera-a', label: 'A 线相机' }]}
  value={deviceId} onValueChange={setDeviceId}
  onInputValueChange={setQuery} loading={loading} filterOptions={false} />
```

Autocomplete 只提交选中选项的 `value`，编辑文字时清空原选择；未确认的查询在失焦或 Escape 时取消。使用方向键移动高亮、Enter 选择，加载状态和禁用选项不可选择。默认在客户端按 label 过滤；远端查询时设置 `filterOptions={false}`，由应用根据查询更新 `options / loading`，并取消或忽略过期请求。展示页用可取消的延时模拟异步请求，不访问外部服务。

DatePicker 与 TimePicker 保留原生输入框的本地化直接输入、ref、表单提交与校验能力，不进行时区转换。图标按钮或 `Alt + ↓` 打开 Qing Steel 浮层，`Escape` 关闭并返回输入框。日期弹层采用 React DayPicker 的日历导航，支持方向键、翻月、今天与清空；选中日期立即提交。时间弹层提供时／分列表，`step` 小于一分钟或当前值含秒时显示秒列；选择后点击确认提交，取消或外部点击不修改原值。列表支持上下方向键及 Home / End。

日期和时间面板禁用不符合 `min / max / step` 的选项；时间支持跨午夜范围。直接输入的范围外值保留供用户修正，由原生 constraint validation 阻止表单提交；程序化提交时使用 `requestSubmit()` 或先检查 `checkValidity()`。`required` 字段允许清空，但清空后不能通过必填校验。`readOnly / disabled` 不开放浮层。时间列表提供整秒精度，亚秒值仍可直接输入并使用原生 step 校验。

### 表格排序、选择与分页

```tsx
type Row = { id: string; measurement: number };
const columns: TableColumn<Row>[] = [
  { key: 'id', header: '编号', accessor: (row) => row.id },
  {
    key: 'measurement',
    header: '测量值',
    accessor: (row) => row.measurement,
    render: (row) => row.measurement.toFixed(2),
    align: 'right',
    sortable: true,
  },
];

<Table<Row>
  caption="测量记录"
  rows={rows}
  columns={columns}
  rowKey={(row) => row.id}
  selectable
  selectedKeys={selectedIds}
  onSelectionChange={setSelectedIds}
/>;
```

列定义支持 `key / header / accessor / render / align / width / sortable / compare`。`accessor` 返回原始排序值，`render` 负责显示；数字按数值排序，文本按自然顺序比较，`compare` 可覆盖比较规则。点击表头循环升序、降序和无排序，默认排序不修改原始数据。

分页数据应在完整数据上筛选和排序后再切片，或由服务端返回。此时给 Table 设置 `manualSorting`，监听 `onSortChange`；不要在每页切片之后使用局部排序冒充全表排序。展示页提供了完整受控组合示例。Pagination 不请求或切片数据，切换每页条数会回到第一页；数据总数缩小时应用应同步校正自己的 page 状态，组件会对可见页码做边界保护。

行键必须唯一且稳定。表头全选只改变当前 `rows` 中允许选择的行，保留其它页已选键；`isRowSelectable` 排除不可选行。数据删除或筛选后是否清理隐藏选择，由应用决定。空数据、加载状态与选择数量均有展示示例。

## 工业扩展组件

展示页新增「工业判定与阶段」「相机与采集帧」「测量与数字读数」。仍从 `qing-steel` 导入，样式包含在 `qing-steel/react.css` 中。

| 组件                | 主要属性 / 行为                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| VerdictCard         | `result / cycleId / state / faultMessage / size / emphasize / label`；结果为 `{id,cycleId,verdict,code?,title?,description?,serialNumber?,durationMs?}`，verdict 支持 `ok / ng / warn / fault`。`keepResultOnFault`（默认 false）、`stateContent`（idle / running / fault 的大字、副标题、描述）、`serialPlacement=footer或header`、`meta`（头部右侧内容或 `(result) => ReactNode`）、`showFooter`（默认 true） |
| InspectionStages    | `steps=[{id,label}] / currentStepId / completedStepIds / fault / pulse / label`；fault 为 `{stepId?,message}`，完成状态显式传入；呼吸效果默认关闭                                                                                                                                                                                                                                                               |
| CameraThumbnail     | `frame / selected / onSelect / className / renderPreview / width / previewHeight`，其余原生属性（`aria-label`、`aria-pressed`、`title`、`data-*`、`onClick` 等）透传到根元素；提供 onSelect 时为按钮，否则为只读缩略图                                                                                                                                                                                          |
| CameraStrip         | `frames / value / defaultValue / onValueChange / cycleId / layout / label / renderPreview / thumbnailWidth / previewHeight`；layout 为 `strip / grid`，方向键及 Home / End 选择可用帧，横向模式平滑显露选中帧，两端有未显示的帧时边缘渐隐                                                                                                                                                                       |
| AnimatedNumber      | `value / precision / locale / useGrouping / groupSeparator / animate / placeholder`；只对变化的数字位播放动效，默认精度 2；`groupSeparator` 指定千分位字符（如空格），给出时默认启用分组                                                                                                                                                                                                                        |
| MeasurementReading  | 数字属性加 `label / unit / status / stale / limits / description / pendingLabel / size`；value 可为数字或文字；limits 为 `{min?,max?}`，status 为 `neutral / ok / ng / warn / fault`；`pendingLabel` 默认「未测」，设为 `null` 时无值只显示占位横线                                                                                                                                                             |
| MeasurementReadings | `items / label / minWidth`；items 为带唯一 id 的 MeasurementReading 属性，自适应读数组                                                                                                                                                                                                                                                                                                                          |
| StatCounter         | `label / value / unit / tone / toneWhenZero / precision / description / span / size`，以及 AnimatedNumber 的格式属性；tone 为 `neutral / ok / ng / warn / fault`，值为 0 或缺失时默认保持中性色；precision 默认 0                                                                                                                                                                                               |
| KpiGroup            | `items / label / columns / minWidth`；items 为带唯一 id 的 StatCounter 属性；给出 `columns` 时按固定列数排布，配合 item 的 `span` 跨列，否则按 `minWidth`（默认 112）自适应                                                                                                                                                                                                                                     |

```tsx
import { VerdictCard, InspectionStages, MeasurementReading } from 'qing-steel';

<VerdictCard cycleId="C-1042" result={{
  id: 'R-1042-1', cycleId: 'C-1042', verdict: 'ng',
  serialNumber: 'SN-1042', description: '胶宽超出上限', durationMs: 286,
}} />
<InspectionStages
  steps={[{ id: 'capture', label: '采集' }, { id: 'judge', label: '判定' }]}
  completedStepIds={['capture']} currentStepId="judge"
/>
<MeasurementReading label="最大胶宽" value={0.79} precision={2}
  unit="mm" status="ng" limits={{ min: 0.3, max: 0.75 }} />
```

### 结果、帧与工件身份

应用应传入当前 `cycleId`，并为每次新结果提供唯一 `result.id`。不匹配当前工件的判定被隐藏；设备 `state="fault"` 默认优先于已有产品判定，使用紫色 ERR，与红色 NG 区分。`keepResultOnFault` 开启时，本件已有有效判定继续显示（根元素 `data-device-state="fault"` 供宿主标记），没有本件判定时仍显示 ERR。

判定切换时新内容自下方 6 px 淡入（medium / decel，依次错开 short 的四分之一），背景色同步过渡。只有新的 NG 结果 ID 到达时整卡放大到 1.02 再回落一次（long，前段 decel、后段 standard，无回弹）；同一结果的重绘、故障覆盖后恢复都不会再次强调，连续到达时取消旧动效、不排队。初次挂载不播放，`emphasize={false}` 可关闭强调，减少动态效果时直接切换。

`result.code` / `result.title` 覆盖大字与副标题，用于产线语义：局部超差传 `verdict: 'warn', code: 'OK', title: '局部超差'`，NG 细分传 `title: '断胶'` 等。无结果时的文案用 `stateContent` 覆盖，`faultMessage` 仍优先作为故障描述。`serialPlacement="header"` 把 SN 放到头部并写入可访问名称（`判定结果 · SN …`，过长时单行省略、悬停显示全文）；`meta` 的函数形式只收到当前展示的有效结果，被隐藏或被故障覆盖时为 `null`，避免把上一件的 PLC 码带到本件。整卡是 polite 播报区，判定切换时整卡读一次；描述行本身不参与播报，因此把「帧 n / N」这类逐帧变化的文字放进 `stateContent.running.description` 不会每帧重读整卡。

```tsx
<VerdictCard
  label="判定结果"
  cycleId={part.cycleId}
  state={phase === 'FAULT' ? 'fault' : running ? 'running' : 'idle'}
  keepResultOnFault
  serialPlacement="header"
  showFooter={false}
  meta={(shown) => (shown ? `PLC ${plcCode}` : 'PLC —')}
  stateContent={{
    running: { title: '检测中…', description: `SN ${part.sn} · 帧 ${part.received} / ${part.n}` },
  }}
  result={{
    id: resultId,
    cycleId: part.cycleId,
    verdict: 'warn',
    code: 'OK',
    title: '局部超差',
    description: reason,
    serialNumber: part.sn,
  }}
/>
```

CameraFrame 包含 `id / cameraId / label / state`，可选 `cycleId / stateLabel / src / alt / preview / keepPreview / detail / channel / disabled`。state 支持 `waiting / capturing / ok / ng / warn / fault / missing / skipped`；channel 为 1–8；`stateLabel` 替换状态文案（如「局部超差」「断胶」「未示教」），同时用于可访问名称，颜色仍由 state 决定。src 提供图片，preview 可提供 SVG 等只读内容，请勿嵌套按钮或链接。缺图、跳过、等待和采集中默认显示明确占位；`keepPreview` 开启时保留预览、降低不透明度并叠加状态文字，预览节点在采集中、出结果与恢复之间保持同一实例，宿主 canvas 不会被卸载重建。图片加载失败显示错误文字，同时保留检测结果状态。

`renderPreview(frame)` 为宿主渲染槽，优先于 src / preview，适合挂载自行绘制的 canvas 实时预览；请用 `useCallback` 保持引用稳定，组件按引用与帧字段跳过无关重绘。尺寸默认宽 176 px、预览高 88 px，可用 `width / previewHeight`（CameraStrip 为 `thumbnailWidth / previewHeight`）或 CSS 变量 `--qs-camera-w / --qs-camera-preview-h` 调整，网格模式以宽度作为最小列宽。

CameraStrip 传入 cycleId 时，仅展示 cycleId 匹配的帧内容，其余显示等待当前工件，也不会为旧帧调用 `renderPreview`。帧 id 应唯一且稳定，选择以 id 保存；非受控选择仅对其所属工件生效。受控模式下，应用在切换工件时应同步清空 value，并忽略过期的异步结果。

缩略图状态用胶囊标签：OK、待复核、故障、采集中取对应容器色，NG 用实色，远处也能区分；悬停、按压叠加 `--state-hover / --state-pressed`，按压缩放到 .98，选中为 primary 描边加 8% primary 底色，禁用使用 `--on-surface-disabled`。

检测阶段推进时，完成项的序号以缩放淡入换成勾，连接线自左向右填满（medium / decel），新的当前阶段延迟 short 再点亮，读出推进方向；各状态内边距一致，切换不改变宽度。故障阶段显示感叹号，不依赖颜色区分。

### 读数与动效

`null / undefined / NaN / Infinity` 显示占位，不冒充零或合格；显式 fault 仍显示 ERR。`stale` 将读数标记为历史值。精度限定在 0–20，小数舍入后消除负零。limits 仅展示参考范围，组件不计算业务判定，status 应来自应用的检测逻辑。

数字采用等宽字形，单位紧随读数。动效使用现有时长 token，遵循 `prefers-reduced-motion`；数值变化不通过 live region 高频播报。变化位按数值方向（增大自下、减小自上）位移 40% 并淡入（medium / decel）；同一位两次变化间隔小于 medium + short 时直接显示新值，并取消仍在进行的动效，高频读数不排队、不反复淡出。展示页可模拟新工件、NG、设备故障、缺图、读数缺失及历史值，不连接真实设备。

value 为文字时（如「刚刚」「3 秒前」）按有效值显示，不播放数字动效。读数状态用胶囊标签，NG 为实色，其余取容器色。

StatCounter / KpiGroup 用于产量、OK / NG / ERR 计数和良率：标签只出现一次，不复用测量状态标签；数值为 0 或缺失时保持中性色（`toneWhenZero` 可改），不会把 0 件 NG 标红。

```tsx
<KpiGroup
  label="今日统计"
  columns={6}
  items={[
    { id: 'total', label: '今日', value: total, span: 3, groupSeparator: ' ' },
    {
      id: 'yield',
      label: '良率',
      value: total ? (ok / total) * 100 : null,
      precision: 1,
      unit: '%',
      span: 3,
    },
    { id: 'ok', label: 'OK', value: ok, tone: 'ok', span: 2 },
    { id: 'ng', label: 'NG', value: ng, tone: 'ng', span: 2 },
    { id: 'err', label: 'ERR', value: err, tone: 'fault', span: 2 },
  ]}
/>
```

## 参考来源

分段选中指示器复用了 `ly-gluesight` 最新获取的 main 提交 `99ab339` 中的 `src/components/SelectionTrack.tsx`；Snackbar 借鉴其暂停计时和替换提示的行为，移除了业务耦合。对话框沿用其标题、内容、操作区和抽屉布局，焦点处理交由 Radix。

工业扩展参考同一提交的 `InspectPage.tsx` 判定卡、`CycleStatus.tsx` 检测阶段、`ShotStrip.tsx / ShotTiles.tsx` 采集帧，提取为独立 React + TypeScript 组件。沿用 Qing Steel 的 OK 容器色、NG 实色、紫色故障、通道色与等宽数字；不包含相机连接、设备协议或业务判定引擎。
