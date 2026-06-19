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
from handler.seed_content import DEFAULT_SENTENCES, search_vocabulary


KOREAN_LETTERS = [
    {"letter": "ㄱ", "word": "가방", "meaning": "书包", "letter_audio_url": "/static/audio/letters/letter_giyeok.mp3", "audio_url": ""},
    {"letter": "ㄴ", "word": "나무", "meaning": "树", "letter_audio_url": "/static/audio/letters/letter_nieun.mp3", "audio_url": ""},
    {"letter": "ㄷ", "word": "다리", "meaning": "腿/桥", "letter_audio_url": "/static/audio/letters/letter_digeut.mp3", "audio_url": ""},
    {"letter": "ㄹ", "word": "라면", "meaning": "拉面", "letter_audio_url": "/static/audio/letters/letter_rieul.mp3", "audio_url": ""},
    {"letter": "ㅁ", "word": "모자", "meaning": "帽子", "letter_audio_url": "/static/audio/letters/letter_mieum.mp3", "audio_url": ""},
    {"letter": "ㅂ", "word": "바다", "meaning": "大海", "letter_audio_url": "/static/audio/letters/letter_bieup.mp3", "audio_url": ""},
    {"letter": "ㅅ", "word": "사과", "meaning": "苹果", "letter_audio_url": "/static/audio/letters/letter_siot.mp3", "audio_url": ""},
    {"letter": "ㅇ", "word": "아이", "meaning": "孩子", "letter_audio_url": "/static/audio/letters/letter_ieung.mp3", "audio_url": ""},
    {"letter": "ㅈ", "word": "지도", "meaning": "地图", "letter_audio_url": "/static/audio/letters/letter_jieut.mp3", "audio_url": ""},
    {"letter": "ㅊ", "word": "차", "meaning": "车/茶", "letter_audio_url": "/static/audio/letters/letter_chieut.mp3", "audio_url": ""},
    {"letter": "ㅋ", "word": "코", "meaning": "鼻子", "letter_audio_url": "/static/audio/letters/letter_kieuk.mp3", "audio_url": ""},
    {"letter": "ㅌ", "word": "토마토", "meaning": "番茄", "letter_audio_url": "/static/audio/letters/letter_tieut.mp3", "audio_url": ""},
    {"letter": "ㅍ", "word": "포도", "meaning": "葡萄", "letter_audio_url": "/static/audio/letters/letter_pieup.mp3", "audio_url": ""},
    {"letter": "ㅎ", "word": "하늘", "meaning": "天空", "letter_audio_url": "/static/audio/letters/letter_hieut.mp3", "audio_url": ""},
    {"letter": "ㄲ", "word": "꼬리", "meaning": "尾巴", "letter_audio_url": "/static/audio/letters/letter_ssang_giyeok.mp3", "audio_url": ""},
    {"letter": "ㄸ", "word": "딸기", "meaning": "草莓", "letter_audio_url": "/static/audio/letters/letter_ssang_digeut.mp3", "audio_url": ""},
    {"letter": "ㅃ", "word": "빵", "meaning": "面包", "letter_audio_url": "/static/audio/letters/letter_ssang_bieup.mp3", "audio_url": ""},
    {"letter": "ㅆ", "word": "쌀", "meaning": "米", "letter_audio_url": "/static/audio/letters/letter_ssang_siot.mp3", "audio_url": ""},
    {"letter": "ㅉ", "word": "짜다", "meaning": "咸", "letter_audio_url": "/static/audio/letters/letter_ssang_jieut.mp3", "audio_url": ""},
    {"letter": "ㅏ", "word": "아기", "meaning": "婴儿", "letter_audio_url": "/static/audio/letters/letter_a.mp3", "audio_url": ""},
    {"letter": "ㅑ", "word": "야구", "meaning": "棒球", "letter_audio_url": "/static/audio/letters/letter_ya.mp3", "audio_url": ""},
    {"letter": "ㅓ", "word": "어머니", "meaning": "妈妈", "letter_audio_url": "/static/audio/letters/letter_eo.mp3", "audio_url": ""},
    {"letter": "ㅕ", "word": "여자", "meaning": "女人", "letter_audio_url": "/static/audio/letters/letter_yeo.mp3", "audio_url": ""},
    {"letter": "ㅗ", "word": "오이", "meaning": "黄瓜", "letter_audio_url": "/static/audio/letters/letter_o.mp3", "audio_url": ""},
    {"letter": "ㅛ", "word": "요리", "meaning": "料理", "letter_audio_url": "/static/audio/letters/letter_yo.mp3", "audio_url": ""},
    {"letter": "ㅜ", "word": "우유", "meaning": "牛奶", "letter_audio_url": "/static/audio/letters/letter_u.mp3", "audio_url": ""},
    {"letter": "ㅠ", "word": "유리", "meaning": "玻璃", "letter_audio_url": "/static/audio/letters/letter_yu.mp3", "audio_url": ""},
    {"letter": "ㅡ", "word": "음악", "meaning": "音乐", "letter_audio_url": "/static/audio/letters/letter_eu.mp3", "audio_url": ""},
    {"letter": "ㅣ", "word": "이름", "meaning": "名字", "letter_audio_url": "/static/audio/letters/letter_i.mp3", "audio_url": ""},
    {"letter": "ㅐ", "word": "개", "meaning": "狗", "letter_audio_url": "/static/audio/letters/letter_ae.mp3", "audio_url": ""},
    {"letter": "ㅒ", "word": "얘기", "meaning": "故事/聊天", "letter_audio_url": "/static/audio/letters/letter_yae.mp3", "audio_url": ""},
    {"letter": "ㅔ", "word": "게", "meaning": "螃蟹", "letter_audio_url": "/static/audio/letters/letter_e.mp3", "audio_url": ""},
    {"letter": "ㅖ", "word": "예", "meaning": "是/例", "letter_audio_url": "/static/audio/letters/letter_ye.mp3", "audio_url": ""},
    {"letter": "ㅘ", "word": "과자", "meaning": "点心", "letter_audio_url": "/static/audio/letters/letter_wa.mp3", "audio_url": ""},
    {"letter": "ㅙ", "word": "왜", "meaning": "为什么", "letter_audio_url": "/static/audio/letters/letter_wae.mp3", "audio_url": ""},
    {"letter": "ㅚ", "word": "외국", "meaning": "外国", "letter_audio_url": "/static/audio/letters/letter_oe.mp3", "audio_url": ""},
    {"letter": "ㅝ", "word": "워터", "meaning": "水/water", "letter_audio_url": "/static/audio/letters/letter_wo.mp3", "audio_url": ""},
    {"letter": "ㅞ", "word": "웨이터", "meaning": "服务员", "letter_audio_url": "/static/audio/letters/letter_we.mp3", "audio_url": ""},
    {"letter": "ㅟ", "word": "위", "meaning": "上面", "letter_audio_url": "/static/audio/letters/letter_wi.mp3", "audio_url": ""},
    {"letter": "ㅢ", "word": "의자", "meaning": "椅子", "letter_audio_url": "/static/audio/letters/letter_ui.mp3", "audio_url": ""},
]


def handle_sentence_request(handler, method, path, query):
    """处理句子、词汇、字母相关接口。"""
    if method == "GET" and path == "/api/letters":
        handler.send_json({"data": KOREAN_LETTERS})
        return True

    if method == "GET" and path == "/api/sentences":
        scene_id = query.get("scene_id", [""])[0]

        try:
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
                      s.situation,
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
                      s.situation,
                      sc.name AS scene_name
                    FROM sentence s
                    LEFT JOIN scene sc ON sc.id = s.scene_id
                    ORDER BY s.id
                    """
                )
        except Exception:
            rows = DEFAULT_SENTENCES
            if scene_id:
                rows = [row for row in rows if str(row["scene_id"]) == str(scene_id)]

        handler.send_json({"data": rows})
        return True

    if method == "POST" and path == "/api/sentences":
        body = handler.read_json_body()
        korean = (body.get("korean") or "").strip()
        chinese = (body.get("chinese") or "").strip()
        audio_url = (body.get("audio_url") or "").strip()
        situation = (body.get("situation") or "常用表达").strip()
        scene_id = body.get("scene_id")
        audio_start = body.get("audio_start") or 0
        audio_end = body.get("audio_end") or 0

        if not korean or not chinese or not scene_id:
            handler.send_json({"error": "韩文、中文翻译、场景 id 都不能为空"}, status=400)
            return True

        sentence_id = execute(
            """
            INSERT INTO sentence (korean, chinese, audio_url, audio_start, audio_end, scene_id, situation)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (korean, chinese, audio_url, audio_start, audio_end, scene_id, situation),
        )
        handler.send_json({"id": sentence_id}, status=201)
        return True

    if method == "PUT" and path == "/api/sentences":
        sentence_id = query.get("id", [""])[0]
        body = handler.read_json_body()
        korean = (body.get("korean") or "").strip()
        chinese = (body.get("chinese") or "").strip()
        situation = (body.get("situation") or "常用表达").strip()
        scene_id = body.get("scene_id")

        if not sentence_id or not korean or not chinese or not scene_id:
            handler.send_json({"error": "句子 id、韩文、中文翻译、场景 id 都不能为空"}, status=400)
            return True

        existing_audio = fetch_all(
            "SELECT audio_url, audio_start, audio_end FROM sentence WHERE id = %s",
            (sentence_id,),
        )
        existing_audio = existing_audio[0] if existing_audio else {}
        audio_url = (body.get("audio_url") or existing_audio.get("audio_url") or "").strip()
        audio_start = body.get("audio_start") if "audio_start" in body else existing_audio.get("audio_start", 0)
        audio_end = body.get("audio_end") if "audio_end" in body else existing_audio.get("audio_end", 0)

        execute(
            """
            UPDATE sentence
            SET korean = %s,
                chinese = %s,
                audio_url = %s,
                audio_start = %s,
                audio_end = %s,
                scene_id = %s,
                situation = %s
            WHERE id = %s
            """,
            (korean, chinese, audio_url, audio_start, audio_end, scene_id, situation, sentence_id),
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
        handler.send_json({"data": search_vocabulary(keyword)})
        return True

    return None
