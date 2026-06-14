#!/usr/bin/env python3
"""
Sync scene/sentence database tables from static/data/sentences-seed.json.

This is intentionally scoped to the example-sentence content tables only.
It replaces existing rows in `sentence` and `scene` so DB-backed local or
deployed environments match the static seed used by the frontend fallback.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from db import execute, fetch_all
from handler.seed_content import DEFAULT_SCENES, DEFAULT_SENTENCES


def ensure_sentence_schema() -> None:
    scene_columns = {row["Field"] for row in fetch_all("DESCRIBE scene")}
    if "en" not in scene_columns:
        execute("ALTER TABLE scene ADD COLUMN en VARCHAR(80) DEFAULT 'Scene' AFTER name")

    columns = {row["Field"] for row in fetch_all("DESCRIBE sentence")}
    if "situation" not in columns:
        execute("ALTER TABLE sentence ADD COLUMN situation VARCHAR(80) DEFAULT '常用表达' AFTER chinese")


def sync_sentence_seed(dry_run: bool) -> tuple[int, int]:
    if dry_run:
        return len(DEFAULT_SCENES), len(DEFAULT_SENTENCES)

    ensure_sentence_schema()

    execute("DELETE FROM sentence")
    execute("DELETE FROM scene")

    for scene in DEFAULT_SCENES:
        execute(
            "INSERT INTO scene (id, name, en) VALUES (%s, %s, %s)",
            (scene["id"], scene["name"], scene.get("en") or "Scene"),
        )

    for sentence in DEFAULT_SENTENCES:
        execute(
            """
            INSERT INTO sentence
              (id, korean, chinese, situation, audio_url, audio_start, audio_end, scene_id)
            VALUES
              (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                sentence["id"],
                sentence["korean"],
                sentence["chinese"],
                sentence["situation"],
                sentence["audio_url"],
                sentence["audio_start"],
                sentence["audio_end"],
                sentence["scene_id"],
            ),
        )

    next_scene_id = len(DEFAULT_SCENES) + 1
    next_sentence_id = len(DEFAULT_SENTENCES) + 1
    execute(f"ALTER TABLE scene AUTO_INCREMENT = {next_scene_id}")
    execute(f"ALTER TABLE sentence AUTO_INCREMENT = {next_sentence_id}")
    return len(DEFAULT_SCENES), len(DEFAULT_SENTENCES)


def main() -> None:
    parser = argparse.ArgumentParser(description="Sync example sentence seed data into MySQL.")
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Actually replace scene/sentence rows. Without this flag, only prints the seed size.",
    )
    args = parser.parse_args()

    scene_count, sentence_count = sync_sentence_seed(dry_run=not args.apply)
    if args.apply:
        db_scene_count = fetch_all("SELECT COUNT(*) AS count FROM scene")[0]["count"]
        db_sentence_count = fetch_all("SELECT COUNT(*) AS count FROM sentence")[0]["count"]
        print(f"Synced {db_scene_count} scenes and {db_sentence_count} sentences.")
    else:
        print(f"Seed contains {scene_count} scenes and {sentence_count} sentences. Re-run with --apply to sync.")


if __name__ == "__main__":
    main()
