# MASTER BUILD PROMPT
## Elevator Management & Maintenance Operating System

You are working inside:

```text
/Users/haniyousif/dev/Lift
```

This repository contains the authoritative project documents:

1. `Link-Lift-System-Audit.md`
2. `BRD-Elevator-Management-OS.md`
3. `SRS-Elevator-Management-OS.md`
4. `Backlog-Elevator-Management-OS.md`
5. `Backlog-Elevator-Management-OS.csv`
6. `schema.sql`

---

# ROLE

Act as a:

- Principal Solution Architect
- Senior Backend Architect
- Senior Business Analyst
- Product Architect
- Database Architect
- Field Service Management Consultant
- Elevator Maintenance Domain Consultant
- Security Architect
- API Architect
- DevOps Architect
- QA / Traceability Lead

Your task is to turn the existing project package into a development-ready architecture baseline.

---

# SOURCE-OF-TRUTH ORDER

Use the project documents in this order:

## 1. Current system reality

```text
Link-Lift-System-Audit.md
```

This document describes what currently exists in Link Lift.

Do not alter audited facts unless there is an explicit contradiction in another authoritative source.

---

## 2. Business intent

```text
BRD-Elevator-Management-OS.md
```

This defines:

- business goals
- stakeholders
- target capabilities
- scope
- business requirements
- priorities

---

## 3. System behavior

```text
SRS-Elevator-Management-OS.md
```

This defines:

- functional requirements
- non-functional requirements
- data requirements
- external interfaces
- acceptance expectations

---

## 4. Delivery scope

```text
Backlog-Elevator-Management-OS.md
Backlog-Elevator-Management-OS.csv
```

These define:

- epics
- user stories
- priorities
- estimates
- acceptance criteria
- delivery phases

---

## 5. Current target data model

```text
schema.sql
```

Treat this as a draft architecture artifact that MUST be reviewed and corrected before implementation.

Do NOT assume `schema.sql` is complete or production-ready.

---

# PRIMARY OBJECTIVE

Do NOT start building the application immediately.

First create an Architecture Readiness v1.1 package.

The required sequence is:

```text
Read
→ Understand
→ Cross-check
→ Trace
→ Find gaps
→ Resolve contradictions
→ Correct schema
→ Improve backlog
→ Define implementation architecture
→ Produce readiness report
→ STOP
```

Do not scaffold backend, frontend, mobile, portal, or infrastructure until the architecture readiness phase is complete.

---

# CORE PRODUCT DIRECTION

The target product is:

# Elevator Management & Maintenance Operating System

The current Link Lift installation/manufacturing engine must be preserved and integrated.

The target architecture must support:

```text
CRM
Elevator Assets
Installation
Maintenance Contracts
SLA
Preventive Maintenance
Corrective Maintenance
Work Orders
Dispatch
Field Service
Technician Mobile App
Inventory
Procurement
Finance
ZATCA
Inspection & Compliance
Customer Portal
Reporting & KPIs
Notifications
Automation
RBAC
Audit
APIs
Integrations
Migration
Future AI / IoT
```

---

# TARGET OPERATING MODEL

The primary service workflow must converge toward:

```text
Customer
→ Customer Account / Site
→ Building
→ Elevator
→ Contract
→ SLA
→ Maintenance Plan
→ Work Order
→ Dispatch
→ Technician
→ Check-in
→ Checklist
→ Findings
→ Spare Parts
→ Customer Signature
→ Supervisor Approval
→ Service Report
→ Invoice
→ Payment
→ KPI
```

Corrective workflow:

```text
Fault Ticket
→ Priority
→ SLA
→ Work Order
→ Dispatch
→ Technician
→ Diagnosis
→ Repair
→ Parts
→ Test
→ Customer Confirmation
→ Close
→ Invoice if billable
→ KPI
```

---

# NON-REGRESSION PRINCIPLE

The existing Link Lift engine must NOT be replaced unnecessarily.

Preserve:

```text
Lead
→ Quotation
→ Installation Contract
→ Factory
→ Warehouse Preparation
→ Installation Phases
→ Delivery
→ Staged Collection
```

Also preserve:

- parametric pricing
- technical elevator specification
- per-component crew assignment
- manufacturing workflows
- installation warehouse flow

Extend and integrate these capabilities with the new asset, work-order, inventory, finance, and reporting layers.

---

# PHASE 1 — CROSS-DOCUMENT REVIEW

Review all project documents and create a complete consistency analysis.

Check:

## Audit → BRD

Every major audited problem should map to a business requirement.

## BRD → SRS

Every business requirement should map to one or more FR/NFR/DR/IR requirements.

## SRS → Backlog

Every actionable requirement should map to one or more user stories.

## SRS → Schema

Every persistent domain requirement should have an adequate database representation.

## Backlog → Schema

Every story requiring persistent state should be supported by the target data model.

Document:

- missing mappings
- contradictions
- duplicated concepts
- under-specified requirements
- implementation risks
- data-model gaps
- missing acceptance criteria

---

# REQUIRED TRACEABILITY MATRIX

Create:

```text
docs/TRACEABILITY_MATRIX.md
```

Minimum columns:

| Audit Finding | BR | FR/NFR/DR/IR | Epic | User Story | Schema Entity | Status | Gap |
|---|---|---|---|---|---|---|---|

Allowed status values:

```text
Covered
Partial
Missing
Conflict
Not Applicable
```

---

# PHASE 2 — DATABASE ARCHITECTURE REVIEW

Perform a detailed review of:

```text
schema.sql
```

Do not merely reformat it.

Validate:

- domain boundaries
- entities
- relationships
- tenant isolation
- branch scoping
- foreign keys
- lifecycle models
- status models
- uniqueness
- auditability
- history
- soft deletion
- financial integrity
- inventory integrity
- work-order integrity
- field-service requirements
- migration readiness
- SaaS readiness

---

# MANDATORY SCHEMA CORRECTIONS

The v1.1 schema must explicitly address all of the following.

---

## 1. Procurement completeness

The SRS requires:

```text
Purchase Request
→ Approval
→ RFQ
→ Supplier Quotations
→ Supplier Selection
→ Purchase Order
→ Goods Receipt
→ Supplier Invoice
→ Return
```

The corrected model should include where appropriate:

```text
purchase_request
purchase_request_line

rfq
rfq_supplier

supplier_quotation
supplier_quotation_line

purchase_order
purchase_order_line

goods_receipt
goods_receipt_line

supplier_invoice
supplier_invoice_line

purchase_return
purchase_return_line
```

Do NOT use one PO status enum for all procurement entities.

Create appropriate lifecycle models.

---

## 2. Unified identity strategy

Review the current split between:

```text
app_user
customer_user
```

The architecture must support auditable identity for:

- employees
- technicians
- admins
- finance users
- warehouse users
- customers

Every state-changing action must be attributable to a real authenticated identity.

Preferred direction:

```text
auth_user
├── employee profile
└── customer profile
```

or another clean equivalent.

Do not leave portal actions outside the central audit model.

---

## 3. Immutable audit

Audit records must be append-only.

The database design must support:

```text
actor
action
module/entity
record
old value
new value
IP
device
timestamp
```

And prevent normal:

```text
UPDATE
DELETE
```

against audit records.

Document the enforcement approach.

---

## 4. Tenant isolation

`tenant_id` alone is not sufficient.

Prevent cross-tenant foreign-key relationships.

Evaluate:

- composite tenant foreign keys
- tenant-aware unique constraints
- PostgreSQL Row Level Security
- application authorization
- tenant middleware

Create a clear tenant isolation strategy.

---

## 5. Customer hierarchy

Separate:

```text
Company internal Branch
```

from:

```text
Customer Branch / Customer Account
```

Recommended:

```text
Tenant
→ Branch

Customer
→ CustomerAccount
→ Site
→ Building
→ Elevator
```

Do not overload `branch_id`.

---

## 6. Elevator lifecycle

Elevator must remain the primary physical asset.

Support:

- asset number
- serial
- QR
- barcode
- manufacturer
- brand
- model
- technical specification
- installation date
- commissioning date
- warranty
- status
- site/building
- lifecycle history
- documents
- photos
- components
- maintenance history
- fault history
- parts history
- inspection history

Consider introducing:

```text
elevator_component
```

for major replaceable components.

---

## 7. Work Order spine

`WorkOrder` is the primary field-service transaction.

Ensure support for:

```text
source
work type
status
priority
customer
site
elevator
contract
plan
scheduled time
technician assignments
supervisor
check-in/out
GPS
checklist
parts
labour
travel
findings
attachments
signature
service report
cost
```

Add explicit:

```text
work_type
```

or a configurable work-type entity.

---

## 8. Multi-technician assignment

Do not limit a Work Order to one technician.

Introduce:

```text
work_order_assignment
```

Possible fields:

```text
work_order_id
technician_id
assignment_role
is_primary
assigned_at
accepted_at
started_at
completed_at
```

---

## 9. WorkOrder vs MaintenanceVisit

Establish ONE operational source of truth.

Preferred design:

```text
work_order = operational truth
maintenance_visit = preventive-maintenance extension
```

If retained:

```text
maintenance_visit.work_order_id
```

should be unique and mandatory once the WO exists.

Avoid duplicated status/time ownership.

---

## 10. Corrective maintenance / SLA model

Fault tickets need more than one boolean SLA flag.

Support where appropriate:

```text
reported_at
assigned_at
acknowledged_at
en_route_at
arrival_at
diagnosis_at
repair_start_at
resolved_at
customer_confirmed_at
closed_at
```

Also support:

```text
response target
arrival target
repair target

warning
breach
escalation
```

Consider:

```text
sla_event
ticket_escalation
```

---

## 11. Ticket communication

Customer portal requirements include ticket comments.

Add:

```text
ticket_comment
```

Support:

```text
customer-visible comment
internal note
attachment
author identity
timestamp
```

---

## 12. Contract billing schedules

Do not keep billing schedules as free text only.

Introduce:

```text
contract_billing_schedule
```

with:

```text
contract_id
sequence
billing_type
due_date
percentage
amount
status
invoice_id
```

---

## 13. Installation and maintenance invoicing

The finance layer must support both:

```text
installation_contract
maintenance_contract
```

Do not make invoices structurally maintenance-only.

Choose a clean architecture:

### Option A

```text
installation_contract_id nullable
maintenance_contract_id nullable
```

### Option B — preferred long-term

Introduce a common contract/commercial agreement abstraction.

Document the tradeoff.

---

## 14. Inventory integrity

Support:

```text
Item
Warehouse
Vehicle Stock
Stock Level
Reservation
Stock Transaction
Work Order Consumption
Return
Adjustment
Damaged Stock
```

Ensure stock cannot be silently changed without a transaction trail.

Define whether `stock_level` is:

- authoritative state
- calculated state
- transaction-derived cached state

---

## 15. Vehicle model

Do not overload warehouse or technician rows to represent a vehicle ambiguously.

Consider:

```text
vehicle
vehicle_assignment
```

and:

```text
warehouse.vehicle_id
```

for mobile technician stock.

---

## 16. Goods receipts

Goods receipt must have line-level actual receipt quantities.

Add:

```text
goods_receipt_line
```

Support:

```text
ordered
received
accepted
rejected
```

---

## 17. Inspection checklist model

The SRS requires structured inspections.

Support:

```text
inspection_template
inspection_template_item
inspection
inspection_result
inspection_evidence
ncr
certificate
```

---

## 18. Checklist architecture

Do not limit all checklists to:

```text
PASS / FAIL / N/A
```

Support answer types such as:

```text
pass_fail
boolean
number
text
choice
photo
measurement
signature
```

Potential metadata:

```text
required
unit
min
max
photo_required_on_fail
creates_fault_on_fail
```

---

## 19. Attachments and documents

Review whether one generic `document` entity is sufficient.

Support:

- versioning
- category
- entity association
- privacy/access level
- expiry
- uploaded by
- MIME
- size
- customer visibility

Avoid leaking internal files into the customer portal.

---

## 20. Financial integrity

Review:

```text
invoice
invoice_line
payment
credit note
expense
cost center
```

Add missing structures required by the SRS.

Do not claim full accounting/GL replacement unless the BRD requires it.

The BRD explicitly allows accounting integration instead.

---

## 21. Profitability calculations

Correct any query/view that can double-count due to fan-out joins.

For example, never aggregate:

```text
Elevator
JOIN many Invoices
JOIN many WorkOrders
```

without pre-aggregation.

Use separate grouped subqueries/CTEs and then join aggregates.

---

## 22. Common metadata

Make conventions real.

For mutable business tables standardize as appropriate:

```text
created_at
created_by
updated_at
updated_by
```

Consider:

```text
deleted_at
deleted_by
```

only where soft deletion is justified.

Do not use soft deletion blindly for financial/audit records.

---

# PHASE 3 — SRS v1.1 REVIEW

Create:

```text
docs/SRS_V1.1_GAPS.md
```

Do not rewrite the entire SRS unless necessary.

Identify amendments needed for:

- unified identity
- customer account hierarchy
- multi-technician work orders
- detailed SLA events
- contract billing schedule
- supplier invoice / returns
- vehicle assignment
- migration
- APIs/webhooks
- backup/restore
- observability
- disaster recovery
- integration error handling

Clearly distinguish:

```text
Existing requirement
Clarification
New requirement
Changed requirement
```

---

# PHASE 4 — BACKLOG v1.1

Review the existing backlog.

Do not destroy the existing story IDs.

Retain:

```text
US-001 ... US-086
```

Add new stories after US-086.

---

# ADD EPIC E20

## Platform, APIs, Integrations & DevOps

Suggested stories:

```text
US-087 Automated backup and tested restore
US-088 RPO/RTO verification
US-089 Performance monitoring and p95 baseline
US-090 Server-side pagination standard
US-091 Encryption-at-rest and secret-management baseline
US-092 Public API v1
US-093 Signed webhooks with retry/idempotency
US-094 SMS / WhatsApp gateway integration
US-095 Email delivery integration
US-096 Maps / geocoding integration
US-097 Payment gateway integration
US-098 Accounting / GL integration
US-099 Central observability / logging / error tracking
US-100 Disaster-recovery runbook
```

Refine exact stories based on the SRS.

---

# ADD EPIC E21

## Legacy Migration

Suggested:

```text
US-101 Customer migration
US-102 Elevator asset derivation
US-103 Maintenance-contract migration
US-104 Installation-history migration
US-105 Preventive-visit migration
US-106 Fault-history migration
US-107 Payment migration
US-108 Audit/event migration
US-109 Legacy-status mapping
US-110 Migration reconciliation
US-111 Cutover / rollback
```

Migration acceptance must include:

```text
source count = destination count
financial totals reconcile
active contracts link to valid assets
history remains traceable
no plaintext passwords imported
test data excluded
```

---

# CREATE BACKLOG OUTPUT

Create:

```text
docs/BACKLOG_V1.1_CHANGES.md
```

Do not overwrite the original backlog during the first review pass.

---

# PHASE 5 — TARGET SCHEMA

Create:

```text
schema-v1.1.sql
```

Rules:

1. Preserve useful concepts from `schema.sql`.
2. Correct architectural issues.
3. Add missing persistent entities.
4. Add indexes.
5. Add foreign keys.
6. Add useful check constraints.
7. Add clear enums/reference tables.
8. Prevent obvious data-integrity problems.
9. Document tenant-scoping rules.
10. Document migration assumptions.

Do not drop the existing installation/manufacturing domain.

---

# PHASE 6 — IMPLEMENTATION ARCHITECTURE

Create:

```text
docs/ARCHITECTURE_REVIEW.md
```

Cover:

# 1. Recommended architecture style

Define:

```text
Web Admin
API
Technician App
Customer Portal
Workers / Queues
Scheduler
Database
Object Storage
Cache
Notifications
Integrations
Observability
```

---

# 2. Domain modules

Recommended boundaries:

```text
Identity
Organization
CRM
Assets
Sales
Installation
Contracts
Maintenance
Service
Dispatch
Inventory
Procurement
Finance
Compliance
Portal
Notifications
Reporting
Integrations
Audit
```

---

# 3. API boundaries

Define high-level APIs only.

Do not fully implement them yet.

Possible groups:

```text
/api/v1/auth
/api/v1/customers
/api/v1/sites
/api/v1/elevators
/api/v1/contracts
/api/v1/work-orders
/api/v1/tickets
/api/v1/inventory
/api/v1/procurement
/api/v1/invoices
/api/v1/reports
/api/v1/portal
```

---

# 4. Background jobs

Identify jobs such as:

```text
PM work-order generation
contract expiry checks
renewal reminders
SLA timers
invoice overdue reminders
low-stock checks
notification delivery
webhook retries
ZATCA submission retries
mobile sync processing
```

---

# 5. Event architecture

Define important domain events:

```text
ElevatorCreated
ContractActivated
MaintenanceDue
WorkOrderCreated
WorkOrderAssigned
TechnicianArrived
WorkOrderCompleted
FaultReported
SLABreachDetected
PartIssued
LowStockDetected
InvoiceIssued
PaymentReceived
ContractExpiring
```

Do not over-engineer event sourcing unless justified.

---

# PHASE 7 — IMPLEMENTATION PLAN

Create:

```text
docs/IMPLEMENTATION_PLAN.md
```

Recommended releases:

## R0 — Architecture & Migration Preparation

- Architecture freeze
- schema v1.1
- migration mapping
- API conventions
- security baseline

## R1 — Security & Platform Foundation

- authentication
- identity
- RBAC
- tenant/branch scope
- audit
- infrastructure
- backup/restore

## R2 — CRM + Elevator Asset + Work Order

- customer master
- site/building
- elevator
- work-order spine
- migration foundations

## R3 — Contracts + PM + CM + SLA

- contracts
- maintenance plans
- preventive workflows
- fault tickets
- SLA

## R4 — Dispatch + Technician App

- assignments
- dispatch board
- map
- technician mobile
- offline
- QR
- GPS
- signatures

## R5 — Inventory + Procurement

- item master
- warehouse
- vehicle stock
- stock transactions
- RFQ
- PO
- receipts
- supplier invoices

## R6 — Finance + ZATCA

- invoices
- billing schedules
- payments
- AR
- ZATCA
- profitability

## R7 — Portal + Compliance

- customer portal
- inspections
- certificates
- NCR

## R8 — Reporting + Automation + Integrations

- dashboards
- KPIs
- notifications
- workflow rules
- APIs
- webhooks
- accounting
- payment gateway

## R9 — AI + IoT

Only after high-quality operational data exists.

---

# PHASE 8 — DEVELOPMENT READINESS REPORT

Create:

```text
docs/DEVELOPMENT_READINESS.md
```

Score:

| Area | Score |
|---|---:|
| Business clarity | /100 |
| Requirements traceability | /100 |
| Data model | /100 |
| Security architecture | /100 |
| Field-service model | /100 |
| Finance readiness | /100 |
| Integration readiness | /100 |
| Migration readiness | /100 |
| DevOps readiness | /100 |
| QA readiness | /100 |

Then:

```text
Overall Development Readiness: XX/100
```

Also classify:

```text
READY
READY WITH CONDITIONS
NOT READY
```

List blockers.

---

# REQUIRED OUTPUT FILES

At minimum create:

```text
docs/
├── ARCHITECTURE_REVIEW.md
├── TRACEABILITY_MATRIX.md
├── SCHEMA_GAPS.md
├── SRS_V1.1_GAPS.md
├── BACKLOG_V1.1_CHANGES.md
├── IMPLEMENTATION_PLAN.md
└── DEVELOPMENT_READINESS.md

schema-v1.1.sql
```

Optional useful files:

```text
docs/
├── DOMAIN_MODEL.md
├── MIGRATION_PLAN.md
├── API_CONVENTIONS.md
├── SECURITY_ARCHITECTURE.md
└── DATA_DICTIONARY.md
```

---

# IMPORTANT RULES

## Rule 1

Do not invent current-system behavior.

Use `Link-Lift-System-Audit.md`.

## Rule 2

Do not silently change business requirements.

Flag contradictions.

## Rule 3

Do not remove the current installation/manufacturing engine.

## Rule 4

Do not begin application implementation before architecture review completion.

## Rule 5

Every recommendation should identify its source:

```text
Audit
BRD
SRS
Backlog
Schema
Architecture decision
```

## Rule 6

Keep existing requirement/story IDs stable whenever possible.

## Rule 7

Never store plaintext passwords.

## Rule 8

Never trust UI hiding as authorization.

Authorization must be server-side.

## Rule 9

Tenant and branch scope must be enforced server-side.

## Rule 10

Financial and inventory changes must be auditable.

## Rule 11

Work Order is the operational field-service spine.

## Rule 12

Elevator is the physical asset source of truth.

---

# FINAL EXECUTION INSTRUCTION

Read all source files completely.

Then execute the Architecture Readiness phase.

Create the requested documentation and:

```text
schema-v1.1.sql
```

Do not scaffold the production application yet.

At the end print a concise summary:

```text
Architecture Review: COMPLETE
Schema v1.1: CREATED
Traceability: COMPLETE
Backlog Gaps: DOCUMENTED
Migration Plan: DOCUMENTED
Development Readiness: XX/100
Blocking Issues: N
```

Then STOP and wait for the next instruction before application development.
