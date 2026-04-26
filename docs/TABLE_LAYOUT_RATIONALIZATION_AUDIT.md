# Table and Layout Rationalization Audit

## Phase A findings

### Global layout inconsistencies
- Page shells follow similar intent but still drift between `hero + filters + content + side widgets` variants.
- Multiple modules use `card inside card inside card` surfaces where one workspace surface would be enough.
- The command bar and page headers compete for hierarchy on narrower desktop widths.
- The floating AI launcher overlaps operational content and footer controls.

### Repeated wrappers and redundant card patterns
- `*-toolbar-card` + `*-results-card` pairs often duplicate visual containment where one workspace surface would be enough.
- `right-side widget stacks` in Dashboard, Suppliers, Treasury, and Data Import create side-by-side card repetition with uneven value density.
- `modal section wrappers` are consistent in intent, but several forms still over-segment fields with extra bordered groups instead of using spacing and subheads.
- `table wrappers + pagination wrappers + outer cards` often stack three levels of containment around one table.
- `helper/info cards` in Data Import and Settings previously consumed space without matching operational value.

### Sidebar issues
- Future-ready modules looked like placeholder/demo boxes instead of low-emphasis roadmap entries.
- Sidebar had no desktop collapsed mode, so long labels and descriptions stayed visually heavy on every page.

### Table system inconsistencies
- Every table implemented its own footer, rows-per-page control, page buttons, and spacing rhythm.
- Important tables used large `min-width` values:
  - Customers `1180px`
  - Payments `1120px`
  - Purchases `1080px`
  - Suppliers `1220px`
  - Invoices `1220px`
  - Products `1120px`
- Long notes, references, descriptions, and contact metadata were still rendered inline in several cells.
- Column priority was not consistent across modules, especially in Suppliers, Payments, Purchases, and Invoices.

### Tables with horizontal scroll pressure
- Customers: wide filterable CRM table with too many peer-level fields before stacking.
- Suppliers: supplier code, contact, category, terms, balance, rating, and status previously competed horizontally.
- Purchases: description, multiple dates, received state, payment state, and actions pushed the table wider than needed.
- Invoices: items, note preview, due state, remaining amount, and linked context created a wide billing table.
- Payments: reference text and invoice/customer/method/date all competed in the same row.
- Products: SKU, category, pricing, stock, and status were manageable, but product descriptions still inflated the first column.
- Employees: monthly attendance remains intentionally wide when using full-month mode, but is now the explicit exception rather than the default.
- Treasury and reconciliation remain intentional wide-view cases and should continue to use alternate reading strategies instead of pretending to fit every column.

### Long-text overflow issues
- Purchases: PO descriptions and supplier-facing remarks.
- Payments: reference numbers, note previews, and receipt-related free text.
- Invoices: latest note, item summaries, and linked invoice explanations.
- Suppliers: internal notes, contact notes, and payment comments.
- Products: product descriptions under the product name in list mode.
- Data Import: validation summaries and history/checklist supporting text can visually overpower the main flow when fully expanded.

### Filters and selects
- Filter bars were compactly improved page-by-page, but select sizing, padding, and density still drifted.
- More Filters patterns were similar conceptually but not structurally unified.

### Shared foundation goals for Phase A
- one table shell with fixed-layout, stacked secondary text, and predictable truncation
- one table footer and pagination rhythm
- one overflow-content pattern for notes, descriptions, and references
- one select/dropdown size and density standard
- one AI launcher position that does not block primary content

## Proposed shared systems

### Shared table system
- `app-table-wrap` for controlled containment without defaulting to wide horizontal drag behavior
- `app-data-table` for fixed-layout tables with stronger column discipline
- `app-cell-stack` for primary + secondary text inside one column instead of creating extra width
- long references, notes, descriptions, and remarks should be routed to overflow previews instead of raw cell rendering
- sorting should live primarily in header buttons, with one consistent sort affordance

### Shared dropdown/select system
- `app-select-control` as the standard for filters, compact selectors, and form dropdowns
- consistent height, right-side chevron, padding, radius, and focus behavior
- compact enough for toolbars, but still valid for forms where no richer combobox is needed

### Shared overflow-content system
- `OverflowContent` as the reusable preview -> detail pattern
- one-line preview with ellipsis by default
- desktop popover behavior
- mobile bottom-sheet/dialog behavior
- optional title, subtitle, and metadata support

### Shared pagination/footer system
- `TableFooter` as the canonical table footer
- summary: `Showing X-Y of Z`
- rows-per-page selector
- previous / next buttons
- compact page numbers only when needed
- avoids disconnected page-local footer patterns

### AI Copilot repositioning plan
- remove bottom-right overlap with table rows and footer controls
- use one docked launcher near the content edge instead of a content-blocking floating button
- mobile placement should stay above bottom navigation and safe area
- AI remains easy to open, but should not visually compete with tables, pagination, or record actions

### Box clutter hotspots
- Suppliers right rail
- Treasury right-side stacked cards
- Dashboard repeated summaries
- Data Import helper blocks
- Employees month/report surfaces

### Intentional wide-view exceptions
- Monthly attendance
- Treasury reconciliation
- Import preview for large CSV structures

These should remain optimized wide views, but with sticky context, grouped columns, or alternate summary patterns rather than defaulting to raw width everywhere.
