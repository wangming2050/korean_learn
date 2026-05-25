#!/usr/bin/env bash

set -euo pipefail

cd "$(dirname "$0")"

LFS_INCLUDE_PATTERN="static/textbooks/**/*.pdf"
YONSEI1_PDF_PATH="static/textbooks/yonsei1/yonsei-korean-1.pdf"
MIN_PDF_BYTES=10485760

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

is_valid_pdf() {
  local file_path="$1"
  [ -f "$file_path" ] || return 1

  local file_size
  file_size=$(wc -c < "$file_path")
  if [ "$file_size" -lt "$MIN_PDF_BYTES" ]; then
    return 1
  fi

  head -c 4 "$file_path" | grep -q "%PDF"
}

download_yonsei_pdf() {
  if [ -z "${YONSEI1_PDF_URL:-}" ]; then
    echo "YONSEI1_PDF_URL is not configured; cannot download textbook PDF." >&2
    return 1
  fi

  if ! command -v curl >/dev/null 2>&1; then
    echo "curl is not available; cannot download textbook PDF." >&2
    return 1
  fi

  local temp_path
  temp_path="${YONSEI1_PDF_PATH}.download"
  mkdir -p "$(dirname "$YONSEI1_PDF_PATH")"
  rm -f "$temp_path"

  echo "Downloading Yonsei textbook PDF from YONSEI1_PDF_URL..."
  curl --fail --location --show-error --silent \
    --connect-timeout 20 \
    --max-time 600 \
    --output "$temp_path" \
    "$YONSEI1_PDF_URL"

  if ! is_valid_pdf "$temp_path"; then
    rm -f "$temp_path"
    echo "Downloaded textbook file is not a valid PDF or is too small." >&2
    return 1
  fi

  mv "$temp_path" "$YONSEI1_PDF_PATH"
}

if ! is_valid_pdf "$YONSEI1_PDF_PATH" || has_missing_tracked_lfs_pdf; then
  echo "Detected missing or pointer Git LFS textbook PDF. Resolving textbook PDFs before starting..."
  if ! download_yonsei_pdf; then
    if [ -d ".git" ]; then
      echo "Direct PDF download failed. Falling back to Git LFS pull..."
      pull_textbook_pdfs
    else
      exit 1
    fi
  fi
fi

if ! is_valid_pdf "$YONSEI1_PDF_PATH"; then
  echo "Textbook PDF is missing, still a Git LFS pointer, or failed validation; aborting startup." >&2
  exit 1
fi

exec python3 server.py
