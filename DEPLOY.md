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

### 部署后提示教材 PDF 不存在或打不开

教材 PDF 使用 Git LFS 管理。Railway 通过 Nixpacks 构建时，项目里的 `nixpacks.toml` 会安装 `curl`、`git` 和 `git-lfs`，并在构建阶段尝试拉取 `static/textbooks/**/*.pdf`。

Railway 的运行容器不一定保留 `.git` 目录，所以启动时 `railway-start.sh` 会优先从环境变量 `YONSEI1_PDF_URL` 下载真实 PDF，并校验文件头和文件大小。请在 Railway Variables 里添加：

```text
YONSEI1_PDF_URL=https://github.com/testerwm/korean_learn/raw/main/static/textbooks/yonsei1/yonsei-korean-1.pdf
```

如果 Railway 日志提示 `YONSEI1_PDF_URL is not configured` 或 `Downloaded textbook file is not a valid PDF`，说明当前部署环境没有拿到真实 PDF，或下载地址不可用。短期可以检查变量和下载 URL；长期建议把 PDF 放到对象存储或 CDN，再让教材 manifest 指向外部 URL。

### 登录后台后 Cookie 不安全

当前项目是教学项目，Cookie 逻辑比较简单。

正式线上使用时，建议后续版本改成 Flask/FastAPI，并使用更完整的 session 或 token 方案。
