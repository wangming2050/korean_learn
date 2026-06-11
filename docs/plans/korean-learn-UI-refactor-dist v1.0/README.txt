Integration Notes - Korean Practice Frontend Redesign (zheng he shuo ming)
==========================================================================

把改版内容整合进本地 korean_learn 项目。
教材页只换视觉风格、保留原有阅读器与 AI 助教；
首页 / 词汇 / 句子改用新设计，词汇与句子重新接回后端真实数据与音频。

一、复制文件（覆盖本地同名文件）
--------------------------------
  templates/index.html          -> 覆盖
  static/css/redesign.css       -> 新增
  static/css/vocab.css          -> 覆盖（新增 .flashcard-example / .vocab-offline）
  static/css/scene.css          -> 覆盖（新增 .scn-offline / .scn-chip 等）
  static/js/app.js              -> 覆盖（见下方改动点）
  static/js/vocab-app.jsx       -> 新增
  static/js/sentence-app.jsx    -> 新增

  未改动、无需替换：static/css/style.css、static/js/word-audio-map.js 等。
  static 下的 audio/ textbooks/ 等资源保持原样，不要删除。

二、app.js 的改动点（已在本包内改好）
------------------------------------
  1. 启动任务去掉 loadScenes 与 loadVocabulary（这两页改由 React 应用加载）。
  2. #sceneSelect 与 #vocabSearch 的事件监听加了 ?. 空值保护。
  3. 启动失败提示由阻塞式 alert 改为 console.warn，离线/部分失败不再弹窗。
     （loadScenes / loadVocabulary 函数仍保留，未删除。）

三、数据与音频接法
------------------
  - 词汇页 -> GET /api/vocabulary，按词 id 合并"词 + 例句"；
    卡片背面显示词性与例句，播放优先用例句真实音频（window.playAudio），
    无音频时退回浏览器朗读。
  - 句子页 -> GET /api/scenes + GET /api/sentences，按 scene_id 分组；
    播放用 window.playAudio(url, start, end, loop, slow) 按片段播真实音频，
    支持"慢速 / 单句循环"。
  - 两个 React 应用都带离线兜底示例数据：连不到后端时显示示例并提示，
    部署到本地服务器后自动加载真实数据。

四、说明 / 取舍
---------------
  - 引入 React 18 + Babel（CDN，固定版本）。仅词汇、句子两页用到。
  - 后端无罗马音字段，新设计中的罗马音已去掉；词汇无独立音频，
    故用"例句音频 + 朗读兜底"。
  - 词汇"听音选词"模式因无词级音频，用浏览器朗读作发音。
