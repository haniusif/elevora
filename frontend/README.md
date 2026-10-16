# Elevora — Web Admin (Prototype)

**Elevora — Elevator Operations Platform.** High-fidelity, clickable prototype of the web admin.
(The product rebrands the legacy "Link Lift" system audited in `../Link-Lift-System-Audit.md`.)
Arabic-first / RTL. React 18 + Vite + TypeScript + Tailwind. **Mock data only** (no backend).

Shapes mirror `../schema-v1.1.sql`; screens follow the operational spine in `../docs/ARCHITECTURE_REVIEW.md`.

## Run

```bash
cd frontend
npm install
npm run dev      # opens http://localhost:5173
```

Build: `npm run build` · Preview build: `npm run preview`

## What's included (R2 operational spine)

- **App shell** — RTL sidebar + topbar, branch selector, dark-mode toggle, global search (visual).
- **Login** — brand split layout (any input proceeds; note: real passwords are hashed, never shown).
- **Dashboard** — KPI tiles, revenue-vs-cost trend chart (SVG), PM due/overdue table (colour-coded), open faults, today's work orders.
- **Elevators** — asset register list (search + status filter) → asset detail with **full history timeline**, technical spec, documents (with customer-visibility tag).
- **Work Orders** — list (type filter) → detail with status flow, multi-technician assignment, typed checklist, parts consumption, GPS/check-in.
- **Fault tickets** — kanban board + list, SLA pills (warning/breach), detail with timeline, internal-vs-customer comments, dual confirmation codes.

## Not yet wired (intentional for a prototype)
Real API (`/api/v1`), auth/RBAC enforcement, data persistence, create/edit forms. These arrive with the production scaffold per `../docs/IMPLEMENTATION_PLAN.md` (R1 → R2).

## Next modules
Contracts & SLA, Inventory, Customers, Settings/Permissions (sidebar shows them as "قريباً").
