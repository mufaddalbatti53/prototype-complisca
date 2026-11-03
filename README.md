# CompliScan

CompliScan is an AI-assisted regulatory compliance platform for institutional approval workflows. It helps institutions, reviewers, and officials track applications, route files through the correct process, review evidence, and surface escalations before deadlines are missed.

Built for the SIH 2026 problem statement and aligned to the approved workflow architecture:
- Frontend: React + Vite + Tailwind CSS
- Backend: Python + FastAPI
- API layer: REST APIs + daily checker
- Workflow AI: rule engine (file router), Gemini AI + OCR
- Database: Supabase (Postgres, role-based login, file storage)
- Hosting: Vercel (web), Render (API)

## Tech stack

### Frontend
- React 19
- Vite
- Tailwind CSS
- Role-based UI for different user personas
- Live workflow panels and dashboard modules

### Backend
- Python 3.10+
- FastAPI
- REST API endpoints for workflow, documents, analytics, and admin configuration
- Daily checker / scheduled compliance sweep
- File upload and processing pipeline

### AI and workflow engine
- Rule engine / router for app classification and workflow progression
- Gemini AI integration for case summaries and document analysis
- OCR for uploaded files and documents
- File-based workflow orchestration

### Data layer
- Supabase PostgreSQL
- Row-level or role-based access patterns
- File storage for uploads and processed artifacts

### Deployment
- Vercel for web frontend
- Render for FastAPI backend

## Architecture overview

```text
Frontend (React + Vite + Tailwind)
        |
        v
FastAPI backend
        |
        +--> Rule engine / file router
        +--> Gemini AI + OCR
        +--> REST API endpoints
        +--> Daily compliance checker
        |
        v
Supabase Postgres
        |
        +--> role login / user management
        +--> file storage
        +--> application records and workflow state
```

## Key product capabilities

- Institution/application intake and tracking
- Workflow routing based on submission type
- SLA and escalation monitoring
- Daily checker for pending tasks and compliance deadlines
- AI-generated summaries and recommendations
- OCR-powered document extraction and validation
- Role-based access for institutional and review users
- File storage integration with Supabase

## Repository structure

```text
prototype-complisca/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   └── services/
│   ├── storage/
│   ├── tests/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── .env.example
├── README.md
└── requirements.txt
```

## Local environment setup

### 1. Clone the repository

```bash
git clone https://github.com/mufaddalbatti53/prototype-complisca.git
cd prototype-complisca
```

### 2. Backend setup

```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r backend/requirements.txt
cp .env.example .env
```

Then configure your local environment values in `.env`.

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

### 4. Run backend

```bash
cd ..
uvicorn backend.app.main:app --reload --port 8000
```

The API docs will be available at:
- http://localhost:8000/docs
- Frontend: http://localhost:5173

## Environment variables

Example values are provided in `.env.example`:

```env
PROJECT_NAME=C.O.M.P.L.I.S.C.A.N.
VERSION=1.0.0
API_V1_STR=/api/v1

GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

DATABASE_URL=postgresql://postgres:postgres@db.<project-ref>.supabase.co:5432/postgres
# DATABASE_URL=sqlite:///./backend/storage/compliscan.db

SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_KEY=your_supabase_service_role_key
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_PROJECT_ID=<project-ref>

FRONTEND_URL=https://prototype-complisca.vercel.app
BACKEND_URL=https://prototype-complisca.onrender.com
```

## Deployment notes

- Web app: Vercel
- API service: Render
- Database and storage: Supabase Postgres + Supabase Storage
- Authentication and role-based logic: Supabase auth + project policies

## Notes

This project is intentionally structured around the SIH 26262 AICTE compliance and institutional approval workflow theme, with Gemini AI, OCR, routing logic, and a scheduled daily checker layered on top of a Supabase-powered backend.

## License

This project is currently maintained for hackathon and internal evaluation use.
