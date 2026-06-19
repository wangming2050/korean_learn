# 音标界面重设计 — 接入说明

轻盈 reskin，**纯样式覆盖，不改任何 JS / DOM 结构 / 音频逻辑**。
原有功能（点击播放、示例单词、播放次数、行内展开详情、明暗主题）全部保留。

## 改动（仅 2 个文件）

1. **新增** `static/css/letters-redesign.css`
   音标页的全部新样式，作用域限定在 `#letters` / `#letterDetail`，不影响其它页面。
   沿用项目既有 CSS 变量（`--ink` / `--brand` / `--surface` / `--line` …），自动适配明暗主题。

2. **修改** `templates/index.html`
   在 `redesign.css` 之后、`vocab.css` 之前加了一行：
   ```html
   <link rel="stylesheet" href="/static/css/letters-redesign.css">
   ```
   （必须在 `style.css` 之后加载才能覆盖生效。）

## 接入方式

把本目录的 `static/css/letters-redesign.css` 复制到项目对应位置，
并把 `index.html` 里那一行 `<link>` 加上即可。`style.css` / `app.js` 未改动。

## 设计要点

- 顶部工具条：玻璃盒子 → 一行安静的内联控件（复选框改极简圆点）
- 分组：玻璃标题盒 → 左侧竖排标签 + 右侧字母，去掉彩色眉标
- 字母格子：玻璃卡（边框/模糊/阴影）→ 极简留白方块，单字回归近黑墨色，蓝色只在选中时点缀
- 详情面板：厚重玻璃 → 极浅蓝底 + 发丝边框 + 留白词卡，信息层级不变
