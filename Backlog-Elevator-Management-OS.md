# Product Backlog — Elevora (Elevator Operations Platform)

**Companion docs:** `BRD-Elevator-Management-OS.md`, `SRS-Elevator-Management-OS.md`, `Link-Lift-System-Audit.md`
**Version:** 1.0 (Draft) · **Date:** 16 Oct 2026

> Structure: **Epic → User Story → Acceptance Criteria**. Each story carries an ID, priority (P0–P3), rough estimate (story points, Fibonacci), and traceability to SRS requirements (`FR-`) / BRD (`BR-`). A machine-importable version is in `Backlog-Elevator-Management-OS.csv`.
> Format for stories: *As a `<role>`, I want `<capability>`, so that `<value>`.*

**Epics by delivery phase**

| Epic | Phase | Theme | Stories |
|---|---|---|---|
| E1 | 1 | Security & foundation | US-001…US-006 |
| E2 | 1 | Data hygiene & reliability | US-007…US-009 |
| E3 | 2 | Elevator asset register | US-010…US-015 |
| E4 | 2 | Work order spine | US-016…US-020 |
| E5 | 2 | CRM & customer master | US-021…US-024 |
| E6 | 3 | Contracts & SLA | US-025…US-029 |
| E7 | 3 | Preventive maintenance | US-030…US-035 |
| E8 | 3 | Corrective maintenance | US-036…US-041 |
| E9 | 3 | Dispatch & field service | US-042…US-045 |
| E10 | 3 | Technician mobile app | US-046…US-050 |
| E11 | 4 | Inventory | US-051…US-055 |
| E12 | 4 | Procurement | US-056…US-059 |
| E13 | 5 | Finance & ZATCA | US-060…US-065 |
| E14 | 5 | Customer portal | US-066…US-069 |
| E15 | 5 | Inspection & compliance | US-070…US-071 |
| E16 | 6 | Reporting & KPIs | US-072…US-076 |
| E17 | 6 | Notifications & automation | US-077…US-080 |
| E18 | all | Non-regression (existing engine) | US-081…US-083 |
| E19 | 7 | AI & IoT | US-084…US-086 |

---

## E1 · Security & Foundation (Phase 1) — P0

### US-001 · Hash all passwords — `FR-01` / `BR-03` · P0 · 5
As a **security owner**, I want all passwords stored hashed+salted and never displayed, so that credentials cannot be stolen from the UI or database.
- No password value appears in any screen, API response, HTML source, or log.
- Existing plaintext passwords are migrated to hashes; a forced reset is triggered for all users.
- Hashing uses a vetted algorithm (bcrypt/argon2) with per-user salt.

### US-002 · Remove the plaintext password column — `FR-01` · P0 · 2
As a **user admin**, I want the Users screen to never show a password column, so that passwords are not exposed to anyone with screen access.
- The Users grid and detail view contain no password field; only "set/reset password" actions exist.

### US-003 · Individual accounts (no shared logins) — `FR-02` / `BR-03` · P0 · 5
As an **admin**, I want each user and each customer to have their own account, so that actions are attributable and the shared customer login is retired.
- The shared `العميل` login is removed; each customer gets an individual portal account.
- Every session maps to exactly one identity.

### US-004 · Role-based access with full verbs — `FR-03` / `BR-14` · P0 · 8
As an **admin**, I want to grant View/Create/Edit/Delete/Approve/Reject/Assign/Close/Export/Print per function, so that duties are properly separated.
- Permissions configurable per module and verb; finance verbs independently assignable.
- Denied actions are hidden/disabled in UI and rejected by the API.

### US-005 · Data-scope enforcement — `FR-04` / `BR-14` · P0 · 8
As an **admin**, I want each role scoped to All/Company/Branch/Team/Assigned/Own/Customer data, so that users only see what they should.
- A technician sees only assigned jobs; a customer sees only their own records; a branch manager sees only their branch.
- Scope enforced server-side on every query (prevents IDOR).

### US-006 · Auth hardening — `FR-06` / `NFR-01,02` · P0 · 5
As a **security owner**, I want password policy, lockout, session timeout, CSRF protection, and TLS, so that accounts and sessions resist attack.
- Lockout after N failed attempts; configurable session timeout; CSRF tokens on state-changing requests; all traffic over TLS.

---

## E2 · Data Hygiene & Reliability (Phase 1) — P0

### US-007 · Immutable audit trail — `FR-05` / `BR-13` · P0 · 5
As an **auditor**, I want every create/update/delete/approve/assign/status-change recorded with actor, old/new values, IP, device, timestamp, so that all activity is traceable.
- Audit records are immutable and exportable; filterable by user, module, and event type.

### US-008 · Controlled status enums — `FR-31,52` / `DR-03` · P0 · 5
As a **maintenance manager**, I want asset/contract/ticket/invoice/PO statuses to be controlled values, so that reporting and automation are reliable.
- Free-text status fields are replaced by enums; legacy free-text is mapped during migration.

### US-009 · Reliable hosting & environment separation — `NFR-10` / `DR-04` · P0 · 5
As an **operations owner**, I want production on reliable hosting with test data isolated, so that users never hit Runtime Errors or see test records.
- Availability ≥ 99.5%; no free-tier cold-start failures; test records never appear in live lists.

---

## E3 · Elevator Asset Register (Phase 2) — P0

### US-010 · Elevator as a managed asset — `FR-20` / `BR-01` · P0 · 13
As a **maintenance manager**, I want each elevator stored as a unique asset with full spec, so that it has one identity for life.
- Captures asset no., serial, QR/barcode, brand/model/type, capacity, speed, stops/floors, door/machine/controller/drive/cabin, install/commission dates, warranty, status.

### US-011 · Asset hierarchy & links — `FR-21` / `FR-11` · P0 · 8
As a **dispatcher**, I want each asset linked to customer→site→building and its contract/technicians, so that location and responsibility are clear.
- Asset shows its site/building, active contract, maintenance & fault technicians.

### US-012 · Consolidated asset history — `FR-21` · P0 · 8
As a **technician**, I want one timeline of visits/faults/parts/docs/inspections per asset, so that I know the machine before I arrive.
- History persists across contract renewals (new contract ≠ new asset).

### US-013 · QR scan to identify asset — `FR-22` · P1 · 5
As a **technician**, I want to scan the elevator's QR to open its record, so that I identify the machine instantly on site.
- Scanning on web and mobile opens the correct asset.

### US-014 · Asset status lifecycle — `FR-23` · P1 · 3
As a **manager**, I want asset status as Active/Under Maintenance/Out of Service/Decommissioned, so that fleet state is accurate.

### US-015 · Auto-create asset on delivery — `FR-24` / `BR-21` · P1 · 8
As a **sales/ops user**, I want delivery of an installed elevator to auto-create its asset from the contract spec, so that no data is re-entered.

---

## E4 · Work Order Spine (Phase 2) — P0

### US-016 · Work order object — `FR-60` / `BR-02` · P0 · 13
As a **dispatcher**, I want a work order that captures source/customer/site/elevator/contract/type/priority/schedule/technician/checklist/parts/labour/travel/attachments/signature/status, so that every job is one record.

### US-017 · All field work becomes a WO — `FR-61` · P0 · 8
As a **manager**, I want PM visits, fault repairs, inspections, and part installs realised as work orders, so that asset history is complete in one place.

### US-018 · Parts on WO decrement stock & cost — `FR-62` / `FR-92` · P1 · 8
As a **storekeeper**, I want parts issued on a WO to reduce stock and post to job cost, so that inventory and margin stay accurate. *(Depends on E11.)*

### US-019 · WO status workflow — `FR-60` · P1 · 5
As a **supervisor**, I want a WO status lifecycle with transitions and permissions, so that progress is controlled.

### US-020 · WO completion report & signature — `FR-42,60` · P1 · 5
As a **customer**, I want to sign off completed work and receive a service report, so that I have proof of service.

---

## E5 · CRM & Customer Master (Phase 2) — P1

### US-021 · Rich customer record — `FR-10` / `BR-10` · P1 · 8
As a **sales user**, I want individual/company type, code, CR, VAT, national address, contacts, and billing/service addresses, so that the customer master is complete and ZATCA-ready.

### US-022 · Customer hierarchy — `FR-11` · P1 · 5
As a **manager**, I want Customer→Branch→Site→Building→Elevator, so that large accounts are organised.

### US-023 · Lead pipeline — `FR-12` · P1 · 5
As a **sales rep**, I want leads with source/stage/expected-value/follow-up/owner that convert to customers, so that the pipeline is managed without re-entry.

### US-024 · Single source of customer/elevator data — `DR-02` · P1 · 5
As a **data owner**, I want customer and elevator data stored once and referenced, so that duplication across screens is eliminated.

---

## E6 · Contracts & SLA (Phase 3) — P1

### US-025 · Full maintenance contract — `FR-30` / `BR-16` · P1 · 8
As a **maintenance manager**, I want contracts with covered elevators, type, dates, value, payment schedule, visit frequency/count, coverage, SLA, penalties, attachments, so that terms are explicit.

### US-026 · Multi-elevator contracts — `FR-30` · P1 · 5
As a **sales user**, I want one contract to cover many elevators, so that building-wide deals are modelled correctly.

### US-027 · Contract status lifecycle — `FR-31` · P1 · 3
As a **manager**, I want Draft/Pending/Active/Suspended/Expired/Renewal-Due/Renewed/Cancelled, so that contract state drives reporting and automation.

### US-028 · Renewal that keeps asset history — `FR-32` · P1 · 5
As a **manager**, I want one-click renewal that continues the same asset's history, so that lifecycle is unbroken.

### US-029 · Quotation approve/reject → contract — `FR-33` · P1 · 5
As a **sales manager**, I want to approve/reject quotes with a reason and convert to contracts, so that the sales gate is enforced (parity with current `العروض`).

---

## E7 · Preventive Maintenance (Phase 3) — P1

### US-030 · Auto-generate PM work orders — `FR-40` / `BR-17` · P1 · 8
As a **planner**, I want scheduled PM work orders generated from the plan frequency/day/zone, so that visits are never forgotten.

### US-031 · Due/overdue visibility — `FR-41` · P1 · 3
As a **manager**, I want due and overdue visits clearly flagged (keep colour coding), so that compliance is visible at a glance.

### US-032 · Structured visit execution — `FR-42` / `BR-02` · P1 · 8
As a **technician**, I want check-in/out, a pass/fail checklist, findings, photos, notes, and customer signature, so that visit quality is captured and provable.

### US-033 · PM visit lifecycle — `FR-43` · P1 · 3
As a **supervisor**, I want the Scheduled→…→Closed lifecycle with supervisor approval, so that visits are QA'd.

### US-034 · Visit reminders to customer & technician — `FR-44` · P1 · 3
As a **customer/technician**, I want reminders before a visit (keep SMS behaviour), so that both parties are prepared.

### US-035 · Missed-visit tracking — `FR-41` · P1 · 3
As a **manager**, I want missed preventive visits reported and alerted, so that contractual obligations aren't breached silently.

---

## E8 · Corrective Maintenance (Phase 3) — P1

### US-036 · Fault ticket with priority & SLA — `FR-50` / `BR-18` · P1 · 8
As a **customer-care agent**, I want a ticket with fault type/description/priority/severity/SLA and timestamps, so that faults are triaged and measured.

### US-037 · Repair details & confirmation — `FR-51` · P1 · 5
As a **technician**, I want to log root cause, corrective action, parts used, and dual confirmation codes, so that the fix is documented and verified.

### US-038 · Ticket status workflow — `FR-52` · P1 · 5
As a **dispatcher**, I want the Open→…→Closed workflow with reopen and escalation, so that progress is controlled.

### US-039 · SLA timers & breach alerts — `FR-53` · P1 · 5
As a **manager**, I want SLA warning/breach raised from ticket timestamps, so that service levels are enforced.

### US-040 · Configurable finance-gated dispatch — `FR-54` · P2 · 3
As a **manager**, I want the "block dispatch on overdue invoice" rule configurable with override permission, so that policy isn't hard-coded (replaces current hidden rule).

### US-041 · Open-faults board — `FR-50,52` · P1 · 3
As a **dispatcher**, I want a live open-faults board, so that nothing is unattended.

---

## E9 · Dispatch & Field Service (Phase 3) — P1

### US-042 · Dispatch board — `FR-70` / `BR-05` · P1 · 8
As a **dispatcher**, I want drag-and-drop assignment with technician availability/shift/territory, so that scheduling is efficient.

### US-043 · Map & ETA — `FR-71` · P1 · 8
As a **dispatcher**, I want technicians and jobs on a map with ETA (and optional routing), so that I dispatch the nearest capable technician.

### US-044 · Technician profiles — `FR-72` · P1 · 5
As a **manager**, I want technician skills/certs/region/team/vehicle/jobs/KPIs, so that assignment is skill-aware.

### US-045 · Territory/zone assignment — `FR-70` · P2 · 3
As a **manager**, I want technicians assigned to zones, so that routing and workload balance improve.

---

## E10 · Technician Mobile App (Phase 3) — P1

### US-046 · Mobile job list & details — `FR-80` / `BR-06` · P1 · 8
As a **technician**, I want today's jobs, calendar, and job/customer/site/elevator details on mobile, so that I work from my phone.

### US-047 · Mobile execution flow — `FR-80` · P1 · 8
As a **technician**, I want to start job, run checklist, report fault, add findings, add parts, upload photos, and capture signature, so that I complete jobs in the field.

### US-048 · Offline mode & sync — `FR-81` · P1 · 13
As a **technician**, I want to work offline and sync automatically, so that poor signal doesn't block me.

### US-049 · QR scan, camera, GPS — `FR-81` · P1 · 5
As a **technician**, I want QR scanning, camera, and GPS check-in, so that I confirm the right machine and my presence.

### US-050 · AR/EN/RTL & push — `FR-81` · P1 · 3
As a **technician**, I want Arabic/English/RTL and push notifications, so that the app fits my language and alerts me to new jobs.

---

## E11 · Inventory (Phase 4) — P1

### US-051 · Item master — `FR-90` / `BR-07` · P1 · 5
As a **storekeeper**, I want items with SKU/category/brand/supplier/unit/cost/price/min-stock/reorder, so that parts are properly catalogued.

### US-052 · Multi-location stock — `FR-91` · P1 · 8
As a **storekeeper**, I want stock per main/branch/vehicle/site location, so that I know where every part is.

### US-053 · Stock operations — `FR-92` · P1 · 8
As a **storekeeper**, I want stock in/out/transfer/reserve/adjust/return/damaged, so that stock stays accurate.

### US-054 · Issue parts to work orders — `FR-92,62` · P1 · 5
As a **technician/storekeeper**, I want to issue parts against a WO, so that consumption is tied to the job.

### US-055 · Low-stock alerts — `FR-93` · P2 · 3
As a **storekeeper**, I want reorder alerts, so that I never run out of common parts.

---

## E12 · Procurement (Phase 4) — P2

### US-056 · Suppliers & purchase requests — `FR-100` / `BR-08` · P2 · 5
As a **procurement officer**, I want suppliers and purchase requests, so that buying starts from a controlled request.

### US-057 · RFQ & supplier selection — `FR-100,101` · P2 · 5
As a **procurement officer**, I want RFQs and quotation comparison, so that I select the best supplier.

### US-058 · Purchase order with approval — `FR-100` · P2 · 5
As a **procurement officer**, I want POs with approval, so that spend is authorised.

### US-059 · Goods receipt updates stock — `FR-101` · P2 · 5
As a **storekeeper**, I want goods receipt to update stock and match supplier invoices, so that received parts are available and payable.

---

## E13 · Finance & ZATCA (Phase 5) — P0/P1

### US-060 · ZATCA Phase-2 tax invoice — `FR-110` / `BR-04` · P0 · 13
As an **accountant**, I want VAT-15% tax invoices with QR/XML cleared via the accredited integration, so that invoicing is legal.
- Invoices pass ZATCA validation; QR and required fields present; clearance/reporting succeeds.

### US-061 · Invoice from contract/repair/parts — `FR-110` · P1 · 8
As an **accountant**, I want to bill contracts, repairs, and parts, so that all revenue is invoiced consistently.

### US-062 · Payments & AR ageing — `FR-111` · P1 · 5
As an **accountant**, I want payments, receivables, and AR ageing (keep paid/outstanding/due + statements), so that collections are managed.

### US-063 · Credit notes — `FR-111` · P2 · 3
As an **accountant**, I want credit notes, so that corrections are compliant.

### US-064 · Profitability per contract/elevator — `FR-112` / `BR-19` · P1 · 8
As a **manager**, I want revenue/cost/profit per customer/contract/elevator (incl. parts & labour cost), so that I see margins.

### US-065 · Expenses / GL integration — `FR-113` · P2 · 5
As a **finance manager**, I want expenses and cost centres or GL export, so that finance reconciles with accounting.

---

## E14 · Customer Portal (Phase 5) — P2

### US-066 · Portal dashboard — `FR-140` / `BR-10` · P2 · 5
As a **customer**, I want to see my elevators, active contracts, open tickets, and upcoming maintenance, so that I have visibility.

### US-067 · Portal tickets — `FR-140` · P2 · 5
As a **customer**, I want to open and track tickets with attachments/comments, so that I can request and follow service.

### US-068 · Portal finance & documents — `FR-140` · P2 · 5
As a **customer**, I want quotations, invoices, payments, and documents (contracts/reports/certificates), so that I self-serve.

### US-069 · Portal maintenance history — `FR-140` · P2 · 3
As a **customer**, I want maintenance schedule, completed visits, and service reports, so that I verify service delivery.

---

## E15 · Inspection & Compliance (Phase 5) — P2

### US-070 · Safety/quality inspections — `FR-120` / `BR-11` · P2 · 8
As a **supervisor**, I want inspections with checklists, defects/NCRs, corrective actions, and evidence, so that compliance is managed.

### US-071 · Inspection certificates — `FR-120` · P2 · 3
As a **customer/regulator**, I want inspection certificates per asset, so that regulatory proof exists.

---

## E16 · Reporting & KPIs (Phase 6) — P1

### US-072 · Executive dashboard — `FR-130` / `BR-09` · P1 · 8
As a **GM**, I want a live KPI dashboard (elevators, contracts, visits, tickets, SLA, technicians, stock, revenue, profit) with filters, so that I manage at a glance.

### US-073 · Role dashboards — `FR-130` · P1 · 8
As a **manager/dispatcher/technician/storekeeper/accountant**, I want my own dashboard, so that I see what my role needs.

### US-074 · Reliability KPIs (MTTR/MTBF) — `FR-131` · P1 · 5
As a **manager**, I want MTTR and MTBF per asset/fleet, so that I measure reliability.

### US-075 · Field-service KPIs — `FR-131` · P1 · 5
As a **manager**, I want first-time-fix, jobs/technician, utilisation, and avg job duration, so that I measure productivity.

### US-076 · Compliance & SLA KPIs — `FR-131` · P1 · 5
As a **manager**, I want maintenance compliance and SLA (response/arrival/repair, compliance rate), so that I prove service levels.

---

## E17 · Notifications & Automation (Phase 6) — P1/P2

### US-077 · Event notifications — `FR-150` / `BR-12` · P1 · 8
As any **user/customer**, I want alerts for new ticket, tech assigned/arrived, job done, contract expiry/renewal, maintenance due/missed, SLA warning/breach, invoice due/overdue, low stock, purchase approval, so that I act in time.

### US-078 · Multi-channel delivery — `FR-150,151` · P1 · 5
As an **admin**, I want in-app/email/SMS/WhatsApp/push routing, so that messages reach people where they are.

### US-079 · Configurable rules — `FR-151` / `BR-20` · P2 · 8
As an **admin**, I want to configure notification and approval rules by business event, so that processes aren't hard-coded.

### US-080 · Automation quick wins — `BR-12` · P1 · 5
As a **manager**, I want auto contract-expiry/renewal, missed-visit, SLA, and payment-overdue reminders using existing data, so that we get value fast.

---

## E18 · Non-Regression — Existing Engine (all phases) — P0

### US-081 · Preserve installation flow — `FR-160` / `BR-21` · P0 · 8
As an **ops user**, I want quote→contract→factory→warehouse→phased install→delivery→collection unchanged, so that current operations don't regress.

### US-082 · Preserve parametric pricing — `FR-160` · P0 · 5
As a **sales user**, I want the pricing/costing engine (drives/batteries/controllers/machines, labour rates, loadings) intact, so that quotes stay accurate.

### US-083 · Integrate engine with asset/finance — `FR-160,24,110` · P1 · 8
As an **ops user**, I want installation delivery to create assets and installation billing to flow into ZATCA invoicing, so that old and new layers connect.

---

## E19 · AI & IoT (Phase 7) — P3

### US-084 · Predictive maintenance — `IR-08` · P3 · 13
As a **manager**, I want fault/service-history analysis to flag at-risk elevators, so that I prevent failures.

### US-085 · Technician copilot — P3 · 8
As a **technician**, I want suggested likely faults, steps, manuals, and parts, so that I fix faster.

### US-086 · IoT auto-ticket — `IR-08` · P3 · 13
As a **dispatcher**, I want IoT telemetry to auto-create fault tickets, so that failures are addressed before customers call.

---

## Release plan (summary)

| Release | Epics | Outcome |
|---|---|---|
| R1 (Phase 1) | E1, E2, E18 start | Secure, reliable, clean data; engine preserved |
| R2 (Phase 2) | E3, E4, E5 | Asset + work-order backbone; customer master |
| R3 (Phase 3) | E6, E7, E8, E9, E10 | Full maintenance lifecycle + dispatch + mobile |
| R4 (Phase 4) | E11, E12 | Inventory + procurement |
| R5 (Phase 5) | E13, E14, E15 | ZATCA finance + portal + compliance |
| R6 (Phase 6) | E16, E17 | KPIs + automation |
| R7 (Phase 7) | E19 | AI + IoT |

*Estimates are indicative for planning; refine in sprint planning. Points total per epic can be summed from the CSV.*
