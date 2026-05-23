"""
句子模块接口：
- GET  /api/sentences?scene_id=1  按场景查询句子
- POST /api/sentences             新增句子
- PUT  /api/sentences?id=1        编辑句子
- DELETE /api/sentences?id=1      删除句子
- GET  /api/vocabulary            查询词汇及关联例句
- GET  /api/letters               返回 40 个韩文字母演示数据
"""

from db import execute, fetch_all


KOREAN_LETTERS = [
    {"letter": "ㄱ", "word": "가방", "meaning": "书包", "audio_url": "/static/audio/letters/giyeok.mp3"},
    {"letter": "ㄴ", "word": "나무", "meaning": "树", "audio_url": "/static/audio/letters/nieun.mp3"},
    {"letter": "ㄷ", "word": "다리", "meaning": "腿/桥", "audio_url": "/static/audio/letters/digeut.mp3"},
    {"letter": "ㄹ", "word": "라면", "meaning": "拉面", "audio_url": "/static/audio/letters/rieul.mp3"},
    {"letter": "ㅁ", "word": "모자", "meaning": "帽子", "audio_url": "/static/audio/letters/mieum.mp3"},
    {"letter": "ㅂ", "word": "바다", "meaning": "大海", "audio_url": "/static/audio/letters/bieup.mp3"},
    {"letter": "ㅅ", "word": "사과", "meaning": "苹果", "audio_url": "/static/audio/letters/siot.mp3"},
    {"letter": "ㅇ", "word": "아이", "meaning": "孩子", "audio_url": "/static/audio/letters/ieung.mp3"},
    {"letter": "ㅈ", "word": "지도", "meaning": "地图", "audio_url": "/static/audio/letters/jieut.mp3"},
    {"letter": "ㅊ", "word": "차", "meaning": "车/茶", "audio_url": "/static/audio/letters/chieut.mp3"},
    {"letter": "ㅋ", "word": "코", "meaning": "鼻子", "audio_url": "/static/audio/letters/kieuk.mp3"},
    {"letter": "ㅌ", "word": "토마토", "meaning": "番茄", "audio_url": "/static/audio/letters/tieut.mp3"},
    {"letter": "ㅍ", "word": "포도", "meaning": "葡萄", "audio_url": "/static/audio/letters/pieup.mp3"},
    {"letter": "ㅎ", "word": "하늘", "meaning": "天空", "audio_url": "/static/audio/letters/hieut.mp3"},
    {"letter": "ㄲ", "word": "꼬리", "meaning": "尾巴", "audio_url": "/static/audio/letters/ssang_giyeok.mp3"},
    {"letter": "ㄸ", "word": "딸기", "meaning": "草莓", "audio_url": "/static/audio/letters/ssang_digeut.mp3"},
    {"letter": "ㅃ", "word": "빵", "meaning": "面包", "audio_url": "/static/audio/letters/ssang_bieup.mp3"},
    {"letter": "ㅆ", "word": "쌀", "meaning": "米", "audio_url": "/static/audio/letters/ssang_siot.mp3"},
    {"letter": "ㅉ", "word": "짜다", "meaning": "咸", "audio_url": "/static/audio/letters/ssang_jieut.mp3"},
    {"letter": "ㅏ", "word": "아기", "meaning": "婴儿", "audio_url": "/static/audio/letters/a.mp3"},
    {"letter": "ㅑ", "word": "야구", "meaning": "棒球", "audio_url": "/static/audio/letters/ya.mp3"},
    {"letter": "ㅓ", "word": "어머니", "meaning": "妈妈", "audio_url": "/static/audio/letters/eo.mp3"},
    {"letter": "ㅕ", "word": "여자", "meaning": "女人", "audio_url": "/static/audio/letters/yeo.mp3"},
    {"letter": "ㅗ", "word": "오이", "meaning": "黄瓜", "audio_url": "/static/audio/letters/o.mp3"},
    {"letter": "ㅛ", "word": "요리", "meaning": "料理", "audio_url": "/static/audio/letters/yo.mp3"},
    {"letter": "ㅜ", "word": "우유", "meaning": "牛奶", "audio_url": "/static/audio/letters/u.mp3"},
    {"letter": "ㅠ", "word": "유리", "meaning": "玻璃", "audio_url": "/static/audio/letters/yu.mp3"},
    {"letter": "ㅡ", "word": "음악", "meaning": "音乐", "audio_url": "/static/audio/letters/eu.mp3"},
    {"letter": "ㅣ", "word": "이름", "meaning": "名字", "audio_url": "/static/audio/letters/i.mp3"},
    {"letter": "ㅐ", "word": "개", "meaning": "狗", "audio_url": "/static/audio/letters/ae.mp3"},
    {"letter": "ㅒ", "word": "얘기", "meaning": "故事/聊天", "audio_url": "/static/audio/letters/yae.mp3"},
    {"letter": "ㅔ", "word": "게", "meaning": "螃蟹", "audio_url": "/static/audio/letters/e.mp3"},
    {"letter": "ㅖ", "word": "예", "meaning": "是/例", "audio_url": "/static/audio/letters/ye.mp3"},
    {"letter": "ㅘ", "word": "과자", "meaning": "点心", "audio_url": "/static/audio/letters/wa.mp3"},
    {"letter": "ㅙ", "word": "왜", "meaning": "为什么", "audio_url": "/static/audio/letters/wae.mp3"},
    {"letter": "ㅚ", "word": "외국", "meaning": "外国", "audio_url": "/static/audio/letters/oe.mp3"},
    {"letter": "ㅝ", "word": "워터", "meaning": "水/water", "audio_url": "/static/audio/letters/wo.mp3"},
    {"letter": "ㅞ", "word": "웨이터", "meaning": "服务员", "audio_url": "/static/audio/letters/we.mp3"},
    {"letter": "ㅟ", "word": "위", "meaning": "上面", "audio_url": "/static/audio/letters/wi.mp3"},
    {"letter": "ㅢ", "word": "의자", "meaning": "椅子", "audio_url": "/static/audio/letters/ui.mp3"},
]

for item in KOREAN_LETTERS:
    audio_url = item.get("audio_url") or ""
    directory, filename = audio_url.rsplit("/", 1)
    item["letter_audio_url"] = f"{directory}/letter_{filename}"


def handle_sentence_request(handler, method, path, query):
    """处理句子、词汇、字母相关接口。"""
    if method == "GET" and path == "/api/letters":
        handler.send_json({"data": KOREAN_LETTERS})
        return True

    if method == "GET" and path == "/api/sentences":
        scene_id = query.get("scene_id", [""])[0]

        if scene_id:
            rows = fetch_all(
                """
                SELECT
                  s.id,
                  s.korean,
                  s.chinese,
                  s.audio_url,
                  s.audio_start,
                  s.audio_end,
                  s.scene_id,
                  sc.name AS scene_name
                FROM sentence s
                LEFT JOIN scene sc ON sc.id = s.scene_id
                WHERE s.scene_id = %s
                ORDER BY s.id
                """,
                (scene_id,),
            )
        else:
            rows = fetch_all(
                """
                SELECT
                  s.id,
                  s.korean,
                  s.chinese,
                  s.audio_url,
                  s.audio_start,
                  s.audio_end,
                  s.scene_id,
                  sc.name AS scene_name
                FROM sentence s
                LEFT JOIN scene sc ON sc.id = s.scene_id
                ORDER BY s.id
                """
            )

        handler.send_json({"data": rows})
        return True

    if method == "POST" and path == "/api/sentences":
        body = handler.read_json_body()
        korean = (body.get("korean") or "").strip()
        chinese = (body.get("chinese") or "").strip()
        audio_url = (body.get("audio_url") or "").strip()
        scene_id = body.get("scene_id")
        audio_start = body.get("audio_start") or 0
        audio_end = body.get("audio_end") or 0

        if not korean or not chinese or not scene_id:
            handler.send_json({"error": "韩文、中文翻译、场景 id 都不能为空"}, status=400)
            return True

        sentence_id = execute(
            """
            INSERT INTO sentence (korean, chinese, audio_url, audio_start, audio_end, scene_id)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (korean, chinese, audio_url, audio_start, audio_end, scene_id),
        )
        handler.send_json({"id": sentence_id}, status=201)
        return True

    if method == "PUT" and path == "/api/sentences":
        sentence_id = query.get("id", [""])[0]
        body = handler.read_json_body()
        korean = (body.get("korean") or "").strip()
        chinese = (body.get("chinese") or "").strip()
        audio_url = (body.get("audio_url") or "").strip()
        scene_id = body.get("scene_id")
        audio_start = body.get("audio_start") or 0
        audio_end = body.get("audio_end") or 0

        if not sentence_id or not korean or not chinese or not scene_id:
            handler.send_json({"error": "句子 id、韩文、中文翻译、场景 id 都不能为空"}, status=400)
            return True

        execute(
            """
            UPDATE sentence
            SET korean = %s,
                chinese = %s,
                audio_url = %s,
                audio_start = %s,
                audio_end = %s,
                scene_id = %s
            WHERE id = %s
            """,
            (korean, chinese, audio_url, audio_start, audio_end, scene_id, sentence_id),
        )
        handler.send_json({"id": sentence_id})
        return True

    if method == "DELETE" and path == "/api/sentences":
        sentence_id = query.get("id", [""])[0]

        if not sentence_id:
            handler.send_json({"error": "句子 id 不能为空"}, status=400)
            return True

        execute("DELETE FROM sentence WHERE id = %s", (sentence_id,))
        handler.send_json({"message": "句子已删除"})
        return True

    if method == "GET" and path == "/api/vocabulary":
        keyword = query.get("q", [""])[0].strip()

        if keyword:
            rows = fetch_all(
                """
                SELECT
                  v.id,
                  v.korean,
                  v.chinese,
                  v.pos,
                  s.id AS sentence_id,
                  s.korean AS sentence_korean,
                  s.chinese AS sentence_chinese,
                  s.audio_url
                FROM vocabulary v
                LEFT JOIN sentence s ON s.korean LIKE CONCAT('%%', v.korean, '%%')
                WHERE v.korean LIKE CONCAT('%%', %s, '%%')
                   OR v.chinese LIKE CONCAT('%%', %s, '%%')
                ORDER BY v.id, s.id
                """,
                (keyword, keyword),
            )
        else:
            rows = fetch_all(
                """
                SELECT
                  v.id,
                  v.korean,
                  v.chinese,
                  v.pos,
                  s.id AS sentence_id,
                  s.korean AS sentence_korean,
                  s.chinese AS sentence_chinese,
                  s.audio_url
                FROM vocabulary v
                LEFT JOIN sentence s ON s.korean LIKE CONCAT('%%', v.korean, '%%')
                ORDER BY v.id, s.id
                """
            )

        handler.send_json({"data": rows})
        return True

    return None
