import { useMemo, useRef, useState } from "react";
import "./CompanySettings.css";
import { Building2, ChevronDown, Info, RefreshCw, Trash2, Upload } from "lucide-react";
import { Button } from "../components/ui/Button";
import { useSettings } from "../context/SettingsContext";
import { useCompanySettings } from "../context/CompanySettingsContext";
import { BUSINESS_TYPES, PALESTINIAN_BANKS, PALESTINIAN_GOVERNORATES } from "../config/palestineConfig";
import type { CompanySettings } from "../types/companySettings";

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`cs-toggle ${checked ? "on" : ""}`}
      onClick={() => onChange(!checked)}
    />
  );
}

function SectionCard({
  title, children, onSave, savedFlag,
}: {
  title: string;
  children: React.ReactNode;
  onSave: () => void;
  savedFlag: boolean;
}) {
  const { t } = useSettings();
  return (
    <div className="cs-section-card">
      <div className="cs-section-head">
        <h2 className="cs-section-title">{title}</h2>
        <Button variant="primary" size="sm" onClick={onSave}>
          {savedFlag ? "✓ " : ""}{t.companySettings.save}
        </Button>
      </div>
      <div className="cs-section-body">{children}</div>
      {savedFlag && <div className="cs-saved-banner">{t.companySettings.saved}</div>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CompanySettings() {
  const { t, isArabic } = useSettings();
  const { settings, updateSettings } = useCompanySettings();
  const tc = t.companySettings;

  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  function markSaved(key: string) {
    setSaved((p) => ({ ...p, [key]: true }));
    window.setTimeout(() => setSaved((p) => ({ ...p, [key]: false })), 2500);
  }

  // ── Section state ──────────────────────────────────────────────────────────
  const [identity, setIdentity] = useState({
    nameAr: settings.nameAr,
    nameEn: settings.nameEn,
    taglineAr: settings.taglineAr ?? "",
    taglineEn: settings.taglineEn ?? "",
    logoBase64: settings.logoBase64 ?? "",
  });

  const [legal, setLegal] = useState({
    commercialRegNumber: settings.commercialRegNumber,
    taxId: settings.taxId,
    businessType: settings.businessType,
    licenseNumber: settings.licenseNumber ?? "",
    licenseExpiry: settings.licenseExpiry ?? "",
  });

  const [contact, setContact] = useState({
    governorate: settings.governorate,
    city: settings.city,
    streetAddress: settings.streetAddress,
    phone: settings.phone,
    phone2: settings.phone2 ?? "",
    email: settings.email,
    website: settings.website ?? "",
  });

  const [financial, setFinancial] = useState({
    defaultCurrency: settings.defaultCurrency,
    defaultTaxRate: settings.defaultTaxRate,
    taxExempt: settings.taxExempt,
    fiscalYearStart: settings.fiscalYearStart,
    exchangeRates: { ...settings.exchangeRates },
  });

  const [bank, setBank] = useState({
    bankName: settings.bankName ?? "",
    iban: settings.iban ?? "",
    accountNumber: settings.accountNumber ?? "",
    swiftCode: settings.swiftCode ?? "",
  });

  const [invoicing, setInvoicing] = useState({
    invoicePrefix: settings.invoicePrefix,
    invoiceStartNumber: settings.invoiceStartNumber,
    invoiceFooterAr: settings.invoiceFooterAr ?? "",
    invoiceNotesAr: settings.invoiceNotesAr ?? "",
    showTaxOnInvoice: settings.showTaxOnInvoice,
  });

  const [pos, setPos] = useState({
    receiptHeaderAr: settings.receiptHeaderAr ?? "",
    receiptFooterAr: settings.receiptFooterAr ?? "",
    showLogoOnReceipt: settings.showLogoOnReceipt,
  });

  const [sys, setSys] = useState({
    numberFormat: settings.numberFormat,
    dateFormat: settings.dateFormat,
    timezone: settings.timezone,
  });

  // ── Logo upload ────────────────────────────────────────────────────────────
  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      setIdentity((prev) => ({ ...prev, logoBase64: b64 }));
    };
    reader.readAsDataURL(file);
  }

  // ── License expiry warning ─────────────────────────────────────────────────
  const licenseWarningDays = useMemo(() => {
    if (!legal.licenseExpiry) return null;
    const diff = Math.floor((new Date(legal.licenseExpiry).getTime() - new Date().getTime()) / 86_400_000);
    return diff >= 0 && diff <= 30 ? diff : null;
  }, [legal.licenseExpiry]);

  // ── Tax rate warning ───────────────────────────────────────────────────────
  const showTaxWarning = financial.defaultTaxRate !== 16;

  return (
    <div className="cs-page">
      <header className="cs-header">
        <div>
          <h1>{tc.pageTitle}</h1>
          <p>{tc.pageSubtitle}</p>
        </div>
        <Building2 size={28} color="#2563eb" />
      </header>

      {/* SECTION 1 — Identity */}
      <SectionCard title={tc.sections.identity} savedFlag={!!saved.identity} onSave={() => { updateSettings({ nameAr: identity.nameAr, nameEn: identity.nameEn, taglineAr: identity.taglineAr, taglineEn: identity.taglineEn, logoBase64: identity.logoBase64 || undefined }); markSaved("identity"); }}>
        <div className="cs-grid">
          <div className="cs-field">
            <label>{tc.fields.nameAr} <span className="cs-req">*</span></label>
            <input className="modal-input" value={identity.nameAr} onChange={(e) => setIdentity((p) => ({ ...p, nameAr: e.target.value }))} dir="rtl" />
          </div>
          <div className="cs-field">
            <label>{tc.fields.nameEn}</label>
            <input className="modal-input" value={identity.nameEn} onChange={(e) => setIdentity((p) => ({ ...p, nameEn: e.target.value }))} />
          </div>
          <div className="cs-field">
            <label>{tc.fields.taglineAr}</label>
            <input className="modal-input" value={identity.taglineAr} onChange={(e) => setIdentity((p) => ({ ...p, taglineAr: e.target.value }))} dir="rtl" />
          </div>
          <div className="cs-field">
            <label>{tc.fields.taglineEn}</label>
            <input className="modal-input" value={identity.taglineEn} onChange={(e) => setIdentity((p) => ({ ...p, taglineEn: e.target.value }))} />
          </div>
        </div>

        {/* Logo upload */}
        <div className="cs-logo-row">
          <div className="cs-logo-left">
            <p className="cs-label">{tc.fields.logo}</p>
            <div className="cs-logo-actions">
              <label className="cs-upload-btn">
                <Upload size={14} />
                {tc.fields.uploadLogo}
                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/svg+xml" style={{ display: "none" }} onChange={handleLogoUpload} />
              </label>
              {identity.logoBase64 && (
                <button type="button" className="cs-delete-logo-btn" onClick={() => setIdentity((p) => ({ ...p, logoBase64: "" }))}>
                  <Trash2 size={13} /> {tc.fields.deleteLogo}
                </button>
              )}
            </div>
          </div>
          {identity.logoBase64 && (
            <div className="cs-logo-preview-wrap">
              <img src={identity.logoBase64} alt="logo preview" className="cs-logo-img" />
            </div>
          )}
        </div>

        {/* Document preview */}
        <div className="cs-doc-preview">
          <p className="cs-preview-label"><Info size={12} /> {tc.fields.previewHint}</p>
          <div className="cs-doc-preview-card">
            {identity.logoBase64
              ? <img src={identity.logoBase64} alt="logo" className="cs-doc-logo" />
              : <div className="cs-doc-logo-placeholder">{(identity.nameAr || identity.nameEn || "?")[0]}</div>
            }
            <div>
              <strong dir="rtl">{identity.nameAr || "—"}</strong>
              {identity.taglineAr && <span dir="rtl">{identity.taglineAr}</span>}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* SECTION 2 — Legal */}
      <SectionCard title={tc.sections.legal} savedFlag={!!saved.legal} onSave={() => { updateSettings(legal as Partial<CompanySettings>); markSaved("legal"); }}>
        <div className="cs-info-banner"><Info size={14} /> {tc.fields.legalBanner}</div>
        <div className="cs-grid">
          <div className="cs-field">
            <label>{tc.fields.commercialRegNumber} <span className="cs-req">*</span></label>
            <input className="modal-input" value={legal.commercialRegNumber} onChange={(e) => setLegal((p) => ({ ...p, commercialRegNumber: e.target.value }))} />
          </div>
          <div className="cs-field">
            <label>{tc.fields.taxId} <span className="cs-req">*</span></label>
            <input className="modal-input" value={legal.taxId} onChange={(e) => setLegal((p) => ({ ...p, taxId: e.target.value }))} />
          </div>
          <div className="cs-field">
            <label>{tc.fields.businessType} <span className="cs-req">*</span></label>
            <div className="cs-select-wrap">
              <select className="modal-input" value={legal.businessType} onChange={(e) => setLegal((p) => ({ ...p, businessType: e.target.value }))}>
                {BUSINESS_TYPES.map((bt) => (
                  <option key={bt.value} value={bt.value}>{isArabic ? bt.labelAr : bt.labelEn}</option>
                ))}
              </select>
              <ChevronDown size={14} className="cs-select-icon" />
            </div>
          </div>
          <div className="cs-field">
            <label>{tc.fields.licenseNumber}</label>
            <input className="modal-input" value={legal.licenseNumber} onChange={(e) => setLegal((p) => ({ ...p, licenseNumber: e.target.value }))} />
          </div>
          <div className="cs-field">
            <label>{tc.fields.licenseExpiry}</label>
            <input className="modal-input" type="date" value={legal.licenseExpiry} onChange={(e) => setLegal((p) => ({ ...p, licenseExpiry: e.target.value }))} />
          </div>
        </div>
        {licenseWarningDays !== null && (
          <div className="cs-warning-banner">
            ⚠️ {tc.fields.licenseExpiryWarning.replace("{{days}}", String(licenseWarningDays))}
          </div>
        )}
      </SectionCard>

      {/* SECTION 3 — Contact */}
      <SectionCard title={tc.sections.contact} savedFlag={!!saved.contact} onSave={() => { updateSettings(contact as Partial<CompanySettings>); markSaved("contact"); }}>
        <div className="cs-grid">
          <div className="cs-field">
            <label>{tc.fields.governorate} <span className="cs-req">*</span></label>
            <div className="cs-select-wrap">
              <select className="modal-input" value={contact.governorate} onChange={(e) => setContact((p) => ({ ...p, governorate: e.target.value }))}>
                {PALESTINIAN_GOVERNORATES.map((g) => (
                  <option key={g.id} value={g.id}>{isArabic ? g.nameAr : g.nameEn}</option>
                ))}
              </select>
              <ChevronDown size={14} className="cs-select-icon" />
            </div>
          </div>
          <div className="cs-field">
            <label>{tc.fields.city} <span className="cs-req">*</span></label>
            <input className="modal-input" value={contact.city} onChange={(e) => setContact((p) => ({ ...p, city: e.target.value }))} />
          </div>
          <div className="cs-field cs-field-full">
            <label>{tc.fields.streetAddress} <span className="cs-req">*</span></label>
            <input className="modal-input" value={contact.streetAddress} onChange={(e) => setContact((p) => ({ ...p, streetAddress: e.target.value }))} dir="rtl" />
          </div>
          <div className="cs-field">
            <label>{tc.fields.phone} <span className="cs-req">*</span></label>
            <input className="modal-input" type="tel" value={contact.phone} onChange={(e) => setContact((p) => ({ ...p, phone: e.target.value }))} />
          </div>
          <div className="cs-field">
            <label>{tc.fields.phone2}</label>
            <input className="modal-input" type="tel" value={contact.phone2} onChange={(e) => setContact((p) => ({ ...p, phone2: e.target.value }))} />
          </div>
          <div className="cs-field">
            <label>{tc.fields.email} <span className="cs-req">*</span></label>
            <input className="modal-input" type="email" value={contact.email} onChange={(e) => setContact((p) => ({ ...p, email: e.target.value }))} />
          </div>
          <div className="cs-field">
            <label>{tc.fields.website}</label>
            <input className="modal-input" type="url" value={contact.website} onChange={(e) => setContact((p) => ({ ...p, website: e.target.value }))} />
          </div>
        </div>
      </SectionCard>

      {/* SECTION 4 — Financial */}
      <SectionCard title={tc.sections.financial} savedFlag={!!saved.financial} onSave={() => { updateSettings({ defaultCurrency: financial.defaultCurrency, defaultTaxRate: financial.defaultTaxRate, taxExempt: financial.taxExempt, fiscalYearStart: financial.fiscalYearStart, exchangeRates: financial.exchangeRates }); markSaved("financial"); }}>
        {/* Currency radio */}
        <div className="cs-field">
          <label>{tc.fields.defaultCurrency}</label>
          <div className="cs-currency-row">
            {(["ILS", "JOD", "USD"] as const).map((code) => (
              <button key={code} type="button"
                className={`cs-currency-card ${financial.defaultCurrency === code ? "selected" : ""}`}
                onClick={() => setFinancial((p) => ({ ...p, defaultCurrency: code }))}
              >
                <span className="cs-currency-symbol">
                  {code === "ILS" ? "₪" : code === "JOD" ? "د.أ" : "$"}
                </span>
                <span>{tc.currencies[code]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="cs-grid">
          <div className="cs-field">
            <label>{tc.fields.defaultTaxRate}</label>
            <input className="modal-input" type="number" min={0} max={100} step={0.5}
              value={financial.defaultTaxRate}
              onChange={(e) => setFinancial((p) => ({ ...p, defaultTaxRate: Number(e.target.value) }))} />
            {showTaxWarning && <p className="cs-field-hint warn">{tc.fields.taxRateWarning}</p>}
          </div>
          <div className="cs-field">
            <label>{tc.fields.fiscalYearStart}</label>
            <div className="cs-select-wrap">
              <select className="modal-input" value={financial.fiscalYearStart}
                onChange={(e) => setFinancial((p) => ({ ...p, fiscalYearStart: Number(e.target.value) }))}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>{tc.months[m as keyof typeof tc.months]}</option>
                ))}
              </select>
              <ChevronDown size={14} className="cs-select-icon" />
            </div>
          </div>
          <div className="cs-field cs-toggle-field">
            <label>{tc.fields.taxExempt}</label>
            <Toggle checked={financial.taxExempt} onChange={(v) => setFinancial((p) => ({ ...p, taxExempt: v }))} />
          </div>
        </div>

        {/* Exchange rates */}
        <div className="cs-exchange-section">
          <div className="cs-exchange-head">
            <span className="cs-sub-title">{tc.fields.exchangeRates}</span>
            <button type="button" className="cs-refresh-btn"
              onClick={() => setFinancial((p) => ({ ...p, exchangeRates: { ...p.exchangeRates, lastUpdated: new Date().toISOString().slice(0, 10) } }))}>
              <RefreshCw size={13} /> {tc.fields.updateNow}
            </button>
          </div>
          <p className="cs-exchange-updated">{tc.fields.lastUpdated}: {financial.exchangeRates.lastUpdated}</p>
          <div className="cs-grid">
            {(["ILS_TO_JOD", "ILS_TO_USD", "JOD_TO_USD"] as const).map((key) => (
              <div key={key} className="cs-field">
                <label>{tc.fields[key]}</label>
                <input className="modal-input" type="number" min={0} step={0.001}
                  value={financial.exchangeRates[key]}
                  onChange={(e) => setFinancial((p) => ({ ...p, exchangeRates: { ...p.exchangeRates, [key]: Number(e.target.value) } }))} />
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* SECTION 5 — Bank */}
      <SectionCard title={tc.sections.bank} savedFlag={!!saved.bank} onSave={() => { updateSettings(bank as Partial<CompanySettings>); markSaved("bank"); }}>
        <div className="cs-info-banner"><Info size={14} /> {tc.fields.bankNote}</div>
        <div className="cs-grid">
          <div className="cs-field">
            <label>{tc.fields.bankName}</label>
            <div className="cs-select-wrap">
              <select className="modal-input" value={bank.bankName}
                onChange={(e) => setBank((p) => ({ ...p, bankName: e.target.value }))}>
                <option value="">—</option>
                {PALESTINIAN_BANKS.map((b) => (
                  <option key={b.id} value={b.id}>{isArabic ? b.nameAr : b.nameEn}</option>
                ))}
              </select>
              <ChevronDown size={14} className="cs-select-icon" />
            </div>
          </div>
          <div className="cs-field">
            <label>{tc.fields.iban}</label>
            <input className="modal-input" value={bank.iban} onChange={(e) => setBank((p) => ({ ...p, iban: e.target.value }))} />
          </div>
          <div className="cs-field">
            <label>{tc.fields.accountNumber}</label>
            <input className="modal-input" value={bank.accountNumber} onChange={(e) => setBank((p) => ({ ...p, accountNumber: e.target.value }))} />
          </div>
          <div className="cs-field">
            <label>{tc.fields.swiftCode}</label>
            <input className="modal-input" value={bank.swiftCode} onChange={(e) => setBank((p) => ({ ...p, swiftCode: e.target.value }))} />
          </div>
        </div>
      </SectionCard>

      {/* SECTION 6 — Invoicing */}
      <SectionCard title={tc.sections.invoicing} savedFlag={!!saved.invoicing} onSave={() => { updateSettings(invoicing as Partial<CompanySettings>); markSaved("invoicing"); }}>
        <div className="cs-grid">
          <div className="cs-field">
            <label>{tc.fields.invoicePrefix}</label>
            <input className="modal-input" value={invoicing.invoicePrefix} dir="rtl"
              onChange={(e) => setInvoicing((p) => ({ ...p, invoicePrefix: e.target.value }))} />
          </div>
          <div className="cs-field">
            <label>{tc.fields.invoiceStartNumber}</label>
            <input className="modal-input" type="number" min={1}
              value={invoicing.invoiceStartNumber}
              onChange={(e) => setInvoicing((p) => ({ ...p, invoiceStartNumber: Number(e.target.value) }))} />
          </div>
          <div className="cs-field cs-field-full">
            <label>{tc.fields.invoiceFooterAr}</label>
            <textarea className="modal-input" rows={2} dir="rtl"
              value={invoicing.invoiceFooterAr}
              onChange={(e) => setInvoicing((p) => ({ ...p, invoiceFooterAr: e.target.value }))} />
          </div>
          <div className="cs-field cs-field-full">
            <label>{tc.fields.invoiceNotesAr}</label>
            <textarea className="modal-input" rows={2} dir="rtl"
              value={invoicing.invoiceNotesAr}
              onChange={(e) => setInvoicing((p) => ({ ...p, invoiceNotesAr: e.target.value }))} />
          </div>
          <div className="cs-field cs-toggle-field">
            <label>{tc.fields.showTaxOnInvoice}</label>
            <Toggle checked={invoicing.showTaxOnInvoice} onChange={(v) => setInvoicing((p) => ({ ...p, showTaxOnInvoice: v }))} />
          </div>
        </div>
        {/* Mini invoice preview */}
        <div className="cs-invoice-preview">
          <div className="cs-invoice-preview-row">
            <strong dir="rtl">{invoicing.invoicePrefix}-{String(invoicing.invoiceStartNumber).padStart(5, "0")}</strong>
          </div>
          {invoicing.invoiceFooterAr && <p dir="rtl" className="cs-invoice-footer-preview">{invoicing.invoiceFooterAr}</p>}
        </div>
      </SectionCard>

      {/* SECTION 7 — POS */}
      <SectionCard title={tc.sections.pos} savedFlag={!!saved.pos} onSave={() => { updateSettings(pos as Partial<CompanySettings>); markSaved("pos"); }}>
        <div className="cs-grid">
          <div className="cs-field cs-field-full">
            <label>{tc.fields.receiptHeaderAr}</label>
            <textarea className="modal-input" rows={2} dir="rtl"
              value={pos.receiptHeaderAr}
              onChange={(e) => setPos((p) => ({ ...p, receiptHeaderAr: e.target.value }))} />
          </div>
          <div className="cs-field cs-field-full">
            <label>{tc.fields.receiptFooterAr}</label>
            <textarea className="modal-input" rows={2} dir="rtl"
              value={pos.receiptFooterAr}
              onChange={(e) => setPos((p) => ({ ...p, receiptFooterAr: e.target.value }))} />
          </div>
          <div className="cs-field cs-toggle-field">
            <label>{tc.fields.showLogoOnReceipt}</label>
            <Toggle checked={pos.showLogoOnReceipt} onChange={(v) => setPos((p) => ({ ...p, showLogoOnReceipt: v }))} />
          </div>
        </div>
        {/* Mini receipt preview */}
        <div className="cs-receipt-preview">
          {pos.showLogoOnReceipt && identity.logoBase64 && (
            <img src={identity.logoBase64} alt="logo" className="cs-receipt-logo" />
          )}
          {pos.receiptHeaderAr && <p dir="rtl">{pos.receiptHeaderAr}</p>}
          <div className="cs-receipt-divider" />
          <p className="cs-receipt-items">— — — — — — — — — —</p>
          <div className="cs-receipt-divider" />
          {pos.receiptFooterAr && <p dir="rtl" className="cs-receipt-footer">{pos.receiptFooterAr}</p>}
        </div>
      </SectionCard>

      {/* SECTION 8 — System */}
      <SectionCard title={tc.sections.system} savedFlag={!!saved.system} onSave={() => { updateSettings(sys as Partial<CompanySettings>); markSaved("system"); }}>
        <div className="cs-grid">
          <div className="cs-field">
            <label>{tc.fields.numberFormat}</label>
            <div className="cs-radio-group">
              <label className={`cs-radio-card ${sys.numberFormat === "eastern" ? "selected" : ""}`}>
                <input type="radio" name="numfmt" value="eastern" checked={sys.numberFormat === "eastern"}
                  onChange={() => setSys((p) => ({ ...p, numberFormat: "eastern" }))} />
                {tc.fields.numberFormatEastern}
              </label>
              <label className={`cs-radio-card ${sys.numberFormat === "western" ? "selected" : ""}`}>
                <input type="radio" name="numfmt" value="western" checked={sys.numberFormat === "western"}
                  onChange={() => setSys((p) => ({ ...p, numberFormat: "western" }))} />
                {tc.fields.numberFormatWestern}
              </label>
            </div>
          </div>
          <div className="cs-field">
            <label>{tc.fields.dateFormat}</label>
            <div className="cs-radio-group">
              {(["DD/MM/YYYY", "YYYY-MM-DD"] as const).map((fmt) => (
                <label key={fmt} className={`cs-radio-card ${sys.dateFormat === fmt ? "selected" : ""}`}>
                  <input type="radio" name="datefmt" value={fmt} checked={sys.dateFormat === fmt}
                    onChange={() => setSys((p) => ({ ...p, dateFormat: fmt }))} />
                  {fmt}
                </label>
              ))}
            </div>
          </div>
          <div className="cs-field">
            <label>{tc.fields.timezone}</label>
            <div className="cs-select-wrap">
              <select className="modal-input" value={sys.timezone}
                onChange={(e) => setSys((p) => ({ ...p, timezone: e.target.value }))}>
                <option value="Asia/Hebron">Asia/Hebron (Palestine)</option>
                <option value="Asia/Jerusalem">Asia/Jerusalem</option>
                <option value="Asia/Amman">Asia/Amman (Jordan)</option>
                <option value="Africa/Cairo">Africa/Cairo (Egypt)</option>
                <option value="UTC">UTC</option>
              </select>
              <ChevronDown size={14} className="cs-select-icon" />
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
