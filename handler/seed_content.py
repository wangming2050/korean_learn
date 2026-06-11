"""Default learning content used when the app is not backed by custom DB data."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parent.parent
VOCABULARY_PATH = ROOT_DIR / "static" / "data" / "yonsei1-vocabulary.json"


DEFAULT_SCENES = [
    {"id": 1, "name": "学校"},
    {"id": 2, "name": "医院"},
    {"id": 3, "name": "交通"},
    {"id": 4, "name": "餐厅"},
    {"id": 5, "name": "购物"},
    {"id": 6, "name": "住宿"},
]


DEFAULT_SENTENCES = [
    {
        "id": 1,
        "scene_id": 1,
        "scene_name": "学校",
        "situation": "教室问候",
        "korean": "선생님, 안녕하세요?",
        "chinese": "老师，您好？",
        "audio_url": "",
        "audio_start": 0,
        "audio_end": 0,
    },
    {
        "id": 2,
        "scene_id": 1,
        "scene_name": "学校",
        "situation": "教室问候",
        "korean": "오늘 수업은 몇 시에 시작해요?",
        "chinese": "今天的课几点开始？",
        "audio_url": "",
        "audio_start": 0,
        "audio_end": 0,
    },
    {
        "id": 3,
        "scene_id": 1,
        "scene_name": "学校",
        "situation": "借学习用品",
        "korean": "연필을 빌려 주실 수 있어요?",
        "chinese": "可以借我一支铅笔吗？",
        "audio_url": "",
        "audio_start": 0,
        "audio_end": 0,
    },
    {
        "id": 4,
        "scene_id": 1,
        "scene_name": "学校",
        "situation": "提交作业",
        "korean": "숙제는 어디에 내면 돼요?",
        "chinese": "作业交到哪里就可以？",
        "audio_url": "",
        "audio_start": 0,
        "audio_end": 0,
    },
    {
        "id": 5,
        "scene_id": 2,
        "scene_name": "医院",
        "situation": "挂号",
        "korean": "진료 예약을 하고 싶어요.",
        "chinese": "我想预约看诊。",
        "audio_url": "",
        "audio_start": 0,
        "audio_end": 0,
    },
    {
        "id": 6,
        "scene_id": 2,
        "scene_name": "医院",
        "situation": "描述症状",
        "korean": "목이 아프고 열이 나요.",
        "chinese": "我嗓子疼，而且发烧。",
        "audio_url": "",
        "audio_start": 0,
        "audio_end": 0,
    },
    {
        "id": 7,
        "scene_id": 2,
        "scene_name": "医院",
        "situation": "取药",
        "korean": "이 약은 하루에 몇 번 먹어요?",
        "chinese": "这个药一天吃几次？",
        "audio_url": "",
        "audio_start": 0,
        "audio_end": 0,
    },
    {
        "id": 8,
        "scene_id": 3,
        "scene_name": "交通",
        "situation": "问路",
        "korean": "지하철역이 어디에 있어요?",
        "chinese": "地铁站在哪里？",
        "audio_url": "",
        "audio_start": 0,
        "audio_end": 0,
    },
    {
        "id": 9,
        "scene_id": 3,
        "scene_name": "交通",
        "situation": "买票",
        "korean": "서울역까지 표 한 장 주세요.",
        "chinese": "请给我一张到首尔站的票。",
        "audio_url": "",
        "audio_start": 0,
        "audio_end": 0,
    },
    {
        "id": 10,
        "scene_id": 3,
        "scene_name": "交通",
        "situation": "乘坐出租车",
        "korean": "이 주소로 가 주세요.",
        "chinese": "请去这个地址。",
        "audio_url": "",
        "audio_start": 0,
        "audio_end": 0,
    },
    {
        "id": 11,
        "scene_id": 4,
        "scene_name": "餐厅",
        "situation": "点餐",
        "korean": "비빔밥 하나하고 물 한 잔 주세요.",
        "chinese": "请给我一份拌饭和一杯水。",
        "audio_url": "",
        "audio_start": 0,
        "audio_end": 0,
    },
    {
        "id": 12,
        "scene_id": 4,
        "scene_name": "餐厅",
        "situation": "确认口味",
        "korean": "맵지 않게 해 주세요.",
        "chinese": "请做得不要太辣。",
        "audio_url": "",
        "audio_start": 0,
        "audio_end": 0,
    },
    {
        "id": 13,
        "scene_id": 4,
        "scene_name": "餐厅",
        "situation": "结账",
        "korean": "계산은 카드로 할게요.",
        "chinese": "我用卡结账。",
        "audio_url": "",
        "audio_start": 0,
        "audio_end": 0,
    },
    {
        "id": 14,
        "scene_id": 5,
        "scene_name": "购物",
        "situation": "询问价格",
        "korean": "이거 얼마예요?",
        "chinese": "这个多少钱？",
        "audio_url": "",
        "audio_start": 0,
        "audio_end": 0,
    },
    {
        "id": 15,
        "scene_id": 5,
        "scene_name": "购物",
        "situation": "试穿",
        "korean": "입어 봐도 돼요?",
        "chinese": "可以试穿一下吗？",
        "audio_url": "",
        "audio_start": 0,
        "audio_end": 0,
    },
    {
        "id": 16,
        "scene_id": 5,
        "scene_name": "购物",
        "situation": "退换",
        "korean": "다른 색으로 바꿀 수 있어요?",
        "chinese": "可以换成别的颜色吗？",
        "audio_url": "",
        "audio_start": 0,
        "audio_end": 0,
    },
    {
        "id": 17,
        "scene_id": 6,
        "scene_name": "住宿",
        "situation": "办理入住",
        "korean": "예약한 방이 있어요.",
        "chinese": "我有预订的房间。",
        "audio_url": "",
        "audio_start": 0,
        "audio_end": 0,
    },
    {
        "id": 18,
        "scene_id": 6,
        "scene_name": "住宿",
        "situation": "询问设施",
        "korean": "와이파이 비밀번호가 뭐예요?",
        "chinese": "无线网络密码是什么？",
        "audio_url": "",
        "audio_start": 0,
        "audio_end": 0,
    },
    {
        "id": 19,
        "scene_id": 6,
        "scene_name": "住宿",
        "situation": "请求帮助",
        "korean": "수건을 하나 더 주세요.",
        "chinese": "请再给我一条毛巾。",
        "audio_url": "",
        "audio_start": 0,
        "audio_end": 0,
    },
]


@lru_cache(maxsize=1)
def load_yonsei1_vocabulary():
    return json.loads(VOCABULARY_PATH.read_text(encoding="utf-8"))


def search_vocabulary(keyword=""):
    keyword = (keyword or "").strip().lower()
    rows = []
    for item in load_yonsei1_vocabulary():
        korean = item["korean"]
        chinese = item["chinese"]
        if keyword and keyword not in korean.lower() and keyword not in chinese.lower():
            continue
        rows.append(
            {
                "id": item["id"],
                "korean": korean,
                "chinese": chinese,
                "pos": item.get("pos") or "延世1",
                "sentence_id": None,
                "sentence_korean": "",
                "sentence_chinese": "",
                "audio_url": "",
            }
        )
    return rows
