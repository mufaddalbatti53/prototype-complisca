**⚡**** CompliScan – Evaluator-Level Website Review**

I've reviewed the live website entry point and the GitHub repository for your project:

- Live prototype: [https://prototype-complisca.vercel.app/](https://prototype-complisca.vercel.app/?utm_source=chatgpt.com)

- GitHub: [https://github.com/mufaddalbatti53/prototype-complisca](https://github.com/mufaddalbatti53/prototype-complisca?utm_source=chatgpt.com)

My initial verdict: CompliScan already covers a surprisingly large portion of SIH26262. You should not rebuild it from scratch. You need to make it more regulation-aware, technically defensible, reliable and impressive during a live demonstration.

There is an important distinction in this review: the GitHub README describes the intended capabilities, but a feature described in documentation is not automatically a verified, working feature. I will distinguish documented capabilities from improvements that need implementation or testing.

**1. What CompliScan already has**

The repository documents eight major modules, a configurable APH workflow engine, five user personas, an AI document-processing pipeline and a simulated clock for testing deadline escalation. 

mufaddalbatti53/prototype-complisca · GitHub

**Existing product coverage**

Application workflow

90% coverage estimate

Automatic route determination, stage transitions and deficiency returns

Pendency monitoring

90% coverage estimate

Ageing buckets, regional workloads and bottleneck analysis

EVC management

85% coverage estimate

Inspection queues, visit scheduling and reports

Compliance monitoring

90% coverage estimate

Undertakings, evidence submission and verification

Document monitoring

90% coverage estimate

Lease, safety certificate and expiry tracking

AI integration

80% coverage estimate

OCR, case briefs and evidence analysis

Audit and access control

85% coverage estimate

Role isolation, activity records and audit exports

My subjective estimate of documented feature coverage against the problem statement, not measured implementation quality or SIH marks.

**Existing strengths worth preserving**

| **Existing capability** | **My assessment** |
| --- | --- |
| APH workflow engine | Core product differentiator |
| 8 functional modules | Broad PS coverage |
| Time-machine simulator | Excellent live demo opportunity |
| Role-based dashboards | Important enterprise capability |
| AI executive case brief | Directly relevant to the PS |
| OCR document extraction | Useful practical AI application |
| Four-level escalation | Strong automation demonstration |
| Audit trail | Essential for regulatory trust |

Do not waste your development time rebuilding these features.

Instead, focus on what could make CompliScan stand out from other teams implementing the same problem statement.

**2. The biggest weaknesses I would fix**

I found several areas in the repository that deserve attention. Some are more important than adding new features.

**P0 – Critical**

**A. Regulatory accuracy and legal safeguards**

This is the biggest issue.

The README describes:

- Scrutiny SLA of 15 days.

- Re-scrutiny SLA of 10 days.

- EVC timelines of 21 days.

- Lease alerts at 90, 60 and 30 days.

- Four escalation levels.

- Level 4 escalation potentially leading to approval revocation.

- Automatic approval holds when documents expire.

These are documented prototype rules, not automatically verified statutory requirements. 

mufaddalbatti53/prototype-complisca · GitHub

What needs to change:

- Every rule should have an official source reference.

- Each rule should identify the APH edition, clause, effective date and applicability.

- Differentiate statutory deadlines from configurable internal operational targets.

- Never automatically revoke, suspend or block approval based only on an AI prediction or a simulated timer.

- Require an authorised officer to approve consequential regulatory action.

I would introduce a rule classification:

| **Rule category** | **Example** | **Behaviour** |
| --- | --- | --- |
| Statutory | Verified APH requirement | Enforce according to authorised configuration |
| Administrative | Internal processing target | Monitor and alert |
| Institution-specific | An undertaking deadline | Track the actual prescribed due date |
| Advisory | AI-generated risk indication | Recommend human review |

My recommendation

Replace the label "Statutory SLA" with "Applicable Processing Timeline" wherever the rule has not been verified against an authoritative source.

A government compliance platform must never confuse a developer-defined rule with a legal requirement.

**P0 – Critical**

**B. Your AI evidence verifier is overclaiming**

The README says Gemini and OpenCV can verify:

- Land lease conditions.

- Stamp registration information.

- GPS location.

- OEM serial numbers.

- GST invoice matching.

- Equipment authenticity.

Extracting these details is not the same as proving that a document or piece of equipment is genuine.

Change the feature from:

"AI Document Verification"

To:

"AI-Assisted Document Intelligence & Verification Support"

Build this process:

Document intelligence workflow

Institution uploads document

OCR extracts fields and dates

Validation engine checks formats, completeness and inconsistencies

AI flags potential discrepancies with evidence and confidence

Authorised officer reviews and records the verification decision

Add:

- Extracted field versus original document comparison.

- Source page and bounding-box references.

- Confidence scores with uncertainty handling.

- Manual correction facility.

- Duplicate document detection.

- Verification history.

Why this matters: Judges will appreciate AI, but they will trust a system that understands the limitations of AI more than one that claims to authenticate legal documents automatically.

**P0 – Critical**

**C. Improve authentication and audit security**

The repository describes role switching, institution isolation and event-sourced audit logs. 

mufaddalbatti53/prototype-complisca · GitHub

However, a role switcher in a prototype is not proof of production-grade RBAC.

Make sure:

- Permissions are checked on the backend for every sensitive endpoint.

- Institutions cannot change their own institution ID to access another institution's data.

- Regional officers cannot access unauthorised regional records.

- Critical actions require explicit authorisation.

- Audit events cannot be edited or deleted by ordinary administrators.

- File uploads have type, size and malware checks.

- API secrets never reach frontend code.

- Every consequential action records actor, timestamp, previous value, new value and reason.

For the prototype, demonstrate a negative permission test:

Try accessing another institution's application using a modified API request. It must return 403 Forbidden.

That is much more convincing than simply changing a role dropdown.

**3. Features I would add to make CompliScan genuinely different**

These are the additions I would prioritise, in order.

**P1 – Highest differentiation**

**1. APH Rule Traceability Engine**

My strongest recommendation

Currently, CompliScan describes an editable APH configuration. Take this further.

Every workflow transition should explain exactly why it is permitted.

For example:

Application APH-2026-1041

Route determined

Selected workflow: Scrutiny → EVC → SAC/SHC

Why was this route selected?

- Application category: New Institution

- Applicable rule: Configured application-category mapping

- Rule version: APH configuration v1.2

- Source reference: Handbook edition and verified clause

- Effective date: Configured effective date

Decision trace

Application category validated

Workflow rule matched

Authorised transition available

Why it stands out: Judges can see that your platform is not just automatically moving applications. It can explain and trace the regulatory basis for its actions.

**2. Smart Case Handover ****&**** Workload Balancing**

High impact

The README already describes workload bars and regional pendency analytics. Add a proper task-assignment and handover system.

Features:

- Officer-wise pending tasks.

- Current case owner.

- Assignment and reassignment history.

- Leave/unavailability handover.

- Workload distribution suggestions.

- Unassigned application detection.

- Escalation when ownership is missing.

Example:

An application is pending with Officer A, who becomes unavailable.

The system:

- Detects the unavailability.

- Identifies eligible officers.

- Suggests reassignment based on jurisdiction and workload.

- Requests authorised reassignment.

- Records the handover in the audit trail.

Do not automatically transfer statutory responsibility without authorisation.

**3. Predictive Pendency Intelligence**

High impact

Move beyond showing how many applications are overdue.

Introduce a feature called Pendency Intelligence Centre.

Illustrative Pendency Intelligence Dashboard

**12**

Critical pending cases

**18**

At risk of delay

**7**

Unassigned cases

**4**

Bottleneck stages

Example AI-assisted insight

EVC scheduling bottleneck

8 applications have remained in the EVC queue longer than their configured target.

Suggested action: Review committee availability and outstanding scheduling tasks.

Illustrative synthetic dashboard data, not actual AICTE statistics.

Add these capabilities:

- Average stage processing time.

- Median stage processing time.

- Region-wise comparison.

- Officer-wise workload.

- Historical bottleneck patterns.

- Forecast of cases likely to breach configured targets.

Start with rule-based forecasting and historical statistics. Only introduce machine learning when you have sufficient trustworthy historical data.

**4. Deadline Calendar ****&**** Compliance Command Centre**

Currently, the repository describes compliance and document modules separately.

Connect them into one unified calendar.

[Compliance Reminder Software & Compliance Task Management | CSTrax](https://images.openai.com/static-rsc-4/HFNWn8ELNCRkPrAW7xIjlO4nVrDXqOi7PSwmSG0uVkBiV7twUb0ybXpdmDXCZKTluKgbFMC6mLo5wbeAYYXv07EX1SXJoU3rUfMW-lmUkj06nIwGIXi06-Gk5KPFja503cL83-l3B1F4ZZWPTTkcpGutL5d7GTpZVs2_d4KUKb0?purpose=inline)

[Compliance Deadline Tracking | CSTrax Use Cases](https://images.openai.com/static-rsc-4/_oJRWXuA4eGH0qc8VteK1AtZrHSlYRZBHyx5bSomPuRBntJVFm0btqNQDqNw2mPiE6wRoA31EKssUIdaigoNUa_CdlKbSK-i43kLVEH89pZBd_8OguLvpG0lEyPEHEn5fd_QNYAYVCD-26v_wvW0xSL388oyyEgvNEFjKIDiPRg?purpose=inline)

[Configure the Workspace Site [Case Management Studio]](https://images.openai.com/static-rsc-4/FeAhlsgVTJElTp5LsoJKnMgEh2KC0oBR0i54Fb7OM-TuDPaujvrCqzmmJuVwRbGL8Ba2fQv0ou98Wjc2dI3lH2DKV18Sb53N_jUBAcQsUBPNMdvoAZrMFwwPFE8Q6kcuso6m7D2KHXZ_6ZVtFWn4MHAd5PMTDuiGFMSWUZq8aJk?purpose=inline)

9

Include:

- Upcoming undertaking deadlines.

- Lease expiry.

- Fire NOC expiry.

- Building safety certificate expiry.

- EVC scheduling.

- Pending document verification.

- Overdue actions.

Add filters by institution, region, responsible officer and compliance category.

This gives officials one place to see everything that needs attention.

**5. Notification Delivery ****&**** Acknowledgement Tracking**

The README describes automated reminders and notifications. Make the entire delivery lifecycle visible.

| **Notification state** | **Meaning** |
| --- | --- |
| Generated | System created alert |
| Queued | Awaiting delivery |
| Delivered | Provider confirmed delivery |
| Failed | Delivery unsuccessful |
| Acknowledged | Recipient acknowledged |
| Resolved | Underlying action completed |

Also add:

- Retry mechanism.

- In-app notifications.

- Email integration.

- Configurable reminder preferences.

- Notification history.

- Escalation delivery confirmation.

An alert being generated is not the same as an official receiving it.

**6. Integration Gateway for Existing AICTE Systems**

The problem statement specifically mentions integration with existing authorised AICTE systems wherever feasible.

Add an integration architecture rather than merely promising integration.

AICTE Integration Gateway

Existing authorised AICTE systems

Integration Gateway

- API authentication

- Data mapping

- Validation

- Duplicate detection

- Error handling

- Synchronisation logs

CompliScan Core Platform

Demonstrate this with a mock API or sample data import if live AICTE access is unavailable.

Be clear that this is a simulated integration.

**4. What should be changed in the existing eight modules?**

Rather than adding eight more tabs, I would improve the existing structure.

| **Existing module** | **Recommended change** |
| --- | --- |
| Applications | Add regulatory decision trace and complete case timeline |
| Pendency | Add bottleneck forecasting and workload handover |
| EVC | Add committee availability and scheduling conflict detection |
| Compliance | Add evidence comparison and verification workflow |
| Documents | Add OCR confidence, page references and discrepancy review |
| Institutions | Replace unsupported compliance scoring with transparent indicators |
| Timelines | Add APH versioning, clause references and effective dates |
| Audit Trail | Add tamper-evident logs and actor/action verification |

One particularly important change:

The README describes a compliance score with a 40% approvals, 30% documents and 30% undertakings weighting.

Unless AICTE has prescribed and authorised this formula, do not present it as an official compliance score.

Instead, show transparent indicators:

- Approval process status.

- Documents valid / expiring / expired.

- Undertakings fulfilled / pending / overdue.

- Open verification issues.

If you want an internal risk score, label it as an experimental decision-support indicator and explain its calculation.

**5. Features you should NOT add right now**

Your project already has considerable functionality. Adding everything will make the prototype complicated and increase the risk of bugs.

Avoid these distractions:

- Generic chatbot just to claim AI integration.

- Blockchain without a genuine audit requirement.

- Facial recognition for institutional verification.

- Complicated predictive AI without historical data.

- More dashboards that duplicate existing information.

- Autonomous approval or rejection decisions.

- Unverified statutory scoring systems.

Also remove claims such as "0% failure rate" from the AI fallback description. No production AI or OCR system can honestly guarantee zero failure.

**6. My recommended development priority**

Recommended roadmap

| **Priority** | **Improvement** | **Expected value** |
| --- | --- | --- |
| P0 | Regulatory rule traceability | Very high |
| P0 | Human-authorised regulatory decisions | Very high |
| P0 | Backend RBAC and audit security | Very high |
| P1 | Smart case handover | High |
| P1 | Pendency Intelligence Centre | High |
| P1 | Unified compliance calendar | High |
| P1 | OCR confidence and evidence review | High |
| P2 | Notification acknowledgement | Medium–High |
| P2 | Integration gateway | High |
| P2 | Historical analytics and forecasting | Medium |

If you have limited development time, complete P0 first and choose two or three P1 improvements.

**7. The demo that I would present to SIH judges**

I would change the demonstration from a feature-by-feature tour into a real administrative scenario.

**CompliScan 2.0 – The Regulatory Intelligence Demo**

Recommended 5–7 minute demonstration

Scenario: An institution's application and compliance are at risk.

- Start as an institution

Submit an application and upload a lease document.

Show AI extracting its expiry date and identifying a discrepancy for review.

- Switch to Regional Officer

Show automatic application routing, scrutiny and the rule-based decision trace.

- Show the EVC bottleneck

Display pending EVC applications, scheduling availability and workload distribution.

- Switch to Bureau Officer

Show a case that is approaching its configured deadline and recommend an appropriate administrative action.

- Show compliance intelligence

Simulate an upcoming undertaking deadline and a document expiry alert.

- Show human verification

An authorised officer reviews the uploaded evidence, records a decision and provides a reason.

- Finish with the audit trail

Demonstrate the complete history of the application, notifications, escalation and verification.

Final message to judges:

"CompliScan does not merely track applications. It provides an explainable, configurable and accountable regulatory operations platform that connects approval workflows with institutional compliance throughout their lifecycle."

**8. Final comparison: Current CompliScan vs recommended CompliScan**

| **Dimension** | **Current documented design** | **Recommended direction** |
| --- | --- | --- |
| Workflow | APH-based routing | Source-traceable workflow rules |
| AI | OCR and case summaries | Explainable AI with human verification |
| Pendency | Ageing and workload | Predictive bottleneck intelligence |
| EVC | Scheduling and queue | Scheduling optimisation |
| Compliance | Deadline and evidence tracking | Unified compliance intelligence |
| Documents | OCR and expiry | Evidence provenance and discrepancy review |
| Security | Role-based isolation | Backend-enforced permissions and secure audit |
| Notifications | Four-level escalation | End-to-end delivery and acknowledgement |
| Integration | API-oriented architecture | Demonstrable integration gateway |

**9. Three questions before we start changing the code**

I want to avoid recommending changes that your existing codebase already supports or that your team cannot implement in time.

1. What is the current development stage?

Website is working; all major modules are implemented

Some modules work, others are incomplete

Mostly frontend with simulated data

Frontend and backend are connected

We are planning a major rebuild

2. How many developers are available?

1–2 members

3–4 members

5–6 members

7–8 members

3. What is your biggest goal?

Stand out in SIH evaluation

Improve technical depth

Improve UI/UX

Production-level architecture

Anything else I should know? (Optional)

Submit development details

One limitation of my current review: I could inspect the repository's documentation and architecture description, but the live deployment did not expose its rendered interface to my web inspection. I have therefore not claimed to have visually tested every screen or verified every feature in execution. Screenshots or a screen recording would let me perform a detailed UI/UX audit as well.

CURRENT STAGE

Phase 3 – Solution Validation / Existing Prototype Improvement

🚀 RECOMMENDED NEXT STEP

Turn CompliScan into a more defensible regulatory intelligence platform without rebuilding its existing eight modules.

My final advice: Don't try to win by having the most features. Win by demonstrating that every important workflow works, every regulatory rule has a traceable basis, and every consequential decision remains accountable to a human authority.

# 🚀 CompliScan – Prioritised SIH Implementation Plan

Existing website is working

Team of 3–4

Enhancement, not rebuild

My recommendation is to position CompliScan as an AICTE Regulatory Workflow & Compliance Intelligence Platform, rather than simply an approval management dashboard.

Since your website is already working, your biggest opportunity is to improve the depth of existing features, demonstrate real automation and make the system more defensible to SIH evaluators.

I would not add 15 new modules.

I would focus on making five things exceptionally good:

- Regulatory intelligence.

- Automated workflow orchestration.

- Predictive pendency monitoring.

- AI-assisted document verification.

- Accountability and auditability.

## 1. Your development strategy

# CompliScan 2.0

## From workflow management to regulatory intelligence

The product should help AICTE officials understand what is happening, why it is happening, what needs attention and who must act.

Workflow intelligence

Rule-based application routing

Pendency intelligence

Bottleneck and risk identification

Document intelligence

OCR and evidence review

Compliance intelligence

Deadlines and verification

## 2. Priority-wise implementation roadmap

I recommend dividing the work into four development sprints.

### Sprint 1 – Make the existing system trustworthy

P0 – Must do first

Foundation sprint

Objective: Ensure the system behaves like a genuine regulatory platform, not a collection of simulated dashboards.

| **Task** | **What to implement** | **Acceptance criteria** |
| --- | --- | --- |
| APH rule traceability | Rule source, version, effective date | Every configured transition has an explanation |
| Workflow validation | Validate allowed transitions | Invalid transitions are rejected |
| Role-based security | Backend permission checks | Unauthorised requests return 403 |
| Audit trail | Actor, timestamp, action, reason | Every consequential action is traceable |
| Human oversight | Approval and verification controls | AI cannot make statutory decisions |
| Deadline validation | Configurable and sourced deadlines | No invented statutory SLA |

The most important feature: APH Rule Traceability Engine

[Contxt Risk | AI-Powered Business Continuity and Operational Resilience](https://images.openai.com/static-rsc-4/mF38rXuZSIzffpxUlVZD9J2xzrzU0sMjTjkZQWJia6FirF1LvOZLnRw75VlJxSkaZsQ-ZLz6Igrz9HjKL5zqDBT8lOSrr2M5G8ljzjWqmZn8HuiZzF7bKUX9UPuc4EewYyndYOENPpqwWiEBXfk9qLiFxzdLmaQSJHHxPkqwPU4?purpose=inline)

[contxt-risk.com](https://contxt-risk.com/?utm_source=chatgpt.com)

When an application moves from scrutiny to EVC, show:

- Why this transition is allowed.

- Which configured rule triggered it.

- Which APH version applies.

- Which official is responsible.

- Whether human authorisation is required.

This is a much stronger demonstration than showing an application status changing automatically.

Definition of done: A judge should be able to ask, "Why did this application move to EVC?" and your platform should provide a traceable answer.

### Sprint 2 – Build your strongest differentiator

P1 – Highest innovation opportunity

Intelligence sprint

Objective: Make CompliScan proactive rather than reactive.

#### Feature A: Pendency Intelligence Centre

[BPMS.Ai — Governed Intelligent Operations Platform](https://images.openai.com/static-rsc-4/Y4aciWCSa4ZJvx25ewXK62hBcTceqBnHv8uzjtZwW8efgcTFfQs6OPQl2Xxf5nHOY9Hj61bzFOviMbUz13MjnSlQhOygCfrkaQnms9EQ_GL73idCI3emqEVYmZe2aCVuAI41gozBcPCK_ryW_NYIYPPx4N3gcV0eOI-2xmhiM2w?purpose=inline)

[bpms.ai](https://www.bpms.ai/?utm_source=chatgpt.com)

Add:

- Applications approaching deadlines.

- Applications exceeding configured timelines.

- Stage-wise processing time.

- Region-wise pendency comparison.

- Officer workload distribution.

- Unassigned application detection.

- Bottleneck identification.

- Suggested administrative actions.

Example insight:

The EVC queue has 8 applications approaching their configured processing targets. Two applications have no assigned scheduling action.

The numbers should come from your database, not hardcoded dashboard cards.

#### Feature B: Unified Compliance Calendar

[Compliance Reminder Software & Compliance Task Management | CSTrax](https://images.openai.com/static-rsc-4/HFNWn8ELNCRkPrAW7xIjlO4nVrDXqOi7PSwmSG0uVkBiV7twUb0ybXpdmDXCZKTluKgbFMC6mLo5wbeAYYXv07EX1SXJoU3rUfMW-lmUkj06nIwGIXi06-Gk5KPFja503cL83-l3B1F4ZZWPTTkcpGutL5d7GTpZVs2_d4KUKb0?purpose=inline)

[cstrax.com](https://cstrax.com/solutions/compliance-alerts?utm_source=chatgpt.com)

Connect the existing compliance and document modules.

The calendar should display:

- Undertaking due dates.

- Lease expiry dates.

- Document renewal dates.

- Pending verification.

- EVC scheduling.

- Overdue actions.

Allow officials to filter by institution, region, document category and responsible officer.

#### Feature C: Smart Case Handover

Add an officer workload and reassignment workflow.

When an officer becomes unavailable:

- Identify pending cases.

- Identify eligible replacement officers.

- Suggest reassignment based on jurisdiction and workload.

- Obtain authorised confirmation.

- Record the handover in the audit trail.

Definition of done: The system should identify an operational problem and recommend an actionable response, rather than merely displaying a red warning.

### Sprint 3 – Make AI genuinely useful

P1 – AI differentiation

Document intelligence sprint

Your AI capabilities should solve a real administrative problem.

#### Feature A: AI-assisted document intelligence

[Review Agent | Extend Documentation](https://images.openai.com/static-rsc-4/O2Ju4g1CVRRfZYO1qlfXG7gv_34KLLXowjHLF5KZXRBaQHVr4eMWVr8ViheVYHWuqCP4SFDHz7UGwUdptCbnwp-AFchFfmnI-EFUo4QRUFMWLBrzZRnD6EUl3VGGkOOTdC5Z9VurkfArB2UmuouA-3-GfWpm8B4HFWxv6wRHiSI?purpose=inline)

[docs.extend.ai](https://docs.extend.ai/extraction/review-agent?utm_source=chatgpt.com)

Improve your existing OCR pipeline.

For every uploaded document, display:

| **Extracted information** | **Example** |
| --- | --- |
| Document type | Lease agreement |
| Institution | ABC Engineering College |
| Issue date | 01-04-2025 |
| Expiry date | 31-03-2028 |
| Registration details | Extracted value |
| Extraction confidence | 94% |
| Review status | Awaiting officer verification |

The values above are illustrative.

Add:

- Original document preview.

- Highlighted extracted text.

- Field-level confidence.

- Manual correction.

- Missing information detection.

- Duplicate document warnings.

- Verification decision and reason.

Do not claim the AI has established legal authenticity merely because it extracted the correct fields.

#### Feature B: AI-generated executive case brief

When an official opens an application, generate:

Application summary

- Institution and application type.

- Current processing stage.

- Previous observations.

- Pending actions.

- Compliance status.

- Relevant document expiry.

- Recommended next administrative action.

The brief must link back to the underlying records and documents so officials can verify it.

#### Feature C: Explainable alerts

Instead of:

"Application at risk."

Show:

"Application is approaching its configured scrutiny deadline. It has been awaiting an authorised review action for 9 days. Assigned responsibility: Regional Officer."

This makes your AI and automation much more credible.

Definition of done: An officer should understand the status of an application without manually opening ten different records.

### Sprint 4 – Make the product presentation-ready

P2 – Evaluation readiness

Demonstration sprint

Focus on the following:

| **Feature** | **What to complete** |
| --- | --- |
| Notification tracking | Generated, delivered, failed, acknowledged |
| Integration gateway | Mock API with import and sync logs |
| Security testing | Cross-institution access prevention |
| Audit dashboard | Complete application action history |
| Analytics | Real database-driven charts |
| Error handling | Failed uploads, failed notifications and retries |
| Demo data | Realistic synthetic application lifecycle |
| UI consistency | Consistent terminology and role-specific navigation |

Do not spend this sprint adding unnecessary AI features.

## 3. Team allocation – 3 to 4 developers

This is how I would distribute responsibilities.

## Recommended team structure

Developer 1 – Backend & Workflow

Critical

- APH rule engine

- Application routing

- Deadline calculation

- API development

- Audit event generation

Developer 2 – Frontend & Product UX

- Officer dashboards

- Pendency Intelligence Centre

- Compliance calendar

- Application timeline

- Responsive design

Developer 3 – AI & Automation

- OCR improvements

- Document extraction

- Case summaries

- Alert engine

- Notification integration

Developer 4 – QA, Security & Integration (if available)

- Role and permission testing

- Database validation

- Mock AICTE integration

- End-to-end testing

- Demo preparation

If you only have three developers, Developer 1 should own backend security, and Developer 2 should coordinate UI testing. Share QA responsibilities across the team.

Important: All developers should work against one agreed API contract and database schema. Avoid independently creating overlapping versions of the same application status or compliance records.

## 4. What should you build first? My top 5 selections

If development time becomes limited, follow this order.

# 01

APH Rule Traceability Engine

Must have

Makes your regulatory automation defensible.

# 02

Pendency Intelligence Centre

Differentiator

Shows problems before they become overdue.

# 03

Unified Compliance Calendar

Differentiator

Connects approval and post-approval obligations.

# 04

AI Document Intelligence

AI capability

Makes AI useful, explainable and verifiable.

# 05

Secure Audit & Accountability

Must have

Builds confidence in a government regulatory platform.

## 5. Your SIH evaluation testing checklist

Before the final demo, test these scenarios yourself.

Implementation readiness

# 0/12

Application follows the correct configured workflow.

An unauthorised role cannot perform a restricted action.

An application can be returned with a mandatory reason.

APH rule version and transition explanation are visible.

An approaching deadline generates a notification.

An overdue action follows the configured escalation hierarchy.

An institution can submit renewed documents.

An officer can verify or return a compliance submission.

OCR extracts document fields and allows manual correction.

The audit trail records all important actions.

The dashboard reflects actual database records.

A failed notification or upload is handled gracefully.

Reset checklist

## 6. What I would measure to impress judges

Don't just say that CompliScan reduces administrative workload. Demonstrate it.

Create a before-and-after simulation using the same synthetic dataset.

| **Metric** | **Before** | **After** |
| --- | --- | --- |
| Manual deadline checking | Manual tracking | Automated monitoring |
| Application status visibility | Multiple records | Unified dashboard |
| Pending action identification | Manual review | Automatic detection |
| Compliance follow-up | Manual reminders | Scheduled alerts |
| Action accountability | Scattered records | Central audit trail |

For numerical improvements, use measured prototype results rather than invented percentages.

## 7. Your biggest strategic advantage

I want your team to understand one thing:

Most teams will demonstrate what their software can do. Your team should demonstrate what an AICTE officer can accomplish because of your software.

For example:

- Not just a dashboard showing overdue applications.

- A system identifying the bottleneck and responsible queue.

- Not just an OCR document reader.

- A system identifying missing information and assisting verification.

- Not just an automated notification.

- A system proving whether the action was delivered, acknowledged and resolved.

That is the difference between a functional prototype and a compelling GovTech product.

## 🎯 Current Stage

Phase 4 – Product Building

You already have a working prototype. Now focus on making its core workflows reliable, explainable and demonstrable.

## 🚀 Recommended Next Step

I suggest we now move from planning to actual implementation.

My recommendation is to start with the APH Rule Traceability Engine. It provides the foundation for your workflow automation, pendency intelligence and regulatory accountability.

I can create a developer-ready implementation specification containing:

- Database schema and migrations.

- Backend API endpoints.

- Frontend screens and components.

- Rule-engine logic.

- Role permissions.

- Test cases.

- Integration instructions for your existing CompliScan codebase.

This will give your three-to-four-member team a concrete development blueprint without rebuilding the working website.