-- ============================================================================
-- Elevora — Elevator Operations Platform
-- TARGET DATA MODEL v1.1 (PostgreSQL 15+)  --  16 Oct 2026
--
-- Supersedes schema.sql (draft). Implements the 22 corrections in
-- docs/SCHEMA_GAPS.md and the amendments in docs/SRS_V1.1_GAPS.md.
-- Traceability: docs/TRACEABILITY_MATRIX.md.
--
-- GUIDING RULES (from MASTER_BUILD_PROMPT):
--   * Elevator = physical-asset source of truth.
--   * Work Order = operational field-service spine (single truth).
--   * Identity unified (auth_user) so ALL actions incl. portal are attributable.
--   * No plaintext passwords. Authorization is server-side (RLS + app), never UI.
--   * Tenant + branch scope enforced server-side. Audit & ledgers append-only.
--   * Installation/manufacturing engine preserved and integrated.
--
-- TENANT-SCOPING STRATEGY (see §T and SECURITY_ARCHITECTURE.md):
--   Every business table has tenant_id. Cross-tenant FKs are prevented by
--   composite FKs that carry tenant_id, tenant-aware UNIQUE constraints, and
--   Row-Level Security policies keyed on current_setting('app.tenant_id').
--   Representative composite FKs/RLS are shown; the same pattern applies to all.
--
-- MIGRATION ASSUMPTIONS (see MIGRATION_PLAN.md / Backlog E21):
--   Legacy embedded elevator specs -> one `elevator` each; history re-parents to
--   the asset; free-text statuses map to enums; plaintext passwords NOT imported
--   (force reset); test data (e.g. "تيست") excluded; financial totals reconcile.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===========================================================================
-- §0  ENUM TYPES  (per-entity lifecycles; no shared status enum) -- G-01,03,07,10,14,17,18
-- ===========================================================================
CREATE TYPE customer_type        AS ENUM ('individual','company');
CREATE TYPE lead_stage           AS ENUM ('new','contacted','qualified','quoted','won','lost');
CREATE TYPE party_kind           AS ENUM ('employee','customer','system');
CREATE TYPE agreement_type       AS ENUM ('installation','maintenance','estimation');
CREATE TYPE asset_status         AS ENUM ('planned','active','under_maintenance','out_of_service','decommissioned');
CREATE TYPE elevator_drive       AS ENUM ('geared','gearless','hydraulic','mrl','other');
CREATE TYPE door_type            AS ENUM ('manual','semi_automatic','automatic','other');
CREATE TYPE component_status      AS ENUM ('installed','replaced','removed','faulty');
CREATE TYPE contract_cover       AS ENUM ('comprehensive','non_comprehensive');     -- شامل / غير شامل
CREATE TYPE contract_status      AS ENUM ('draft','pending_approval','active','suspended','expired','renewal_due','renewed','cancelled');
CREATE TYPE quote_status         AS ENUM ('draft','pending_approval','approved','rejected','converted','expired');
CREATE TYPE billing_sched_status AS ENUM ('pending','invoiced','paid','cancelled');
CREATE TYPE billing_type         AS ENUM ('fixed','percentage','milestone');
CREATE TYPE plan_frequency       AS ENUM ('weekly','monthly','quarterly','semiannual','annual','custom_days');
CREATE TYPE wo_status            AS ENUM ('draft','scheduled','assigned','en_route','started','on_hold_parts','completed','customer_signed','supervisor_approved','closed','cancelled');
CREATE TYPE visit_status         AS ENUM ('scheduled','performed','approved','missed');   -- PM extension; operational truth is the WO
CREATE TYPE priority_level       AS ENUM ('low','normal','high','critical','emergency');
CREATE TYPE ticket_status        AS ENUM ('open','assigned','acknowledged','en_route','on_site','diagnosis','waiting_parts','repairing','testing','resolved','customer_confirmed','closed','reopened');
CREATE TYPE assignment_role      AS ENUM ('lead','assist','trainee');
CREATE TYPE answer_type          AS ENUM ('pass_fail','boolean','number','text','choice','photo','measurement','signature');  -- G-18
CREATE TYPE checklist_result     AS ENUM ('pass','fail','na');
CREATE TYPE sla_target_type      AS ENUM ('response','arrival','repair');
CREATE TYPE comment_visibility   AS ENUM ('customer','internal');
CREATE TYPE stock_txn_type       AS ENUM ('in','out','transfer','reservation','release','adjustment','return','damaged');
CREATE TYPE warehouse_kind       AS ENUM ('main','branch','vehicle','site');
CREATE TYPE pr_status            AS ENUM ('draft','pending_approval','approved','rejected','closed');
CREATE TYPE rfq_status           AS ENUM ('draft','sent','quoted','awarded','closed','cancelled');
CREATE TYPE supplier_quote_status AS ENUM ('received','shortlisted','selected','rejected');
CREATE TYPE po_status            AS ENUM ('draft','pending_approval','approved','sent','partially_received','received','invoiced','closed','cancelled');
CREATE TYPE grn_status           AS ENUM ('draft','posted','cancelled');
CREATE TYPE supplier_invoice_status AS ENUM ('draft','matched','approved','paid','disputed');
CREATE TYPE return_status        AS ENUM ('draft','sent','accepted','rejected','closed');
CREATE TYPE invoice_kind         AS ENUM ('contract','repair','parts','installation','credit_note');
CREATE TYPE invoice_status       AS ENUM ('draft','issued','cleared','reported','paid','partially_paid','overdue','void');
CREATE TYPE zatca_status         AS ENUM ('not_submitted','queued','cleared','reported','failed');
CREATE TYPE payment_method       AS ENUM ('cash','bank_transfer','card','online_gateway','cheque');
CREATE TYPE notification_channel AS ENUM ('in_app','email','sms','whatsapp','push');
CREATE TYPE inspection_kind      AS ENUM ('safety','quality','regulatory');
CREATE TYPE ncr_status           AS ENUM ('open','in_progress','closed');
CREATE TYPE data_scope           AS ENUM ('all','company','own_branch','own_team','assigned','own','customer');
CREATE TYPE access_level         AS ENUM ('internal','branch','customer');

-- ===========================================================================
-- §1  ORGANIZATION (tenant / internal branch)  -- distinct from customer hierarchy (G-05)
-- ===========================================================================
CREATE TABLE tenant (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name          text NOT NULL,
  vat_number    text,
  cr_number     text,
  default_vat_rate numeric(5,2) NOT NULL DEFAULT 15.00,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE branch (                      -- INTERNAL org unit of the tenant (NOT a customer branch)
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id     bigint NOT NULL REFERENCES tenant(id),
  code          text NOT NULL,
  name          text NOT NULL,             -- e.g. الرياض
  city          text,
  is_active     boolean NOT NULL DEFAULT true,
  UNIQUE (tenant_id, code),
  UNIQUE (tenant_id, id)                   -- supports composite FKs that carry tenant_id
);

-- ===========================================================================
-- §2  UNIFIED IDENTITY, RBAC, AUDIT  -- G-02, G-03 ; FR-01..06, FR-05
-- ===========================================================================
CREATE TABLE auth_user (                   -- single credential store for ALL actors
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id      bigint NOT NULL REFERENCES tenant(id),
  party_kind     party_kind NOT NULL,
  username       text NOT NULL,
  email          text,
  phone          text,
  password_hash  text NOT NULL,            -- FR-01: hashed+salted ONLY. No plaintext column exists anywhere.
  mfa_secret     text,
  is_active      boolean NOT NULL DEFAULT true,
  failed_logins  int NOT NULL DEFAULT 0,
  locked_until   timestamptz,
  last_login_at  timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, username),
  UNIQUE (tenant_id, id)
);

CREATE TABLE role (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id     bigint NOT NULL REFERENCES tenant(id),
  code          text NOT NULL,             -- GM, branch_manager, maintenance, dispatcher, technician, finance, store, procurement, customer, auditor...
  name          text NOT NULL,
  scope         data_scope NOT NULL DEFAULT 'own_branch',
  UNIQUE (tenant_id, code)
);

CREATE TABLE permission (                  -- FR-03: per module x verb (10 verbs)
  id        bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  role_id   bigint NOT NULL REFERENCES role(id) ON DELETE CASCADE,
  module    text   NOT NULL,
  verb      text   NOT NULL CHECK (verb IN ('view','create','edit','delete','approve','reject','assign','close','export','print')),
  UNIQUE (role_id, module, verb)
);

CREATE TABLE user_role (
  auth_user_id bigint NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
  role_id      bigint NOT NULL REFERENCES role(id),
  PRIMARY KEY (auth_user_id, role_id)
);

CREATE TABLE employee_profile (            -- specialization of auth_user
  auth_user_id  bigint PRIMARY KEY REFERENCES auth_user(id) ON DELETE CASCADE,
  tenant_id     bigint NOT NULL,
  branch_id     bigint,
  employee_no   text,
  full_name     text NOT NULL,
  job_title     text,
  FOREIGN KEY (tenant_id, branch_id) REFERENCES branch(tenant_id, id)   -- composite tenant FK (G-04)
);

CREATE TABLE technician (                  -- specialization of employee (FR-72)
  auth_user_id   bigint PRIMARY KEY REFERENCES employee_profile(auth_user_id) ON DELETE CASCADE,
  team           text,
  supervisor_id  bigint REFERENCES auth_user(id),
  region_zone    text,
  skills         text[] DEFAULT '{}',
  certifications text[] DEFAULT '{}',
  hajj_permit    boolean NOT NULL DEFAULT false,   -- تصريح حج (retained Saudi-specific)
  is_available   boolean NOT NULL DEFAULT true
);

CREATE TABLE customer_profile (            -- portal identity; replaces shared العميل login (G-02)
  auth_user_id  bigint PRIMARY KEY REFERENCES auth_user(id) ON DELETE CASCADE,
  customer_id   bigint NOT NULL,           -- FK added after customer table (see §3)
  full_name     text
);

-- Append-only audit (G-03). Partitioned monthly; UPDATE/DELETE revoked + blocked by trigger.
CREATE TABLE audit_log (
  id          bigint GENERATED ALWAYS AS IDENTITY,
  tenant_id   bigint NOT NULL,
  actor_id    bigint REFERENCES auth_user(id),   -- ALL actions (incl. portal) attributable
  action      text NOT NULL,
  module      text NOT NULL,
  record_id   text,
  old_value   jsonb,
  new_value   jsonb,
  ip          inet,
  device      text,
  prev_hash   text,                               -- optional tamper-evident chain
  row_hash    text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);
CREATE TABLE audit_log_2026m10 PARTITION OF audit_log
  FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');   -- create monthly partitions via job
CREATE INDEX ix_audit_module_record ON audit_log (module, record_id);
CREATE INDEX ix_audit_actor_time    ON audit_log (actor_id, created_at);
-- Enforcement (documented):
--   REVOKE UPDATE, DELETE ON audit_log FROM app_role;
--   CREATE FUNCTION audit_block() RETURNS trigger LANGUAGE plpgsql AS
--     $$ BEGIN RAISE EXCEPTION 'audit_log is append-only'; END $$;
--   CREATE TRIGGER trg_audit_block BEFORE UPDATE OR DELETE ON audit_log
--     FOR EACH ROW EXECUTE FUNCTION audit_block();

-- ===========================================================================
-- §3  CRM & CUSTOMER HIERARCHY  -- G-05 ; FR-10/11/12, FR-170
-- ===========================================================================
CREATE TABLE customer (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id       bigint NOT NULL REFERENCES tenant(id),
  owner_branch_id bigint,                          -- internal owning branch (scoping), NOT customer structure
  code            text,
  type            customer_type NOT NULL DEFAULT 'individual',
  name_ar         text NOT NULL,
  name_en         text,
  national_id     text,                             -- سجل مدني
  cr_number       text,                             -- commercial registration
  vat_number      text,                             -- الرقم الضريبى (ZATCA)
  national_address text,
  phone           text,
  email           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  created_by      bigint REFERENCES auth_user(id),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  updated_by      bigint REFERENCES auth_user(id),
  deleted_at      timestamptz,                      -- soft delete justified (customer master)
  deleted_by      bigint REFERENCES auth_user(id),
  UNIQUE (tenant_id, code),
  FOREIGN KEY (tenant_id, owner_branch_id) REFERENCES branch(tenant_id, id),
  UNIQUE (tenant_id, id)
);
ALTER TABLE customer_profile
  ADD CONSTRAINT fk_cust_profile_customer FOREIGN KEY (customer_id) REFERENCES customer(id);

CREATE TABLE customer_account (             -- CUSTOMER's own branch/account (NOT internal branch) (G-05)
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id     bigint NOT NULL,
  customer_id   bigint NOT NULL REFERENCES customer(id) ON DELETE CASCADE,
  name          text NOT NULL,
  billing_address text,
  UNIQUE (tenant_id, id)
);

CREATE TABLE contact_person (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id  bigint NOT NULL REFERENCES customer(id) ON DELETE CASCADE,
  name         text NOT NULL,
  title        text, phone text, email text,
  is_primary   boolean NOT NULL DEFAULT false
);

CREATE TABLE site (
  id                 bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id          bigint NOT NULL,
  customer_id        bigint NOT NULL REFERENCES customer(id) ON DELETE CASCADE,
  customer_account_id bigint REFERENCES customer_account(id),
  name               text NOT NULL,
  district           text,                 -- e.g. النرجس - شمال
  city               text,
  service_address    text,
  latitude           numeric(9,6),
  longitude          numeric(9,6),
  UNIQUE (tenant_id, id)
);

CREATE TABLE building (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id    bigint NOT NULL,
  site_id      bigint NOT NULL REFERENCES site(id) ON DELETE CASCADE,
  name         text,
  floors_count int,
  UNIQUE (tenant_id, id)
);

CREATE TABLE lead (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id      bigint NOT NULL REFERENCES tenant(id),
  owner_branch_id bigint,
  name           text NOT NULL,
  phone          text, address text, source text,
  stage          lead_stage NOT NULL DEFAULT 'new',
  expected_value numeric(14,2),
  salesperson_id bigint REFERENCES auth_user(id),
  customer_id    bigint REFERENCES customer(id),
  note1 text, note1_date date, note2 text, note2_date date,
  created_at     timestamptz NOT NULL DEFAULT now(),
  created_by     bigint REFERENCES auth_user(id)
);

-- ===========================================================================
-- §4  ELEVATOR ASSET + COMPONENTS + DOCUMENTS  -- G-06, G-19 ; FR-20..24
-- ===========================================================================
CREATE TABLE elevator (
  id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id         bigint NOT NULL REFERENCES tenant(id),
  owner_branch_id   bigint,
  asset_no          text NOT NULL,
  serial_no         text,
  qr_code           text,
  barcode           text,
  customer_id       bigint REFERENCES customer(id),
  site_id           bigint REFERENCES site(id),
  building_id       bigint REFERENCES building(id),
  manufacturer      text, brand text, model text,
  elevator_type     text,
  capacity_kg       int, speed_mps numeric(5,2),
  stops_count       int, floors_count int, entrances_count int,
  door_type         door_type, door_size text,
  machine_type      text, controller_type text, drive_type elevator_drive, cabin_type text,
  installation_date date, commissioning_date date,
  warranty_start    date, warranty_end date,
  status            asset_status NOT NULL DEFAULT 'active',
  latitude          numeric(9,6), longitude numeric(9,6),
  created_at        timestamptz NOT NULL DEFAULT now(),
  created_by        bigint REFERENCES auth_user(id),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  updated_by        bigint REFERENCES auth_user(id),
  deleted_at        timestamptz, deleted_by bigint REFERENCES auth_user(id),
  UNIQUE (tenant_id, asset_no),
  UNIQUE (tenant_id, qr_code),
  UNIQUE (tenant_id, id)
);
CREATE INDEX ix_elevator_customer ON elevator (customer_id);
CREATE INDEX ix_elevator_site     ON elevator (site_id);

CREATE TABLE elevator_component (           -- G-06: major replaceable components
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id     bigint NOT NULL,
  elevator_id   bigint NOT NULL REFERENCES elevator(id) ON DELETE CASCADE,
  component_type text NOT NULL,             -- machine, controller, door_operator, cabin, rope, ARD/battery...
  brand text, model text, serial_no text,
  installed_at date, replaced_at date,
  warranty_end date,
  status        component_status NOT NULL DEFAULT 'installed'
);

CREATE TABLE document (                     -- G-19: access-controlled, versioned
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id    bigint NOT NULL,
  entity_type  text NOT NULL,               -- 'elevator','contract','work_order','invoice','inspection','ticket'...
  entity_id    bigint NOT NULL,
  category     text,                         -- contract|report|certificate|photo|drawing|invoice
  access_level access_level NOT NULL DEFAULT 'internal',
  customer_visible boolean NOT NULL DEFAULT false,   -- portal gate (prevents internal-file leakage)
  customer_id  bigint REFERENCES customer(id),
  file_url     text NOT NULL, mime_type text, size_bytes bigint,
  version      int NOT NULL DEFAULT 1,
  supersedes_id bigint REFERENCES document(id),
  expiry_date  date,
  uploaded_by  bigint REFERENCES auth_user(id),
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_document_entity   ON document (entity_type, entity_id);
CREATE INDEX ix_document_portal   ON document (customer_id) WHERE customer_visible;

-- ===========================================================================
-- §5  COMMERCIAL AGREEMENTS (supertype) + specializations  -- G-13 ; FR-30..33, FR-110, FR-171
-- ===========================================================================
CREATE TABLE contract (                      -- supertype = commercial agreement (Option B)
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id       bigint NOT NULL REFERENCES tenant(id),
  owner_branch_id bigint,
  agreement_type  agreement_type NOT NULL,
  contract_no     text NOT NULL,
  customer_id     bigint NOT NULL REFERENCES customer(id),
  status          contract_status NOT NULL DEFAULT 'draft',
  value           numeric(14,2),
  start_date      date, end_date date, renewal_date date,
  auto_renew      boolean NOT NULL DEFAULT false,
  renewed_from    bigint REFERENCES contract(id),     -- renewal continuity (T21)
  salesperson_id  bigint REFERENCES auth_user(id),
  notes_ar text, notes_en text,
  created_at timestamptz NOT NULL DEFAULT now(), created_by bigint REFERENCES auth_user(id),
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by bigint REFERENCES auth_user(id),
  UNIQUE (tenant_id, contract_no),
  UNIQUE (tenant_id, id)
);
CREATE INDEX ix_contract_status ON contract (status, end_date);

CREATE TABLE maintenance_contract (          -- specialization
  contract_id      bigint PRIMARY KEY REFERENCES contract(id) ON DELETE CASCADE,
  cover            contract_cover NOT NULL DEFAULT 'non_comprehensive',   -- شامل/غير شامل
  visits_total     int, visit_every_days int,
  maintenance_day  text, zone text,
  emergency_cover  boolean NOT NULL DEFAULT false,
  parts_cover      boolean NOT NULL DEFAULT false,
  included_services text, excluded_services text,
  maintenance_tech_id bigint REFERENCES auth_user(id),   -- فنى الصيانة
  fault_tech_id       bigint REFERENCES auth_user(id),   -- فنى الاعطال
  renew_count      int NOT NULL DEFAULT 0
);

CREATE TABLE installation_contract (         -- specialization (preserved engine, FR-160)
  contract_id   bigint PRIMARY KEY REFERENCES contract(id) ON DELETE CASCADE,
  quotation_id  bigint,                       -- -> quotation (below)
  spec          jsonb,                         -- shaft/cabin/machine/options/crew assignment/decor
  delivered_at  date,
  elevator_id   bigint REFERENCES elevator(id) -- FR-24: asset created on delivery
);

CREATE TABLE quotation (                     -- parity w/ العروض (approve/reject) FR-33
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id     bigint NOT NULL REFERENCES tenant(id),
  owner_branch_id bigint,
  quote_no      text NOT NULL,
  customer_id   bigint REFERENCES customer(id),
  lead_id       bigint REFERENCES lead(id),
  salesperson_id bigint REFERENCES auth_user(id),
  spec          jsonb,
  price         numeric(14,2),
  system_price  numeric(14,2),                 -- السعر حسب النظام (pricing engine output)
  status        quote_status NOT NULL DEFAULT 'draft',
  reject_reason text,
  quote_date    date,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, quote_no)
);
ALTER TABLE installation_contract
  ADD CONSTRAINT fk_ic_quote FOREIGN KEY (quotation_id) REFERENCES quotation(id);

CREATE TABLE contract_elevator (             -- FR-30: multi-elevator agreements
  contract_id bigint NOT NULL REFERENCES contract(id) ON DELETE CASCADE,
  elevator_id bigint NOT NULL REFERENCES elevator(id),
  PRIMARY KEY (contract_id, elevator_id)
);

CREATE TABLE sla_terms (                     -- FR-30, feeds SLA targets
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  contract_id   bigint NOT NULL REFERENCES contract(id) ON DELETE CASCADE,
  response_mins int, arrival_mins int, repair_mins int,
  penalty_terms text
);

CREATE TABLE contract_billing_schedule (     -- G-12 ; FR-171
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  contract_id  bigint NOT NULL REFERENCES contract(id) ON DELETE CASCADE,
  sequence     int NOT NULL,
  billing_type billing_type NOT NULL,
  due_date     date,
  percentage   numeric(5,2),
  amount       numeric(14,2),
  status       billing_sched_status NOT NULL DEFAULT 'pending',
  invoice_id   bigint,                         -- -> invoice (set when billed)
  UNIQUE (contract_id, sequence)
);

CREATE TABLE maintenance_plan (              -- FR-40 source of PM work orders
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id     bigint NOT NULL,
  contract_id   bigint NOT NULL REFERENCES contract(id) ON DELETE CASCADE,
  elevator_id   bigint NOT NULL REFERENCES elevator(id),
  frequency     plan_frequency NOT NULL,
  interval_days int,                           -- when custom_days
  next_due_date date,
  is_active     boolean NOT NULL DEFAULT true
);
CREATE INDEX ix_plan_due ON maintenance_plan (next_due_date) WHERE is_active;

-- ===========================================================================
-- §6  WORK ORDER SPINE  -- G-07, G-08, G-09, G-18 ; FR-60..62
-- ===========================================================================
CREATE TABLE work_type (                     -- G-07 configurable work type
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id     bigint NOT NULL REFERENCES tenant(id),
  code          text NOT NULL,                -- preventive, fault, inspection, installation, modernization, customer_request, internal
  name          text NOT NULL,
  billable_default boolean NOT NULL DEFAULT false,
  default_checklist_template_id bigint,       -- -> checklist_template
  UNIQUE (tenant_id, code)
);

CREATE TABLE work_order (                    -- SINGLE operational source of truth (G-09)
  id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id         bigint NOT NULL REFERENCES tenant(id),
  owner_branch_id   bigint,
  wo_no             text NOT NULL,
  work_type_id      bigint NOT NULL REFERENCES work_type(id),
  status            wo_status NOT NULL DEFAULT 'draft',
  priority          priority_level NOT NULL DEFAULT 'normal',
  customer_id       bigint REFERENCES customer(id),
  site_id           bigint REFERENCES site(id),
  elevator_id       bigint REFERENCES elevator(id),
  contract_id       bigint REFERENCES contract(id),
  plan_id           bigint REFERENCES maintenance_plan(id),   -- set when auto-generated (FR-40)
  fault_ticket_id   bigint,                                   -- set when source = fault
  primary_technician_id bigint REFERENCES auth_user(id),      -- denormalized from primary assignment
  supervisor_id     bigint REFERENCES auth_user(id),
  scheduled_at      timestamptz,
  checkin_at        timestamptz, checkout_at timestamptz,
  checkin_lat numeric(9,6), checkin_lng numeric(9,6),         -- GPS verification (FR-81)
  labour_hours      numeric(6,2), travel_mins int,
  findings          text,
  customer_signature_url text,
  service_report_url text,
  billable          boolean NOT NULL DEFAULT false,
  job_cost          numeric(14,2),                             -- parts + labour (FR-62/112)
  created_at timestamptz NOT NULL DEFAULT now(), created_by bigint REFERENCES auth_user(id),
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by bigint REFERENCES auth_user(id),
  UNIQUE (tenant_id, wo_no),
  UNIQUE (tenant_id, id)
);
CREATE INDEX ix_wo_elevator ON work_order (elevator_id);
CREATE INDEX ix_wo_status   ON work_order (status);
CREATE INDEX ix_wo_sched    ON work_order (scheduled_at);

CREATE TABLE work_order_assignment (         -- G-08 multi-technician
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  work_order_id bigint NOT NULL REFERENCES work_order(id) ON DELETE CASCADE,
  technician_id bigint NOT NULL REFERENCES auth_user(id),
  assignment_role assignment_role NOT NULL DEFAULT 'lead',
  is_primary    boolean NOT NULL DEFAULT false,
  assigned_at   timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz, started_at timestamptz, completed_at timestamptz,
  UNIQUE (work_order_id, technician_id)
);
CREATE UNIQUE INDEX uq_wo_primary ON work_order_assignment (work_order_id) WHERE is_primary;

-- Checklists (G-18 typed answers) -- shared shape for templates and WO instances
CREATE TABLE checklist_template (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id   bigint NOT NULL REFERENCES tenant(id),
  name        text NOT NULL,
  applies_to  text                            -- work_type code or inspection kind
);
CREATE TABLE checklist_template_item (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  template_id   bigint NOT NULL REFERENCES checklist_template(id) ON DELETE CASCADE,
  seq           int NOT NULL,
  label_ar      text NOT NULL, label_en text,
  answer_type   answer_type NOT NULL DEFAULT 'pass_fail',
  required      boolean NOT NULL DEFAULT true,
  unit          text, min_value numeric, max_value numeric,
  choice_options text[],
  photo_required_on_fail boolean NOT NULL DEFAULT false,
  creates_fault_on_fail  boolean NOT NULL DEFAULT false
);
CREATE TABLE work_order_checklist (          -- instance results (typed value columns)
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  work_order_id bigint NOT NULL REFERENCES work_order(id) ON DELETE CASCADE,
  seq           int NOT NULL,
  label         text NOT NULL,
  answer_type   answer_type NOT NULL,
  result        checklist_result,            -- for pass_fail/boolean
  value_number  numeric, value_text text, value_choice text,
  photo_document_id bigint REFERENCES document(id),
  note          text
);

-- ===========================================================================
-- §7  PREVENTIVE VISITS & CORRECTIVE TICKETS  -- G-09, G-10, G-11
-- ===========================================================================
CREATE TABLE maintenance_visit (             -- PM extension of a WO (1:1, mandatory) G-09
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id       bigint NOT NULL,
  work_order_id   bigint NOT NULL UNIQUE REFERENCES work_order(id) ON DELETE CASCADE,
  contract_id     bigint REFERENCES contract(id),
  elevator_id     bigint NOT NULL REFERENCES elevator(id),
  plan_id         bigint REFERENCES maintenance_plan(id),
  visit_sequence  int,
  status          visit_status NOT NULL DEFAULT 'scheduled',   -- PM-specific only; times/truth on the WO
  supervisor_approved_by bigint REFERENCES auth_user(id),
  supervisor_approved_at timestamptz
);
CREATE INDEX ix_visit_elevator ON maintenance_visit (elevator_id);

CREATE TABLE fault_ticket (                  -- G-10 full SLA lifecycle
  id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id         bigint NOT NULL REFERENCES tenant(id),
  owner_branch_id   bigint,
  ticket_no         text NOT NULL,
  elevator_id       bigint NOT NULL REFERENCES elevator(id),
  customer_id       bigint REFERENCES customer(id),
  contract_id       bigint REFERENCES contract(id),
  work_order_id     bigint REFERENCES work_order(id),   -- the repair WO (operational truth)
  fault_type        text, description text,
  priority          priority_level NOT NULL DEFAULT 'normal',
  status            ticket_status NOT NULL DEFAULT 'open',
  -- full timestamp lifecycle (FR-50/53):
  reported_at timestamptz, assigned_at timestamptz, acknowledged_at timestamptz,
  en_route_at timestamptz, arrival_at timestamptz, diagnosis_at timestamptz,
  repair_start_at timestamptz, resolved_at timestamptz,
  customer_confirmed_at timestamptz, closed_at timestamptz,
  root_cause text, corrective_action text, repair_report text,
  fault_tech_id bigint REFERENCES auth_user(id),
  customer_confirm_code text, tech_confirm_code text,   -- retained dual confirmation
  reopened_from bigint REFERENCES fault_ticket(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, ticket_no),
  UNIQUE (tenant_id, id)
);
CREATE INDEX ix_ticket_status   ON fault_ticket (status);
CREATE INDEX ix_ticket_elevator ON fault_ticket (elevator_id, reported_at);
ALTER TABLE work_order ADD CONSTRAINT fk_wo_ticket
  FOREIGN KEY (fault_ticket_id) REFERENCES fault_ticket(id);

CREATE TABLE sla_target (                    -- per ticket, derived from contract SLA
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ticket_id   bigint NOT NULL REFERENCES fault_ticket(id) ON DELETE CASCADE,
  target_type sla_target_type NOT NULL,
  due_at      timestamptz NOT NULL,
  UNIQUE (ticket_id, target_type)
);
CREATE TABLE sla_event (                     -- warning/breach records
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ticket_id   bigint NOT NULL REFERENCES fault_ticket(id) ON DELETE CASCADE,
  target_type sla_target_type NOT NULL,
  due_at      timestamptz NOT NULL,
  met         boolean,
  breached_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE ticket_escalation (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ticket_id     bigint NOT NULL REFERENCES fault_ticket(id) ON DELETE CASCADE,
  level         int NOT NULL,
  reason        text,
  escalated_to  bigint REFERENCES auth_user(id),
  escalated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE ticket_comment (                -- G-11 portal + internal threads
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ticket_id    bigint NOT NULL REFERENCES fault_ticket(id) ON DELETE CASCADE,
  author_id    bigint NOT NULL REFERENCES auth_user(id),
  body         text NOT NULL,
  visibility   comment_visibility NOT NULL DEFAULT 'internal',
  attachment_document_id bigint REFERENCES document(id),
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ===========================================================================
-- §8  INVENTORY + VEHICLE  -- G-14, G-15 ; FR-90..93
-- ===========================================================================
CREATE TABLE supplier (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id  bigint NOT NULL REFERENCES tenant(id),
  name       text NOT NULL, phone text, email text, vat_number text,
  is_active  boolean NOT NULL DEFAULT true,
  UNIQUE (tenant_id, id)
);
CREATE TABLE item (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id     bigint NOT NULL REFERENCES tenant(id),
  sku           text NOT NULL,
  name_ar       text NOT NULL, name_en text,
  category text, brand text,                 -- origin e.g. محلي/ايطالي
  default_supplier_id bigint REFERENCES supplier(id),
  unit text, purchase_cost numeric(14,2), selling_price numeric(14,2),
  min_stock numeric(14,2) DEFAULT 0, reorder_point numeric(14,2) DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE (tenant_id, sku), UNIQUE (tenant_id, id)
);
CREATE TABLE vehicle (                       -- G-15 explicit vehicle entity
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id  bigint NOT NULL REFERENCES tenant(id),
  owner_branch_id bigint,
  plate      text NOT NULL, type text,
  is_active  boolean NOT NULL DEFAULT true,
  UNIQUE (tenant_id, id)
);
CREATE TABLE vehicle_assignment (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  vehicle_id    bigint NOT NULL REFERENCES vehicle(id),
  technician_id bigint NOT NULL REFERENCES auth_user(id),
  from_date date NOT NULL, to_date date
);
CREATE TABLE warehouse (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id  bigint NOT NULL REFERENCES tenant(id),
  owner_branch_id bigint,
  kind       warehouse_kind NOT NULL,
  name       text NOT NULL,
  vehicle_id bigint REFERENCES vehicle(id),  -- when kind='vehicle' (G-15)
  UNIQUE (tenant_id, id),
  CHECK (kind <> 'vehicle' OR vehicle_id IS NOT NULL)
);
-- stock_txn = LEDGER OF RECORD (append-only). stock_level = derived CACHE (G-14).
CREATE TABLE stock_txn (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id      bigint NOT NULL,
  txn_type       stock_txn_type NOT NULL,
  item_id        bigint NOT NULL REFERENCES item(id),
  from_warehouse bigint REFERENCES warehouse(id),
  to_warehouse   bigint REFERENCES warehouse(id),
  quantity       numeric(14,2) NOT NULL CHECK (quantity > 0),
  work_order_id  bigint REFERENCES work_order(id),   -- FR-62 issue against WO
  reference      text,
  created_by     bigint REFERENCES auth_user(id),
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_stocktxn_item ON stock_txn (item_id, created_at);
-- append-only like audit: REVOKE UPDATE,DELETE + BEFORE UPDATE/DELETE trigger raising exception.
CREATE TABLE stock_level (                   -- CACHE: on_hand/reserved, reconcilable from ledger
  warehouse_id bigint NOT NULL REFERENCES warehouse(id),
  item_id      bigint NOT NULL REFERENCES item(id),
  on_hand      numeric(14,2) NOT NULL DEFAULT 0,
  reserved     numeric(14,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (warehouse_id, item_id),
  CHECK (reserved >= 0 AND on_hand >= 0)
);
CREATE TABLE stock_reservation (             -- soft holds against work orders
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  item_id       bigint NOT NULL REFERENCES item(id),
  warehouse_id  bigint NOT NULL REFERENCES warehouse(id),
  work_order_id bigint REFERENCES work_order(id),
  quantity      numeric(14,2) NOT NULL CHECK (quantity > 0),
  released      boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE work_order_part (               -- consumption -> job_cost + profitability
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  work_order_id bigint NOT NULL REFERENCES work_order(id) ON DELETE CASCADE,
  item_id       bigint NOT NULL REFERENCES item(id),
  quantity      numeric(14,2) NOT NULL CHECK (quantity > 0),
  unit_cost     numeric(14,2), unit_price numeric(14,2),
  from_warehouse bigint REFERENCES warehouse(id),
  stock_txn_id  bigint REFERENCES stock_txn(id)         -- link to the issuing ledger entry
);

-- ===========================================================================
-- §9  PROCUREMENT (full chain, per-entity lifecycle)  -- G-01, G-16 ; FR-100/101, FR-172
-- ===========================================================================
CREATE TABLE purchase_request (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id bigint NOT NULL REFERENCES tenant(id), owner_branch_id bigint,
  pr_no text NOT NULL, status pr_status NOT NULL DEFAULT 'draft',
  requested_by bigint REFERENCES auth_user(id), approved_by bigint REFERENCES auth_user(id),
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (tenant_id, pr_no));
CREATE TABLE purchase_request_line (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pr_id bigint NOT NULL REFERENCES purchase_request(id) ON DELETE CASCADE,
  item_id bigint REFERENCES item(id), description text, quantity numeric(14,2) NOT NULL CHECK (quantity>0));
CREATE TABLE rfq (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id bigint NOT NULL REFERENCES tenant(id), rfq_no text NOT NULL,
  pr_id bigint REFERENCES purchase_request(id), status rfq_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (tenant_id, rfq_no));
CREATE TABLE rfq_supplier (
  rfq_id bigint NOT NULL REFERENCES rfq(id) ON DELETE CASCADE,
  supplier_id bigint NOT NULL REFERENCES supplier(id),
  PRIMARY KEY (rfq_id, supplier_id));
CREATE TABLE supplier_quotation (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id bigint NOT NULL REFERENCES tenant(id),
  rfq_id bigint REFERENCES rfq(id), supplier_id bigint NOT NULL REFERENCES supplier(id),
  status supplier_quote_status NOT NULL DEFAULT 'received', total numeric(14,2),
  received_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE supplier_quotation_line (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  quotation_id bigint NOT NULL REFERENCES supplier_quotation(id) ON DELETE CASCADE,
  item_id bigint REFERENCES item(id), quantity numeric(14,2) NOT NULL, unit_cost numeric(14,2) NOT NULL);
CREATE TABLE purchase_order (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id bigint NOT NULL REFERENCES tenant(id), owner_branch_id bigint,
  po_no text NOT NULL, supplier_id bigint NOT NULL REFERENCES supplier(id),
  pr_id bigint REFERENCES purchase_request(id), awarded_quotation_id bigint REFERENCES supplier_quotation(id),
  status po_status NOT NULL DEFAULT 'draft', total numeric(14,2),
  approved_by bigint REFERENCES auth_user(id),
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (tenant_id, po_no), UNIQUE (tenant_id, id));
CREATE TABLE purchase_order_line (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  po_id bigint NOT NULL REFERENCES purchase_order(id) ON DELETE CASCADE,
  item_id bigint NOT NULL REFERENCES item(id),
  quantity numeric(14,2) NOT NULL CHECK (quantity>0), unit_cost numeric(14,2) NOT NULL,
  received_qty numeric(14,2) NOT NULL DEFAULT 0);
CREATE TABLE goods_receipt (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id bigint NOT NULL REFERENCES tenant(id),
  po_id bigint NOT NULL REFERENCES purchase_order(id), warehouse_id bigint NOT NULL REFERENCES warehouse(id),
  grn_no text NOT NULL, status grn_status NOT NULL DEFAULT 'draft',
  received_at timestamptz NOT NULL DEFAULT now(), received_by bigint REFERENCES auth_user(id),
  UNIQUE (tenant_id, grn_no));
CREATE TABLE goods_receipt_line (            -- G-16 line-level quantities
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  grn_id bigint NOT NULL REFERENCES goods_receipt(id) ON DELETE CASCADE,
  po_line_id bigint REFERENCES purchase_order_line(id), item_id bigint NOT NULL REFERENCES item(id),
  ordered_qty numeric(14,2), received_qty numeric(14,2) NOT NULL,
  accepted_qty numeric(14,2) NOT NULL, rejected_qty numeric(14,2) NOT NULL DEFAULT 0,
  reject_reason text, stock_txn_id bigint REFERENCES stock_txn(id));
CREATE TABLE supplier_invoice (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id bigint NOT NULL REFERENCES tenant(id),
  supplier_id bigint NOT NULL REFERENCES supplier(id), po_id bigint REFERENCES purchase_order(id),
  invoice_no text NOT NULL, status supplier_invoice_status NOT NULL DEFAULT 'draft',
  subtotal numeric(14,2), vat_amount numeric(14,2), total numeric(14,2), invoice_date date,
  UNIQUE (tenant_id, supplier_id, invoice_no));
CREATE TABLE supplier_invoice_line (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  supplier_invoice_id bigint NOT NULL REFERENCES supplier_invoice(id) ON DELETE CASCADE,
  item_id bigint REFERENCES item(id), description text, quantity numeric(14,2), unit_cost numeric(14,2), line_total numeric(14,2));
CREATE TABLE purchase_return (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id bigint NOT NULL REFERENCES tenant(id),
  supplier_id bigint NOT NULL REFERENCES supplier(id), po_id bigint REFERENCES purchase_order(id),
  return_no text NOT NULL, status return_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (tenant_id, return_no));
CREATE TABLE purchase_return_line (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  return_id bigint NOT NULL REFERENCES purchase_return(id) ON DELETE CASCADE,
  item_id bigint NOT NULL REFERENCES item(id), quantity numeric(14,2) NOT NULL CHECK (quantity>0),
  reason text, stock_txn_id bigint REFERENCES stock_txn(id));

-- ===========================================================================
-- §10 FINANCE + ZATCA  -- G-13, G-20, G-21 ; FR-110..113
-- ===========================================================================
CREATE TABLE cost_center (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id bigint NOT NULL REFERENCES tenant(id), code text NOT NULL, name text NOT NULL,
  UNIQUE (tenant_id, code));
CREATE TABLE invoice (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id       bigint NOT NULL REFERENCES tenant(id), owner_branch_id bigint,
  invoice_no      text NOT NULL,
  kind            invoice_kind NOT NULL,
  status          invoice_status NOT NULL DEFAULT 'draft',
  customer_id     bigint NOT NULL REFERENCES customer(id),
  contract_id     bigint REFERENCES contract(id),        -- supertype: installation OR maintenance (G-13)
  work_order_id   bigint REFERENCES work_order(id),
  elevator_id     bigint REFERENCES elevator(id),        -- per-elevator revenue
  billing_schedule_id bigint REFERENCES contract_billing_schedule(id),
  issue_date      date NOT NULL DEFAULT current_date, due_date date,
  subtotal        numeric(14,2) NOT NULL DEFAULT 0,
  vat_rate        numeric(5,2)  NOT NULL DEFAULT 15.00,
  vat_amount      numeric(14,2) NOT NULL DEFAULT 0,
  total           numeric(14,2) NOT NULL DEFAULT 0,
  paid_amount     numeric(14,2) NOT NULL DEFAULT 0,
  -- ZATCA Phase-2 (FR-110, IR-01):
  zatca_status    zatca_status NOT NULL DEFAULT 'not_submitted',
  zatca_uuid      uuid, zatca_hash text, zatca_qr text, xml_url text,
  credit_note_of  bigint REFERENCES invoice(id),
  created_at timestamptz NOT NULL DEFAULT now(), created_by bigint REFERENCES auth_user(id),
  UNIQUE (tenant_id, invoice_no), UNIQUE (tenant_id, id)
);
CREATE INDEX ix_invoice_customer ON invoice (customer_id, status);
CREATE INDEX ix_invoice_due ON invoice (due_date) WHERE status IN ('issued','partially_paid','overdue');
ALTER TABLE contract_billing_schedule
  ADD CONSTRAINT fk_cbs_invoice FOREIGN KEY (invoice_id) REFERENCES invoice(id);
CREATE TABLE invoice_line (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  invoice_id bigint NOT NULL REFERENCES invoice(id) ON DELETE CASCADE,
  description text NOT NULL, item_id bigint REFERENCES item(id),
  quantity numeric(14,2) NOT NULL DEFAULT 1, unit_price numeric(14,2) NOT NULL,
  vat_rate numeric(5,2) NOT NULL DEFAULT 15.00, line_total numeric(14,2) NOT NULL);
CREATE TABLE payment (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id bigint NOT NULL REFERENCES tenant(id),
  customer_id bigint NOT NULL REFERENCES customer(id),
  method payment_method NOT NULL, amount numeric(14,2) NOT NULL CHECK (amount>0),
  paid_at timestamptz NOT NULL DEFAULT now(), reference text,
  received_by bigint REFERENCES auth_user(id));
CREATE TABLE payment_allocation (            -- split a payment across invoices (partials)
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  payment_id bigint NOT NULL REFERENCES payment(id) ON DELETE CASCADE,
  invoice_id bigint NOT NULL REFERENCES invoice(id),
  amount numeric(14,2) NOT NULL CHECK (amount>0));
CREATE TABLE expense (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id bigint NOT NULL REFERENCES tenant(id), owner_branch_id bigint,
  cost_center_id bigint REFERENCES cost_center(id),
  category text, amount numeric(14,2) NOT NULL, incurred_on date,
  work_order_id bigint REFERENCES work_order(id),
  created_by bigint REFERENCES auth_user(id), created_at timestamptz NOT NULL DEFAULT now());

-- ===========================================================================
-- §11 INSPECTION & COMPLIANCE  -- G-17, G-18 ; FR-120
-- ===========================================================================
CREATE TABLE inspection_template (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id bigint NOT NULL REFERENCES tenant(id), name text NOT NULL, kind inspection_kind NOT NULL);
CREATE TABLE inspection_template_item (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  template_id bigint NOT NULL REFERENCES inspection_template(id) ON DELETE CASCADE,
  seq int NOT NULL, label_ar text NOT NULL, label_en text,
  answer_type answer_type NOT NULL DEFAULT 'pass_fail', required boolean NOT NULL DEFAULT true,
  unit text, min_value numeric, max_value numeric, choice_options text[],
  creates_ncr_on_fail boolean NOT NULL DEFAULT true);
CREATE TABLE inspection (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id bigint NOT NULL REFERENCES tenant(id),
  elevator_id bigint NOT NULL REFERENCES elevator(id), work_order_id bigint REFERENCES work_order(id),
  template_id bigint REFERENCES inspection_template(id), kind inspection_kind NOT NULL,
  inspector_id bigint REFERENCES auth_user(id), performed_at timestamptz, passed boolean);
CREATE TABLE inspection_result (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  inspection_id bigint NOT NULL REFERENCES inspection(id) ON DELETE CASCADE,
  seq int NOT NULL, label text NOT NULL, answer_type answer_type NOT NULL,
  result checklist_result, value_number numeric, value_text text, value_choice text);
CREATE TABLE inspection_evidence (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  inspection_id bigint NOT NULL REFERENCES inspection(id) ON DELETE CASCADE,
  document_id bigint NOT NULL REFERENCES document(id));
CREATE TABLE ncr (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  inspection_id bigint NOT NULL REFERENCES inspection(id) ON DELETE CASCADE,
  description text NOT NULL, severity priority_level NOT NULL DEFAULT 'normal',
  corrective_action text, status ncr_status NOT NULL DEFAULT 'open',
  evidence_document_id bigint REFERENCES document(id));
CREATE TABLE certificate (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id bigint NOT NULL REFERENCES tenant(id),
  elevator_id bigint NOT NULL REFERENCES elevator(id), inspection_id bigint REFERENCES inspection(id),
  cert_no text NOT NULL, issued_on date, valid_until date, document_id bigint REFERENCES document(id),
  UNIQUE (tenant_id, cert_no));

-- ===========================================================================
-- §12 NOTIFICATIONS & RULES  -- FR-150/151, BR-20
-- ===========================================================================
CREATE TABLE notification_rule (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id bigint NOT NULL REFERENCES tenant(id),
  event_code text NOT NULL,                  -- contract_expiry|visit_due|visit_missed|sla_warning|sla_breach|invoice_due|low_stock|po_approval...
  channels notification_channel[] NOT NULL,
  audience text NOT NULL,                     -- role code or 'customer'
  offset_days int DEFAULT 0, is_active boolean NOT NULL DEFAULT true);
CREATE TABLE workflow_rule (                 -- configurable approvals / policies (e.g. finance-gated dispatch)
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id bigint NOT NULL REFERENCES tenant(id),
  rule_code text NOT NULL, config jsonb NOT NULL, is_active boolean NOT NULL DEFAULT true,
  UNIQUE (tenant_id, rule_code));
CREATE TABLE notification (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id bigint NOT NULL, event_code text NOT NULL, channel notification_channel NOT NULL,
  recipient_user_id bigint REFERENCES auth_user(id),
  entity_type text, entity_id bigint, payload jsonb,
  status text NOT NULL DEFAULT 'queued', sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now());

-- ===========================================================================
-- §13 PRICING CONFIGURATION AS DATA  -- FR-160 clarification (preserve engine, make data-driven)
-- ===========================================================================
CREATE TABLE pricing_catalog (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id bigint NOT NULL REFERENCES tenant(id),
  catalog_type text NOT NULL,                -- vvvf|battery|controller|machine|delta|loading
  effective_from date NOT NULL, effective_to date,
  UNIQUE (tenant_id, catalog_type, effective_from));
CREATE TABLE pricing_item (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  catalog_id bigint NOT NULL REFERENCES pricing_catalog(id) ON DELETE CASCADE,
  key text NOT NULL, label text, price numeric(14,2) NOT NULL);

-- ===========================================================================
-- §14 INTEGRATIONS / WEBHOOKS / SYNC  -- IR-07/09/10, FR-174
-- ===========================================================================
CREATE TABLE webhook_endpoint (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id bigint NOT NULL REFERENCES tenant(id), url text NOT NULL,
  secret text NOT NULL, events text[] NOT NULL, is_active boolean NOT NULL DEFAULT true);
CREATE TABLE webhook_delivery (              -- signed + retried + idempotent (IR-09)
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  endpoint_id bigint NOT NULL REFERENCES webhook_endpoint(id),
  event_code text NOT NULL, payload jsonb NOT NULL,
  idempotency_key uuid NOT NULL, attempts int NOT NULL DEFAULT 0,
  delivered boolean NOT NULL DEFAULT false, last_attempt_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (endpoint_id, idempotency_key));
CREATE TABLE integration_outbox (           -- ZATCA/SMS/email/payment: retried, dead-lettered (IR-10)
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id bigint NOT NULL, channel text NOT NULL, target_ref text,
  payload jsonb NOT NULL, status text NOT NULL DEFAULT 'queued',
  attempts int NOT NULL DEFAULT 0, last_error text, created_at timestamptz NOT NULL DEFAULT now());

-- ===========================================================================
-- §15 REPORTING VIEWS  -- G-21 (fan-out fixed) ; FR-130/131
-- ===========================================================================
-- Per-elevator profitability WITHOUT fan-out: pre-aggregate each side, then join 1:1.
CREATE VIEW v_elevator_profitability AS
WITH rev AS (
  SELECT elevator_id, SUM(total) AS revenue
  FROM invoice WHERE status <> 'void' AND elevator_id IS NOT NULL
  GROUP BY elevator_id
),
cost AS (
  SELECT elevator_id, SUM(job_cost) AS cost
  FROM work_order WHERE elevator_id IS NOT NULL
  GROUP BY elevator_id
)
SELECT e.id AS elevator_id, e.asset_no, e.owner_branch_id,
       COALESCE(r.revenue,0) AS revenue,
       COALESCE(c.cost,0)    AS cost,
       COALESCE(r.revenue,0) - COALESCE(c.cost,0) AS gross_profit
FROM elevator e
LEFT JOIN rev  r ON r.elevator_id = e.id
LEFT JOIN cost c ON c.elevator_id = e.id;

CREATE VIEW v_contract_profitability AS
WITH rev AS (SELECT contract_id, SUM(total) AS revenue FROM invoice
             WHERE status<>'void' AND contract_id IS NOT NULL GROUP BY contract_id),
     cost AS (SELECT contract_id, SUM(job_cost) AS cost FROM work_order
             WHERE contract_id IS NOT NULL GROUP BY contract_id)
SELECT k.id AS contract_id, k.contract_no,
       COALESCE(r.revenue,0) AS revenue, COALESCE(c.cost,0) AS cost,
       COALESCE(r.revenue,0)-COALESCE(c.cost,0) AS gross_profit
FROM contract k
LEFT JOIN rev r ON r.contract_id=k.id
LEFT JOIN cost c ON c.contract_id=k.id;

-- Preventive due/overdue (parity w/ mintperlist)
CREATE VIEW v_pm_due AS
SELECT mp.id AS plan_id, mp.elevator_id, e.asset_no, k.contract_no, mc.zone,
       mc.maintenance_tech_id, mp.next_due_date,
       (current_date - mp.next_due_date) AS days_overdue,   -- >0 overdue
       k.owner_branch_id
FROM maintenance_plan mp
JOIN contract k            ON k.id = mp.contract_id AND k.status='active'
JOIN maintenance_contract mc ON mc.contract_id = k.id
JOIN elevator e            ON e.id = mp.elevator_id
WHERE mp.is_active;

-- Open faults board (parity w/ openmalf)
CREATE VIEW v_open_faults AS
SELECT ft.id, ft.ticket_no, ft.elevator_id, e.asset_no, c.name_ar AS customer,
       ft.priority, ft.status, ft.reported_at, ft.resolved_at, ft.owner_branch_id
FROM fault_ticket ft
JOIN elevator e ON e.id = ft.elevator_id
LEFT JOIN customer c ON c.id = ft.customer_id
WHERE ft.status <> 'closed';

-- Stock reconciliation: cache vs ledger (G-14)
CREATE VIEW v_stock_from_ledger AS
SELECT w.id AS warehouse_id, t.item_id,
       SUM(CASE WHEN t.to_warehouse   = w.id AND t.txn_type IN ('in','transfer','return','adjustment') THEN t.quantity
                WHEN t.from_warehouse = w.id AND t.txn_type IN ('out','transfer','damaged','adjustment') THEN -t.quantity
                ELSE 0 END) AS derived_on_hand
FROM warehouse w JOIN stock_txn t ON w.id IN (t.from_warehouse, t.to_warehouse)
GROUP BY w.id, t.item_id;

-- ===========================================================================
-- §T  TENANT SCOPING & SECURITY (documented; enable per environment)  -- G-04, Rules 8/9
-- ===========================================================================
-- 1) Composite FKs carrying tenant_id prevent cross-tenant references (shown on
--    employee_profile, customer). Extend the (tenant_id, id) UNIQUE + composite FK
--    pattern to every parent/child pair in production.
-- 2) Row-Level Security (enable on every tenant-scoped table):
--      ALTER TABLE <t> ENABLE ROW LEVEL SECURITY;
--      CREATE POLICY tenant_isolation ON <t> USING (tenant_id = current_setting('app.tenant_id')::bigint);
--    The app sets `SET app.tenant_id = :tenant` per request (tenant middleware).
-- 3) Branch scope and record-level scope (own/assigned/customer) are enforced by
--    the application authorization layer in addition to RLS -- never by UI hiding.
-- 4) Append-only enforcement for audit_log, stock_txn (and financial ledgers):
--      REVOKE UPDATE, DELETE ON <t> FROM app_role;  + BEFORE UPDATE/DELETE trigger raising exception.
-- 5) updated_at maintained by a BEFORE UPDATE trigger on mutable business tables.
-- 6) invoice totals (subtotal/vat/total) maintained by trigger from invoice_line;
--    stock_level maintained by trigger/worker from stock_txn (reconcile via v_stock_from_ledger).
-- ============================================================================
-- END schema-v1.1.sql
-- ============================================================================
