import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./components/layout/MainLayout";
import { useAuth } from "./context/AuthContext";
import { SettingsProvider } from "./context/SettingsContext";

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
import ComingSoon from "./pages/ComingSoon";

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
          <Route path="/customers/new" element={<AddCustomer />} />
          <Route path="/products" element={<Products />} />
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/suppliers/new" element={<AddSupplier />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/treasury" element={<Treasury />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/employees/new" element={<AddEmployee />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/data-import" element={<DataImport />} />
          <Route path="/preview" element={<Preview />} />

          {/* POS workspace */}
          <Route path="/pos" element={<Navigate to="/pos/checkout" replace />} />
          <Route path="/pos/checkout" element={<PosCheckout />} />
          <Route path="/pos/history" element={<ComingSoon title="Sales History" />} />
          <Route path="/pos/refunds" element={<ComingSoon title="Refunds" />} />
          <Route path="/pos/products" element={<ComingSoon title="POS Products" />} />
          <Route path="/pos/categories" element={<ComingSoon title="Categories" />} />
          <Route path="/pos/stock" element={<ComingSoon title="Stock Counts" />} />
          <Route path="/pos/loyalty/profile" element={<ComingSoon title="Customer Profile" />} />
          <Route path="/pos/loyalty/history" element={<CoinsHistory />} />
          <Route path="/pos/loyalty/settings" element={<ComingSoon title="Coins Settings" />} />
          <Route path="/pos/loyalty/reports" element={<ComingSoon title="Coins Reports" />} />
          <Route path="/pos/cashiers" element={<ComingSoon title="Cashiers" />} />
          <Route path="/pos/receipts" element={<ComingSoon title="Receipts" />} />

        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <AppRoutes />
    </SettingsProvider>
  );
}
