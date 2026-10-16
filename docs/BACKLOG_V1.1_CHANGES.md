# Backlog v1.1 — Changes

**Base:** `Backlog-Elevator-Management-OS.md/.csv` (US-001…US-086, E1–E19).
**Rule:** existing story IDs are **preserved unchanged**. v1.1 only **adds** new epics/stories after US-086 and **tightens acceptance criteria** on a few existing stories (listed in §3). The original backlog files are **not overwritten**; apply these deltas when promoting to v1.1.

---

## 1. New Epic E20 — Platform, APIs, Integrations & DevOps
*Source: SRS v1.1 (NFR-60/61, IR-07/09/10), BRD BR-15. Phase mapping: R0/R1 and R8.*

| ID | Pri | Pts | Story | Acceptance (summary) |
|---|---|---|---|---|
| US-087 | P0 | 5 | Automated backup & tested restore | Daily automated backups; a restore drill succeeds and is documented |
| US-088 | P0 | 3 | RPO/RTO verification | Measured RPO ≤ 24h, RTO ≤ 4h in a drill; results recorded |
| US-089 | P1 | 5 | Performance monitoring & p95 baseline | p95 latency dashboard; interactive pages < 2s p95 under branch load |
| US-090 | P0 | 3 | Server-side pagination standard | All list endpoints paginate server-side; no unbounded queries |
| US-091 | P0 | 5 | Encryption-at-rest & secret management | DB/object storage encrypted at rest; secrets in a vault, not code/config |
| US-092 | P1 | 8 | Public API v1 | Authenticated (OAuth2/JWT), versioned, paginated, filterable, consistent errors, rate-limited |
| US-093 | P1 | 5 | Signed webhooks with retry/idempotency | HMAC-signed; retried with backoff; consumer idempotency key honored |
| US-094 | P1 | 5 | SMS / WhatsApp gateway integration | Send via gateway; delivery status tracked; retries; dead-letter on failure |
| US-095 | P1 | 3 | Email delivery integration | Transactional email with bounce/failure handling |
| US-096 | P1 | 5 | Maps / geocoding integration | Geocode sites; technician/job map; ETA |
| US-097 | P2 | 5 | Payment gateway integration | Online customer payments; reconciliation to invoices |
| US-098 | P2 | 8 | Accounting / GL integration | Export/sync invoices, payments, expenses to accounting system (no full GL build) |
| US-099 | P1 | 5 | Central observability / logging / error tracking | Structured logs, metrics, error tracking, integration-failure alerts |
| US-100 | P1 | 5 | Disaster-recovery runbook | Documented, rehearsed DR runbook; roles and steps defined |

**E20 subtotal:** 14 stories, ~70 pts.

---

## 2. New Epic E21 — Legacy Migration
*Source: BRD DR-06, SRS v1.1 DR-09. Phase mapping: R0 (prep) → R2+ (execution) → cutover.*

| ID | Pri | Pts | Story | Acceptance (summary) |
|---|---|---|---|---|
| US-101 | P0 | 5 | Customer migration | All legacy customers migrated; source count = destination count |
| US-102 | P0 | 8 | Elevator asset derivation | Each legacy embedded elevator spec becomes one `elevator`; dedup across contracts |
| US-103 | P0 | 5 | Maintenance-contract migration | Contracts migrated and linked to valid assets; statuses mapped to enums |
| US-104 | P1 | 5 | Installation-history migration | Installation contracts/phases/factory/warehouse records migrated |
| US-105 | P1 | 5 | Preventive-visit migration | Historical visits attached to assets/work orders |
| US-106 | P1 | 5 | Fault-history migration | Faults migrated with timestamps; free-text status mapped |
| US-107 | P0 | 5 | Payment migration | Payments/AR balances migrated; financial totals reconcile |
| US-108 | P1 | 5 | Audit/event migration | Legacy `actionhistory` events migrated into the audit model |
| US-109 | P0 | 3 | Legacy-status mapping | Deterministic map from free-text statuses to enums; unmapped flagged |
| US-110 | P0 | 5 | Migration reconciliation | Automated report: counts, totals, asset links, traceability all pass |
| US-111 | P0 | 5 | Cutover / rollback | Cutover runbook with rollback; test data excluded; no plaintext passwords imported |

**E21 subtotal:** 11 stories, ~56 pts.

**Migration Definition of Done (applies to US-101..111):**
- source count = destination count (per entity)
- financial totals reconcile (AR, payments, invoice totals)
- active contracts link to valid assets
- history remains traceable (asset ↔ visit/fault/payment)
- **no plaintext passwords imported** (users force-reset)
- test data excluded (e.g. the legacy "تيست" fault ticket)

---

## 3. Acceptance-criteria tightening on existing stories (no ID change)

| Story | Change (Clarification) | Source |
|---|---|---|
| US-004 | Add: denied actions rejected **server-side** by the API, not only hidden in UI | Rule 8 |
| US-005 | Add: data scope enforced by **RLS + tenant/branch middleware**; verified by a cross-tenant/branch negative test | SCHEMA_GAPS #4 |
| US-007 | Add: audit records **append-only** (REVOKE UPDATE/DELETE + trigger); portal actions audited | SCHEMA_GAPS #3 |
| US-016 | Add: WO supports **multiple technician assignments** and a configurable **work type** | SCHEMA_GAPS #7/#8 |
| US-018 | Add: parts move only via `stock_txn`; `stock_level` reconciles to the ledger | SCHEMA_GAPS #14 |
| US-032 | Add: checklist supports **typed answers** (pass/fail, number, measurement, photo, signature) and `creates_fault_on_fail` | SCHEMA_GAPS #18 |
| US-036/039 | Add: full SLA **timestamp lifecycle** + `sla_event`/escalation; MTTR derivable | SCHEMA_GAPS #10 |
| US-059 | Add: **line-level** GRN (ordered/received/accepted/rejected) + supplier invoice + returns | SCHEMA_GAPS #1/#16 |
| US-060 | Add: ZATCA submission is **queued, idempotent, retried**; no duplicate cleared invoice | SRS IR-10 |
| US-064 | Add: profitability uses **pre-aggregated CTEs** (no fan-out double-count) | SCHEMA_GAPS #21 |
| US-067 | Add: `ticket_comment` with **customer-visible vs internal** visibility | SCHEMA_GAPS #11 |

---

## 4. New stories implied by schema v1.1 (optional, after US-111)

| ID | Pri | Pts | Story | Source |
|---|---|---|---|---|
| US-112 | P1 | 3 | Commercial-agreement supertype & renewal continuity | SCHEMA_GAPS #13, T21 |
| US-113 | P1 | 5 | Contract billing schedule → auto-draft invoices | FR-171 |
| US-114 | P1 | 5 | Vehicle & vehicle-assignment management | FR-173 |
| US-115 | P2 | 5 | Inspection templates & certificates | SCHEMA_GAPS #17 |
| US-116 | P1 | 3 | Document access-level & customer visibility | SCHEMA_GAPS #19 |
| US-117 | P1 | 5 | Offline-sync conflict resolution | FR-174 |

---

## 5. Rolled-up v1.1 backlog size

| Set | Stories | ~Points |
|---|---|---|
| v1.0 (US-001..086) | 86 | preserved |
| E20 (US-087..100) | 14 | 70 |
| E21 (US-101..111) | 11 | 56 |
| Schema-implied (US-112..117) | 6 | 26 |
| **v1.1 total** | **117** | **+152 over v1.0** |

Story IDs US-001…US-086 are unchanged (Rule 6). New work is strictly additive.
