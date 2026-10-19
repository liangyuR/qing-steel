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
| Surface / Card                 | `level=lowest / low / mid / high / highest`；Card 支持 `title / actions`                                                                  |
| Divider                        | `vertical` 切换方向                                                                                                                       |
| Button / IconButton            | `variant=filled / tonal / outlined / text`、`size=sm / md`、`danger / loading / disabled`；图标按钮必须提供 `aria-label`，支持 `selected` |
| FormField                      | `label / description / error / required / id`；自动关联内部输入控件；显式指定子控件 id 时应与 FormField id 相同                           |
| TextField / TextArea           | 原生 input / textarea 属性，加 `label / description / error`；TextField 支持 `leading / trailing`                                         |
| NumberField                    | `value / defaultValue` 为 number 或空字符串；`onValueChange`、`min / max / step / precision / unit`；失焦时校正范围和精度；`clamp={false}` 保留越界输入并标记无效，`rangeError` 自定义提示，`step` 可为 `'any'` |
| Select                         | 原生 select 属性、`options / placeholder / onValueChange`；options 支持 `{label, options}` 分组；选项 `label` 可为节点并带 `textValue / aria-label`；触发按钮带 `data-value`；跟随祖先 `<fieldset disabled>` |
| Checkbox                       | 原生 checkbox 属性、`label / indeterminate / onCheckedChange`；自绘勾选框，原生 input 透明覆盖其上，键盘、表单与测试不变               |
| Switch                         | 原生 checkbox 属性、`label / onCheckedChange`，使用 switch 语义                                                                           |
| RadioGroup                     | `label / name / options / value / defaultValue / onValueChange / disabled / required / direction`；选项可带 `aria-label`              |
| SegmentedControl               | `label / options / value / defaultValue / onValueChange / size / disabled`；`multiple` 时值为字符串数组，否则为字符串；选项 `label` 可为节点（如状态圆点），`aria-label` 提供独立名称 |
| FileInput                      | 原生 file input 属性加 `label / description / error`；`onFilesChange`、受控 `files`、`dropzone`、`buttonLabel / placeholder`；显示已选文件名与大小 |
| Chip                           | 无操作时为静态标签；`onClick` 为操作；`selected` 为筛选；`onRemove / removeLabel` 添加独立移除按钮                                        |
| Badge / StatusBadge            | Badge 的 `count / max / label`；StatusBadge 的 `tone=info / ok / warn / ng / fault / off`                                                 |
| List / ListItem                | ListItem 的 `title / description / leading / trailing / selected / onClick / disabled`；尾部操作独立于行按钮                              |
| Tabs                           | `label / items / value / defaultValue / onValueChange`；items 为 `{value,label,icon?,disabled?,content}`                                  |
| Tooltip                        | 包裹单个支持 ref 的交互元素；`content / side / delay`                                                                                     |
| Menu                           | `trigger / items / align / label`；items 支持操作、label 与 separator；操作项支持 `disabled / danger / onSelect`                          |
| Dialog / Drawer                | `trigger / open / defaultOpen / onOpenChange / title / description / footer / closeOnOutside / closeDisabled`                             |
| Alert                          | `tone / title / action / onClose`；需处理的异常使用持续提示                                                                               |
| Snackbar                       | `duration / onDismiss / tone / action`；duration 为 0 时保持显示；内容作为 children                                                       |
| SnackbarProvider / useSnackbar | 自动渲染全局提示层；`show(string或{text,tone?,duration?,action?})`、`clear()`；同一时间一条提示                                           |
| Progress                       | `value / max / variant=linear或circular / label / tone`；省略 value 表示不确定进度                                                        |
| EmptyState                     | `title / description / icon / action`                                                                                                     |

表单控件沿用原生 `value / defaultValue` 或 `checked / defaultChecked` 规则；不要在挂载后切换受控与非受控模式。按钮默认 `type="button"`，需要提交表单时显式设置 `type="submit"`。

Select 的单选菜单使用 Radix Select，统一 Qing Steel 的深浅主题、圆角浮层、分组标题、选中勾选和禁用样式。支持方向键、Home / End、文字快速定位与 Escape 关闭；保留 `name / required / form`、原生 `onChange`、表单提交与重置。`multiple` 或 `size > 1` 仍为原生列表框。浮层挂载在 ThemeProvider 内，跟随局部主题。

### 表单控件的测试、越界输入与文件

Select 的可访问控件是触发按钮（`combobox`），它的可访问值就是按钮内的选项文字，读屏与 Playwright 的 ARIA 快照都能读到；触发按钮另带 `data-value`，值为当前选项的 `value`，未选择时为空字符串。旁边保留一个对辅助技术隐藏的 1 px 原生 `select`（类名 `qs-select-native`，与触发按钮同在 `.qs-select` 内），它是表单值的来源，测试可以直接按值操作它：

```ts
// Playwright：用触发按钮的可访问名称找到所在下拉，再操作其中的原生 select
const trigger = page.getByRole('combobox', { name: '期望结论' });
const field = page.locator('.qs-select').filter({ has: trigger });
await field.locator('select').selectOption('ng');
await expect(trigger).toHaveAttribute('data-value', 'ng');
await expect(trigger).toHaveText('NG');

// Testing Library：同样从触发按钮出发
const trigger = screen.getByRole('combobox', { name: '期望结论' });
await user.selectOptions(trigger.closest('.qs-select')!.querySelector('select')!, 'ng');
```

模拟用户操作时点开触发按钮再点选项：`getByRole('option', { name })`。选项浮层挂在 ThemeProvider 容器里，不在对话框内，应从 `page` / `screen` 而不是对话框定位。不要用 `getByLabel` 找 Select：带 `aria-label` 时原生 select 与触发按钮同名，会命中两个元素。

选项 `label` 可以是节点（状态圆点、编号加名称等），此时用 `textValue` 提供键入定位和原生 `option` 的文字，用 `aria-label` 提供选项的可访问名称（覆盖默认按可见文字命名）。SegmentedControl 的选项同样接受节点 `label` 与 `aria-label`。

```tsx
<Select label="当前相机" value={cameraId} onValueChange={setCameraId}
  options={cameras.map((c) => ({
    value: c.id,
    label: <><StatusDot tone={c.tone} />{c.id}</>,
    textValue: c.id,
    'aria-label': `${c.name} ${c.id}`,
  }))} />
```

Select、TextField、NumberField、Checkbox、Switch、FileInput 都跟随祖先 `<fieldset disabled>`：外观换成禁用色，当前值仍可辨认。Chrome 会向禁用按钮派发 pointerdown，而 Radix 只看自身 `disabled`，因此 Select 在触发按钮处于禁用状态时拦截指针与键盘打开。

NumberField 默认在失焦时把值夹回 `min / max`。需要“越界仍保留输入、提示后由宿主阻止保存”时设置 `clamp={false}`：值原样保留，失焦后输入框才 `aria-invalid`，带 `label` 或 `description` 时同时显示 `rangeError`（输入过程中的中间值不报错；已提示后回到范围内立即清除）（默认“应在 min–max 单位 之间”，也可传函数按范围生成）；原生 `min / max` 仍参与 constraint validation，`form.checkValidity()` 返回 false。宿主按同一 `min / max` 判断能否保存。放在外部 FormField 内且自身没有 `label` 时只标记无效，错误文字由外部 FormField 的 `error` 提供。`step="any"` 允许任意小数，不触发步长校验。

```tsx
<NumberField label="曝光时间" unit="μs" min={100} max={5000} step="any"
  clamp={false} value={exposure} onValueChange={setExposure} />
const canSave = exposure !== '' && exposure >= 100 && exposure <= 5000;
```

FileInput 保留原生 `<input type="file">`（透明覆盖在整个控件上），标签、`name / accept / multiple / required / form`、表单提交与重置、Playwright 的 `setInputFiles` 和 Testing Library 的 `user.upload` 都直接作用于它。`onFilesChange` 收到 `File[]`，表单重置时收到空数组。`dropzone` 显示拖放区与文件列表；两种外观都接受拖放，单选时只取第一个文件，禁用时忽略。`accept` 只是选择器提示，拖放不按它过滤，类型与大小须由宿主校验。受控时传 `files`：组件会把它同步回原生 input（含宿主过滤后的子集、拒绝本次选择而保持原值、传入空数组），被宿主丢弃的文件不会随表单提交，校验失败后用户可以重新选择同一个文件。

```tsx
<FileInput label={`k${k + 1} 原图`} accept=".png,.jpg,.bmp,.tif"
  files={files[k] ? [files[k]] : []}
  onFilesChange={([file]) => file && validateAndKeep(k, file)} />
```

## 交互与视觉约定

动效遵循现有短／中／长时长令牌；浮层支持退出反馈，分段、Tabs 与导航指示器可连续切换。输入框悬停加深描边，聚焦为 2 px 主色环并让标签变为主色；错误时描边与焦点环为 NG 红，错误文字带图标并短时淡入。勾选、单选、开关与滑块手柄只做缩放和淡入淡出，退出比进入更短；下拉与建议列表在键盘导航时显示描边高亮，指针悬停只叠加状态层。高频读数自动取消重叠动效，优先显示最新值。性能场景与实测边界见 [动效与性能验证](performance.md)。表格和相机数据应采用不可变更新，未变化项尽量保留引用。

- 默认深色，使用 Qing Steel 现有色彩、字号、圆角、控件高度和间距。
- 数值使用等宽 tabular 数字；数字输入可附单位并右对齐。
- Dialog、Drawer、Menu、Tooltip、Tabs、Slider、Accordion、Popover 使用 Radix 的无障碍交互基础，封装青钢样式。
- 键盘焦点可见；浮层支持 Escape、焦点限制与关闭后恢复；`closeDisabled` 适用于暂时不能中断的操作。
- Snackbar 新消息替换旧消息，悬停或聚焦任一状态存在时暂停自动关闭；操作反馈可以提供撤销。
- 遵循 `prefers-reduced-motion`。不确定进度使用静态弧段或条段表达等待，不引入装饰性循环动画。
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

| 组件 | 主要属性 / 行为 |
| --- | --- |
| VerdictCard | `result / cycleId / state / faultMessage / size / emphasize / label`；结果为 `{id,cycleId,verdict,description?,serialNumber?,durationMs?}`，verdict 支持 `ok / ng / warn / fault` |
| InspectionStages | `steps=[{id,label}] / currentStepId / completedStepIds / fault / pulse / label`；fault 为 `{stepId?,message}`，完成状态显式传入；呼吸效果默认关闭 |
| CameraThumbnail | `frame / selected / onSelect / className`；提供 onSelect 时为按钮，否则为只读缩略图 |
| CameraStrip | `frames / value / defaultValue / onValueChange / cycleId / layout / label`；layout 为 `strip / grid`，方向键及 Home / End 选择可用帧，横向模式自动显露选中帧 |
| AnimatedNumber | `value / precision / locale / useGrouping / animate / placeholder`；只对变化的数字位播放动效，默认精度 2 |
| MeasurementReading | 数字属性加 `label / unit / status / stale / limits / description / size`；limits 为 `{min?,max?}`，status 为 `neutral / ok / ng / warn / fault` |
| MeasurementReadings | `items / label / minWidth`；items 为带唯一 id 的 MeasurementReading 属性，自适应读数组 |

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

应用应传入当前 `cycleId`，并为每次新结果提供唯一 `result.id`。不匹配当前工件的判定被隐藏；设备 `state="fault"` 优先于已有产品判定，使用紫色 ERR，与红色 NG 区分。新 NG 结果强调一次，普通重绘不会重复强调；初次挂载不播放入场动画，`emphasize={false}` 可关闭强调。

CameraFrame 包含 `id / cameraId / label / state`，可选 `cycleId / src / alt / preview / detail / channel / disabled`。state 支持 `waiting / capturing / ok / ng / warn / fault / missing / skipped`；channel 为 1–8。src 提供图片，preview 可提供 SVG 等只读内容，请勿嵌套按钮或链接。缺图、跳过、等待和采集中均显示明确占位；图片加载失败显示错误文字，同时保留检测结果状态。

CameraStrip 传入 cycleId 时，仅展示 cycleId 匹配的帧内容，其余显示等待当前工件。帧 id 应唯一且稳定，选择以 id 保存；非受控选择仅对其所属工件生效。受控模式下，应用在切换工件时应同步清空 value，并忽略过期的异步结果。

### 读数与动效

`null / undefined / NaN / Infinity` 显示占位，不冒充零或合格；显式 fault 仍显示 ERR。`stale` 将读数标记为历史值。精度限定在 0–20，小数舍入后消除负零。limits 仅展示参考范围，组件不计算业务判定，status 应来自应用的检测逻辑。

数字采用等宽字形，单位紧随读数。动效使用现有时长 token，遵循 `prefers-reduced-motion`；数值变化不通过 live region 高频播报。展示页可模拟新工件、NG、设备故障、缺图、读数缺失及历史值，不连接真实设备。

## 参考来源

分段选中指示器复用了 `ly-gluesight` 最新获取的 main 提交 `99ab339` 中的 `src/components/SelectionTrack.tsx`；Snackbar 借鉴其暂停计时和替换提示的行为，移除了业务耦合。对话框沿用其标题、内容、操作区和抽屉布局，焦点处理交由 Radix。

工业扩展参考同一提交的 `InspectPage.tsx` 判定卡、`CycleStatus.tsx` 检测阶段、`ShotStrip.tsx / ShotTiles.tsx` 采集帧，提取为独立 React + TypeScript 组件。沿用 Qing Steel 的 OK 容器色、NG 实色、紫色故障、通道色与等宽数字；不包含相机连接、设备协议或业务判定引擎。
