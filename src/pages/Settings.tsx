import { Globe2, MoonStar, Palette, ShieldCheck } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import "./Settings.css";

export default function Settings() {
  const { language, theme, setLanguage, setTheme, isArabic, t } = useSettings();

  const languageOptions = [
    { value: "en", label: t.common.english, helper: t.settings.ltrHelper },
    { value: "ar", label: t.common.arabic, helper: t.settings.rtlHelper },
  ] as const;

  const themeOptions = [
    { value: "light", label: t.common.light, helper: isArabic ? "كثافة متوازنة مناسبة للعمل اليومي" : "Default balanced surface density" },
    { value: "dark", label: t.common.dark, helper: isArabic ? "تباين أعلى للتركيز والعمل المطول" : "Higher contrast for focused work" },
  ] as const;

  return (
    <div className="settings-page" dir={isArabic ? "rtl" : "ltr"}>
      <section className="settings-header">
        <div>
          <p className="dashboard-badge">{t.settings.systemSettings}</p>
          <h1>{t.settings.pageTitle}</h1>
          <p>{t.settings.subtitle}</p>
        </div>
      </section>

      <section className="settings-overview-grid">
        <article className="settings-overview-tile app-subtle-card">
          <div className="settings-overview-icon">
            <Globe2 size={18} />
          </div>
          <div>
            <span>{t.common.language}</span>
            <strong>{language === "ar" ? t.common.arabic : t.common.english}</strong>
          </div>
        </article>

        <article className="settings-overview-tile app-subtle-card">
          <div className="settings-overview-icon">
            <Palette size={18} />
          </div>
          <div>
            <span>{t.common.theme}</span>
            <strong>{theme === "dark" ? t.common.dark : t.common.light}</strong>
          </div>
        </article>

        <article className="settings-overview-tile app-subtle-card">
          <div className="settings-overview-icon">
            <ShieldCheck size={18} />
          </div>
          <div>
            <span>{t.settings.configurationStatus}</span>
            <strong>{t.settings.corePreferences}</strong>
          </div>
        </article>
      </section>

      <section className="settings-main-grid">
        <article className="settings-panel app-subtle-card">
          <div className="settings-panel-header">
            <div>
              <span className="settings-panel-chip">{t.settings.workspace}</span>
              <h2>{t.settings.languageTitle}</h2>
              <p>{t.settings.languageDescription}</p>
            </div>
          </div>

          <div className="settings-option-list">
            {languageOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`settings-option-card ${language === option.value ? "active" : ""}`}
                onClick={() => setLanguage(option.value)}
              >
                <div className="settings-option-copy">
                  <strong>{option.label}</strong>
                  <span>{option.helper}</span>
                </div>
                <span className="settings-option-state">
                  {language === option.value ? t.common.selected : t.common.use}
                </span>
              </button>
            ))}
          </div>
        </article>

        <article className="settings-panel app-subtle-card">
          <div className="settings-panel-header">
            <div>
              <span className="settings-panel-chip">{t.settings.appearance}</span>
              <h2>{t.settings.themeTitle}</h2>
              <p>{t.settings.themeDescription}</p>
            </div>
            <div className="settings-panel-icon">
              <MoonStar size={18} />
            </div>
          </div>

          <div className="settings-option-list">
            {themeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`settings-option-card ${theme === option.value ? "active" : ""}`}
                onClick={() => setTheme(option.value)}
              >
                <div className="settings-option-copy">
                  <strong>{option.label}</strong>
                  <span>{option.helper}</span>
                </div>
                <span className="settings-option-state">
                  {theme === option.value ? t.common.selected : t.common.use}
                </span>
              </button>
            ))}
          </div>
        </article>
      </section>

      <section className="settings-support-grid">
        <article className="settings-support-card app-subtle-card">
          <h3>{t.settings.currentLanguage}</h3>
          <p>{t.settings.currentLanguage}</p>
          <strong>{language === "ar" ? t.common.arabic : t.common.english}</strong>
        </article>

        <article className="settings-support-card app-subtle-card">
          <h3>{t.settings.currentMode}</h3>
          <p>{t.settings.currentMode}</p>
          <strong>{theme === "dark" ? t.common.dark : t.common.light}</strong>
        </article>

        <article className="settings-support-card app-subtle-card">
          <h3>{t.settings.nextExpansion}</h3>
          <p>{t.settings.nextExpansionDescription}</p>
          <strong>{t.settings.foundationReady}</strong>
        </article>
      </section>
    </div>
  );
}
