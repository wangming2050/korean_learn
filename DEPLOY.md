# 线上部署说明

当前项目是：

```text
Python 原生 http.server + MySQL
```

它和之前的 blog 项目不同：

```text
blog：Vercel 静态前端 + Supabase 数据库
korean_learn：Python 后端服务 + MySQL 数据库
```

因此这个项目更适合部署到 Railway、Render、PythonAnywhere 这类可以运行后端服务的平台。

## 推荐方案：Railway + Railway MySQL

Railway 可以同时创建：

- 一个 Python Web 服务
- 一个 MySQL 数据库

项目里已经准备了 Railway 配置：

```text
railway.json
Procfile
```

线上服务启动命令是：

```bash
HOST=0.0.0.0 python3 server.py
```

`server.py` 会自动读取平台提供的 `PORT`。

## 1. 推送代码到 GitHub

确认远程仓库：

```bash
git remote -v
```

当前项目仓库：

```text
https://github.com/testerwm/korean_learn
```

提交并推送：

```bash
git add .
git commit -m "Prepare Railway deployment"
git push origin main
```

如果你的默认分支不是 `main`，按实际分支名推送。

## 2. 在 Railway 创建项目

1. 打开 Railway。
2. 选择 `New Project`。
3. 选择 `Deploy from GitHub repo`。
4. 选择 `testerwm/korean_learn`。
5. Railway 会识别 Python 项目并安装 `requirements.txt`。

## 3. 添加 MySQL 数据库

在 Railway 项目里添加一个 MySQL 服务。

Railway MySQL 通常会提供这些环境变量：

```text
MYSQLHOST
MYSQLPORT
MYSQLUSER
MYSQLPASSWORD
MYSQLDATABASE
MYSQL_URL
```

项目的 `db.py` 已经兼容这些变量。

也就是说，线上不需要手动写：

```text
MYSQL_HOST
MYSQL_PORT
MYSQL_USER
MYSQL_PASSWORD
MYSQL_DATABASE
```

Railway 提供的变量可以直接使用。

## 4. 初始化线上数据库

MySQL 服务创建好以后，需要把本项目的表结构和示例数据导入线上数据库。

Railway 通常已经创建了默认数据库，所以推荐导入云端专用脚本：

```bash
mysql -h 线上MYSQLHOST -P 线上MYSQLPORT -u 线上MYSQLUSER -p 线上MYSQLDATABASE < sql/schema-cloud.sql
```

其中：

- `线上MYSQLHOST`：Railway 提供的 `MYSQLHOST`
- `线上MYSQLPORT`：Railway 提供的 `MYSQLPORT`
- `线上MYSQLUSER`：Railway 提供的 `MYSQLUSER`
- `线上MYSQLDATABASE`：Railway 提供的 `MYSQLDATABASE`

执行时会提示输入密码，输入 Railway 的 `MYSQLPASSWORD`。

如果是本机 MySQL，可以继续使用：

```bash
mysql -u root -p < sql/schema.sql
```

## 5. 设置后台密码

建议在线上服务里设置环境变量：

```text
ADMIN_PASSWORD=一个更复杂的后台密码
ADMIN_SESSION_TOKEN=一个随机长字符串
```

不要在 GitHub 代码里写真实密码。

## 6. 访问线上地址

部署成功后，Railway 会给 Web 服务一个公开域名。

打开域名即可访问用户端。

后台地址：

```text
https://你的域名/admin
```

## 常见问题

### 页面能打开，但接口报数据库错误

通常是线上 MySQL 没初始化。

重新执行：

```bash
mysql -h 线上MYSQLHOST -P 线上MYSQLPORT -u 线上MYSQLUSER -p 线上MYSQLDATABASE < sql/schema.sql
```

### 部署成功但页面打不开

确认服务监听的是：

```text
0.0.0.0
```

项目里的 `railway.json` 已经设置：

```text
HOST=0.0.0.0 bash railway-start.sh
```

### 用户 PDF 教材打不开

v2.2 起，默认教材阅读流程不再依赖 R2 公共教材资源。用户在浏览器里上传自己的 PDF，前端用 PDF.js 在本机转成低清/高清页图 Blob，并保存到 IndexedDB。PDF 和页图不会上传到 Railway、Git 仓库或 R2。

部署时不需要为用户自上传 PDF 配置 `ASSET_BASE_URL`。如果页面能打开但 PDF 无法转换，优先检查：

- 浏览器是否支持 IndexedDB、Canvas 和 WebP。
- 浏览器是否能加载 PDF.js CDN：`cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38`。
- PDF 是否超过前端限制：单文件 300MB、最多 600 页。
- 浏览器开发者工具 Console 是否出现 PDF.js 解析错误。
- Safari 隐私模式或浏览器存储配额是否阻止 IndexedDB 写入。

R2 相关脚本目前只保留为后续“用户私有云端存储”方案的工具，不参与默认部署流程。

### 登录后台后 Cookie 不安全

当前项目是教学项目，Cookie 逻辑比较简单。

正式线上使用时，建议后续版本改成 Flask/FastAPI，并使用更完整的 session 或 token 方案。
