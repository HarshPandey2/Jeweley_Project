"""
Seed the database with 5 dummy jewelry items for demo.
Run from backend directory: python -m seed (or python seed.py with proper PYTHONPATH)
"""
import asyncio
from datetime import datetime
from bson import ObjectId

# Add parent to path so app is importable
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.config import settings
from motor.motor_asyncio import AsyncIOMotorClient


DUMMY_ITEMS = [
    {
        "_id": ObjectId(),
        "image_url": "http://localhost:8000/uploads/demo1.jpg",
        "image_filename": "demo1.jpg",
        "extracted_data": {
            "ring_size": "7",
            "gold_weight_14kt_gm": 3.5,
            "gold_weight_18kt_gm": None,
            "gold_weight_22kt_gm": None,
            "silver_weight_gm": None,
            "platinum_weight_gm": None,
            "diamond_weight_ct": 0.5,
            "diamond_count": 12,
            "diamond_shape": "Round",
            "stone_weight_ct": None,
            "stone_count": None,
            "stone_type": None,
            "dimensions_mm": "12x8x6",
            "length_mm": 12.0,
            "width_mm": 8.0,
            "height_mm": 6.0,
        },
        "status": "Completed",
        "source": "AI",
        "confidence_score": 0.95,
        "review_required": False,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "raw_text": None,
    },
    {
        "_id": ObjectId(),
        "image_url": "http://localhost:8000/uploads/demo2.jpg",
        "image_filename": "demo2.jpg",
        "extracted_data": {
            "ring_size": "6.5",
            "gold_weight_14kt_gm": None,
            "gold_weight_18kt_gm": 4.2,
            "gold_weight_22kt_gm": None,
            "silver_weight_gm": None,
            "platinum_weight_gm": None,
            "diamond_weight_ct": 1.2,
            "diamond_count": 1,
            "diamond_shape": "Princess",
            "stone_weight_ct": None,
            "stone_count": None,
            "stone_type": None,
            "dimensions_mm": "8x6x4",
            "length_mm": 8.0,
            "width_mm": 6.0,
            "height_mm": 4.0,
        },
        "status": "Completed",
        "source": "AI",
        "confidence_score": 0.92,
        "review_required": False,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "raw_text": None,
    },
    {
        "_id": ObjectId(),
        "image_url": "http://localhost:8000/uploads/demo3.jpg",
        "image_filename": "demo3.jpg",
        "extracted_data": {
            "ring_size": None,
            "gold_weight_14kt_gm": 2.8,
            "gold_weight_18kt_gm": None,
            "gold_weight_22kt_gm": None,
            "silver_weight_gm": None,
            "platinum_weight_gm": None,
            "diamond_weight_ct": 0.25,
            "diamond_count": 6,
            "diamond_shape": "Round",
            "stone_weight_ct": 0.5,
            "stone_count": 2,
            "stone_type": "Sapphire",
            "dimensions_mm": None,
            "length_mm": None,
            "width_mm": None,
            "height_mm": None,
        },
        "status": "Review Required",
        "source": "OCR",
        "confidence_score": 0.50,
        "review_required": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "raw_text": "14k 2.8 gm Diamond 0.25 ct x6 Round Sapphire 0.5 ct x2",
    },
    {
        "_id": ObjectId(),
        "image_url": "http://localhost:8000/uploads/demo4.jpg",
        "image_filename": "demo4.jpg",
        "extracted_data": {
            "ring_size": "8",
            "gold_weight_14kt_gm": 5.0,
            "gold_weight_18kt_gm": None,
            "gold_weight_22kt_gm": None,
            "silver_weight_gm": None,
            "platinum_weight_gm": None,
            "diamond_weight_ct": 2.0,
            "diamond_count": 1,
            "diamond_shape": "Oval",
            "stone_weight_ct": None,
            "stone_count": None,
            "stone_type": None,
            "dimensions_mm": "14x10x7",
            "length_mm": 14.0,
            "width_mm": 10.0,
            "height_mm": 7.0,
        },
        "status": "Completed",
        "source": "AI",
        "confidence_score": 0.98,
        "review_required": False,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "raw_text": None,
    },
    {
        "_id": ObjectId(),
        "image_url": "http://localhost:8000/uploads/demo5.jpg",
        "image_filename": "demo5.jpg",
        "extracted_data": {
            "ring_size": "5",
            "gold_weight_14kt_gm": 1.5,
            "gold_weight_18kt_gm": None,
            "gold_weight_22kt_gm": None,
            "silver_weight_gm": None,
            "platinum_weight_gm": None,
            "diamond_weight_ct": 0.1,
            "diamond_count": 8,
            "diamond_shape": "Round",
            "stone_weight_ct": None,
            "stone_count": None,
            "stone_type": None,
            "dimensions_mm": "10x6x4",
            "length_mm": 10.0,
            "width_mm": 6.0,
            "height_mm": 4.0,
        },
        "status": "Completed",
        "source": "AI",
        "confidence_score": 0.90,
        "review_required": False,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "raw_text": None,
    },
]


async def main():
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.MONGODB_DB]
    coll = db["jewelry"]
    await coll.delete_many({})
    await coll.insert_many(DUMMY_ITEMS)
    print(f"Inserted {len(DUMMY_ITEMS)} dummy jewelry items.")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
