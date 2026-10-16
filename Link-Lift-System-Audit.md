# Link Lift — Elevator Management System Audit

**System:** Link Lift (برنامج Link Lift لإدارة شركات المصاعد) — ASP.NET WebForms
**Tenant:** مصادر غادة للتشغيل والصيانة (Masader Ghada Operation & Maintenance), Riyadh
**URL reviewed:** https://masader-ghada.somee.com/ · Account: `ghada`
**Method:** Live, read-only navigation of all 9 top modules (~140 screens)
**Date:** 16 Oct 2026
**Overall maturity:** **42 / 100** (early-to-mid)

> Review constraints honoured: no records created/edited/deleted, no messages/invoices sent, no downloads, no configuration or password changes, no exploitation. Real-looking customer PII observed in the demo is deliberately **not** reproduced here.

**Verification labels used throughout:** `Verified present` · `Partial` · `Missing` (verified absent) · `Not Verified`.

---

## A. Executive Summary

Link Lift is a **vertically specialised, in-house ERP** built for a company that **sells, manufactures, installs, and then maintains** elevators. The product is organised around the company's **business-process phases** (Sales → Installation → Factory → Warehouse → Maintenance → Accounts), not around the asset-and-service-order model used by modern field-service platforms.

- **Strongest area — installation/manufacturing:** a parametric pricing engine, component-level crew assignment, factory production orders (door cladding, cabin fabrication), warehouse material issue per phase, and staged payments. Unusually deep and genuinely good.
- **Workable area — maintenance:** comprehensive vs. non-comprehensive contracts, visit-frequency planning, overdue-visit tracking with colour coding, a fault-logging workflow with timestamps and dual confirmation codes, and SMS to both customer and technician. Solid register, but **not yet asset/work-order-centric**.
- **Biggest structural gaps:** no elevator asset register, no work-order object, no spare-parts stock inventory, no procurement, no customer portal, no KPI dashboard, no VAT/ZATCA e-invoicing.
- **Most serious single issue (CRITICAL):** user passwords are shown in **plaintext** on the Users screen and in page source (not hashed).

**Key live metrics observed:** 125 maintenance contracts · 87 preventive visits currently due · 8 open fault tickets.

**Direction in one line:** keep the excellent installation/manufacturing engine, and evolve the maintenance side from a contract register into an **asset-centric field-service operating system** — add an elevator asset register, a work-order spine, spare-parts inventory, ZATCA invoicing, a technician mobile app, and a customer portal. The foundations (branch scope, roles, audit log, contract depth, notifications) make the gap **closable by extension, not rebuild**.

### Strongest areas (keep)
- Installation sales → manufacturing → delivery lifecycle with per-component crew and staged payments.
- Parametric installation pricing/costing engine (drives/batteries/controllers/machines, labour rates, cost loadings).
- Maintenance contract depth: comprehensive/non-comprehensive, visit frequency, zone, dedicated maintenance + fault technicians.
- Preventive-visit due tracking with overdue colour coding; fault timestamps; SMS to customer and technician.
- Granular per-screen permission matrix and a system-wide event (audit) log.

### Weakest areas & major risks
- **Security:** plaintext passwords; a single shared العميل (customer) login; intermittent server crashes.
- **No elevator asset entity** → no per-machine lifecycle, QR/serial, or history across contracts.
- **No work orders, no dispatch board/map/GPS, no mobile technician app.**
- **No spare-parts stock inventory and no procurement.**
- **Finance:** accounts-receivable only; no VAT calculation, no ZATCA e-invoice, no profitability.
- **No executive KPI dashboard** (the "dashboard" is a sales report filter); no MTTR/MTBF/first-time-fix.

---

## B. Current System Architecture

- **Stack:** classic server-rendered ASP.NET WebForms on `somee.com` shared hosting; `type="image"` submit buttons, full-page postbacks.
- **Hosting reliability:** several admin pages intermittently return ASP.NET "Runtime Error" (cold-start / DB timeouts on free-tier hosting), then load normally on retry — a real reliability risk, not necessarily code bugs.
- **Tenancy:** single company, **branch-aware** (الفرع selector, default Riyadh). Branch is the primary data-scope dimension.
- **UX pattern:** every screen is a master-form-on-top + filtered grid below, with جديد / إضافة / تعديل / حذف (New/Add/Edit/Delete) buttons — consistent but dense and dated.
- **Identity:** username/password login; a role/department field per user; a per-screen permission matrix.

**Top-level navigation (RTL):**

| Menu | Meaning |
|---|---|
| DashBoard | Home (sales filter only) |
| المبيعات | Sales (installation) |
| التركيبات | Installation phases |
| المصنع | Factory (manufacturing) |
| المستودع | Warehouse (material prep) |
| الصيانة | Maintenance |
| المقايسات | Estimations / parts |
| الحسابات | Accounts (AR) |
| الاعدادات | Settings / users |

---

## C. Current Modules — Inventory & Maturity

Legend: **Yes** present & usable · **Partial** exists but incomplete · **No** absent.

| Area | Exists | Quality | What's there / missing |
|---|---|---|---|
| Dashboard | Partial | Weak | A sales report **filter form** only — no KPI cards, charts, or operational signals. |
| CRM — Leads/Customers (عملاء الشركة) | Partial | Weak | Thin contact record (name, phone, address, 2 notes). No company/individual type, CR, VAT, national address, contacts, lead source/stage/value. |
| Quotations (العروض) | Yes | Good | Full elevator spec + price + **approve/reject workflow** with reason. Installation-only. |
| Installation contracts (العقود) | Yes | Good | Deep technical spec, per-component installer assignment, 4-stage payment %, phase durations. |
| Installation execution (التركيبات) | Yes | Good | Phase pages (rail&door / machine / cabin / electric), delivery, technician contracting pay, staged collection. |
| Factory (المصنع) | Yes | Good | Production orders: door cladding, cabin/chassis fabrication, floors — genuine manufacturing support. |
| Warehouse (المستودع) | Partial | Average | Material prep/issue per install phase + controllers/push-buttons. **Not** a stock-controlled spare-parts warehouse. |
| Maintenance contracts (عقود الصيانة) | Yes | Good | 125 contracts; comprehensive/non-comprehensive, visit frequency, zone, techs, VAT#, national ID. No status enum / SLA. |
| Preventive maintenance (تنفيذ الصيانة) | Yes | Average | Due-visit list, overdue colour coding, visit logging, SMS to customer+tech. No checklist / signature / check-in-out. |
| Corrective / faults (تسجيل عطل) | Yes | Average | Fault log with timestamps, repair tech, dual confirmation codes. Free-text status; no priority/SLA/root-cause. |
| Estimations / parts quotes (المقايسات) | Yes | Average | Spare-part/repair quotations with line items, cost/sell price, part origin. Quote & sell only — no stock. |
| Finance / Accounts (الحسابات) | Partial | Weak | Per-contract AR (value/paid/outstanding/due) + PDF/Excel claim. No GL, VAT calc, ZATCA, profitability. |
| Surveys (استبيانات) | Yes | Average | Customer satisfaction surveys for sales, contracts, maintenance, and faults. |
| Periodic calls (الاتصالات الدورية) | Yes | Average | Follow-up call logging for offers and expiring contracts. |
| Users / Roles / Permissions (الصلاحيات) | Yes | Average | ~18 department roles, granular per-screen matrix, branch scope. **But passwords in plaintext.** |
| Audit / event log (سجل الأحداث) | Yes | Average | Filterable by user & event type. No before/after values, IP, or device. |
| Reports | Yes | Average | Many list/export reports per module. No cross-module KPIs, MTTR/MTBF, utilisation, profitability. |
| Notifications | Partial | Average | Per-record SMS/link send (visit reminders, fault alerts, customer link). No notification centre or event rules UI. |
| Elevator asset register | **No** | Critical | Spec embedded in contracts; no standalone machine entity, serial/QR, or cross-contract history. |
| Work orders | **No** | Critical | No central work-order object; visits and faults tracked in their own screens. |
| Dispatch / scheduling / map / GPS | **No** | Critical | Technician assigned on the contract; no calendar/board, routing, map, or location. |
| Spare-parts inventory (stock) | **No** | Critical | Parts priced & sold but not stocked (no on-hand, min-stock, reservations, transfers). |
| Procurement (suppliers/PO/RFQ) | **No** | Critical | No supplier, purchase request, RFQ, PO, or goods-receipt anywhere. |
| Customer self-service portal | **No** | Critical | Only a shared customer login and a "send link" action; no true portal. |
| Mobile technician app | **No** | Critical | No app; field work recorded back-office. Offline/camera/QR/GPS absent. |
| ZATCA e-invoicing | **No** | Critical | VAT number captured but no VAT-15% calc, QR, XML, or clearance/reporting. |
| Inspection & compliance / NCR | **No** | Critical | No structured safety inspection, defect/NCR, or certificate workflow. |

### Full sitemap discovered (URL → meaning)

**المبيعات (Sales):** `offers` quotations · `contract` contracts · `newlead` leads · `calls` periodic calls · `qstnewlead`/`qstnewcon` surveys · `reportoffers`/`reportcon`/`reportcomm`/`reportcalls`/`reportqstnewlead`/`reportqstnewcon` reports.

**التركيبات (Installation):** `cp` customer-in-execution · `ph1` rail&door / `ph3` machine / `ph2` cabin / `ph4` electric · `liftdelivary` delivery · `teckpayph1/3/2/4` technician contracting pay · `winshpay` winch · `qstph1/2/4` staged collection · `reportph1/3/2/4`, `reportdelivary`, `reportqstph1/2/4` reports.

**المستودع (Warehouse):** `storcp` · `storph1/3/2/4prepqty` prep quantities · `storph1/3/2/4prep` not-yet-issued · `storcontrol` controllers · `storpushbutton` push-button boxes · `reportstorph1/3/2/4prep` reports.

**المصنع (Factory):** `factcp` · `factmanual` normal doors · `factborder` auto doors · `factcabine` cabins/chassis · `factcardoor` inner leaves · `factfloor` floors · `reportfact*` reports.

**الصيانة (Maintenance):** `mintcp` search · `mintoffers` offers · `mintcontract` contracts · `mintrenew` renewal · `mintgarnteeagree` warranties · `mintofferscalls`/`mintcalls` periodic calls · `mintperlist` **preventive execution** · `newmalf` **register fault** · `openmalf` **open faults** · `qstmint`/`qstmalf` surveys · reports: `reportmintoffers`, `reportmintcontract`, `reportmintofferscalls`, `reportmintcalls`, `reportmint`, `reportmalf`, `notmint` (missed preventive), `mintremain` (remaining to expiry), `reportqstmint`, `reportqstmalf`.

**المقايسات (Estimations):** `spcp` · `spoffers` offers · `spofferout` external offers · `spcalls` calls · `spready` not-yet-supplied · `spfinish` not-yet-installed · `reportsp*` reports.

**الحسابات (Accounts):** `paysearch` installation AR · `mintpay` maintenance AR · `sppay` estimation AR · `reportpay`, `reportpayremain`, `reportsppay`, `reportsppayremain`.

**الاعدادات (Settings):** `emp` users & permissions · `salesprice` sales pricing · `salespermission` sales targets · `paymentruls` payment schemes · `teckpay` installer prices · `spprice` parts prices · `sppermission` estimation discount rights · `actionhistory` system event/audit log.

---

## D. Current Workflows (as built)

**Installation (new elevator) — strong:**
```
Lead (عميل) → Quote (عرض, approve/reject) → Contract (عقد, spec + 4 payments)
→ Warehouse prep (المستودع) → Factory build (المصنع)
→ Phase install (التركيبات: ph1 rail&door, ph2 cabin, ph3 machine, ph4 electric)
→ Delivery (تسليم) → staged payment collection
```

**Maintenance — workable, asset-light:**
```
Maint. quote (عرض صيانة) → Maint. contract (عقد صيانة: comprehensive? visits? zone?)
→ PM due list (تنفيذ الصيانة, overdue colour-coded) → log visit + SMS reminder
→ Fault (تسجيل عطل, ad-hoc: fault→notify→repair + confirmation codes)
→ Parts quote (مقايسة, extra) → AR + PDF claim (حسابات) → Renewal (تجديد)
```

**Gap in both flows:** there is **no single work order** that unifies a job (visit, fault, or part install) with its labour, parts, checklist, signature, and cost. Each is a separate screen, so a machine's full service history cannot be assembled in one place.

---

## E. Strengths (keep these)

- **Vertical depth** — purpose-built for a firm that manufactures and installs; factory, cladding, cabin fabrication and per-phase material issue are real and rare.
- **Parametric pricing** — installation price computed from a configurable catalog (drives, batteries, controllers, machines) plus per-stop/per-load deltas and cost loadings.
- **Maintenance discipline** — visit frequency, maintenance day, zone, dedicated maintenance and fault technicians, warranty period, overdue-visit colour coding.
- **Operational SMS** — reminders to the customer *and* the technician for tomorrow's visit; fault alerts; customer link.
- **Fault accountability** — fault time, technician-notified time, repair time, plus **customer and technician confirmation codes** — a base for SLA metrics.
- **Governance basics** — branch scoping, ~18 roles, a per-screen × action permission matrix, a system-wide event log.
- **Saudi fit, partial** — Arabic-first RTL, SAR, bilingual AR/EN fields, VAT number and national ID capture, technician تصريح حج (Hajj permit) field.
- **Finance-gated dispatch** — observed rule: a fault is not dispatched when the customer has an outstanding invoice.

---

## F. Problems & Weaknesses

- **Status as free text.** Fault state is typed prose (تم بلاغ العطل…), not a controlled enum — no reliable reporting, filtering, or SLA automation. Contracts have no status field at all (inferred from dates).
- **Data entry not keeping up.** In the demo, preventive visits-done = 0 across the board while 87 visits are due and many contracts are overdue — the PM loop depends on manual logging that isn't happening.
- **Leftover test data** in live lists (a تيست fault ticket, a "test" open fault) — no separation of test vs. production records.
- **Duplication.** Customer, elevator spec, and address are re-captured on quote, contract, maintenance contract, and accounts screens rather than referenced from one record.
- **Reliability.** Intermittent ASP.NET Runtime Errors on admin/settings/audit pages under shared free hosting.
- **Dashboard is not a dashboard.** No at-a-glance operational or financial picture for management.

---

## G. Missing Modules (completely absent)

Elevator asset register · Work orders · Dispatch board / scheduling / map / GPS · Spare-parts stock inventory · Procurement (suppliers/PR/RFQ/PO/GRN) · Customer self-service portal · Mobile technician app · ZATCA e-invoicing · Inspection & compliance / NCR · Executive KPI dashboard · Notifications centre / event-rule engine · IoT.

## H. Missing Features (inside existing modules)

- **CRM:** individual/company type, commercial registration, VAT, national address, contact persons, billing vs service address, lead source/stage/opportunity value.
- **Maintenance contract:** explicit status enum (Draft/Active/Suspended/Expired/Renewal-Due/Cancelled), SLA (response/arrival/repair targets, penalties), emergency-coverage toggle.
- **Preventive visit:** structured checklist, check-in/out times, GPS, customer signature, auto work-order generation.
- **Corrective fault:** priority/severity, SLA target & breach, structured root-cause/corrective-action, parts consumption on fault, escalation, reopen.
- **Finance:** VAT-15% calculation, ZATCA tax invoice, credit notes, general ledger, cost centres, profitability per customer/contract/elevator, payment gateway.
- **Permissions:** Approve / Assign / Close / Export / Print as discrete rights (currently only Page/Add/Edit/Delete).
- **Audit log:** before/after values, IP, device.

---

## I. Elevator-Industry Gaps

**The core gap: no asset.** Each elevator's attributes (stops, floors, load, machine type, door type/size, brand) are stored **on the contract**. There is no `Elevator` entity with a stable identity, so:
- No serial number, asset number, QR, or barcode.
- No model/speed/controller/drive/commissioning/warranty as asset facts.
- No single maintenance + fault + parts history per machine across contract renewals.
- Renewing a contract creates a new row rather than continuing the same machine's record.

**Other industry gaps:** no structured preventive checklist or digital service report with signature · no priority/severity or SLA · no parts consumption tied to a visit/fault · no safety inspection/certificate/NCR workflow · no reliability KPIs (MTTR, MTBF, first-time-fix, utilisation) · no QR-at-the-car scan-to-identify flow.

### Preventive, corrective & work orders — verified detail

| Capability | Status | Evidence |
|---|---|---|
| Maintenance plan / visit frequency | Yes | Contract carries "# visits", "visit every N days", maintenance day, zone. |
| PM due / overdue tracking | Yes | تنفيذ الصيانة: 87 due, red/green by remaining visits & days. |
| Visit logging | Partial | "Register maintenance" + date + 5 notes + attachment + report. No checklist/signature/check-in-out. |
| Visit reminders | Yes | SMS to customer and to technician for tomorrow's visit. |
| Fault ticket | Yes | تسجيل عطل: fault text, fault time, tech-notified time, repair tech, repair time, repair report. |
| Fault confirmation | Yes | Customer confirmation code + technician confirmation code (OTP-style). |
| Open-faults list | Yes | أعطال مفتوحة: 8 live tickets with timestamps. |
| Priority / severity / SLA | No | Not present; status is free text. |
| Work order object | No | No unified job with parts + labour + checklist + cost. |
| Missed-maintenance report | Yes | صيانة دورية غير منفذة + "remaining to contract expiry". |

---

## J. UX / UI Audit

- **Consistency is a strength:** one predictable pattern across ~140 screens, with status colour coding where it matters (overdue visits, outstanding balances).
- **Density is the main problem:** forms cram 20–40 fields onto a few rows with no grouping, no required-field markers, no section headers, tiny targets.
- **Dropdowns** have no search/autocomplete; dependent fields aren't dynamically filtered.
- **No empty / loading / error states** beyond raw server error pages.
- **Dashboard** gives management nothing to act on at a glance.
- **Not responsive** — fixed wide layout; unusable on a phone, which matters because technicians are mobile.
- **Tables** support search, filter, pagination but lack column chooser, bulk actions, row-level quick actions.
- **Priority redesigns:** executive dashboard, elevator asset page, work-order screen, preventive-visit execution form (checklist + signature), mobile technician view.

---

## K. Security & Permissions

> **CRITICAL — plaintext passwords.** The Users & Permissions screen lists every user's password in clear text in the grid, and the value is present in the page source. Passwords are stored recoverably (not hashed) and exposed to anyone who can open that screen. **Remediate first:** hash+salt all passwords, remove the column from UI and markup, force a reset.

| Control | Finding | Severity |
|---|---|---|
| Password storage/display | Shown in cleartext in UI and HTML; not hashed. | Critical |
| Shared accounts | A single العميل (customer) login appears in user/audit lists — shared identity. | High |
| Authorization model | Granular per-screen × {Page/Add/Edit/Delete} + branch scope + flags (bypass-payments, view-all-elevators). | Positive |
| Permission verbs | No Approve / Assign / Export / Print as discrete rights. | Medium |
| Direct URL access | Pages reached by stable slugs; server-side per-record authorization (IDOR) to be re-verified. | Medium |
| Audit log | Exists (user + event type) but no before/after values, IP, or device. | Medium |
| Transport / session | HTTPS; password policy, lockout, session timeout not verified. | Not verified |
| PII exposure | Real customer PII visible to any logged-in user; no field-level masking. | Medium |

---

## L. Reporting Gaps

Present: many per-module list/export reports (offers, contracts, commissions, calls, surveys, installation phases, factory, warehouse issue, maintenance, faults, estimations, payments, remaining-balances). One chart reference (الرسم البيانى).

Missing KPIs: executive dashboard; maintenance compliance (scheduled/completed/missed); SLA (avg response/arrival/repair, compliance rate); reliability (**MTTR, MTBF**); field service (first-time-fix, jobs/technician, utilisation, avg job duration); financial (revenue/cost/gross profit, profit per contract/elevator, CLV).

---

## M. Integration Gaps

Current: SMS send (visit reminders, fault alerts), customer "send link". No documented REST API/webhooks observed. Needed integrations by priority: **ZATCA** (P0), WhatsApp + SMS gateway (P1), Maps/geocoding (P1), payment gateway (P2), accounting/ERP (P2), IoT elevator monitoring (P3).

## N. Mobile Strategy

| App | Required? | Why |
|---|---|---|
| Technician app | **Yes (core)** | Offline, camera, QR scan-at-car, checklist, parts, signature, GPS — eliminates field-data lag. |
| Supervisor app | Optional | Can be a role in the technician app initially (approve visits/faults, QA). |
| Customer app | Later (portal first) | A responsive customer portal covers most needs before a native app. |

## O. Customer Portal (recommended)

Dashboard (total elevators, active contracts, open tickets, upcoming maintenance) · Elevators (details, status, contract, maintenance & fault history) · Maintenance (schedule, completed visits, service reports) · Tickets (open, track, attachments, comments) · Finance (quotations, invoices, payments) · Documents (contracts, reports, certificates). Replace the shared العميل login with per-customer accounts.

---

## P–R. Recommended Target Model

**Future module architecture:**
```
Dashboard (role-based KPIs)
CRM          → Leads · Customers · Contacts · Quotations
Assets       → Sites · Buildings · Elevators · Components   ← new backbone
Contracts    → Contracts · SLA · Renewals
Maintenance  → Plans · Schedule · Visits · Checklists · Inspections
Service      → Tickets · Work Orders · Dispatch · Escalations
Field        → Technicians · Teams · Calendar · Map
Inventory    → Items · Warehouses · Vehicle stock · Transfers
Procurement  → Suppliers · Requests · RFQ · Purchase Orders
Finance      → Tax invoices (ZATCA) · Payments · Expenses · Profitability
Reports · Customer Portal · Notifications · Users & Permissions · Audit · Settings
```

**Ideal end-to-end operating model:**
```
Customer → Site → Building → Elevator (asset)
→ Maintenance Contract + SLA → Maintenance Plan → auto-generated Work Orders
→ Dispatch → Technician (mobile) → QR scan at car
→ Checklist → parts issued from stock → Customer signature
→ Service report → ZATCA tax invoice → Payment → KPIs

Corrective: Fault/IoT alert → Ticket (priority+SLA) → Work Order
→ Dispatch → Repair → Confirmation → Invoice (if billable) → KPIs
```

**Recommended core data model** — introduce `Elevator` as a first-class entity:
```
Company → Branch → Customer → Site → Building → Elevator
Elevator 1—* Contract · 1—* WorkOrder · 1—* Visit · 1—* FaultTicket · 1—* PartUsed · 1—* Document
Contract 1—* MaintenancePlan ; MaintenancePlan 1—* WorkOrder
WorkOrder *—1 Technician ; WorkOrder 1—* ChecklistItem ; WorkOrder 1—* PartUsed
Item *—* Warehouse (StockLevel) ; Supplier 1—* PurchaseOrder 1—* GoodsReceipt
Invoice *—1 Customer ; Invoice 1—* InvoiceLine ; Payment *—1 Invoice
```

---

## S. Recommended Roles (RBAC)

Explicit verbs (View / Create / Edit / Delete / **Approve** / **Assign** / **Close** / **Export**) and data scope (All / Branch / Team / Assigned / Own / Customer).

| Role | Scope | Key rights |
|---|---|---|
| Super / Company Admin | All | Everything incl. settings, users, pricing |
| Branch Manager | Branch | All operational + approvals within branch |
| Maintenance Manager | Branch | Contracts, plans, WOs, escalations, assign |
| Dispatcher | Team | Schedule/assign WOs, monitor SLA |
| Supervisor | Team | Approve visits/faults, QA checklists |
| Technician | Assigned | Mobile: execute WO, checklist, parts, signature |
| Sales Rep / Manager | Own / Branch | Leads, quotes, (manager) approve |
| Warehouse / Storekeeper | Branch | Stock, issue to WO, transfers, receipts |
| Procurement Officer | Company | PR/RFQ/PO, supplier management |
| Finance / Accountant | Company / Branch | Invoices, payments, ZATCA, reports |
| Customer | Customer | Portal: own assets, tickets, invoices, docs |
| Auditor | All (read) | Read-only + full audit log |

---

## T. Recommended Dashboards

- **Executive:** total/active/out-of-service elevators, active & expiring contracts, maintenance due/completed/missed, open & critical tickets, SLA breaches, technicians available, work orders today, low stock, monthly revenue/cost/profit.
- **Operations / Maintenance Manager:** compliance %, overdue visits, open faults by priority, technician load.
- **Dispatcher:** today's work orders, unassigned, map, ETA/SLA timers.
- **Technician (mobile):** today's jobs, next stop, checklist, parts.
- **Warehouse:** low stock, reservations, pending transfers/receipts.
- **Finance:** AR ageing, overdue payments, revenue vs cost, profit per contract/elevator.
- **Customer:** elevators, upcoming maintenance, open tickets, invoices.

## U. Recommended Reports

Maintenance (scheduled/completed/missed, compliance) · Faults (open/closed/critical/recurring) · SLA (response/arrival/repair, compliance) · Reliability (**MTTR, MTBF**) · Field service (first-time-fix, jobs/technician, utilisation, avg duration) · Financial (revenue, cost, gross profit, profit per contract/elevator, CLV) · Inventory (stock valuation, consumption, low-stock) · Procurement (PO status, supplier performance).

## V. Automation Roadmap (quick wins feasible on current data)

- Auto-reminders for contract expiry & renewal (expiry data already tracked).
- Auto-flag missed preventive visits (overdue list already exists — turn it into alerts).
- SLA timers on faults using existing fault/notify/repair timestamps.
- Payment-overdue reminders from existing AR balances.
- Later: auto-generate work orders from plans, SLA escalation, low-stock alerts, monthly scheduling.

## W. Integration Roadmap

P0: ZATCA Phase 2 e-invoicing. P1: WhatsApp + SMS gateway, Maps/geocoding. P2: payment gateway, accounting/ERP API, public REST API + webhooks. P3: IoT elevator monitoring.

---

## X. Product Roadmap

| Phase | Objective | Key work | Business value |
|---|---|---|---|
| **1 · Stabilise & secure** | Close critical risk, trust the data | Hash passwords, remove plaintext, force resets; per-customer logins; move off free hosting; controlled status enums; separate test data | Removes credential-breach risk; reliable data |
| **2 · Asset & work order** | Build the backbone | Introduce Elevator asset (serial/QR) + Work Order spine; migrate contract specs to assets; per-machine history | Everything else hangs on this |
| **3 · Field service & mobile** | Field quality & speed | Dispatch board + calendar + map; technician mobile app (offline, camera, QR, checklist, signature, GPS); SLA on tickets | First-time-fix, speed |
| **4 · Inventory & procurement** | Parts cost control | Spare-parts stock (warehouse + vehicle), reservations, transfers; suppliers, PR/RFQ/PO, goods receipt; parts issued against WOs | Margin control |
| **5 · Finance & portal** | Compliance & self-service | ZATCA Phase 2 e-invoicing (VAT-15%, QR, XML, clearance); profitability per contract/elevator; customer portal | Legal invoicing, margin, service |
| **6 · Automation & integrations** | Run ops with fewer hands | Auto-WO, SLA escalation, renewal & payment reminders, low-stock alerts; WhatsApp/push, maps, payment gateway, accounting API | Operational leverage |
| **7 · AI & IoT** | Differentiation | Predictive maintenance, technician copilot, smart scheduling, IoT telemetry → auto-ticket | After core maturity |

---

## Findings Classification (severity × type)

| Finding | Type | Severity |
|---|---|---|
| Passwords stored/shown in plaintext | Security | Critical |
| No elevator asset entity / lifecycle history | Architecture · Data | Critical |
| No VAT calculation / ZATCA e-invoice | Compliance | Critical |
| No work-order object | Functional · Architecture | Critical |
| Shared single customer login | Security | High |
| Fault/contract status as free text (no enum) | Data · Functional | High |
| No spare-parts stock / procurement | Functional | High |
| No dispatch board / mobile app / GPS | Functional · Operations | High |
| No executive KPI dashboard / reliability KPIs | Reporting | High |
| Intermittent server Runtime Errors (hosting) | Performance · Reliability | Medium |
| Dense forms, no grouping, not responsive | UX · UI | Medium |
| Data duplication across screens | Data | Medium |
| Leftover test records in live lists | Data | Low |

---

## Gap Analysis Matrix

| Module | Exists | Quality | Key missing features | Business impact | Priority |
|---|---|---|---|---|---|
| Elevator asset register | No | Critical | Asset entity, serial/QR, lifecycle history | No per-machine traceability | P0 |
| Security (passwords) | Partial | Critical | Hashing, remove plaintext, resets | Credential breach risk | P0 |
| Work orders | No | Critical | Unified job: labour+parts+checklist+cost | No single service record | P0 |
| Finance / ZATCA | Partial | Weak | VAT calc, e-invoice, GL, profitability | Compliance + margin blindness | P0 |
| CRM | Partial | Weak | Company/CR/VAT, hierarchy, pipeline | Weak customer master | P1 |
| Preventive maintenance | Yes | Average | Checklist, signature, check-in/out, auto-WO | Visit quality unproven | P1 |
| Corrective / faults | Yes | Average | Priority, SLA, status enum, escalation | No SLA assurance | P1 |
| Spare-parts inventory | No | Critical | Stock, min-stock, vehicle stock, transfers | No parts control/cost | P1 |
| Dispatch / field service | No | Critical | Board, calendar, map, GPS, routing | Manual scheduling | P1 |
| Mobile technician app | No | Critical | Offline, camera, QR, signature, GPS | Field data lag | P1 |
| Reporting / KPIs | Partial | Average | Exec dashboard, MTTR/MTBF, FTF, utilisation | Blind management | P1 |
| Customer portal | No | Critical | Self-service tickets, visits, invoices, docs | Service friction | P2 |
| Procurement | No | Critical | Suppliers, PR/RFQ/PO, goods receipt | Uncontrolled buying | P2 |
| Inspection / compliance | No | Critical | Safety inspection, NCR, certificates | Regulatory exposure | P2 |
| Automation engine | Partial | Weak | Auto-WO, escalation, reminders, renewals | Manual ops | P2 |
| Notifications centre | Partial | Average | Event rules, in-app centre, WhatsApp/push | Ad-hoc comms | P2 |
| IoT / predictive | No | — | Telemetry → auto-ticket, prediction | Future differentiation | P3 |

**Priority model:** P0 critical (core operation, security, billing, service delivery) · P1 high (day-to-day efficiency) · P2 medium (important, can wait) · P3 future (advanced/optimisation).

---

## Product Scoring (0–100)

| Area | Score |
|---|--:|
| Business coverage | 62 |
| Elevator asset management | 30 |
| Contract management | 65 |
| Preventive maintenance | 60 |
| Corrective maintenance | 55 |
| Field service | 35 |
| Inventory | 25 |
| Procurement | 5 |
| Finance | 35 |
| Reporting | 45 |
| UX / UI | 40 |
| Permissions | 60 |
| Security | 25 |
| Scalability | 45 |
| Saudi localization | 50 |
| **Overall** | **42 / 100** |

**Why 42:** an early-to-mid product with a strong, custom installation ERP and a workable maintenance register, held back by missing asset/work-order/inventory/portal layers, weak finance/compliance, and a critical security defect. The foundations make the gap closable by extension, not rebuild.

---

## Current vs Target Comparison

| Area | Current state | Target state | Gap | Priority |
|---|---|---|---|---|
| Elevator | Spec on contract | First-class asset w/ serial/QR + history | New entity + migration | P0 |
| Service record | Visits & faults in separate screens | Unified work order | New object | P0 |
| Invoicing | AR + PDF "claim" | ZATCA tax invoice (VAT, QR, XML) | Full e-invoicing | P0 |
| Security | Plaintext passwords | Hashed + per-customer logins | Remediation | P0 |
| Scheduling | Tech on contract | Dispatch board + map + GPS | New module | P1 |
| Field work | Back-office entry | Mobile app (offline, QR, signature) | New app | P1 |
| Parts | Quoted/sold only | Stock-controlled inventory | New module | P1 |
| Management view | Sales filter | Role-based KPI dashboards | New dashboards | P1 |
| Customer | Shared login + link | Self-service portal | New portal | P2 |
| Buying | None | Procurement (PO/RFQ/GRN) | New module | P2 |

---

## SaaS Future Vision (keep separate from immediate gaps)

The branch-aware, role-scoped architecture could evolve toward multi-tenant SaaS:
```
Platform → Tenant (Elevator Company) → Branches → Users → Customers → Sites → Elevators
```
Potential SaaS features: subscription plans, tenant limits, feature flags, billing, usage/storage limits, white-label, custom domain. Requires true tenant isolation, multi-currency readiness, and the AR→GL/ZATCA finance layer first.

---

## Method, Evidence & Limitations

Performed by logging into the live demo with the supplied `ghada` account and navigating read-only across all nine top modules and ~140 screens (quotations, installation and maintenance contracts, preventive execution, fault registration, open faults, accounts, estimations, pricing, users/permissions, audit log). Findings are based on direct observation.

**Not verified** (not reachable read-only without side effects): exact password/lockout policy, session timeout, contents of generated PDF/Excel claims (not downloaded), server-side authorization on direct record ids, some report internals.

**Reliability caveat:** several admin pages returned intermittent ASP.NET Runtime Errors, then loaded on retry — attributed to free-tier hosting, not confirmed code defects.

This document is structured to drop straight into a BRD / SRS, product backlog, UX redesign brief, data-model redesign, API design, and mobile-app requirements.
