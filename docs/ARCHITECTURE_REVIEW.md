# Architecture Review — Elevora (Elevator Operations Platform)

**Phase:** Architecture Readiness v1.1 (pre-implementation).
**Inputs:** Audit, BRD, SRS (+v1.1 gaps), Backlog (+v1.1), schema-v1.1.sql.
**Rule compliance:** Elevator = asset source of truth (Rule 12); Work Order = operational spine (Rule 11); server-side authz + tenant/branch scope (Rules 8/9); audit/financial/inventory changes auditable (Rule 10); installation engine preserved (Rule 3).

---

## 1. Recommended architecture style

A **modular monolith** (single deployable, strict internal module boundaries) with **asynchronous workers** and a **shared PostgreSQL** database — not microservices. Rationale: one domain, one team to start, strong transactional integrity needs (stock, finance, SLA), and a clean path to extract services later along the module seams in §2. Event-driven *internally* (outbox + queue), not event-sourced.

```
                    ┌──────────────────────────────────────────┐
  Web Admin (SPA)   │                                          │
  Customer Portal   │   API Gateway / BFF  (REST /api/v1)       │  ← OAuth2/JWT, RLS tenant ctx
  Technician App    │   ├─ AuthZ (RBAC + RLS + scope)           │
  (mobile, offline) │   └─ Module services (see §2)             │
        │           │                                          │
        ▼           │   Domain core (modular monolith)          │
   HTTPS / JWT ───▶ │   ├─ transactional writes → PostgreSQL    │───▶ PostgreSQL (primary + replica)
                    │   └─ domain events → outbox table         │
                    └──────────────┬───────────────────────────┘
                                   │ (poll outbox)
               ┌───────────────────▼────────────────────┐
               │ Workers / Queue (jobs & integrations)   │───▶ Object storage (docs/photos/signatures)
               │  scheduler · PM-gen · SLA · notify ·     │───▶ Cache (Redis: sessions, rate-limit, hot reads)
               │  webhook retry · ZATCA · sync            │───▶ Integrations (ZATCA, SMS/WhatsApp, email, maps, pay, accounting)
               └─────────────────────────────────────────┘───▶ Observability (logs, metrics, traces, errors)
```

**Components:** Web Admin (SPA, RTL-first), Customer Portal (SPA or SSR), Technician App (mobile, offline-first), API/BFF, Workers/Queue, Scheduler (cron), PostgreSQL (primary + read replica), Object Storage (S3-compatible), Cache (Redis), Notifications service, Integrations layer, Observability stack.

**Tech note (recommendation, not mandate):** the current system is ASP.NET. A .NET 8 modular monolith + PostgreSQL keeps team continuity; any equivalent stack (Node/NestJS, Java/Spring) is acceptable if it meets the NFRs. The data model and boundaries here are stack-neutral.

---

## 2. Domain modules (bounded contexts / internal boundaries)

| Module | Owns (tables) | Depends on |
|---|---|---|
| **Identity** | auth_user, role, permission, user_role, *_profile, technician | — |
| **Organization** | tenant, branch | Identity |
| **CRM** | customer, customer_account, contact_person, site, building, lead | Organization |
| **Assets** | elevator, elevator_component, document | CRM |
| **Sales** | quotation, pricing_catalog/item | CRM, Assets |
| **Installation** | installation_contract (+factory/warehouse-prep legacy) | Sales, Assets |
| **Contracts** | contract (supertype), maintenance_contract, sla_terms, contract_billing_schedule, contract_elevator, maintenance_plan | Assets, CRM |
| **Maintenance** | maintenance_visit | Contracts, Service |
| **Service** | work_order, work_type, work_order_assignment, checklist_*, fault_ticket, sla_target/event, ticket_escalation, ticket_comment | Assets, Contracts, Inventory |
| **Dispatch** | (assignment + scheduling logic over Service) | Service, Identity |
| **Inventory** | item, warehouse, vehicle, vehicle_assignment, stock_txn, stock_level, stock_reservation, work_order_part | Service |
| **Procurement** | purchase_request/_line, rfq, supplier_quotation, purchase_order, goods_receipt, supplier_invoice, purchase_return (+lines), supplier | Inventory |
| **Finance** | invoice, invoice_line, payment, payment_allocation, expense, cost_center | Contracts, Service, Inventory |
| **Compliance** | inspection_*, ncr, certificate | Assets, Service |
| **Portal** | (read/write views over Service/Finance scoped to customer) | Service, Finance, Identity |
| **Notifications** | notification, notification_rule, workflow_rule | all (via events) |
| **Reporting** | views + materialized views | all (read-only) |
| **Integrations** | webhook_endpoint/delivery, integration_outbox | all (via events) |
| **Audit** | audit_log | all (cross-cutting) |

Boundaries map 1:1 to the future service-extraction seams. Cross-module calls go through module service interfaces, not direct table access.

---

## 3. API boundaries (high-level only — not implemented in this phase)

Base `/api/v1`, OAuth2/JWT, tenant from token, server-side pagination, consistent error envelope (see `API_CONVENTIONS.md`).

```
/auth           login, refresh, mfa, password-reset
/customers      + /{id}/accounts /sites /buildings
/elevators      + /{id}/history /components /documents  (QR lookup: /elevators/by-qr/{code})
/contracts      + /{id}/elevators /sla /billing-schedule  (installation & maintenance via agreement type)
/plans          maintenance plans
/work-orders    + /{id}/assignments /checklist /parts /signature /complete
/tickets        + /{id}/comments /sla /escalations
/dispatch       board, assignments, map/eta
/inventory      items, warehouses, stock, transfers, reservations
/procurement    requests, rfq, quotations, pos, receipts, supplier-invoices, returns
/invoices       + /{id}/zatca /payments ; /payments
/inspections    + /ncr /certificates
/reports        kpis, dashboards (role-scoped)
/portal         customer-scoped: my elevators, tickets, invoices, documents
/webhooks       endpoint management ; /integrations health
```

**Principle:** the Technician App and Customer Portal are **clients of the same API**; no separate backend. Portal endpoints enforce `customer` data scope server-side.

---

## 4. Background jobs (scheduler + workers)

| Job | Trigger | Does |
|---|---|---|
| PM work-order generation | daily | from active `maintenance_plan.next_due_date` → create scheduled `work_order` + `maintenance_visit` |
| Contract expiry / renewal-due | daily | flag contracts; set `renewal_due`; emit events |
| Renewal reminders | daily | notify per `notification_rule` offsets |
| SLA timers | minutely | compute `sla_event` from ticket timestamps vs `sla_target`; raise warning/breach; escalate |
| Invoice overdue reminders | daily | mark `overdue`; notify |
| Billing-schedule invoicing | daily | due `contract_billing_schedule` → draft invoices |
| Low-stock checks | hourly | compare `stock_level` vs `reorder_point`; alert |
| Notification delivery | continuous | drain `integration_outbox` per channel; retries/backoff |
| Webhook retries | continuous | redeliver `webhook_delivery` with backoff + idempotency |
| ZATCA submission retries | continuous | submit queued invoices; idempotent; no duplicate clearance |
| Mobile sync processing | continuous | apply offline batches with conflict rules (FR-174) |
| Stock-level reconcile | nightly | verify `stock_level` vs `v_stock_from_ledger`; alert drift |
| Audit partition rollover | monthly | create next `audit_log` partition |
| Materialized-view refresh | scheduled | refresh KPI/reporting views |

---

## 5. Event architecture (internal domain events via transactional outbox)

Events are written to `integration_outbox` **in the same transaction** as the state change (outbox pattern), then dispatched by a worker — no event sourcing, no dual-write risk.

```
ElevatorCreated · ContractActivated · ContractExpiring · MaintenanceDue
WorkOrderCreated · WorkOrderAssigned · TechnicianArrived · WorkOrderCompleted
FaultReported · SLAWarningRaised · SLABreachDetected · TicketEscalated
PartIssued · LowStockDetected · GoodsReceived
InvoiceIssued · PaymentReceived · ZatcaCleared
```

Consumers: Notifications (rules → channels), Reporting (projection refresh), Integrations (webhooks), Automation (e.g. FaultReported→create WO, MaintenanceDue→create WO). Each consumer is idempotent (keyed on event id).

---

## 6. Cross-cutting concerns

- **Identity & authz:** unified `auth_user`; RBAC verbs + `data_scope`; **RLS** for tenant isolation; app-layer branch/record scope; portal is a scoped client. Authorization is always server-side (Rule 8).
- **Tenant/branch scope:** middleware sets `app.tenant_id`; RLS enforces; composite FKs prevent cross-tenant links (Rule 9).
- **Audit:** every state change emits an `audit_log` append (actor, old/new, ip, device) — including portal (Rule 10).
- **Integrity:** stock only via `stock_txn`; finance totals by trigger; append-only ledgers; Work Order is the single operational truth; Elevator is the asset truth.
- **Security baseline:** hashed passwords, encryption at rest + TLS, secrets vault, rate limiting, CSRF/XSS/SQLi/IDOR defenses (see `SECURITY_ARCHITECTURE.md`).
- **Observability:** structured logs, p95 metrics, traces, error tracking, integration-failure alerts, health/readiness endpoints.
- **Offline (mobile):** local store + sync batches; conflict rules (FR-174): monotonic status never regresses, signatures/parts append-only, last-write-wins per scalar field by server timestamp.
