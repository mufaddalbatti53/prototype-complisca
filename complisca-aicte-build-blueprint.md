# CompliScan × AICTE — Complete Build Blueprint
## PS 26262: Integrated AICTE Approval Workflow Automation, Compliance Monitoring & Alert Management System
Team TECH SETU AI · Prepared 28 Oct 2026 · Companion to `complisca-to-aicte-pivot-audit.md`

---

## 1. BRANDING & SLIDE-1 POSITIONING

**Platform name:** CompliScan · **Team:** TECH SETU AI

**Acronym (slide 1, official expansion):**
> **C.O.M.P.L.I.S.C.A.N.** — **C**entralized **O**versight & **M**onitoring **P**latform for **L**egal **I**nstitutional **S**crutiny, **C**ompliance, **A**pprovals & **A**lert **N**etwork

**Subtitle under the logo:** "Integrated Approval Workflow & Compliance Monitoring System · AICTE Regulation Bureau"  
**Footer line:** "Smart Automation for the Approval Process Handbook · Smart India Hackathon 2026 · Team TECH SETU AI"  
**One-liner for slide 1:** "One platform that routes every AICTE approval application through its prescribed stages, watches every deadline, and escalates every miss — automatically."

Logo: Distinctive check-in-speech-bubble civic seal with AICTE Bharat Civic palette.

---

## 2. DESIGN SYSTEM (AICTE civic direction)

Direction: **"Bharat Civic"** — institutional navy + gazette gold on paper-white. Serious, government-grade, zero startup-gradient cliché. Defined in `frontend/src/index.css` via modern OKLCH tokens.

### Palette
| Token | oklch | Use |
|---|---|---|
| `--background` | `oklch(0.985 0.005 90)` | warm paper white |
| `--foreground` | `oklch(0.22 0.04 260)` | ink navy text |
| `--primary` | `oklch(0.35 0.09 255)` | deep civic navy (headers, primary buttons, table headers) |
| `--primary-foreground` | `oklch(0.98 0.005 90)` | paper on navy |
| `--accent` | `oklch(0.78 0.13 80)` | gazette gold (badges, active tab underline, highlights) |
| `--accent-foreground` | `oklch(0.3 0.06 80)` | dark gold text |
| `--success` | `oklch(0.6 0.13 155)` | compliant / verified |
| `--warning` | `oklch(0.75 0.14 75)` | due-soon / open undertaking |
| `--destructive` | `oklch(0.58 0.2 25)` | overdue / expired / escalated |
| `--muted` / `--muted-foreground` | `oklch(0.96 0.005 90)` / `oklch(0.52 0.03 260)` | secondary text, zebra rows |
| `--card`, `--border` | white / `oklch(0.9 0.01 90)` | cards, hairline table borders |

### Typography
- **Headings & Display**: Libre Baskerville (authoritative legislative serif)
- **UI & Data**: Public Sans (civic authority sans-serif)
- **Reference Numbers & JSON**: IBM Plex Mono

---

## 3. INFORMATION ARCHITECTURE & ROLES

### Role Switcher (5 Statutory Personas)
| Role | Persona Shown | Portal Focus |
|---|---|---|
| **Institution** | Registrar, Sunrise Institute of Technology | Apply, submit rectified documents, upload undertaking evidence, renew statutory NOCs |
| **Regional Officer (RO)** | RO–West, OFFICER-W-2026-041 | Scrutiny queue, deficiency memos, verify renewals, review EVC recommendations |
| **Bureau Officer** | Director (AICTE Approval Bureau) | SAC review, pendency oversight, handle L3 escalations, record final approval decisions |
| **Committee (EVC/SAC)** | Convener, Expert Visit Committee | Visit queue, roster scheduling (Physical/Hybrid), upload EVC reports & observations |
| **Superadmin** | Director General / Member Secretary | Complete oversight, APH timeline configurator, L4 critical escalations, full audit log |

### Navigation (8 Comprehensive Modules)
| Tab | Identifier | Statutory Purpose |
|---|---|---|
| **Applications** | `#applications` | Application intake + route determination + stage state machine + revert-for-deficiency + **AI Executive Case Brief** |
| **Pendency** | `#pendency` | Consolidated real-time dashboard (8 regions, stage dwell times, ageing buckets, workload bars, bottleneck strip) |
| **EVC** | `#evc` | EVC queue, month calendar scheduling, hybrid/physical modality, inspection observation logging |
| **Compliance** | `#compliance` | Time-bound undertakings registry + **AI Multimodal Evidence Verifier** + 4-tier automated escalation ladder |
| **Documents** | `#documents` | Lease & document validity monitor + **Gemini Multimodal Document OCR Scanner** + advance expiry alerts |
| **Institutions** | `#institutions` | Centralized registry of 12+ institutions across 8 regions with AISHE codes, intake capacities, risk ratings |
| **Timelines** | `#timelines` | APH timeline & rule configurator (interactive JSON editor, reset defaults) |
| **Audit Trail** | `#audit` | Event-sourced immutable regulatory audit log + per-application history + JSON export |

---

## 4. CORE FLOWS (PS 26262 Specification)

### 4.1 Application Lifecycle & AI Case Brief (Module A)
- **Auto Route Determination**: On submission, the engine automatically selects the statutory route from application type and institutional category:
  - `ONLY_SCRUTINY` (Extension of Approval - EoA)
  - `SCRUTINY_EVC` (New Course / Intake Capacity Expansion)
  - `SCRUTINY_EVC_SAC` (Establishment of New Technical Institution)
  - `EVC_SAC` (Closure or Institutional Merger)
  - `ONLY_EVC` (Special Inspection Route)
- **Stage Progression State Machine**:
  `SUBMITTED` → `SCRUTINY` → `EVC_QUEUE` → `EVC_SCHEDULED` → `EVC_DONE` → `SAC_REVIEW` → `DECISION` → `CLOSED`
- **Deficiency Revert & Resubmission**: RO clicks *Return for Deficiency* → mandatory statutory reason dropdown + detailed observation note → status `REVERTED`, SLA clock pauses, institutional alert dispatched. On resubmission, docket re-enters Scrutiny with incremented cycle counter.
- **AI Executive Case Brief (Module A Requirement)**: Inside the Docket Inspector Drawer, a 1-click **AI Executive Case Brief** synthesizes:
  1. Institutional Profile & Route Analysis
  2. Scrutiny & Deficiency History
  3. EVC Inspection Verdict & Carpet Area Audit
  4. Active Undertakings & Ageing Risk
  5. Statutory Recommendation for SAC / DG
  Includes confidence score and 1-click copy for the SAC agenda.

### 4.2 Real-Time Pendency Dashboard (Module B)
- 6 KPI metric tiles: Total Dockets, In Scrutiny, Pending EVC, Awaiting SAC, SLA Breached, Avg Dwell Time.
- **Golden Bottleneck Strip**: Highlights the stage with the highest dwell time and recommends statutory mitigation.
- **4 Ageing Buckets**: Stage 1 (0–15d), Stage 2 (16–30d), Stage 3 (31–60d), Stage 4 (60+d).
- **8 AICTE Regional Offices Heat Grid**: Live matrix displaying application counts across all 8 regional offices with breach highlights.
- **Workload Distribution**: Visual progress bars per officer (assigned vs completed vs breached).

### 4.3 EVC Operations & Committee Scheduling (Module C)
- **EVC Queue**: Tracks pending visits with urgency windows (21 days for New Institutions, 30 days for others).
- **Scheduling Roster**: Convener, committee members, scheduled date, and Physical/Hybrid modality selector.
- **Month Calendar View**: Displays scheduled inspections as distinct gold chips across dates.
- **Completion & Report Upload**: Uploads expert committee findings, carpet area checks, and statutory recommendations.

### 4.4 Time-Bound Undertakings & AI Evidence Vision (Module D)
- Enforces conditions imposed on *Conditional Approvals* (e.g. Ph.D. faculty recruitment, BIM/CAD lab workstations, STP plant consent).
- **AI Evidence Vision Verifier (Killer Feature)**: Instead of a dumb file upload, Gemini Multimodal Vision verifies:
  - Geo-tagged coordinates against campus latitude/longitude
  - GST hardware tax invoices and OEM serial numbers
  - Pollution board Consent to Operate (CTO) validities
  - Issues objective AI officer recommendations (`VERIFY_COMPLIANT`)
- **4-Tier Automated Escalation Ladder**:
  - `L1 (T-7 Days)`: Automated reminder to Institution Registrar
  - `L2 (Day 0 Due)`: Compliance flag on Regional Officer dashboard
  - `L3 (Day +7 Overdue)`: Formal Show-Cause notice to Approval Bureau Director
  - `L4 (Day +15 Critical)`: Agenda docket dispatched to Member Secretary for approval withdrawal

### 4.5 Lease & Document Validity Monitor (Module E)
- Monitors essential institutional legal documents: **30-Year Registered Land Lease Deeds**, **PWD Building Safety Certificates**, **Fire Safety NOCs**, and **Trust Deeds**.
- **Gemini Document OCR Scanner (Killer Feature)**:
  - AI Multimodal Vision reads scanned legal deeds and NOCs
  - Auto-extracts registration numbers, issuing authorities, issue dates, and expiry dates
  - Verifies unencumbered land possession clauses and legibility
  - **Auto-populates the countdown expiry timer** and sets advance alert thresholds (**T-90**, **T-60**, **T-30**, **Expired**)
- Prevents procedural advancement of approval applications when essential certificates are expired.

### 4.6 Statutory APH Timelines & Escalation Configurator (Module F)
- Interactive JSON configuration editor in the `#timelines` tab.
- Modifies stage SLAs, document advance alert days, undertaking durations, and escalation thresholds in real time.
- "Save Configuration" updates system context and logs an immutable audit event; "Reset Statutory Defaults" restores base APH norms.

### 4.7 Regulatory Audit Trail (Module F / Audit)
- Immutable, time-stamped log of every regulatory action, deficiency return, stage transition, and SLA breach.
- Multi-criteria filtering by Actor Role, Action Code, Reference Entity, and Date.
- 1-Click JSON export of complete audit history for ministry oversight.

---

## 5. DATA MODEL & BACKEND ARCHITECTURE

```
institutions      id, name, aishe_code, region, state, district, institution_type,
                  status (ACTIVE/UNDER_REVIEW/SUSPENDED), compliance_score, risk_flag,
                  intake_capacity, established_year, created_at

applications      id, ref_no (APH-2026-XXXX), institution_id, app_type (NEW_INSTITUTION/
                  EXTENSION_OF_APPROVAL/NEW_COURSE_OR_INTAKE/CLOSURE_OR_MERGER),
                  route (ONLY_SCRUTINY/SCRUTINY_EVC/SCRUTINY_EVC_SAC/EVC_SAC/ONLY_EVC),
                  current_stage, status, assigned_officer, course_details,
                  deficiency_reason, deficiency_note, resubmission_count, decision,
                  days_in_stage, is_breached, created_at, stage_entered_at, closed_at

stage_events      id, application_id, actor_role, actor_name, action (STAGE_AUTO_ADVANCED/
                  REVERTED_FOR_DEFICIENCY/DEFICIENCY_RESUBMITTED/EVC_DATE_CONFIRMED/DECISION...),
                  from_stage, to_stage, reason, note, attachment_url, created_at

evc_visits        id (EVC-XXXX), application_id, ref_no, institution_name, region,
                  status (QUEUED/SCHEDULED/COMPLETED/CANCELLED), urgency_window_days,
                  scheduled_date, convener, members (JSON), mode (PHYSICAL/HYBRID),
                  observations, report_url, completed_at, created_at

undertakings      id (UT-2026-XXX), application_id, ref_no, institution_name,
                  condition_text, evidence_required, imposed_at, due_date,
                  status (OPEN/SUBMITTED/VERIFIED/REJECTED/OVERDUE/ESCALATED),
                  escalation_level (1..4), evidence_url, evidence_note,
                  verified_at, verified_by, created_at

documents         id (DOC-XXX), institution_id, institution_name, doc_type,
                  issuing_authority, issued_on, expiry_date, renewal_lead_days,
                  status (ACTIVE/EXPIRING_SOON/EXPIRED/RENEWAL_SUBMITTED/RENEWED),
                  file_url, renewal_file_url, renewal_note, verified_at, verified_by

notifications     id (NOTIF-XXX), type (REMINDER/OVERDUE/ESCALATION/DOC_EXPIRY/EVC_DUE),
                  severity (info/warning/critical), audience_role, ref_type, ref_id,
                  message, acknowledged, created_at

config            JSON schema with stage_sla_days, routes, doc_expiry_alerts_days,
                  undertaking_due_days, escalation_ladder, protected flag
```

### Backend Implementation Details:
- **Framework**: **Python FastAPI** on Render (`prototype-complisca.onrender.com`).
- **ORM & DB**: **SQLAlchemy** with SQLite (local development) and PostgreSQL / Supabase (production cloud).
- **PDF Generation**: **ReportLab** generating official Form 1 deficiency notices, seizure memos, and case briefs.
- **AI Multimodal Vision**: **Google Gemini Vision API** (`gemini-3.1-flash-lite`, `gemini-2.5-flash`) for statutory document OCR and evidence verification.
- **REST Endpoints**:
  - `/api/v1/aicte/scan-document`: AI Multimodal Vision extraction for legal deeds and NOCs
  - `/api/v1/aicte/scan-evidence`: AI Vision verification for compliance undertaking proof
  - `/api/v1/aicte/case-summary`: AI Executive Case Brief generator (5-bullet summary)
  - `/api/health`: Comprehensive system health and database connectivity
  - `/docs`: Interactive Swagger API documentation

---

## 6. DEMO SEED DATA

- **12+ Regulated Institutions**: Distributed across all 8 Regional Offices (Western, Northern, Southern, South-Western, South-Central, Eastern, Central, North-Western) with realistic AISHE codes, intake capacities, and compliance scores.
- **8 Pre-Populated Applications**: Covering all statutory routes and stages, including reverted applications with deficiency notes, EVC queue, SAC review, and overdue SLA cases.
- **3 EVC Inspection Visits**: Queued, scheduled with convener and committee, and completed with uploaded observations.
- **3 Compliance Undertakings**: Including active 90-day window, verified case, and an L3 overdue escalated case.
- **5 Statutory Documents**: Including 30-year registered lease deed, expired PWD building safety certificate, and urgent Fire NOC.
- **Pre-Populated Audit Log & Notifications**: Reflecting all severity tiers and actor roles.
- **1-Click Live Demo Application**: Embedded in header, automates a live docket through Intake → Scrutiny → Auto-Advance → EVC Queue.

---

## 7. EVALUATION CRITERIA → FEATURE MAPPING

| Evaluator Criterion (PS 26262) | CompliScan Implemented Feature |
|---|---|
| **Workflow Accuracy** | Automated route determination (`ONLY_SCRUTINY`, `SCRUTINY_EVC`, etc.) and APH stage state machine |
| **Timeliness of Alerts** | Notification center + T-90/60/30 document alerts + Time-Machine simulated clock (`+1d`, `+7d`, `+15d`) |
| **Deadline Tracking Reliability** | Stage SLA dwell timers + Automated breach sweeper + 4-tier escalation ladder (L1–L4) |
| **Visibility of Pending Cases** | Pendency Dashboard with Golden Bottleneck strip, 4 ageing buckets, and 8-region heat grid |
| **Reduction in Manual Follow-Up** | 1-Click AI Executive Case Brief + Auto-advance + 1-Click live demo application |
| **Intelligent Document Scanning** | Gemini Multimodal Document Vision auto-extracting deed dates, stamp paper IDs, and setting expiry timers |
| **Audit Trail Completeness** | Event-sourced immutable audit log with full actor stamps + 1-click JSON export |
| **Regulatory Safeguards** | Automation assists with routing and alerts; decisions, reverts, and EVC schedules reserved to human officers |
