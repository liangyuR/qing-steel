# 青钢 QING / STEEL

> 青釉一样圆润的壳，钢尺一样精确的芯。

青钢是一套面向工业视觉软件的界面风格：把 Material 3 的色调分层、胶囊形状和柔和状态层，装进一个以等宽数字、明确单位和一眼可辨的 OK / NG 为核心的工业界面。圆润负责让人愿意长时间看，精确负责让人敢于相信它。

它最初为胶路视觉检测软件设计，用来替换「纯黑底 + 细边框网格」的通用后台观感；风格本身与业务无关，可以复用到任何需要长时间盯屏、读数值、判良次的工控 / 检测 / 监控界面。

- **在线演示**：<https://liangyur.github.io/qing-steel/demo/>（源码 [`demo/index.html`](demo/index.html)，本地直接用浏览器打开也可以）
- **CSS token**：[`css/tokens.css`](css/tokens.css)
- **组件样式**：[`css/components.css`](css/components.css)
- **动效脚本（可选）**：[`js/qs-motion.js`](js/qs-motion.js)
- **JSON token**：[`tokens.json`](tokens.json)（由 `css/tokens.css` 生成）

---

## 五条原则

1. **分层靠明度，不靠边框。**
   五级 surface 容器用亮度差区分层级，1px 边框只留给输入框和表格线。细边框网格是长时间注视下最先让眼睛疲劳的东西，也是「通用后台模板」感的来源。

2. **两种形状，两种含义。**
   能按的东西是胶囊（按钮、Chip、分段按钮、导航指示器），装数据的东西是圆角矩形（卡片 16，面板 28）。形状本身告诉操作员哪里能点，不必依赖颜色或悬停。

3. **数字是仪表读数，不是正文。**
   所有测量值用等宽 tabular 数字，单位紧随其后，同列右对齐。`0.79` 与 `3.0` 的差别必须在两米外一眼读出，这是工业侧最不能让步的地方。

4. **语义色独立于品牌色，NG 实色、OK 容器色。**
   判定永远用绿 / 红 / 琥珀 / 紫四色，不与青色主色争抢注意力。NG 用实色填充、OK 用柔和容器色，因为产线上要找的是坏件，不是好件。系统故障用紫色，与产品 NG 的红色分开。

5. **动效回答两个问题：什么变了，从哪来到哪去。**
   导航胶囊从旧项滑到新项、分段底色滑向新选项、cycle 连接线从左向右填满、NG 从下方滑入并顶一下、缺陷描述从行内展开——每个动画都对应一次状态或位置的变化，操作员不用重新找目光落点。没有变化就没有动画：不做入场表演、不做装饰循环（唯一例外是当前阶段的呼吸点）；时长只有 120 / 240 / 400 ms 三档，超过 400 ms 就是在让操作员等。同屏只允许一个强调动画。

---

## 颜色角色

种子色 `#0F819E`（青），按 M3 tonal 规则推导 primary / secondary / tertiary 及其 container；中性色向青偏约 4° 色相，避免发灰。四个语义色各自独立推导，深浅两套都按 WCAG AA 对比度校核。**深色是默认主题**（车间），浅色用于办公室和调试。

### 品牌

| 角色 | 深色 | 浅色 | 用途 |
| --- | --- | --- | --- |
| `primary` / `on-primary` | `#7FD4F0` / `#00363F` | `#006782` / `#FFFFFF` | 页面主操作（一屏至多一个 filled 按钮）、当前 cycle 阶段 |
| `primary-container` / `on-…` | `#004E63` / `#B9EBFF` | `#B9EBFF` / `#001F29` | 导航选中胶囊、选中帧、FAB |
| `secondary-container` / `on-…` | `#344A52` / `#D2E5EC` | `#CEE6EF` / `#071E25` | tonal 默认按钮、分段选中底色、已完成阶段 |
| `tertiary-container` / `on-…` | `#5B4315` / `#FFE2B8` | `#FFDDB0` / `#271900` | 离线 / 候选版本等「非常规模式」提示 |

### Surface 与 outline

| 角色 | 深色 | 浅色 | 用途 |
| --- | --- | --- | --- |
| `surface` | `#0F1417` | `#F5FAFD` | 页面底（不是纯黑） |
| `surface-lowest` | `#0A0E11` | `#FFFFFF` | 输入框、图像画布 |
| `surface-low` | `#171C1F` | `#EFF4F7` | 卡片 / 面板默认层、导航栏 |
| `surface-mid` | `#1B2124` | `#E9EEF1` | 嵌套一层、列表项 |
| `surface-high` | `#262B2F` | `#E3E8EB` | 嵌套两层、Chip、徽章 |
| `surface-highest` | `#30363A` | `#DDE3E6` | 计数徽标、轨道 |
| `on-surface` / `on-surface-variant` | `#DEE3E7` / `#B3BFC6` | `#171C1F` / `#40484D` | 正文 / 次要文字 |
| `outline` / `outline-variant` | `#83909A` / `#3A4750` | `#70787D` / `#BFC8CD` | outlined 控件描边 / 输入框与表格线 |
| `state-hover` / `state-pressed` | 8% / 12% `on-surface` | 8% / 12% `on-surface` | 半透明状态层，叠在任意底色上 |
| `on-surface-disabled` / `disabled-container` | 38% / 12% `on-surface` | 38% / 12% `on-surface` | 禁用控件的文字 / 填充；描边、文字、图标类按钮只换文字色 |

### 语义色（独立于主色）

| 语义 | 深色 实色 / container | 浅色 实色 / container | 规则 |
| --- | --- | --- | --- |
| OK `ok` | `#5EE19A` / `#0B3B25` | `#157A47` / `#C7F3DA` | 判定卡、列表行用 container，克制 |
| NG `ng` | `#FF5C5C` / `#6B1414` | `#C62828` / `#FFDAD6` | 判定卡、NG Chip 用**实色**，NG 列表行整行 container |
| 警告 `warn` | `#FFC247` / `#4A3400` | `#7A5300` / `#FFE2A8` | 接近阈值、心跳变慢 |
| 故障 `fault` | `#E08CFF` / `#4A1A5E` | `#7B2DA0` / `#F0D7FF` | 系统 / 设备故障，与产品 NG 分离 |

每个语义色都有成对的 `on-*` 与 `on-*-container`，见 `css/tokens.css`。另有 `--cam-1` … `--cam-8` 八个相机 / 通道识别色：取青、蓝、靛、紫蓝一组冷色，不与 OK 绿、警告琥珀、故障紫、NG 红撞色（浅色主题降低明度），以及 `--glue`（图像上的胶路 / 目标描边色）。

---

## 形状、字号、间距

### 形状

| token | 值 | 用于 |
| --- | --- | --- |
| `--r-xs` | 4 | 表格单元、工具提示 |
| `--r-sm` | 8 | 缩略图内图、代码块 |
| `--r-md` | 12 | 输入框、列表项；胶囊按下时收到这个值 |
| `--r-lg` | 16 | 卡片、FAB |
| `--r-xl` | 28 | 面板、判定大卡 |
| `--r-full` | 999 | 按钮、Chip、分段、导航指示器、徽章 |

### 字体与字号

中文 `Noto Sans SC`，数字 / 代码 `IBM Plex Mono`（字形直、零带点、1 / l / I 可辨，有仪表气质而不像终端）。所有数字 `font-variant-numeric: tabular-nums`。

| token | 规格 | 示例 |
| --- | --- | --- |
| `--text-display` | 700 32 / 40 | 页面大标题 |
| `--text-headline` | 700 24 / 32 | 配方名、章节 |
| `--text-title` | 700 18 / 26 | 顶栏标题、卡片组标题 |
| `--text-body` | 400 14 / 22 | 正文 |
| `--text-label` | 400 12 / 16 | 标签、说明 |
| `--text-data-lg` | 600 28 / 36 mono | 关键读数 |
| `--text-data` | 400 14 / 22 mono | SN、时间、测量值 |

字体栈带完整回退：`"IBM Plex Mono", "Cascadia Mono", "JetBrains Mono", "SFMono-Regular", Menlo, Consolas, "Noto Sans Mono", monospace` 与 `"Noto Sans SC", "Microsoft YaHei UI", "Microsoft YaHei", "PingFang SC", "Source Han Sans SC", system-ui, sans-serif`。Windows 工控机未装 IBM Plex Mono 时落到系统自带的 Cascadia Mono。**tokens.css 不加载任何网络字体**，离线时直接落到系统字体。

### 间距与密度（4 px 基准）

`--space-4 / 8 / 12 / 16 / 20 / 24 / 32`。

| token | 值 | 说明 |
| --- | --- | --- |
| `--ctl-h` / `--ctl-h-sm` | 36 / 30 | 控件高 |
| `--row-h` | 44 | 列表项高 |
| `--header-h` | 60 | 顶栏 |
| `--sidebar-w` / `--sidebar-w-rail` | 220 / 72 | 导航展开 / rail |
| `--page-pad` / `--panel-gap` | 20 / 16 | 页面内边距 / 面板间距 |

> **密度约束**：圆角和 surface 分层会诱使页面加大内边距、拉开行距——不要。控件 36、列表项 44、页面内边距 20、面板间距 16 是硬约束；胶囊按钮比直角按钮左右各多占约 6 px，密集工具栏优先用 icon 按钮和 `sm` 尺寸。

---

## 动效

### Token

| token | 值 | 用于 |
| --- | --- | --- |
| `--dur-short` | 120 ms | 状态层、勾选出现、文字淡出 |
| `--dur-medium` | 240 ms | 位置移动、底色过渡、展开收起 |
| `--dur-long` | 400 ms | 仅一处：NG 出现的一次强调；也是单个动画的上限 |
| `--dur-breath` | 1600 ms | 唯一的循环：当前阶段呼吸点，opacity 1 → .55 |
| `--ease-spatial` | `cubic-bezier(.38, 1.21, .22, 1)` | 轻微回弹。位置与形状：导航胶囊、分段底色、选框、按钮回弹 |
| `--ease-standard` | `cubic-bezier(.2, 0, 0, 1)` | 无回弹。颜色、透明度、宽度、展开收起、主题切换 |
| `--ease-decel` | `cubic-bezier(.05, .7, .1, 1)` | 进入类：文字滑入、连接线填充、数值滚动 |

### 点位表

| 触发条件 | 动画 | 时长 / 曲线 |
| --- | --- | --- |
| 导航选中项变化 | 胶囊指示器从旧项平移到新项；rail 态下缩为 44×28 | medium / spatial |
| 导航展开 ⇄ 收起 | 文字先淡出 → 宽度 220 ⇄ 72 → 文字淡入；文字 nowrap，只裁不挤 | short → medium → short，standard |
| 分段按钮选中 | 选中底色滑到新项并伸缩；勾选从 0 缩放出现 | medium / spatial；勾选 short / spatial |
| 按钮 / Chip / 导航项按下 | scale .97 + 圆角 full → 12，松手回弹；状态层叠色保留 | 按下 short / standard，回弹 medium / spatial |
| cycle 阶段推进 | 连接线从左向右填满 → 新阶段底色过渡、宽度微增 → 上一阶段 ✓ 缩放出现 | medium / decel、medium / standard、short / spatial |
| 整件判定变化 | 文字上滑淡出 → 底色交叉过渡 → 新文字从下方依次滑入；变为 NG 时整卡 1.02 回落一次 | short → medium → medium / decel；强调 long / spatial，不循环 |
| 列表某段变 NG / 恢复 | 行底色过渡；缺陷描述 `grid-template-rows: 0fr → 1fr` 展开，文字稍后淡入 | medium / standard |
| 帧缩略图选择 | 描边过渡；总览图选框平移伸缩到新帧；hover 抬起 2px | medium / standard、medium / spatial；hover short |
| 测量值更新 | 只有变化的字符位纵向滚动，未变的不动；相同值不触发 | medium / decel |
| 主题切换 | View Transition 整页交叉淡入；不支持时直接切换 | medium / standard |
| 当前阶段（持续） | 呼吸点 opacity 1 → .55；同屏唯一循环动画 | breath / standard |
| `prefers-reduced-motion` | 时长 token 归零 + 全部过渡与动画关闭；导航折叠不分步，数值直接替换 | — |

---

## 组件

全部在 `css/components.css`，类名前缀 `qs-`，颜色只取 token。

| 组件 | 类名 | 要点 |
| --- | --- | --- |
| 按钮 | `.qs-btn` + `tonal` / `outlined` / `text` / `danger` / `danger-tonal` / `sm` / `icon`，`.qs-fab` | filled 只给页面主操作；tonal 是默认；danger 实色只给不可逆动作；禁用取 `disabled-container` / `on-surface-disabled`；可直接用在 `<a>` 上，禁用链接写 `aria-disabled="true"` |
| Chip | `.qs-chip` + `action` / `outlined` / `selected` / `frame` / `ok` / `ng` / `warn` / `fault` / `tertiary` | `action` 才可点；NG Chip 实色加粗 |
| 分段按钮 | `.qs-seg`（`sm`），`button[aria-pressed]` | 脚本加 `.ind` 后选中底色滑动；不加脚本时静态高亮 |
| 输入框 | `.qs-field` > `label` + `.qs-input`（`num` 右对齐等宽） | 唯一保留 1px 线的控件；`.unit` 放单位 |
| 导航 | `.qs-nav`（`rail`），`.item[aria-current="page"]` | 展开 220 / rail 72；胶囊指示器；底部状态与折叠按钮 |
| 顶栏 | `.qs-top` | 标题 + 面包屑 + 右侧徽章与操作 |
| 卡片 | `.qs-card`（`lv2` / `lv3`） | 嵌套按 low → mid → high 递进，无边框 |
| 状态徽章 | `.qs-badge` + `ok` / `ng` / `warn` / `fault` / `off` | 圆点 + 文字 + 等宽数值 |
| cycle 阶段 | `.qs-cycle` > `.ph`（`done` / `cur` / `fault`）+ `.ln` | 当前阶段 primary 实色 + 呼吸点；故障与主链路脱开，进入时才染紫 |
| 判定大卡 | `.qs-verdict.ok` / `.ng` | NG 实色最醒目；切换时序由脚本驱动 |
| 测量段列表 | `.qs-segs` > `.seg.ok` / `.seg.ng` | NG 行整行填色并展开缺陷描述 |
| 缩略图 | `.qs-thumbs` > `.qs-thumb`（`active`） | 带相机色点与 OK / NG 标记 |
| 键值读数 | `.qs-kv` | 小标签 + 等宽读数 |
| 数值滚动 | `.qs-odo` | 由 `QingSteel.setOdo()` 生成字符位 |
| 工具类 | `.qs-num`、`.qs-ic` | 等宽数字；24 网格线性图标 |

完整的 HTML 结构请直接看演示页源码，每个组件都有可交互实例。

---

## 使用

### 作为依赖安装

用版本标签固定到某一版（pnpm / npm 均支持 Git 依赖）：

```bash
pnpm add github:liangyuR/qing-steel#v0.2.0
```

```js
import "qing-steel/tokens.css";      // 必选：颜色、字号、形状、间距、动效 token
import "qing-steel/components.css";  // 可选：qs-* 组件样式
import "qing-steel/qs-motion.js";    // 可选：动效脚本
```

只做深色界面的应用在 `<html>` 上写 `data-theme="dark"`，避免系统为浅色时跟随切换。版本变化见 [`CHANGELOG.md`](CHANGELOG.md)。

### 直接引用

```html
<html lang="zh-CN">   <!-- 无 data-theme：跟随系统，系统未声明时为深色 -->
<head>
  <link rel="stylesheet" href="css/tokens.css">
  <link rel="stylesheet" href="css/components.css">
  <!-- 可选：联网时加载字体，非阻塞；离线自动回退 -->
  <link rel="stylesheet" media="print" onload="this.media='all'"
        href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Noto+Sans+SC:wght@400;500;700&display=swap">
</head>
<body>
  <div class="qs-seg" role="group" aria-label="视图">
    <button type="button" aria-pressed="true">整件</button>
    <button type="button" aria-pressed="false">单帧</button>
  </div>
  <script src="js/qs-motion.js"></script>
  <script>document.querySelectorAll('.qs-seg').forEach(QingSteel.bindSeg);</script>
</body>
```

### 主题三态

```html
<html>                     <!-- 跟随系统 -->
<html data-theme="dark">   <!-- 强制深色 -->
<html data-theme="light">  <!-- 强制浅色 -->
```

```js
QingSteel.restoreTheme('my-app-theme');                       // 页面加载时恢复
QingSteel.setTheme('light', { storageKey: 'my-app-theme' });  // '' / 'dark' / 'light'
```

局部预览另一主题：给容器加 `.qs-scheme-dark` / `.qs-scheme-light`。

### qs-motion.js

| 方法 | 作用 |
| --- | --- |
| `bindSeg(el)` / `segUpdate(el, instant)` | 分段按钮单选 + 选中底色滑动，派发 `qs-change` |
| `bindNav(el)` / `navUpdate(el)` / `navToggleRail(el)` | 导航胶囊指示器、展开 ⇄ rail 分步切换，派发 `qs-change` |
| `setOdo(el, text)` | 数值只滚变化的字符位 |
| `swapVerdict(el, render, toNg)` | 判定卡淡出 → `render(el)` → 滑入，变 NG 时强调一次 |
| `setTheme(value, opts)` / `restoreTheme(key)` | 主题切换（View Transition）与恢复 |
| `relayout(scope)` | 尺寸变化后重算指示器（字体加载与 resize 已自动调用） |

脚本是可选的：不引入时所有组件仍然正确显示选中态，只是没有位移动画。在 React / Vue 中，可在 effect / mounted 里对对应 DOM 调用这些方法，或按同样的时序自行实现。

### 离线字体

工控机通常不联网。生产环境建议把字体随应用打包（例如 `@fontsource/noto-sans-sc`、`@fontsource/ibm-plex-mono`），字体族名保持 `Noto Sans SC` / `IBM Plex Mono` 即可直接命中 token 里的字体栈。

### tokens.json

`css/tokens.css` 是唯一来源。修改后运行：

```bash
npm run tokens   # 重新生成 tokens.json
npm run check    # 只校验 tokens.json 是否与 css/tokens.css 一致
```

脚本会同时校验「强制浅色」与「跟随系统浅色」两个声明块是否一致。

---

## 目录

```
css/tokens.css          颜色角色（深 / 浅）、字号、形状、间距、尺寸、动效 token
css/components.css      qs-* 组件样式与减少动态效果兜底
js/qs-motion.js         可选的动效辅助脚本，无依赖
tokens.json             W3C Design Tokens 草案格式，供其他工具链消费
demo/index.html         完整样张：主张、token、组件、两个 1440×880 屏幕、接入说明
scripts/                tokens.json 生成与校验脚本
package.json            包信息与导出路径（tokens.css / components.css / qs-motion.js / tokens.json）
CHANGELOG.md            版本记录
```

## 说明

演示页中的工件 SN、配方名（如 `ROBOT-DEMO`）、IP 地址、时间、测量值和工作流均为**示例数据**，不对应任何真实产线或设备。
