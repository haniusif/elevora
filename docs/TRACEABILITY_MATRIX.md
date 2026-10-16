# Traceability Matrix — Architecture Readiness v1.1

**Scope:** Audit → BRD → SRS → Backlog → Schema, with gap status per thread.
**Sources:** `Link-Lift-System-Audit.md`, `BRD-…md`, `SRS-…md`, `Backlog-…md/.csv`, `schema.sql` (draft), `schema-v1.1.sql` (corrected).
**Status values:** `Covered` · `Partial` · `Missing` · `Conflict` · `Not Applicable`.
**Schema column** names the entity in **schema-v1.1.sql** (v1.1) where it differs from the draft.

> How to read: each row is one capability thread. "Partial/Missing/Conflict" rows are the actionable backlog for v1.1 and are consolidated in §4. Schema corrections are detailed in `SCHEMA_GAPS.md`; requirement amendments in `SRS_V1.1_GAPS.md`.

---

## 1. Primary traceability matrix

| # | Audit Finding | BR | FR/NFR/DR/IR | Epic | Story | Schema Entity (v1.1) | Status | Gap |
|---|---|---|---|---|---|---|---|---|
| T01 | Plaintext passwords (CRITICAL) | BR-03 | FR-01, NFR-01 | E1 | US-001, US-002 | `auth_user.password_hash` | Covered | Draft had `app_user`+`customer_user` split; unified in v1.1 |
| T02 | Shared customer login | BR-03 | FR-02 | E1 | US-003 | `auth_user`+`customer_profile` | Covered | Unified identity (SCHEMA_GAPS #2) |
| T03 | Only Page/Add/Edit/Delete perms | BR-14 | FR-03 | E1 | US-004 | `role`,`permission` | Covered | Verb set widened to 10 verbs |
| T04 | No data-scope enforcement | BR-14 | FR-04, NFR-02 | E1 | US-005 | RLS + `role.data_scope` | Partial | Needs RLS policies + app middleware (SEC arch) |
| T05 | Auth hardening unknown | — | FR-06, NFR-01 | E1 | US-006 | `auth_user` lockout cols | Covered | — |
| T06 | Audit log lacks old/new/IP/device | BR-13 | FR-05 | E2 | US-007 | `audit_log` (append-only) | Partial | Immutability enforcement added (SCHEMA_GAPS #3) |
| T07 | Free-text statuses | DR-03 | FR-31, FR-52 | E2 | US-008 | enum types | Covered | — |
| T08 | Intermittent Runtime Errors / free hosting | BR-15 | NFR-10, NFR-11 | E2, E20 | US-009, US-087..089 | N/A (infra) | Partial | DevOps stories added (E20) |
| T09 | Elevator spec on contract, no asset | BR-01 | FR-20, FR-21 | E3 | US-010..012 | `elevator`,`elevator_component` | Covered | Component table added |
| T10 | No QR identify | BR-01 | FR-22 | E3 | US-013 | `elevator.qr_code` | Covered | — |
| T11 | No asset status lifecycle | BR-01 | FR-23 | E3 | US-014 | `asset_status` enum | Covered | — |
| T12 | Asset not auto-created on delivery | BR-21 | FR-24 | E3 | US-015 | `installation_contract.elevator_id` | Covered | — |
| T13 | No work-order object | BR-02 | FR-60, FR-61 | E4 | US-016, US-017 | `work_order`,`work_type` | Covered | `work_type` reference added |
| T14 | WO single technician only | BR-02 | FR-60 | E4 | US-016 | `work_order_assignment` | Partial→Covered | Multi-tech table added (SCHEMA_GAPS #8) |
| T15 | Parts not tied to job | BR-07 | FR-62 | E4, E11 | US-018, US-054 | `work_order_part`,`stock_txn` | Covered | — |
| T16 | No customer master depth | BR-10 | FR-10 | E5 | US-021 | `customer`,`contact_person` | Covered | — |
| T17 | No customer hierarchy | — | FR-11 | E5 | US-022 | `customer_account`,`site`,`building` | Covered | `customer_account` added (SCHEMA_GAPS #5) |
| T18 | No lead pipeline | — | FR-12 | E5 | US-023 | `lead` | Covered | — |
| T19 | Data duplication across screens | — | DR-02 | E5 | US-024 | FK references | Covered | Enforced by normalized model |
| T20 | Contract lacks status/SLA/multi-elevator | BR-16 | FR-30, FR-31 | E6 | US-025..027 | `maintenance_contract`,`contract_elevator`,`sla_terms` | Covered | — |
| T21 | No renewal continuity | BR-16 | FR-32 | E6 | US-028 | `contract` supertype + `renewed_from` | Covered | Agreement abstraction (SCHEMA_GAPS #13) |
| T22 | Billing schedule free-text | BR-16 | FR-30 | E6 | US-025 | `contract_billing_schedule` | Missing→Covered | New table (SCHEMA_GAPS #12) |
| T23 | Quote approve/reject (exists) | — | FR-33 | E6 | US-029 | `quotation` | Covered | Parity preserved |
| T24 | PM auto-WO generation missing | BR-17 | FR-40 | E7 | US-030 | `maintenance_plan`→`work_order` | Covered | Background job (ARCH §4) |
| T25 | PM due/overdue (exists, colour) | BR-17 | FR-41 | E7 | US-031, US-035 | `v_pm_due` | Covered | View parity w/ mintperlist |
| T26 | PM visit lacks checklist/signature | BR-02 | FR-42, FR-43 | E7 | US-032, US-033 | `maintenance_visit`,`work_order_checklist` | Partial | Checklist answer-types widened (SCHEMA_GAPS #18) |
| T27 | Visit reminders (exists SMS) | BR-12 | FR-44 | E7 | US-034 | `notification` | Covered | — |
| T28 | Fault lacks priority/SLA/status | BR-18 | FR-50, FR-52 | E8 | US-036, US-038 | `fault_ticket`,`ticket_status` | Covered | — |
| T29 | Fault timestamps (partial) | BR-18 | FR-50, FR-53 | E8 | US-039 | `fault_ticket.*_at`,`sla_target`,`sla_event` | Partial | Rich timestamps + sla_event (SCHEMA_GAPS #10) |
| T30 | No escalation | BR-18 | FR-52 | E8 | US-038 | `ticket_escalation` | Missing→Covered | New table |
| T31 | Dual confirmation codes (exists) | BR-18 | FR-51 | E8 | US-037 | `fault_ticket.*_confirm_code` | Covered | — |
| T32 | Finance-gated dispatch (hidden rule) | — | FR-54 | E8 | US-040 | `notification_rule`/policy flag | Partial | Make configurable (SRS clarification) |
| T33 | No ticket comments | BR-10 | FR-140 | E8, E14 | US-067 | `ticket_comment` | Missing→Covered | New table (SCHEMA_GAPS #11) |
| T34 | No dispatch board/map | BR-05 | FR-70, FR-71 | E9 | US-042, US-043 | `work_order_assignment`,geo cols | Partial | UI + maps integration (IR-04) |
| T35 | No technician profile depth | — | FR-72 | E9 | US-044 | `employee_profile`(technician fields) | Covered | Folded into unified identity |
| T36 | No mobile app | BR-06 | FR-80, FR-81 | E10 | US-046..050 | `work_order`,`mobile_sync_*` | Partial | Offline sync model + API (E20) |
| T37 | No spare-parts stock | BR-07 | FR-90..92 | E11 | US-051..054 | `item`,`warehouse`,`stock_level`,`stock_txn` | Covered | stock_level semantics defined (SCHEMA_GAPS #14) |
| T38 | No vehicle stock model | BR-07 | FR-91 | E11 | US-052 | `vehicle`,`vehicle_assignment`,`warehouse` | Partial→Covered | Vehicle entity added (SCHEMA_GAPS #15) |
| T39 | Low-stock alerts | BR-12 | FR-93 | E11 | US-055 | `notification_rule` | Covered | — |
| T40 | No procurement | BR-08 | FR-100, FR-101 | E12 | US-056..059 | full procurement set | Partial→Covered | 10 entities + lifecycles (SCHEMA_GAPS #1) |
| T41 | Goods receipt line-level | BR-08 | FR-101 | E12 | US-059 | `goods_receipt_line` | Missing→Covered | New (SCHEMA_GAPS #16) |
| T42 | Supplier invoice/returns | BR-08 | FR-100 | E12 | US-059 | `supplier_invoice`,`purchase_return` | Missing→Covered | New |
| T43 | No VAT calc / ZATCA | BR-04 | FR-110, IR-01 | E13 | US-060, US-061 | `invoice` (zatca cols) | Partial | Needs accredited integration (IR-01) |
| T44 | Only AR per contract | BR-04 | FR-111 | E13 | US-062, US-063 | `invoice`,`payment`,credit note | Covered | — |
| T45 | No profitability | BR-19 | FR-112 | E13 | US-064 | `v_profitability_*` (CTE) | Partial | Fan-out fixed (SCHEMA_GAPS #21) |
| T46 | Invoices maintenance-only risk | — | FR-110 | E13 | US-061 | `contract` supertype | Covered | Option B (SCHEMA_GAPS #13) |
| T47 | Expenses/GL | — | FR-113 | E13 | US-065 | `expense`,`cost_center` | Partial | GL via integration (IR-06) |
| T48 | No inspection/NCR/cert | BR-11 | FR-120 | E15 | US-070, US-071 | inspection set + `certificate` | Partial→Covered | Template model (SCHEMA_GAPS #17) |
| T49 | No portal | BR-10 | FR-140 | E14 | US-066..069 | `customer_profile`,`document.customer_visible` | Partial | Access-level on docs (SCHEMA_GAPS #19) |
| T50 | No KPI dashboards | BR-09 | FR-130 | E16 | US-072, US-073 | reporting views | Partial | Materialized views + jobs |
| T51 | No MTTR/MTBF/FTF | BR-09 | FR-131 | E16 | US-074..076 | `fault_ticket`,`work_order` timestamps | Partial | Derived in reporting layer |
| T52 | Notifications ad-hoc | BR-12 | FR-150 | E17 | US-077, US-078 | `notification`,`notification_rule` | Covered | — |
| T53 | Hard-coded rules | BR-20 | FR-151 | E17 | US-079 | `notification_rule`,`workflow_rule` | Partial | Rule engine (ARCH) |
| T54 | Automation quick wins | BR-12 | FR-150 | E17 | US-080 | background jobs | Covered | — |
| T55 | Preserve installation flow | BR-21 | FR-160 | E18 | US-081..083 | `installation_contract`,`quotation`,factory/warehouse | Covered | Non-regression retained |
| T56 | Parametric pricing preserved | BR-21 | FR-160 | E18 | US-082 | `pricing_catalog`(ref) | Partial | Model pricing config as data |
| T57 | AI predictive | — | IR-08 | E19 | US-084, US-085 | telemetry (future) | Not Applicable | Phase 7 only |
| T58 | IoT auto-ticket | — | IR-08 | E19 | US-086 | `iot_signal`(future) | Not Applicable | Phase 7 only |

---

## 2. Reverse checks (coverage completeness)

### 2.1 Audit → BRD (every major audited problem maps to a BR)
All CRITICAL/High audit findings map to a BR (T01–T51). No audited problem is orphaned. **Status: Covered.**

### 2.2 BRD → SRS (every BR maps to ≥1 FR/NFR/DR/IR)
BR-01…BR-21 each cited by ≥1 FR (see matrix). **Status: Covered.** Clarifications needed for BR-15 (reliability → add RPO/RTO FRs) and BR-20 (rule engine) — see `SRS_V1.1_GAPS.md`.

### 2.3 SRS → Backlog (every actionable requirement → ≥1 story)
All P0/P1 FRs map to stories US-001…US-086. New platform/migration FRs added in v1.1 map to US-087…US-111. **Status: Covered after v1.1.**

### 2.4 SRS → Schema (every persistent domain requirement has a representation)
Gaps found in draft `schema.sql` (identity split, procurement incompleteness, no multi-tech, no billing schedule, no vehicle, no inspection templates, no ticket comments, fan-out views). **All resolved in `schema-v1.1.sql`** — see §3 and `SCHEMA_GAPS.md`. **Status: Covered after v1.1.**

### 2.5 Backlog → Schema (every stateful story supported)
US-018/054 (parts→WO), US-028 (renewal continuity), US-032 (checklist), US-040 (configurable dispatch rule), US-059 (GRN lines), US-067 (ticket comments), US-070 (inspection) required new/changed tables — added in v1.1. **Status: Covered after v1.1.**

---

## 3. Contradictions & resolutions

| ID | Contradiction / ambiguity | Sources | Resolution (authority) |
|---|---|---|---|
| C1 | Identity split `app_user` vs `customer_user` leaves portal actions outside central audit | Schema vs FR-02/FR-05 | Unify to `auth_user` + `employee_profile`/`customer_profile`; all actions audited (Architecture decision; SRS clarification SR-ID) |
| C2 | `branch_id` overloaded for both internal org and customer location | Schema vs FR-11 | Split: internal `branch` (tenant) vs `customer_account` (customer). Elevator sits under site/building, not internal branch (Architecture decision) |
| C3 | Invoices reference only maintenance contract; installation billing excluded | Schema vs FR-110/BR-04 | Introduce `contract` supertype (commercial agreement) with install/maint specializations; invoice → `contract_id` (Option B; SCHEMA_GAPS #13) |
| C4 | `maintenance_visit` and `work_order` both own status/time | Schema vs FR-60/61 | `work_order` = operational truth; `maintenance_visit` is a PM extension with mandatory unique `work_order_id` (SCHEMA_GAPS #9) |
| C5 | Single `po_status` enum reused across all procurement entities | Schema vs FR-100 | Per-entity lifecycle enums (`pr_status`,`rfq_status`,`po_status`,`grn_status`,`supplier_invoice_status`,`return_status`) (SCHEMA_GAPS #1) |
| C6 | Profitability view fan-out double-counts (elevator⋈invoices⋈work_orders) | Schema `v_elevator_profitability` | Pre-aggregate with CTEs then join aggregates (SCHEMA_GAPS #21) |
| C7 | Finance-gated dispatch is a hidden hard-coded rule in current system | Audit vs BR-20/FR-54 | Make it a configurable policy with override permission; do not hard-code (SRS clarification) |
| C8 | `stock_level` authority undefined (state vs derived) | Schema vs FR-92 | `stock_level` = transaction-derived **cached** state; `stock_txn` is the ledger of record; reconcilable (SCHEMA_GAPS #14) |

No contradiction overrides an audited fact (Rule 1) or silently changes a business requirement (Rule 2); each is flagged with its resolution authority.

---

## 4. Consolidated gap list (feeds Backlog v1.1 & Schema v1.1)

**Schema-driven (→ `schema-v1.1.sql`, detail in `SCHEMA_GAPS.md`):** unified identity (G-02), immutable audit enforcement (G-03), tenant isolation via composite FK + RLS (G-04), customer_account hierarchy (G-05), elevator_component (G-06), work_type + full WO (G-07), work_order_assignment (G-08), WO/visit source-of-truth (G-09), SLA timestamps + sla_event + escalation (G-10), ticket_comment (G-11), contract_billing_schedule (G-12), contract supertype for invoicing (G-13), stock_level semantics + reservations (G-14), vehicle model (G-15), goods_receipt_line (G-16), inspection template set + certificate (G-17), rich checklist answer types (G-18), document access/versioning (G-19), financial completeness (G-20), profitability CTE fix (G-21), common metadata + justified soft-delete (G-22), full procurement set (G-01).

**Requirement-driven (→ `SRS_V1.1_GAPS.md`):** RPO/RTO FRs, observability FRs, DR runbook, integration error handling, webhook idempotency, offline-sync conflict rules, configurable business rules.

**Backlog-driven (→ `BACKLOG_V1.1_CHANGES.md`):** Epic E20 (US-087..100), Epic E21 (US-101..111), plus acceptance-criteria tightening on US-004/005/018/032/060/064.
