import { Eye, Globe2, MapPin, MoonStar, Palette, ShieldCheck, Sliders } from "lucide-react";
import { useState } from "react";
import { useSettings } from "../context/SettingsContext";
import { useSidebarPreferences } from "../context/SidebarPreferencesContext";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { ALL_ITEMS } from "../components/layout/Sidebar";
import "./Settings.css";

const LOCAL_SETTINGS_KEY = "atlas-local-settings";

function loadLocalSettings() {
  try {
    const raw = localStorage.getItem(LOCAL_SETTINGS_KEY);
    if (raw) return JSON.parse(raw) as { currency: string; vatRate: number; vatByDefault: boolean };
  } catch { /* ignore */ }
  return { currency: "ILS", vatRate: 16, vatByDefault: true };
}

export default function Settings() {
  const { language, theme, setLanguage, setTheme, isArabic, t } = useSettings();
  const prefs = useSidebarPreferences();
  const ts = t.sidebar;
  const [localSettings, setLocalSettings] = useState(loadLocalSettings);

  function saveLocalSettings(next: typeof localSettings) {
    setLocalSettings(next);
    localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(next));
  }

  const hiddenItemDetails = prefs.hiddenItems
    .map((path) => ALL_ITEMS.find((i) => i.path === path))
    .filter((i): i is (typeof ALL_ITEMS)[0] => i !== undefined);

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
          <Badge variant="neutral" className="dashboard-badge">{t.settings.systemSettings}</Badge>
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
              <Badge variant="neutral" className="settings-panel-chip">{t.settings.workspace}</Badge>
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
              <Badge variant="neutral" className="settings-panel-chip">{t.settings.appearance}</Badge>
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

      {/* Sidebar customization */}
      <section className="settings-main-grid">
        <article className="settings-panel app-subtle-card" style={{ gridColumn: "1 / -1" }}>
          <div className="settings-panel-header">
            <div>
              <Badge variant="neutral" className="settings-panel-chip">
                <Sliders size={11} style={{ display: "inline", marginInlineEnd: 4 }} />
                {ts.customize}
              </Badge>
              <h2>{ts.settingsTitle}</h2>
              <p>{ts.settingsDesc}</p>
            </div>
          </div>

          <div className="settings-hidden-items">
            <p className="settings-hidden-label">
              <strong>{ts.hiddenItemsLabel}</strong>
              {hiddenItemDetails.length > 0 && (
                <span className="settings-hidden-count">{hiddenItemDetails.length}</span>
              )}
            </p>

            {hiddenItemDetails.length === 0 ? (
              <p className="settings-hidden-empty">{ts.noHiddenItems}</p>
            ) : (
              <ul className="settings-hidden-list">
                {hiddenItemDetails.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.path} className="settings-hidden-row">
                      <span className="settings-hidden-icon"><Icon size={14} /></span>
                      <span className="settings-hidden-name">{item.label}</span>
                      <code className="settings-hidden-path">{item.path}</code>
                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<Eye size={12} />}
                        onClick={() => prefs.showItem(item.path)}
                      >
                        {ts.showItem}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </article>
      </section>

      {/* Local settings — Palestinian market */}
      <section className="settings-main-grid">
        <article className="settings-panel app-subtle-card" style={{ gridColumn: "1 / -1" }}>
          <div className="settings-panel-header">
            <div>
              <Badge variant="neutral" className="settings-panel-chip">
                <MapPin size={11} style={{ display: "inline", marginInlineEnd: 4 }} />
                {t.settings.localSettings}
              </Badge>
              <h2>{t.settings.localSettingsTitle}</h2>
              <p>{t.settings.localSettingsDesc}</p>
            </div>
          </div>

          <div className="settings-local-grid">
            <div className="settings-local-field">
              <label className="settings-local-label">{t.settings.defaultCurrency}</label>
              <div className="settings-option-list settings-option-list--inline">
                {[
                  { code: "ILS", label: t.settings.currencyILS },
                  { code: "JOD", label: t.settings.currencyJOD },
                  { code: "USD", label: t.settings.currencyUSD },
                ].map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    className={`settings-option-card settings-option-card--sm ${localSettings.currency === c.code ? "active" : ""}`}
                    onClick={() => saveLocalSettings({ ...localSettings, currency: c.code })}
                  >
                    <div className="settings-option-copy">
                      <strong>{c.code}</strong>
                      <span>{c.label}</span>
                    </div>
                    <span className="settings-option-state">
                      {localSettings.currency === c.code ? t.common.selected : t.common.use}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="settings-local-field">
              <label className="settings-local-label">{t.settings.defaultVatRate}</label>
              <div className="settings-vat-row">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  className="settings-vat-input"
                  value={localSettings.vatRate}
                  onChange={(e) => saveLocalSettings({ ...localSettings, vatRate: Number(e.target.value) })}
                />
                <span className="settings-vat-pct">%</span>
              </div>
            </div>

            <div className="settings-local-field settings-local-field--full">
              <label className="settings-vat-toggle-label">
                <input
                  type="checkbox"
                  checked={localSettings.vatByDefault}
                  onChange={(e) => saveLocalSettings({ ...localSettings, vatByDefault: e.target.checked })}
                />
                <span>{t.settings.vatApplyByDefault}</span>
              </label>
            </div>
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
