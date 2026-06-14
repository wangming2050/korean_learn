"""
场景模块接口：
- GET  /api/scenes       查询所有场景
- POST /api/scenes       新增场景
- PUT  /api/scenes?id=1  编辑场景
- DELETE /api/scenes?id=1 删除场景
"""

import os
import json
from pathlib import Path
import urllib.error
import urllib.parse
import urllib.request

# execute 用来执行 INSERT/UPDATE/DELETE，fetch_all 用来查询列表。
from db import execute, fetch_all, fetch_one
from handler.seed_content import DEFAULT_SCENES


LOCAL_AI_ENV_PATH = Path(__file__).resolve().parent.parent / ".env.ai.local"
GEMINI_API_URL_TEMPLATE = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
DEFAULT_GEMINI_MODEL = "gemini-2.5-flash"
SCENE_EN_FALLBACK = {
    "学校": "Campus",
    "课堂": "Classroom",
    "教室": "Classroom",
    "图书馆": "Library",
    "医院": "Clinic",
    "药店": "Pharmacy",
    "诊所": "Clinic",
    "交通": "Transit",
    "问路": "Directions",
    "地铁": "Subway",
    "公交": "Bus",
    "出租车": "Taxi",
    "机场": "Airport",
    "车站": "Station",
    "餐厅": "Dining",
    "咖啡厅": "Cafe",
    "购物": "Shopping",
    "服装店": "Clothing Store",
    "衣服店": "Clothing Store",
    "服饰店": "Clothing Store",
    "商店": "Store",
    "便利店": "Convenience Store",
    "百货商店": "Department Store",
    "百货店": "Department Store",
    "鞋店": "Shoe Store",
    "书店": "Bookstore",
    "化妆品店": "Cosmetics Store",
    "市场": "Market",
    "超市": "Supermarket",
    "住宿": "Stay",
    "酒店": "Hotel",
    "旅馆": "Hotel",
    "旅游": "Travel",
    "旅行": "Travel",
    "旅行准备": "Travel Prep",
    "出行": "Travel",
    "银行": "Bank",
    "邮局": "Post Office",
    "工作": "Work",
    "公司": "Office",
    "办公室": "Office",
    "面试": "Interview",
    "朋友": "Friends",
    "家庭": "Family",
    "天气": "Weather",
    "日期": "Dates",
    "时间": "Time",
    "电话": "Phone",
    "打招呼": "Greeting",
    "自我介绍": "Intro",
    "预约": "Reservation",
    "租房": "Renting",
    "快递": "Delivery",
    "移民": "Immigration",
    "海关": "Customs",
    "紧急情况": "Emergency",
    "文化": "Culture",
    "节日": "Holidays",
    "运动": "Sports",
    "爱好": "Hobbies",
}


def load_local_ai_env():
    if not LOCAL_AI_ENV_PATH.exists():
        return
    for raw_line in LOCAL_AI_ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip("'\"")
        if key and key not in os.environ:
            os.environ[key] = value


load_local_ai_env()


def clean_api_key(value):
    if not value:
        return None
    value = value.strip()
    if not value or "你的" in value or "API Key" in value:
        return None
    return value


def ensure_scene_schema():
    columns = {row["Field"] for row in fetch_all("DESCRIBE scene")}
    if "en" not in columns:
        execute("ALTER TABLE scene ADD COLUMN en VARCHAR(80) DEFAULT 'Scene' AFTER name")
        for scene in DEFAULT_SCENES:
            execute(
                "UPDATE scene SET en = %s WHERE id = %s",
                (scene.get("en") or translate_scene_name_fallback(scene["name"]), scene["id"]),
            )

    scenes = fetch_all("SELECT id, name, en FROM scene")
    for scene in scenes:
        current_en = normalize_scene_en(scene.get("en") or "")
        if current_en and current_en != "Scene":
            continue
        fallback_en = translate_scene_name_fallback(scene.get("name") or "")
        if fallback_en:
            execute("UPDATE scene SET en = %s WHERE id = %s", (fallback_en, scene["id"]))


def translate_scene_name_fallback(name):
    if not name:
        return ""
    normalized_name = "".join(str(name).split())
    if normalized_name in SCENE_EN_FALLBACK:
        return SCENE_EN_FALLBACK[normalized_name]
    for chinese, english in sorted(SCENE_EN_FALLBACK.items(), key=lambda item: len(item[0]), reverse=True):
        if chinese and chinese in normalized_name:
            return english
    return ""


def normalize_scene_en(value):
    value = (value or "").strip()
    if not value:
        return ""
    value = "".join(ch for ch in value if ch.isalpha() or ch in (" ", "-", "&", "'")).strip()
    if not value:
        return ""
    return " ".join(value.split())[:80]


def translate_scene_name_with_gemini(name):
    api_key = clean_api_key(os.getenv("GEMINI_API_KEY"))
    if not api_key:
        return ""

    model = os.getenv("GEMINI_MODEL", DEFAULT_GEMINI_MODEL)
    prompt = (
        "You create short English UI category labels for a Korean learning app. "
        "Do not translate word-for-word if a natural learning-scene label is better. "
        "Return only one English label, 1-2 words, Title Case, no punctuation.\n"
        "Examples:\n"
        "学校 -> Campus\n"
        "医院 -> Clinic\n"
        "交通 -> Transit\n"
        "旅游 -> Travel\n"
        "旅行准备 -> Travel Prep\n"
        "机场 -> Airport\n"
        f"Chinese scene name: {name}"
    )
    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.1, "maxOutputTokens": 16},
    }
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    url = GEMINI_API_URL_TEMPLATE.format(
        model=urllib.parse.quote(model, safe=""),
        api_key=urllib.parse.quote(api_key, safe=""),
    )
    request = urllib.request.Request(
        url,
        data=data,
        method="POST",
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            result = json.loads(response.read().decode("utf-8"))
    except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, json.JSONDecodeError):
        return ""

    candidates = result.get("candidates") or []
    if not candidates:
        return ""
    parts = candidates[0].get("content", {}).get("parts") or []
    text = "".join(part.get("text", "") for part in parts)
    return normalize_scene_en(text.splitlines()[0] if text else "")


def resolve_scene_en(name, requested_en=""):
    requested_en = normalize_scene_en(requested_en)
    if requested_en:
        return requested_en
    fallback_en = translate_scene_name_fallback(name)
    if fallback_en:
        return fallback_en
    gemini_en = translate_scene_name_with_gemini(name)
    if gemini_en:
        return gemini_en
    return "Scene"


def handle_scene_request(handler, method, path, query):
    """处理所有 /api/scenes 开头的请求。"""
    # GET /api/scenes：查询全部场景，用于用户端下拉框和后台列表。
    if method == "GET" and path == "/api/scenes":
        try:
            ensure_scene_schema()
            # 直接写 SQL，ORDER BY id 保证列表顺序稳定。
            scenes = fetch_all("SELECT id, name, en FROM scene ORDER BY id")
        except Exception:
            scenes = DEFAULT_SCENES
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

        ensure_scene_schema()
        scene_en = resolve_scene_en(name, body.get("en") or "")

        # 插入数据库，execute 返回自增 id。
        scene_id = execute("INSERT INTO scene (name, en) VALUES (%s, %s)", (name, scene_en))
        # 201 表示创建成功。
        handler.send_json({"id": scene_id, "name": name, "en": scene_en}, status=201)
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

        ensure_scene_schema()
        scene_en = resolve_scene_en(name, body.get("en") or "")

        # 执行 UPDATE。
        execute("UPDATE scene SET name = %s, en = %s WHERE id = %s", (name, scene_en, scene_id))
        # 返回更新后的基本数据。
        handler.send_json({"id": scene_id, "name": name, "en": scene_en})
        return True

    # DELETE /api/scenes?id=1：删除指定 id 的场景。
    if method == "DELETE" and path == "/api/scenes":
        # 从 query string 里取出 id。
        scene_id = query.get("id", [""])[0]

        # 没有 id 就不能知道要删除哪条。
        if not scene_id:
            handler.send_json({"error": "场景 id 不能为空"}, status=400)
            return True

        ensure_scene_schema()
        sentence_count = fetch_one(
            "SELECT COUNT(*) AS count FROM sentence WHERE scene_id = %s",
            (scene_id,),
        )
        if sentence_count and sentence_count["count"] > 0:
            handler.send_json({"error": "该场景下还有例句，请先删除或迁移例句"}, status=400)
            return True

        # 执行删除；如果该场景下还有句子，MySQL 外键可能会阻止删除。
        execute("DELETE FROM scene WHERE id = %s", (scene_id,))
        # 返回简单成功消息。
        handler.send_json({"message": "场景已删除"})
        return True

    # 如果不是本文件能处理的路由，返回 None 交回 router/server。
    return None
