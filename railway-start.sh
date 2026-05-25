#!/usr/bin/env bash

set -euo pipefail

cd "$(dirname "$0")"

LFS_INCLUDE_PATTERN="static/textbooks/**/*.pdf"

is_lfs_pointer() {
  local file_path="$1"
  [ -f "$file_path" ] && head -c 128 "$file_path" | grep -q "version https://git-lfs.github.com/spec/v1"
}

has_lfs_pointer_pdf() {
  while IFS= read -r pdf_path; do
    if is_lfs_pointer "$pdf_path"; then
      return 0
    fi
  done < <(find static/textbooks -type f -name "*.pdf" 2>/dev/null || true)

  return 1
}

has_missing_tracked_lfs_pdf() {
  [ -d ".git" ] || return 1
  command -v git >/dev/null 2>&1 || return 1

  while IFS= read -r pdf_path; do
    case "$pdf_path" in
      static/textbooks/*.pdf)
        if [ ! -f "$pdf_path" ]; then
          return 0
        fi
        ;;
    esac
  done < <(git lfs ls-files --name-only 2>/dev/null || true)

  return 1
}

pull_textbook_pdfs() {
  if ! command -v git >/dev/null 2>&1; then
    echo "git is not available; cannot pull Git LFS textbook PDFs." >&2
    return 1
  fi

  if ! command -v git-lfs >/dev/null 2>&1 && ! git lfs version >/dev/null 2>&1; then
    echo "git-lfs is not available; cannot pull textbook PDFs." >&2
    return 1
  fi

  if [ ! -d ".git" ]; then
    echo ".git directory is not available; cannot pull Git LFS textbook PDFs." >&2
    return 1
  fi

  git lfs install --local
  git lfs pull --include="$LFS_INCLUDE_PATTERN"
}

if has_lfs_pointer_pdf || has_missing_tracked_lfs_pdf; then
  echo "Detected missing or pointer Git LFS textbook PDF. Pulling textbook PDFs before starting..."
  pull_textbook_pdfs
fi

if has_lfs_pointer_pdf; then
  echo "Textbook PDF is still a Git LFS pointer after pull; aborting startup." >&2
  exit 1
fi

exec python3 server.py
