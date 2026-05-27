#!/usr/bin/env python3
"""
Generate WebP preview and thumbnail images for textbook PDF pages.

The generated files are meant to be uploaded to object storage, not committed to
the application repository.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

try:
    import fitz
except ImportError:  # pragma: no cover - friendly CLI error.
    fitz = None

try:
    from PIL import Image
except ImportError:  # pragma: no cover - friendly CLI error.
    Image = None


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Render textbook PDF pages as WebP previews.")
    parser.add_argument("pdf", type=Path, help="Path to the source PDF.")
    parser.add_argument("output_dir", type=Path, help="Output root for page-images/ and page-thumbs/.")
    parser.add_argument("--image-width", "--width", type=int, default=1320, help="Preview image width in pixels.")
    parser.add_argument("--image-quality", "--quality", type=int, default=80, help="Preview WebP quality, 1-100.")
    parser.add_argument("--thumb-width", type=int, default=560, help="Fast thumbnail width in pixels.")
    parser.add_argument("--thumb-quality", type=int, default=62, help="Thumbnail WebP quality, 1-100.")
    parser.add_argument("--no-thumbs", action="store_true", help="Only generate page-images/.")
    parser.add_argument("--start-page", type=int, default=1, help="First 1-based page to render.")
    parser.add_argument("--end-page", type=int, default=None, help="Last 1-based page to render.")
    return parser.parse_args()


def normalize_quality(value: int) -> int:
    return min(max(value, 1), 100)


def render_page(page, output_path: Path, width: int, quality: int) -> None:
    scale = width / page.rect.width
    pixmap = page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
    image = Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples)
    image.save(output_path, "WEBP", quality=quality, method=6)
    print(f"wrote {output_path}")


def main() -> int:
    args = parse_args()
    if fitz is None:
        print("PyMuPDF is required. Install it with: python3 -m pip install pymupdf", file=sys.stderr)
        return 1

    if Image is None:
        print("Pillow is required. Install it with: python3 -m pip install pillow", file=sys.stderr)
        return 1

    if not args.pdf.exists():
        print(f"PDF not found: {args.pdf}", file=sys.stderr)
        return 1

    if args.image_width <= 0:
        print("--image-width must be greater than 0.", file=sys.stderr)
        return 1

    if args.thumb_width <= 0:
        print("--thumb-width must be greater than 0.", file=sys.stderr)
        return 1

    image_quality = normalize_quality(args.image_quality)
    thumb_quality = normalize_quality(args.thumb_quality)
    image_dir = args.output_dir / "page-images"
    thumb_dir = args.output_dir / "page-thumbs"
    image_dir.mkdir(parents=True, exist_ok=True)
    if not args.no_thumbs:
        thumb_dir.mkdir(parents=True, exist_ok=True)

    document = fitz.open(args.pdf)
    start_page = max(args.start_page, 1)
    end_page = args.end_page or document.page_count
    end_page = min(end_page, document.page_count)

    for page_number in range(start_page, end_page + 1):
        page = document.load_page(page_number - 1)
        filename = f"page_{page_number:03d}.webp"
        render_page(page, image_dir / filename, args.image_width, image_quality)
        if not args.no_thumbs:
            render_page(page, thumb_dir / filename, args.thumb_width, thumb_quality)

    document.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
