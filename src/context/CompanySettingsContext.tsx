import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";
import type { CompanySettings } from "../types/companySettings";
import { DEFAULT_COMPANY_SETTINGS } from "../types/companySettings";

const STORAGE_KEY = "atlas-company-settings";

function loadSettings(): CompanySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_COMPANY_SETTINGS, ...JSON.parse(raw) as Partial<CompanySettings> };
  } catch { /* ignore */ }
  return { ...DEFAULT_COMPANY_SETTINGS };
}

function persistSettings(s: CompanySettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

interface CompanySettingsContextValue {
  settings: CompanySettings;
  updateSettings: (partial: Partial<CompanySettings>) => void;
  resetToDefaults: () => void;
}

const CompanySettingsContext = createContext<CompanySettingsContextValue | null>(null);

export function CompanySettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<CompanySettings>(loadSettings);

  const updateSettings = useCallback((partial: Partial<CompanySettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      persistSettings(next);
      return next;
    });
  }, []);

  const resetToDefaults = useCallback(() => {
    const next = { ...DEFAULT_COMPANY_SETTINGS };
    persistSettings(next);
    setSettings(next);
  }, []);

  return (
    <CompanySettingsContext.Provider value={{ settings, updateSettings, resetToDefaults }}>
      {children}
    </CompanySettingsContext.Provider>
  );
}

export function useCompanySettings(): CompanySettingsContextValue {
  const ctx = useContext(CompanySettingsContext);
  if (!ctx) throw new Error("useCompanySettings must be used within CompanySettingsProvider");
  return ctx;
}
