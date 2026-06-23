# Korean Learn 技术设计文档

更新日期：2026-06-22

## 1. 文档目标

本文档用于说明 Korean Learn 当前项目的技术架构、核心模块实现方式、数据流、部署方式和后续技术演进方向。

## 2. 当前技术栈

### 2.1 Web 后端

当前 Web 后端不是 Flask、FastAPI 或 Django，而是基于 Python 标准库 `http.server` 实现的轻量服务。

核心文件：

- `server.py`：HTTP 服务入口，请求接收、静态文件、登录校验、基础路由。
- `router.py`：API 分发。
- `db.py`：MySQL 连接和 SQL 执行封装。
- `handler/scene.py`：场景接口。
- `handler/sentence.py`：句子、音标、词汇接口。
- `handler/pdf_assistant.py`：教材 PDF AI 助教接口。
- `handler/tts.py`：服务端韩语 TTS 接口。
- `handler/material.py`：旧版教材资料 CRUD，目前不在主路由里暴露。

### 2.2 Web 前端

当前 Web 前端是原生 HTML/CSS/JavaScript 加部分 React/Babel 组件的混合结构。

核心文件：

- `templates/index.html`：用户端主页面。
- `templates/admin.html`：管理后台页面。
- `static/js/app.js`：主业务逻辑，包括音标、教材 PDF、AI 助教、音频、主题等。
- `static/js/vocab-app.jsx`：词汇页面 React 组件。
- `static/js/sentence-app.jsx`：例句页面 React 组件。
- `static/css/*.css`：页面样式。

### 2.3 数据库

当前使用 MySQL，Python 侧通过 `pymysql` 连接。

核心文件：

- `sql/schema.sql`：本地数据库初始化脚本。
- `sql/schema-cloud.sql`：云端数据库初始化脚本。
- `db.py`：读取环境变量并建立连接。

当前主要数据表：

- `scene`：场景。
- `sentence`：句子。
- `vocabulary`：词汇。
- `material`：旧版教材资料表。

### 2.4 移动端

当前移动端是 Expo + React Native。

核心目录：

- `mobile/App.tsx`：移动端主应用。
- `mobile/src/api/webData.ts`：从 Web API 拉取数据，并提供本地兜底数据。
- `mobile/src/data/learning.ts`：移动端学习数据类型。
- `mobile/src/theme/tokens.ts`：移动端主题 token。

关键依赖：

- `expo`
- `react-native`
- `expo-audio`
- `expo-speech`
- `expo-document-picker`
- `@expo/vector-icons`

当前 iPhone 和 iPad 不是两套项目，而是同一套 Expo/React Native 应用根据屏幕宽度适配。

### 2.5 PDF、AI、TTS

PDF：

- Web 端使用 PDF.js。
- 用户上传 PDF 后，浏览器本地解析。
- 页图和文本缓存到 IndexedDB。

AI：

- 当前教材 AI 助教由 `handler/pdf_assistant.py` 提供。
- 支持 Gemini 和 OpenAI。
- 默认 Gemini 模型是 `gemini-2.5-flash`。
- 当前代码未实现 DeepSeek provider。

TTS：

- 当前由 `handler/tts.py` 代理 Google Cloud TTS。
- 默认韩语声音是 `ko-KR-Neural2-A`。
- 生成音频缓存在 `static/generated-audio/`。
- 未配置 TTS key 时，前端可退回浏览器朗读。

### 2.6 部署

当前线上部署主要是 Railway。

相关文件：

- `Procfile`
- `railway.json`
- `railway-start.sh`
- `nixpacks.toml`
- `DEPLOY.md`

数据库使用 Railway MySQL。`server.py` 会读取 `PORT`，线上通常监听 `0.0.0.0`。

## 3. 总体架构

### 3.1 Web 请求链路

用户访问 Web 页面时，请求大致经过：

```text
浏览器
  -> server.py
  -> 静态页面 / 静态资源 / API
  -> router.py
  -> handler/*
  -> db.py / 静态文件 / AI 服务 / TTS 服务
  -> 返回 JSON、HTML、CSS、JS、图片或音频
```

其中：

- 页面入口 `/` 返回 `templates/index.html`。
- `/static/...` 由 `server.py` 返回静态文件。
- `/api/...` 进入 `router.py` 分发。
- POST、PUT、DELETE 默认要求管理员登录，少数公开接口例外。

公开例外接口包括：

- `/api/admin/login`
- `/api/admin/logout`
- `/api/pdf-assistant/chat`
- `/api/pdf-assistant/extract-toc`
- `/api/tts/synthesize`

### 3.2 API 分发结构

`router.py` 当前分发规则：

```text
/api/scenes
  -> handler/scene.py

/api/sentences
/api/letters
/api/vocabulary
  -> handler/sentence.py

/api/pdf-assistant
  -> handler/pdf_assistant.py

/api/tts
  -> handler/tts.py
```

注意：

- `handler/material.py` 存在，但当前没有在 `router.py` 中接入 `/api/materials`。
- 用户端教材主流程已切换为本地 PDF 上传，不依赖旧版 `material` 表。

### 3.3 三端关系

当前三端关系：

```text
Web
  当前主产品，承载完整学习页面、教材 PDF、AI 助教、后台管理。

iPhone App
  Expo/React Native 原型，通过 Web API 读取数据。

iPad App
  与 iPhone 使用同一套移动端代码，未来按大屏布局扩展教材工作台。
```

当前没有账号体系，所以三端还不能同步个人学习记录。移动端所谓“同步”主要是读取同一个 Web API 数据源，而不是用户维度的进度同步。

## 4. 数据架构

### 4.1 MySQL 数据

当前 MySQL 表结构如下：

```text
scene
  id
  name
  en

sentence
  id
  korean
  chinese
  situation
  audio_url
  audio_start
  audio_end
  scene_id

vocabulary
  id
  korean
  chinese
  pos

material
  id
  title
  chapter
  audio_url
  content
```

当前特点：

- `scene` 和 `sentence` 支持后台维护。
- `vocabulary` 主要来自种子数据和查询接口。
- `material` 是旧版教材资料表，和当前用户自上传 PDF 主流程不是一套。
- 词汇、句子、音频数据仍需要进一步清洗和标准化。

### 4.2 静态数据和静态资源

当前静态资源包括：

- 前端 JS、CSS。
- 音标 mp3。
- 词汇音频映射。
- 教材历史静态索引或测试资源。
- PDF.js vendor 文件。

静态音频主要由前端直接播放，路径通常是 `/static/audio/...`。

### 4.3 浏览器本地数据

Web 教材 PDF 使用浏览器本地能力：

- IndexedDB：缓存用户上传 PDF 的页图、文本、目录等数据。
- localStorage：保存主题、AI 助教历史视图状态等轻量 UI 状态。

当前用户上传 PDF 不会上传到服务器，也不会保存到 Railway、Git 或 R2。

### 4.4 TTS 缓存

Google TTS 生成的音频会保存在：

```text
static/generated-audio/
```

该目录已被 Git 忽略。

风险：

- 如果部署平台文件系统不可持久化，重启后缓存可能丢失。
- 如果频繁重新生成，会增加 TTS 调用成本。
- 不适合作为长期标准音频素材库。

### 4.5 未来需要新增的数据

如果要做 Web、iPhone、iPad 真实同步，需要新增：

- `user`
- `user_session`
- `user_textbook`
- `textbook_page`
- `reading_progress`
- `vocabulary_progress`
- `letter_practice_record`
- `sentence_practice_record`
- `note`
- `annotation`
- `favorite`
- `ai_chat_history`

这些表目前还没有实现。

## 5. 模块技术实现

### 5.1 音标模块

#### 当前实现

后端：

- `/api/letters` 由 `handler/sentence.py` 提供。
- 返回 `KOREAN_LETTERS` 常量。
- 每条数据包含音标、示范词、中文含义、音标音频地址、示范词音频地址。

前端：

- 主要逻辑在 `static/js/app.js`。
- `LETTER_DETAILS` 存放音标详情、发音技巧、示例词和对比说明。
- `PHONETIC_SECTIONS` 负责把音标组织成辅音、元音、收音、双收音。
- `templates/index.html` 提供播放控制：音标、示例单词、播放次数。

移动端：

- `mobile/src/api/webData.ts` 也有 `LETTER_DETAILS` 和 `PHONETIC_SECTIONS`。
- 移动端会请求 `/api/letters`，再合并本地详情配置。
- Web API 不可用时走本地兜底数据。

#### 播放逻辑

Web 端音标播放逻辑大致是：

```text
用户点击音标
  -> 根据播放设置生成队列
  -> 优先播放 letter_audio_url 静态 mp3
  -> 示例词优先播放映射音频
  -> 无音频时调用 /api/tts/synthesize
  -> TTS 失败时使用浏览器 SpeechSynthesis 兜底
```

当前移动端需要特别注意：

- 移动端没有 Web 上完整的播放配置入口。
- 移动端默认不应强制读“音标 + 词汇”并播放多遍。
- 移动端应默认播放 1 次音标，词汇不自动朗读，除非用户进入详情主动点击。

#### 后续演进

- 统一 Web 和移动端音标详情数据来源，避免两端各维护一份。
- 将音标内容从 JS 常量迁移到结构化 JSON 或数据库。
- 将真人标准音频作为核心音频来源。
- TTS 只作为兜底，不作为教学标准音。

### 5.2 词汇模块

#### 当前实现

后端：

- `/api/vocabulary` 由 `handler/sentence.py` 提供。
- 支持查询词汇。
- 数据来自当前项目的种子词汇和查询逻辑。

Web 前端：

- `templates/index.html` 中存在词汇容器。
- `static/js/vocab-app.jsx` 负责词汇页面渲染。

移动端：

- `mobile/src/api/webData.ts` 请求 `/api/vocabulary`。
- `mobile/App.tsx` 展示词汇相关页面。

#### 当前限制

- 没有用户登录，所以“未学习、待复习、已掌握”等状态不能算真实个人学习记录。
- 词汇数据存在继续校对的必要，包括重复词、错词、教材来源和词性。

#### 后续演进

- 增加词汇学习状态表。
- 建立词汇和教材页、句子、收藏之间的关系。
- 支持跨端同步学习状态。
- 建立词汇数据清洗流程。

### 5.3 例句模块

#### 当前实现

后端：

- `/api/scenes` 由 `handler/scene.py` 提供。
- `/api/sentences` 由 `handler/sentence.py` 提供。
- `sentence` 表支持音频 URL、开始时间、结束时间和所属场景。

Web 前端：

- `static/js/sentence-app.jsx` 渲染例句和场景练习。
- 如果句子有音频，会调用全局音频播放能力。
- 如果没有音频，可走浏览器韩语朗读兜底。

移动端：

- `mobile/src/api/webData.ts` 请求场景和句子数据。
- `mobile/App.tsx` 有场景和句子练习页面。

#### 后续演进

- 将句子音频素材补齐。
- 支持逐句跟读。
- 支持录音和回放。
- 支持发音反馈，但需要谨慎设计评分逻辑。

### 5.4 教材模块

#### 当前实现

Web 端教材页当前采用“用户自上传 PDF”方案。

主要流程：

```text
用户上传 PDF
  -> 前端 PDF.js 解析
  -> 生成低清 / 高清页图
  -> 提取文本层
  -> 保存到 IndexedDB
  -> 页面展示页图
  -> 支持目录、页码跳转、上一页、下一页
```

核心位置：

- `templates/index.html`：教材页面结构。
- `static/js/app.js`：PDF 上传、解析、缓存、目录、阅读器、AI 助教逻辑。

#### 当前限制

- PDF 解析性能取决于浏览器、设备性能和 PDF 文件本身。
- 大 PDF 会带来加载慢、转换慢、存储压力大等问题。
- 用户 PDF 只存在当前浏览器本地，换设备不会自动出现。
- 移动端教材 PDF 上传和批注能力还没有达到 Web 主流程水平。

#### 后续演进

- 用户账号体系完成后，设计用户教材云同步。
- iPad 端增加 PDF 阅读、划线、手写、批注、笔记。
- 教材页和词汇、句子、音频、AI 历史联动。
- 对大 PDF 做章节拆分或增量渲染优化。

### 5.5 AI 助教模块

#### 当前实现

后端：

- `/api/pdf-assistant/chat`
- `/api/pdf-assistant/extract-toc`

核心文件：

- `handler/pdf_assistant.py`

当前 provider：

- Gemini。
- OpenAI。

默认配置：

- `AI_PROVIDER=gemini`
- `GEMINI_MODEL=gemini-2.5-flash`
- `OPENAI_MODEL=gpt-4.1-mini`

#### 当前页问答数据流

```text
用户在教材页提问
  -> 前端收集当前页和相邻页文本
  -> 如果当前页文本太少或乱码，附带当前页截图
  -> POST /api/pdf-assistant/chat
  -> 后端调用 Gemini 或 OpenAI
  -> 返回回答
  -> 前端渲染为 AI 助教消息
```

目录识别数据流：

```text
前端读取 PDF 内置目录
  -> 如果没有目录，扫描前几页文本
  -> 如果文本层不可用，发送候选目录页截图给 Gemini
  -> 后端返回目录结构
```

#### 当前限制

- 当前代码没有 DeepSeek provider。
- OCR 或视觉模型可能识别错误。
- AI 回答仍需做排版净化，避免 Markdown 标记如 `###`、`**` 直接污染 UI。
- 用户截图和页面文本会发送给第三方模型服务，需要隐私提示。

#### 后续演进

- 明确 DeepSeek、Gemini、OpenAI 的分工。
- 教材页视觉问答建议优先使用 Gemini 2.5 Flash。
- 纯文本问答可评估 DeepSeek。
- 增加 AI 请求日志、错误处理、重试和用户提示。
- 增加回答内容的结构化渲染规则。

### 5.6 音频与 TTS 模块

#### 当前实现

静态音频：

- 音标和部分词汇可通过 `/static/audio/...` 直接播放。
- 服务端静态文件发送支持 Range header，适合音频 seek。

TTS：

- `/api/tts/synthesize` 由 `handler/tts.py` 提供。
- 后端调用 Google Cloud TTS。
- 成功后返回生成音频 URL。
- 前端拿 URL 播放，不暴露 TTS key。

浏览器兜底：

- TTS 不可用时，前端可调用浏览器 SpeechSynthesis 韩语朗读。

#### 当前限制

- TTS 发音速度和准确度不一定适合四十音教学。
- 生成音频缓存不适合作长期标准素材。
- 真人标准音频的采集和命名规范还需要完善。

#### 后续演进

- 四十音本身使用真人标准音。
- 示例词也逐步替换为真人标准音。
- 数据库或 JSON 中只存音频 URL，不直接存音频内容。
- 音频文件长期放对象存储或 CDN。

### 5.7 移动端模块

#### 当前实现

移动端技术栈：

- Expo。
- React Native。
- TypeScript。
- `expo-audio`。
- `expo-speech`。
- `expo-document-picker`。

启动方式：

```bash
cd mobile
nvm use 20
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000 npm run ios -- --clear
```

数据读取：

```text
mobile/App.tsx
  -> fetchWebLearningData()
  -> mobile/src/api/webData.ts
  -> Web API
  -> 失败时 getFallbackLearningData()
```

#### 当前定位

移动端当前是原型和对齐阶段，不是完整成熟 App。

当前应该优先解决：

- 音标页面 UI 与设计稿对齐。
- 音标详情页与 Web 数据一致。
- 词汇和教材基础内容与 Web 一致。
- 移除不应给用户看到的原型说明文案。
- 适配 iPhone 和 iPad。

#### 后续演进

- 账号同步。
- 本地离线数据。
- iPad 教材工作台。
- 移动端 PDF 上传、阅读、批注。
- 移动端 AI 问页。
- App Store 或 TestFlight 流程。

### 5.8 管理后台

#### 当前实现

入口：

- `/admin/login`
- `/admin`
- `/admin/scene`
- `/admin/sentence`

功能：

- 管理员登录。
- 场景管理。
- 句子管理。

权限：

- POST、PUT、DELETE 请求默认需要管理员 session。

#### 当前限制

- 后台能力还比较基础。
- 没有完整内容审核流程。
- 教材资料旧接口和当前用户上传 PDF 主流程不一致。

#### 后续演进

- 增加词汇管理。
- 增加音标内容管理。
- 增加音频资源管理。
- 增加数据校对状态。
- 增加后台操作日志。

## 6. 部署与环境变量

### 6.1 本地启动

Web：

```bash
python server.py
```

或指定端口：

```bash
HOST=0.0.0.0 PORT=8000 python server.py
```

移动端：

```bash
cd mobile
nvm use 20
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000 npm run ios -- --clear
```

如果是实体机，需要把 `127.0.0.1` 改成 Mac 的局域网 IP。

### 6.2 数据库环境变量

`db.py` 使用 `load_dotenv()` 读取 `.env`，并兼容 Railway MySQL 环境变量。

常见变量：

```text
MYSQL_HOST
MYSQL_PORT
MYSQL_USER
MYSQL_PASSWORD
MYSQL_DATABASE

MYSQLHOST
MYSQLPORT
MYSQLUSER
MYSQLPASSWORD
MYSQLDATABASE
```

### 6.3 AI 环境变量

Gemini：

```text
AI_PROVIDER=gemini
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash
```

OpenAI：

```text
AI_PROVIDER=openai
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4.1-mini
```

当前代码没有 DeepSeek provider。如需接入 DeepSeek，需要新增 provider 分支、环境变量和请求适配。

### 6.4 TTS 环境变量

```text
GOOGLE_TTS_API_KEY=...
GOOGLE_CLOUD_TTS_API_KEY=...
GOOGLE_TTS_VOICE=ko-KR-Neural2-A
```

也可以在本地使用 `.env.tts.local`。

### 6.5 Railway 部署

当前部署依赖：

- Railway Web Service。
- Railway MySQL。
- `PORT` 环境变量。
- `railway-start.sh` 或相关启动配置。

注意：

- 用户自上传 PDF 不需要上传到 Railway。
- TTS 生成缓存可能因 Railway 文件系统策略而丢失。
- AI/TTS key 只能配置在环境变量，不应提交到仓库。

## 7. 安全与隐私

### 7.1 PDF 隐私

当前 Web 用户上传 PDF 后：

- PDF 文件不上传服务器。
- 页图和文本缓存在浏览器 IndexedDB。
- 用户删除教材时，应清理本地缓存。

但是：

- 用户提问 AI 时，当前页和相邻页文本会发送到后端。
- 文本层太少或乱码时，当前页截图会发送到后端并转发给模型服务。

因此后续需要在 UI 中明确提示：

- 哪些内容会发送给 AI。
- 不要上传或提问敏感资料。

### 7.2 API Key 管理

AI 和 TTS key 必须放在服务器环境变量。

不应提交：

- `.env`
- `.env.tts.local`
- 真实 API key。
- 生成音频缓存。

### 7.3 管理后台权限

当前后台使用管理员登录和 session。

后续如果开放更多编辑能力，需要补充：

- 更明确的鉴权中间层。
- 操作日志。
- 内容误删恢复。
- 更安全的密码和 session 策略。

### 7.4 未来账号隐私

引入账号后，需要明确：

- 用户学习记录保存范围。
- 教材文件是否上传。
- 笔记和批注是否同步。
- AI 历史是否保存。
- 用户删除账号时如何清理数据。

## 8. 技术债与风险

### 8.1 后端框架限制

当前后端基于 `http.server`，足够支撑 MVP，但随着接口、鉴权、文件、AI、账号增多，会遇到：

- 路由和中间件能力弱。
- 测试和扩展不方便。
- 错误处理和日志体系不足。
- API 规范难统一。

中期可以评估迁移到 FastAPI。

### 8.2 前端混合结构

当前 Web 同时使用：

- 原生 JS。
- React/Babel JSX。
- 多个 CSS 文件。

风险：

- 状态分散。
- 组件复用困难。
- Web 和移动端数据结构重复。

后续可考虑统一数据层和组件边界，但不建议短期为了重构而重构。

### 8.3 音标数据重复

Web 和移动端都维护了音标详情、分组和规则。

风险：

- 两端内容不一致。
- 修改一次需要同步多处。

建议：

- 先抽成共享 JSON。
- 后续再考虑数据库管理。

### 8.4 PDF 性能

大 PDF、扫描版 PDF、图片质量高的 PDF 会导致：

- 初次解析慢。
- IndexedDB 占用大。
- Canvas 渲染压力大。
- 移动端更难处理。

建议：

- Web 保持本地解析。
- 移动端优先做阅读体验原型。
- 后续对大教材考虑章节化、云端预处理或对象存储。

### 8.5 AI 可靠性

AI 回答可能存在：

- OCR 错误。
- 页面上下文不足。
- 模型幻觉。
- 排版污染。

建议：

- 明确回答只基于当前页。
- 给出“不确定”机制。
- 对回答做结构化渲染。
- 对重要内容保留用户校对入口。

### 8.6 数据同步缺失

没有账号体系前：

- 词汇状态不是真实个人状态。
- 教材记录只在本机。
- 笔记和批注无法跨端。
- 学习计划没有意义。

因此账号和同步是中期关键基础设施。

## 9. 后续技术演进

### 9.1 第一阶段：稳定当前 Web

优先任务：

- 补齐音标内容校对。
- 明确音频优先级。
- 优化 PDF AI 回答渲染。
- 清洗词汇和句子数据。
- 整理环境变量和部署说明。
- 避免继续把中文解释、中文释义和中文 UI 文案硬编码到不可维护的位置，为后续国际化预留结构。

### 9.2 第二阶段：移动端与 Web 内容对齐

优先任务：

- 移动端音标数据与 Web 一致。
- 移动端播放逻辑适配手机使用习惯。
- 移动端教材页先保留合理入口和占位。
- iPhone/iPad 响应式布局稳定。

### 9.3 第三阶段：账号和同步

优先任务：

- 设计用户表和登录流程。
- 建立学习记录表。
- 建立教材、笔记、批注、收藏同步模型。
- Web 和移动端统一调用同步 API。

### 9.4 第四阶段：iPad 教材工作台

优先任务：

- PDF 阅读布局。
- Apple Pencil 批注。
- 划线和备注。
- 页面级 AI 问答。
- 音频和课文联动。
- 生词收藏和复习联动。

### 9.5 第五阶段：高质量音频和跟读

优先任务：

- 真人四十音音频。
- 真人示例词音频。
- 句子音频切片。
- 跟读录音。
- 语音识别和反馈。

### 9.6 第六阶段：国际化和多语言架构

目标：

让当前中文测试版本能够演进成全球多语言版本，支持不同母语用户学习韩语。

建议技术方向：

- 增加用户语言偏好字段，例如 `ui_language`、`explanation_language`、`native_language`。
- 抽离前端 UI 文案，避免继续散落在 HTML、JS 和 JSX 中。
- 为音标解释、词汇释义、例句翻译建立多语言资源结构。
- AI 助教请求中传入用户目标回答语言。
- TTS 和语音对话配置中保留语速、音色、语言和地区参数。
- 后台或内容工具需要支持多语言内容维护和审核。

需要避免：

- 只在前端做简单菜单翻译，但业务解释仍写死中文。
- 所有多语言内容都实时依赖 AI 翻译，没有审核和缓存。
- Web 和移动端分别维护两套翻译内容。

建议数据模型方向：

```text
user_language_preference
  user_id
  ui_language
  explanation_language
  native_language

translation_resource
  resource_key
  locale
  value

vocabulary_translation
  vocabulary_id
  locale
  meaning

letter_explanation_translation
  letter
  locale
  pronunciation_tip
  contrast_note

sentence_translation
  sentence_id
  locale
  translated_text
```

## 10. 当前推荐结论

当前最合理的技术路线是：

1. 保持 Web 作为主产品继续稳定。
2. 移动端先做内容和 UI 对齐，不急着做复杂同步。
3. PDF 教材继续使用用户本地上传方案，避免过早引入大文件云存储复杂度。
4. 教材页视觉问答优先使用 Gemini 2.5 Flash。
5. DeepSeek 可作为未来纯文本问答 provider，但当前需要新增代码支持。
6. 四十音标准音频应逐步替换为真人音频，TTS 只做兜底。
7. 做学习计划前，先做账号和学习记录同步。
8. 中文版本是全球多语言产品的第一阶段验证，后续技术实现要预留国际化数据结构。
