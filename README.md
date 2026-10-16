# Lift Master Prompt Package

Place `MASTER_BUILD_PROMPT.md` in:

```text
/Users/haniyousif/dev/Lift
```

Your project should look like:

```text
Lift/
├── MASTER_BUILD_PROMPT.md
├── BRD-Elevator-Management-OS.md
├── Backlog-Elevator-Management-OS.md
├── Backlog-Elevator-Management-OS.csv
├── Link-Lift-System-Audit.md
├── SRS-Elevator-Management-OS.md
└── schema.sql
```

Then start Claude Code / Codex from the project directory:

```bash
cd /Users/haniyousif/dev/Lift
claude
```

Use:

```text
Read MASTER_BUILD_PROMPT.md and execute it exactly.

Do not start application scaffolding.
Complete the Architecture Readiness v1.1 phase first and stop after generating the requested outputs.
```

Expected outputs include:

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
