# Korean Learn Project Structure

本文档说明项目目录的职责边界，帮助开发、提交代码和项目审核时快速判断哪些文件是正式内容，哪些是本地生成物或历史资料。

## 1. 根目录

```text
korean_learn/
  server.py
  router.py
  db.py
  handler/
  templates/
  static/
  sql/
  scripts/
  mobile/
  design/
  docs/
  README.md
  PRODUCT.md
  DEPLOY.md
  requirements.txt
  Procfile
  railway.json
  nixpacks.toml
```

根目录只保留项目入口、部署配置、核心说明文档和一级功能目录。

## 2. Web 后端

```text
server.py
router.py
db.py
handler/
```

- `server.py`：Python 原生 HTTP 服务入口，负责启动服务和静态资源返回。
- `router.py`：接口路由分发。
- `db.py`：数据库连接和 SQL 执行封装。
- `handler/`：后端业务接口，包含场景、句子、音标、TTS、PDF AI 助教等逻辑。

当前项目仍以原生 Python Web 结构为基础，没有引入后端框架或 ORM。

## 3. Web 前端

```text
templates/
static/css/
static/js/
static/audio/
static/data/
static/textbooks/
```

- `templates/`：Web 页面模板。
- `static/css/`：Web 样式。
- `static/js/`：Web 交互逻辑，部分页面使用 React/Babel 做局部组件化。
- `static/audio/`：音标等静态音频资源。
- `static/data/`：前端可读取的静态数据。
- `static/textbooks/`：教材索引、manifest 等静态教材元数据。

## 4. 数据库和脚本

```text
sql/
scripts/
```

- `sql/schema.sql`：本地数据库结构。
- `sql/schema-cloud.sql`：线上数据库结构。
- `scripts/`：数据同步、教材图片生成、词汇导出等开发辅助脚本。

脚本目录不应放业务运行入口，只放可重复执行的工具脚本。

## 5. 移动端

```text
mobile/
  App.tsx
  src/
  ios/
  design/
  docs/
  package.json
```

- `mobile/App.tsx`：Expo / React Native 应用入口。
- `mobile/src/`：移动端 API、组件、主题和本地数据。
- `mobile/ios/`：iOS 原生工程，由 Expo prebuild / Xcode 生成和维护。
- `mobile/design/`：移动端设计稿和开发画布。
- `mobile/docs/`：移动端启动与调试文档。

移动端当前通过 `EXPO_PUBLIC_API_BASE_URL` 读取 Web API 数据。

## 6. 设计稿

```text
design/
  Implemented_design/
  Innovation_point_design/
mobile/design/
```

- `design/Implemented_design/`：已落地或接近落地的 Web/功能设计稿。
- `design/Innovation_point_design/`：创新点和交互探索设计稿。
- `mobile/design/`：移动端独立设计稿、页面拆分和横向开发画布。

设计稿是产品和 UI 参考，不参与后端运行。

## 7. 文档

```text
docs/
  PROJECT_STRUCTURE.md
  learn/
  product/
  technical/
```

- `docs/product/`：产品需求、愿景、路线图、待确认问题。
- `docs/technical/`：技术设计和架构说明。
- `docs/learn/`：学习过程和技术迭代记录。
- `docs/PROJECT_STRUCTURE.md`：项目结构说明。

`docs/plans/` 已不作为正式文档目录使用。历史草稿、旧 UI patch、实验代码不建议继续放在正式文档路径下。

## 8. 不应提交的本地生成物

以下内容属于本地环境或构建缓存，不应进入仓库：

```text
.env
.venv/
.idea/
.claude/
__pycache__/
*.pyc
.DS_Store
node_modules/
mobile/node_modules/
mobile/.expo/
mobile/ios/Pods/
mobile/ios/build/
*.log
```

这些内容已经写入 `.gitignore`。如果本地仍然存在，不影响项目运行，也不需要提交。

## 9. 当前整理原则

- 运行代码和正式文档保留在主目录结构内。
- 设计稿保留，但按 Web 创新点、已实现设计、移动端设计分组。
- 历史草稿和实验代码不再放入 `docs/plans/`。
- 本地 IDE、AI 工具、Expo 缓存和系统文件不进入版本管理。
- 后续新增功能建议从 `main` 拉 feature 分支，并把需求方案放入正式产品/技术文档，而不是散落到临时目录。
