# KaratPlus AI — Demo Jewelry CAD Processing Platform

A local-first demo platform for jewelry manufacturers: upload specification sheet images, extract technical data (weights, stone counts, dimensions) via **Google Gemini (free)** or **Tesseract OCR + regex** fallback, and manage records in a luxury-style dashboard.

## Constraints (Non-Negotiable)

- **FREE ONLY**: No paid APIs. Uses Google Gemini Free Tier or local OCR fallback.
- **Offline stability**: If the AI API fails (no internet or quota), the system automatically switches to Tesseract OCR + regex.
- **Zero crash**: Extraction failures never surface as frontend errors; records get "Review Required" with partial data.

## Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide React
- **Backend**: FastAPI, Motor (MongoDB), Pydantic, Pytesseract, OpenCV, Google Generative AI

## Quick Start

### 1. Backend (FastAPI)

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
# source venv/bin/activate

pip install -r requirements.txt
```

**Environment**

```bash
cp .env.example .env
# Edit .env: set MONGODB_URI and optionally GEMINI_API_KEY (free at https://makersuite.google.com/app/apikey)
```

**Tesseract OCR (for fallback)**

- **Windows**: Install from [UB-Mannheim/tesseract](https://github.com/UB-Mannheim/tesseract/wiki). Add Tesseract to PATH (e.g. `C:\Program Files\Tesseract-OCR`).
- **Mac**: `brew install tesseract`

**MongoDB**

- Install [MongoDB Community Edition](https://www.mongodb.com/try/download/community) or use MongoDB Atlas and set `MONGODB_URI` in `.env`.

**Run backend**

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Seed demo data (optional)**

```bash
python -m seed
# or: python seed.py  (from backend directory)
```

### 2. Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). API base URL is `http://localhost:8000` (set in frontend env if needed).

## Project Structure

```
backend/
  app/
    main.py          # FastAPI app, CORS, static /uploads
    config.py        # Settings from .env
    db.py            # Motor MongoDB connection
    models/          # Pydantic schemas (JewelryData, JewelryRecord, etc.)
    routers/         # API routes (upload, list, stats, get, update)
    services/
      ai_service.py  # Gemini API (try/except, returns None on failure)
      ocr_service.py # Pytesseract + OpenCV + regex
      processor.py   # AI → OCR fallback orchestration
  uploads/           # Uploaded images (created automatically)
  requirements.txt
  .env.example
  seed.py

frontend/
  app/               # Next.js App Router pages
  components/        # Sidebar, Table, Upload, etc.
  lib/               # API hooks and utils
```

## API Summary

- `POST /api/jewelry/upload` — Upload image (multipart); returns record (Completed or Review Required).
- `GET /api/jewelry` — List records (optional `?search=` and `?status=`).
- `GET /api/jewelry/stats` — Dashboard metrics (total, pending, completed, review_required).
- `GET /api/jewelry/confidence-trend?limit=10` — Confidence trend for chart.
- `GET /api/jewelry/{id}` — Get one record.
- `PATCH /api/jewelry/{id}` — Update extracted data (body: JewelryData JSON).
- `GET /uploads/{filename}` — Serve uploaded images.

## Extraction Pipeline

1. **Step 1**: Call Gemini with the image; prompt returns strict JSON matching the 16-field schema.
2. **Step 2 (safety net)**: If Gemini fails, preprocess image (grayscale + threshold), run `pytesseract.image_to_string`, then regex for patterns like `14k`, `18k`, `ct`, `gm`, `mm` (e.g. `(\d+\.?\d*)\s*(gm|ct|mm)`). Set `confidence_score = 0.50` and `review_required = true`.

Frontend never shows extraction errors; failed or low-confidence extractions appear as "Review Required" with partial data.

## License

MIT.
"# Jeweley_Project" 
"# jwells" 
