---
name: page-consistency-checker
description: Use after creating or significantly modifying any page in src/pages/. Compares the page against the rest of the codebase for: shell usage (MainLayout via routing), PageWrapper state handling (loading/error/empty), primitive usage consistency, AI Assistant placement, header pattern, and overall structural fit. Reports a diff between this page and the established patterns.
---

# Page Consistency Checker

## When to invoke
- After scaffolding a new page
- After significantly modifying a page (>30% changes)
- Before declaring a page "done"
- When user says "is this page consistent?"

## Reference patterns (canonical examples)

| Concern | Canonical example | What to verify |
|---|---|---|
| Shell wrapping | All pages render under `<MainLayout/>` via `App.tsx` routing | Page is NOT rendered outside `<ProtectedRoute>` + `<MainLayout>` (unless it's Login or another public route) |
| Title + subtitle | `Dashboard.tsx`, `Employees.tsx` use `.page-title` / `.page-subtitle` classes | New pages should use these OR `<PageWrapper title=... subtitle=.../>` |
| Empty/loading/error states | `PageWrapper` is the project-standard wrapper | Pages should pipe state into PageWrapper, not roll their own |
| Form patterns | `Customers.tsx`, `Employees.tsx` use `<Input>` / `<Textarea>` / `<Select>` | No raw `<input>`/`<select>`/`<textarea>` (except `type="file"` / `type="checkbox"` / `type="radio"`) |
| Action buttons | `<Button>` primitive with `variant` + `size` | No raw `<button>` for design-system actions |
| Status indicators | `<Badge variant="...">` | No ad-hoc `*-pill` / `*-chip` / `*-badge` divs for status |
| Modals/Drawers | `<Modal>` from `src/components/ui/Modal.tsx` | No custom modal `<div className="modal-overlay">` patterns |
| AI Assistant | Mounted at app shell level (in `MainLayout` or `App`), not per-page | Page should NOT mount its own AI panel; should not push a global one off-screen |
| RTL | Page uses logical CSS (`inline-start/end`) or relies on primitives that do | No `text-align: left/right`, `padding-left/right` literals in page-specific CSS |

## Checks (in order)

### 1. Shell membership
Check `src/App.tsx` — the page should be registered inside the
`<ProtectedRoute>` → `<MainLayout>` chain (unless explicitly public like Login).

### 2. Header pattern
Page should render a title + optional subtitle via either:
- `<PageWrapper title="…" subtitle="…">…</PageWrapper>` (preferred for state-aware pages), OR
- Manual `<h1 className="page-title">` + `<p className="page-subtitle">` (legacy pattern).

If neither is present, suggest adding `PageWrapper`.

### 3. State handling
Grep the page for `isLoading`, `error`, `isEmpty` (or similar).
If any state is tracked but the UI doesn't render distinct states → suggest wiring through `PageWrapper`.

### 4. Primitive usage
Counts of raw vs primitive:
- raw `<button>` count vs `<Button>` count
- raw `<input>` count (excluding `type="file"`/`checkbox`/`radio`) vs `<Input>` count
- raw `<select>` vs `<Select>` count
- raw `<textarea>` vs `<Textarea>` count
- ad-hoc `*-pill` / `*-badge` divs vs `<Badge>` count
- ad-hoc modal divs vs `<Modal>` count

Report ratios. If raw > 0 in any category (with exceptions), flag for refactor.

### 5. AI Assistant placement
Search the page for `AIAssistantPanel`, `AIContext`, etc. — these should be at app level.
If a page renders its own AI surface, flag it.

### 6. Custom CSS bloat
Compare the page's `*.css` file size and class count vs. the average across other pages.
If much higher than the average, suggest extracting reusable styles to primitives or shared CSS.

## Report format

```
page-consistency-checker — src/pages/<Name>.tsx
  ✓ Shell:       wrapped via App.tsx routing
  ✓ Header:      uses PageWrapper
  ⚠ State:       has `error` state but no error UI hooked into PageWrapper
  ✗ Primitives:  18 raw <button>, 3 <Button> — refactor needed
  ✓ AI:          no in-page AI surface
  ⚠ CSS:         <Name>.css has 1100 lines (avg: 600) — consider extraction
  
  Overall: needs follow-up — 1 ✗, 2 ⚠.
```

## Never do
- Don't auto-rewrite the page. Report only; user decides.
- Don't ignore intentional deviations (e.g., DataImport has wizard steps — those are page-specific by design). Note them as "intentional" if marked in `AGENTS.md` or `CLAUDE.md`.
- Don't compare to outdated pages — sample only the top-3 most-recent / most-canonical examples.
