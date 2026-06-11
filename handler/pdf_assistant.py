"""
PDF AI assistant API.

The browser keeps the user's PDF locally. This endpoint only receives the
current question plus a small current-page context payload.
"""

import json
import os
from pathlib import Path
import urllib.error
import urllib.parse
import urllib.request


OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses"
GEMINI_API_URL_TEMPLATE = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
DEFAULT_OPENAI_MODEL = "gpt-4.1-mini"
DEFAULT_GEMINI_MODEL = "gemini-2.5-flash"
MAX_QUESTION_CHARS = 1200
MAX_CONTEXT_CHARS = 20000
MAX_SCREENSHOT_CHARS = 2_400_000
LOCAL_AI_ENV_PATH = Path(__file__).resolve().parent.parent / ".env.ai.local"


def load_local_ai_env():
    """Load local AI settings without overriding real environment variables."""
    if not LOCAL_AI_ENV_PATH.exists():
        return

    for raw_line in LOCAL_AI_ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip("'\"")
        if key and key not in os.environ:
            os.environ[key] = value


load_local_ai_env()


def handle_pdf_assistant_request(handler, method, path, query):
    """Handle PDF AI assistant endpoints."""
    if method != "POST" or not path.startswith("/api/pdf-assistant/"):
        return False

    if path == "/api/pdf-assistant/extract-toc":
        return handle_extract_toc_request(handler)

    if path != "/api/pdf-assistant/chat":
        return False

    provider = get_ai_provider()
    api_key = get_provider_api_key(provider)
    if not api_key:
        handler.send_json({"error": get_missing_key_message(provider)}, status=503)
        return True

    body = handler.read_json_body()
    question = str(body.get("question") or "").strip()
    if not question:
        handler.send_json({"error": "问题不能为空。"}, status=400)
        return True
    if len(question) > MAX_QUESTION_CHARS:
        handler.send_json({"error": "问题太长，请缩短后再问。"}, status=400)
        return True

    document_title = str(body.get("documentTitle") or "本地 PDF 教材")[:120]
    page_number = body.get("pageNumber") or 1
    page_count = body.get("pageCount") or 1
    context_text = build_context_text(body.get("contextPages") or [])
    screenshot = str(body.get("screenshot") or "")
    if screenshot and (not screenshot.startswith("data:image/") or len(screenshot) > MAX_SCREENSHOT_CHARS):
        screenshot = ""

    try:
        answer = ask_ai_provider(
            provider=provider,
            api_key=api_key,
            document_title=document_title,
            page_number=page_number,
            page_count=page_count,
            question=question,
            context_text=context_text,
            screenshot=screenshot,
        )
    except RuntimeError as error:
        handler.send_json({"error": str(error)}, status=502)
        return True

    handler.send_json({"answer": answer})
    return True


def handle_extract_toc_request(handler):
    api_key = get_provider_api_key("gemini")
    if not api_key:
        handler.send_json({"error": get_missing_key_message("gemini")}, status=503)
        return True

    body = handler.read_json_body()
    image = str(body.get("image") or "")
    if not image.startswith("data:image/") or len(image) > MAX_SCREENSHOT_CHARS:
        handler.send_json({"error": "目录页图片无效或过大。"}, status=400)
        return True

    page_number = body.get("pageNumber") or 1
    page_count = body.get("pageCount") or 1
    try:
        entries = extract_toc_with_gemini(
            api_key=api_key,
            model=os.getenv("GEMINI_MODEL", DEFAULT_GEMINI_MODEL),
            image=image,
            page_number=page_number,
            page_count=page_count,
        )
    except RuntimeError as error:
        handler.send_json({"error": str(error)}, status=502)
        return True

    handler.send_json({"entries": entries})
    return True


def get_ai_provider():
    provider = os.getenv("AI_PROVIDER", "gemini").strip().lower()
    if provider not in ("gemini", "openai"):
        return "gemini"
    return provider


def get_provider_api_key(provider):
    if provider == "openai":
        return clean_api_key(os.getenv("OPENAI_API_KEY"))
    return clean_api_key(os.getenv("GEMINI_API_KEY"))


def clean_api_key(value):
    if not value:
        return None
    value = value.strip()
    if not value or "你的" in value or "API Key" in value:
        return None
    return value


def get_missing_key_message(provider):
    if provider == "openai":
        return "AI 助教未配置，请先设置 OPENAI_API_KEY。"
    return "AI 助教未配置，请先设置 GEMINI_API_KEY。"


def build_context_text(context_pages):
    """Limit context to current and adjacent pages."""
    parts = []
    total_chars = 0
    for page in context_pages[:5]:
        page_number = page.get("pageNumber") or "?"
        text = str(page.get("text") or "").strip()
        if not text:
            continue
        remaining = MAX_CONTEXT_CHARS - total_chars
        if remaining <= 0:
            break
        text = text[:remaining]
        total_chars += len(text)
        parts.append(f"[第 {page_number} 页]\n{text}")
    return "\n\n".join(parts)


def build_assistant_prompt(document_title, page_number, page_count, question, context_text):
    return (
        "你是韩语学习网站里的 AI 助教。请根据用户当前 PDF 页面内容回答。\n"
        "要求：回答要详细、教学化、适合韩语初中级学习者；不要只给一句摘要；"
        "不要声称看过整本 PDF；不知道时明确说不知道。"
        "请完整回答，不要过早结束；内容较多时分段讲解，确保每个要点都有解释。\n"
        "请按以下结构回答：\n"
        "1. 这一页的学习目标或主题。\n"
        "2. 页面中重要韩语句子或内容的中文解释。\n"
        "3. 重点词汇、表达、语法点和使用场景。\n"
        "4. 学习者容易误解的地方。\n"
        "5. 可以怎么练习。\n"
        "如果页面截图可用，请结合截图中的版面和文字一起讲解。\n\n"
        f"教材标题：{document_title}\n"
        f"当前页：{page_number} / {page_count}\n\n"
        f"页面文字上下文：\n{context_text or '当前页没有可提取文字，可能是扫描图片。'}\n\n"
        f"用户问题：{question}"
    )


def ask_ai_provider(provider, api_key, document_title, page_number, page_count, question, context_text, screenshot):
    prompt = build_assistant_prompt(document_title, page_number, page_count, question, context_text)
    if provider == "openai":
        return ask_openai(
            api_key=api_key,
            model=os.getenv("OPENAI_MODEL", DEFAULT_OPENAI_MODEL),
            prompt=prompt,
            screenshot=screenshot,
        )
    return ask_gemini(
        api_key=api_key,
        model=os.getenv("GEMINI_MODEL", DEFAULT_GEMINI_MODEL),
        prompt=prompt,
        screenshot=screenshot,
    )


def ask_openai(api_key, model, prompt, screenshot):
    """Call OpenAI Responses API through stdlib urllib."""
    content = [{"type": "input_text", "text": prompt}]
    if screenshot:
        content.append({"type": "input_image", "image_url": screenshot})

    payload = {
        "model": model,
        "store": False,
        "input": [{"role": "user", "content": content}],
        "max_output_tokens": 6000,
    }
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(
        OPENAI_RESPONSES_URL,
        data=data,
        method="POST",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
    )

    try:
        with urllib.request.urlopen(request, timeout=45) as response:
            result = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(extract_openai_error(detail) or "AI 助教请求失败。")
    except urllib.error.URLError as error:
        raise RuntimeError(f"AI 助教网络请求失败：{error.reason}")

    return extract_response_text(result) or "我没有生成有效回答。"


def ask_gemini(api_key, model, prompt, screenshot):
    """Call Gemini generateContent API through stdlib urllib."""
    parts = [{"text": prompt}]
    inline_data = parse_data_url_image(screenshot)
    if inline_data:
        parts.append({"inline_data": inline_data})

    payload = {
        "contents": [{"role": "user", "parts": parts}],
        "generationConfig": {
            "maxOutputTokens": 6000,
            "temperature": 0.3,
        },
    }
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    url = GEMINI_API_URL_TEMPLATE.format(
        model=model,
        api_key=urllib.parse.quote(api_key, safe=""),
    )
    request = urllib.request.Request(
        url,
        data=data,
        method="POST",
        headers={"Content-Type": "application/json"},
    )

    try:
        with urllib.request.urlopen(request, timeout=45) as response:
            result = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(extract_gemini_error(detail) or "Gemini 助教请求失败。")
    except urllib.error.URLError as error:
        raise RuntimeError(f"Gemini 助教网络请求失败：{error.reason}")

    return extract_gemini_text(result) or "我没有生成有效回答。"


def extract_toc_with_gemini(api_key, model, image, page_number, page_count):
    inline_data = parse_data_url_image(image)
    if not inline_data:
        return []

    prompt = (
        "你正在为一个 PDF 教材阅读器识别目录页。请只根据图片判断这是不是目录页。"
        "如果不是目录页，返回空数组 JSON：[]。\n"
        "如果是目录页，请抽取目录条目，返回严格 JSON 数组，不要 Markdown，不要解释。"
        "每个对象包含：title, printedPage, type。"
        "title 是目录中的完整标题；printedPage 是书上印刷页码，只能是阿拉伯数字；"
        "type 可选 chapter, section, appendix, frontmatter, other。"
        "重点识别韩语教材目录格式，例如："
        "제1과_ 소개 ... 1, 제2과_ 한국 음식 ... 41, 제3과_ 시장 ... 81, "
        "듣기 지문_ 423, 문화 번역_ 434, 참고 답안_ 444, 색인_ 462。"
        "第1课到第10课这类条目 type 用 chapter；듣기 지문、문화 번역、참고 답안、색인 type 用 appendix。"
        "忽略 머리말、일러두기、내용 구성、나오는 사람 等罗马数字前置页，除非页面只有这些内容。"
        "忽略页眉页脚、装饰文字和点线。"
        "保留韩文、中文和英文原文标题，但不要把多行目录合并成一个 title。"
        f"当前 PDF 页：{page_number} / {page_count}。"
    )
    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt}, {"inline_data": inline_data}]}],
        "generationConfig": {
            "maxOutputTokens": 1800,
            "temperature": 0.1,
        },
    }
    result = post_gemini_payload(api_key, model, payload)
    return normalize_toc_entries(parse_json_array_from_text(extract_gemini_text(result)))


def parse_data_url_image(data_url):
    if not data_url or "," not in data_url or not data_url.startswith("data:image/"):
        return None
    header, data = data_url.split(",", 1)
    mime_type = header.removeprefix("data:").split(";", 1)[0]
    if mime_type not in ("image/png", "image/jpeg", "image/webp"):
        return None
    return {"mime_type": mime_type, "data": data}


def post_gemini_payload(api_key, model, payload):
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    url = GEMINI_API_URL_TEMPLATE.format(
        model=model,
        api_key=urllib.parse.quote(api_key, safe=""),
    )
    request = urllib.request.Request(
        url,
        data=data,
        method="POST",
        headers={"Content-Type": "application/json"},
    )

    try:
        with urllib.request.urlopen(request, timeout=45) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(extract_gemini_error(detail) or "Gemini 助教请求失败。")
    except urllib.error.URLError as error:
        raise RuntimeError(f"Gemini 助教网络请求失败：{error.reason}")


def parse_json_array_from_text(text):
    value = str(text or "").strip()
    if value.startswith("```"):
        value = value.strip("`").strip()
        if value.lower().startswith("json"):
            value = value[4:].strip()
    start = value.find("[")
    end = value.rfind("]")
    if start == -1 or end == -1 or end <= start:
        return []
    try:
        parsed = json.loads(value[start : end + 1])
    except json.JSONDecodeError:
        return []
    return parsed if isinstance(parsed, list) else []


def normalize_toc_entries(entries):
    normalized = []
    for entry in entries[:80]:
        if not isinstance(entry, dict):
            continue
        title = str(entry.get("title") or "").strip()
        try:
            printed_page = int(entry.get("printedPage"))
        except (TypeError, ValueError):
            continue
        if not title or printed_page <= 0:
            continue
        normalized.append({
            "title": title[:120],
            "printedPage": printed_page,
            "type": str(entry.get("type") or "chapter").strip()[:30] or "chapter",
        })
    return normalized


def extract_response_text(result):
    """Extract text from Responses API JSON."""
    if isinstance(result.get("output_text"), str):
        return result["output_text"].strip()

    texts = []
    for item in result.get("output", []):
        for content in item.get("content", []):
            text = content.get("text")
            if isinstance(text, str):
                texts.append(text)
    return "\n".join(texts).strip()


def extract_openai_error(raw_detail):
    try:
        payload = json.loads(raw_detail)
    except json.JSONDecodeError:
        return ""
    error = payload.get("error") or {}
    return error.get("message") or ""


def extract_gemini_text(result):
    texts = []
    for candidate in result.get("candidates", []):
        content = candidate.get("content") or {}
        for part in content.get("parts", []):
            text = part.get("text")
            if isinstance(text, str):
                texts.append(text)
    return "\n".join(texts).strip()


def extract_gemini_error(raw_detail):
    try:
        payload = json.loads(raw_detail)
    except json.JSONDecodeError:
        return ""
    error = payload.get("error") or {}
    return error.get("message") or ""
