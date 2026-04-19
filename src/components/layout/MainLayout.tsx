import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import AIAssistantPanel from "../ai/AIAssistantPanel";
import { useAI } from "../../context/AIContext";

export default function MainLayout() {
  const { isOpen, initialPrompt, openAI, closeAI } = useAI();

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="app-main" style={{ position: "relative" }}>
        <button
          onClick={() => openAI()}
          style={aiButtonStyles}
          type="button"
        >
          AI Copilot
        </button>

        <Outlet />
      </main>

      <AIAssistantPanel
        isOpen={isOpen}
        onClose={closeAI}
        initialPrompt={initialPrompt}
      />
    </div>
  );
}

const aiButtonStyles: React.CSSProperties = {
  position: "fixed",
  bottom: "96px",
  right: "24px",
  zIndex: 1300,
  border: "none",
  borderRadius: "999px",
  padding: "12px 18px",
  backgroundColor: "#111827",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 8px 20px rgba(0, 0, 0, 0.18)",
};