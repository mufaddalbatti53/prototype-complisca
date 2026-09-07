# CompliScan — Legal Metrology (Packaged Commodities) Compliance System

> **Tech Setu — Smart India Hackathon 2026**  
> An automated compliance verification and inspection notice generation system built strictly under the **Legal Metrology Act, 2009** and the **Legal Metrology (Packaged Commodities) Rules, 2011** (LMPC Rules, 2011).

---

## 🏛️ System Overview

Packaged commodities sold through retail stores, supermarkets, and e-commerce across India must bear mandatory declarations in a prescribed manner. Manual inspection is slow and resource-intensive. **CompliScan** automates this entire lifecycle:
1. **Capture**: React + Vite PWA (Live Camera with PDP alignment guide, High-Res Upload, or E-Commerce Product URL).
2. **API Gateway**: Python + FastAPI with JWT and Inspector RBAC.
3. **Pre-Process**: OpenCV pipeline (Auto-deskewing, perspective warp, CLAHE contrast enhancement, glare suppression).
4. **OCR Engine**: Character bounding box extraction, normalized polygon analysis, and physical font height computation in millimeters ($mm$).
5. **Rule + LLM Engine**: Dual verification combining Google Gemini Flash AI with a deterministic Legal Metrology 2011 Rule Engine (Rules 6, 7, 8, 9, 18).
6. **Statutory Report & Dashboard**: Official Government Form 1 Notice of Non-Compliance PDF generation and National Enforcement Analytics Dashboard.

---

## ⚡ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Lucide Icons, Canvas Overlay Viewer.
- **Backend**: Python 3.13, FastAPI, Uvicorn, Pydantic v2, OpenCV, ReportLab.
- **AI Brain**: Google Gemini Flash API (`gemini-flash-lite-latest`, `gemini-flash-latest`, etc.).
- **Database**: Dual-mode SQLite / PostgreSQL with Supabase client compatibility.

---

## 🚀 Quick Start

### 1. Backend Setup
```bash
# In project root:
pip install -r backend/requirements.txt

# Start FastAPI backend (Port 8000):
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Documentation: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/api/health`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```
- Open in Browser: `http://localhost:5173/`

### 3. Run Automated Tests
```bash
# In project root:
python -m pytest backend/tests
```

---

## ⚖️ Statutory Coverage (LMPC Rules 2011)

- **Rule 6(1)(a)**: Name & Complete Address of Manufacturer / Packer / Importer (validates PIN code, city, street).
- **Rule 6(1)(b)**: Generic or Common Name of Commodity (prohibits trademark-only declarations).
- **Rule 6(1)(c)**: Net Quantity in Standard Metric Units (Seventh Schedule SI symbols: `g`, `kg`, `ml`, `l`; flags `gms`, `kgs`, `ltr`, `approx`).
- **Rule 6(1)(d)**: Month and Year of Manufacture / Packing / Import.
- **Rule 6(1)(e)**: Maximum Retail Price (MRP) & Mandatory `(inclusive of all taxes)` clause; flags illegal `+ taxes extra` and validates Unit Sale Price (USP).
- **Rule 6(1)(f)**: Consumer Care Details (4 mandatory parts: Contact Person, Address, Helpline/Phone, Email).
- **Rule 6(1)(g)**: Country of Origin.
- **Rule 7 & 8**: Principal Display Panel (PDP) surface area calculation & minimum statutory font height table.
- **Rule 9 & 18**: Legibility, dual MRP, and over-stickering detection.
