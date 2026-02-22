"""Google Gemini API integration via REST. Returns strict JSON matching JewelryData schema."""

import base64
import json
import logging
import mimetypes
import urllib.error
import urllib.request
from pathlib import Path
from typing import Optional

from app.config import settings
from app.models.jewelry import JewelryData

logger = logging.getLogger(__name__)


# SCHEMA_PROMPT = """
# You are a jewelry specification extractor. Analyze the image and return a single JSON object with ONLY these keys (use null for missing values):
# - ring_size (string, e.g. "7")
# - gold_weight_14kt_gm (number)
# - gold_weight_18kt_gm (number)
# - gold_weight_22kt_gm (number)
# - silver_weight_gm (number)
# - platinum_weight_gm (number)
# - diamond_weight_ct (number)
# - diamond_count (integer)
# - diamond_shape (string: Round, Princess, Oval, etc.)
# - stone_weight_ct (number)
# - stone_count (integer)
# - stone_type (string: Ruby, Sapphire, Emerald, etc.)
# - dimensions_mm (string, e.g. "12x8x6")
# - length_mm (number)
# - width_mm (number)
# - height_mm (number)

# Return ONLY valid JSON, no markdown or explanation.
# """

SCHEMA_PROMPT = """
You are a jewelry specification extractor.

Analyze the image and return a single JSON object with the following keys.
Use null for missing values.

FIELDS:

- ring_size (string)
- gold_weight_14kt_gm (number)
- gold_weight_18kt_gm (number)
- gold_weight_22kt_gm (number)
- silver_weight_gm (number)
- platinum_weight_gm (number)

- diamond_weight_ct (number)  // total diamond weight
- diamond_shape (string)
- diamond_count (integer)
- diamond_shape_count (integer)
- diamond_round (string)
- diamond_pear (string)

- stone_weight_ct (number)
- stone_count (integer)
- stone_type (string)

- dimensions_mm (string)
- length_mm (number)
- width_mm (number)
- height_mm (number)

- diamonds (array of objects OR null)

DIAMOND TABLE RULES:

If a GEM REPORTER or diamond breakdown table is visible:

1. You MUST extract every row separately.
2. You MUST include the "diamonds" array.
3. Each row must contain:

   {
     "shape": string,
     "size": string,
     "count": integer,
     "carat": number
   }

4. DO NOT merge rows.
5. DO NOT summarize rows.
6. Preserve each row exactly as shown.

7. diamond_count MUST equal the sum of all row counts.
8. diamond_weight_ct MUST equal the sum of all row carat values.

If no table is visible, return diamonds as null.

Return ONLY valid JSON.
No markdown.
No explanation.
"""

MODEL_FALLBACKS = [
    "gemini-3-flash-preview",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-flash-latest",
]


def _extract_text_from_response(resp_json: dict) -> Optional[str]:
    candidates = resp_json.get("candidates") or []
    if not candidates:
        return None
    parts = ((candidates[0].get("content") or {}).get("parts") or [])
    for part in parts:
        text = part.get("text")
        if isinstance(text, str) and text.strip():
            return text.strip()
    return None


def _parse_json_text(text: str) -> Optional[dict]:
    body = text.strip()
    if body.startswith("```"):
        body = body.strip("`").strip()
        if body.lower().startswith("json"):
            body = body[4:].strip()
    try:
        return json.loads(body)
    except json.JSONDecodeError:
        start = body.find("{")
        end = body.rfind("}")
        if start >= 0 and end > start:
            try:
                return json.loads(body[start : end + 1])
            except json.JSONDecodeError:
                return None
        return None


def _generate_content(image_path: Path, model: str) -> Optional[dict]:
    mime_type = mimetypes.guess_type(image_path.name)[0] or "image/jpeg"
    with image_path.open("rb") as f:
        b64 = base64.b64encode(f.read()).decode("utf-8")

    payload = {
        "generationConfig": {"responseMimeType": "application/json"},
        "contents": [
            {
                "parts": [
                    {"text": SCHEMA_PROMPT},
                    {
                        "inlineData": {
                            "mimeType": mime_type,
                            "data": b64,
                        }
                    },
                ]
            }
        ],
    }
    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{model}:generateContent?key={settings.GEMINI_API_KEY}"
    )
    req = urllib.request.Request(
        url=url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=45) as resp:
        body = resp.read().decode("utf-8")
    return json.loads(body)


def extract_with_gemini(image_path: str | Path) -> Optional[JewelryData]:
    """
    Call Gemini API with image (REST). Returns JewelryData on success, None on any failure.
    Never raises - catches all exceptions.
    """
    if not settings.GEMINI_API_KEY:
        return None
    try:
        path = Path(image_path)
        if not path.exists():
            return None

        candidate_models: list[str] = []
        if settings.GEMINI_MODEL:
            candidate_models.append(settings.GEMINI_MODEL.strip())
        candidate_models.extend([m for m in MODEL_FALLBACKS if m not in candidate_models])

        for model in candidate_models:
            try:
                resp_json = _generate_content(path, model)
                text = _extract_text_from_response(resp_json)
                if not text:
                    logger.warning("Gemini returned no text for model '%s'", model)
                    continue
                data = _parse_json_text(text)
                if not isinstance(data, dict):
                    logger.warning("Gemini returned non-JSON text for model '%s'", model)
                    continue
                parsed = JewelryData(**data)
                logger.info("Gemini extraction succeeded with model '%s'", model)
                return parsed
            except urllib.error.HTTPError as e:
                logger.warning("Gemini HTTPError for model '%s': %s", model, getattr(e, "code", "unknown"))
                continue
            except (urllib.error.URLError, TimeoutError):
                logger.warning("Gemini transport error for model '%s'", model)
                continue
            except (json.JSONDecodeError, ValueError, KeyError):
                logger.warning("Gemini response parse error for model '%s'", model)
                continue
            except Exception:
                logger.exception("Unexpected Gemini error for model '%s'", model)
                continue
        return None
    except Exception:
        logger.exception("Unexpected Gemini extraction setup error")
        return None
