---
name: component-builder
description: Use when the user asks to create a new design-system primitive or shared component (e.g., "create a new component called X", "add a Tabs primitive", "build a Switch component"). Generates the .tsx + .module.css pair following the full Component Checklist from CLAUDE.md §7, and updates components-index.md.
---

# Component Builder

## When to invoke
- "create a new component called X"
- "add a <Name> primitive"
- "build a <Kind> component"
- "I need a reusable <Name>"

## Inputs needed
- **Component name** (PascalCase, e.g., `Tabs`)
- **Layer**: primitive (`components/ui/`) vs layout helper (`components/layout/`) vs feature (`components/features/`)
- **Props summary** (variants, sizes, key behaviors)
- **Reference page** (optional — to extract the best existing version from)

If any are unclear, ASK once.

## Steps

### 1. Search for existing matches
Glob/Grep for the name AND any synonyms before creating:
- `src/components/ui/<Name>.tsx`
- Existing references in pages with similar functionality

If a similar component exists, OFFER to extend it instead of duplicating.

### 2. Read context
- `CLAUDE.md` §7 (Component Checklist) — MANDATORY
- `design-system.md` (tokens)
- `src/components/ui/Button.tsx` + `.module.css` (the reference pattern)
- `src/lib/cn.ts`
- `src/foundation.css` (first 200 lines for tokens)

### 3. Build the component

File 1: `src/components/ui/<Name>.tsx` (or chosen layer folder)

Required pattern:
```tsx
import { forwardRef, type SomeAttrs, type ReactNode } from "react";
import { cn } from "../../lib/cn";
import styles from "./<Name>.module.css";

export type <Name>Variant = "..." | "...";
export type <Name>Size = "sm" | "md" | "lg";

export interface <Name>Props extends SomeAttrs {
  variant?: <Name>Variant;
  size?: <Name>Size;
  /** JSDoc on every non-obvious prop. */
  isLoading?: boolean;
  // ...
}

export const <Name> = forwardRef<HTMLElement, <Name>Props>(function <Name>(
  { variant = "default", size = "md", className, children, ...rest },
  ref,
) {
  return (
    <element
      ref={ref}
      className={cn(styles.root, styles[`variant_${variant}`], styles[`size_${size}`], className)}
      {...rest}
    >
      {children}
    </element>
  );
});
```

File 2: `src/components/ui/<Name>.module.css`

Required:
- Base styles in `.root`
- One class per variant: `.variant_<name>`
- One class per size: `.size_<name>`
- All values via `var(--app-*)`. NO hardcoded colors/spacing/radii.
- `:focus-visible` ring matching `foundation.css` pattern
- `:disabled` state with `opacity: 0.55; cursor: not-allowed;`
- Responsive override at `@media (max-width: 600px)` if size differences matter

### 4. Verify the Checklist
Every item in `CLAUDE.md` §7 must be satisfied:
- [ ] Props interface exported + typed
- [ ] JSDoc on non-obvious props
- [ ] Uses `cn()`
- [ ] Supports `className` override
- [ ] `forwardRef`
- [ ] Spreads `...rest`
- [ ] Variants as string literal union
- [ ] Tokens only
- [ ] Accessible (semantic element, ARIA, keyboard, focus)
- [ ] RTL-safe (logical CSS where possible)
- [ ] Added to `components-index.md`
- [ ] Mentioned in `/preview` route (Phase 6 follow-up)

### 5. Update `components-index.md`
Insert a row in the appropriate section ("UI Primitives" / "Layout" / "Feature") with:
| Component | Path | Props summary | Variants | Used in pages | Status |

Initial status: `🆕 New`. Used-in-pages: `_(pending integration)_`.

### 6. Output
- ✅ Created `<path>/<Name>.tsx` (N LOC)
- ✅ Created `<path>/<Name>.module.css` (M LOC)
- ✅ Registered in `components-index.md`
- ⏳ Next: add to `/preview` route; integrate into pages

## Never do
- Don't introduce hardcoded values.
- Don't skip the Checklist.
- Don't create barrel files.
- Don't put business logic in a primitive.
- Don't ship without forwardRef when the underlying element supports it.
