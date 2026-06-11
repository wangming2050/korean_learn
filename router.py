"""
router.py

这里实现一个非常小的“手写路由器”。
不用 Flask / Django / FastAPI，所有 URL 都靠 if 判断和函数映射完成。
"""

# 导入教材模块的请求处理函数。
from handler.material import handle_material_request

# 导入 PDF AI 助教模块的请求处理函数。
from handler.pdf_assistant import handle_pdf_assistant_request

# 导入场景模块的请求处理函数。
from handler.scene import handle_scene_request

# 导入句子、音标、词汇模块的请求处理函数。
from handler.sentence import handle_sentence_request


def route(handler, method, path, query):
    """
    根据请求方法和路径分发到不同的处理函数。

    handler: BaseHTTPRequestHandler 对象，用它读取 body、写响应。
    method: 请求方法，例如 GET、POST。
    path: 不带 query string 的路径，例如 /api/scenes。
    query: 已经解析好的 query 参数字典。
    """
    # 如果路径以 /api/scenes 开头，就交给场景 handler。
    if path.startswith("/api/scenes"):
        return handle_scene_request(handler, method, path, query)

    # 句子、音标、词汇这三类接口都写在 handler/sentence.py 中。
    # 因为这个示例项目较小，把它们放在一起可以少建几个文件，便于初学者阅读。
    # 如果路径属于句子、音标、词汇，就交给句子 handler。
    if (
        path.startswith("/api/sentences")
        or path.startswith("/api/letters")
        or path.startswith("/api/vocabulary")
    ):
        return handle_sentence_request(handler, method, path, query)

    # 如果路径以 /api/materials 开头，就交给教材 handler。
    if path.startswith("/api/materials"):
        return handle_material_request(handler, method, path, query)

    # 如果路径以 /api/pdf-assistant 开头，就交给 PDF AI 助教 handler。
    if path.startswith("/api/pdf-assistant"):
        return handle_pdf_assistant_request(handler, method, path, query)

    # 没有匹配到任何 API 路由时，返回 None，让 server.py 统一返回 404。
    return None
