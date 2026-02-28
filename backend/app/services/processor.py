"""Orchestrates AI -> OCR fallback. Never raises; returns record with Review status on full failure."""

from pathlib import Path

from app.models.jewelry import (
    JewelryData,
    JewelryRecord,
    ProcessingStatus,
    ExtractionSource,
)
from app.services.ai_service import extract_with_gemini
from app.services.ocr_service import extract_from_text, extract_with_ocr

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}
PDF_EXTS = {".pdf"}
EXCEL_EXTS = {".xlsx", ".xlsm", ".xltx", ".xltm", ".xls"}


def _has_extracted_values(data: JewelryData) -> bool:
    return any(v is not None and v != "" and v != [] and v != {} for v in data.model_dump().values())


def _extract_pdf_text(path: Path) -> str:
    try:
        from pypdf import PdfReader

        reader = PdfReader(str(path))
        parts: list[str] = []
        for page in reader.pages[:10]:
            t = page.extract_text() or ""
            if t.strip():
                parts.append(t)
        return "\n".join(parts).strip()
    except Exception:
        return ""


def _extract_excel_text(path: Path) -> str:
    ext = path.suffix.lower()
    try:
        if ext == ".xls":
            import xlrd

            wb = xlrd.open_workbook(str(path))
            lines: list[str] = []
            for sheet in wb.sheets()[:8]:
                for r in range(min(sheet.nrows, 1200)):
                    row = sheet.row_values(r)
                    cells = [str(c).strip() for c in row if str(c).strip()]
                    if cells:
                        lines.append(" | ".join(cells))
            return "\n".join(lines).strip()

        import openpyxl

        wb = openpyxl.load_workbook(path, data_only=True, read_only=True)
        lines = []
        for ws in wb.worksheets[:8]:
            for row in ws.iter_rows(min_row=1, max_row=1200, values_only=True):
                cells = [str(c).strip() for c in row if c is not None and str(c).strip()]
                if cells:
                    lines.append(" | ".join(cells))
        return "\n".join(lines).strip()
    except Exception:
        return ""


def _process_text_document(path: Path, record: JewelryRecord) -> JewelryRecord:
    ext = path.suffix.lower()
    if ext in PDF_EXTS:
        # Scanned PDFs often have no embedded text; Gemini can read visual content directly.
        ai_data = extract_with_gemini(path)
        if ai_data is not None:
            record.extracted_data = ai_data
            record.source = ExtractionSource.AI
            if _has_extracted_values(ai_data):
                record.status = ProcessingStatus.COMPLETED
                record.confidence_score = 0.92
                record.review_required = False
            else:
                record.status = ProcessingStatus.REVIEW
                record.confidence_score = 0.0
                record.review_required = True
            return record

    raw_text = ""
    if ext in PDF_EXTS:
        raw_text = _extract_pdf_text(path)
    elif ext in EXCEL_EXTS:
        raw_text = _extract_excel_text(path)

    data = extract_from_text(raw_text)
    record.extracted_data = data
    record.raw_text = raw_text or None
    record.source = ExtractionSource.OCR

    if _has_extracted_values(data):
        record.status = ProcessingStatus.COMPLETED
        record.confidence_score = 0.80
        record.review_required = False
    else:
        record.status = ProcessingStatus.REVIEW
        record.confidence_score = 0.50
        record.review_required = True
    return record

    import re


def _extract_diamond_breakdown(raw_text: str) -> list[dict]:
    """
    Extracts row-wise diamond breakdown from GEM REPORTER style table.
    Example row:
    Diamond Round 1.30 x 1.30 84 0.69
    """
    if not raw_text:
        return []

    pattern = r"(Diamond\s+\w+)\s+([\d\.]+\s*x\s*[\d\.]+)\s+(\d+)\s+([\d\.]+)"

    matches = re.findall(pattern, raw_text, re.IGNORECASE)

    diamonds = []

    for match in matches:
        diamonds.append(
            {
                "shape": match[0].replace("Diamond ", "").strip(),
                "size": match[1].replace(" ", ""),
                "count": int(match[2]),
                "carat": float(match[3]),
            }
        )

    return diamonds


def process_upload(
    file_path: str | Path,
    image_url: str = "",
    image_filename: str | None = None,
) -> JewelryRecord:
    """
    Step 1: Try Gemini. Step 2: On failure, use OCR + regex.
    Never raises. On total failure returns record with status Review Required, partial data, confidence 0.5.
    """
    path = Path(file_path)
    record = JewelryRecord(
        image_url=image_url or "",
        image_filename=image_filename or path.name,
        status=ProcessingStatus.PROCESSING,
        source=ExtractionSource.AI,
        confidence_score=1.0,
        review_required=False,
    )

    ext = path.suffix.lower()
    if ext in PDF_EXTS or ext in EXCEL_EXTS:
        return _process_text_document(path, record)
    if ext not in IMAGE_EXTS:
        record.status = ProcessingStatus.REVIEW
        record.source = ExtractionSource.OCR
        record.confidence_score = 0.50
        record.review_required = True
        record.raw_text = "Unsupported file format."
        return record

    # Step 1: Gemini
    data = extract_with_gemini(path)
    if data is not None:
        data_dict = data.model_dump()
        if "diamonds" not in data_dict:
            data_dict["diamonds"] = None
        record.extracted_data = data
        record.source = ExtractionSource.AI

        if _has_extracted_values(data):
            record.status = ProcessingStatus.COMPLETED
            record.confidence_score = 0.95
            record.review_required = False
        else:
            record.status = ProcessingStatus.REVIEW
            record.confidence_score = 0.0
            record.review_required = True
        return record

    # Step 2: Safety net - OCR + regex
    ocr_data, raw_text = extract_with_ocr(path)
    record.extracted_data = ocr_data
    record.raw_text = raw_text or None
    record.status = ProcessingStatus.REVIEW
    record.source = ExtractionSource.OCR
    record.confidence_score = 0.50
    record.review_required = True
    return record
