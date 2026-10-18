# 版本记录

## 0.3.0

- 新增令牌：`--scrim`（对话框遮罩）、`--shadow-2`（浮层 / 提示气泡）、`--shadow-3`（对话框），深浅两套；`--text-verdict`（700 80px 等宽，产线大屏判定字）。`tokens.json` 的 `shadow` 组随之包含 1–3 三级。
- 新增组件：`.qs-dialog` 与 `.qs-scrim`（含 `.side` 右侧抽屉），`.qs-banner`（info / ok / warn / ng / fault / tertiary），`.qs-empty`，`.qs-stats` / `.qs-stat`，`.qs-progress`（条长写在 `--v`，scaleX 过渡）。进入动效只动 transform 与 opacity。
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
