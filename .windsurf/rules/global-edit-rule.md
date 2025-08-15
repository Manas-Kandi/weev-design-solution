---
trigger: always_on
---

# Global Editing Rules — Micro-Change Governance

Mode: MICRO-CHANGE by default.

Change Budget:
- MaxFiles: 3
- MaxDiffLines (added+removed): 120
- No cross-cutting refactors, renames, automated reformatting, or dependency/version bumps without explicit user opt-in.

Process Gate:
- Every task must emit PLAN → PATCH → POSTCHECK (and NEXT if needed).
- PATCH must be unified diffs only. No prose inside the diff section.
- If budget is exceeded or additional files are needed, STOP and print SCOPE_LIMIT_REACHED with a one-subtask proposal.

Safety Rails:
- Don’t modify config/tooling (eslint, prettier, tsconfig, build, CI) unless the task is explicitly about those.
- Don’t change function signatures or types outside the immediate call site unless required; prefer local guards.
- Prefer additive small helpers over edits spread across many files.
- Tests: adjust minimally and colocated; do not introduce new frameworks.

Escalation Protocol:
- If the minimal fix is impossible within the budget, propose exactly one smaller subtask with:
  - name, files, rough diff size estimate, and risk.
- Ask for approval before proceeding.