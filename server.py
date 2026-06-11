"""
server.py

项目入口文件。
使用 Python 原生 http.server，不使用任何 Web 框架。

运行方式：
    python server.py

浏览器访问：
    http://127.0.0.1:8000
"""

import json
import mimetypes
import os
import secrets
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from router import route


# 项目根目录，用于定位 templates 和 static 文件。
BASE_DIR = Path(__file__).resolve().parent

# 后台登录密码：默认是 admin123，学习项目可以先用默认值。
# 真正部署时建议通过环境变量 ADMIN_PASSWORD 设置复杂密码。
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")

# 教材 PDF/听力等大资源的对象存储地址。
# 默认使用当前 v2.0 测试用 Cloudflare R2 公共开发 URL；正式域名准备好后只需要改环境变量。
DEFAULT_ASSET_BASE_URL = "https://pub-932125ce45f74ebbbfea4319730d4d53.r2.dev"
ASSET_BASE_URL = os.getenv("ASSET_BASE_URL", DEFAULT_ASSET_BASE_URL).rstrip("/")

# 后台 Cookie 令牌：用于判断浏览器是否已经登录后台。
# 这里为了教学保持简单；生产项目应改成数据库 session 或签名 token。
ADMIN_SESSION_TOKEN = os.getenv("ADMIN_SESSION_TOKEN", "korean-learn-admin-session")


class KoreanLearnHandler(BaseHTTPRequestHandler):
    """
    自定义请求处理器。

    BaseHTTPRequestHandler 会在收到请求时自动调用 do_GET / do_POST 等方法。
    我们在这些方法里手动解析 URL、请求体，并手动设置响应头。
    """

    def do_GET(self):
        """处理浏览器发来的 GET 请求。"""
        self.handle_request("GET")

    def do_POST(self):
        """处理浏览器发来的 POST 请求。"""
        self.handle_request("POST")

    def do_PUT(self):
        """处理浏览器发来的 PUT 请求，后台编辑数据会用到。"""
        self.handle_request("PUT")

    def do_DELETE(self):
        """处理浏览器发来的 DELETE 请求，后台删除数据会用到。"""
        self.handle_request("DELETE")

    def do_OPTIONS(self):
        """
        处理浏览器的预检请求。
        本项目通常同源访问，不一定会触发 OPTIONS，但保留它方便调试跨域。
        """
        self.send_response(204)
        self.send_cors_headers()
        self.end_headers()

    def handle_request(self, method):
        """统一处理请求，避免 do_GET 和 do_POST 重复写逻辑。"""
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)

        # 首页：返回 templates/index.html。
        if method == "GET" and path == "/":
            self.send_file(BASE_DIR / "templates" / "index.html")
            return

        # 后台登录页：未登录用户会被跳转到这里。
        if method == "GET" and path == "/admin/login":
            self.send_file(BASE_DIR / "templates" / "admin_login.html")
            return

        # 后台首页：访问 /admin 时，根据登录状态决定跳转到哪里。
        if method == "GET" and path == "/admin":
            if self.is_admin_logged_in():
                self.redirect("/admin/scene")
            else:
                self.redirect("/admin/login")
            return

        # 后台页面：只有登录后才能访问；未登录自动跳转登录页。
        if method == "GET" and path in ("/admin/scene", "/admin/sentence", "/admin/material"):
            if not self.is_admin_logged_in():
                self.redirect("/admin/login")
                return
            self.send_file(BASE_DIR / "templates" / "admin.html")
            return

        # 后台登录 API：前端提交密码，后端验证后写入 Cookie。
        if method == "POST" and path == "/api/admin/login":
            body = self.read_json_body()
            password = body.get("password") or ""
            if secrets.compare_digest(password, ADMIN_PASSWORD):
                self.send_json(
                    {"message": "登录成功"},
                    status=200,
                    extra_headers={"Set-Cookie": f"admin_session={ADMIN_SESSION_TOKEN}; Path=/; HttpOnly"},
                )
            else:
                self.send_json({"error": "密码错误"}, status=401)
            return

        # 后台退出 API：把 Cookie 设置为空并立即过期。
        if method == "POST" and path == "/api/admin/logout":
            self.send_json(
                {"message": "已退出登录"},
                extra_headers={"Set-Cookie": "admin_session=; Path=/; Max-Age=0; HttpOnly"},
            )
            return

        # 前端运行配置：教材大文件通过对象存储/CDN 加载。
        if method == "GET" and path == "/api/config":
            self.send_json({"assetBaseUrl": ASSET_BASE_URL})
            return

        # 静态资源：手动读取 static 目录下的 CSS、JS、音频文件。
        if method == "GET" and path.startswith("/static/"):
            self.send_static_file(path)
            return

        # 数据写入接口只允许后台登录后调用。
        # 用户端只需要 GET 查询；新增、编辑、删除都属于后台管理行为。
        if path.startswith("/api/") and method in ("POST", "PUT", "DELETE"):
            public_post_paths = (
                "/api/admin/login",
                "/api/admin/logout",
                "/api/pdf-assistant/chat",
                "/api/pdf-assistant/extract-toc",
            )
            if path not in public_post_paths and not self.is_admin_logged_in():
                self.send_json({"error": "请先登录后台"}, status=401)
                return

        # API 路由：交给 router.py 做手动匹配。
        handled = route(self, method, path, query)
        if handled:
            return

        self.send_json({"error": "路由不存在"}, status=404)

    def read_json_body(self):
        """
        手动读取 JSON 请求体。

        HTTP 请求体的长度由 Content-Length 请求头告诉我们。
        读出来的是 bytes，需要 decode 成字符串，再 json.loads 成字典。
        """
        length = int(self.headers.get("Content-Length", 0))
        if length == 0:
            return {}

        raw_body = self.rfile.read(length).decode("utf-8")
        try:
            return json.loads(raw_body)
        except json.JSONDecodeError:
            self.send_json({"error": "请求体不是合法 JSON"}, status=400)
            return {}

    def send_json(self, data, status=200, extra_headers=None):
        """手动返回 JSON 响应。"""
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_cors_headers()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        for key, value in (extra_headers or {}).items():
            self.send_header(key, value)
        self.end_headers()
        self.wfile.write(body)

    def redirect(self, location):
        """手动返回 302 跳转响应。"""
        self.send_response(302)
        self.send_header("Location", location)
        self.end_headers()

    def is_admin_logged_in(self):
        """从 Cookie 请求头中判断当前浏览器是否已经登录后台。"""
        cookie = self.headers.get("Cookie", "")
        expected = f"admin_session={ADMIN_SESSION_TOKEN}"
        return expected in cookie

    def send_file(self, file_path):
        """读取并返回一个普通文件，例如 HTML。"""
        if not file_path.exists() or not file_path.is_file():
            self.send_json({"error": "文件不存在"}, status=404)
            return

        file_size = file_path.stat().st_size
        content_type = mimetypes.guess_type(str(file_path))[0] or "application/octet-stream"
        byte_range = self.parse_range_header(self.headers.get("Range"), file_size)

        if byte_range is None and self.headers.get("Range"):
            self.send_response(416)
            self.send_header("Content-Range", f"bytes */{file_size}")
            self.send_header("Accept-Ranges", "bytes")
            self.end_headers()
            return

        if byte_range:
            start, end = byte_range
            content_length = end - start + 1
            self.send_response(206)
            self.send_header("Content-Type", f"{content_type}; charset=utf-8")
            self.send_header("Content-Length", str(content_length))
            self.send_header("Content-Range", f"bytes {start}-{end}/{file_size}")
            self.send_header("Accept-Ranges", "bytes")
            self.end_headers()
            with file_path.open("rb") as file:
                file.seek(start)
                self.wfile.write(file.read(content_length))
            return

        content = file_path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", f"{content_type}; charset=utf-8")
        self.send_header("Content-Length", str(len(content)))
        self.send_header("Accept-Ranges", "bytes")
        self.end_headers()
        self.wfile.write(content)

    def parse_range_header(self, range_header, file_size):
        """解析单段 bytes Range 请求，用于音频拖动播放。"""
        if not range_header or not range_header.startswith("bytes=") or file_size <= 0:
            return None

        range_value = range_header.removeprefix("bytes=").split(",", 1)[0].strip()
        if "-" not in range_value:
            return None

        start_text, end_text = range_value.split("-", 1)
        try:
            if start_text == "":
                suffix_length = int(end_text)
                if suffix_length <= 0:
                    return None
                start = max(file_size - suffix_length, 0)
                end = file_size - 1
            else:
                start = int(start_text)
                end = int(end_text) if end_text else file_size - 1
        except ValueError:
            return None

        if start < 0 or end < start or start >= file_size:
            return None

        return start, min(end, file_size - 1)

    def send_static_file(self, url_path):
        """
        返回 static 目录中的文件。

        这里额外检查 resolved_path 是否还在 static 目录内，
        防止有人构造 /static/../db.py 读取项目源码。
        """
        static_dir = BASE_DIR / "static"
        requested = (BASE_DIR / url_path.lstrip("/")).resolve()

        if static_dir.resolve() not in requested.parents and requested != static_dir.resolve():
            self.send_json({"error": "非法静态文件路径"}, status=403)
            return

        self.send_file(requested)

    def send_cors_headers(self):
        """设置基础 CORS 响应头，方便前端调试。"""
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def log_message(self, format, *args):
        """保留简洁日志，方便看到浏览器请求了什么。"""
        print("[%s] %s" % (self.log_date_time_string(), format % args))


def run():
    """启动 HTTP 服务。"""
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))
    server = HTTPServer((host, port), KoreanLearnHandler)
    print(f"韩语学习网站已启动：http://{host}:{port}")
    server.serve_forever()


if __name__ == "__main__":
    run()
