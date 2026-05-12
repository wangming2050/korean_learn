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
set ADMIN_PASSWORD=你的后台密码
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

1. 安装依赖：

   ```bash
   pip install -r requirements.txt
   ```

2. 创建 MySQL 数据库并导入示例数据：

   ```bash
   mysql -u root -p < sql/schema.sql
   ```

3. 如果你的 MySQL 配置不是默认值，可以设置环境变量：

   ```bash
   set MYSQL_HOST=127.0.0.1
   set MYSQL_PORT=3306
   set MYSQL_USER=root
   set MYSQL_PASSWORD=你的数据库密码
   set MYSQL_DATABASE=korean_learn
   ```

4. 启动服务：

   ```bash
   python server.py
   ```

5. 打开用户端或后台：

   ```text
   http://127.0.0.1:8000/
   http://127.0.0.1:8000/admin
   ```

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
