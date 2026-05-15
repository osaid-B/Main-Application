# CLAUDE.md — Frontend Working Guide

> **⚠️ Read `AGENTS.md` first.** It defines product direction, priority order,
> and execution phases. This file *complements* it with concrete frontend rules
> and conventions. If anything here conflicts with `AGENTS.md`, `AGENTS.md` wins.

---

## 1. Stack (Frozen — do not change without approval)

| Layer        | Choice                                         |
| ------------ | ---------------------------------------------- |
| Framework    | React 19.2 + Vite 8                            |
| Language     | TypeScript 5.9 (strict)                        |
| Routing      | react-router-dom 7                             |
| Styling      | **Plain CSS + CSS Modules** consuming tokens from `src/foundation.css` |
| Icons        | lucide-react                                   |
| Charts       | recharts                                       |
| Utils        | clsx + tailwind-merge (for class composition)  |
| State        | React Context (Auth / Settings / AI)           |
| HTTP client  | **TBD** — not introduced yet                   |
| Tests        | None yet                                       |

**Tailwind v4 is installed but dormant.** Do not author new Tailwind utility
classes. Decision to remove it is deferred to validation phase.

---

## 2. Folder Structure

```
src/
├── components/
│   ├── ui/           # Design-system primitives ONLY (no business logic)
│   ├── layout/       # Shell: MainLayout, Sidebar, AppShellCommandBar
│   ├── ai/           # AI assistant surface
│   └── ProtectedRoute.tsx
├── pages/            # Route-level screens
├── hooks/            # Reusable hooks
├── context/          # React Context providers
├── services/         # Data + side-effects (e.g., ai.service.ts)
├── data/             # Mock data, types, storage
├── config/           # appConfig, moduleRegistry
├── i18n/             # translations, staticCopy
├── types/            # Shared TS types
├── foundation.css    # ⚠️ Source of truth for design tokens — DO NOT duplicate
├── index.css         # Global resets + heavy shared styles
├── responsive.css    # Breakpoint utilities
├── pages-normalize.css
└── enterprise-redesign.css
```

---

## 3. Naming Conventions

- **Components:** `PascalCase.tsx` (one component per file, default export)
- **Component CSS:** `PascalCase.module.css` (CSS Modules) — colocated with `.tsx`
- **Hooks:** `useCamelCase.ts`
- **Services:** `domain.service.ts`
- **Types:** `domain.types.ts`
- **Constants:** `SCREAMING_SNAKE_CASE`
- **CSS class names inside modules:** `camelCase`
- **Global CSS class names (outside modules):** `kebab-case` (e.g., `.app-page-content`)

---

## 4. Coding Standards

- **TypeScript strict** — no `any`, no `// @ts-ignore` without a comment explaining why
- **No default exports for hooks/services** — named exports only
- **No barrel files** (`index.ts` re-exports) unless the folder has ≥5 related exports
- **Imports order:** external → absolute internal → relative → CSS module
- **No `console.log` in committed code** (use a logger or remove)
- **Prefer composition over props explosion** — if a component has >8 props, split it
- **Boolean props:** `isLoading`, `hasError`, `canEdit` (not `loading`, `error`, `edit`)
- **Event handlers:** `onClick`, `onChange` (consumer-facing); `handleClick`, `handleChange` (internal)

---

## 5. Design Rules

- **Tokens only.** Every color, spacing, radius, shadow, transition MUST come from
  `foundation.css` via `var(--app-*)`. **No hex codes, no px literals for spacing,
  no hardcoded font sizes.**
- See `design-system.md` for the full token catalog.
- Surfaces follow the existing system: `.workspace-surface`, `.toolbar-surface`,
  `.summary-surface`, `.detail-surface` — reuse, don't reinvent.
- Page titles use `.page-title` / `.page-subtitle`. Section titles use
  `.section-title` / `.section-subtitle`. Don't introduce parallel typography.
- RTL/Arabic is supported via `i18n/` — never hardcode direction or alignment.

---

## 6. Component Architecture

Three layers, strict separation:

1. **`components/ui/`** — Primitives. Stateless or near-stateless. No business
   logic, no API calls, no domain types. Reusable across the whole app.
2. **`components/layout/`** — Shell. Owns the chrome (header, sidebar, command bar).
3. **`components/features/`** *(to be created)* and **`pages/`** — Feature-specific.
   May compose primitives and call services.

---

## 7. Component Checklist (mandatory for every new `components/ui/` primitive)

A primitive is **not done** until all of these are true:

- [ ] Located in `src/components/ui/ComponentName.tsx`
- [ ] Has a colocated `ComponentName.module.css`
- [ ] Exports a typed `Props` interface (`export interface ButtonProps { … }`)
- [ ] All `Props` documented with JSDoc `/** … */` on non-obvious fields
- [ ] Uses `clsx` + `tailwind-merge` (via a shared `cn()` util in `src/lib/cn.ts`) for class composition
- [ ] Supports `className` prop to allow consumer overrides
- [ ] Forwards `ref` if the underlying element supports it (`React.forwardRef`)
- [ ] Spreads `...rest` to the underlying element where appropriate
- [ ] Variants exposed as a `variant` / `size` prop (string literal union)
- [ ] Uses **only** tokens from `foundation.css` — no hardcoded values
- [ ] Has accessible defaults (correct semantic element, ARIA where needed,
      keyboard support, visible focus ring)
- [ ] RTL-safe (use `inline-start` / `inline-end` not `left` / `right`)
- [ ] Added to `components-index.md`
- [ ] Rendered in `/preview` route with all variants

---

## 8. API Rules

- All API contracts MUST be documented in `api-contracts.md` **before** implementing
  the fetch call.
- HTTP client choice is deferred — when introduced, wrap it in `src/services/http.ts`.
  Pages never call `fetch` / `axios` directly.
- Response shapes are mirrored as TypeScript types in `src/types/api.types.ts`.
- Errors are surfaced via a single `ApiError` type — no raw error throws to UI.
- **Coordinate with backend before adding/changing any endpoint.**

---

## 9. Git Workflow

- **Branch naming:** `feat/<scope>`, `fix/<scope>`, `chore/<scope>`, `refactor/<scope>`
- **Conventional Commits:**
  - `feat(ui): add Button primitive with variants`
  - `fix(invoices): correct date format in RTL`
  - `chore(config): add .vscode workspace settings`
- **One logical change per commit.**
- **Never commit:** `.env*`, lockfiles changes mixed with code, generated files,
  `node_modules`.
- Pre-commit gate (Phase 5 will automate this): `type-check` + `lint` +
  `design-system-checker` must all pass.

---

## 10. What NOT to Touch

- **Anything outside `Main-Application/`** — that's not this project's scope.
- **`AGENTS.md`** — owned by the user / product direction.
- **`src/foundation.css`** — token values are frozen unless explicitly requested.
  Adding *new* tokens is allowed; changing existing ones requires a discussion.
- **Backend code** — there is no backend folder in this repo currently. If/when
  it appears (`server/`, `api/`, `prisma/`, …), it's owned by another engineer.
  Coordinate via `api-contracts.md`.
- **Existing routes in `App.tsx`** — don't reorder or remove without approval.
- **`.gitignore`** rules — don't relax them without approval.

---

## 11. How Claude Should Behave (session rules)

1. **One language, two channels:** explain in Arabic, write code & commits in English.
2. **One phase at a time.** Execute → stop → wait for approval. Never batch phases.
3. **Search before creating.** Glob/Grep for any file before claiming it doesn't exist.
4. **No package installs without explicit approval.** Always state: reason + size +
   alternatives considered.
5. **No long summaries.** Report only: what was created/modified + non-obvious decisions.
6. **One specific question** when something is ambiguous — never guess.
7. **Smallest change that meets the goal.** No speculative refactors, no
   "while I'm here" cleanups.
8. **No new files until existing structure is examined.** Especially for components —
   check `components/ui/` and `pages/` first.

---

## 12. Quick Commands

```bash
# Development
npm run dev              # Vite dev server
npm run build            # Type-check + production build
npm run preview          # Serve production build locally
npm run lint             # ESLint

# To be added in Phase 6
npm run type-check       # tsc --noEmit
npm run verify           # type-check + lint + build
```

---

## 13. Key Files Reference

| Purpose                     | File                                    |
| --------------------------- | --------------------------------------- |
| Design tokens               | `src/foundation.css`                    |
| Token documentation         | `design-system.md`                      |
| Component registry          | `components-index.md`                   |
| API contracts (with backend)| `api-contracts.md`                      |
| Routes                      | `src/App.tsx`                           |
| Shell layout                | `src/components/layout/MainLayout.tsx`  |
| Auth gate                   | `src/components/ProtectedRoute.tsx`     |
| Auth state                  | `src/context/AuthContext.tsx`           |
| App settings state          | `src/context/SettingsContext.tsx`       |
| AI panel state              | `src/context/AIContext.tsx`             |
| Translations                | `src/i18n/translations.ts`              |
| Product direction           | `AGENTS.md`                             |
