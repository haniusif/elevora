# Business Requirements Document (BRD)
## Elevora — Elevator Operations Platform

**Product:** Elevora — Elevator Operations Platform (rebrand of the legacy "Link Lift" system)
**Prepared for:** مصادر غادة للتشغيل والصيانة (Masader Ghada) and the Elevora product team
**Based on:** Live audit of the current Link Lift system (see `Link-Lift-System-Audit.md`)
**Version:** 1.0 (Draft) · **Date:** 16 Oct 2026
**Status:** For review

> This BRD states **what the business needs and why**. The companion **SRS** (`SRS-Elevator-Management-OS.md`) states **how the system must behave** to meet these needs. Requirement IDs here (`BR-xx`) are traceable to functional requirements (`FR-xx`) in the SRS.

---

## 1. Document Purpose & Scope

### 1.1 Purpose
Define the business goals, stakeholders, scope, and high-level requirements for evolving the legacy Link Lift system from a manufacturing-and-installation ERP into **Elevora — a complete Elevator Operations Platform** that runs the full commercial and field-service lifecycle.

### 1.2 Background
The current system is a vertically specialised, in-house ASP.NET application organised around business-process phases (Sales → Installation → Factory → Warehouse → Maintenance → Accounts). Its installation/manufacturing capabilities are strong; its maintenance side is a solid contract register with real operational features (visit-frequency planning, overdue tracking, fault logging with timestamps, SMS to customer and technician). It lacks an asset register, work orders, spare-parts inventory, procurement, a customer portal, KPI dashboards, and VAT/ZATCA e-invoicing, and it has a critical security defect (plaintext passwords). Current maturity: **42/100**.

### 1.3 In scope
CRM, Elevator Assets, Contracts & SLA, Preventive & Corrective Maintenance, Work Orders, Field Service & Dispatch, Technician Mobile App, Inventory, Procurement, Finance (incl. ZATCA e-invoicing), Reporting & KPIs, Customer Portal, Notifications, RBAC, Audit, and Settings. The existing Sales/Installation/Factory engine is **retained and integrated**, not replaced.

### 1.4 Out of scope (this phase)
Full general-ledger accounting replacement (integrate instead), native customer mobile app (portal first), IoT hardware procurement, and SaaS multi-tenant commercialisation (kept as a future vision in §9).

---

## 2. Business Goals & Objectives

| # | Business goal | Success measure |
|---|---|---|
| G1 | Protect customer and company data | 0 plaintext credentials; all access role-controlled and audited |
| G2 | Guarantee service delivery against contracts | Preventive-maintenance compliance ≥ 95%; 0 silently missed visits |
| G3 | Make field operations fast and accountable | First-time-fix ≥ 80%; SLA response/repair measured and met |
| G4 | Control parts and procurement cost | Parts traceable from PO → stock → work order; stock accuracy ≥ 98% |
| G5 | Be legally compliant for Saudi invoicing | 100% of tax invoices ZATCA Phase-2 compliant |
| G6 | Give management a real-time operating picture | Executive KPI dashboard adopted by all managers |
| G7 | Improve customer experience & retention | Self-service portal; contract renewal rate ↑; response time ↓ |
| G8 | Preserve the installation/manufacturing strengths | No regression in pricing, crew assignment, or production flow |

---

## 3. Stakeholders

| Stakeholder | Interest / need |
|---|---|
| Company owner / GM | Profitability, growth, risk control, KPIs |
| Branch Manager | Branch P&L, staff, service quality |
| Maintenance Manager | Contract fulfilment, technician productivity, SLA |
| Dispatcher | Scheduling, assignment, SLA monitoring |
| Supervisor | Visit/fault quality assurance, approvals |
| Technician | Clear jobs, parts, mobile tools in the field |
| Sales (rep/manager) | Leads, quotes, approvals, commissions |
| Warehouse / Storekeeper | Stock accuracy, issue to jobs, transfers |
| Procurement Officer | Supplier management, purchasing control |
| Finance / Accountant | Invoicing, collections, VAT/ZATCA, reporting |
| Customer | Service visibility, tickets, invoices, documents |
| Auditor / Compliance | Traceability, audit log, regulatory compliance |

---

## 4. Current State vs Desired State

| Area | Current | Desired | Business requirement |
|---|---|---|---|
| Elevator | Spec stored on each contract | First-class asset with serial/QR and full lifecycle history | BR-01 |
| Service record | Visits & faults in separate screens | Single work order per job (labour, parts, checklist, cost) | BR-02 |
| Security | Passwords in plaintext; shared customer login | Hashed credentials; per-user/per-customer accounts | BR-03 |
| Invoicing | AR + PDF "financial claim" | ZATCA-compliant tax invoices | BR-04 |
| Scheduling | Technician named on contract | Dispatch board, calendar, map, GPS, routing | BR-05 |
| Field work | Recorded back-office | Mobile app: offline, camera, QR, checklist, signature | BR-06 |
| Parts | Quoted & sold only | Stock-controlled inventory (warehouse + vehicle) | BR-07 |
| Buying | None | Procurement: suppliers, PR/RFQ/PO, goods receipt | BR-08 |
| Management view | Sales filter form | Role-based KPI dashboards (MTTR, MTBF, FTF, compliance) | BR-09 |
| Customer | Shared login + "send link" | Self-service portal | BR-10 |
| Compliance | None structured | Safety inspection, NCR, certificates | BR-11 |
| Automation | Manual | Expiry/renewal/missed-visit/SLA/payment reminders | BR-12 |

---

## 5. Business Requirements (BR)

Priority: **P0** critical (operation, security, billing, service delivery) · **P1** high · **P2** medium · **P3** future.

### 5.1 Foundation & security (P0)
- **BR-03** All credentials must be stored irreversibly (hashed+salted); no password is ever displayed. Every customer has an individual account; shared logins are removed.
- **BR-13** Every create/update/delete/approve/assign/status-change is recorded in an audit trail with actor, timestamp, and before/after values.
- **BR-14** Access to every function and data record is governed by role and data scope (company/branch/team/assigned/own/customer).
- **BR-15** The system must run on reliable hosting with defined availability (see NFRs); intermittent outages observed today are unacceptable in production.

### 5.2 Asset & service backbone (P0)
- **BR-01** Each elevator is a managed asset with a unique identity (asset no., serial, QR/barcode), technical specification, location (customer→site→building), and complete history (maintenance, faults, parts, documents) that persists across contract renewals.
- **BR-02** All field work (preventive visit, corrective repair, installation, inspection, part replacement) is captured as a **work order** linking the asset, technician, checklist, parts used, labour, attachments, customer signature, and cost.

### 5.3 Contracts & maintenance (P1)
- **BR-16** Maintenance contracts carry an explicit lifecycle status and SLA terms (response/arrival/repair targets, coverage, penalties), and can cover multiple elevators.
- **BR-17** Preventive maintenance plans auto-generate scheduled work orders by visit frequency; due and overdue visits are visible and alerted; nothing is silently missed.
- **BR-18** Corrective faults are tickets with priority/severity, SLA timers, structured root-cause/corrective-action, status workflow, escalation, and reopen.

### 5.4 Field service & mobile (P1)
- **BR-05** Dispatchers schedule and assign work orders on a board/calendar with technician availability, territory, map, and ETA.
- **BR-06** Technicians work from a mobile app supporting Arabic/English/RTL, offline mode with background sync, camera, GPS, QR scanning, checklists, and on-site customer signature.

### 5.5 Inventory & procurement (P1–P2)
- **BR-07** Spare parts are stock-controlled across main warehouse, branch warehouse, and technician vehicle, with min-stock, reservations, transfers, adjustments, and issue directly against work orders.
- **BR-08** Procurement supports suppliers, purchase requests, RFQ, purchase orders with approval, goods receipt, and supplier invoices.

### 5.6 Finance & compliance (P0–P2)
- **BR-04** The system issues ZATCA Phase-2 compliant tax invoices (VAT 15%, QR code, XML, clearance/reporting) for contracts, repairs, and parts, with credit notes and payment tracking.
- **BR-19** The system computes profitability (revenue, cost, gross/net profit) per customer, contract, and elevator.
- **BR-11** Safety/quality inspections produce defect/NCR records, corrective actions, evidence, and certificates.

### 5.7 Experience, insight & automation (P1–P2)
- **BR-09** Role-based KPI dashboards present the live operating picture (elevators, contracts, visits, tickets, SLA, technicians, stock, revenue, profit, MTTR, MTBF, first-time-fix).
- **BR-10** Customers use a self-service portal for assets, maintenance schedule/history, tickets, invoices, and documents.
- **BR-12** The system automatically sends contract-expiry/renewal, missed-visit, SLA-warning/breach, invoice-due/overdue, and low-stock notifications across in-app/SMS/WhatsApp/email.
- **BR-20** Notifications and approvals are configurable by business event rather than hard-coded.

### 5.8 Preserve existing strengths (P0, non-regression)
- **BR-21** The installation sales → quote(approve/reject) → contract → factory → warehouse → phased install → delivery → staged-collection flow, the parametric pricing engine, and per-component crew assignment are retained and integrated with the new asset/finance layers.

---

## 6. Assumptions, Constraints & Dependencies

- **Assumptions:** the business continues to both manufacture/install and maintain elevators; Riyadh-first with multi-branch expansion; Arabic is the primary language.
- **Constraints:** Saudi regulatory environment (ZATCA, VAT 15%, national address, commercial registration); migration must preserve 125+ live maintenance contracts and installation data.
- **Dependencies:** ZATCA integration/accredited solution provider; SMS/WhatsApp gateway; maps/geocoding provider; payment gateway; reliable hosting.

---

## 7. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Plaintext passwords exploited before fix | Credential/data breach | Remediate in Phase 1 before any other work |
| Data migration loses history | Operational disruption | Model `Elevator` asset early; migrate contract specs with validation |
| ZATCA non-compliance | Legal/financial penalties | Use accredited e-invoicing integration; do not self-certify |
| Field adoption of mobile app | Data still lags | Involve technicians early; offline-first; simple UX |
| Scope creep from "rebuild everything" | Delay | Extend, don't rebuild; phased roadmap |

---

## 8. High-Level Roadmap (business view)

| Phase | Objective | Business value |
|---|---|---|
| 1 · Stabilise & secure | Fix credentials, reliable hosting, status enums, clean test data | Removes critical risk; trustworthy data |
| 2 · Asset & work order | Elevator asset + work-order spine; migrate specs | The backbone for everything |
| 3 · Field service & mobile | Dispatch + mobile app + SLA | First-time-fix, speed, accountability |
| 4 · Inventory & procurement | Stock control + purchasing | Parts cost control |
| 5 · Finance & portal | ZATCA invoicing, profitability, customer portal | Compliance, margin, retention |
| 6 · Automation & integrations | Event-driven reminders/escalations; gateways | Operational leverage |
| 7 · AI & IoT | Predictive maintenance, copilot, telemetry | Differentiation |

---

## 9. Future Vision — SaaS (separate from immediate scope)

The branch-aware, role-scoped architecture can later support multi-tenant SaaS:
`Platform → Tenant (Elevator Company) → Branches → Users → Customers → Sites → Elevators`, with subscription plans, feature flags, usage/storage limits, white-label, and custom domains. Prerequisites: tenant isolation, multi-currency readiness, and the full finance/ZATCA layer. Kept out of current delivery scope.

---

## 10. Acceptance of this BRD

Approved scope and priorities become the baseline for the SRS and the product backlog. Material changes are handled through change control with impact assessment on cost, schedule, and the roadmap above.
