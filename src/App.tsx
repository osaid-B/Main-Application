import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleGuard from "./components/RoleGuard";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import MainLayout from "./components/layout/MainLayout";
import { PageCrashFallback } from "./components/ui/PageCrashFallback";
import { useAuth } from "./context/AuthContext";
import { SettingsProvider } from "./context/SettingsContext";
import { DataProvider } from "./context/DataContext";
import { FactoryProvider } from "./context/FactoryContext";
import { NotificationsProvider } from "./context/NotificationsContext";
import { SidebarPreferencesProvider } from "./context/SidebarPreferencesContext";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import AddCustomer from "./pages/AddCustomer";
import Products from "./pages/Products";
import Purchases from "./pages/Purchases";
import Suppliers from "./pages/Suppliers";
import AddSupplier from "./pages/AddSupplier";
import Invoices from "./pages/Invoices";
import Payments from "./pages/Payments";
import Treasury from "./pages/Treasury";
import Employees from "./pages/Employees";
import AddEmployee from "./pages/AddEmployee";
import Settings from "./pages/Settings";
import DataImport from "./pages/DataImport";
import Preview from "./pages/Preview";
import CompanyOverview from "./pages/CompanyOverview";
import PosCheckout from "./pages/pos/Checkout";
import CoinsHistory from "./pages/pos/CoinsHistory";
import CoinsReports from "./pages/pos/CoinsReports";
import CoinsSettings from "./pages/pos/CoinsSettings";
import LoyaltyProfile from "./pages/pos/LoyaltyProfile";
import PosReceipts from "./pages/pos/Receipts";
import PosCashiers from "./pages/pos/Cashiers";
import PosStockCounts from "./pages/pos/StockCounts";
import PosCategories from "./pages/pos/Categories";
import SalesHistory from "./pages/pos/SalesHistory";
import SalesRefunds from "./pages/pos/SalesRefunds";
import PosProducts from "./pages/pos/PosProducts";
import Departments from "./pages/Departments";
import Permissions from "./pages/Permissions";
import Reports from "./pages/Reports";
import Expenses from "./pages/Expenses";
import FactoryDashboard from "./pages/factory/FactoryDashboard";
import FactoryOrders from "./pages/factory/FactoryOrders";
import FactoryBoms from "./pages/factory/FactoryBoms";
import FactoryQc from "./pages/factory/FactoryQc";
import FactoryRawMaterials from "./pages/factory/FactoryRawMaterials";
import FactoryFinishedGoods from "./pages/factory/FactoryFinishedGoods";
import FactoryWarehouse from "./pages/factory/FactoryWarehouse";
import FactorySources from "./pages/factory/FactorySources";
import FactoryImports from "./pages/factory/FactoryImports";
import FactoryBatches from "./pages/factory/FactoryBatches";
import FactoryCosting from "./pages/factory/FactoryCosting";
import ComingSoon from "./pages/ComingSoon";
import Notifications from "./pages/Notifications";
import ProfitLoss from "./pages/ProfitLoss";
import BalanceSheet from "./pages/BalanceSheet";
import GeneralLedger from "./pages/GeneralLedger";
import ChartOfAccounts from "./pages/ChartOfAccounts";
import InventoryOverview from "./pages/InventoryOverview";
import InventoryMovements from "./pages/InventoryMovements";
import BarcodeProduct from "./pages/BarcodeProduct";

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />}
      />

      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
      />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/company" element={<CompanyOverview />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/customers/new" element={<ErrorBoundary fallback={(_, reset) => <PageCrashFallback onReset={reset} />}><AddCustomer /></ErrorBoundary>} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/barcode/:code" element={<BarcodeProduct />} />
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/suppliers/new" element={<ErrorBoundary fallback={(_, reset) => <PageCrashFallback onReset={reset} />}><AddSupplier /></ErrorBoundary>} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/treasury" element={<Treasury />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/employees/new" element={<ErrorBoundary fallback={(_, reset) => <PageCrashFallback onReset={reset} />}><AddEmployee /></ErrorBoundary>} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/data-import" element={<DataImport />} />
          <Route path="/preview" element={<Preview />} />

          {/* Finance & Accounting */}
          <Route path="/general-ledger" element={<GeneralLedger />} />
          <Route path="/chart-of-accounts" element={<ChartOfAccounts />} />
          <Route element={<RoleGuard roles={["Admin", "Manager"]} />}>
            <Route path="/reports" element={<Reports />} />
            <Route path="/reports/profit-loss" element={<ProfitLoss />} />
            <Route path="/reports/balance-sheet" element={<BalanceSheet />} />
          </Route>
          <Route element={<RoleGuard roles={["Admin", "Manager", "Finance"]} />}>
            <Route path="/expenses" element={<Expenses />} />
          </Route>

          {/* Inventory & Operations */}
          <Route path="/inventory" element={<InventoryOverview />} />
          <Route path="/inventory/movements" element={<InventoryMovements />} />
          <Route path="/manufacturing" element={<ComingSoon title="Manufacturing" />} />

          {/* Sales */}
          <Route path="/quotes" element={<ComingSoon title="Quotes" />} />

          {/* Org & Access */}
          <Route path="/departments" element={<Departments />} />
          <Route element={<RoleGuard roles={["Admin"]} />}>
            <Route path="/permissions" element={<Permissions />} />
          </Route>

          {/* System */}
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/audit-log" element={<ComingSoon title="Audit Log" />} />

          {/* Factory workspace — Factory role + Admin */}
          <Route path="/factory" element={<Navigate to="/factory/dashboard" replace />} />
          <Route element={<RoleGuard roles={["Admin", "Factory"]} />}>
            <Route path="/factory/dashboard" element={<FactoryDashboard />} />
            <Route path="/factory/orders" element={<FactoryOrders />} />
            <Route path="/factory/boms" element={<FactoryBoms />} />
            <Route path="/factory/qc" element={<FactoryQc />} />
            <Route path="/factory/inventory/raw" element={<FactoryRawMaterials />} />
            <Route path="/factory/inventory/finished" element={<FactoryFinishedGoods />} />
            <Route path="/factory/inventory/warehouse" element={<FactoryWarehouse />} />
            <Route path="/factory/inventory/sources" element={<FactorySources />} />
            <Route path="/factory/imports" element={<FactoryImports />} />
            <Route path="/factory/batches" element={<FactoryBatches />} />
            <Route path="/factory/costing" element={<FactoryCosting />} />
          </Route>

          {/* POS workspace */}
          <Route path="/pos" element={<Navigate to="/pos/checkout" replace />} />
          <Route path="/pos/checkout" element={<PosCheckout />} />
          <Route path="/pos/history" element={<SalesHistory />} />
          <Route path="/pos/refunds" element={<SalesRefunds />} />
          <Route path="/pos/products" element={<PosProducts />} />
          <Route path="/pos/categories" element={<PosCategories />} />
          <Route path="/pos/stock" element={<PosStockCounts />} />
          <Route path="/pos/loyalty/profile" element={<LoyaltyProfile />} />
          <Route path="/pos/loyalty/history" element={<CoinsHistory />} />
          <Route path="/pos/loyalty/settings" element={<CoinsSettings />} />
          <Route path="/pos/loyalty/reports" element={<CoinsReports />} />
          <Route path="/pos/cashiers" element={<PosCashiers />} />
          <Route path="/pos/receipts" element={<PosReceipts />} />

        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <DataProvider>
        <FactoryProvider>
          <NotificationsProvider>
            <SidebarPreferencesProvider>
              <ErrorBoundary>
                <AppRoutes />
              </ErrorBoundary>
            </SidebarPreferencesProvider>
          </NotificationsProvider>
        </FactoryProvider>
      </DataProvider>
    </SettingsProvider>
  );
}
