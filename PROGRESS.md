# PROGRESS — Bounded Task Queue

Baseline lint: 26 pre-existing errors in files outside task scope. Tracking only
errors introduced by task changes.

| Task | Status | Files changed | Result |
|------|--------|---------------|--------|
| 1. Customer disconnect | ✅ DONE (prev session) | AddCustomer.tsx, main.tsx | CUST-#### IDs unified; addCustomer → DataContext; DataProvider duplicate removed |
| 2. Products pattern | ✅ DONE | Products.tsx | Local products/categories state → DataContext; addProduct/updateProduct/deleteProduct/setProductCategories wired; 0 new lint errors |
| 3. Suppliers pattern | ✅ DONE | Suppliers.tsx, AddSupplier.tsx | Local suppliers state → DataContext; addSupplier/updateSupplier/deleteSupplierCtx wired; AddSupplier now actually saves; 0 new lint errors |
| 4. Payments FK fix | ✅ DONE | Payments.tsx | customers/invoices/payments from DataContext; addPayment/updatePayment/deletePaymentCtx wired; syncData effect removed; 0 new lint errors |
| 5. Dashboard derived selectors | ✅ DONE | Dashboard.tsx | openInvoicesCount/totalCustomers/totalPaymentsCount/lowStockCount/outOfStockCount from DataContext; workspaceStats + operationalSignals override static mocks; 0 new lint errors |

---

## AUTONOMOUS RUN — feat/all-new-pages (11 pages)

**Stack note:** User prompt referenced "Next.js 14 / Tailwind" — actual stack per CLAUDE.md: React 19.2 + Vite 8, CSS Modules, tokens from foundation.css. Following CLAUDE.md.

**Component map (reused everywhere):** Button, Badge, Input, Modal, Avatar, Select, Skeleton, Grid, Stack, Container — all from src/components/ui/ and src/components/layout/.

### BATCH A — POS Core (enhancements)
| # | Page | Route | Status |
|---|------|--------|--------|
| A1 | Receipts | /pos/receipts | 🔄 In progress |
| A2 | Cashiers | /pos/cashiers | ⬜ Queued |
| A3 | StockCounts | /pos/stock | ⬜ Queued |
| A4 | Categories | /pos/categories | ⬜ Queued |

### BATCH B — Loyalty
| # | Page | Route | Status |
|---|------|--------|--------|
| B1 | CoinsReports | /pos/loyalty/reports | ⬜ Queued |
| B2 | CoinsSettings | /pos/loyalty/settings | ⬜ Queued |
| B3 | CustomerProfile | /pos/loyalty/profile | ⬜ Queued |

### BATCH C — Org & Access
| # | Page | Route | Status |
|---|------|--------|--------|
| C1 | Departments | /departments | ⬜ Queued |
| C2 | Permissions | /permissions | ⬜ Queued |

### BATCH D — Financial
| # | Page | Route | Status |
|---|------|--------|--------|
| D1 | Reports | /reports | ⬜ Queued |
| D2 | Expenses | /expenses | ⬜ Queued |

### Decisions
- KpiCard: inline Kpi sub-component (no global KpiCard exists)
- EmptyState: inline pattern (no global component exists)
- DataTable: table + CSS module pattern (no global DataTable exists)
- Categories split view: left = category list, right = products in selected category; products linked via `Product.category` string
- CustomerLoyaltyProfile: URL param `/pos/loyalty/profile?id=CUST-001`; falls back to first record
- Org chart (Departments): CSS-only tree, no external lib
- Permissions matrix: checkbox-based toggle grid
- CoinsReports charts: recharts LineChart + BarChart (already in stack)
