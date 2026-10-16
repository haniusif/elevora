# Schema Architecture Review & Gaps — v1.0 → v1.1

**Reviewed:** `schema.sql` (draft, ~45 tables, 24 enums, 3 views).
**Produces:** `schema-v1.1.sql` (corrected target).
**Method:** domain-boundary, integrity, lifecycle, tenancy, auditability, migration, and SaaS-readiness review — not a reformat.

Each item: **finding → decision → change in v1.1**. Source tags: `Audit`, `BRD`, `SRS`, `Backlog`, `Schema`, `Architecture decision`.

---

## 0. Overall assessment of the draft

**Strengths kept:** elevator as a first-class asset; work-order spine; ZATCA columns on invoice; `password_hash`-only; tenant_id present; branch scoping; parity views (`v_pm_due`, `v_open_faults`); migration notes. The draft is a solid skeleton.

**Structural issues corrected in v1.1:** (1) split identity leaves portal actions un-audited; (2) `branch_id` overloaded; (3) invoicing maintenance-only; (4) WO/visit dual source of truth; (5) one procurement enum for all; (6) profitability fan-out; (7) stock authority undefined; (8) single technician per WO; (9) procurement/inspection/vehicle/billing-schedule/ticket-comment entities missing; (10) audit not enforced append-only; (11) tenant isolation relies on a bare column.

---

## 1. Procurement completeness (G-01) — *SRS FR-100/101, BRD BR-08*
**Finding:** draft had only `purchase_request`, `purchase_order`, `purchase_order_line`, `goods_receipt` — and reused one `po_status` enum for all. No RFQ, supplier quotation, GRN lines, supplier invoice, or returns.
**Decision:** model the full chain with **per-entity lifecycle enums**.
**v1.1 adds:** `purchase_request`+`_line`, `rfq`+`rfq_supplier`, `supplier_quotation`+`_line`, `purchase_order`+`_line`, `goods_receipt`+`_line`, `supplier_invoice`+`_line`, `purchase_return`+`_line`; enums `pr_status`, `rfq_status`, `po_status`, `grn_status`, `supplier_invoice_status`, `return_status`.

## 2. Unified identity (G-02) — *SRS FR-02/FR-05, Architecture decision; resolves C1*
**Finding:** `app_user` + `customer_user` split → portal actions can't reference the central audit actor; two password stores.
**Decision:** single **`auth_user`** (credentials, lockout, MFA-ready) with 1:1 **`employee_profile`** and **`customer_profile`** (and `technician` as an employee specialization). Every FK that means "who did this" points at `auth_user.id`.
**v1.1:** `auth_user`, `employee_profile`, `customer_profile`, `technician`; `audit_log.actor_id → auth_user`.

## 3. Immutable audit (G-03) — *SRS FR-05, BRD BR-13*
**Finding:** `audit_log` existed but nothing prevented UPDATE/DELETE; no hash chain.
**Decision:** append-only by construction.
**v1.1 enforcement (documented in-file):** (a) `REVOKE UPDATE, DELETE ON audit_log FROM app_role`; (b) `BEFORE UPDATE OR DELETE` trigger raising `exception`; (c) monthly `PARTITION BY RANGE (created_at)` for retention; (d) optional `prev_hash`/`row_hash` tamper-evident chain. Writes go through an append API only.

## 4. Tenant isolation (G-04) — *SRS NFR-21, BRD §9; resolves C2 partially*
**Finding:** `tenant_id` column alone allows cross-tenant FKs and cross-tenant unique collisions.
**Decision:** defense-in-depth — **composite FKs** carrying `tenant_id`, **tenant-aware unique constraints** (`UNIQUE (tenant_id, code)`), **PostgreSQL Row-Level Security** policies keyed off `current_setting('app.tenant_id')`, plus **application tenant middleware** and server-side authorization (never UI hiding — Rule 8).
**v1.1:** `tenant_id` on every business table; representative composite FKs; RLS policy template; documented strategy (also in `SECURITY_ARCHITECTURE.md`).

## 5. Customer hierarchy (G-05) — *SRS FR-11; resolves C2*
**Finding:** `branch_id` overloaded for internal org and customer location.
**Decision:** keep internal **`branch`** (tenant org unit) distinct from customer structure: **`customer` → `customer_account` → `site` → `building` → `elevator`**.
**v1.1:** `customer_account` added; `site.customer_account_id`; elevator linked via site/building, not internal `branch` (internal `branch_id` retained only for ownership/scoping).

## 6. Elevator lifecycle (G-06) — *SRS FR-20/21, BRD BR-01*
**Finding:** asset present but no component tracking; history implicit.
**Decision:** keep `elevator` as source of truth; add replaceable components and explicit history via child tables + events.
**v1.1:** `elevator_component` (type, serial, install/replace dates, warranty, status); history assembled from `work_order`, `maintenance_visit`, `fault_ticket`, `work_order_part`, `inspection`, `document` all FK'd to `elevator`.

## 7. Work Order spine (G-07) — *SRS FR-60/61, BRD BR-02; resolves C4*
**Finding:** WO lacked a configurable work type and some fields.
**Decision:** add **`work_type`** reference table; ensure all required fields.
**v1.1:** `work_type` (code, name, default_checklist_template, billable_default); `work_order` carries source, work_type_id, status, priority, customer/site/elevator/contract/plan, schedule, check-in/out, GPS, labour, travel, findings, signature, service_report_url, cost.

## 8. Multi-technician assignment (G-08) — *SRS FR-60/70, BRD BR-05*
**Finding:** WO had a single `technician_id`.
**Decision:** many-to-many assignment with roles and per-assignment timestamps.
**v1.1:** `work_order_assignment` (work_order_id, technician_id, assignment_role [lead|assist|trainee], is_primary, assigned_at, accepted_at, started_at, completed_at). WO keeps a denormalized `primary_technician_id` for convenience, derived from the primary assignment.

## 9. WorkOrder vs MaintenanceVisit (G-09) — *Architecture decision; resolves C4*
**Finding:** both owned status + timestamps → duplicated truth.
**Decision:** **`work_order` is operational truth.** `maintenance_visit` is a PM extension holding PM-specific data only (plan link, visit sequence, supervisor approval), with **mandatory, unique `work_order_id`**.
**v1.1:** `maintenance_visit.work_order_id UNIQUE NOT NULL`; visit has no independent status/time columns (reads them from the WO).

## 10. Corrective / SLA model (G-10) — *SRS FR-50/53, BRD BR-18; resolves C? none*
**Finding:** one boolean `sla_breached`; limited timestamps.
**Decision:** full lifecycle timestamps + targets + events + escalation.
**v1.1:** `fault_ticket` timestamps `reported_at, assigned_at, acknowledged_at, en_route_at, arrival_at, diagnosis_at, repair_start_at, resolved_at, customer_confirmed_at, closed_at`; `sla_target` (response/arrival/repair, from contract SLA); `sla_event` (target_type, due_at, met, breached_at); `ticket_escalation` (level, reason, escalated_to, at).

## 11. Ticket communication (G-11) — *SRS FR-140, BRD BR-10*
**Finding:** no comment thread for portal tickets.
**Decision:** add threaded comments with visibility.
**v1.1:** `ticket_comment` (ticket_id, author auth_user_id, body, visibility [customer|internal], attachment document_id, created_at).

## 12. Contract billing schedules (G-12) — *SRS FR-30, BRD BR-16*
**Finding:** payment schedule was free text.
**Decision:** structured, invoice-linked schedule.
**v1.1:** `contract_billing_schedule` (contract_id, sequence, billing_type [fixed|percentage|milestone], due_date, percentage, amount, status [pending|invoiced|paid|cancelled], invoice_id).

## 13. Installation + maintenance invoicing (G-13) — *SRS FR-110; resolves C3*
**Finding:** invoice referenced maintenance contract only.
**Decision — Option B (preferred long-term):** introduce a **`contract` supertype (commercial agreement)** with `agreement_type [installation|maintenance|estimation]`; `installation_contract` and `maintenance_contract` become specializations referencing it; `renewed_from` lives on the supertype for renewal continuity (T21).
**Tradeoff documented:** Option A (two nullable FKs on invoice) is simpler but spreads commercial logic and complicates reporting/renewals. Option B adds one join but centralizes identity, billing schedules, invoicing, and renewals. **Chosen: B.** Invoice → `contract_id` (supertype); specialization tables hold domain-specific fields.

## 14. Inventory integrity (G-14) — *SRS FR-90/92, BRD BR-07; resolves C8*
**Finding:** `stock_level` authority undefined; silent changes possible.
**Decision:** **`stock_txn` is the ledger of record**; **`stock_level` is a transaction-derived cached projection** (on_hand, reserved) maintained by trigger/worker and reconcilable from the ledger. No direct stock mutation without a txn.
**v1.1:** `stock_txn` immutable (same append pattern as audit for quantity moves); `stock_level` cache with a `reconcile` view (`v_stock_from_ledger`) to verify; `stock_reservation` for soft holds against work orders.

## 15. Vehicle model (G-15) — *SRS FR-91, BRD BR-07*
**Finding:** vehicle ambiguously represented via technician/warehouse.
**Decision:** explicit vehicle entity + assignment; vehicle stock is a warehouse of `kind='vehicle'` linked to the vehicle.
**v1.1:** `vehicle` (plate, type, branch), `vehicle_assignment` (vehicle_id, technician_id, from/to), `warehouse.vehicle_id` FK for mobile stock.

## 16. Goods receipts (G-16) — *SRS FR-101, BRD BR-08*
**Finding:** GRN had no line-level quantities.
**Decision:** line-level ordered/received/accepted/rejected.
**v1.1:** `goods_receipt_line` (grn_id, po_line_id, item_id, ordered_qty, received_qty, accepted_qty, rejected_qty, reject_reason).

## 17. Inspection checklist model (G-17) — *SRS FR-120, BRD BR-11*
**Finding:** only flat `inspection`+`ncr`.
**Decision:** template-driven structured inspections with evidence and certificates.
**v1.1:** `inspection_template`, `inspection_template_item`, `inspection`, `inspection_result`, `inspection_evidence`, `ncr`, `certificate`.

## 18. Checklist architecture (G-18) — *SRS FR-42/120*
**Finding:** checklist limited to PASS/FAIL/N/A.
**Decision:** typed answers with validation metadata; shared by WO checklists and inspections.
**v1.1:** `answer_type` enum (`pass_fail, boolean, number, text, choice, photo, measurement, signature`); checklist/template items carry `required, unit, min_value, max_value, choice_options, photo_required_on_fail, creates_fault_on_fail`; results store typed value columns.

## 19. Attachments & documents (G-19) — *SRS FR-140/NFR-03; resolves portal leak risk*
**Finding:** one generic `document`; no access control → customer-portal leak risk.
**Decision:** add access level, customer visibility, versioning, category, expiry.
**v1.1:** `document` gains `access_level [internal|branch|customer]`, `customer_visible boolean`, `version`, `supersedes_id`, `category`, `expiry_date`, `uploaded_by`. Portal queries filter `customer_visible = true AND customer_id = :me`.

## 20. Financial integrity (G-20) — *SRS FR-110..113, BRD BR-04/19*
**Finding:** no expense/cost-center; credit note only as a self-FK.
**Decision:** complete AR + expenses; **no full GL** (BRD allows accounting integration — IR-06).
**v1.1:** `invoice` (+credit-note kind + `credit_note_of`), `invoice_line`, `payment`, `payment_allocation` (payment↔invoice many-to-one made explicit for partials), `expense`, `cost_center`. Money columns `numeric(14,2)`; invoice totals maintained by trigger from lines; `CHECK (paid_amount <= total)` relaxed to allow overpayment handling via credit note.

## 21. Profitability calculations (G-21) — *Schema; resolves C6*
**Finding:** `v_elevator_profitability` joined elevator⋈invoices⋈work_orders → Cartesian fan-out double-counts revenue and cost.
**Decision:** pre-aggregate each side in its own CTE, then join aggregates 1:1 on elevator.
**v1.1:** `v_elevator_profitability` rewritten with `rev AS (… group by elevator)`, `cost AS (… group by elevator)`, joined on elevator_id — no fan-out. Same pattern for `v_contract_profitability`.

## 22. Common metadata & soft delete (G-22) — *SRS DR; Architecture decision*
**Finding:** metadata inconsistent; soft-delete risk on financial/audit rows.
**Decision:** standardize `created_at, created_by, updated_at, updated_by` on mutable business tables; `deleted_at, deleted_by` **only** where justified (customer, elevator, item, contract draft) and **never** on `audit_log`, `stock_txn`, `invoice`, `payment`, `goods_receipt*` (these are reversed by compensating records, not deleted).
**v1.1:** metadata columns applied; soft-delete limited; `updated_at` maintained by trigger.

---

## Integrity rules summary (enforced in v1.1)

- No cross-tenant FK (composite FK + RLS).
- Audit and ledger tables append-only (REVOKE + trigger).
- Stock only changes via `stock_txn`; `stock_level` is a reconcilable cache.
- Every WO parts/labour change is auditable; every financial change is auditable.
- `work_order` is the single operational truth; `maintenance_visit` extends it 1:1.
- `elevator` is the physical-asset source of truth; history re-parents across renewals.
- Invoices attach to the `contract` supertype so installation and maintenance both bill.
- No plaintext passwords; identity unified so all actions (incl. portal) are attributable.
