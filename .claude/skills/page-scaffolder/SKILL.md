---
name: page-scaffolder
description: Use when the user asks to create a new page (e.g., "create a new page called X", "add a Reports page", "scaffold a new screen for Y"). Generates the route, folder structure, state-handling (loading/error/empty/success via PageWrapper), responsive skeleton, API placeholders, and registers the route in App.tsx.
---

# Page Scaffolder

## When to invoke
- "create a new page called X"
- "add a <Name> page"
- "scaffold a new screen for Y"
- "I want a route at /foo"

## Inputs needed
- **Page name** (PascalCase, e.g., `Reports`)
- **Route path** (default: `/<page-name-lowercase>`)
- **Page intent** (list / detail / form / dashboard) — affects skeleton choice

If route path is unclear, ASK once before scaffolding.

## What to generate

### 1. Page component file: `src/pages/<Name>.tsx`

Template (replace `<Name>`, `<title>`, `<routePath>`):

```tsx
import { useState } from "react";
import { PageWrapper } from "../components/layout/PageWrapper";
import { Stack } from "../components/layout/Stack";

export default function <Name>() {
  // TODO: Replace mock state with real API integration
  const [isLoading] = useState(false);
  const [error] = useState<string | null>(null);
  const isEmpty = false; // derive from data
  
  const state = error ? "error" : isLoading ? "loading" : isEmpty ? "empty" : "success";
  
  return (
    <PageWrapper
      state={state}
      title="<title>"
      subtitle="<one-line description>"
      error={error ? { message: error, onRetry: () => {/* TODO */} } : undefined}
      emptyState={{ title: "No items yet", description: "Get started by adding one." }}
    >
      <Stack gap="md">
        {/* TODO: page content */}
      </Stack>
    </PageWrapper>
  );
}
```

### 2. Optional page-specific CSS Module: `src/pages/<Name>.module.css`

Skip unless the page needs custom layout that primitives don't cover.

### 3. Register the route in `src/App.tsx`

Add an import:
```tsx
import <Name> from "./pages/<Name>";
```

Add a `<Route>` inside the `<ProtectedRoute>` + `<MainLayout>` block:
```tsx
<Route path="<routePath>" element={<<Name> />} />
```

### 4. Add nav entry (if a sidebar/header link is wanted)

If the user wants the page in the sidebar, edit `src/components/layout/Sidebar.tsx`
to add a nav item. Otherwise, mention that the page is route-accessible but not linked.

## Output (after scaffolding)
Print:
- ✅ Created `src/pages/<Name>.tsx`
- ✅ Registered route `<routePath>` in `App.tsx`
- ⏳ TODO list for the consumer:
  - Wire real data source / API call
  - Update `isEmpty` derivation
  - Replace the placeholder content
- Quick test command: `npm run dev`, then visit `<routePath>`

## Never do
- Don't write business logic / API calls — only placeholders.
- Don't create duplicate routes — check `App.tsx` first.
- Don't bypass the Component Checklist (`CLAUDE.md` §7) if you also create components.
- Don't introduce new design tokens — reuse `foundation.css`.
