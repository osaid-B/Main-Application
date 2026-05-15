# Design System

> **Source of truth:** `src/foundation.css`.
> This document describes the tokens already defined there. **Do not duplicate
> values here** — if a token changes in `foundation.css`, update this doc only.
> Adding a new token? Add it to `foundation.css` first, then document below.

---

## 1. Colors

### Backgrounds & Surfaces

| Token                     | Value     | Usage                                       |
| ------------------------- | --------- | ------------------------------------------- |
| `--app-bg`                | `#f0f2f5` | Page background                             |
| `--app-surface`           | `#ffffff` | Default card / surface                      |
| `--app-surface-strong`    | `#ffffff` | Elevated surface (modals, popovers)         |
| `--app-surface-muted`     | `#f8fafc` | Subtle background (table stripe, disabled)  |
| `--app-surface-hover`     | `#f4f6f9` | Hover state on interactive surface          |

### Borders

| Token                     | Value                       | Usage                                |
| ------------------------- | --------------------------- | ------------------------------------ |
| `--app-border`            | `rgba(215, 221, 232, 0.85)` | Default divider, card outline        |
| `--app-border-strong`     | `rgba(148, 163, 184, 0.35)` | Form controls, emphasized separators |

### Text

| Token                | Value     | Usage                                |
| -------------------- | --------- | ------------------------------------ |
| `--app-text`         | `#0f172a` | Primary headings & body              |
| `--app-text-soft`    | `#334155` | Secondary body                       |
| `--app-text-muted`   | `#64748b` | Helper text, captions                |
| `--app-text-subtle`  | `#94a3b8` | Placeholders, disabled labels        |

### Accent (Brand Blue)

| Token                     | Value     | Usage                          |
| ------------------------- | --------- | ------------------------------ |
| `--app-accent`            | `#2563eb` | Primary action, brand          |
| `--app-accent-light`      | `#3b82f6` | Hover / focus accent           |
| `--app-accent-subtle`     | `#eff6ff` | Accent background fill         |
| `--app-accent-strong`     | `#1d4ed8` | Pressed / emphasized accent    |

### Semantic Status

| State    | Main token         | Subtle token              | Hex (main) |
| -------- | ------------------ | ------------------------- | ---------- |
| Success  | `--app-success`    | `--app-success-subtle`    | `#16a34a`  |
| Warning  | `--app-warning`    | `--app-warning-subtle`    | `#d97706`  |
| Danger   | `--app-danger`     | `--app-danger-subtle`     | `#dc2626`  |
| Info     | `--app-info`       | `--app-info-subtle`       | `#0ea5e9`  |

### Sidebar (Dark Navy Theme)

| Token                       | Value                       |
| --------------------------- | --------------------------- |
| `--sidebar-bg`              | `#141c2b`                   |
| `--sidebar-surface`         | `#1c2539`                   |
| `--sidebar-border`          | `rgba(255,255,255,0.07)`    |
| `--sidebar-text`            | `rgba(255,255,255,0.58)`    |
| `--sidebar-text-hover`      | `rgba(255,255,255,0.88)`    |
| `--sidebar-text-active`     | `#ffffff`                   |
| `--sidebar-link-hover`      | `rgba(255,255,255,0.06)`    |
| `--sidebar-link-active`     | `rgba(99,179,255,0.14)`     |
| `--sidebar-group-label`     | `rgba(255,255,255,0.28)`    |
| `--sidebar-accent`          | `#60a5fa`                   |
| `--sidebar-width`           | `228px`                     |
| `--sidebar-width-collapsed` | `56px`                      |

### Example

```css
.primaryButton {
  background: var(--app-accent);
  color: #ffffff;
  border: 1px solid var(--app-accent-strong);
}
.primaryButton:hover { background: var(--app-accent-light); }
.dangerInline       { color: var(--app-danger); background: var(--app-danger-subtle); }
```

---

## 2. Typography

Base: `Inter, "Segoe UI", "Helvetica Neue", Arial, sans-serif` at `14px / 1.5`
(see `foundation.css` body rules).

Predefined classes (use these instead of authoring new font-size literals):

| Class              | Size                          | Weight | Purpose                       |
| ------------------ | ----------------------------- | ------ | ----------------------------- |
| `.page-title`      | `clamp(1.5rem, 2.5vw, 2rem)`  | 700    | Top-of-page H1                |
| `.page-subtitle`   | `13px`                        | normal | Subheading under page title   |
| `.section-title`   | `14px`                        | 600    | Section header                |
| `.section-subtitle`| `12px`                        | normal | Section descriptor            |
| `.eyebrow-label`   | `11px` / uppercase            | 600    | Pill-style label              |

KPI numeric values: `1.35rem`, weight 700, `font-variant-numeric: tabular-nums`
(see `.dense-kpi-card strong`).

### Example

```tsx
<h1 className="page-title">Customers</h1>
<p className="page-subtitle">Manage your client list</p>
```

---

## 3. Spacing Scale

⚠️ The actual scale in `foundation.css` (overrides the original `4, 8, 12, 16, 24, 32, 48, 64` plan):

| Token            | Value  |
| ---------------- | ------ |
| `--app-space-1`  | `4px`  |
| `--app-space-2`  | `8px`  |
| `--app-space-3`  | `12px` |
| `--app-space-4`  | `16px` |
| `--app-space-5`  | `20px` |
| `--app-space-6`  | `24px` |
| `--app-space-7`  | `32px` |
| `--app-space-8`  | `40px` |

**Rule:** Never use raw pixel values for padding/margin/gap. Always reference a token.

### Example

```css
.cardBody { padding: var(--app-space-5); }
.list    { display: grid; gap: var(--app-space-3); }
```

---

## 4. Border Radius

| Token              | Value  | Use                                  |
| ------------------ | ------ | ------------------------------------ |
| `--app-radius-xs`  | `5px`  | Pills, tight chips                   |
| `--app-radius-sm`  | `7px`  | Inputs, buttons, small surfaces      |
| `--app-radius-md`  | `9px`  | Toolbars, detail surfaces            |
| `--app-radius-lg`  | `12px` | Cards, workspace surfaces            |
| `--app-radius-xl`  | `16px` | Modals, large containers             |

---

## 5. Shadows

| Token                  | Use                                |
| ---------------------- | ---------------------------------- |
| `--app-shadow-xs`      | KPI cards (resting state)          |
| `--app-shadow-soft`    | Default surfaces, hover lift       |
| `--app-shadow-strong`  | Floating menus, dropdowns          |
| `--app-shadow-overlay` | Modals, slide-overs                |

---

## 6. Transitions

| Token                  | Value         | Use                                |
| ---------------------- | ------------- | ---------------------------------- |
| `--app-transition`     | `150ms ease`  | Most interactions                  |
| `--app-transition-med` | `220ms ease`  | Slide-overs, sidebar collapse      |

### Example

```css
.button { transition: background var(--app-transition), box-shadow var(--app-transition); }
```

---

## 7. Layout Constants

| Token                  | Value     | Use                                |
| ---------------------- | --------- | ---------------------------------- |
| `--app-content-max`    | `1520px`  | Max content width                  |

---

## 8. Breakpoints

⚠️ Not yet tokenized in `foundation.css`. To be added in a follow-up phase.
Current responsive breakpoints live in `src/responsive.css`. Until tokens exist,
reuse the existing media queries from there — do not introduce new arbitrary ones.

---

## 9. Existing Surface Classes (reuse these)

| Class                  | Radius             | Shadow                | Use                            |
| ---------------------- | ------------------ | --------------------- | ------------------------------ |
| `.workspace-surface`   | `--app-radius-lg`  | `--app-shadow-soft`   | Main page card                 |
| `.toolbar-surface`     | `--app-radius-md`  | `--app-shadow-soft`   | Filters / action bars          |
| `.detail-surface`      | `--app-radius-md`  | `--app-shadow-soft`   | Side panels, detail views      |
| `.summary-surface`     | `--app-radius-sm`  | `--app-shadow-soft`   | Compact summary blocks         |

---

## 10. Form Controls (built-in defaults)

Inputs, selects, textareas inherit `36px` min-height, `--app-border-strong` border,
`--app-radius-sm`, and a `--app-accent` focus ring with `3px` halo. Don't restyle
these globally — wrap them in `components/ui/Input.tsx` etc. for variants.

---

## 11. Adding a New Token

1. Add to `:root` in `src/foundation.css`.
2. Document it in this file under the right section.
3. Update `design-system-checker` skill if it should be enforced.
