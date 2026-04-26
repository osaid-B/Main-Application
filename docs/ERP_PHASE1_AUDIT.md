# ERP Phase 1 Audit

## Repository Structure

- `src/`
  - `components/`
    - `layout/` shell and navigation
    - `ai/` assistant surfaces and prompts
  - `pages/` module-level screens
  - `data/` mock types, storage, and relation helpers
  - `context/` auth, settings, AI state
  - `services/` AI HTTP fallback service
  - `config/` app and module registry
- `public/`
  - static assets and PWA manifest
- `backend_backup/`
  - starter Django backup only, not an active backend

## Current App Architecture

- Frontend-first React/Vite application
- Route-per-module structure
- Local mock persistence via `localStorage`
- Page-owned UI patterns with limited shared primitives
- No real API contract or production backend integration

## Existing Modules

- Dashboard
- Customers
- Products
- Purchases
- Suppliers
- Invoices
- Payments
- Employees
- Settings
- Data Import
- Login

## Design-System Inconsistencies

- Repeated page-local header patterns
- Repeated KPI card variations
- Filters and toolbars are similar but not standardized
- Drawer and modal structures vary by page
- Badge/status systems are page-owned instead of global
- Typography hierarchy is stronger than before but still inconsistent
- CSS remains fragmented across page files

## Business Workflow Gaps

- Modules remain mostly CRUD-oriented
- Cross-module actions exist, but workflow chains are incomplete
- No full receivable, payable, approval, or posting lifecycle
- No branch or company scope
- No notification center persistence
- No event timeline framework shared across modules

## Accounting Gaps

- No Chart of Accounts
- No Journal Entries
- No General Ledger
- No Trial Balance / P&L / Balance Sheet
- No tax engine
- No fiscal periods
- No posting rules
- No reconciliation model
- No cost centers
- No audit event foundation

## Treasury / Banking / Cheque / Transfer Gaps

- No bank accounts
- No cash accounts
- No treasury dashboard
- No incoming/outgoing cheque model
- No transfer model
- No deposit batch logic
- No treasury approvals
- No instrument settlement lifecycle

## OCR / Attachment Gaps

- No shared attachment model
- No secure file metadata system
- No OCR extraction entity
- No OCR confidence / correction workflow
- No image-to-structured-record review UI
- No provider abstraction for OCR or storage

## Usability Risks

- Horizontal table density still relies heavily on per-page CSS
- Box clutter reduced, but not eliminated at system level
- Some modules are premium while others still feel transitional
- Settings and backend-facing configuration remain shallow
- Lint quality is affected by legacy project issues and backup folders

## Phase Plan

### Phase 1
- Audit and roadmap
- Shared shell
- Design foundation tokens
- Layout and responsive cleanup
- Shared toolbar/navigation patterns

### Phase 2
- Dashboard, Customers, Suppliers, Products, Purchases, Invoices, Payments

### Phase 3
- Treasury, bank accounts, incoming/outgoing cheques, transfers, OCR, reconciliation

### Phase 4
- Employees, Settings, Data Import, Login

### Phase 5
- Accounting core, AI workflow integration, permissions and audit

### Phase 6
- POS readiness, manufacturing readiness, localization polish, mobile refinement
