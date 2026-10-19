# 版本记录

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
