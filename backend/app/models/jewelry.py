"""Pydantic schemas for jewelry specification data (16 fields)."""

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class ProcessingStatus(str, Enum):
    PROCESSING = "Processing"
    COMPLETED = "Completed"
    REVIEW = "Review Required"


class ExtractionSource(str, Enum):
    AI = "AI"
    OCR = "OCR"


class JewelryData(BaseModel):
    """Extracted jewelry specification - all fields nullable for partial OCR results."""

    ring_size: Optional[str] = None
    gold_weight_14kt_gm: Optional[float] = None
    gold_weight_18kt_gm: Optional[float] = None
    gold_weight_22kt_gm: Optional[float] = None
    silver_weight_gm: Optional[float] = None
    platinum_weight_gm: Optional[float] = None
    diamonds: Optional[list[dict]] = None
    diamond_weight_ct: Optional[float] = None
    diamond_count: Optional[int] = None
    diamond_shape: Optional[str] = None  # e.g. Round, Princess, Oval
    stone_weight_ct: Optional[float] = None  # colored stones
    stone_count: Optional[int] = None
    stone_type: Optional[str] = None  # e.g. Ruby, Sapphire, Emerald
    dimensions_mm: Optional[str] = None  # e.g. "12x8x6"
    length_mm: Optional[float] = None
    width_mm: Optional[float] = None
    height_mm: Optional[float] = None

    class Config:
        json_schema_extra = {
            "example": {
                "ring_size": "7",
                "gold_weight_14kt_gm": 3.5,
                "diamond_weight_ct": 0.5,
                "diamond_count": 12,
                "diamond_shape": "Round",
                "dimensions_mm": "12x8x6",
            }
        }


class JewelryRecordCreate(BaseModel):
    """Payload for creating a record (e.g. from upload)."""

    image_filename: Optional[str] = None


class JewelryRecord(BaseModel):
    """Full record as stored in DB and returned by API."""

    id: Optional[str] = Field(None, alias="_id")
    image_url: str = ""
    image_filename: Optional[str] = None
    extracted_data: JewelryData = Field(default_factory=JewelryData)
    status: ProcessingStatus = ProcessingStatus.PROCESSING
    source: ExtractionSource = ExtractionSource.AI
    confidence_score: float = 1.0
    review_required: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    raw_text: Optional[str] = None  # OCR raw text when fallback used

    class Config:
        populate_by_name = True
        use_enum_values = True
