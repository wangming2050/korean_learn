"""
场景模块接口：
- GET  /api/scenes       查询所有场景
- POST /api/scenes       新增场景
- PUT  /api/scenes?id=1  编辑场景
- DELETE /api/scenes?id=1 删除场景
"""

# execute 用来执行 INSERT/UPDATE/DELETE，fetch_all 用来查询列表。
from db import execute, fetch_all


def handle_scene_request(handler, method, path, query):
    """处理所有 /api/scenes 开头的请求。"""
    # GET /api/scenes：查询全部场景，用于用户端下拉框和后台列表。
    if method == "GET" and path == "/api/scenes":
        # 直接写 SQL，ORDER BY id 保证列表顺序稳定。
        scenes = fetch_all("SELECT id, name FROM scene ORDER BY id")
        # 把查询结果包在 data 字段里返回，前端统一读取 result.data。
        handler.send_json({"data": scenes})
        return True

    # POST /api/scenes：新增一个场景。
    if method == "POST" and path == "/api/scenes":
        # 读取 JSON 请求体，例如 {"name": "问路"}。
        body = handler.read_json_body()
        # 取出 name，并去掉前后空格；没有 name 时用空字符串。
        name = (body.get("name") or "").strip()

        # 基础校验：场景名不能为空。
        if not name:
            handler.send_json({"error": "场景名称不能为空"}, status=400)
            return True

        # 插入数据库，execute 返回自增 id。
        scene_id = execute("INSERT INTO scene (name) VALUES (%s)", (name,))
        # 201 表示创建成功。
        handler.send_json({"id": scene_id, "name": name}, status=201)
        return True

    # PUT /api/scenes?id=1：编辑指定 id 的场景。
    if method == "PUT" and path == "/api/scenes":
        # query 是 parse_qs 的结果，所以每个值都是列表；这里取第一个。
        scene_id = query.get("id", [""])[0]
        # 读取 JSON 请求体。
        body = handler.read_json_body()
        # 取出新的场景名称。
        name = (body.get("name") or "").strip()

        # id 和 name 都必须存在。
        if not scene_id or not name:
            handler.send_json({"error": "场景 id 和名称不能为空"}, status=400)
            return True

        # 执行 UPDATE。
        execute("UPDATE scene SET name = %s WHERE id = %s", (name, scene_id))
        # 返回更新后的基本数据。
        handler.send_json({"id": scene_id, "name": name})
        return True

    # DELETE /api/scenes?id=1：删除指定 id 的场景。
    if method == "DELETE" and path == "/api/scenes":
        # 从 query string 里取出 id。
        scene_id = query.get("id", [""])[0]

        # 没有 id 就不能知道要删除哪条。
        if not scene_id:
            handler.send_json({"error": "场景 id 不能为空"}, status=400)
            return True

        # 执行删除；如果该场景下还有句子，MySQL 外键可能会阻止删除。
        execute("DELETE FROM scene WHERE id = %s", (scene_id,))
        # 返回简单成功消息。
        handler.send_json({"message": "场景已删除"})
        return True

    # 如果不是本文件能处理的路由，返回 None 交回 router/server。
    return None
