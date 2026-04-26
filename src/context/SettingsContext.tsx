/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { translations, type AppLanguage } from "../i18n/translations";
import { localizeDocument } from "../i18n/staticCopy";

type ThemeMode = "light" | "dark";
type TranslationShape = typeof translations.en;

type SettingsContextType = {
  language: AppLanguage;
  locale: string;
  dir: "rtl" | "ltr";
  theme: ThemeMode;
  setLanguage: (language: AppLanguage) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleLanguage: () => void;
  toggleTheme: () => void;
  isArabic: boolean;
  formatCurrency: (value: number, currency?: string) => string;
  formatDate: (value?: string | number | Date, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (value: number) => string;
  t: TranslationShape;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<AppLanguage>(() => {
    const saved = localStorage.getItem("app-language");
    return saved === "ar" || saved === "en" ? saved : "en";
  });

  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem("app-theme");
    return saved === "dark" || saved === "light" ? saved : "light";
  });

  useEffect(() => {
    localStorage.setItem("app-language", language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.body.classList.toggle("rtl", language === "ar");
  }, [language]);

  useEffect(() => localizeDocument(language), [language]);

  useEffect(() => {
    localStorage.setItem("app-theme", theme);
    document.body.classList.toggle("dark-mode", theme === "dark");
  }, [theme]);

  const value: SettingsContextType = useMemo(
    () => ({
      language,
      locale: language === "ar" ? "ar" : "en-US",
      dir: language === "ar" ? "rtl" : "ltr",
      theme,
      setLanguage,
      setTheme,
      toggleLanguage: () =>
        setLanguage((prev) => (prev === "en" ? "ar" : "en")),
      toggleTheme: () =>
        setTheme((prev) => (prev === "light" ? "dark" : "light")),
      isArabic: language === "ar",
      formatCurrency: (value, currency = "USD") =>
        new Intl.NumberFormat(language === "ar" ? "ar" : "en-US", {
          style: "currency",
          currency,
          minimumFractionDigits: 2,
        }).format(Number(value || 0)),
      formatDate: (value, options) => {
        if (!value) return "";
        const parsed = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(parsed.getTime())) return String(value);

        return new Intl.DateTimeFormat(language === "ar" ? "ar" : "en-US", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          ...options,
        }).format(parsed);
      },
      formatNumber: (value) =>
        new Intl.NumberFormat(language === "ar" ? "ar" : "en-US").format(Number(value || 0)),
      t: translations[language] as TranslationShape,
    }),
    [language, theme]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return context;
}
