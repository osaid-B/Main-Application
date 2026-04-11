import { useSettings } from "../context/SettingsContext";

export default function Settings() {
  const { language, theme, setLanguage, setTheme, isArabic, t } = useSettings();

  return (
    <>
      <style>{`
        .settings-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .settings-header h1 {
          margin: 0;
          font-size: 32px;
          font-weight: 800;
          color: var(--text-color, #0f172a);
        }

        .settings-header p {
          margin: 8px 0 0;
          color: var(--muted-color, #64748b);
          font-size: 15px;
        }

        .settings-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 20px;
        }

        .settings-card {
          background: var(--card-bg, #ffffff);
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 20px;
          padding: 22px;
          box-shadow: 0 12px 24px rgba(15, 23, 42, 0.05);
        }

        .settings-card h2 {
          margin: 0 0 10px;
          font-size: 22px;
          color: var(--text-color, #0f172a);
        }

        .settings-card p {
          margin: 0 0 18px;
          color: var(--muted-color, #64748b);
          line-height: 1.7;
        }

        .settings-options {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .settings-btn {
          border: 1px solid var(--border-color, #cbd5e1);
          background: var(--btn-bg, #f8fafc);
          color: var(--text-color, #0f172a);
          padding: 12px 18px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .settings-btn.active {
          background: #2563eb;
          color: white;
          border-color: #2563eb;
        }

        .settings-preview {
          margin-top: 18px;
          border: 1px dashed var(--border-color, #cbd5e1);
          border-radius: 16px;
          padding: 16px;
          background: var(--preview-bg, #f8fafc);
        }

        .settings-preview strong {
          display: block;
          margin-bottom: 8px;
          color: var(--text-color, #0f172a);
        }

        .settings-preview span {
          color: var(--muted-color, #64748b);
          font-size: 14px;
        }

        @media (max-width: 768px) {
          .settings-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="settings-page" dir={isArabic ? "rtl" : "ltr"}>
        <div className="settings-header">
          <p className="dashboard-badge">
            {isArabic ? "⚙️ الإعدادات" : "⚙️ Settings"}
          </p>
          <h1>{t.settings.pageTitle}</h1>
          <p>{t.settings.subtitle}</p>
        </div>

        <div className="settings-grid">
          <div className="settings-card">
            <h2>{t.settings.languageTitle}</h2>
            <p>{t.settings.languageDescription}</p>

            <div className="settings-options">
              <button
                className={`settings-btn ${language === "en" ? "active" : ""}`}
                onClick={() => setLanguage("en")}
              >
                English 🇺🇸
              </button>

              <button
                className={`settings-btn ${language === "ar" ? "active" : ""}`}
                onClick={() => setLanguage("ar")}
              >
                العربية 🇵🇸
              </button>
            </div>

            <div className="settings-preview">
              <strong>{t.settings.currentLanguage}</strong>
              <span>{language === "ar" ? "العربية" : "English"}</span>
            </div>
          </div>

          <div className="settings-card">
            <h2>{t.settings.themeTitle}</h2>
            <p>{t.settings.themeDescription}</p>

            <div className="settings-options">
              <button
                className={`settings-btn ${theme === "light" ? "active" : ""}`}
                onClick={() => setTheme("light")}
              >
                ☀️ {t.common.light}
              </button>

              <button
                className={`settings-btn ${theme === "dark" ? "active" : ""}`}
                onClick={() => setTheme("dark")}
              >
                🌙 {t.common.dark}
              </button>
            </div>

            <div className="settings-preview">
              <strong>{t.settings.currentMode}</strong>
              <span>{theme === "dark" ? t.common.dark : t.common.light}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}