# 版本记录

## 0.10.0

- 新增 `Steps` 路由步骤导航，支持编号、完成状态、可选标记及 `renderLink` 自定义客户端路由链接。
- 当前步骤使用 `aria-current="step"`，保留所有步骤的链接语义，不代替业务控制跳转权限。
- 复用 Button 与 StatusBadge 的交互和视觉样式；对现有组件无行为变更。

## 0.9.0

补齐 ly-gluesight 迁移到 React 组件时发现的能力缺口，并按统一的动效与样式约定逐组打磨。新参数均为可选，默认行为与 0.8.0 一致，例外见文末「升级注意」。

### 新增能力

- Button / IconButton：`href` 渲染为原生链接，`asChild` 包住路由 Link（支持 NavLink 的函数式 `className / style / children`）；禁用或加载时不导航、移出 Tab 序列并标记 `aria-disabled`。新增 `tone="warn"`，`danger` 等同于 `tone="danger"`。IconButton 新增 `size="xs"`（24 px），用于标题行。
- Chip：静态模式透传 `title` 等原生属性；新增 `label`（键 + 值两段）、`tone=ok / warn / ng / fault`、`size="sm"`。StatusBadge 新增 `neutral`（空心点），表示未亮、空闲、未开始。
- Card / Surface：`as` 指定元素，非 div 或带 `role` 时以标题命名区域；Card 新增 `description`、`headingLevel`，头部拆为标题、说明与右对齐的操作区。EmptyState 透传 `className` 等属性。
- Select：触发按钮带 `data-value`；选项 `label` 可为节点，并带 `textValue / aria-label`；位于禁用的 `<fieldset>` 内时不能打开。SegmentedControl、RadioGroup、Autocomplete 的选项支持节点标签或 `aria-label`。
- NumberField：`clamp={false}` 保留越界输入并标记无效，`rangeError` 自定义提示，`step` 支持 `'any'`。新增 FileInput：保留原生文件输入，支持拖放区、受控 `files`、表单重置与文件名、大小显示。
- SnackbarProvider：`placement`（top / bottom）、`container`（挂进宿主容器）、`max`（大于 1 时堆叠）。`useSnackbar` 在没有 Provider 时不再抛错，开发环境警告一次。
- Alert：`tertiary` 色调与 `className / role / icon`。Dialog / Drawer：`size`（sm / md / lg / xl）、`width`、`initialFocus`（ref、选择器或 `first-field`）。Tooltip：`pinnable`，点击后固定。
- Table：`getRowProps`（行级原生属性与 `tone` 语义色）；列的 `rowHeader / nowrap / colSpan`；`keepRowsWhileLoading` 刷新时保留上一次结果。行点击不响应行内控件，可聚焦的行支持 Enter / 空格。Pagination：`showPageSize={false}`。
- Accordion：`forceMount`（整组或单项）与 `ignoreFieldsetDisabled`。Popover：`openOn="hover"`、`role="tooltip"`、`delay`、`label`，`title` 改为可选。
- NavigationRail / NavigationDrawer：
  - `renderLink` 交给宿主路由链接渲染；
  - `collapsedLabels="visible"` 收起后显示小字标签；
  - `footerItems` 提供底部带选中态的导航项；
  - 分组带以组名命名的 `role="group"`，收起后显示分隔线；
  - `expandLabel / collapseLabel` 自定义切换按钮名称；
  - `contentRef` 让主内容随宽度切换做反向位移。

  AppBar `sticky` 吸顶后标记 `data-stuck`。
- 工业组件：
  - VerdictCard：结果可覆盖大字与副标题（局部超差显示大字 OK，NG 可细分副标题）；SN 进入头部和可访问名称，头部可放 PLC 码等信息；无结果文案可定制；`keepResultOnFault` 控制设备故障是否覆盖本件判定。
  - 新增 StatCounter / KpiGroup，用于产量、OK / NG / ERR 计数和良率：0 件不着色，标签不重复。
  - MeasurementReading：支持文字值、占位横线（`pendingLabel={null}`）和自定义千分位字符。
  - CameraThumbnail：
    - `keepPreview` 在待测、跳过时叠加状态，不替换预览；
    - `stateLabel` 自定义状态文案；
    - `width / previewHeight` 调整尺寸；
    - `renderPreview` 渲染宿主内容（如实时 canvas）；
    - 透传 `aria-*` 等原生属性。
- 新增令牌 `--ease-accel`，用于退出动效。

### 动效与样式

- 退出统一用 accel 缓动，且比进入更短；浮层、抽屉、遮罩、菜单、提示气泡、提示条退出一致；提示条替换改为交叉淡出淡入。
- 按钮与 Chip 按压只缩放 .98，不改圆角、不回弹。减少动态效果时不缩放，触屏不残留悬停层。
- 修正 React 下按钮与链接形态字重、字号不一致。
- 禁用态统一用禁用色角色，不再整体降低透明度。
- 输入、下拉、文本域、文件输入的悬停、聚焦、错误态统一；错误提示带图标；聚焦时标签变为主色。复选与单选改为自绘外观（保留原生 input）。分段控件、Tabs、Menu 的焦点环改为内嵌，键盘高亮与指针悬停区分。
- 表格：
  - 行悬停、按压加状态层；
  - 语义行有色条和浅底；
  - 排序指示改为双三角，整格表头可点；
  - 修复吸顶表头的分隔线；
  - 加载态改为主色线加行淡化。
- 折叠展开改为可打断的行高过渡，内容只做透明度与小位移。
- 导航展开收起只动 transform / opacity，过程可打断，导航项不重新挂载。
- 工业组件：
  - 判定切换时依次淡入，新 NG 只强调一次；
  - 检测阶段推进时，连接线先填满再点亮新阶段；
  - 读数数字随增减方向滚动，高频时直接显示最新值；
  - 帧带平滑显露选中帧，两端边缘渐隐。
- 不确定进度改为匀速平移或旋转；减少动态效果时显示静态段。

### 修复

- DatePicker / TimePicker 关闭动效期间打开另一个选择器时，焦点不再被拉回旧输入框导致新弹层关闭。
- 浏览器测试的定位与采样不再受展示页其他示例和并行负载影响。

### 升级注意

以下默认样式有变化，宿主覆写过相关样式的需要调整：

- 导航：
  - 底板改由内部层绘制，原先用 `.qs-navigation { background: … }` 覆写的，改用 `--navigation-surface`；
  - footer 改为纵向排列，原先在 footer 里并排放多个按钮的，需要自行包一层横向容器。
- 按钮：React 按钮字重统一为 500；IconButton `sm` 改为 30 px 正圆。
- 复选与单选改为自绘外观；禁用控件不再整体降低透明度。

## 0.8.0

- 统一浮层进入与退出、按钮按压及快速切换指示器动效，支持减少动态效果设置；滑块位置直接跟随输入。
- 优化时间选项索引、表格选择和排序、相机帧带尺寸测量与高频读数更新，保持现有接口和事件语义。
- 展示页按区域拆包，新增可启停的万行分页、8 路相机和 24 项读数压力场景及五轮生产构建性能对比报告。
- 筛选 Chip 开启态采用青色底、对应文字和细描边，强化深浅主题下的开关区分。
- 验证覆盖 49 项单元测试、11 项浏览器测试；详见 `docs/performance.md` 的实测结果与适用边界。

## 0.7.0

- 新增 React + TypeScript 组件入口、类型声明、主题容器和 `qing-steel/react.css`，覆盖基础输入、选择、导航、表格、分页、浮层、反馈与加载状态；保留原有 CSS / JS 导出。
- 新增工业组件：OK / NG 判定大卡、检测阶段、相机缩略图与帧带、测量读数及数字动效，支持工件结果隔离、缺失值、历史值和系统故障状态。
- 统一下拉菜单、分段控件与列表的选中配色；列表悬停覆盖整行，滑块支持跟随手柄的数值提示。
- 日期和时间选择器采用 Qing Steel 浮层，保留直接输入、原生表单校验与现有接口；支持键盘导航、时间确认/取消、秒精度和步长限制。
- 新增 `/showcase/` 交互展示、React 接入文档、库与展示页构建，以及 39 项单元测试和 9 项浏览器测试。展示页支持深浅主题与窄屏。
- React 组件需要 React / React DOM 18.2–19；浮层基于 Radix，日历基于 React DayPicker。包仍以 Git 依赖或发布附件安装，不发布到 npm registry。

## 0.6.0

- 明确常驻表面不加投影：导航、顶栏、卡片、面板和页面提示通过 surface 色阶分层；lv2 / lv3 只表示颜色层级。导航圆角统一使用上游 r-xl。
- 新增 `.qs-panel`、`.qs-popover`、`.qs-tooltip`：常驻面板无投影，临时菜单/下拉/预览与简短提示使用 shadow-2，对话框继续使用 shadow-3。宿主只负责业务布局与交互。
- 补齐原生 `dialog.qs-scrim` 盒模型与关闭态；popover / tooltip 清理原生浮层默认边框。没有增加主题令牌或 React 组件接口。
- 新增浅深主题表面角色示例 `demo/surfaces.html`，包含原生 popover 和 dialog。

## 0.5.0

- 新增原生数据表 `.qs-table`：表头、排序按钮、悬浮/选中行、等宽读数和语义颜色；排序、分页、虚拟滚动行为继续由宿主管理。
- 新增原生树行 `.qs-tree .item` 的选中、焦点与悬浮状态，宿主提供 ARIA 语义、键盘、层级与展开行为。
- 新增 `.qs-check` 原生复选/单选控件令牌配色，补充原生输入框禁用与错误状态；保留浏览器原生交互。

## 0.4.0

- 新增组件：`.qs-snackbars` / `.qs-snackbar` 全局提示（snackbar），用于瞬时的操作结果，浮在页面之上、不占布局。默认视口底部居中，`.top` 顶部居中；默认 inverse-surface，`ok` / `info` / `warn` / `ng` / `fault` 取对应 container 色，阴影取 `--shadow-2`。进入自外侧 12 px、.98 缩放淡入（medium / decel），加 `.out` 后回退淡出（short / standard），只动 transform 与 opacity；减少动态效果时由令牌归零与现有兜底关闭。
- `qs-motion.js` 新增 `snackbar(text, opts)`、`dismissSnackbar(el)` 与 `snackDuration(text)`：整页同一时刻一条，新提示替换旧提示（不论 `opts.host` 是否相同）；按文字长度自动消失（4–10 s），`opts.duration` 限制在 1–2147483647 ms，`opts.persistent` 不自动消失；指针悬停或焦点在提示内时暂停计时；可带一个文字操作与关闭按钮；离开时焦点在提示内则还给 `opts.returnFocus` 或打开提示时的焦点元素，不丢到 body。`opts.host` 只决定定位层的父元素（用于模态 `<dialog>`），不改变显示位置。定位层带 `role="status"` 与 `aria-live="polite"`。
- 演示页“提示条”一节新增全局提示示例。无破坏性变更。

## 0.3.0

- 新增令牌：`--scrim`（对话框遮罩）、`--shadow-2`（浮层 / 提示气泡）、`--shadow-3`（对话框），深浅两套；`--text-verdict`（700 80px 等宽，产线大屏判定字）。`tokens.json` 的 `shadow` 组随之包含 1–3 三级。
- 新增组件：`.qs-dialog` 与 `.qs-scrim`（含 `.side` 右侧抽屉），`.qs-banner`（info / ok / warn / ng / fault / tertiary），`.qs-empty`，`.qs-stats` / `.qs-stat`（最小列宽 `--stat-min`，默认 128px，6 个字符以内的读数不截断），`.qs-progress`（条长写在 `--v`，scaleX 过渡）。进入动效只动 transform 与 opacity。
- `.qs-verdict` 新增 `.xl`（取 `--text-verdict`）与 `warn` / `fault` / `idle` / `run` 四种状态，`.pulse` 呼吸点。
- `.qs-verdict .foot` 的底色改为 `currentColor` 14% 混色，不再写死黑色半透明；`.qs-nav .brand .mark` 圆角改用 `--r-sm`（10 → 8 px）。
- `qs-motion.js`：窗口缩放时的指示器重算合并到每帧最多一次。

## 0.2.0

- 新增 `package.json`，可作为 Git 依赖安装；导出 `qing-steel/tokens.css`、`qing-steel/components.css`、`qing-steel/qs-motion.js`、`qing-steel/tokens.json`。
- 相机识别色 `--cam-1` … `--cam-8` 改为冷色系，不再与 OK / 警告 / 故障 / NG 语义色撞色。**会改变已有界面的相机配色。**
- 新增禁用角色 `--on-surface-disabled`（on-surface 38%）与 `--disabled-container`（12%）。`.qs-btn` 禁用态改用这两个角色，不再整体降低透明度；支持 `aria-disabled="true"`。
- `.qs-btn` 用在 `<a>` 上时不再出现下划线。
- 字体栈：无衬线加入 `Microsoft YaHei UI`，等宽在 IBM Plex Mono 之后加入 `Cascadia Mono`。
- `scripts/build-tokens-json.mjs` 新增 `--check`，只校验不写文件；对应 `npm run check`。

## 0.1.0

- 首版：tokens、qs-* 组件样式、动效脚本、tokens.json 与演示页。
