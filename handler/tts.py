"""Server-side Korean TTS proxy with local audio cache."""

from __future__ import annotations

import base64
import hashlib
import json
import os
from pathlib import Path
import urllib.error
import urllib.parse
import urllib.request


ROOT_DIR = Path(__file__).resolve().parent.parent
LOCAL_TTS_ENV_PATH = ROOT_DIR / ".env.tts.local"
GENERATED_AUDIO_DIR = ROOT_DIR / "static" / "generated-audio"
GOOGLE_TTS_URL = "https://texttospeech.googleapis.com/v1/text:synthesize?key={api_key}"
DEFAULT_TTS_VOICE = "ko-KR-Neural2-A"


def load_local_tts_env() -> None:
    if not LOCAL_TTS_ENV_PATH.exists():
        return
    for raw_line in LOCAL_TTS_ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip("'\"")
        if key and key not in os.environ:
            os.environ[key] = value


load_local_tts_env()


def clean_secret(value: str | None) -> str:
    value = (value or "").strip()
    if not value or "你的" in value or "API Key" in value:
        return ""
    return value


def normalize_text(value: str | None) -> str:
    return " ".join((value or "").strip().split())


def normalize_voice(value: str | None) -> str:
    value = (value or "").strip() or os.getenv("GOOGLE_TTS_VOICE", DEFAULT_TTS_VOICE)
    return value if value.startswith("ko-KR-") else DEFAULT_TTS_VOICE


def normalize_speaking_rate(value, slow: bool = False) -> float:
    if value is None:
        return 0.75 if slow else 1.0
    try:
        rate = float(value)
    except (TypeError, ValueError):
        rate = 0.75 if slow else 1.0
    return min(max(rate, 0.25), 2.0)


def cache_url_for(text: str, voice: str, speaking_rate: float) -> tuple[Path, str]:
    key = json.dumps(
        {"provider": "google", "text": text, "voice": voice, "rate": speaking_rate},
        ensure_ascii=False,
        sort_keys=True,
    )
    digest = hashlib.sha256(key.encode("utf-8")).hexdigest()[:32]
    filename = f"tts_{digest}.mp3"
    return GENERATED_AUDIO_DIR / filename, f"/static/generated-audio/{filename}"


def synthesize_google_tts(text: str, voice: str, speaking_rate: float) -> bytes:
    api_key = clean_secret(os.getenv("GOOGLE_TTS_API_KEY") or os.getenv("GOOGLE_CLOUD_TTS_API_KEY"))
    if not api_key:
        raise RuntimeError("TTS 未配置，请设置 GOOGLE_TTS_API_KEY。")

    payload = {
        "input": {"text": text},
        "voice": {"languageCode": "ko-KR", "name": voice},
        "audioConfig": {
            "audioEncoding": "MP3",
            "speakingRate": speaking_rate,
            "pitch": 0,
        },
    }
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(
        GOOGLE_TTS_URL.format(api_key=urllib.parse.quote(api_key, safe="")),
        data=data,
        method="POST",
        headers={"Content-Type": "application/json; charset=utf-8"},
    )

    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            result = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        try:
            detail = json.loads(error.read().decode("utf-8"))
            message = detail.get("error", {}).get("message")
        except (UnicodeDecodeError, json.JSONDecodeError):
            message = ""
        raise RuntimeError(message or "Google TTS 请求失败。") from error
    except (urllib.error.URLError, TimeoutError) as error:
        raise RuntimeError(f"Google TTS 网络请求失败：{getattr(error, 'reason', error)}") from error

    audio_content = result.get("audioContent")
    if not audio_content:
        raise RuntimeError("Google TTS 没有返回音频。")
    return base64.b64decode(audio_content)


def handle_tts_request(handler, method, path, query):
    if method != "POST" or path != "/api/tts/synthesize":
        return None

    body = handler.read_json_body()
    text = normalize_text(body.get("text"))
    if not text:
        handler.send_json({"error": "TTS 文本不能为空"}, status=400)
        return True
    if len(text) > 500:
        handler.send_json({"error": "单次 TTS 文本不能超过 500 字符"}, status=400)
        return True

    voice = normalize_voice(body.get("voice"))
    speaking_rate = normalize_speaking_rate(body.get("speakingRate"), bool(body.get("slow")))
    cache_path, public_url = cache_url_for(text, voice, speaking_rate)
    if cache_path.exists():
        handler.send_json({"audioUrl": public_url, "cached": True, "voice": voice, "speakingRate": speaking_rate})
        return True

    try:
        audio_bytes = synthesize_google_tts(text, voice, speaking_rate)
    except RuntimeError as error:
        handler.send_json({"error": str(error)}, status=503)
        return True

    GENERATED_AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    cache_path.write_bytes(audio_bytes)
    handler.send_json({"audioUrl": public_url, "cached": False, "voice": voice, "speakingRate": speaking_rate}, status=201)
    return True
