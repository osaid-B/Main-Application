import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Container } from "../../components/layout/Container";
import { Stack } from "../../components/layout/Stack";
import { Button } from "../../components/ui/Button";
import { useSettings } from "../../context/SettingsContext";
import {
  LOYALTY_SETTINGS_DEFAULT,
  type LoyaltySettings,
  type LoyaltyTier,
} from "../../data/posMock";
import styles from "./CoinsSettings.module.css";

export default function CoinsSettings() {
  const { t } = useSettings();
  const tc = t.pos.coinsSettings;

  const [settings, setSettings] = useState<LoyaltySettings>(LOYALTY_SETTINGS_DEFAULT);
  const [savedSection, setSavedSection] = useState<string | null>(null);

  function handleSave(section: string) {
    setSavedSection(section);
    setTimeout(() => setSavedSection(null), 2000);
  }

  function update<K extends keyof LoyaltySettings>(key: K, value: LoyaltySettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  function updateTier(id: string, field: keyof LoyaltyTier, value: string | number) {
    setSettings((prev) => ({
      ...prev,
      tiers: prev.tiers.map((t) => (t.id === id ? { ...t, [field]: value } : t)),
    }));
  }

  function addTier() {
    const newTier: LoyaltyTier = {
      id: `t${Date.now()}`,
      name: "",
      nameAr: "",
      minCoins: 0,
      multiplier: 1,
    };
    setSettings((prev) => ({ ...prev, tiers: [...prev.tiers, newTier] }));
  }

  function removeTier(id: string) {
    setSettings((prev) => ({ ...prev, tiers: prev.tiers.filter((t) => t.id !== id) }));
  }

  const summary = tc.summary
    .replace("{{coins}}", String(settings.coinsPerUnit))
    .replace("{{unit}}", String(settings.unitAmount))
    .replace("{{min}}", String(settings.minCoinsToRedeem));

  return (
    <Container maxWidth="lg" padding="md">
      <Stack gap="lg">
        <header className={styles.header}>
          <div>
            <div className={styles.breadcrumb}>{tc.breadcrumb}</div>
            <h1 className={styles.title}>{tc.pageTitle}</h1>
            <p className={styles.subtitle}>{tc.pageSubtitle}</p>
          </div>
        </header>

        {/* Summary bar */}
        <div className={styles.summaryBar}>
          <span className={styles.summaryText}>{summary}</span>
        </div>

        {/* Section 1: Program Basics */}
        <SettingsSection title={tc.sections.basics} onSave={() => handleSave("basics")} saved={savedSection === "basics"} tc={tc}>
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label className={styles.label}>{tc.fields.programName}</label>
              <input
                className={styles.input}
                value={settings.programName}
                onChange={(e) => update("programName", e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{tc.fields.coinsCurrencyName}</label>
              <input
                className={styles.input}
                value={settings.coinsCurrencyName}
                onChange={(e) => update("coinsCurrencyName", e.target.value)}
              />
            </div>
          </div>
        </SettingsSection>

        {/* Section 2: Earning Rules */}
        <SettingsSection title={tc.sections.earning} onSave={() => handleSave("earning")} saved={savedSection === "earning"} tc={tc}>
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label className={styles.label}>{tc.fields.coinsPerUnit}</label>
              <input
                className={styles.input}
                type="number"
                min={0}
                value={settings.coinsPerUnit}
                onChange={(e) => update("coinsPerUnit", Number(e.target.value))}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{tc.fields.unitAmount}</label>
              <input
                className={styles.input}
                type="number"
                min={0}
                value={settings.unitAmount}
                onChange={(e) => update("unitAmount", Number(e.target.value))}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{tc.fields.minPurchase}</label>
              <input
                className={styles.input}
                type="number"
                min={0}
                value={settings.minPurchaseToEarn}
                onChange={(e) => update("minPurchaseToEarn", Number(e.target.value))}
              />
            </div>
          </div>
        </SettingsSection>

        {/* Section 3: Redemption Rules */}
        <SettingsSection title={tc.sections.redemption} onSave={() => handleSave("redemption")} saved={savedSection === "redemption"} tc={tc}>
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label className={styles.label}>{tc.fields.minRedeem}</label>
              <input
                className={styles.input}
                type="number"
                min={0}
                value={settings.minCoinsToRedeem}
                onChange={(e) => update("minCoinsToRedeem", Number(e.target.value))}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{tc.fields.coinsPerIls}</label>
              <input
                className={styles.input}
                type="number"
                min={0}
                value={settings.coinsPerCurrencyUnit}
                onChange={(e) => update("coinsPerCurrencyUnit", Number(e.target.value))}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{tc.fields.maxPct}</label>
              <input
                className={styles.input}
                type="number"
                min={0}
                max={100}
                value={settings.maxRedemptionPct}
                onChange={(e) => update("maxRedemptionPct", Number(e.target.value))}
              />
            </div>
          </div>
        </SettingsSection>

        {/* Section 4: Expiry Rules */}
        <SettingsSection title={tc.sections.expiry} onSave={() => handleSave("expiry")} saved={savedSection === "expiry"} tc={tc}>
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label className={styles.label}>{tc.fields.expiryToggle}</label>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={settings.expiryEnabled}
                  onChange={(e) => update("expiryEnabled", e.target.checked)}
                />
                <span className={styles.toggleLabel}>{settings.expiryEnabled ? "On" : "Off"}</span>
              </label>
            </div>
            {settings.expiryEnabled && (
              <>
                <div className={styles.field}>
                  <label className={styles.label}>{tc.fields.expiryMonths}</label>
                  <input
                    className={styles.input}
                    type="number"
                    min={1}
                    value={settings.expiryMonths}
                    onChange={(e) => update("expiryMonths", Number(e.target.value))}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>{tc.fields.expiryWarning}</label>
                  <input
                    className={styles.input}
                    type="number"
                    min={0}
                    value={settings.expiryWarningDays}
                    onChange={(e) => update("expiryWarningDays", Number(e.target.value))}
                  />
                </div>
              </>
            )}
          </div>
        </SettingsSection>

        {/* Section 5: Tier Rules */}
        <SettingsSection title={tc.sections.tiers} onSave={() => handleSave("tiers")} saved={savedSection === "tiers"} tc={tc}>
          <div className={styles.tierToggle}>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={settings.tiersEnabled}
                onChange={(e) => update("tiersEnabled", e.target.checked)}
              />
              <span className={styles.toggleLabel}>{tc.fields.tiersToggle}</span>
            </label>
          </div>
          {settings.tiersEnabled && (
            <>
              <table className={styles.tierTable}>
                <thead>
                  <tr>
                    <th>{tc.tiers.name}</th>
                    <th>{tc.tiers.nameAr}</th>
                    <th>{tc.tiers.minCoins}</th>
                    <th>{tc.tiers.multiplier}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {settings.tiers.map((tier) => (
                    <tr key={tier.id}>
                      <td>
                        <input
                          className={styles.tierInput}
                          value={tier.name}
                          onChange={(e) => updateTier(tier.id, "name", e.target.value)}
                          placeholder="e.g. Gold"
                        />
                      </td>
                      <td>
                        <input
                          className={styles.tierInput}
                          value={tier.nameAr}
                          onChange={(e) => updateTier(tier.id, "nameAr", e.target.value)}
                          placeholder="e.g. ذهب"
                          dir="rtl"
                        />
                      </td>
                      <td>
                        <input
                          className={`${styles.tierInput} ${styles.tierInputNum}`}
                          type="number"
                          min={0}
                          value={tier.minCoins}
                          onChange={(e) => updateTier(tier.id, "minCoins", Number(e.target.value))}
                        />
                      </td>
                      <td>
                        <input
                          className={`${styles.tierInput} ${styles.tierInputNum}`}
                          type="number"
                          min={1}
                          step={0.1}
                          value={tier.multiplier}
                          onChange={(e) => updateTier(tier.id, "multiplier", Number(e.target.value))}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className={styles.removeTierBtn}
                          onClick={() => removeTier(tier.id)}
                          aria-label={tc.tiers.removeTier}
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className={styles.addTierRow}>
                <Button variant="ghost" size="sm" leftIcon={<Plus size={12} />} onClick={addTier}>
                  {tc.tiers.addTier}
                </Button>
              </div>
            </>
          )}
        </SettingsSection>
      </Stack>
    </Container>
  );
}

function SettingsSection({
  title,
  children,
  onSave,
  saved,
  tc,
}: {
  title: string;
  children: React.ReactNode;
  onSave: () => void;
  saved: boolean;
  tc: { save: string; saved: string };
}) {
  return (
    <section className={styles.settingsSection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        <button type="button" className={styles.saveBtn} onClick={onSave}>
          {saved ? tc.saved : tc.save}
        </button>
      </div>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}
