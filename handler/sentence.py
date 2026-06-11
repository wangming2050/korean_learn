"""
句子模块接口：
- GET  /api/sentences?scene_id=1  按场景查询句子
- POST /api/sentences             新增句子
- PUT  /api/sentences?id=1        编辑句子
- DELETE /api/sentences?id=1      删除句子
- GET  /api/vocabulary            查询词汇及关联例句
- GET  /api/letters               返回 40 个韩文字母演示数据
"""

import os

from db import execute, fetch_all
from handler.seed_content import DEFAULT_SENTENCES, search_vocabulary


USE_DATABASE_CONTENT = os.getenv("KOREAN_LEARN_USE_DB_CONTENT") == "1"


KOREAN_LETTERS = [
    {"letter": "ㄱ", "word": "가방", "meaning": "书包", "letter_audio_url": "/static/audio/letters/letter_giyeok.mp3", "audio_url": "/static/audio/letter_words/word_gabang.wav"},
    {"letter": "ㄴ", "word": "나무", "meaning": "树", "letter_audio_url": "/static/audio/letters/letter_nieun.mp3", "audio_url": "/static/audio/letter_words/word_namu.wav"},
    {"letter": "ㄷ", "word": "다리", "meaning": "腿/桥", "letter_audio_url": "/static/audio/letters/letter_digeut.mp3", "audio_url": "/static/audio/letter_words/word_dari.wav"},
    {"letter": "ㄹ", "word": "라면", "meaning": "拉面", "letter_audio_url": "/static/audio/letters/letter_rieul.mp3", "audio_url": "/static/audio/letter_words/word_ramyeon.wav"},
    {"letter": "ㅁ", "word": "모자", "meaning": "帽子", "letter_audio_url": "/static/audio/letters/letter_mieum.mp3", "audio_url": "/static/audio/letter_words/word_moja.wav"},
    {"letter": "ㅂ", "word": "바다", "meaning": "大海", "letter_audio_url": "/static/audio/letters/letter_bieup.mp3", "audio_url": "/static/audio/letter_words/word_bada.wav"},
    {"letter": "ㅅ", "word": "사과", "meaning": "苹果", "letter_audio_url": "/static/audio/letters/letter_siot.mp3", "audio_url": "/static/audio/letter_words/word_sagwa.wav"},
    {"letter": "ㅇ", "word": "아이", "meaning": "孩子", "letter_audio_url": "/static/audio/letters/letter_ieung.mp3", "audio_url": "/static/audio/letter_words/word_ai.wav"},
    {"letter": "ㅈ", "word": "지도", "meaning": "地图", "letter_audio_url": "/static/audio/letters/letter_jieut.mp3", "audio_url": "/static/audio/letter_words/word_jido.wav"},
    {"letter": "ㅊ", "word": "차", "meaning": "车/茶", "letter_audio_url": "/static/audio/letters/letter_chieut.mp3", "audio_url": "/static/audio/letter_words/word_cha.wav"},
    {"letter": "ㅋ", "word": "코", "meaning": "鼻子", "letter_audio_url": "/static/audio/letters/letter_kieuk.mp3", "audio_url": "/static/audio/letter_words/word_ko.wav"},
    {"letter": "ㅌ", "word": "토마토", "meaning": "番茄", "letter_audio_url": "/static/audio/letters/letter_tieut.mp3", "audio_url": "/static/audio/letter_words/word_tomato.wav"},
    {"letter": "ㅍ", "word": "포도", "meaning": "葡萄", "letter_audio_url": "/static/audio/letters/letter_pieup.mp3", "audio_url": "/static/audio/letter_words/word_podo.wav"},
    {"letter": "ㅎ", "word": "하늘", "meaning": "天空", "letter_audio_url": "/static/audio/letters/letter_hieut.mp3", "audio_url": "/static/audio/letter_words/word_haneul.wav"},
    {"letter": "ㄲ", "word": "꼬리", "meaning": "尾巴", "letter_audio_url": "/static/audio/letters/letter_ssang_giyeok.mp3", "audio_url": "/static/audio/letter_words/word_kkori.wav"},
    {"letter": "ㄸ", "word": "딸기", "meaning": "草莓", "letter_audio_url": "/static/audio/letters/letter_ssang_digeut.mp3", "audio_url": "/static/audio/letter_words/word_ttalgi.wav"},
    {"letter": "ㅃ", "word": "빵", "meaning": "面包", "letter_audio_url": "/static/audio/letters/letter_ssang_bieup.mp3", "audio_url": "/static/audio/letter_words/word_ppang.wav"},
    {"letter": "ㅆ", "word": "쌀", "meaning": "米", "letter_audio_url": "/static/audio/letters/letter_ssang_siot.mp3", "audio_url": "/static/audio/letter_words/word_ssal.wav"},
    {"letter": "ㅉ", "word": "짜다", "meaning": "咸", "letter_audio_url": "/static/audio/letters/letter_ssang_jieut.mp3", "audio_url": "/static/audio/letter_words/word_jjada.wav"},
    {"letter": "ㅏ", "word": "아기", "meaning": "婴儿", "letter_audio_url": "/static/audio/letters/letter_a.mp3", "audio_url": "/static/audio/letter_words/word_agi.wav"},
    {"letter": "ㅑ", "word": "야구", "meaning": "棒球", "letter_audio_url": "/static/audio/letters/letter_ya.mp3", "audio_url": "/static/audio/letter_words/word_yagu.wav"},
    {"letter": "ㅓ", "word": "어머니", "meaning": "妈妈", "letter_audio_url": "/static/audio/letters/letter_eo.mp3", "audio_url": "/static/audio/letter_words/word_eomeoni.wav"},
    {"letter": "ㅕ", "word": "여자", "meaning": "女人", "letter_audio_url": "/static/audio/letters/letter_yeo.mp3", "audio_url": "/static/audio/letter_words/word_yeoja.wav"},
    {"letter": "ㅗ", "word": "오이", "meaning": "黄瓜", "letter_audio_url": "/static/audio/letters/letter_o.mp3", "audio_url": "/static/audio/letter_words/word_oi.wav"},
    {"letter": "ㅛ", "word": "요리", "meaning": "料理", "letter_audio_url": "/static/audio/letters/letter_yo.mp3", "audio_url": "/static/audio/letter_words/word_yori.wav"},
    {"letter": "ㅜ", "word": "우유", "meaning": "牛奶", "letter_audio_url": "/static/audio/letters/letter_u.mp3", "audio_url": "/static/audio/letter_words/word_uyu.wav"},
    {"letter": "ㅠ", "word": "유리", "meaning": "玻璃", "letter_audio_url": "/static/audio/letters/letter_yu.mp3", "audio_url": "/static/audio/letter_words/word_yuri.wav"},
    {"letter": "ㅡ", "word": "음악", "meaning": "音乐", "letter_audio_url": "/static/audio/letters/letter_eu.mp3", "audio_url": "/static/audio/letter_words/word_eumak.wav"},
    {"letter": "ㅣ", "word": "이름", "meaning": "名字", "letter_audio_url": "/static/audio/letters/letter_i.mp3", "audio_url": "/static/audio/letter_words/word_ireum.wav"},
    {"letter": "ㅐ", "word": "개", "meaning": "狗", "letter_audio_url": "/static/audio/letters/letter_ae.mp3", "audio_url": "/static/audio/letter_words/word_gae.wav"},
    {"letter": "ㅒ", "word": "얘기", "meaning": "故事/聊天", "letter_audio_url": "/static/audio/letters/letter_yae.mp3", "audio_url": "/static/audio/letter_words/word_yaegi.wav"},
    {"letter": "ㅔ", "word": "게", "meaning": "螃蟹", "letter_audio_url": "/static/audio/letters/letter_e.mp3", "audio_url": "/static/audio/letter_words/word_ge.wav"},
    {"letter": "ㅖ", "word": "예", "meaning": "是/例", "letter_audio_url": "/static/audio/letters/letter_ye.mp3", "audio_url": "/static/audio/letter_words/word_ye.wav"},
    {"letter": "ㅘ", "word": "과자", "meaning": "点心", "letter_audio_url": "/static/audio/letters/letter_wa.mp3", "audio_url": "/static/audio/letter_words/word_gwaja.wav"},
    {"letter": "ㅙ", "word": "왜", "meaning": "为什么", "letter_audio_url": "/static/audio/letters/letter_wae.mp3", "audio_url": "/static/audio/letter_words/word_wae.wav"},
    {"letter": "ㅚ", "word": "외국", "meaning": "外国", "letter_audio_url": "/static/audio/letters/letter_oe.mp3", "audio_url": "/static/audio/letter_words/word_oeguk.wav"},
    {"letter": "ㅝ", "word": "워터", "meaning": "水/water", "letter_audio_url": "/static/audio/letters/letter_wo.mp3", "audio_url": "/static/audio/letter_words/word_woteo.wav"},
    {"letter": "ㅞ", "word": "웨이터", "meaning": "服务员", "letter_audio_url": "/static/audio/letters/letter_we.mp3", "audio_url": "/static/audio/letter_words/word_weiteo.wav"},
    {"letter": "ㅟ", "word": "위", "meaning": "上面", "letter_audio_url": "/static/audio/letters/letter_wi.mp3", "audio_url": "/static/audio/letter_words/word_wi.wav"},
    {"letter": "ㅢ", "word": "의자", "meaning": "椅子", "letter_audio_url": "/static/audio/letters/letter_ui.mp3", "audio_url": "/static/audio/letter_words/word_uija.wav"},
]


def handle_sentence_request(handler, method, path, query):
    """处理句子、词汇、字母相关接口。"""
    if method == "GET" and path == "/api/letters":
        handler.send_json({"data": KOREAN_LETTERS})
        return True

    if method == "GET" and path == "/api/sentences":
        scene_id = query.get("scene_id", [""])[0]

        if not USE_DATABASE_CONTENT:
            rows = DEFAULT_SENTENCES
            if scene_id:
                rows = [row for row in rows if str(row["scene_id"]) == str(scene_id)]
            handler.send_json({"data": rows})
            return True

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
        audio_url = (body.get("audio_url") or "").strip()
        situation = (body.get("situation") or "常用表达").strip()
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

        if not USE_DATABASE_CONTENT:
            handler.send_json({"data": search_vocabulary(keyword)})
            return True

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
