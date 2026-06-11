#!/usr/bin/env python3
"""Generate static vocabulary JSON files from local Quizlet PDF exports."""

from __future__ import annotations

import argparse
import json
import re
from dataclasses import dataclass
from pathlib import Path

import fitz


DEFAULT_SOURCE_DIR = Path("/Users/NanamiMio/Downloads/FireShot")
DEFAULT_OUTPUT_DIR = Path("static/data")

BOOK_SPECS = [
    {
        "id": "yonsei1",
        "title": "延世韩国语 1",
        "filename": "延世韩国语1单词卡 _ Quizlet.pdf",
    },
    {
        "id": "yonsei2",
        "title": "延世韩国语 2",
        "filename": "延世韩国语2单词卡 _ Quizlet.pdf",
    },
    {
        "id": "topik1",
        "title": "TOPIK 1 初级词汇",
        "filename": "TOPIK 1 初级词汇单词卡 _ Quizlet.pdf",
    },
    {
        "id": "snu1",
        "title": "首尔大学韩国语第一册",
        "filename": "首尔大学韩国语第一册单词卡 _ Quizlet.pdf",
    },
]

HANGUL_RE = re.compile(r"[\uac00-\ud7a3\u1100-\u11ff\u3130-\u318f]")
CJK_RE = re.compile(r"[\u3400-\u9fff]")
COUNT_RE = re.compile(r"此学习集的词语\((\d+)\)")
FOOTER_RE = re.compile(r"^\d{4}/\d{1,2}/\d{1,2}\s+\d{1,2}:\d{2}$|^\d+/\d+$")


@dataclass
class Entry:
    korean: str
    chinese: str
    source_page: int


def clean_line(line: str) -> str:
    return re.sub(r"\s+", " ", line).strip()


def is_noise(line: str, title: str) -> bool:
    if not line:
        return True
    if line in {title, "保存", "添加到日历"}:
        return True
    if line.startswith("此学习集的词语"):
        return True
    if "Quizlet" in line or "quizlet.com" in line or line.startswith("http"):
        return True
    return bool(FOOTER_RE.match(line))


def is_term_line(line: str, next_line: str = "") -> bool:
    if CJK_RE.search(line):
        return False
    if len(line) > 48:
        return False
    if HANGUL_RE.search(line):
        return True
    if next_line and CJK_RE.search(next_line) and re.search(r"[A-Za-z0-9]", line):
        return True
    return False


def clean_page_lines(page, title: str) -> list[str]:
    lines = []
    for raw in page.get_text("text").splitlines():
        line = clean_line(raw)
        if is_noise(line, title):
            continue
        lines.append(line)
    return lines


def next_content_line(lines: list[str], index: int) -> str:
    for line in lines[index + 1:]:
        if line:
            return line
    return ""


def should_append_definition(line: str) -> bool:
    if not line:
        return False
    return True


def normalize_definition(lines: list[str]) -> str:
    text = "".join(lines)
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"\s+([，。！？、；：）】])", r"\1", text)
    text = re.sub(r"([（【])\s+", r"\1", text)
    return text.strip()


def extract_entries(pdf_path: Path, book_id: str, title: str) -> tuple[list[Entry], int | None]:
    doc = fitz.open(pdf_path)
    entries: list[Entry] = []
    expected_count: int | None = None
    current_term = ""
    current_defs: list[str] = []
    current_page = 1

    def flush() -> None:
        nonlocal current_term, current_defs, current_page
        definition = normalize_definition(current_defs)
        if current_term and definition:
            entries.append(Entry(current_term, definition, current_page))
        current_term = ""
        current_defs = []

    for page_index, page in enumerate(doc, start=1):
        if expected_count is None:
            match = COUNT_RE.search(page.get_text("text"))
            if match:
                expected_count = int(match.group(1))
        lines = clean_page_lines(page, title)
        for index, line in enumerate(lines):
            if is_term_line(line, next_content_line(lines, index)):
                flush()
                current_term = line
                current_page = page_index
                continue

            if current_term and should_append_definition(line):
                current_defs.append(line)

    flush()

    normalized: list[Entry] = []
    seen: set[tuple[str, str]] = set()
    for entry in entries:
        key = (entry.korean, entry.chinese)
        if key in seen:
            continue
        seen.add(key)
        normalized.append(entry)
    return normalized, expected_count


def write_book(output_dir: Path, spec: dict[str, str], entries: list[Entry]) -> dict[str, object]:
    vocab_dir = output_dir / "vocab"
    vocab_dir.mkdir(parents=True, exist_ok=True)
    data_path = vocab_dir / f"{spec['id']}.json"
    rows = [
        {
            "id": f"{spec['id']}-{index:04d}",
            "korean": entry.korean,
            "chinese": entry.chinese,
            "source_page": entry.source_page,
            "source_book": spec["title"],
        }
        for index, entry in enumerate(entries, start=1)
    ]
    data_path.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return {
        "id": spec["id"],
        "label": spec["title"],
        "title": spec["title"],
        "count": len(rows),
        "url": f"/static/data/vocab/{spec['id']}.json",
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-dir", type=Path, default=DEFAULT_SOURCE_DIR)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    books = []
    for spec in BOOK_SPECS:
        pdf_path = args.source_dir / spec["filename"]
        if not pdf_path.exists():
            raise FileNotFoundError(pdf_path)
        entries, expected_count = extract_entries(pdf_path, spec["id"], spec["title"])
        print(f"{spec['title']}: expected={expected_count or '?'} extracted={len(entries)}")
        for sample in entries[:5]:
            print(f"  - {sample.korean} => {sample.chinese}")
        if not args.dry_run:
            books.append(write_book(args.output_dir, spec, entries))

    if not args.dry_run:
        manifest_path = args.output_dir / "vocab-books.json"
        manifest_path.write_text(json.dumps({"books": books}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"wrote {manifest_path}")


if __name__ == "__main__":
    main()
