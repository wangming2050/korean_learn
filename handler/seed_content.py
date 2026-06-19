"""Default learning content used when the app is not backed by custom DB data."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / "static" / "data"
VOCABULARY_PATH = DATA_DIR / "yonsei1-vocabulary.json"
SENTENCE_SEED_PATH = DATA_DIR / "sentences-seed.json"


def load_sentence_seed():
    return json.loads(SENTENCE_SEED_PATH.read_text(encoding="utf-8"))


def build_default_sentence_content():
    scenes = []
    sentences = []
    sentence_id = 1
    for scene in load_sentence_seed():
        scene_id = scene["id"]
        scene_name = scene["name"]
        scenes.append({"id": scene_id, "name": scene_name, "en": scene.get("en") or "Scene"})
        for situation in scene.get("situations", []):
            situation_name = situation["name"]
            for sentence in situation.get("sentences", []):
                sentences.append(
                    {
                        "id": sentence_id,
                        "scene_id": scene_id,
                        "scene_name": scene_name,
                        "situation": situation_name,
                        "korean": sentence["korean"],
                        "chinese": sentence["chinese"],
                        "audio_url": sentence.get("audio_url", ""),
                        "audio_start": sentence.get("audio_start", 0),
                        "audio_end": sentence.get("audio_end", 0),
                    }
                )
                sentence_id += 1
    return scenes, sentences


DEFAULT_SCENES, DEFAULT_SENTENCES = build_default_sentence_content()


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
