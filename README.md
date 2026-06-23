# Korean Learn

Korean Learn 是一个面向全球韩语初学者的学习工具。当前版本优先服务中文母语用户，用中文版本验证学习流程、内容结构和核心训练闭环；后续目标是推出多语言版本，让不同母语国家的用户都可以用自己的语言学习韩语音标、词汇、例句和教材内容。项目以 Web 端为主，同时包含 iPhone/iPad 移动端原型和后续创新功能设计。

项目核心目标不是简单展示学习资料，而是围绕“听、读、问、记、复习”建立可持续的韩语学习闭环。

## 1. 项目基本信息

| 项目 | 说明 |
| --- | --- |
| 项目名称 | Korean Learn |
| 项目类型 | 韩语学习 Web 应用 + 移动端原型 |
| 主要用户 | 韩语初学者，当前优先面向中文母语学习者，后续扩展至全球多语言用户 |
| 当前阶段 | Web 主产品可运行，移动端/iPad 为原型和设计推进阶段 |
| 开源仓库 | https://github.com/wangming2050/korean_learn |
| Web 线上地址 | https://web-production-3f3a8.up.railway.app/ |
| 后端部署 | Railway |
| 数据库 | Railway MySQL / 本地 MySQL |

> 如果 Railway 线上地址后续变更，请以最新部署地址为准。

## 2. 核心功能

### 2.1 学习路径

学习路径用于引导用户了解网站的学习顺序和使用方式。当前定位是“学习方法与入口”，不是自动生成个人学习计划。

用户可以从学习路径进入：

- 音标学习。
- 词汇学习。
- 例句学习。
- 教材学习。

### 2.2 音标学习

音标模块围绕韩语四十音和收音规则进行训练。

当前支持：

- 按辅音、元音、收音、双收音组织学习内容。
- 辅音区分松音、紧音、送气音。
- 元音区分单元音、双元音。
- 点击音标查看发音详情。
- 展示发音技巧、示例词、对比词和规则说明。
- 支持音标播放和示例词播放。
- 静态音频失败后可降级到 TTS 或浏览器朗读。

### 2.3 词汇学习

词汇模块用于展示基础韩语词汇，为后续教材学习、句子理解和复习做准备。

当前支持：

- 从后端接口读取词汇。
- 展示韩文、中文和词汇来源。
- 移动端可通过 Web API 读取同一套词汇数据。

后续规划：

- 用户导入词汇。
- 词汇关联音标。
- 词汇关联例句。
- 词汇学习状态同步。

### 2.4 例句学习

例句模块按真实生活场景组织韩语句子。

当前支持：

- 按场景查看例句。
- 展示韩文和中文。
- 句子支持音频字段和音频起止时间。
- 后台可维护场景和句子。

后续规划：

- 用户导入例句。
- 教材句子添加到例句库。
- 例句生成语音。
- 例句跟读和语音评分。

### 2.5 教材 PDF 学习

教材模块支持用户上传自己的 PDF 教材，在浏览器本地阅读。

当前支持：

- 用户上传本地 PDF。
- PDF 不上传服务器。
- 浏览器使用 PDF.js 解析 PDF。
- 页面图像和文本缓存到 IndexedDB。
- 支持翻页、页码跳转和目录识别。
- 支持围绕当前页向 AI 提问。

### 2.6 AI 助教

教材页提供 AI 问答能力，帮助用户理解当前教材页。

当前支持：

- 基于当前页和相邻页文本回答问题。
- 文本不足或乱码时，可附带当前页截图。
- 支持 Gemini / OpenAI provider。
- 默认推荐 Gemini 2.5 Flash 用于教材页视觉理解。

后续规划：

- AI 问本页增强。
- AI 语音对话训练入口。
- 教材文本转语音。
- 教材句子保存到例句库。

### 2.7 管理后台

后台用于维护基础学习内容。

当前支持：

- 管理员登录。
- 场景管理。
- 句子管理。

当前后台入口：

- `/admin/login`
- `/admin/scene`
- `/admin/sentence`

## 3. 当前版本状态

| 模块 | 当前状态 |
| --- | --- |
| Web 用户端 | 可运行 |
| 音标学习 | 已实现，持续优化内容和音频 |
| 词汇学习 | 已实现基础展示，用户状态未完成 |
| 例句学习 | 已实现基础场景和句子 |
| 教材 PDF | 已实现本地上传和阅读 |
| AI 问本页 | 已实现基础能力，继续优化回答质量 |
| TTS | 已实现服务端 Google TTS 代理 |
| 管理后台 | 已实现场景和句子管理 |
| 移动端 App | 原型阶段 |
| iPad 教材工作台 | 设计和规划阶段 |
| 用户登录和同步 | 后续优先实现 |
| 语音评分 | 后续创新功能 |
| AI 语音对话 | 后续创新功能 |
| 多语言 / 国际化 | 后续创新方向，中文验证完成后扩展 |

## 4. 在线访问与安装包

### 4.1 Web 访问地址

当前线上 Web 地址：

```text
https://web-production-3f3a8.up.railway.app/
```

本地默认访问地址：

```text
http://127.0.0.1:8000/
```

### 4.2 App Release 文件

当前仓库中未发现已经生成的 `.ipa`、`.apk` 或 `.aab` release 文件。

当前状态：

| 平台 | 状态 | 说明 |
| --- | --- | --- |
| iOS IPA | 暂未提供 | 当前可通过 Expo/Xcode 模拟器运行 |
| Android APK | 暂未提供 | 当前未生成 Android release 包 |
| Android AAB | 暂未提供 | 当前未生成 Google Play 发布包 |

建议后续 release 文件放置位置：

```text
releases/mobile/
  KoreanLearn-iOS.ipa
  KoreanLearn-Android.apk
```

或使用 GitHub Releases 统一管理安装包。

## 5. 文档导航

### 5.1 产品文档

| 文档 | 路径 | 说明 |
| --- | --- | --- |
| 产品需求文档 | `docs/product/PRODUCT_REQUIREMENTS.md` | 业务规则型 PRD，说明页面规则、用户操作、系统响应和验收标准 |
| 产品愿景与创新点 | `docs/product/PRODUCT_VISION.md` | 说明产品定位、三端方向和核心创新点 |
| 后续迭代路线图 | `docs/product/ROADMAP.md` | 说明优先级：登录和基础补齐、创新点、长期规划 |
| 待确认问题 | `docs/product/OPEN_QUESTIONS.md` | 记录账号、AI、音频、版权、同步等待确认事项 |

### 5.2 技术文档

| 文档 | 路径 | 说明 |
| --- | --- | --- |
| 技术设计文档 | `docs/technical/TECHNICAL_DESIGN.md` | 说明整体技术架构、数据流、模块实现、部署和风险 |
| 项目结构说明 | `docs/PROJECT_STRUCTURE.md` | 说明各目录职责、正式文件边界和不应提交的本地生成物 |
| 学习与迭代记录 | `docs/learn/update_log.md` | 记录项目从原生 Web 架构起步的技术学习和迭代说明 |
| 移动端启动说明 | `mobile/docs/MOBILE_SIMULATOR_START.md` | 说明 iPhone/iPad 模拟器和移动端调试启动方式 |

### 5.3 设计稿

已实现方向设计稿：

```text
design/Implemented_design/
```

主要文件：

- `00-首页主应用.html`
- `01-例句-方案A.html`
- `02-例句-方案B.html`
- `03-音标-方案A.html`
- `04-音标重设计-对比.html`
- `05-AI助教重设计-对比.html`
- `06-Logo设计.html`
- `07-Logo重设计-对比.html`

创新点设计稿：

```text
design/Innovation_point_design/
```

主要文件：

- `1-初版设计稿.html`
- `2-交互原型.html`
- `3-交互原型v3.html`
- `4-交互原型v4.html`
- `5-交互原型v5.html`
- `6-交互原型v6.html`

移动端设计稿：

```text
mobile/design/
```

主要文件：

- `mobile/design/mobile_design_dev_canvas.html`
- `mobile/design/dev_pages/phonetic_home.html`
- `mobile/design/dev_pages/phonetic_detail.html`
- `mobile/design/dev_pages/phonetic_overview.html`
- `mobile/design/dev_pages/vocab_home.html`
- `mobile/design/dev_pages/vocab_library.html`
- `mobile/design/dev_pages/vocab_detail.html`
- `mobile/design/dev_pages/textbook_home.html`
- `mobile/design/dev_pages/textbook_detail.html`

## 6. 创新点概览

当前规划的主要创新点包括：

### 6.1 音标与词汇联动

- 音标关联平台词汇。
- 用户可为音标添加自己的词汇。
- 词汇卡片中的音标可交互。
- 弱项音标可在词汇学习中被再次提示。

### 6.2 词汇与例句联动

- 词汇关联平台例句。
- 用户可导入自己的词汇和例句。
- 教材中的句子可添加到例句库。
- 用户例句可生成语音。

### 6.3 教材增强 AI

- AI 问本页。
- AI 语音对话训练入口。
- 教材文本转语音。
- 教材句子添加到例句库。

### 6.4 语音评分与发音反馈

- 词汇语音评分。
- 例句语音评分。
- 音标级识别和反馈。
- 发音锚点纠错。

### 6.5 全局训练能力

- 支持不同人声音色。
- 支持不同语速。
- 支持多语言界面，让不同母语用户学习韩语。

### 6.6 国际化与多语言学习

Korean Learn 的长期定位不是只服务中文用户，而是面向全球不同母语用户学习韩语。当前中文版本用于验证产品方向和学习效果；当中文版本的音标、词汇、例句、教材和 AI 学习闭环稳定后，再扩展多语言版本。

多语言能力不只是翻译页面菜单，还包括：

- UI 文案多语言。
- 音标发音解释按用户母语展示。
- 词汇释义支持不同母语。
- 例句翻译支持不同母语。
- 教材 AI 助教按用户母语回答。
- 用户可选择学习界面语言和解释语言。
- 后续语音训练可根据用户母语背景提示常见发音难点。

## 7. 技术架构摘要

当前项目仍以 V1 原生架构为技术底座，同时根据业务需求引入局部增强能力。

### 7.1 Web 技术栈

```text
HTML + CSS + 原生 JavaScript
局部 React/Babel 组件
Python 原生 http.server
pymysql + MySQL
无后端框架
无 ORM
```

说明：

- 后端没有使用 Flask、Django、FastAPI。
- 数据库没有使用 ORM。
- 路由由 `server.py` 和 `router.py` 手动分发。
- 词汇页和例句页使用 React/Babel 做局部组件化。

### 7.2 移动端技术栈

```text
Expo
React Native
TypeScript
expo-audio
expo-speech
expo-document-picker
```

移动端当前通过 `EXPO_PUBLIC_API_BASE_URL` 读取 Web API 数据。

### 7.3 外部能力

- PDF.js：浏览器本地解析 PDF。
- IndexedDB：缓存用户上传 PDF 的页图和文本。
- Gemini / OpenAI：教材页 AI 助教。
- Google Cloud TTS：韩语语音生成。
- Railway：Web 服务部署。
- Railway MySQL：线上数据库。

## 8. 项目目录结构

```text
korean_learn/
  server.py                 # Python http.server 入口
  router.py                 # API 路由分发
  db.py                     # MySQL 连接和 SQL 执行
  handler/                  # 后端业务接口
  templates/                # Web 页面模板
  static/                   # CSS、JS、音频、教材静态资源
  sql/                      # 数据库初始化脚本
  mobile/                   # Expo / React Native 移动端
  design/                   # Web 与创新点设计稿
  docs/PROJECT_STRUCTURE.md # 项目结构说明
  docs/product/             # 产品文档
  docs/technical/           # 技术文档
  docs/learn/               # 学习和迭代记录
  DEPLOY.md                 # 部署说明
  README.md                 # 项目说明
```

## 9. 本地运行方式

### 9.1 Web 本地运行

准备 Python 环境并安装依赖：

```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements.txt
```

初始化数据库：

```bash
mysql -u root -p < sql/schema.sql
```

启动服务：

```bash
python server.py
```

访问：

```text
http://127.0.0.1:8000/
```

后台：

```text
http://127.0.0.1:8000/admin
```

### 9.2 移动端本地运行

进入移动端目录：

```bash
cd mobile
nvm use 20
npm install
```

启动 iOS 模拟器：

```bash
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000 npm run ios -- --clear
```

如果使用实体机，需要把 `127.0.0.1` 替换为 Mac 的局域网 IP。

## 10. 数据与隐私说明

### 10.1 用户 PDF

当前教材 PDF 采用本地优先策略：

- 用户上传的 PDF 不上传服务器。
- PDF 在浏览器本地通过 PDF.js 解析。
- 页图和文本缓存到浏览器 IndexedDB。
- 删除教材时应清理对应本地缓存。

### 10.2 AI 请求

用户使用教材页 AI 助教时：

- 前端会发送当前页和相邻页文本。
- 如果文本太少或乱码，会发送当前页截图。
- 整本 PDF 不会上传。
- 不建议上传或询问敏感资料。

### 10.3 API Key

AI 和 TTS key 只应配置在服务端环境变量中，不应提交到 GitHub。

相关文件：

- `.env`
- `.env.ai.local`
- `.env.tts.local`

这些文件不应包含在公开提交中。

## 11. 项目成员分工

| 成员 | 分工 |
| --- | --- |
| 白夏、王明、汝世杰、程奕鑫 | 产品定位、需求梳理、功能规划 |
| 白夏、王明 | Web 前端页面、音标/词汇/例句/教材交互 |
| 白夏、王明 | Python 后端、API、MySQL 数据库 |
| 王明 | 移动端 App / iPad 原型 |
| 白夏、王明、汝世杰、程奕鑫 | UI 设计稿、视觉设计、交互原型 |
| 汝世杰、程奕鑫 | 测试、部署、文档整理、财务管理 |

## 12. 开源地址

GitHub 仓库：

```text
https://github.com/wangming2050/korean_learn
```

当前本地 Git 远程：

```text
git@github-wangming2050:wangming2050/korean_learn.git
```

## 13. 当前限制

当前版本仍存在以下限制：

- 用户登录和跨端同步尚未实现。
- 词汇学习状态还不是用户真实学习记录。
- 移动端 App 仍处于原型阶段。
- iPad 教材工作台仍在设计和规划阶段。
- IPA/APK release 包尚未生成。
- TTS 只能作为兜底音频，四十音标准音频仍需要继续优化。
- AI 回答依赖外部模型服务，仍需控制准确性和隐私边界。

## 14. 后续规划

后续优先级见：

```text
docs/product/ROADMAP.md
```

当前规划顺序：

1. 用户登录与用户数据归属。
2. 当前 Web 和移动端基础能力完善。
3. 音标与词汇联动。
4. 词汇与例句联动。
5. 教材 AI 问本页增强。
6. AI 语音对话训练。
7. 教材文本转语音并加入例句库。
8. 语音评分和音标级反馈。
9. Web、iPhone、iPad 数据同步。
10. iPad 教材工作台。
11. 多人声、多语速、多语言支持。
