# API Conventions — v1

**Scope:** REST API shared by Web Admin, Customer Portal, and Technician App (SRS IR-07, IR-09). High-level conventions only — endpoints are not implemented in this phase.

---

## 1. Base & versioning
- Base path `/api/v1`. Breaking changes → `/api/v2`; additive changes stay in v1.
- JSON only (`application/json; charset=utf-8`). UTC ISO-8601 timestamps. SAR money as decimal strings.

## 2. Authentication & tenancy
- OAuth2 / JWT bearer. Token carries `sub` (auth_user), `tenant_id`, roles.
- Server sets `app.tenant_id` from the token for RLS; **never** trust a tenant/branch id from the client body.
- Portal tokens carry `customer` scope; portal endpoints filter to the caller's `customer_id` server-side.

## 3. Authorization
- Every endpoint checks RBAC (module × verb) **and** data scope (all/company/branch/team/assigned/own/customer) server-side. UI hiding is never the control (Rule 8).
- 403 on authz failure; 404 (not 403) when a record exists but is out of the caller's scope, to avoid leaking existence.

## 4. Pagination, filtering, sorting
- Cursor pagination by default: `?limit=50&cursor=…`; response `{ data:[…], next_cursor }`. Max `limit` enforced server-side (US-090).
- Filtering: explicit query params per resource (`?status=active&branch_id=…&from=…&to=…`). No arbitrary SQL.
- Sorting: `?sort=-created_at` (prefix `-` = desc). Whitelisted fields only.

## 5. Error envelope (consistent)
```json
{ "error": { "code": "validation_error", "message": "Human readable",
             "details": [ { "field": "due_date", "issue": "required" } ],
             "request_id": "…" } }
```
Codes: `validation_error` (422), `unauthorized` (401), `forbidden` (403), `not_found` (404), `conflict` (409), `rate_limited` (429), `internal` (500), `integration_unavailable` (503).

## 6. Idempotency
- Unsafe POSTs that create money/stock movement accept `Idempotency-Key` header; replays return the original result (no double invoice/stock txn).

## 7. Rate limiting & quotas
- Per-token and per-IP limits; `429` with `Retry-After`. Public API keys have quotas.

## 8. Webhooks (IR-09)
- Outbound events are HMAC-signed (`X-Signature: sha256=…` over the raw body) with a per-endpoint secret.
- At-least-once delivery with exponential backoff; each delivery carries a unique `id` + `idempotency_key` so consumers dedupe.
- Event names match the domain events in `ARCHITECTURE_REVIEW.md` §5.

## 9. Files
- Upload via pre-signed object-storage URLs; the API stores a `document` row. Portal downloads are scoped to `customer_visible = true AND customer_id = me`.

## 10. Mobile sync (FR-174)
- `/sync` accepts a batch of offline operations with client timestamps; server applies conflict rules (monotonic status never regresses; signatures/parts append-only; last-write-wins per scalar by server time) and returns per-op results + server state.

## 11. Health & observability
- `/healthz` (liveness), `/readyz` (readiness incl. DB + queue). Every response carries `request_id` for log correlation; p95 latency tracked per route.
