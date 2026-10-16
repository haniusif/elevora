-- ============================================================================
-- Elevora — Elevator Operations Platform
-- Data model (PostgreSQL DDL) -- Version 1.0 Draft -- 16 Oct 2026
-- Traces to: SRS section 4 (DR-01..DR-06) and the domain model in the audit.
--
-- Conventions:
--   * snake_case; surrogate PK "id" bigint identity; natural codes kept as unique.
--   * branch_id on operational tables = primary data-scope dimension (NFR-21).
--   * tenant_id present but single-valued today; enables future SaaS (BRD section 9).
--   * timestamptz in UTC; money as numeric(14,2) in SAR; vat_rate configurable.
--   * every mutable table carries created_at/updated_at/created_by/updated_by.
--   * controlled enums replace free-text statuses (DR-03).
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid(), crypt()

-- ---------------------------------------------------------------------------
-- 0. ENUM TYPES (DR-03)
-- ---------------------------------------------------------------------------
CREATE TYPE customer_type       AS ENUM ('individual','company');
CREATE TYPE lead_stage          AS ENUM ('new','contacted','qualified','quoted','won','lost');
CREATE TYPE asset_status        AS ENUM ('active','under_maintenance','out_of_service','decommissioned');
CREATE TYPE elevator_drive      AS ENUM ('geared','gearless','hydraulic','mrl','other');
CREATE TYPE door_type           AS ENUM ('manual','semi_automatic','automatic','other');
CREATE TYPE contract_type       AS ENUM ('comprehensive','non_comprehensive');          -- شامل / غير شامل
CREATE TYPE contract_status     AS ENUM ('draft','pending_approval','active','suspended','expired','renewal_due','renewed','cancelled');
CREATE TYPE quote_status        AS ENUM ('draft','pending_approval','approved','rejected','converted','expired');
CREATE TYPE plan_frequency      AS ENUM ('weekly','monthly','quarterly','semiannual','annual','custom_days');
CREATE TYPE wo_source           AS ENUM ('preventive','fault','inspection','installation','modernization','customer_request','internal');
CREATE TYPE wo_status           AS ENUM ('draft','scheduled','assigned','en_route','started','on_hold_parts','completed','customer_signed','supervisor_approved','closed','cancelled');
CREATE TYPE visit_status        AS ENUM ('scheduled','assigned','en_route','started','checklist','findings','completed','customer_signed','supervisor_approved','closed','missed');
CREATE TYPE ticket_priority     AS ENUM ('low','normal','high','critical','emergency');
CREATE TYPE ticket_status       AS ENUM ('open','assigned','acknowledged','en_route','on_site','diagnosis','waiting_parts','repairing','testing','resolved','customer_confirmed','closed','reopened');
CREATE TYPE checklist_result    AS ENUM ('pass','fail','na');
CREATE TYPE stock_txn_type      AS ENUM ('in','out','transfer','reservation','adjustment','return','damaged');
CREATE TYPE warehouse_kind      AS ENUM ('main','branch','vehicle','site');
CREATE TYPE po_status           AS ENUM ('draft','pending_approval','approved','sent','partially_received','received','invoiced','cancelled');
CREATE TYPE invoice_kind        AS ENUM ('contract','repair','parts','installation','credit_note');
CREATE TYPE invoice_status      AS ENUM ('draft','issued','cleared','reported','paid','partially_paid','overdue','void');
CREATE TYPE zatca_status        AS ENUM ('not_submitted','cleared','reported','failed');
CREATE TYPE payment_method      AS ENUM ('cash','bank_transfer','card','online_gateway','cheque');
CREATE TYPE notification_channel AS ENUM ('in_app','email','sms','whatsapp','push');
CREATE TYPE inspection_kind     AS ENUM ('safety','quality','regulatory');
CREATE TYPE ncr_status          AS ENUM ('open','in_progress','closed');

-- ---------------------------------------------------------------------------
-- 1. TENANT / ORG / RBAC / AUDIT  (FR-01..06, FR-72, DR-03)
-- ---------------------------------------------------------------------------
CREATE TABLE tenant (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name          text NOT NULL,
  vat_number    text,
  cr_number     text,                              -- commercial registration
  default_vat_rate numeric(5,2) NOT NULL DEFAULT 15.00,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE branch (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id     bigint NOT NULL REFERENCES tenant(id),
  code          text NOT NULL,
  name          text NOT NULL,                     -- e.g. الرياض
  city          text,
  is_active     boolean NOT NULL DEFAULT true,
  UNIQUE (tenant_id, code)
);

CREATE TABLE role (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id     bigint NOT NULL REFERENCES tenant(id),
  code          text NOT NULL,                     -- GM, maintenance, dispatcher, technician, ...
  name          text NOT NULL,
  data_scope    text NOT NULL DEFAULT 'own_branch' -- all|company|own_branch|own_team|assigned|own|customer
                 CHECK (data_scope IN ('all','company','own_branch','own_team','assigned','own','customer')),
  UNIQUE (tenant_id, code)
);

-- Granular rights: module x verb (FR-03). verb in View/Create/Edit/Delete/Approve/Reject/Assign/Close/Export/Print
CREATE TABLE permission (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  role_id       bigint NOT NULL REFERENCES role(id) ON DELETE CASCADE,
  module        text NOT NULL,                     -- e.g. 'maintenance_contract','work_order','invoice'
  verb          text NOT NULL CHECK (verb IN ('view','create','edit','delete','approve','reject','assign','close','export','print')),
  UNIQUE (role_id, module, verb)
);

CREATE TABLE app_user (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id      bigint NOT NULL REFERENCES tenant(id),
  branch_id      bigint REFERENCES branch(id),
  role_id        bigint NOT NULL REFERENCES role(id),
  employee_no    text,
  username       text NOT NULL,
  full_name      text NOT NULL,
  email          text,
  phone          text,
  password_hash  text NOT NULL,                    -- FR-01: hashed+salted ONLY. Never plaintext.
  is_active      boolean NOT NULL DEFAULT true,
  failed_logins  int NOT NULL DEFAULT 0,           -- FR-06 lockout
  locked_until   timestamptz,
  last_login_at  timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, username)
);
-- NOTE: no plaintext password column exists by design (remediates the audit's CRITICAL finding).

-- Technician extension of app_user (FR-72)
CREATE TABLE technician (
  user_id        bigint PRIMARY KEY REFERENCES app_user(id) ON DELETE CASCADE,
  team           text,
  supervisor_id  bigint REFERENCES app_user(id),
  region_zone    text,
  vehicle_id     bigint,                            -- -> warehouse(id) of kind 'vehicle'
  skills         text[],
  certifications text[],
  hajj_permit    boolean NOT NULL DEFAULT false,    -- تصريح حج (Saudi-specific, retained)
  is_available   boolean NOT NULL DEFAULT true
);

-- Immutable audit trail (FR-05 / BR-13)
CREATE TABLE audit_log (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id   bigint NOT NULL,
  actor_id    bigint REFERENCES app_user(id),
  action      text NOT NULL,                        -- create|update|delete|approve|assign|status_change|login|...
  module      text NOT NULL,
  record_id   text,
  old_value   jsonb,
  new_value   jsonb,
  ip          inet,
  device      text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_audit_module_record ON audit_log (module, record_id);
CREATE INDEX ix_audit_actor_time    ON audit_log (actor_id, created_at);

-- ---------------------------------------------------------------------------
-- 2. CRM: customer hierarchy (FR-10, FR-11, DR-02)
-- ---------------------------------------------------------------------------
CREATE TABLE customer (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id       bigint NOT NULL REFERENCES tenant(id),
  branch_id       bigint REFERENCES branch(id),
  code            text,                              -- customer code
  type            customer_type NOT NULL DEFAULT 'individual',
  name_ar         text NOT NULL,
  name_en         text,
  national_id     text,                              -- سجل مدني (individuals)
  cr_number       text,                              -- commercial registration (companies)
  vat_number      text,                              -- الرقم الضريبى (ZATCA)
  national_address text,
  phone           text,
  email           text,
  billing_address text,
  service_address text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code)
);

CREATE TABLE contact_person (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id  bigint NOT NULL REFERENCES customer(id) ON DELETE CASCADE,
  name         text NOT NULL,
  title        text,
  phone        text,
  email        text,
  is_primary   boolean NOT NULL DEFAULT false
);

CREATE TABLE site (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id  bigint NOT NULL REFERENCES customer(id) ON DELETE CASCADE,
  name         text NOT NULL,
  district     text,                                 -- e.g. النرجس - شمال
  city         text,
  latitude     numeric(9,6),
  longitude    numeric(9,6)
);

CREATE TABLE building (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  site_id      bigint NOT NULL REFERENCES site(id) ON DELETE CASCADE,
  name         text,
  floors_count int
);

CREATE TABLE lead (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id     bigint NOT NULL REFERENCES tenant(id),
  branch_id     bigint REFERENCES branch(id),
  name          text NOT NULL,
  phone         text,
  address       text,
  source        text,                                -- lead source
  stage         lead_stage NOT NULL DEFAULT 'new',
  expected_value numeric(14,2),
  salesperson_id bigint REFERENCES app_user(id),
  customer_id   bigint REFERENCES customer(id),       -- set on conversion
  note1         text, note1_date date,
  note2         text, note2_date date,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3. ELEVATOR ASSET REGISTER (FR-20..24, BR-01) -- the new backbone
-- ---------------------------------------------------------------------------
CREATE TABLE elevator (
  id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id         bigint NOT NULL REFERENCES tenant(id),
  branch_id         bigint REFERENCES branch(id),
  asset_no          text NOT NULL,                    -- stable business key
  serial_no         text,
  qr_code           text UNIQUE,                       -- FR-22 scan-to-identify
  barcode           text,
  customer_id       bigint REFERENCES customer(id),
  site_id           bigint REFERENCES site(id),
  building_id       bigint REFERENCES building(id),
  manufacturer      text,
  brand             text,                              -- ماركة المصعد
  model             text,
  elevator_type     text,                              -- اتوماتيك/عادى + passenger/food(dumbwaiter)
  capacity_kg       int,                               -- الحمولة
  speed_mps         numeric(5,2),
  stops_count       int,                               -- الوقفات
  floors_count      int,                               -- الطوابق
  entrances_count   int,                               -- المداخل
  door_type         door_type,
  door_size         text,
  machine_type      text,                              -- نوع الماكينة
  controller_type   text,                              -- كارت الكنترول
  drive_type        elevator_drive,
  cabin_type        text,
  installation_date date,
  commissioning_date date,
  warranty_start    date,
  warranty_end      date,
  status            asset_status NOT NULL DEFAULT 'active',
  latitude          numeric(9,6),
  longitude         numeric(9,6),
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, asset_no)
);
CREATE INDEX ix_elevator_customer ON elevator (customer_id);
CREATE INDEX ix_elevator_branch   ON elevator (branch_id);

CREATE TABLE document (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id    bigint NOT NULL,
  entity_type  text NOT NULL,                          -- 'elevator','contract','work_order','invoice','inspection'...
  entity_id    bigint NOT NULL,
  category     text,                                   -- contract|report|certificate|photo|drawing|invoice
  file_url     text NOT NULL,
  mime_type    text,
  size_bytes   bigint,
  expiry_date  date,
  version      int NOT NULL DEFAULT 1,
  uploaded_by  bigint REFERENCES app_user(id),
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_document_entity ON document (entity_type, entity_id);

-- ---------------------------------------------------------------------------
-- 4. SALES: quotation + installation contract (FR-33, FR-160 non-regression)
-- ---------------------------------------------------------------------------
CREATE TABLE quotation (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id     bigint NOT NULL REFERENCES tenant(id),
  branch_id     bigint REFERENCES branch(id),
  quote_no      text NOT NULL,
  customer_id   bigint REFERENCES customer(id),
  lead_id       bigint REFERENCES lead(id),
  salesperson_id bigint REFERENCES app_user(id),
  spec          jsonb,                                  -- elevator technical spec at quote time
  price         numeric(14,2),
  system_price  numeric(14,2),                          -- السعر حسب النظام (from pricing engine)
  status        quote_status NOT NULL DEFAULT 'draft',
  reject_reason text,
  quote_date    date,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, quote_no)
);

-- Installation (new-elevator) contract -- retained engine
CREATE TABLE installation_contract (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id     bigint NOT NULL REFERENCES tenant(id),
  branch_id     bigint REFERENCES branch(id),
  contract_no   text NOT NULL,
  customer_id   bigint REFERENCES customer(id),
  quotation_id  bigint REFERENCES quotation(id),
  spec          jsonb,                                  -- shaft/cabin/machine/options/crew assignment/decor
  price         numeric(14,2),
  payment_pct   numeric(5,2)[] DEFAULT '{}',             -- نسبة الدفعة 1..4
  contract_date date,
  delivered_at  date,
  elevator_id   bigint REFERENCES elevator(id),          -- FR-24 asset created on delivery
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, contract_no)
);

-- ---------------------------------------------------------------------------
-- 5. MAINTENANCE CONTRACTS, SLA, PLANS (FR-30..32, FR-40, BR-16/17)
-- ---------------------------------------------------------------------------
CREATE TABLE maintenance_contract (
  id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id         bigint NOT NULL REFERENCES tenant(id),
  branch_id         bigint REFERENCES branch(id),
  contract_no       text NOT NULL,
  customer_id       bigint NOT NULL REFERENCES customer(id),
  type              contract_type NOT NULL DEFAULT 'non_comprehensive',
  status            contract_status NOT NULL DEFAULT 'draft',
  value             numeric(14,2),
  payment_schedule  text,                               -- سداد كل
  start_date        date,
  end_date          date,
  renewal_date      date,
  auto_renew        boolean NOT NULL DEFAULT false,
  renew_count       int NOT NULL DEFAULT 0,             -- مرات التجديد
  visits_total      int,                                -- عدد الزيارات
  visit_every_days  int,                                -- زيارة كل ... يوم
  maintenance_day   text,                               -- يوم الصيانة
  zone              text,                               -- منطقة الصيانة
  emergency_cover   boolean NOT NULL DEFAULT false,
  parts_cover       boolean NOT NULL DEFAULT false,
  included_services text,
  excluded_services text,
  maintenance_tech_id bigint REFERENCES app_user(id),   -- فنى الصيانة
  fault_tech_id       bigint REFERENCES app_user(id),   -- فنى الاعطال
  salesperson_id    bigint REFERENCES app_user(id),
  notes_ar          text, notes_en text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, contract_no)
);
CREATE INDEX ix_mcontract_status ON maintenance_contract (status, end_date);

-- A contract covers one-or-many elevators (FR-30 multi-elevator)
CREATE TABLE contract_elevator (
  contract_id   bigint NOT NULL REFERENCES maintenance_contract(id) ON DELETE CASCADE,
  elevator_id   bigint NOT NULL REFERENCES elevator(id),
  PRIMARY KEY (contract_id, elevator_id)
);

CREATE TABLE sla_terms (
  id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  contract_id       bigint NOT NULL REFERENCES maintenance_contract(id) ON DELETE CASCADE,
  response_mins     int,       -- target time to acknowledge
  arrival_mins      int,       -- target time on site
  repair_mins       int,       -- target time to resolve
  penalty_terms     text
);

CREATE TABLE maintenance_plan (
  id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  contract_id       bigint NOT NULL REFERENCES maintenance_contract(id) ON DELETE CASCADE,
  elevator_id       bigint NOT NULL REFERENCES elevator(id),
  frequency         plan_frequency NOT NULL,
  interval_days     int,                               -- when frequency = custom_days
  next_due_date     date,
  is_active         boolean NOT NULL DEFAULT true
);
CREATE INDEX ix_plan_next_due ON maintenance_plan (next_due_date) WHERE is_active;

-- ---------------------------------------------------------------------------
-- 6. WORK ORDERS (FR-60..62, BR-02) -- central job object
-- ---------------------------------------------------------------------------
CREATE TABLE work_order (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id       bigint NOT NULL REFERENCES tenant(id),
  branch_id       bigint REFERENCES branch(id),
  wo_no           text NOT NULL,
  source          wo_source NOT NULL,
  status          wo_status NOT NULL DEFAULT 'draft',
  priority        ticket_priority NOT NULL DEFAULT 'normal',
  customer_id     bigint REFERENCES customer(id),
  site_id         bigint REFERENCES site(id),
  elevator_id     bigint REFERENCES elevator(id),
  contract_id     bigint REFERENCES maintenance_contract(id),
  plan_id         bigint REFERENCES maintenance_plan(id),   -- set when auto-generated (FR-40)
  technician_id   bigint REFERENCES app_user(id),
  supervisor_id   bigint REFERENCES app_user(id),
  scheduled_date  timestamptz,
  checkin_at      timestamptz,
  checkout_at     timestamptz,
  labour_hours    numeric(6,2),
  travel_mins     int,
  checkin_lat     numeric(9,6), checkin_lng numeric(9,6),  -- GPS verification (FR-81)
  customer_signature_url text,
  notes           text,
  job_cost        numeric(14,2),                            -- parts + labour (FR-62/112)
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, wo_no)
);
CREATE INDEX ix_wo_elevator  ON work_order (elevator_id);
CREATE INDEX ix_wo_tech_sched ON work_order (technician_id, scheduled_date);
CREATE INDEX ix_wo_status     ON work_order (status);

CREATE TABLE checklist_template (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id     bigint NOT NULL REFERENCES tenant(id),
  name          text NOT NULL,
  applies_to    wo_source
);
CREATE TABLE checklist_template_item (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  template_id   bigint NOT NULL REFERENCES checklist_template(id) ON DELETE CASCADE,
  seq           int NOT NULL,
  label_ar      text NOT NULL,
  label_en      text
);
CREATE TABLE work_order_checklist (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  work_order_id bigint NOT NULL REFERENCES work_order(id) ON DELETE CASCADE,
  seq           int NOT NULL,
  label         text NOT NULL,
  result        checklist_result NOT NULL DEFAULT 'na',
  note          text
);

-- ---------------------------------------------------------------------------
-- 7. PREVENTIVE VISITS & CORRECTIVE FAULT TICKETS (FR-42..53)
-- ---------------------------------------------------------------------------
CREATE TABLE maintenance_visit (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id       bigint NOT NULL,
  work_order_id   bigint REFERENCES work_order(id),
  contract_id     bigint REFERENCES maintenance_contract(id),
  elevator_id     bigint NOT NULL REFERENCES elevator(id),
  plan_id         bigint REFERENCES maintenance_plan(id),
  technician_id   bigint REFERENCES app_user(id),
  status          visit_status NOT NULL DEFAULT 'scheduled',
  scheduled_date  date,
  performed_at    timestamptz,
  findings        text,
  supervisor_approved_by bigint REFERENCES app_user(id),
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_visit_elevator ON maintenance_visit (elevator_id, scheduled_date);

CREATE TABLE fault_ticket (
  id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id         bigint NOT NULL,
  branch_id         bigint REFERENCES branch(id),
  ticket_no         text NOT NULL,
  elevator_id       bigint NOT NULL REFERENCES elevator(id),
  customer_id       bigint REFERENCES customer(id),
  contract_id       bigint REFERENCES maintenance_contract(id),
  work_order_id     bigint REFERENCES work_order(id),
  fault_type        text,
  description       text,
  priority          ticket_priority NOT NULL DEFAULT 'normal',
  status            ticket_status NOT NULL DEFAULT 'open',
  reported_at       timestamptz,                         -- وقت العطل
  tech_notified_at  timestamptz,                         -- وقت ابلاغ الفنى
  arrival_at        timestamptz,
  repair_start_at   timestamptz,
  repair_end_at     timestamptz,                         -- وقت الاصلاح
  root_cause        text,
  corrective_action text,
  repair_report     text,                                -- تقرير الاصلاح
  fault_tech_id     bigint REFERENCES app_user(id),      -- الفنى مصلح العطل
  customer_confirm_code text,                            -- رقم التأكيد
  tech_confirm_code     text,                            -- رقم التأكيد من الفنى
  sla_breached      boolean NOT NULL DEFAULT false,
  reopened_from     bigint REFERENCES fault_ticket(id),
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, ticket_no)
);
CREATE INDEX ix_ticket_status   ON fault_ticket (status);
CREATE INDEX ix_ticket_elevator ON fault_ticket (elevator_id, reported_at);

-- ---------------------------------------------------------------------------
-- 8. INVENTORY (FR-90..93, BR-07)
-- ---------------------------------------------------------------------------
CREATE TABLE supplier (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id    bigint NOT NULL REFERENCES tenant(id),
  name         text NOT NULL,
  phone        text, email text, vat_number text,
  is_active    boolean NOT NULL DEFAULT true
);

CREATE TABLE item (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id     bigint NOT NULL REFERENCES tenant(id),
  sku           text NOT NULL,
  name_ar       text NOT NULL,
  name_en       text,
  category      text,
  brand         text,                                 -- origin e.g. محلي/ايطالي
  default_supplier_id bigint REFERENCES supplier(id),
  unit          text,
  purchase_cost numeric(14,2),
  selling_price numeric(14,2),
  min_stock     numeric(14,2) DEFAULT 0,
  reorder_point numeric(14,2) DEFAULT 0,
  UNIQUE (tenant_id, sku)
);

CREATE TABLE warehouse (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id    bigint NOT NULL REFERENCES tenant(id),
  branch_id    bigint REFERENCES branch(id),
  kind         warehouse_kind NOT NULL,
  name         text NOT NULL,
  vehicle_user_id bigint REFERENCES app_user(id)      -- when kind='vehicle'
);

CREATE TABLE stock_level (
  warehouse_id  bigint NOT NULL REFERENCES warehouse(id),
  item_id       bigint NOT NULL REFERENCES item(id),
  on_hand       numeric(14,2) NOT NULL DEFAULT 0,
  reserved      numeric(14,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (warehouse_id, item_id)
);

CREATE TABLE stock_txn (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id      bigint NOT NULL,
  txn_type       stock_txn_type NOT NULL,
  item_id        bigint NOT NULL REFERENCES item(id),
  from_warehouse bigint REFERENCES warehouse(id),
  to_warehouse   bigint REFERENCES warehouse(id),
  quantity       numeric(14,2) NOT NULL,
  work_order_id  bigint REFERENCES work_order(id),     -- FR-62 issue against WO
  reference      text,
  created_by     bigint REFERENCES app_user(id),
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Parts consumed on a job (feeds job_cost + profitability)
CREATE TABLE work_order_part (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  work_order_id bigint NOT NULL REFERENCES work_order(id) ON DELETE CASCADE,
  item_id       bigint NOT NULL REFERENCES item(id),
  quantity      numeric(14,2) NOT NULL,
  unit_cost     numeric(14,2),
  unit_price    numeric(14,2),
  from_warehouse bigint REFERENCES warehouse(id)
);

-- ---------------------------------------------------------------------------
-- 9. PROCUREMENT (FR-100/101, BR-08)
-- ---------------------------------------------------------------------------
CREATE TABLE purchase_request (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id    bigint NOT NULL REFERENCES tenant(id),
  branch_id    bigint REFERENCES branch(id),
  pr_no        text NOT NULL,
  status       po_status NOT NULL DEFAULT 'draft',
  requested_by bigint REFERENCES app_user(id),
  approved_by  bigint REFERENCES app_user(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, pr_no)
);
CREATE TABLE purchase_order (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id     bigint NOT NULL REFERENCES tenant(id),
  branch_id     bigint REFERENCES branch(id),
  po_no         text NOT NULL,
  supplier_id   bigint NOT NULL REFERENCES supplier(id),
  pr_id         bigint REFERENCES purchase_request(id),
  status        po_status NOT NULL DEFAULT 'draft',
  total         numeric(14,2),
  approved_by   bigint REFERENCES app_user(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, po_no)
);
CREATE TABLE purchase_order_line (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  po_id         bigint NOT NULL REFERENCES purchase_order(id) ON DELETE CASCADE,
  item_id       bigint NOT NULL REFERENCES item(id),
  quantity      numeric(14,2) NOT NULL,
  unit_cost     numeric(14,2) NOT NULL,
  received_qty  numeric(14,2) NOT NULL DEFAULT 0
);
CREATE TABLE goods_receipt (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  po_id         bigint NOT NULL REFERENCES purchase_order(id),
  warehouse_id  bigint NOT NULL REFERENCES warehouse(id),
  received_at   timestamptz NOT NULL DEFAULT now(),
  received_by   bigint REFERENCES app_user(id)
);

-- ---------------------------------------------------------------------------
-- 10. FINANCE & ZATCA (FR-110..113, BR-04/19)
-- ---------------------------------------------------------------------------
CREATE TABLE invoice (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id       bigint NOT NULL REFERENCES tenant(id),
  branch_id       bigint REFERENCES branch(id),
  invoice_no      text NOT NULL,
  kind            invoice_kind NOT NULL,
  status          invoice_status NOT NULL DEFAULT 'draft',
  customer_id     bigint NOT NULL REFERENCES customer(id),
  contract_id     bigint REFERENCES maintenance_contract(id),
  work_order_id   bigint REFERENCES work_order(id),
  elevator_id     bigint REFERENCES elevator(id),      -- enables per-elevator revenue
  issue_date      date NOT NULL DEFAULT current_date,
  due_date        date,
  subtotal        numeric(14,2) NOT NULL DEFAULT 0,
  vat_rate        numeric(5,2)  NOT NULL DEFAULT 15.00,
  vat_amount      numeric(14,2) NOT NULL DEFAULT 0,
  total           numeric(14,2) NOT NULL DEFAULT 0,
  paid_amount     numeric(14,2) NOT NULL DEFAULT 0,
  -- ZATCA Phase-2 fields (FR-110):
  zatca_status    zatca_status NOT NULL DEFAULT 'not_submitted',
  zatca_uuid      uuid,
  zatca_hash      text,
  zatca_qr        text,
  xml_url         text,
  credit_note_of  bigint REFERENCES invoice(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, invoice_no)
);
CREATE INDEX ix_invoice_customer ON invoice (customer_id, status);
CREATE INDEX ix_invoice_due      ON invoice (due_date) WHERE status IN ('issued','partially_paid','overdue');

CREATE TABLE invoice_line (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  invoice_id   bigint NOT NULL REFERENCES invoice(id) ON DELETE CASCADE,
  description  text NOT NULL,
  item_id      bigint REFERENCES item(id),
  quantity     numeric(14,2) NOT NULL DEFAULT 1,
  unit_price   numeric(14,2) NOT NULL,
  vat_rate     numeric(5,2)  NOT NULL DEFAULT 15.00,
  line_total   numeric(14,2) NOT NULL
);

CREATE TABLE payment (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id    bigint NOT NULL,
  invoice_id   bigint NOT NULL REFERENCES invoice(id),
  method       payment_method NOT NULL,
  amount       numeric(14,2) NOT NULL,
  paid_at      timestamptz NOT NULL DEFAULT now(),
  reference    text,
  received_by  bigint REFERENCES app_user(id)
);

-- ---------------------------------------------------------------------------
-- 11. INSPECTION & COMPLIANCE (FR-120, BR-11)
-- ---------------------------------------------------------------------------
CREATE TABLE inspection (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id     bigint NOT NULL,
  elevator_id   bigint NOT NULL REFERENCES elevator(id),
  work_order_id bigint REFERENCES work_order(id),
  kind          inspection_kind NOT NULL,
  inspector_id  bigint REFERENCES app_user(id),
  performed_at  timestamptz,
  passed        boolean,
  certificate_url text
);
CREATE TABLE ncr (                                       -- non-conformance report
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  inspection_id bigint NOT NULL REFERENCES inspection(id) ON DELETE CASCADE,
  description   text NOT NULL,
  severity      ticket_priority NOT NULL DEFAULT 'normal',
  corrective_action text,
  status        ncr_status NOT NULL DEFAULT 'open',
  evidence_url  text
);

-- ---------------------------------------------------------------------------
-- 12. NOTIFICATIONS & AUTOMATION RULES (FR-150/151, BR-12/20)
-- ---------------------------------------------------------------------------
CREATE TABLE notification_rule (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id     bigint NOT NULL REFERENCES tenant(id),
  event_code    text NOT NULL,     -- contract_expiry|visit_due|visit_missed|sla_warning|sla_breach|invoice_due|low_stock|...
  channels      notification_channel[] NOT NULL,
  audience      text NOT NULL,     -- role code or 'customer'
  offset_days   int DEFAULT 0,     -- e.g. notify 7 days before expiry
  is_active     boolean NOT NULL DEFAULT true
);
CREATE TABLE notification (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id     bigint NOT NULL,
  event_code    text NOT NULL,
  channel       notification_channel NOT NULL,
  recipient_user_id bigint REFERENCES app_user(id),
  recipient_customer_id bigint REFERENCES customer(id),
  entity_type   text, entity_id bigint,
  payload       jsonb,
  sent_at       timestamptz,
  status        text NOT NULL DEFAULT 'queued',   -- queued|sent|failed|read
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 13. CUSTOMER PORTAL ACCESS (FR-02, FR-140)
-- ---------------------------------------------------------------------------
CREATE TABLE customer_user (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id    bigint NOT NULL REFERENCES customer(id) ON DELETE CASCADE,
  username       text NOT NULL,
  full_name      text,
  email          text,
  phone          text,
  password_hash  text NOT NULL,                    -- hashed; replaces shared العميل login
  is_active      boolean NOT NULL DEFAULT true,
  last_login_at  timestamptz,
  UNIQUE (customer_id, username)
);

-- ---------------------------------------------------------------------------
-- 14. REPORTING HELPERS (FR-130/131) -- examples; refine as materialized views
-- ---------------------------------------------------------------------------
-- Per-elevator revenue/cost/profit (FR-112 / BR-19)
CREATE VIEW v_elevator_profitability AS
SELECT e.id AS elevator_id, e.asset_no, e.branch_id,
       COALESCE(sum(i.total),0)                       AS revenue,
       COALESCE(sum(wo.job_cost),0)                   AS cost,
       COALESCE(sum(i.total),0) - COALESCE(sum(wo.job_cost),0) AS gross_profit
FROM elevator e
LEFT JOIN invoice i   ON i.elevator_id = e.id
LEFT JOIN work_order wo ON wo.elevator_id = e.id
GROUP BY e.id, e.asset_no, e.branch_id;

-- Open faults board (parity with openmalf) (FR-41/50)
CREATE VIEW v_open_faults AS
SELECT ft.id, ft.ticket_no, ft.elevator_id, e.asset_no, c.name_ar AS customer,
       ft.priority, ft.status, ft.reported_at, ft.tech_notified_at, ft.repair_end_at,
       ft.sla_breached, ft.branch_id
FROM fault_ticket ft
JOIN elevator e ON e.id = ft.elevator_id
LEFT JOIN customer c ON c.id = ft.customer_id
WHERE ft.status NOT IN ('closed');

-- Preventive due/overdue list (parity with mintperlist) (FR-40/41)
CREATE VIEW v_pm_due AS
SELECT mp.id AS plan_id, mp.elevator_id, e.asset_no, mc.contract_no, mc.zone,
       mc.maintenance_tech_id, mp.next_due_date,
       (current_date - mp.next_due_date) AS days_overdue,   -- >0 means overdue
       mc.branch_id
FROM maintenance_plan mp
JOIN maintenance_contract mc ON mc.id = mp.contract_id
JOIN elevator e ON e.id = mp.elevator_id
WHERE mp.is_active AND mc.status = 'active';

-- ============================================================================
-- Migration notes (DR-06):
--   * Each embedded elevator spec on legacy maintenance_contract/installation
--     becomes one row in `elevator`; history (visits/faults/parts/docs) re-parents
--     to the asset so it persists across renewals.
--   * Legacy free-text statuses map to the enums above; the "test" records are
--     excluded from production load.
--   * Legacy plaintext passwords are NOT imported; users are force-reset on cutover.
-- ============================================================================
