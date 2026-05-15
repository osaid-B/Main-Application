# Components Index

> Registry of every primitive in `src/components/ui/`. Update this file
> whenever a new primitive is added or an existing one changes its API.
> The `component-builder` skill should keep this in sync automatically.

## UI Primitives

| Component | Path | Props | Variants | Used in pages | Status |
| --------- | ---- | ----- | -------- | ------------- | ------ |
| Button | `src/components/ui/Button.tsx` | `variant, size, isLoading, leftIcon, rightIcon, disabled, type, ...native` | `variant: primary \| secondary \| danger \| icon \| ghost` · `size: sm \| md \| lg` | Customers, Dashboard, DataImport, Employees, Invoices, Payments, Preview, Products, Purchases, Suppliers, Treasury (11) | ✅ Integrated |
| Input | `src/components/ui/Input.tsx` | `variant, size, label, error, hint, leftIcon, rightIcon, fullWidth, isDisabled, ...native input` | `variant: text \| email \| password \| search \| date \| number \| tel` · `size: sm \| md \| lg` | Customers, Invoices, Payments, Preview, Purchases, Suppliers, Treasury (7) | ✅ Integrated |
| Textarea | `src/components/ui/Textarea.tsx` | `size, label, error, hint, rows, resize, fullWidth, isDisabled, ...native textarea` | `size: sm \| md \| lg` · `resize: none \| vertical \| horizontal \| both` | Customers, DataImport, Invoices, Payments, Preview, Purchases (6) | ✅ Integrated |
| Select | `src/components/ui/Select.tsx` | `size, label, error, hint, options, placeholder, leftIcon, fullWidth, isDisabled, ...native select` | `size: sm \| md \| lg` | Customers, Invoices, Payments, Preview, Purchases, Suppliers, Treasury (7) | ✅ Integrated |
| Modal | `src/components/ui/Modal.tsx` | `isOpen, onClose, title?, description?, variant?, size?, isDismissible?, footer?, children, className?` | `variant: dialog \| drawer \| alert` · `size: sm \| md \| lg` (dialog only) | Customers, Invoices, Payments, Preview, Purchases, Treasury (6) | ✅ Integrated |
| Toast | `src/components/ui/Toast.tsx` | via `useToast()`: `toast(message, { type?, duration?, title? })`, `dismiss(id)` | `type: success \| error \| warning \| info` | Preview (demo); available via `useToast()` app-wide | 🆕 Available |
| ToastProvider _(required wrapper — not a primitive)_ | `src/components/ui/Toast.tsx` | `children` | — | wraps `<App/>` in `src/main.tsx` (outermost) | ✅ Mounted |
| Spinner | `src/components/ui/Spinner.tsx` | `size, tone, label, className, ...native span` | `size: sm \| md \| lg` · `tone: primary \| neutral \| inverse` | Preview; used inside `PageWrapper` loading state | 🆕 Available |
| Skeleton | `src/components/ui/Skeleton.tsx` | `variant, width, height, lines, rounded, className, ...native span` | `variant: text \| circle \| rect` | Preview | 🆕 Available |
| Badge | `src/components/ui/Badge.tsx` | `variant, size, leftIcon, rightIcon, children, ...native span` | `variant: success \| warning \| danger \| info \| neutral \| count` · `size: sm \| md` | Customers, DataImport, Invoices, Payments, Preview, Purchases, Settings, Suppliers, Treasury (9) | ✅ Integrated |
| Avatar | `src/components/ui/Avatar.tsx` | `size, name, src, alt, shape, tone, ...native span` | `size: xs \| sm \| md \| lg \| xl` · `shape: circle \| square` · `tone: accent \| neutral` | Preview | 🆕 Available |
| Tooltip | `src/components/ui/Tooltip.tsx` | `content, side, align, delay, children, isDisabled, className` | `side: top \| right \| bottom \| left` · `align: start \| center \| end` | Preview | 🆕 Available |

## Layout

| Component | Path | Props | Variants | Used in pages | Status |
| --------- | ---- | ----- | -------- | ------------- | ------ |
| MainLayout | `src/components/layout/MainLayout.tsx` | — | — | _all routed pages_ | ✅ existing |
| Sidebar | `src/components/layout/Sidebar.tsx` | — | — | via `MainLayout` | ✅ existing |
| AppShellCommandBar | `src/components/layout/AppShellCommandBar.tsx` | — | — | via `MainLayout` | ✅ existing |

## Layout (helpers)

| Component | Path | Props | Variants | Used in pages | Status |
| --------- | ---- | ----- | -------- | ------------- | ------ |
| Container | `src/components/layout/Container.tsx` | `maxWidth, padding, center, className, children, ...native div` | `maxWidth: sm \| md \| lg \| xl \| full` · `padding: none \| sm \| md \| lg` | Preview; used inside `PageWrapper` | 🆕 Available |
| Grid | `src/components/layout/Grid.tsx` | `cols, gap, responsive, alignItems, className, children, ...native div` | `cols: 1 \| 2 \| 3 \| 4 \| 6 \| 12` · `gap: xs \| sm \| md \| lg \| xl` · `alignItems: start \| center \| end \| stretch` | Preview | 🆕 Available |
| Stack | `src/components/layout/Stack.tsx` | `direction, gap, align, justify, wrap, className, children, ...native div` | `direction: vertical \| horizontal` · `gap` · `align` · `justify` | Preview | 🆕 Available |
| Flex | `src/components/layout/Flex.tsx` | `inline, direction, gap, align, justify, wrap, grow, className, children, ...native div` | `direction: row \| row-reverse \| column \| column-reverse` · `gap` · `align` · `justify` | Preview | 🆕 Available |
| PageWrapper | `src/components/layout/PageWrapper.tsx` | `state, title, subtitle, actions, error, emptyState, isLoading, maxWidth, padding, className, children, ...native div` | `state: success \| loading \| error \| empty` · `maxWidth` & `padding` forwarded to `Container` | _(pending page-level integration)_ | 🆕 Available |

## Feature

| Component | Path | Props | Variants | Used in pages | Status |
| --------- | ---- | ----- | -------- | ------------- | ------ |
| AIAssistantPanel | `src/components/ai/AIAssistantPanel.tsx` | — | — | _(audit pending)_ | ✅ existing |
| AIChatMessage | `src/components/ai/AIChatMessage.tsx` | — | — | _(audit pending)_ | ✅ existing |
| AIInsightCard | `src/components/ai/AIInsightCard.tsx` | — | — | _(audit pending)_ | ✅ existing |
| AISmartBrief | `src/components/ai/AISmartBrief.tsx` | — | — | _(audit pending)_ | ✅ existing |
| AIActionTrigger | `src/components/ai/AIActionTrigger.tsx` | — | — | _(audit pending)_ | ✅ existing |

## Placement Review (future cleanup)

These four files currently live under `components/ui/` but are not design-system
primitives. Final placement decision deferred to a future cleanup pass.

| Component | Current path | Suggested home | Used in pages | Status |
| --------- | ------------ | -------------- | ------------- | ------ |
| OverflowContent | `src/components/ui/OverflowContent.tsx` | utility helper — candidate for `lib/` or `components/shared/` | _(audit pending)_ | ⚠️ review |
| TableFooter | `src/components/ui/TableFooter.tsx` | table-specific — candidate for `components/features/table/` | _(audit pending)_ | ⚠️ review |
| Sparkline | `src/components/ui/Sparkline.tsx` | chart wrapper — candidate for `components/charts/` | _(audit pending)_ | ⚠️ review |
| ShortcutsOverlay | `src/components/ui/ShortcutsOverlay.tsx` | feature component — candidate for `components/features/` | _(audit pending)_ | ⚠️ review |

## Status Legend

- 🆕 Available — built, registered, exercised in `/preview`; awaiting in-page adoption
- 🆕 New — just scaffolded
- 🛠 In-progress — partially implemented
- ✅ Integrated — actively used across the app
- ✅ existing — pre-existing component, already wired
- ✅ Mounted — wired at app shell level
- ⚠️ Review — exists but placement / standards under reconsideration
