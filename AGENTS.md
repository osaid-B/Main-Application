# AGENTS

## Product Direction

This repository is being transformed from a visually clean business dashboard into a serious ERP / accounting / operations workspace.

Priority order:
1. Product coherence over isolated page polish
2. Operational clarity over decorative UI
3. Shared scalable patterns over one-off page solutions
4. Finance and accounting readiness over generic CRUD behavior
5. Mobile/tablet usability without sacrificing desktop quality

## Working Rules

- Treat the project as frontend-first unless the user explicitly reopens backend scope.
- Preserve valid business logic, but replace weak structural patterns when needed.
- Prefer fewer stronger surfaces instead of deeply nested cards and containers.
- Standardize shared patterns before doing more isolated page redesigns.
- Keep AI contextual, useful, and non-intrusive.
- Prefer enterprise wording and workflow depth over marketing-style UI copy.

## Current Execution Phases

### Phase 1
- Audit architecture, UX inconsistencies, and technical debt
- Rebuild shared shell and design-system foundations
- Standardize headers, action bars, filters, tables, drawers, and modal behavior

### Phase 2
- Refactor dashboard, customers, products, purchases, suppliers, invoices, payments

### Phase 3
- Redesign employees, settings, data import, login

### Phase 4
- Add accounting core scaffolding, permissions model, contextual AI architecture

### Phase 5
- Prepare POS readiness, manufacturing readiness, deep localization, and mobile refinement

## Validation

At the end of each major phase:
- run lint
- run type-check
- run tests if available
- run build
- summarize changed files
- summarize UX and workflow gains
- summarize remaining gaps
