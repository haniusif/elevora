# Security Architecture

**Scope:** security baseline for the target system. Directly remediates the audit's CRITICAL finding (plaintext passwords) and enforces Rules 7–10.
**Traces:** FR-01..06, NFR-01..04, NFR-60/61, DR-03.

---

## 1. Identity & credentials
- Single `auth_user` store for employees, technicians, admins, finance, warehouse, and customers (unified identity). **No plaintext password column exists anywhere** (Rule 7). Hash with argon2id (or bcrypt cost ≥ 12) + per-user salt.
- Password policy, lockout after N failed attempts (`failed_logins`/`locked_until`), session timeout, optional MFA (`mfa_secret`).
- Legacy plaintext passwords are **never imported**; all users force-reset at cutover.

## 2. Authorization (defense-in-depth, server-side only — Rule 8)
Three enforced layers, every request:
1. **RBAC** — role × module × verb (`permission`); 10 verbs incl. Approve/Assign/Export/Print; finance verbs independently assigned.
2. **Data scope** — `role.scope` ∈ {all, company, own_branch, own_team, assigned, own, customer}; applied in queries.
3. **Row-Level Security (RLS)** — tenant isolation in the database:
   ```sql
   ALTER TABLE <t> ENABLE ROW LEVEL SECURITY;
   CREATE POLICY tenant_isolation ON <t>
     USING (tenant_id = current_setting('app.tenant_id')::bigint);
   ```
UI hiding is never a control. Out-of-scope reads return 404 (not 403) to avoid leaking existence.

## 3. Tenant & branch isolation (Rule 9)
- `tenant_id` on every business table + **composite FKs** carrying `tenant_id` (prevent cross-tenant references) + **tenant-aware unique constraints** (`UNIQUE (tenant_id, …)`).
- Tenant middleware sets `app.tenant_id` from the JWT per request; RLS enforces; application enforces branch/record scope on top.

## 4. Auditability (Rule 10)
- Append-only `audit_log` (REVOKE UPDATE/DELETE + BEFORE UPDATE/DELETE trigger raising an exception; monthly partitioning; optional hash chain). Every create/update/delete/approve/assign/status-change recorded with actor, old/new, IP, device — **including portal actions** (unified identity makes this possible).
- Financial and inventory ledgers (`invoice`, `payment`, `stock_txn`, `goods_receipt*`) are append-only; corrections are compensating records, never deletes.

## 5. Application security (OWASP)
- **IDOR:** object-level authorization on every record id; RLS as backstop.
- **XSS:** output encoding; CSP; no untrusted HTML.
- **SQLi:** parameterised queries / ORM only.
- **CSRF:** tokens on state-changing requests (or same-site + bearer for the SPA/API).
- **Rate limiting & brute-force protection** on auth and public API.
- **Secrets:** in a vault/KMS, never in code or config (US-091).

## 6. Data protection
- TLS in transit; encryption at rest for DB and object storage.
- PII (national ID, phone) access restricted by role; masked where not needed; portal documents gated by `customer_visible` + ownership (prevents internal-file leakage).

## 7. Integration security (IR-10)
- ZATCA/SMS/WhatsApp/email/payment via the `integration_outbox` with retries, backoff, dead-letter, and **idempotent** submission (no duplicate cleared invoice). Outbound webhooks HMAC-signed with per-endpoint secrets.

## 8. Resilience (NFR-60/61)
- Automated daily backups with **tested** restore; RPO ≤ 24h, RTO ≤ 4h; rehearsed DR runbook.
- Observability: structured logs, metrics (p95), traces, error tracking, integration-failure and SLA alerts; `/healthz` `/readyz`.

## 9. Immediate remediation (before anything else ships)
1. Hash all passwords; remove the plaintext column from UI and markup; force reset.
2. Replace the shared customer login with per-customer accounts.
3. Move off free-tier hosting; enable backups and RLS.
These three are the entry gate to R1 and are tracked as US-001/002/003/009.
