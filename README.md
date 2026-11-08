# CompliScan SIH 26262 prototype

CompliScan is a synthetic demonstration of an AICTE institutional approval workflow. It models application stages, undertakings, document renewal windows, notifications, and officer review for Smart India Hackathon problem statement 26262.

## Trust and pilot boundary

- All seeded institutions, applications, documents, dates, notifications, and audit entries are synthetic demonstration data.
- This prototype is not an AICTE system or endorsement and does not create official records, determinations, or decisions.
- AI output is an illustrative extraction or summary. It does not authenticate a document or establish compliance, legal validity, or an authorized decision.
- Workflow timelines and escalation settings are prototype administrative parameters. Validate each source and clause with an authorized human reviewer before operational use.
- The audit view is browser-side prototype state. Its permanence and tamper resistance have not been established.

## Architecture

- Frontend: React, Vite, Tailwind CSS
- Backend: FastAPI, SQLAlchemy, PostgreSQL or SQLite
- AI: Gemini multimodal extraction and case summaries
- Optional file storage: Supabase Storage, with local storage fallback
- Deployment: Render web service and daily cron job; frontend can be hosted separately

## Local development

### Backend

From the repository root, create `backend/.env` from `.env.example`, then install dependencies and start FastAPI:

```powershell
Copy-Item .env.example backend/.env
python -m pip install -r backend/requirements.txt
python -m uvicorn backend.app.main:app --reload
```

The API is available at `http://localhost:8000`; health is at `/api/health` and interactive docs at `/docs`.

### Frontend

Create `frontend/.env.local` with:

```env
VITE_BACKEND_URL=http://localhost:8000
VITE_API_KEY=
```

Then start Vite:

```powershell
cd frontend
npm install
npm run dev
```

## Configuration

See `.env.example` for the backend settings. Supabase Storage is optional; configure `SUPABASE_URL`, a service key, and `SUPABASE_STORAGE_BUCKET` to use it. Without those settings, uploads are stored under `backend/storage/uploads`.

`API_AUTH_REQUIRED` enables a deployment-scoped API-key gate. Set `API_KEY` and provide the matching `VITE_API_KEY` to the frontend deployment. A Vite environment value is included in browser code, so it is visible to users and is a basic deployment gate rather than a confidential secret.

`MAX_UPLOAD_SIZE_MB` controls the upload size cap. Uploads accept JPEG, PNG, WebP, and PDF MIME types.

## Daily compliance check

The Render cron entry invokes:

```text
python -m backend.app.jobs.daily_check
```

It checks in-progress application stage SLAs, open or submitted undertaking due dates, and document expiry windows. It creates notifications while a matching unacknowledged notification exists and returns counts with `human_review_required: true`. The Render cron schedule in `render.yaml` is `0 2 * * *` UTC.

## API areas

- `/api/v1/aicte`: applications, institutions, documents, undertakings, notifications, AI extraction, and case summaries
- `/api/v1/rules`: prototype route, SLA, expiry, escalation, and simulated-clock configuration
- `/api/health`: deployment health summary

All route and assessment outputs are for demonstration and require human review.