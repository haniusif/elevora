# Implementation Plan — Release Roadmap

**Phase:** Architecture Readiness v1.1 output (plan only; no application code yet).
**Maps:** BRD roadmap phases 1–7 and Backlog epics E1–E21 onto technical releases R0–R9.
**Each release:** objective · scope (stories) · entry criteria · exit criteria (Definition of Done).

> Estimates are indicative; sequence and dependencies are the binding part. Releases R1–R4 deliver the core operating system; R0 precedes all coding.

---

## R0 — Architecture & Migration Preparation *(this phase + setup)*
**Objective:** freeze the architecture baseline and prepare migration before any feature code.
**Scope:** architecture freeze (this doc set), `schema-v1.1.sql`, migration mapping (`MIGRATION_PLAN.md`), API conventions (`API_CONVENTIONS.md`), security baseline (`SECURITY_ARCHITECTURE.md`), environment/CI skeleton. Stories: US-101/102/109 (migration mapping design), US-087/091 (backup/secrets design).
**Entry:** readiness report ≥ "READY WITH CONDITIONS".
**Exit (DoD):** schema v1.1 reviewed & applied to a dev DB; migration source→target map documented; CI pipeline runs; secrets vault + encrypted storage provisioned; API conventions agreed.

## R1 — Security & Platform Foundation *(BRD Phase 1 · E1, E2, E20 core)*
**Objective:** secure, reliable, observable platform with identity/RBAC/tenant/audit.
**Scope:** US-001..006 (hashing, unified identity, RBAC, data scope, auth hardening), US-007 (append-only audit), US-008 (enums), US-009 (reliable hosting/env separation), US-087..091 (backup/restore, RPO/RTO, p95 baseline, pagination, encryption/secrets), US-099 (observability), US-100 (DR runbook).
**Entry:** R0 exit met.
**Exit (DoD):** no plaintext anywhere; RLS + server-side scope enforced and negative-tested; audit append-only verified; backup/restore drill passes RPO≤24h/RTO≤4h; p95 dashboard live; cross-tenant/branch access test fails closed.

## R2 — CRM + Elevator Asset + Work Order *(BRD Phase 2 · E3, E4, E5, E18, E21 start)*
**Objective:** the asset and work-order backbone + customer master; begin migration.
**Scope:** US-021..024 (customer master/hierarchy/lead/dedup), US-010..015 (elevator asset, components, QR, status, auto-create on delivery), US-016..020 (work order, multi-tech, status, completion/signature), US-081/082 (preserve installation flow + pricing as data), US-101..103 (migrate customers, derive assets, migrate maintenance contracts).
**Entry:** R1 exit met.
**Exit (DoD):** every elevator is an asset with QR + history; work orders created for sample jobs; legacy customers + assets + maintenance contracts migrated and reconciled; installation engine non-regression suite green.

## R3 — Contracts + PM + CM + SLA *(BRD Phase 3 part · E6, E7, E8, E21 cont.)*
**Objective:** full maintenance lifecycle with SLA.
**Scope:** US-025..029 (contracts, multi-elevator, status, renewal continuity, quote→contract), US-112/113 (agreement supertype, billing schedule→invoices), US-030..035 (PM auto-WO, due/overdue, structured visit, lifecycle, reminders, missed), US-036..041 (fault ticket, repair+confirm, workflow, SLA timers, configurable dispatch rule, open-faults board), US-104..106 (migrate installation/PM/fault history).
**Exit (DoD):** PM work orders auto-generate; overdue parity with legacy; faults carry full timestamps + SLA events + escalation; renewals preserve asset history.

## R4 — Dispatch + Technician App *(BRD Phase 3 part · E9, E10)*
**Objective:** field execution and mobility.
**Scope:** US-042..045 (dispatch board, map/ETA, technician profiles, zones), US-046..050 (mobile job list, execution, offline sync, QR/camera/GPS, AR/EN/RTL+push), US-117 (offline conflict rules), US-096 (maps integration).
**Exit (DoD):** dispatcher assigns multi-tech jobs on a board/map; technician completes a job offline with checklist + parts + signature + GPS; sync resolves conflicts deterministically.

## R5 — Inventory + Procurement *(BRD Phase 4 · E11, E12)*
**Objective:** parts and purchasing control.
**Scope:** US-051..055 (item master, multi-location stock, operations, issue-to-WO, low-stock), US-114 (vehicle/vehicle-assignment), US-056..059 (suppliers/PR, RFQ, PO approval, line-level GRN + supplier invoice + returns), US-107 (payment migration prep).
**Exit (DoD):** stock changes only via `stock_txn`; `stock_level` reconciles to ledger; parts issued on WOs post to job cost; full procurement chain operates with per-entity lifecycles.

## R6 — Finance + ZATCA *(BRD Phase 5 part · E13)*
**Objective:** compliant invoicing and profitability.
**Scope:** US-060..065 (ZATCA Phase-2 invoices, billing from contract/repair/parts, payments+AR, credit notes, profitability, expenses/GL export), US-097/098 (payment gateway, accounting integration), US-107 (payment migration execute).
**Exit (DoD):** invoices pass ZATCA validation (QR/XML/clearance), idempotent submission; profitability views (no fan-out) match hand calc; AR ageing correct; financial totals reconcile post-migration.

## R7 — Portal + Compliance *(BRD Phase 5 part · E14, E15)*
**Objective:** customer self-service and inspections.
**Scope:** US-066..069 (portal dashboard/tickets/finance/docs/history), US-116 (document access-level + customer visibility), US-070/071/115 (inspections, NCR, certificates, templates).
**Exit (DoD):** customers see only `customer_visible` data scoped to themselves; inspections produce NCRs + certificates; no internal document leaks to portal.

## R8 — Reporting + Automation + Integrations *(BRD Phase 6 · E16, E17, E20 rest)*
**Objective:** insight and event-driven automation.
**Scope:** US-072..076 (exec + role dashboards, MTTR/MTBF, FTF, compliance/SLA KPIs), US-077..080 (event notifications, multi-channel, configurable rules, automation quick wins), US-092/093/094/095 (public API v1, signed webhooks, SMS/WhatsApp, email).
**Exit (DoD):** dashboards live with correct KPIs; notifications driven by rules; public API + signed idempotent webhooks in production; automation (expiry/missed-visit/SLA/overdue) running.

## R9 — AI + IoT *(BRD Phase 7 · E19)*
**Objective:** differentiation after operational data matures.
**Scope:** US-084..086 (predictive maintenance, technician copilot, IoT auto-ticket).
**Entry:** ≥ 6–12 months of clean operational data.
**Exit (DoD):** predictive flags validated against actuals; IoT signals create tickets via the same Service path.

---

## Cutover (end of R6, with migration)
Execute US-110 (reconciliation) and US-111 (cutover/rollback): reconciliation report passes (counts, financial totals, asset links, traceability), test data excluded, no plaintext imported; rollback rehearsed. Go-live only on a green reconciliation.

## Critical path & dependencies
R0 → R1 → R2 → R3 → {R4, R5} → R6 → {R7, R8} → R9. R5 (inventory) is a prerequisite for R6 parts billing and for R4 vehicle stock issue. Migration (E21) threads through R2–R6 and gates cutover at R6.
