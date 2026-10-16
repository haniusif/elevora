# Software Requirements Specification (SRS)
## Elevora — Elevator Operations Platform

**Product:** Elevora — Elevator Operations Platform (rebrand of the legacy "Link Lift" system)
**Companion documents:** `BRD-Elevator-Management-OS.md`, `Link-Lift-System-Audit.md`
**Version:** 1.0 (Draft) · **Date:** 16 Oct 2026 · **Status:** For review
**Conformance:** structured per IEEE-830 themes (introduction, overall description, specific requirements, data, external interfaces, non-functional).

> Requirement IDs: `FR-` functional, `NFR-` non-functional, `DR-` data, `IR-` interface. Each functional requirement carries a priority (**P0/P1/P2/P3**) and traces to a business requirement (`BR-xx`). "MUST / SHOULD / MAY" follow RFC-2119 intent.

---

## 1. Introduction

### 1.1 Purpose
Specify the functional and non-functional requirements for the target system so it can be designed, built, and tested. The system evolves the current Link Lift application (strong installation/manufacturing ERP; workable maintenance register) into a complete asset-and-field-service operating system.

### 1.2 Product scope
Modules: CRM, Assets, Contracts & SLA, Preventive Maintenance, Corrective Maintenance, Work Orders, Field Service & Dispatch, Technician Mobile App, Inventory, Procurement, Finance & ZATCA, Inspection/Compliance, Reporting & KPIs, Customer Portal, Notifications, Users/RBAC, Audit, Settings. The existing Sales/Installation/Factory/Warehouse flow is retained and integrated.

### 1.3 Definitions
- **Asset / Elevator** — a physical lift uniquely identified and tracked for life.
- **Work Order (WO)** — a unit of field work against an asset.
- **PM** — preventive maintenance; **CM** — corrective maintenance.
- **SLA** — service-level agreement (response/arrival/repair targets).
- **ZATCA** — Saudi Zakat, Tax and Customs Authority (e-invoicing).
- **MTTR / MTBF / FTF** — mean time to repair / mean time between failures / first-time-fix rate.

---

## 2. Overall Description

### 2.1 Product perspective
A server-rendered multi-user web application with a companion mobile app and a customer portal, sharing one domain model and API. Branch-scoped today, architected to allow future multi-tenancy. Integrates ZATCA e-invoicing, SMS/WhatsApp/email, maps, and a payment gateway.

### 2.2 User classes
Super/Company Admin, Branch Manager, Maintenance Manager, Dispatcher, Supervisor, Technician (mobile), Sales Rep/Manager, Warehouse/Storekeeper, Procurement Officer, Finance/Accountant, Customer (portal), Auditor (read-only).

### 2.3 Operating environment
Arabic-first, RTL, English secondary; web (desktop); mobile app (Android/iOS) with offline support; Saudi locale (SAR, VAT 15%, Hijri/Gregorian dates).

### 2.4 Design & implementation constraints
Must preserve and migrate existing data (125+ maintenance contracts, installation records); must integrate rather than replace the installation pricing/crew/factory engine; must meet ZATCA via an accredited integration.

---

## 3. Functional Requirements

### 3.1 Identity, RBAC & Audit (Foundation)
- **FR-01 (P0, BR-03)** Passwords MUST be hashed+salted (e.g. bcrypt/argon2); the system MUST NOT store or display any password in clear text. *Acceptance:* no password value exists in any UI, API response, or page source; a migration forces reset of all existing credentials.
- **FR-02 (P0, BR-03)** Each user and each customer MUST have an individual account; shared accounts are prohibited.
- **FR-03 (P0, BR-14)** The system MUST enforce RBAC per function with verbs: View, Create, Edit, Delete, Approve, Reject, Assign, Close, Export, Print.
- **FR-04 (P0, BR-14)** The system MUST enforce data scope per role: All companies, Own company, Own branch, Own team, Assigned records, Own records, Customer records. Financial data MUST be independently permissioned.
- **FR-05 (P0, BR-13)** Every state-changing action MUST write an audit record: actor, action, module, record id, old value, new value, IP, device, timestamp. Audit records are immutable and exportable.
- **FR-06 (P0)** Authentication MUST enforce a password policy, account lockout after repeated failures, and session timeout; all access over TLS.

### 3.2 CRM (Customers, Leads, Contacts)
- **FR-10 (P1, BR-10)** The customer record MUST support individual vs company type, customer code, company name, commercial registration, VAT number, national address, multiple contact persons, and separate billing and service addresses.
- **FR-11 (P1)** The system MUST support the hierarchy Customer → Branch/Account → Site → Building → Elevator.
- **FR-12 (P1)** Leads MUST capture source, assigned salesperson, sales stage, expected value, and follow-up activity; a lead converts to a customer without re-entry.
- **FR-13 (P2)** Periodic-call/follow-up activity logging MUST be retained (parity with current الاتصالات الدورية).

### 3.3 Elevator Asset Register
- **FR-20 (P0, BR-01)** The system MUST maintain each elevator as a unique asset: asset number, serial number, QR/barcode, manufacturer/brand, model, type, capacity/load, speed, number of stops/floors, door type/size, machine/controller/drive type, cabin type, installation/commissioning dates, warranty start/end, and current status.
- **FR-21 (P0, BR-01)** Each asset MUST link to its customer, site, building, active contract, and assigned technicians, and MUST expose a consolidated history: maintenance visits, faults, parts used, documents, photos, and inspections — persisting across contract renewals.
- **FR-22 (P1)** Technicians MUST be able to identify an asset by scanning its QR/barcode (web and mobile).
- **FR-23 (P1)** Asset status MUST be a controlled enum (e.g. Active, Under Maintenance, Out of Service, Decommissioned).
- **FR-24 (P1, BR-21)** On installation delivery, the system MUST auto-create the asset from the installation contract spec (no re-entry).

### 3.4 Contracts & SLA
- **FR-30 (P1, BR-16)** Maintenance contracts MUST support: contract number, customer, covered elevator(s) (one-to-many), contract type, maintenance type (comprehensive/non-comprehensive — parity + extension), start/end/renewal dates, auto-renewal flag, value, payment schedule, visit frequency and count, emergency coverage, spare-parts coverage, included/excluded services, SLA terms, response/repair times, penalties, and attachments.
- **FR-31 (P1, BR-16)** Contract status MUST be a controlled enum: Draft, Pending Approval, Active, Suspended, Expired, Renewal Due, Renewed, Cancelled.
- **FR-32 (P1, BR-12)** The system MUST flag renewal-due and expiring contracts and support one-click renewal that continues the same asset history.
- **FR-33 (P2)** Quotations/offers MUST support an approve/reject workflow with reason (parity with current العروض) and convert to contracts.

### 3.5 Preventive Maintenance
- **FR-40 (P1, BR-17)** From a contract's plan (frequency, day, zone), the system MUST auto-generate scheduled PM **work orders** on a calendar.
- **FR-41 (P1, BR-17)** The system MUST show due and overdue visits with clear status (retain current overdue colour coding) and never silently drop a due visit.
- **FR-42 (P1, BR-02)** PM execution MUST capture: assigned technician, check-in and check-out time, structured checklist with pass/fail per item, findings, photos, technician notes, customer signature, supervisor approval, and a service report.
- **FR-43 (P1)** PM visit lifecycle MUST be: Scheduled → Assigned → En Route → Started → Checklist → Findings → Completed → Customer Signed → Supervisor Approved → Closed.
- **FR-44 (P1, BR-12)** The system MUST send reminders to customer and technician before a scheduled visit (retain current SMS behaviour) across configurable channels.

### 3.6 Corrective Maintenance (Faults / Tickets)
- **FR-50 (P1, BR-18)** A fault ticket MUST capture: ticket number, elevator, customer, site, fault type, description, priority (Low/Normal/High/Critical/Emergency), severity, SLA, and timestamps (created, assigned, arrival, repair start, repair end).
- **FR-51 (P1, BR-18)** The ticket MUST capture root cause, corrective action, spare parts used, technician, supervisor, attachments, and customer confirmation (retain dual confirmation-code behaviour).
- **FR-52 (P1, BR-18)** Ticket status MUST be a controlled workflow: Open → Assigned → Acknowledged → En Route → On Site → Diagnosis → Waiting for Parts → Repairing → Testing → Resolved → Customer Confirmation → Closed, with Reopen and Escalation.
- **FR-53 (P1)** SLA timers MUST run from the ticket timestamps and raise SLA-warning and SLA-breach events.
- **FR-54 (P2)** The existing finance-gated dispatch rule (block dispatch when the customer has an overdue invoice) MUST be configurable, not hard-coded, and surfaced as a warning with override permission.

### 3.7 Work Orders (central object)
- **FR-60 (P0, BR-02)** A work order MUST support: WO number, source (Preventive, Fault, Inspection, Installation, Modernization, Customer Request, Internal), customer, site, elevator, contract, work type, priority, scheduled date, technician, supervisor, checklist, required/used parts, labour hours, travel time, attachments, notes, customer signature, and completion status.
- **FR-61 (P0, BR-02)** Every PM visit, fault repair, inspection, and part installation MUST be realised as a work order so each asset's full service history is assembled in one place.
- **FR-62 (P1, BR-07)** Parts issued on a work order MUST decrement stock (from warehouse or technician vehicle) and post to job cost.

### 3.8 Field Service & Dispatch
- **FR-70 (P1, BR-05)** A dispatch board/calendar MUST support drag-and-drop assignment, technician availability, shifts, and territory/zone assignment.
- **FR-71 (P1, BR-05)** The system MUST show technicians and jobs on a map with ETA; SHOULD support route optimisation.
- **FR-72 (P1)** Technician profiles MUST capture employee id, skills, certifications, region, team, supervisor, assigned vehicle, current jobs, job history, and performance KPIs.

### 3.9 Technician Mobile App
- **FR-80 (P1, BR-06)** The mobile app MUST provide: login, home, today's jobs, calendar, job/task details, customer/site/elevator details, QR scanner, start job, checklist, report fault, add findings, spare parts, upload photos, notes, customer signature, complete job, job history, notifications, profile.
- **FR-81 (P1, BR-06)** The app MUST support Arabic/English/RTL, push notifications, camera, GPS, QR scanning, **offline mode with background sync**, and location verification at check-in.

### 3.10 Inventory
- **FR-90 (P1, BR-07)** Items MUST carry SKU, name, category, brand, supplier, unit, purchase cost, selling price, available/reserved quantity, minimum stock, and reorder point (extend current parts price list).
- **FR-91 (P1, BR-07)** Stock MUST be tracked per location: Main Warehouse, Branch Warehouse, Technician Vehicle, Project Site.
- **FR-92 (P1, BR-07)** The system MUST support stock in, stock out, transfer, reservation, adjustment, return, and damaged-stock operations, and issue parts directly against work orders.
- **FR-93 (P2, BR-12)** The system MUST raise low-stock/reorder alerts.

### 3.11 Procurement
- **FR-100 (P2, BR-08)** The system MUST support suppliers, purchase requests, RFQ, supplier quotations, purchase orders with approval, goods receipt, supplier invoices, and returns.
- **FR-101 (P2, BR-08)** Procurement flow MUST be: Purchase Request → Approval → RFQ → Supplier Selection → Purchase Order → Receive → Warehouse → Supplier Invoice. Goods receipt MUST update stock.

### 3.12 Finance & ZATCA
- **FR-110 (P0, BR-04)** The system MUST compute VAT at 15% and issue **ZATCA Phase-2 compliant tax invoices** (required tax-invoice fields, QR code, XML, clearance/reporting) for contract, repair, and spare-parts billing. *Acceptance:* invoices pass ZATCA validation via the accredited integration.
- **FR-111 (P1, BR-04)** The system MUST support credit notes, payments, receivables, and AR ageing (retain current price/paid/outstanding/due tracking and PDF/Excel statements).
- **FR-112 (P1, BR-19)** The system MUST compute revenue, cost, and gross/net profit per customer, per contract, and per elevator, including spare-parts cost and technician labour cost.
- **FR-113 (P2)** Expenses and cost centres SHOULD be supported or integrated with the company's accounting system.

### 3.13 Inspection & Compliance
- **FR-120 (P2, BR-11)** The system MUST support safety and quality inspections with checklists, defects/observations, NCRs, corrective actions, evidence, approval, and inspection certificates, linked to the asset.

### 3.14 Reporting & KPIs
- **FR-130 (P1, BR-09)** The system MUST provide role-based KPI dashboards (Executive, Operations/Maintenance Manager, Dispatcher, Technician, Warehouse, Finance, Customer) with date/branch/team/technician/customer filters.
- **FR-131 (P1, BR-09)** The system MUST compute and report: maintenance compliance (scheduled/completed/missed), fault KPIs (open/closed/critical/recurring), SLA (avg response/arrival/repair, compliance rate), reliability (**MTTR**, **MTBF**), field service (**first-time-fix**, jobs/technician, utilisation, avg job duration), and financial (revenue, cost, gross profit, profit per contract/elevator, CLV).
  - MTTR = total repair time ÷ number of repairs; MTBF = total operating time ÷ number of failures.
- **FR-132 (P2)** All list reports MUST support search, filter, sort, pagination, column selection, and export (retain current per-module reports).

### 3.15 Customer Portal
- **FR-140 (P2, BR-10)** Customers MUST access, for their own records only: dashboard (elevators, active contracts, open tickets, upcoming maintenance), elevator details & history, maintenance schedule/completed visits/service reports, ticket open/track/attachments/comments, finance (quotations, invoices, payments), and documents (contracts, reports, certificates).

### 3.16 Notifications & Automation
- **FR-150 (P1, BR-12)** The system MUST send event-driven notifications for: new ticket, technician assigned/arrived, job completed, contract expiry/renewal, maintenance due/missed, SLA warning/breach, invoice due/overdue, low stock, purchase approval.
- **FR-151 (P2, BR-20)** Notification routing (in-app/email/SMS/WhatsApp/push) and approval workflows MUST be configurable by business event, not hard-coded.

### 3.17 Preserve existing engine (non-regression)
- **FR-160 (P0, BR-21)** The system MUST retain installation sales → quote(approve/reject) → contract → factory production → warehouse material issue → phased installation (rail&door/machine/cabin/electric) → delivery → staged collection, the parametric pricing/costing engine, and per-component crew assignment, integrated with the asset and finance layers.

---

## 4. Data Requirements

- **DR-01** Core entities and relationships:
```
Company → Branch → Customer → Site → Building → Elevator
Elevator 1—* Contract · 1—* WorkOrder · 1—* Visit · 1—* FaultTicket · 1—* PartUsed · 1—* Document · 1—* Inspection
Contract 1—* MaintenancePlan ; MaintenancePlan 1—* WorkOrder (generated)
WorkOrder *—1 Technician ; WorkOrder 1—* ChecklistItem ; WorkOrder 1—* PartUsed
Item *—* Warehouse (StockLevel) ; Supplier 1—* PurchaseOrder 1—* GoodsReceipt
Invoice *—1 Customer ; Invoice 1—* InvoiceLine ; Payment *—1 Invoice
User *—1 Role ; Role 1—* Permission
```
- **DR-02** Shared reference data (customer, elevator spec, address) MUST be stored once and referenced; re-capture across screens is eliminated (fixes current duplication).
- **DR-03** Controlled enumerations MUST replace free-text statuses for asset, contract, work order, fault ticket, invoice, and purchase order.
- **DR-04** Test data MUST be isolated from production (environment or flag); no test records in live operational lists.
- **DR-05** All monetary values in SAR with 2 decimals; VAT rate stored as configurable (default 15%). Dates stored in UTC, displayed per locale with Hijri option.
- **DR-06** Migration: existing installation and 125+ maintenance contracts, their embedded elevator specs, parties, payments, faults, and the event log MUST be migrated; each embedded elevator spec becomes an `Elevator` asset with preserved history.

---

## 5. External Interface Requirements

- **IR-01 (P0)** **ZATCA e-invoicing** via an accredited solution provider (invoice clearance/reporting, QR, XML).
- **IR-02 (P1)** **SMS & WhatsApp gateway** for notifications and confirmation codes.
- **IR-03 (P1)** **Email** for notifications and document delivery.
- **IR-04 (P1)** **Maps/geocoding** for dispatch, routing, and ETA.
- **IR-05 (P2)** **Payment gateway** for online customer payments.
- **IR-06 (P2)** **Accounting/ERP** integration (or GL export) for finance.
- **IR-07 (P2)** **Public REST API + webhooks** (authenticated, versioned, paginated, filterable, consistent errors) for integrations and the mobile app/portal.
- **IR-08 (P3)** **IoT telemetry** ingestion (elevator running/stopped, door, floor, error code, trips) to auto-create fault tickets.

---

## 6. Non-Functional Requirements

### 6.1 Security (P0)
- **NFR-01** Passwords hashed+salted; no secret in logs, URLs, or client storage.
- **NFR-02** Protection against OWASP Top 10: CSRF tokens on state-changing requests, output encoding (XSS), parameterised queries (SQLi), and object-level authorization checks to prevent IDOR on record ids.
- **NFR-03** PII (national ID, phone) access restricted by role; sensitive fields masked where not required; data encrypted in transit (TLS) and at rest.
- **NFR-04** Full, immutable audit trail (per FR-05); login attempts rate-limited.

### 6.2 Availability & reliability
- **NFR-10** Production availability target ≥ 99.5% monthly; no reliance on free-tier hosting. The intermittent Runtime Errors observed in audit MUST NOT occur in production.
- **NFR-11** Automated daily backups with tested restore; RPO ≤ 24h, RTO ≤ 4h.

### 6.3 Performance & scalability
- **NFR-20** Interactive pages respond < 2s (p95) under expected branch load; list pages paginate server-side.
- **NFR-21** Architecture supports multiple branches and growth to multi-tenant without redesign (branch/tenant scoping in the data model).

### 6.4 Usability & accessibility
- **NFR-30** Arabic-first, full RTL; English secondary; consistent navigation; forms grouped with required-field indicators, searchable dropdowns, and dependent-field filtering.
- **NFR-31** Responsive web for desktop and tablet; proper empty/loading/error states (no raw server error pages to users).
- **NFR-32** Mobile app usable offline in the field; large touch targets; clear job flow.

### 6.5 Localization & compliance
- **NFR-40** SAR currency; VAT 15% configurable; Gregorian + Hijri dates; Arabic tax invoice; ZATCA Phase-1 and Phase-2 conformance; commercial registration and national address supported.

### 6.6 Maintainability & portability
- **NFR-50** Layered architecture (domain, services, API, UI) enabling the web app, mobile app, and portal to share one API and model; configuration (pricing, payment schemes, notification rules, roles) is data-driven, not code.

---

## 7. Priority Summary & Traceability

| Priority | Scope | Representative FRs |
|---|---|---|
| **P0** | Security, asset, work order, ZATCA, non-regression | FR-01..06, FR-20/21, FR-60/61, FR-110, FR-160 |
| **P1** | Maintenance lifecycle, field service, mobile, inventory, KPIs, CRM | FR-10/11, FR-30/31, FR-40..44, FR-50..53, FR-70..72, FR-80/81, FR-90..92, FR-111/112, FR-130/131 |
| **P2** | Procurement, portal, inspection, automation config, expenses | FR-100/101, FR-120, FR-140, FR-151, FR-54, FR-93, FR-113 |
| **P3** | IoT, predictive, SaaS | IR-08, plus AI/IoT roadmap items |

**Traceability:** each `FR-xx` cites its originating `BR-xx`; each `BR-xx` derives from an audited gap in `Link-Lift-System-Audit.md`. This chain supports forward (business → system → test) and backward (defect → requirement → goal) traceability.

---

## 8. Acceptance & Verification

- Each FR is verified by one or more test cases; P0 FRs additionally require a security and (for FR-110) a ZATCA validation sign-off.
- Non-regression suite MUST confirm the installation/pricing/factory engine (FR-160) is unchanged in behaviour after each phase.
- Migration (DR-06) is accepted when all live contracts, assets, parties, and history reconcile against the source system with zero loss.
