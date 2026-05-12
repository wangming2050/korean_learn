"""
教材模块接口：
- GET  /api/materials       查询教材列表
- GET  /api/materials?id=1  查询单个教材
- POST /api/materials       新增教材
- PUT  /api/materials?id=1  编辑教材
- DELETE /api/materials?id=1 删除教材
"""

import json

from db import execute, fetch_all, fetch_one


def handle_material_request(handler, method, path, query):
    """处理所有 /api/materials 开头的请求。"""
    if method == "GET" and path == "/api/materials":
        material_id = query.get("id", [""])[0]

        if material_id:
            row = fetch_one(
                "SELECT id, title, chapter, audio_url, content FROM material WHERE id = %s",
                (material_id,),
            )
            if not row:
                handler.send_json({"error": "教材不存在"}, status=404)
                return True

            # content 字段保存 JSON 字符串，返回前尝试解析成数组。
            row["content"] = _parse_content(row["content"])
            handler.send_json({"data": row})
            return True

        rows = fetch_all("SELECT id, title, chapter, audio_url, content FROM material ORDER BY id")
        for row in rows:
            row["content"] = _parse_content(row["content"])
        handler.send_json({"data": rows})
        return True

    if method == "POST" and path == "/api/materials":
        body = handler.read_json_body()
        title = (body.get("title") or "").strip()
        chapter = (body.get("chapter") or "").strip()
        audio_url = (body.get("audio_url") or "").strip()
        content = body.get("content") or []

        if not title:
            handler.send_json({"error": "教材标题不能为空"}, status=400)
            return True

        material_id = execute(
            """
            INSERT INTO material (title, chapter, audio_url, content)
            VALUES (%s, %s, %s, %s)
            """,
            (title, chapter, audio_url, json.dumps(content, ensure_ascii=False)),
        )
        handler.send_json({"id": material_id}, status=201)
        return True

    if method == "PUT" and path == "/api/materials":
        material_id = query.get("id", [""])[0]
        body = handler.read_json_body()
        title = (body.get("title") or "").strip()
        chapter = (body.get("chapter") or "").strip()
        audio_url = (body.get("audio_url") or "").strip()
        content = body.get("content") or []

        if not material_id or not title:
            handler.send_json({"error": "教材 id 和标题不能为空"}, status=400)
            return True

        execute(
            """
            UPDATE material
            SET title = %s,
                chapter = %s,
                audio_url = %s,
                content = %s
            WHERE id = %s
            """,
            (title, chapter, audio_url, json.dumps(content, ensure_ascii=False), material_id),
        )
        handler.send_json({"id": material_id})
        return True

    if method == "DELETE" and path == "/api/materials":
        material_id = query.get("id", [""])[0]

        if not material_id:
            handler.send_json({"error": "教材 id 不能为空"}, status=400)
            return True

        execute("DELETE FROM material WHERE id = %s", (material_id,))
        handler.send_json({"message": "教材已删除"})
        return True

    return None


def _parse_content(raw_content):
    """把数据库中的 content 字段解析成前端更容易使用的数组。"""
    if not raw_content:
        return []

    try:
        return json.loads(raw_content)
    except json.JSONDecodeError:
        # 如果数据库里是普通文本，就按行拆成句子，并给默认时间轴。
        lines = [line.strip() for line in raw_content.splitlines() if line.strip()]
        return [{"text": line, "start": 0, "end": 0} for line in lines]
