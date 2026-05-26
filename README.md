# 韩语句子跟读学习网站

这是一个适合初学者学习的无框架 Web 项目。

后端只使用 Python 原生 `http.server`，不使用 Flask、Django、FastAPI。

前端只使用 HTML、CSS、原生 JavaScript，不使用 Vue、React、jQuery。

数据库使用 MySQL，Python 通过 `pymysql` 直接写 SQL，不使用 ORM。

## 默认访问地址

用户端：

```text
http://127.0.0.1:8000/
```

后台：

```text
http://127.0.0.1:8000/admin
```

后台登录页：

```text
http://127.0.0.1:8000/admin/login
```

默认后台密码：

```text
admin123
```

也可以通过环境变量修改：

```bash
export ADMIN_PASSWORD=你的后台密码
```

如果使用本项目推荐的 `.env` 启动方式，也可以在 `.env` 中修改 `ADMIN_PASSWORD`。

教材 PDF 和教材听力等大文件默认从 Cloudflare R2 加载。v2.0 测试环境默认资源地址是：

```text
https://pub-932125ce45f74ebbbfea4319730d4d53.r2.dev
```

如需切换到正式对象存储域名，可以设置：

```bash
export ASSET_BASE_URL=https://assets.example.com
```

如果使用 `.env` 启动方式，也可以写入：

```text
ASSET_BASE_URL=https://assets.example.com
```

## 功能说明

用户端只保留学习功能：

- 音标：展示 40 个韩文字母，点击播放音频。
- 场景句子：按场景查看句子，支持单句循环、慢速播放。
- 词汇：词汇通过例句展示，不单独孤立罗列。
- 教材：教材文本按句子绑定音频时间轴，点击句子跳转播放。

后台独立访问，不出现在用户端导航：

- `/admin/login`：登录页，输入密码验证。
- `/admin/scene`：场景管理，列表展示已有场景，支持新增、编辑、删除。
- `/admin/sentence`：句子管理，列表展示已有句子，可按场景筛选，支持新增、编辑、删除。
- `/admin/material`：教材管理，列表展示已有教材，支持新增、编辑、删除。

## 运行步骤

下面步骤以 macOS / Linux 终端为例。

Windows 用户可以使用 PowerShell 或 Git Bash，核心步骤相同，只是环境变量写法略有不同。

### 1. 克隆项目

```bash
git clone https://github.com/testerwm/korean_learn.git
cd korean_learn
```

如果你已经下载了项目源码，只需要进入项目目录即可。

### 2. 准备 Python 环境

建议使用 Python 3.9 或更高版本。

查看本机 Python 版本：

```bash
python3 --version
```

创建虚拟环境：

```bash
python3 -m venv .venv
```

激活虚拟环境：

```bash
source .venv/bin/activate
```

安装项目依赖：

```bash
python3 -m pip install -r requirements.txt
```

依赖说明：

- `pymysql`：Python 连接 MySQL。
- `cryptography`：MySQL 8/9 默认认证方式可能需要它，否则可能出现 `cryptography package is required` 报错。

### 3. 确认 MySQL 已安装并启动

如果你已经安装并启动了 MySQL，可以先检查：

```bash
mysql --version
```

尝试登录 MySQL：

```bash
mysql -u root -p
```

输入你的 MySQL root 密码后，如果能进入 `mysql>` 界面，说明 MySQL 可以正常使用。

如果 macOS 上没有 `mysql` 命令，但你安装的是官方 MySQL，可以尝试：

```bash
/usr/local/mysql/bin/mysql -u root -p
```

如果使用 Homebrew 安装 MySQL：

```bash
brew install mysql
brew services start mysql
```

### 4. 创建数据库并导入表结构和示例数据

项目提供了初始化 SQL：

```text
sql/schema.sql
```

执行：

```bash
mysql -u root -p < sql/schema.sql
```

如果你使用的是 macOS 官方 MySQL，并且 `mysql` 命令不在 PATH 中，可以执行：

```bash
/usr/local/mysql/bin/mysql -u root -p < sql/schema.sql
```

这一步会创建：

- 数据库：`korean_learn`
- 数据表：`scene`、`sentence`、`vocabulary`、`material`
- 示例数据：场景、句子、词汇、教材

### 5. 创建项目专用 MySQL 用户

不建议项目直接使用 root 用户连接数据库。

先登录 MySQL：

```bash
mysql -u root -p
```

如果使用 macOS 官方 MySQL：

```bash
/usr/local/mysql/bin/mysql -u root -p
```

进入 `mysql>` 后执行下面 SQL。

请把 `你的数据库密码` 改成你自己的密码：

```sql
CREATE USER IF NOT EXISTS 'korean_user'@'localhost' IDENTIFIED BY '你的数据库密码';
CREATE USER IF NOT EXISTS 'korean_user'@'127.0.0.1' IDENTIFIED BY '你的数据库密码';

GRANT ALL PRIVILEGES ON korean_learn.* TO 'korean_user'@'localhost';
GRANT ALL PRIVILEGES ON korean_learn.* TO 'korean_user'@'127.0.0.1';

FLUSH PRIVILEGES;
```

退出 MySQL：

```sql
exit;
```

### 6. 配置项目数据库连接

复制环境变量示例文件：

```bash
cp .env.example .env
```

打开 `.env`，把数据库密码改成你刚才创建用户时使用的密码：

```text
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=korean_user
MYSQL_PASSWORD=你的数据库密码
MYSQL_DATABASE=korean_learn
ADMIN_PASSWORD=admin123
```

`.env` 是本地配置文件，不应该提交到 GitHub。

### 7. 测试数据库连接

执行：

```bash
set -a
. ./.env
set +a

python3 - <<'PY'
from db import fetch_all
print(fetch_all("SELECT id, name FROM scene"))
PY
```

如果看到类似输出，说明 Python 已经能连接 MySQL：

```text
[{'id': 1, 'name': '打招呼'}, {'id': 2, 'name': '问路'}, {'id': 3, 'name': '购物'}, {'id': 4, 'name': '餐厅'}]
```

### 8. 启动服务

推荐使用启动脚本：

```bash
chmod +x start.sh
./start.sh
```

也可以手动启动：

```bash
set -a
. ./.env
set +a

python3 server.py
```

启动成功后会看到：

```text
韩语学习网站已启动：http://127.0.0.1:8000
```

### 9. 打开页面

用户端：

```text
http://127.0.0.1:8000/
```

后台：

```text
http://127.0.0.1:8000/admin
```

后台默认密码：

```text
admin123
```

如果你在 `.env` 中设置了 `ADMIN_PASSWORD`，则使用你自己设置的后台密码。

## 常见 MySQL 问题

### 1. `Can't connect to MySQL server on '127.0.0.1'`

常见原因：

- MySQL 没启动。
- MySQL 没监听 3306 端口。
- MySQL 只开启了 socket 连接。

先检查 MySQL 是否启动：

```bash
mysql -u root -p
```

再检查端口：

```bash
mysql -u root -p -e "SHOW VARIABLES LIKE 'port';"
```

如果结果是：

```text
port | 3306
```

说明 MySQL 正在监听 3306。

如果结果是：

```text
port | 0
```

说明 MySQL 没有开启 TCP 端口，通常只能通过 socket 连接。

### 2. macOS 官方 MySQL 只走 socket

macOS 官方安装版 MySQL 有时会使用 socket，例如：

```text
/tmp/mysql.sock
```

查看 socket 路径：

```bash
/usr/local/mysql/bin/mysql -u root -p -e "SHOW VARIABLES LIKE 'socket';"
```

如果你不想开启 3306 端口，可以在 `.env` 中配置：

```text
MYSQL_SOCKET=/tmp/mysql.sock
MYSQL_USER=korean_user
MYSQL_PASSWORD=你的数据库密码
MYSQL_DATABASE=korean_learn
```

配置了 `MYSQL_SOCKET` 后，项目会优先使用 socket 连接，不再使用 `MYSQL_HOST` 和 `MYSQL_PORT`。

### 3. `Access denied for user`

表示用户名或密码不对，或者该用户没有权限访问 `korean_learn` 数据库。

可以重新登录 MySQL 后执行授权：

```sql
CREATE USER IF NOT EXISTS 'korean_user'@'localhost' IDENTIFIED BY '你的数据库密码';
CREATE USER IF NOT EXISTS 'korean_user'@'127.0.0.1' IDENTIFIED BY '你的数据库密码';

GRANT ALL PRIVILEGES ON korean_learn.* TO 'korean_user'@'localhost';
GRANT ALL PRIVILEGES ON korean_learn.* TO 'korean_user'@'127.0.0.1';

FLUSH PRIVILEGES;
```

然后确认 `.env` 中的配置一致：

```text
MYSQL_USER=korean_user
MYSQL_PASSWORD=你的数据库密码
```

### 4. `Unknown database 'korean_learn'`

说明 MySQL 连接成功了，但数据库还没创建。

执行：

```bash
mysql -u root -p < sql/schema.sql
```

### 5. `cryptography package is required`

MySQL 8/9 默认认证方式可能需要 `cryptography`。

执行：

```bash
python3 -m pip install -r requirements.txt
```

或单独安装：

```bash
python3 -m pip install cryptography
```

### 6. 8000 端口被占用

如果启动时报端口占用，可以查看占用进程：

```bash
lsof -nP -iTCP:8000 -sTCP:LISTEN
```

停止对应进程后再启动。

## 项目结构详细讲解

```text
korean-learn/
├── server.py
├── router.py
├── db.py
├── handler/
│   ├── __init__.py
│   ├── scene.py
│   ├── sentence.py
│   └── material.py
├── templates/
│   ├── index.html
│   ├── admin.html
│   └── admin_login.html
├── static/
│   ├── css/
│   │   ├── style.css
│   │   └── admin.css
│   ├── js/
│   │   ├── app.js
│   │   └── admin.js
│   └── audio/
├── sql/
│   └── schema.sql
├── requirements.txt
└── README.md
```

### server.py

`server.py` 是项目入口。

它做这些事情：

- 创建 `HTTPServer`。
- 继承 `BaseHTTPRequestHandler`。
- 手动实现 `do_GET`、`do_POST`、`do_PUT`、`do_DELETE`。
- 手动解析 URL。
- 手动读取 JSON 请求体。
- 手动设置响应状态码、响应头、响应体。
- 处理用户端首页 `/`。
- 处理后台路径 `/admin`、`/admin/login`、`/admin/scene`、`/admin/sentence`、`/admin/material`。
- 处理后台登录 Cookie。
- 处理静态文件 `/static/...`。
- 把 API 请求交给 `router.py`。

阅读顺序建议：

1. 先看文件顶部的 `BASE_DIR`、`ADMIN_PASSWORD`、`ADMIN_SESSION_TOKEN`。
2. 再看 `KoreanLearnHandler` 类。
3. 再看 `do_GET`、`do_POST`、`do_PUT`、`do_DELETE` 如何统一调用 `handle_request`。
4. 重点看 `handle_request`，这是整个请求分发中心。
5. 最后看 `send_json`、`send_file`、`redirect` 这些响应辅助函数。

### router.py

`router.py` 是手写路由器。

它不使用框架路由表，而是使用 `if path.startswith(...)` 判断路径。

它做这些事情：

- `/api/scenes` 分发给 `handler/scene.py`。
- `/api/sentences` 分发给 `handler/sentence.py`。
- `/api/letters` 分发给 `handler/sentence.py`。
- `/api/vocabulary` 分发给 `handler/sentence.py`。
- `/api/materials` 分发给 `handler/material.py`。

阅读重点：

- `route(handler, method, path, query)` 的四个参数分别来自 `server.py`。
- 每个 handler 返回 `True` 表示请求已经处理完成。
- 返回 `None` 表示没有匹配到路由，最后由 `server.py` 返回 404。

### db.py

`db.py` 是数据库访问层。

它做这些事情：

- 从环境变量读取 MySQL 配置。
- 使用 `pymysql.connect` 创建连接。
- `fetch_all` 查询多行。
- `fetch_one` 查询一行。
- `execute` 执行新增、编辑、删除。

这个项目没有 ORM，所以 SQL 都写在 handler 文件中。

### handler/scene.py

场景接口文件。

接口：

- `GET /api/scenes`：查询所有场景。
- `POST /api/scenes`：新增场景。
- `PUT /api/scenes?id=1`：编辑场景。
- `DELETE /api/scenes?id=1`：删除场景。

### handler/sentence.py

句子、词汇、音标接口文件。

接口：

- `GET /api/letters`：返回 40 个韩文字母。
- `GET /api/sentences`：查询所有句子。
- `GET /api/sentences?scene_id=1`：按场景查询句子。
- `POST /api/sentences`：新增句子。
- `PUT /api/sentences?id=1`：编辑句子。
- `DELETE /api/sentences?id=1`：删除句子。
- `GET /api/vocabulary?q=어디`：查询词汇和关联例句。

### handler/material.py

教材接口文件。

接口：

- `GET /api/materials`：查询教材列表。
- `GET /api/materials?id=1`：查询单个教材。
- `POST /api/materials`：新增教材。
- `PUT /api/materials?id=1`：编辑教材。
- `DELETE /api/materials?id=1`：删除教材。

教材 `content` 字段保存 JSON 字符串，格式类似：

```json
[
  {"text": "안녕하세요.", "start": 0, "end": 2},
  {"text": "만나서 반갑습니다.", "start": 2, "end": 5}
]
```

### templates/index.html

用户端首页。

只包含四个学习模块：

- 音标
- 场景句子
- 词汇
- 教材

这里没有后台入口。

### templates/admin_login.html

后台登录页。

它包含：

- 密码输入框。
- 登录按钮。
- 登录提示信息。

提交后由 `static/js/admin.js` 调用：

```text
POST /api/admin/login
```

### templates/admin.html

后台管理页通用模板。

下面三个路径共用它：

- `/admin/scene`
- `/admin/sentence`
- `/admin/material`

页面内容由 `static/js/admin.js` 根据当前路径动态渲染。

### static/js/app.js

用户端 JavaScript。

它负责：

- tab 页面切换。
- 请求 `/api/letters` 加载音标。
- 请求 `/api/scenes` 加载场景。
- 请求 `/api/sentences` 加载句子。
- 请求 `/api/vocabulary` 加载词汇例句。
- 请求 `/api/materials` 加载教材。
- 控制音频播放、慢速播放、单句循环。

### static/js/admin.js

后台 JavaScript。

它负责：

- 登录页提交密码。
- 后台退出登录。
- 根据 `/admin/scene`、`/admin/sentence`、`/admin/material` 渲染不同管理页面。
- 加载已有数据表格。
- 新增、编辑、删除场景。
- 新增、编辑、删除句子。
- 新增、编辑、删除教材。
- 句子管理按场景筛选。

### static/css/style.css

用户端样式。

### static/css/admin.css

后台样式。

后台样式独立于用户端，避免两套页面互相影响。

### sql/schema.sql

数据库初始化脚本。

它会：

- 创建 `korean_learn` 数据库。
- 创建 `scene`、`sentence`、`vocabulary`、`material` 表。
- 插入一些演示数据。

## 请求流转过程

以用户端加载场景句子为例：

1. 浏览器打开 `/`。
2. `server.py` 返回 `templates/index.html`。
3. 浏览器加载 `static/js/app.js`。
4. `app.js` 调用 `fetch("/api/scenes")`。
5. `server.py` 收到请求，解析路径为 `/api/scenes`。
6. `server.py` 调用 `router.route(...)`。
7. `router.py` 把请求分发给 `handler/scene.py`。
8. `handler/scene.py` 调用 `db.fetch_all(...)`。
9. `db.py` 用 `pymysql` 查询 MySQL。
10. 查询结果返回 handler。
11. handler 调用 `handler.send_json(...)`。
12. 浏览器收到 JSON。
13. `app.js` 把 JSON 渲染成页面列表。

## 后台登录流程

1. 浏览器访问 `/admin`。
2. `server.py` 检查 Cookie。
3. 没有登录 Cookie 时，返回 302 跳转到 `/admin/login`。
4. 用户输入密码。
5. `admin.js` 调用 `POST /api/admin/login`。
6. `server.py` 比对密码。
7. 密码正确时，返回 `Set-Cookie: admin_session=...`。
8. 浏览器保存 Cookie。
9. 页面跳转到 `/admin/scene`。
10. 之后访问后台页面时，`server.py` 通过 Cookie 判断是否已登录。

## 关于“逐行注释”

项目中的关键教学文件已经加入大量中文注释：

- `server.py`：解释请求方法、路由、响应、Cookie、静态文件。
- `router.py`：解释手写路由分发。
- `db.py`：解释数据库连接和查询函数。
- `handler/*.py`：解释每个接口如何读参数、校验、执行 SQL、返回 JSON。
- `static/js/app.js`：解释用户端 fetch、渲染、音频控制。
- `static/js/admin.js`：按函数和关键语句解释后台登录、列表、表单、CRUD。
- `static/css/admin.css`：接近逐段逐属性解释后台样式。

建议学习时先从 `server.py` 的 `handle_request` 开始读，因为它是整个项目的入口地图。然后顺着一个接口，例如 `/api/scenes`，读到 `router.py`、`handler/scene.py`、`db.py`，最后回到前端 `app.js` 或 `admin.js`。

## 技术版本迭代计划

这个项目适合作为一个循序渐进的 Web 学习项目。

建议每一版只引入一个核心新概念，避免同时学习太多工具导致看不清每个技术解决的问题。

### V1：当前原生版本

技术结构：

```text
HTML + CSS + 原生 JavaScript
Python 原生 http.server
pymysql + MySQL
无前端框架
无后端框架
无 ORM
```

学习目标：

- 理解浏览器如何请求 HTML、CSS、JS。
- 理解前端如何通过 `fetch` 调用后端接口。
- 理解后端如何接收请求、分发路由、返回 HTML 或 JSON。
- 理解 Python 如何通过 `pymysql` 连接 MySQL。
- 理解最基础的 SQL 查询、新增、修改、删除。

这一版的重点不是写得最省代码，而是看清 Web 项目的底层流程。

### V2：引入 jQuery

技术结构：

```text
HTML + CSS + jQuery
Python 原生 http.server
pymysql + MySQL
```

学习目标：

- 理解前端工具库和原生 JavaScript 的区别。
- 用 jQuery 简化 DOM 查询、事件绑定、Ajax 请求、表单处理。
- 在不改变后端结构的情况下，优化前端交互代码。

jQuery 严格来说不是框架，而是 JavaScript 工具库。

它适合作为第二版，因为它不会大幅改变项目架构，但可以帮助理解“前端库”为什么会出现。

### V3：引入 Flask

技术结构：

```text
HTML + CSS + jQuery
Flask
pymysql + MySQL
```

学习目标：

- 理解后端 Web 框架的价值。
- 学习 Flask 路由、请求参数、响应、模板渲染、Cookie、Session。
- 用 Flask 替代当前手写的 `http.server`、路由分发和响应封装。

这一版的重点是看清：框架并不是魔法，它主要是在帮我们规范和简化重复的后端流程。

### V4：引入 ORM

技术结构：

```text
HTML + CSS + jQuery
Flask
SQLAlchemy + MySQL
```

学习目标：

- 理解 ORM 的作用。
- 把手写 SQL 查询逐步改成模型对象查询。
- 学习模型关系、字段定义、基础查询、事务和数据迁移。

这一版适合对比 `pymysql` 直写 SQL 和 SQLAlchemy 模型查询的差异。

### V5：前后端分离

技术结构：

```text
Vue 或 React
Flask API
SQLAlchemy + MySQL
```

学习目标：

- 理解现代前端组件化开发。
- 后端只提供 JSON API，前端负责页面渲染和交互状态。
- 学习组件、状态、路由、表单、接口封装。

这一版开始接近真实的现代 Web 应用结构。

### V6：工程化和部署

技术结构：

```text
Vue/React + Vite
Flask 或 FastAPI
SQLAlchemy + MySQL
Docker
Nginx
```

学习目标：

- 理解前端构建工具和生产环境打包。
- 理解后端配置管理、日志、错误处理。
- 学习 Docker 环境隔离。
- 学习 Nginx 反向代理和静态资源部署。
- 为项目增加更完整的部署流程。

这一版的目标是把学习项目推进到接近真实上线项目的形态。

### 推荐学习顺序

```text
V1：当前原生版，打基础
V2：jQuery 版，理解前端库
V3：Flask 版，理解后端框架
V4：SQLAlchemy 版，理解 ORM
V5：Vue 或 React 版，理解前后端分离
V6：Docker 部署版，形成完整项目经验
```

不要急着直接跳到 Vue、React 或 FastAPI。

先把 V1 到 V3 走扎实，后面学习框架时就会更清楚：框架到底帮我们省掉了什么、规范了什么、隐藏了什么。
