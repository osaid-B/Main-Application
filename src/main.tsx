import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import "./foundation.css";
import "./responsive.css";
import "./enterprise-redesign.css";
import "./pages-normalize.css";
import { AuthProvider } from "./context/AuthContext";
import { AIProvider } from "./context/AIContext";
import { SettingsProvider } from "./context/SettingsContext";
import { ToastProvider } from "./components/ui/Toast";
import { WorkspaceProvider } from "./contexts/WorkspaceContext";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <SettingsProvider>
      <ToastProvider>
        <BrowserRouter>
          <AuthProvider>
            <AIProvider>
              <WorkspaceProvider>
                <App />
              </WorkspaceProvider>
            </AIProvider>
          </AuthProvider>
        </BrowserRouter>
      </ToastProvider>
    </SettingsProvider>
  </React.StrictMode>
);
