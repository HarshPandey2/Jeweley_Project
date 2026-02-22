"""Jewelry upload, list, get, update endpoints."""

import uuid
from datetime import datetime
from pathlib import Path

import aiofiles
from bson import ObjectId
from fastapi import APIRouter, File, HTTPException, Request, UploadFile, BackgroundTasks
from fastapi.responses import JSONResponse

from app.config import settings
from app.db import get_db
from app.models.jewelry import (
    JewelryData,
    JewelryRecord,
    ProcessingStatus,
    ExtractionSource,
)
from app.services.processor import process_upload

router = APIRouter(prefix="/api/jewelry", tags=["jewelry"])
UPLOAD_DIR = Path(settings.UPLOAD_DIR)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def _record_to_dict(r: JewelryRecord) -> dict:
    d = r.model_dump(by_alias=False)
    d["id"] = str(d.get("id") or "")
    d["extracted_data"] = r.extracted_data.model_dump()
    d["created_at"] = r.created_at.isoformat() if r.created_at else None
    d["updated_at"] = r.updated_at.isoformat() if r.updated_at else None
    return d


def _doc_to_dict(doc: dict) -> dict:
    """Normalize Mongo document for JSON response."""
    item = dict(doc)
    item["id"] = str(item.pop("_id", ""))
    item["created_at"] = doc.get("created_at").isoformat() if doc.get("created_at") else None
    item["updated_at"] = doc.get("updated_at").isoformat() if doc.get("updated_at") else None
    item["extracted_data"] = doc.get("extracted_data") or {}
    return item


async def _save_record(record: JewelryRecord) -> str:
    db = await get_db()
    coll = db["jewelry"]
    doc = record.model_dump(by_alias=False)
    doc["extracted_data"] = record.extracted_data.model_dump()
    doc["created_at"] = record.created_at
    doc["updated_at"] = record.updated_at
    doc["_id"] = ObjectId()
    if "id" in doc:
        del doc["id"]
    await coll.insert_one(doc)
    return str(doc["_id"])


async def _update_record(record_id: str, data: dict) -> bool:
    db = await get_db()
    coll = db["jewelry"]
    data["updated_at"] = datetime.utcnow()
    from bson import ObjectId
    try:
        oid = ObjectId(record_id)
    except Exception:
        return False
    r = await coll.update_one({"_id": oid}, {"$set": data})
    return r.modified_count > 0 or r.matched_count > 0


def _minimal_review_record(image_url: str, image_filename: str) -> JewelryRecord:
    """Build a minimal Review Required record (zero crash)."""
    return JewelryRecord(
        image_url=image_url,
        image_filename=image_filename,
        status=ProcessingStatus.REVIEW,
        source=ExtractionSource.OCR,
        confidence_score=0.50,
        review_required=True,
    )


@router.post("/upload", response_class=JSONResponse)
async def upload_spec_sheet(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None,
):
    """
    Upload image. Save to /uploads, run AI then OCR fallback.
    Never returns 5xx/4xx to frontend - always 201 with a record (Review Required on any failure).
    """
    print(f"Upload endpoint called: filename={file.filename}, content_type={file.content_type}")

    allowed_types = {
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/jpg",
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
    }
    allowed_ext = {".jpg", ".jpeg", ".png", ".webp", ".pdf", ".xlsx", ".xls"}
    ext = (Path(file.filename or "image.jpg").suffix or ".jpg").lower()
    content_type = (getattr(file, "content_type") or "").lower().split(";")[0].strip()
    if content_type not in allowed_types and ext not in allowed_ext:
        record = _minimal_review_record("", file.filename or "image")
        out = _record_to_dict(record)
        out["id"] = str(uuid.uuid4())
        return JSONResponse(content=out, status_code=201)

    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = UPLOAD_DIR / filename
    base_url = "http://localhost:8000/uploads"
    image_url = f"{base_url}/{filename}"

    content = b""
    try:
        content = await file.read()
        print(f"Read {len(content)} bytes from uploaded file")
        async with aiofiles.open(filepath, "wb") as f:
            await f.write(content)
        print(f"Saved file to {filepath}")
    except Exception as e:
        print(f"ERROR: Failed to save file: {e}")
        import traceback
        traceback.print_exc()

    if not filepath.exists():
        print(f"WARNING: File {filepath} does not exist after save attempt")
        record = _minimal_review_record(image_url, filename)
    else:
        try:
            print(f"Processing image: {filepath}")
            record = process_upload(filepath, image_url=image_url, image_filename=filename)
            print(f"Processing complete: status={record.status}, source={record.source}")
        except Exception as e:
            print(f"ERROR: Processing failed: {e}")
            import traceback
            traceback.print_exc()
            record = _minimal_review_record(image_url, filename)

    try:
        record_id = await _save_record(record)
        print(f"Saved record to DB: {record_id}")
    except Exception as e:
        print(f"WARNING: Failed to save to DB: {e}")
        import traceback
        traceback.print_exc()
        record_id = str(uuid.uuid4())

    try:
        out = _record_to_dict(record)
        out["id"] = record_id
        print(f"Returning record: id={out['id']}, status={out['status']}")
        return JSONResponse(content=out, status_code=201)
    except Exception as e:
        print(f"ERROR: Failed to serialize response: {e}")
        import traceback
        traceback.print_exc()
        # Fallback response
        fallback = {
            "id": str(uuid.uuid4()),
            "image_url": image_url,
            "image_filename": filename,
            "extracted_data": {},
            "status": "Review Required",
            "source": "OCR",
            "confidence_score": 0.5,
            "review_required": True,
            "created_at": None,
            "updated_at": None,
        }
        return JSONResponse(content=fallback, status_code=201)


@router.get("")
async def list_jewelry(search: str | None = None, status: str | None = None):
    """List all records, optional search and status filter."""
    db = await get_db()
    coll = db["jewelry"]
    q = {}
    if status:
        q["status"] = status
    if search:
        q["$or"] = [
            {"image_filename": {"$regex": search, "$options": "i"}},
            {"raw_text": {"$regex": search, "$options": "i"}},
        ]
    cursor = coll.find(q).sort("created_at", -1)
    items = []
    async for doc in cursor:
        item = dict(doc)
        item["id"] = str(item.pop("_id", ""))
        item["created_at"] = doc.get("created_at").isoformat() if doc.get("created_at") else None
        item["updated_at"] = doc.get("updated_at").isoformat() if doc.get("updated_at") else None
        item["extracted_data"] = doc.get("extracted_data") or {}
        items.append(item)
    return {"items": items, "total": len(items)}


@router.get("/stats")
async def get_stats():
    """Dashboard metrics: total, pending (Processing + Review), completed (Completed)."""
    db = await get_db()
    coll = db["jewelry"]
    total = await coll.count_documents({})
    completed = await coll.count_documents({"status": ProcessingStatus.COMPLETED.value})
    review = await coll.count_documents({"status": ProcessingStatus.REVIEW.value})
    processing = await coll.count_documents({"status": ProcessingStatus.PROCESSING.value})
    pending = review + processing
    return {
        "total": total,
        "pending": pending,
        "completed": completed,
        "review_required": review,
        "processing": processing,
    }


@router.get("/confidence-trend")
async def confidence_trend(limit: int = 10):
    """Last N records for confidence trend chart."""
    db = await get_db()
    coll = db["jewelry"]
    cursor = coll.find({}).sort("created_at", -1).limit(limit)
    points = []
    async for doc in cursor:
        points.append({
            "id": str(doc["_id"]),
            "date": doc.get("created_at").isoformat() if doc.get("created_at") else None,
            "confidence": doc.get("confidence_score", 0),
            "source": doc.get("source", "AI"),
        })
    return {"points": points}


@router.get("/{record_id}")
async def get_jewelry(record_id: str):
    """Get one record by ID."""
    try:
        oid = ObjectId(record_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Not found")
    db = await get_db()
    coll = db["jewelry"]
    doc = await coll.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    return _doc_to_dict(doc)


@router.patch("/{record_id}")
async def update_jewelry(record_id: str, data: JewelryData):
    """Update extracted data for a record (e.g. after review)."""
    db = await get_db()
    coll = db["jewelry"]
    try:
        oid = ObjectId(record_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Not found")
    update = {
        "extracted_data": data.model_dump(),
        "updated_at": datetime.utcnow(),
        "status": "Completed",
        "review_required": False,
    }
    r = await coll.update_one({"_id": oid}, {"$set": update})
    if r.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    doc = await coll.find_one({"_id": oid})
    return _doc_to_dict(doc)
