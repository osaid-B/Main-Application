---
name: design-system-checker
description: Use when reviewing any new or modified .tsx/.jsx/.css file before approval. Rejects hardcoded design values (colors, spacing, font-sizes, radii, shadows) and raw <button>/<input>/<select>/<textarea> usage in favor of design-system primitives from src/components/ui/. Verifies tokens from foundation.css are used.
---

# Design System Checker

## When to invoke
Before approving any file change under `src/` that includes JSX/TSX or CSS.
Especially before committing.

## Checks (in order)

### 1. Raw HTML elements that should be primitives
Search the file for:
- `<button` → suggest `<Button>` from `src/components/ui/Button`
- `<input` (except `type="file"` and `type="checkbox"` / `type="radio"` which currently have no primitive) → suggest `<Input>`
- `<select` → suggest `<Select>`
- `<textarea` → suggest `<Textarea>`

**Exceptions allowed (do NOT flag):**
- Elements inside `src/components/ui/*.tsx` (the primitives themselves)
- `<button>` with classes containing: `tab`, `view-toggle`, `view-switch`, `sort-`, `segmented`, `range-chip` — these are not design-system buttons
- `<input type="file">` (no primitive)

### 2. Hardcoded color values
Scan for patterns that should use tokens:
- Hex colors: `#[0-9a-fA-F]{3,8}` → suggest `var(--app-*)` from `foundation.css`
- `rgb(…)` / `rgba(…)` literals (except inside `foundation.css` itself)
- Named colors (`red`, `blue`, `white`, etc.) outside `foundation.css`

**Exceptions:**
- `#ffffff` and `#fff` for inverse text on accent/danger backgrounds (common pattern in Button primary/danger) — allowed but flag for review
- `transparent` is always fine

### 3. Hardcoded spacing
Look for pixel literals in `padding`, `margin`, `gap`, `top/right/bottom/left`:
- Multiples of 4 up to 64 should use `var(--app-space-1..-8)`
- Exception: `1px` (borders), `2px` (focus rings), `0`

### 4. Hardcoded font-sizes
Look for `font-size:` with px / rem literals outside `foundation.css`.
The canonical scale lives in foundation typography classes (`.page-title`, `.section-title`, etc.) and in primitive components. Anything else needs a token or reuse.

### 5. Hardcoded radii / shadows / transitions
- `border-radius: Npx` → suggest `var(--app-radius-{xs,sm,md,lg,xl})`
- `box-shadow: ...` literals → suggest `var(--app-shadow-{xs,soft,strong,overlay})`
- `transition: ... Nms` → suggest `var(--app-transition)` or `--app-transition-med`

### 6. RTL safety
Flag (warning, not error):
- `padding-left`, `padding-right`, `margin-left`, `margin-right`, `left:`, `right:` in component CSS modules
  → suggest `padding-inline-start/end`, `margin-inline-start/end`, `inset-inline-start/end`

## Reporting format

```
✗ design-system-checker — FAIL
  File: <path>
  
  Violations:
  • Line 42: raw <button> — replace with <Button variant="..." size="...">
  • Line 88: hardcoded color #2563eb — use var(--app-accent)
  • Line 105: hardcoded padding 20px — use var(--app-space-5)
  
  Total: N violations across M categories
```

Or:
```
✓ design-system-checker — PASS (file: <path>)
```

## Source of truth references
- Tokens: `src/foundation.css` (read first; document is `design-system.md`)
- Primitives registry: `components-index.md`
- Rules: `CLAUDE.md` §5 (Design Rules) and §7 (Component Checklist)
