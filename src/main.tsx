import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import "./foundation.css";
import "./responsive.css";
import "./enterprise-redesign.css";
import { AuthProvider } from "./context/AuthContext";
import { AIProvider } from "./context/AIContext";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AIProvider>
          <App />
        </AIProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
