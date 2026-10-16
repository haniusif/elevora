# SRS v1.1 — Gaps & Amendments

**Base:** `SRS-Elevator-Management-OS.md` (v1.0).
**Purpose:** record amendments needed for development readiness **without** rewriting the SRS. Each item is classified and tagged with source and the resulting requirement ID.

**Classification:** `Existing` (already stated, confirmed) · `Clarification` (sharpen an existing FR) · `New` (add FR/NFR/IR) · `Changed` (modify an existing FR).

> New IDs continue the SRS numbering: FR-170+ (functional), NFR-60+ (non-functional), IR-09+ (interface), DR-07+ (data).

---

## 1. Unified identity — `Changed` · *Architecture decision; SCHEMA_GAPS #2*
- **FR-02 (Changed):** credentials live in a single `auth_user`; employees and customers are profiles over it. Every authenticated action — **including customer-portal actions** — is attributable to one `auth_user` and recorded in the audit trail.
- **FR-05 (Clarification):** `audit_log.actor_id` references `auth_user`; portal activity is in scope for audit.
- **Acceptance:** no action path writes data without an `auth_user` actor; a portal ticket comment appears in the audit log with the customer's identity.

## 2. Customer account hierarchy — `New` · *SCHEMA_GAPS #5; resolves C2*
- **FR-170 (New):** the system MUST model `Customer → CustomerAccount → Site → Building → Elevator`, distinct from the internal `Tenant → Branch` organization. Internal branch scope MUST NOT be overloaded to represent customer structure.
- **DR-07 (New):** `customer_account` is a first-class entity; `site` belongs to a `customer_account`.
- **Acceptance:** a customer with multiple accounts (e.g. property-management companies) can group sites/buildings/elevators under each account.

## 3. Multi-technician work orders — `Changed` · *SCHEMA_GAPS #8*
- **FR-60 (Changed):** a work order MAY have multiple technician assignments with roles (lead/assist/trainee), one marked primary, each with its own accept/start/complete timestamps.
- **FR-70 (Clarification):** dispatch assigns via `work_order_assignment`, not a single FK.
- **Acceptance:** a 2-person job records both technicians; KPIs attribute labour correctly.

## 4. Detailed SLA events — `Changed` · *SCHEMA_GAPS #10*
- **FR-50/FR-53 (Changed):** fault tickets MUST capture the full timestamp lifecycle (reported→assigned→acknowledged→en route→arrival→diagnosis→repair start→resolved→customer confirmed→closed) and compute SLA per target type (response/arrival/repair) from the contract SLA, emitting warning, breach, and escalation events.
- **DR-08 (New):** `sla_target`, `sla_event`, `ticket_escalation` are persistent.
- **Acceptance:** an SLA breach raises a `sla_event` and an escalation record; MTTR is derivable from timestamps.

## 5. Contract billing schedule — `New` · *SCHEMA_GAPS #12*
- **FR-171 (New):** maintenance and installation agreements MUST hold a structured billing schedule (sequence, type, due date, percentage/amount, status, linked invoice). Free-text schedules are not acceptable for billing automation.
- **Acceptance:** scheduled billing lines auto-create draft invoices on due date (background job).

## 6. Commercial-agreement abstraction & dual invoicing — `Changed` · *SCHEMA_GAPS #13; resolves C3*
- **FR-110 (Changed):** invoicing MUST support both installation and maintenance agreements via a common `contract` (commercial agreement) supertype; invoices reference the agreement, not a maintenance-only link.
- **Acceptance:** an installation milestone and a maintenance period both produce ZATCA invoices through the same path.

## 7. Supplier invoice & returns — `New` · *SCHEMA_GAPS #1/#16*
- **FR-172 (New):** procurement MUST support RFQ, supplier quotations, line-level goods receipt (ordered/received/accepted/rejected), supplier invoices, and purchase returns, each with its own lifecycle status.
- **Acceptance:** a partial receipt leaves the PO `partially_received`; a return reduces stock via a `stock_txn`.

## 8. Vehicle assignment — `New` · *SCHEMA_GAPS #15*
- **FR-173 (New):** vehicles are first-class; technician vehicle stock is a warehouse of kind `vehicle` linked to a `vehicle`; assignments are time-bounded.
- **Acceptance:** issuing a part from a van decrements that van's stock location.

## 9. Configurable business rules — `Changed` · *BRD BR-20; resolves C7*
- **FR-151 (Changed):** notification and approval rules, and the finance-gated dispatch rule (block dispatch when customer has overdue invoice), MUST be configurable with override permission — not hard-coded.
- **FR-54 (Changed):** the dispatch block is a policy evaluated server-side, surfaced as an overridable warning.
- **Acceptance:** an admin can enable/disable the overdue-invoice dispatch block per branch.

## 10. Migration — `New` · *BRD §DR-06; Backlog E21*
- **DR-09 (New):** the system MUST support a one-time migration from legacy Link Lift with reconciliation (source count = destination count, financial totals reconcile, active contracts link to valid assets, history traceable, no plaintext passwords imported, test data excluded).
- **Acceptance:** migration reconciliation report passes before cutover; rollback plan exists.

## 11. APIs & webhooks — `New` · *SRS IR-07; Backlog E20*
- **IR-07 (Changed):** public REST API v1 MUST be authenticated (OAuth2/JWT), versioned, server-side paginated, filterable, with consistent error envelopes and rate limiting.
- **IR-09 (New):** outbound webhooks MUST be signed (HMAC), retried with backoff, and idempotent on the consumer side (delivery id + idempotency key).
- **Acceptance:** replayed webhooks do not double-process; API rejects unauthenticated/over-limit calls.

## 12. Backup / restore & DR — `New` · *BRD BR-15; NFR-11*
- **NFR-60 (New):** automated daily backups with **tested** restore; RPO ≤ 24h, RTO ≤ 4h; a disaster-recovery runbook is maintained and rehearsed.
- **Acceptance:** a restore drill meets RPO/RTO and is documented.

## 13. Observability — `New` · *Architecture decision*
- **NFR-61 (New):** centralized structured logging, metrics (incl. p95 latency), error tracking, and audit of integration failures; health/readiness endpoints.
- **Acceptance:** p95 latency dashboard exists; integration failures raise alerts.

## 14. Integration error handling — `New` · *SRS IR-01..06*
- **IR-10 (New):** all external integrations (ZATCA, SMS/WhatsApp, email, maps, payment, accounting) MUST implement retries with backoff, dead-letter capture, and idempotent submission; ZATCA submissions are queued and retried without duplicating invoices.
- **Acceptance:** a ZATCA timeout retries without creating a second cleared invoice.

## 15. Offline sync conflict rules — `New` · *SRS FR-81*
- **FR-174 (New):** the mobile app MUST define conflict resolution for offline edits (last-write-wins per field with server timestamp, except monotonic status transitions which never regress; parts and signatures are append-only).
- **Acceptance:** two offline updates to the same WO merge deterministically without lost signatures or regressed status.

## 16. Pricing configuration as data — `Clarification` · *BRD BR-21; SCHEMA_GAPS note*
- **FR-160 (Clarification):** the parametric installation pricing engine's catalogs (drives, batteries, controllers, machines, deltas, loadings) are configuration **data**, versioned with an effective date, not code — preserving current behaviour while making it maintainable.
- **Acceptance:** a price change is a data edit with an effective date and audit entry; historical quotes keep their as-quoted prices.

---

## Items confirmed `Existing` (no change, verified traceable)
FR-01, FR-03, FR-04, FR-06 (security), FR-20..24 (asset), FR-30..33 (contracts), FR-40..44 (PM), FR-51/52 (fault details/workflow), FR-61/62 (WO), FR-72 (technician profile), FR-90..93 (inventory), FR-111/112 (AR/profitability), FR-120 (inspection), FR-130/131 (KPIs), FR-140 (portal), FR-150 (notifications), IR-01..06, IR-08.

## Summary
- **New:** FR-170..174, NFR-60/61, IR-09/10, DR-07/08/09.
- **Changed:** FR-02, FR-05, FR-50, FR-53, FR-54, FR-60, FR-70, FR-110, FR-151, IR-07.
- **Clarification:** FR-04, FR-160.
No business requirement is removed; all changes are additive or sharpening and tagged to source (Rule 2 honoured).
