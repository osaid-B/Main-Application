import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { translations, type AppLanguage } from "../i18n/translations";
import { localizeDocument } from "../i18n/staticCopy";
import {
  formatCurrencyValue,
  formatDateValue,
  formatNumberValue,
} from "../utils/displayFormatters";

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
const WESTERN_DIGIT_INPUT_SELECTOR =
  'input[type="number"], input[type="date"], input[type="tel"], input[inputmode="numeric"], input[inputmode="decimal"]';

function enforceWesternDigitInputs(root: ParentNode) {
  if (!("querySelectorAll" in root)) return;
  root.querySelectorAll<HTMLInputElement>(WESTERN_DIGIT_INPUT_SELECTOR).forEach((input) => {
    input.setAttribute("lang", "en");
    input.setAttribute("dir", "ltr");
  });
}

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
    enforceWesternDigitInputs(document);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLInputElement && node.matches(WESTERN_DIGIT_INPUT_SELECTOR)) {
            node.setAttribute("lang", "en");
            node.setAttribute("dir", "ltr");
            return;
          }

          if (node instanceof Element) {
            enforceWesternDigitInputs(node);
          }
        });
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    localStorage.setItem("app-theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
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
      formatCurrency: (value, currency = "ILS") =>
        formatCurrencyValue(Number(value || 0), currency as "ILS" | "JOD" | "USD"),
      formatDate: (value, options) => {
        if (!value) return "";
        return formatDateValue(
          value,
          {
            day: "2-digit",
            month: "short",
            year: "numeric",
            ...options,
          },
          language === "ar" ? "ar" : "en-US",
        );
      },
      formatNumber: (value) => formatNumberValue(Number(value || 0)),
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
