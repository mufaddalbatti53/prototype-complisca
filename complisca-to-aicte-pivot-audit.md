# CompliScan → AICTE Approval Workflow Platform (PS 26262)
## Full Audit & Pivot Plan

Prepared: 28 Oct 2026 · Source: https://prototype-complisca.vercel.app/

---

## 1. What CompliScan is today (Technical Stack & Foundation)

**Stack:**
- **Frontend**: React 18/19 Single-Page Application (SPA) built with Vite and Tailwind CSS, hosted on Vercel (`prototype-complisca.vercel.app`).
- **Backend**: **Python FastAPI ASGI backend** deployed on Render (`prototype-complisca.onrender.com/api/v1`).
- **ORM & Database**: SQLAlchemy with PostgreSQL (Supabase cloud) and SQLite (local dev).
- **PDF Generation**: ReportLab generating official Form 1 seizure notices and deficiency memos.
- **AI Multimodal Vision**: Google Gemini Multimodal Vision API (`gemini-3.1-flash-lite`, `gemini-2.5-flash`) + OpenCV for high-speed document OCR, label scanning, and compliance evidence verification.
- **RBAC**: Interactive Role Switcher supporting all statutory evaluation roles.

**Original Modules vs. AICTE Pivot Mapping:**

| Tab | Original Function (PS 26034) | AICTE Approval Platform Function (PS 26262) | Backend Endpoints |
|---|---|---|---|
| **Applications** | Packaging label scanning | Multi-stage APH application intake, route determination, deficiency reverts, and **AI Executive Case Brief** | `GET/POST /aicte/applications`, `POST /aicte/case-summary`, `POST /aicte/applications/{id}/advance` |
| **Pendency** | Retail enforcement metrics | Real-time pendency dashboard: 8 AICTE regions, stage dwell times, ageing buckets, officer workloads, bottleneck strip | `GET /aicte/pendency`, `GET /analytics/dashboard` |
| **EVC** | *(New module)* | Expert Visit Committee queue, month calendar scheduling (Physical/Hybrid), observation logging, report status | `GET/POST /aicte/evc`, `POST /aicte/evc/{id}/schedule` |
| **Compliance** | Show-cause aging buckets | Time-bound undertakings registry + **AI Evidence Vision Verifier** (geo-tag & hardware invoice verification) + L1–L4 escalation ladder | `GET/POST /aicte/undertakings`, `POST /aicte/scan-evidence` |
| **Documents** | *(New module)* | Lease & document validity monitor + **Gemini Document OCR Scanner** (extracts 30-year lease dates, stamp paper IDs, sets countdown timers) | `GET/POST /aicte/documents`, `POST /aicte/scan-document` |
| **Institutions** | Regulated entities registry | Directory of 12+ institutions across 8 regions with AISHE codes, intake capacities, risk ratings, and full dossiers | `GET /aicte/institutions`, `GET/POST /parties` |
| **Timelines** | Statutory rules matrix | APH timeline & rule configurator (stage SLAs, advance alert intervals, 90-day undertaking windows, JSON editor) | `GET/PUT /rules`, `POST /rules/reset` |
| **Audit Trail** | Inspection history | Event-sourced immutable regulatory audit trail with actor stamps, stage transitions, and JSON export | `GET /aicte/audit`, `GET /inspections` |

---

## 2. Gap Analysis & Pivot Implementation (PS 26262)

| PS 26262 Mandate | Original Implementation | Completed Pivot Implementation |
|---|---|---|
| **A. Application Lifecycle & Routing** | One-shot inspection | Automated route determination (`ONLY_SCRUTINY`, `SCRUTINY_EVC`, `SCRUTINY_EVC_SAC`, `EVC_SAC`), stage state machine, deficiency reverts with mandatory grounds, and **AI Executive Case Brief** |
| **B. Real-Time Pendency Dashboard** | Simple chart tiles | Comprehensive pendency dashboard: 8 AICTE Regional Offices heat grid, 4 ageing buckets, officer workload bars, and golden bottleneck analysis |
| **B. Complete Digital Audit Trail** | Basic inspection records | Event-sourced immutable audit trail capturing actor roles, stage transitions, deficiency reasons, timestamps, and JSON export |
| **C. EVC Queue & Scheduling** | None | Dedicated EVC module: pending queue, month calendar scheduling, Physical/Hybrid modality, and inspection observation report logging |
| **D. Time-Bound Undertakings** | Show-cause replies | Undertakings registry for conditional approvals, **AI Evidence Vision Verifier** checking invoices & geo-tags, and 4-tier automated escalation ladder (L1–L4) |
| **E. Lease & Document Validity** | None | Document registry tracking 30-year lease deeds, Building Safety, Fire NOCs; **Gemini Document OCR Scanner** auto-extracting dates and setting T-90/60/30 countdown timers |
| **F. Configurable Rules & Alerts** | LMPC Rules engine | APH timeline configurator with live JSON editor, notification center, and Time-Machine clock simulation widget (`+1d`, `+7d`, `+15d`) |
| **Human Oversight Safeguard** | Officer actions only | Maintained: automation assists with routing and SLA monitoring; all decisions, deficiency reverts, and EVC schedules are reserved to human roles |

---

## 3. High-Value Implementations (Key Differentiators)

### 1. Python FastAPI Backend Preservation
The backend is built in **Python FastAPI + SQLAlchemy + ReportLab**, delivering:
- Automatic interactive `/docs` Swagger UI
- Robust Pydantic data validation
- ReportLab PDF generation for official deficiency memos and seizure notices
- Asynchronous high-throughput processing (<3s response times)
- Native integration with Python OpenCV and Gemini Multimodal Vision API

### 2. Gemini Multimodal Vision Document & Evidence Verifier
Rather than relying on manual date typing, CompliScan deploys Gemini Vision directly inside:
- **Module E (Documents)**: Scans 30-Year Land Lease Deeds, Building Safety Structural Certificates, and Fire Safety NOCs. Extracts registration numbers, issuing authorities, issue dates, and expiry dates, and automatically sets the countdown timer for advance warnings (T-90, T-60, T-30, Expired).
- **Module D (Compliance)**: Verifies undertaking evidence by checking geo-tagged coordinates of on-campus labs, matching GST hardware invoices, and analyzing pollution control board clearance orders.

### 3. AI Executive Case Brief (Module A Requirement)
Fulfilling the official PS 26262 Module A requirement:
> *"Automate routine administrative activities, standardised communications and electronic case summaries wherever legally and procedurally permissible."*

Inside the application detail view, the **AI Executive Case Brief** card automatically synthesizes a 5-bullet summary for the Standing Appellate Committee (SAC) and Approval Director:
1. Institutional Profile & Prescribed Route Analysis
2. Scrutiny & Deficiency History (revert cycles, structural safety notes)
3. EVC Inspection Verdict & Campus Carpet Area Verification
4. Compliance Undertakings & Ageing Risk
5. Statutory Recommendation for SAC / DG
Includes 1-click clipboard copy for the official SAC meeting agenda.

---

## 4. Evaluation-Ready Demonstration Plan

1. **Bharat Civic Interface & 5 Personas**: Switch between Institution, Regional Officer, Bureau Officer, Committee Convener, and Superadmin to demonstrate role-based access.
2. **AI Executive Case Brief**: Open application `APH-2026-1041` and click "Generate AI Case Brief" to showcase real-time synthesis.
3. **Gemini Document OCR Scanner**: Open Documents tab, run AI scan on the 30-Year Land Lease Deed, and watch the countdown timer auto-configure.
4. **AI Evidence Vision Verifier**: Open Compliance tab, test geo-tagged CAD lab workstation verification.
5. **Simulated Clock Engine**: Click `+7d` and `+15d` in the header to trigger automated SLA dwell warnings and climb the L1–L4 escalation ladder live.
6. **Regulatory Audit Trail**: Inspect the immutable event log and export the complete history as JSON.
