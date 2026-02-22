"""OCR fallback: Tesseract CLI + PIL preprocessing, regex extraction for jewelry units."""

from __future__ import annotations

import re
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Any, Optional

from app.models.jewelry import JewelryData

# OCR availability cache. We avoid pytesseract/cv2 imports because unstable
# numpy wheels on some Windows setups can crash the Python process.
_OCR_AVAILABLE: Optional[bool] = None


def _ocr_available() -> bool:
    global _OCR_AVAILABLE
    if _OCR_AVAILABLE is not None:
        return _OCR_AVAILABLE
    try:
        from PIL import Image  # noqa: F401
        _OCR_AVAILABLE = shutil.which("tesseract") is not None
    except Exception:
        _OCR_AVAILABLE = False
    return _OCR_AVAILABLE


# Regex patterns for jewelry units: (\d+\.?\d*)\s*(gm|ct|mm) and karat (14k, 18k, 22k)
PATTERNS = {
    "gold_weight_14kt_gm": re.compile(r"(?:14\s*k|14kt|14k)\s*[:\s]*(\d+\.?\d*)\s*gm", re.I),
    "gold_14_alt": re.compile(r"(\d+\.?\d*)\s*gm\s*(?:14|14k|14kt)", re.I),
    "gold_weight_18kt_gm": re.compile(r"(?:18\s*k|18kt|18k)\s*[:\s]*(\d+\.?\d*)\s*gm", re.I),
    "gold_18_alt": re.compile(r"(\d+\.?\d*)\s*gm\s*(?:18|18k|18kt)", re.I),
    "gold_weight_22kt_gm": re.compile(r"(?:22\s*k|22kt|22k)\s*[:\s]*(\d+\.?\d*)\s*gm", re.I),
    "generic_gm": re.compile(r"(\d+\.?\d*)\s*gm", re.I),
    "diamond_weight_ct": re.compile(r"(?:diamond|diam)\s*[:\s]*(\d+\.?\d*)\s*ct", re.I),
    "ct_alt": re.compile(r"(\d+\.?\d*)\s*ct", re.I),
    "ring_size": re.compile(r"ring\s*size\s*[:\s]*(\d+(?:\.\d+)?)", re.I),
    "size_alt": re.compile(r"size\s*[:\s]*(\d+(?:\.\d+)?)", re.I),
    "dimensions_mm": re.compile(r"(\d+\.?\d*)\s*[x×]\s*(\d+\.?\d*)\s*[x×]?\s*(\d+\.?\d*)?\s*mm", re.I),
    "length_mm": re.compile(r"length\s*[:\s]*(\d+\.?\d*)\s*mm", re.I),
    "width_mm": re.compile(r"width\s*[:\s]*(\d+\.?\d*)\s*mm", re.I),
    "height_mm": re.compile(r"height\s*[:\s]*(\d+\.?\d*)\s*mm", re.I),
    "diamond_count": re.compile(r"(?:diamond|diam)\s*count\s*[:\s]*(\d+)", re.I),
    "stone_count": re.compile(r"stone\s*count\s*[:\s]*(\d+)", re.I),
    # Table-style lines seen in CAD report screenshots (e.g., "Yellow Gold:14KY  5.02 ...")
    "table_gold_14": re.compile(r"(?:yellow|white)?\s*gold[^\n\r]{0,24}\b14k\w*\b[^\n\r]{0,12}?(\d+\.?\d*)", re.I),
    "table_gold_18": re.compile(r"(?:yellow|white)?\s*gold[^\n\r]{0,24}\b18k\w*\b[^\n\r]{0,12}?(\d+\.?\d*)", re.I),
    "table_gold_22": re.compile(r"(?:yellow|white)?\s*gold[^\n\r]{0,24}\b22k\w*\b[^\n\r]{0,12}?(\d+\.?\d*)", re.I),
    "table_silver": re.compile(r"\bsilver\b[^\n\r]{0,16}?(\d+\.?\d*)", re.I),
    "table_platinum": re.compile(r"\bplatinum\b[^\n\r]{0,16}?(\d+\.?\d*)", re.I),
    "table_diamond_shape": re.compile(r"\b(round|princess|oval|emerald|pear|marquise|cushion|heart|asscher|radiant)\b", re.I),
    "table_diamond_count": re.compile(r"\b(?:diamond|diam)\b[^\n\r]{0,24}\b(\d{1,3})\b", re.I),
    "table_diamond_weight": re.compile(r"\b(\d+\.?\d*)\s*(?:ct|tw|tcw)\b", re.I),
}


def _preprocess_image(image_path: Path) -> Any:
    """Grayscale + thresholding for better OCR without OpenCV dependency."""
    if not _ocr_available():
        return None
    try:
        from PIL import Image, ImageOps
        # PIL-only path to avoid hard crashes from incompatible cv2/numpy binaries.
        img = Image.open(image_path).convert("L")
        img = ImageOps.autocontrast(img)
        # Simple fixed threshold works reliably for printed spec sheets.
        return img.point(lambda p: 255 if p > 160 else 0, mode="1").convert("L")
    except Exception:
        try:
            from PIL import Image
            return Image.open(image_path).convert("L")
        except Exception:
            return None


def _extract_with_regex(text: str) -> JewelryData:
    """Parse raw OCR text with regex and fill JewelryData."""
    data: dict = {}
    # Ring size
    m = PATTERNS["ring_size"].search(text) or PATTERNS["size_alt"].search(text)
    if m:
        data["ring_size"] = m.group(1)

    # Gold weights
    m = PATTERNS["gold_weight_14kt_gm"].search(text) or PATTERNS["gold_14_alt"].search(text)
    if m:
        data["gold_weight_14kt_gm"] = float(m.group(1))
    m = PATTERNS["gold_weight_18kt_gm"].search(text) or PATTERNS["gold_18_alt"].search(text)
    if m:
        data["gold_weight_18kt_gm"] = float(m.group(1))
    m = PATTERNS["gold_weight_22kt_gm"].search(text)
    if m:
        data["gold_weight_22kt_gm"] = float(m.group(1))
    if data.get("gold_weight_14kt_gm") is None:
        m = PATTERNS["table_gold_14"].search(text)
        if m:
            data["gold_weight_14kt_gm"] = float(m.group(1))
    if data.get("gold_weight_18kt_gm") is None:
        m = PATTERNS["table_gold_18"].search(text)
        if m:
            data["gold_weight_18kt_gm"] = float(m.group(1))
    if data.get("gold_weight_22kt_gm") is None:
        m = PATTERNS["table_gold_22"].search(text)
        if m:
            data["gold_weight_22kt_gm"] = float(m.group(1))
    if data.get("silver_weight_gm") is None:
        m = PATTERNS["table_silver"].search(text)
        if m:
            data["silver_weight_gm"] = float(m.group(1))
    if data.get("platinum_weight_gm") is None:
        m = PATTERNS["table_platinum"].search(text)
        if m:
            data["platinum_weight_gm"] = float(m.group(1))

    # Diamond weight/count
    m = PATTERNS["diamond_weight_ct"].search(text) or PATTERNS["ct_alt"].search(text)
    if m:
        data["diamond_weight_ct"] = float(m.group(1))
    m = PATTERNS["diamond_count"].search(text)
    if m:
        data["diamond_count"] = int(m.group(1))
    if data.get("diamond_weight_ct") is None:
        m = PATTERNS["table_diamond_weight"].search(text)
        if m:
            data["diamond_weight_ct"] = float(m.group(1))
    if data.get("diamond_shape") is None:
        m = PATTERNS["table_diamond_shape"].search(text)
        if m:
            data["diamond_shape"] = m.group(1).title()
    if data.get("diamond_count") is None:
        m = PATTERNS["table_diamond_count"].search(text)
        if m:
            data["diamond_count"] = int(m.group(1))

    # Dimensions
    m = PATTERNS["dimensions_mm"].search(text)
    if m:
        g = m.groups()
        data["dimensions_mm"] = "x".join(x for x in g if x)
        if len(g) >= 1 and g[0]:
            data["length_mm"] = float(g[0])
        if len(g) >= 2 and g[1]:
            data["width_mm"] = float(g[1])
        if len(g) >= 3 and g[2]:
            data["height_mm"] = float(g[2])
    for key, pat in [("length_mm", PATTERNS["length_mm"]), ("width_mm", PATTERNS["width_mm"]), ("height_mm", PATTERNS["height_mm"])]:
        if key not in data or data[key] is None:
            m = pat.search(text)
            if m:
                data[key] = float(m.group(1))

    return JewelryData(**data)


def extract_from_text(text: str) -> JewelryData:
    """Public helper to map plain text/table text into JewelryData."""
    if not text:
        return JewelryData()
    return _extract_with_regex(text)


def extract_with_ocr(image_path: str | Path) -> tuple[JewelryData, str]:
    """
    Run tesseract CLI on preprocessed image, then regex parse.
    Returns (JewelryData, raw_text). Never raises - returns empty data and text on failure.
    """
    raw_text = ""
    if not _ocr_available():
        return JewelryData(), "OCR unavailable: tesseract not found in PATH."
    path = Path(image_path)
    if not path.exists():
        return JewelryData(), "OCR unavailable: image file does not exist."
    try:
        pil_img = _preprocess_image(path)
        if pil_img is None:
            return JewelryData(), "OCR preprocessing failed."
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
            tmp_path = Path(tmp.name)
        try:
            pil_img.save(tmp_path)
            proc = subprocess.run(
                ["tesseract", str(tmp_path), "stdout", "--psm", "6"],
                capture_output=True,
                text=True,
                timeout=25,
                check=False,
            )
            raw_text = proc.stdout or ""
            if proc.returncode != 0 and not raw_text:
                raw_text = (proc.stderr or "").strip()
        finally:
            try:
                tmp_path.unlink(missing_ok=True)
            except Exception:
                pass
        raw_text = raw_text or ""
        data = extract_from_text(raw_text)
        return data, raw_text
    except Exception:
        return JewelryData(), raw_text
