import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import "./foundation.css";
import "./styles/design-system.css";
import "./responsive.css";
import "./enterprise-redesign.css";
import "./pages-normalize.css";
import "./styles/tables.css";
import { AuthProvider } from "./context/AuthContext";
import { AIProvider } from "./context/AIContext";
import { SettingsProvider } from "./context/SettingsContext";
import { ToastProvider } from "./components/ui/Toast";
import { WorkspaceProvider } from "./contexts/WorkspaceContext";
import { ModuleProvider } from "./context/ModuleContext";
import { TreasuryProvider } from "./context/TreasuryContext";
import { CompanySettingsProvider } from "./context/CompanySettingsContext";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <SettingsProvider>
      <CompanySettingsProvider>
        <ToastProvider>
          <BrowserRouter>
            <AuthProvider>
              <AIProvider>
                <WorkspaceProvider>
                  <ModuleProvider>
                    <TreasuryProvider>
                      <App />
                    </TreasuryProvider>
                  </ModuleProvider>
                </WorkspaceProvider>
              </AIProvider>
            </AuthProvider>
          </BrowserRouter>
        </ToastProvider>
      </CompanySettingsProvider>
    </SettingsProvider>
  </React.StrictMode>
);
