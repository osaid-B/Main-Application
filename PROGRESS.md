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

## STABILIZATION RUN — main branch (2026-05-27)

### Section 1 — Scan
| Item | Result |
|------|--------|
| window.alert/confirm | ✅ 0 found |
| comingSoon: true flags | ✅ no new pages flagged |

### Section 2 — DataContext/FactoryContext Wiring
| Page | Status |
|------|--------|
| FactoryDashboard | ✅ useFactory() |
| FactoryOrders | ✅ useFactory() + updateOrderStatus |
| FactoryBoms | ✅ useFactory() — deps fixed |
| FactoryQc | ✅ useFactory() |
| FactoryRawMaterials | ✅ useFactory() |
| FactoryFinishedGoods | ✅ useFactory() — deps fixed |
| FactoryWarehouse | ✅ useFactory() |
| FactorySources | ✅ useFactory() — deps fixed |
| FactoryImports | ✅ useFactory() — deps fixed |
| FactoryBatches | ✅ useFactory() — deps fixed |
| FactoryCosting | ✅ useFactory() — deps fixed |
| Cross-page: order done → FG onHand | ✅ wired in FactoryContext.updateOrderStatus |

### Section 3 — Auth Guards
| Guard | Roles | Status |
|-------|-------|--------|
| /permissions | Admin | ✅ RoleGuard |
| /factory/* | Admin, Factory | ✅ RoleGuard |
| /reports | Admin, Manager | ✅ RoleGuard |
| /expenses | Admin, Manager, Finance | ✅ RoleGuard |
| AuthContext role extension | Admin/Manager/Finance/Factory/Cashier | ✅ 5 test accounts |

### Section 4 — UI Polish
| Item | Status |
|------|--------|
| EmptyState component | ✅ created |
| useLoadingDelay hook | ✅ created (300ms) |
| All 11 factory pages — loading + empty state | ✅ done |
| Departments, Permissions, Reports, Expenses | ✅ done |
| Sidebar wiring | ✅ all routes present |

### Section 5 — i18n
| Item | Status |
|------|--------|
| window.alert/confirm = 0 | ✅ |
| OrgChart "staff" → t.departments.orgNodeStaff | ✅ |
| RoleGuard toast → t.common.accessDenied/Msg | ✅ |
| common.accessDenied/Msg — en + ar | ✅ |
| departments.orgNodeStaff — en + ar | ✅ |

### Final build
- npm run lint: ✅ 0 errors, 0 warnings
- npm run build: ✅ clean (chunk size warning is pre-existing)

---

## FULL FUNCTIONAL AUDIT — feat/data-wiring (2026-05-27)

### STEP 0 — Audit Report

| # | Page | Route | Broken actions | Missing data links |
|---|------|-------|---------------|-------------------|
| 1 | Categories | /pos/categories | None — add/edit/move/toggle all work | Products in right panel from POS_PRODUCTS mock (separate from DataContext products — acceptable) |
| 2 | PosProducts | /pos/products | savePrice: no toast on invalid input | KPI values computed from local POS_PRODUCTS copy (not DataContext); price edit doesn't persist past reload |
| 3 | StockCounts | /pos/stock | "Complete count" doesn't update product.stock in DataContext | Session data resets on reload (local state only) |
| 4 | SalesHistory | /pos/history | Export CSV ✓ wired | Cashier filter uses hardcoded CASHIER_IDS array; KPIs computed from mock array, not live |
| 5 | SalesRefunds | /pos/refunds | cashierFilter declared but setter missing → always empty string; new refund hardcodes cashier "Ahmad Qasim/CSH-01" | Refund data in local state only; new refund doesn't link to original sale |
| 6 | Receipts | /pos/receipts | Export button has no onClick handler | KPI stat cards computed from local RECEIPTS mock; no DataContext |
| 7 | CoinsReports | /pos/loyalty/reports | None | KPI cards use hardcoded string values from POS_LOYALTY_KPIS mock (not computed from COIN_TRANSACTIONS) |
| 8 | CoinsHistory | /pos/loyalty | Export CSV button has no onClick handler | KPI cards use hardcoded POS_LOYALTY_KPIS.*.value strings; not computed from live COIN_TRANSACTIONS |
| 9 | LoyaltyProfile | /pos/loyalty/profile | None — tab/adjust/pagination work | Always shows LOYALTY_PROFILES[0]; ignores ?id= URL param; adjustments in local state only |
| 10 | Cashiers | /pos/cashiers | None — add/edit/deactivate/PIN work in local state | todaySales + transactions from static POS_CASHIERS mock (not computed from SalesHistory); data resets on reload |
| 11 | Customers | /customers | Filter button no onClick; Export button no onClick | Customer outstandingBalance from DataContext ✓; lastOrderDate static |
| 12 | Suppliers | /suppliers | "Add Purchase" button in supplier detail has no onClick | Archive sets toast but doesn't apply isDeleted flag correctly |
| 13 | Employees | /employees | All tabs/CRUD/attendance work (uses storage directly) | No DataContext integration (uses getEmployees/saveEmployees raw); no department field → can't link to Departments |
| 14 | Invoices | /invoices | Customer search clears customerId on every keystroke before selection; supplier dropdown has no onChange binding | Mostly DataContext ✓; customer balance not updated when invoice is created |
| 15 | Expenses | /expenses | Bulk approve doesn't validate permissions | All local state — Expense not in DataContext; dept dropdown is freetext, not from Departments |
| 16 | Payments | /payments | "Bank Reconciliation" quick-action is a toast stub | Mostly DataContext ✓ |
| 17 | Products | /products | None | DataContext ✓ |
| 18 | Departments | /departments | Add/edit saves to local state only (not persisted) | headcount is static mock; not computed from Employees; no DataContext |
| 19 | Permissions | /permissions | All UI works | Changes stored in local useState only — lost on reload; RoleGuard uses hardcoded roles, doesn't read Permissions data |
| 20 | Reports | /reports | Export CSV ✓ wired; Generate (custom tab) works | ALL charts from mock (MONTHLY_FINANCIALS, SALES_BY_CASHIER, PL_ITEMS); no DataContext |
| 21 | CompanyOverview | /company | Export CSV ✓ wired | ALL KPIs + tables + charts from mock (COMPANY_KPIS, OPEN_INVOICES, DEPARTMENTS, CASH_FLOW); no DataContext |
| 22 | Dashboard | /dashboard | Date range toggle ✓; Export CSV ✓; New action ✓ | openInvoicesCount/totalCustomers/totalPaymentsCount/lowStockCount/outOfStockCount from DataContext ✓; revenue chart + timeline from mock |
| 23 | FactoryDashboard | /factory/dashboard | None | useFactory() ✓; KPIs from context |
| 24 | FactoryOrders | /factory/orders | None | useFactory() ✓; updateOrderStatus → FinishedGoods ✓ |
| 25 | FactoryBoms | /factory/boms | None | useFactory() ✓ |
| 26 | FactoryQc | /factory/qc | None | useFactory() ✓ |
| 27 | FactoryRawMaterials | /factory/raw | No add/edit/adjust buttons exist | useFactory() ✓ (read-only display) |
| 28 | FactoryFinishedGoods | /factory/finished | No transfer/write-off buttons exist | useFactory() ✓ (read-only display) |
| 29 | FactoryWarehouse | /factory/warehouse | No actions | useFactory() ✓ (read-only display) |
| 30 | FactorySources | /factory/sources | No add/edit buttons | useFactory() ✓ (read-only display) |
| 31 | FactoryImports | /factory/imports | "Add Import" button has NO onClick handler | useFactory() ✓; View modal ✓ |
| 32 | FactoryBatches | /factory/batches | No action buttons | useFactory() ✓ (read-only display) |
| 33 | FactoryCosting | /factory/costing | No action buttons | useFactory() ✓ (read-only display) |

### Critical findings summary
- **7 broken/missing onClick handlers**: Receipts export, CoinsHistory export, FactoryImports "Add Import", SalesRefunds cashier filter (no setter), Customers filter + export, Suppliers "Add Purchase"
- **6 pages all-mock (no DataContext)**: CompanyOverview, Reports, CoinsHistory KPIs, CoinsReports KPIs, Cashiers stats, LoyaltyProfile always-first-record
- **3 pages with persistence gap**: Departments (local state), Permissions (local state), Expenses (local state)
- **1 cross-context gap**: Employees uses raw storage, no DataContext, no department field

---

### STEP 1 — Fix Log (per page)

| # | Page | Status | Notes |
|---|------|--------|-------|
| 1 | Categories | ⬜ | |
| 2 | PosProducts | ⬜ | |
| 3 | StockCounts | ⬜ | |
| 4 | SalesHistory | ⬜ | |
| 5 | SalesRefunds | ⬜ | |
| 6 | Receipts | ⬜ | |
| 7 | CoinsReports | ⬜ | |
| 8 | CoinsHistory | ⬜ | |
| 9 | LoyaltyProfile | ⬜ | |
| 10 | Cashiers | ⬜ | |
| 11 | Customers | ⬜ | |
| 12 | Suppliers | ⬜ | |
| 13 | Employees | ⬜ | |
| 14 | Invoices | ⬜ | |
| 15 | Expenses | ⬜ | |
| 16 | Payments | ⬜ | |
| 17 | Departments | ⬜ | |
| 18 | Permissions | ⬜ | |
| 19 | Reports | ⬜ | |
| 20 | CompanyOverview | ⬜ | |
| 21 | FactoryImports | ⬜ | |
