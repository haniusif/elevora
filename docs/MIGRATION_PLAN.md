# Migration Plan — Legacy Link Lift → Elevora v1.1

**Source:** live Link Lift (ASP.NET / SQL on somee.com), as characterised in `Link-Lift-System-Audit.md`.
**Target:** `schema-v1.1.sql`. **Backlog:** E21 (US-101..111). **Requirement:** SRS v1.1 DR-09.

> The current system stores the elevator spec **inside** maintenance/installation contracts and uses **free-text statuses**. Migration's central transformation is **deriving a de-duplicated `elevator` asset** and **mapping free-text to enums**, while reconciling counts and financial totals.

---

## 1. Source → target entity mapping

| Legacy screen / data | Target table(s) | Transformation |
|---|---|---|
| `emp` users (+ plaintext password) | `auth_user` + `employee_profile`/`technician` | Hash is NOT imported; set random hash + force reset. Map department → `role`. |
| shared `العميل` login | `auth_user`(party_kind=customer) + `customer_profile` | Replace shared login with per-customer accounts. |
| `newlead` customers/leads | `customer`, `lead`, `contact_person` | Split name/phone/address; infer type; CR/VAT if present else null. |
| customer address / district | `site`, `building` | Create a site per service address; building optional. |
| `mintcontract` maintenance contracts (125) | `contract`(maintenance) + `maintenance_contract` + `contract_elevator` + `sla_terms` + `contract_billing_schedule` | One agreement per contract; embedded elevator spec → `elevator` (see below). |
| embedded elevator spec (stops/floors/load/door/machine/brand) | `elevator` (+`elevator_component`) | **Derive de-duplicated asset** keyed by (customer, site, elevator_no/serial). Reuse across renewals. |
| `contract`/`offers` installation | `contract`(installation) + `installation_contract` + `quotation` | Preserve spec JSON; approve/reject history → quote status. |
| installation phases / factory / warehouse prep | legacy-preserving tables (installation module) | Retain as-is; link to the installation agreement + asset. |
| `mintperlist` visits (visits-done counts) | `work_order`(preventive) + `maintenance_visit` | Each performed visit → a completed WO + visit; counts reconcile. |
| `newmalf`/`openmalf` faults (timestamps) | `fault_ticket` (+ `work_order` repair) | Map free-text state → `ticket_status`; keep timestamps → SLA derivable. |
| `mintpay`/`paysearch`/`sppay` AR | `invoice` + `payment` + `payment_allocation` | value→invoice, paid→payments; outstanding = total−allocated. |
| `actionhistory` event log | `audit_log` | Map actor/user + event type; backfill as historical audit rows. |
| `salesprice` pricing config | `pricing_catalog` + `pricing_item` | Load catalogs with an effective_from date = migration date. |

---

## 2. Status mapping (free-text → enum) — US-109

| Legacy free text (examples) | Target enum |
|---|---|
| (contract active by dates) | `contract_status.active` / `expired` / `renewal_due` (computed from dates) |
| `تم بلاغ العطل` (fault reported) | `ticket_status.open` / `assigned` |
| `تم صيانة العطل` (fault serviced) | `ticket_status.resolved` / `closed` |
| `تم بلاغ العطل ولم يتم تبليغ فني ...` (not dispatched, unpaid) | `ticket_status.open` + `workflow_rule` dispatch-block flag |
| `تيست` / "test" | **excluded** (test data) |

Unmapped values are written to a `migration_unmapped` staging report for manual resolution; no silent defaulting.

---

## 3. Elevator asset derivation (the key step — US-102)

1. Collect every elevator spec instance from maintenance + installation contracts.
2. Group by natural key: `(customer, site/address, elevator_no or serial)`.
3. Create one `elevator` per group; attach the fullest spec; set `status` from the latest contract.
4. Re-parent all history (visits, faults, payments-by-elevator, documents) to the derived asset.
5. Renewed contracts of the same machine point at the **same** `elevator` (history continuity).
6. Generate QR codes for assets lacking one.

---

## 4. Reconciliation (US-110) — gate for cutover

| Check | Rule |
|---|---|
| Record counts | source count = destination count per entity (customers, contracts, faults, payments) |
| Financial totals | Σ legacy AR value = Σ target invoice totals; Σ paid = Σ payments; outstanding matches |
| Asset linkage | 100% of active contracts link to a valid `elevator` |
| History traceability | each migrated visit/fault/payment resolves to its asset |
| Security | no plaintext passwords imported; all users force-reset |
| Test exclusion | zero records flagged test (`تيست`/"test") in production tables |

A reconciliation report must be **all-green** before cutover.

---

## 5. Cutover & rollback (US-111)

- **Dry runs** on a copy until reconciliation is green and stable.
- **Freeze window:** legacy set read-only; run final delta migration; reconcile; switch DNS/app.
- **Rollback:** keep legacy read-only and the pre-cutover target snapshot; if reconciliation fails post-switch, revert to legacy and re-plan. Document go/no-go owners.
- **Post-cutover:** users complete forced password reset; spot-check 20 assets end-to-end (asset → contract → visit/fault → invoice).

---

## 6. Risks

| Risk | Mitigation |
|---|---|
| Duplicate/ambiguous elevator identity | manual review queue for unresolved groups before go-live |
| Free-text statuses not mapping cleanly | `migration_unmapped` report; business sign-off |
| Financial totals not reconciling | block cutover; reconcile line by line |
| Legacy data quality (missing VAT/CR) | import nullable; flag for post-go-live enrichment |
