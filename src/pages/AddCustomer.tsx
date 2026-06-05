import { createPortal } from "react-dom";
import { useEffect, useRef, useState, useCallback } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useData } from "../context/DataContext";
import { useSettings } from "../context/SettingsContext";
import type { Customer } from "../data/types";
import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  Building2,
  RefreshCw,
  Save,
  User as UserIcon,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { PhoneInput } from "../components/ui/PhoneInput";
import { Select } from "../components/ui/Select";
import { Container } from "../components/layout/Container";
import { FormSection } from "../components/forms/FormSection";
import { RadioCardGroup } from "../components/forms/RadioCardGroup";
import {
  SALES_REPS,
  type CustomerType,
  type Currency,
} from "../data/customersMock";
import { PALESTINIAN_GOVERNORATES } from "../config/palestineConfig";
import { validatePhone } from "../utils/phoneValidation";
import { translations } from "../i18n/translations";
import { formatTimeValue } from "../utils/displayFormatters";
import styles from "./AddCustomer.module.css";

interface FormState {
  name: string;
  type: CustomerType;
  code: string;
  taxId: string;
  phonePrimary: string;
  phoneSecondary: string;
  email: string;
  governorate: string;
  city: string;
  currency: Currency;
  creditLimit: string;
  salesRep: string;
  classification: "standard" | "vip" | "risk";
  defaultDiscount: string;
  alerts: string[];
}

const INITIAL: FormState = {
  name: "",
  type: "company",
  code: "",
  taxId: "",
  phonePrimary: "",
  phoneSecondary: "",
  email: "",
  governorate: "",
  city: "",
  currency: "ILS",
  creditLimit: "",
  salesRep: SALES_REPS[0],
  classification: "standard",
  defaultDiscount: "",
  alerts: [],
};

const REQUIRED_KEYS: Array<keyof FormState> = [
  "name", "type", "code", "phonePrimary", "governorate",
];

function generateCustomerId(customers: Customer[]): string {
  const max = customers.reduce((m, c) => {
    const nums = [c.id ?? "", c.code ?? ""].map((s) => {
      const match = String(s).match(/(\d+)$/);
      return match ? Number(match[1]) : 0;
    });
    return Math.max(m, ...nums);
  }, 1000);
  return `CUST-${max + 1}`;
}

function blockNonDigits(e: ReactKeyboardEvent<HTMLInputElement>) {
  if (e.ctrlKey || e.metaKey) return;
  const allowed = ["0","1","2","3","4","5","6","7","8","9","Backspace","Delete","Tab","ArrowLeft","ArrowRight","Home","End"];
  if (!allowed.includes(e.key)) e.preventDefault();
}

export default function AddCustomer() {
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id: string }>();
  const isEditMode = !!editId;
  const { addCustomer, updateCustomer, customers } = useData();
  const { t } = useSettings();

  const existingCustomer = isEditMode
    ? customers.find((c) => (c.id === editId || c.code === editId) && !c.isDeleted) ?? null
    : null;

  // Redirect to list if edit ID was given but customer doesn't exist
  useEffect(() => {
    if (isEditMode && !existingCustomer) {
      navigate("/customers", { replace: true });
    }
  }, [isEditMode, existingCustomer, navigate]);

  const [form, setForm] = useState<FormState>(() => {
    if (existingCustomer) {
      return {
        name: existingCustomer.name,
        type: (existingCustomer.type as FormState["type"]) ?? "company",
        code: existingCustomer.code ?? existingCustomer.id,
        taxId: existingCustomer.taxId ?? "",
        phonePrimary: existingCustomer.phone,
        phoneSecondary: "",
        email: existingCustomer.email ?? "",
        governorate: existingCustomer.governorate ?? "",
        city: existingCustomer.city ?? "",
        currency: (existingCustomer.currency as FormState["currency"]) ?? "ILS",
        creditLimit: existingCustomer.creditLimit != null ? String(existingCustomer.creditLimit) : "",
        salesRep: existingCustomer.salesRep ?? SALES_REPS[0],
        classification: (existingCustomer.classification as FormState["classification"]) ?? "standard",
        defaultDiscount: "",
        alerts: existingCustomer.alerts ?? [],
      };
    }
    return { ...INITIAL, code: generateCustomerId(customers) };
  });
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const autosaveRef = useRef<number | null>(null);
  const [phoneErrors, setPhoneErrors] = useState<{ primary?: string; secondary?: string }>({});

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // Autosave for create mode only
  useEffect(() => {
    if (isEditMode) return;
    if (autosaveRef.current) window.clearTimeout(autosaveRef.current);
    autosaveRef.current = window.setTimeout(() => {
      try {
        window.localStorage.setItem("atlas-customer-draft", JSON.stringify(form));
        setSavedAt(new Date());
      } catch { /* ignore quota */ }
    }, 800);
    return () => { if (autosaveRef.current) window.clearTimeout(autosaveRef.current); };
  }, [form, isEditMode]);

  // Cmd/Ctrl+S to save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        setSavedAt(new Date());
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Section completeness flags
  const sec1Complete = !!form.name && !!form.code && !!form.type;
  const sec2Complete = !!form.phonePrimary;
  const sec3Complete = !!form.governorate;

  const [showExitWarning, setShowExitWarning] = useState(false);

  const isDirty = useCallback(() => {
    return Object.keys(form).some((key) => {
      const k = key as keyof FormState;
      const v = form[k];
      const initial = (INITIAL[k] ?? "") as typeof v;
      if (Array.isArray(v) && Array.isArray(initial)) return v.length !== initial.length || v.some((item, i) => item !== initial[i]);
      return v !== initial;
    });
  }, [form]);

  const missing = REQUIRED_KEYS.filter((k) => {
    const v = form[k];
    return Array.isArray(v) ? v.length === 0 : !v;
  });
  const canSave = missing.length === 0;

  function handleSave() {
    if (!canSave) return;

    // Validate phone fields before submitting
    const primaryResult = validatePhone(form.phonePrimary);
    const secondaryResult = form.phoneSecondary ? validatePhone(form.phoneSecondary) : null;
    const errors: typeof phoneErrors = {};
    if (!primaryResult.valid) errors.primary = primaryResult.error;
    if (secondaryResult && !secondaryResult.valid) errors.secondary = secondaryResult.error;
    if (errors.primary || errors.secondary) {
      setPhoneErrors(errors);
      return;
    }
    setPhoneErrors({});

    const today = new Date().toISOString().split("T")[0];

    if (isEditMode && existingCustomer) {
      const updated: Customer = {
        ...existingCustomer,
        name: form.name.trim(),
        phone: form.phonePrimary.trim(),
        email: form.email.trim() || undefined,
        taxId: form.taxId.trim() || undefined,
        type: form.type,
        classification: form.classification,
        governorate: form.governorate,
        city: form.city,
        currency: form.currency,
        creditLimit: form.creditLimit ? Number(form.creditLimit) : undefined,
        salesRep: form.salesRep || undefined,
        alerts: form.alerts.length > 0 ? [...form.alerts] : [],
      };
      updateCustomer(updated);
      navigate("/customers");
      return;
    }

    const id = form.code;
    const newCustomer: Customer = {
      id,
      name: form.name.trim(),
      phone: form.phonePrimary.trim(),
      email: form.email.trim() || undefined,
      code: id,
      taxId: form.taxId.trim() || undefined,
      type: form.type,
      classification: form.classification,
      governorate: form.governorate,
      city: form.city,
      address: undefined,
      currency: form.currency,
      creditLimit: form.creditLimit ? Number(form.creditLimit) : undefined,
      salesRep: form.salesRep || undefined,
      alerts: form.alerts.length > 0 ? [...form.alerts] : [],
      joinedAt: today,
      lastOrderDate: today,
      outstandingBalance: 0,
      status: "active",
      isDeleted: false,
    };
    addCustomer(newCustomer);
    try { window.localStorage.removeItem("atlas-customer-draft"); } catch { /* ignore if unavailable */ }
    navigate("/customers");
  }

  return (
    <Container maxWidth="full" padding="md">
      <header className={styles.pageHeader}>
        <div>
          <button type="button" className={styles.backLink} onClick={() => navigate("/customers")}>
            <ArrowLeft size={14} /> {t.addCustomer.backLink}
          </button>
          <p className={styles.subtitle}>
            {isEditMode ? (existingCustomer?.name ?? "") : t.addCustomer.pageSubtitle}
          </p>
        </div>
      </header>

      <div className={styles.layout}>
        <div className={styles.formCol}>
          <FormSection
            number={1}
            title={t.addCustomer.sections.basic.title}
            subtitle={t.addCustomer.sections.basic.subtitle}
            progress={sec1Complete ? "3 / 3 ✓" : `${[form.name, form.type, form.code].filter(Boolean).length} / 3`}
            isComplete={sec1Complete}
          >
            <Input
              label={t.addCustomer.fields.name}
              required
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder={t.addCustomer.fields.namePlaceholder}
              error={!form.name ? undefined : form.name.trim().length < 3 ? t.addCustomer.fields.nameError : undefined}
            />

            <RadioCardGroup<CustomerType>
              label={t.addCustomer.fields.customerType}
              value={form.type}
              onChange={(v) => update("type", v)}
              options={[
                { value: "individual",  label: t.addCustomer.fields.typeIndividual,   description: t.addCustomer.fields.typeIndividualDesc,  icon: UserIcon },
                { value: "company",     label: t.addCustomer.fields.typeCompany,      description: t.addCustomer.fields.typeCompanyDesc,      icon: Building2 },
                { value: "institution", label: t.addCustomer.fields.typeInstitution,  description: t.addCustomer.fields.typeInstitutionDesc,  icon: Briefcase },
              ]}
            />

            <div className={styles.row2}>
              <div className={styles.codeField}>
                <Input
                  label={t.addCustomer.fields.code}
                  required
                  value={form.code}
                  readOnly
                  hint={t.addCustomer.fields.codeHint}
                />
                <button
                  type="button"
                  className={styles.refreshBtn}
                  onClick={() => update("code", generateCustomerId(customers))}
                  aria-label={t.addCustomer.fields.codeRefresh}
                  title={t.addCustomer.fields.codeRefresh}
                >
                  <RefreshCw size={13} />
                </button>
              </div>
              <Input
                label={t.addCustomer.fields.taxId}
                value={form.taxId}
                onKeyDown={blockNonDigits}
                onChange={(e) => update("taxId", e.target.value.replace(/[^\d]/g, "").slice(0, 9))}
                placeholder={t.addCustomer.fields.taxIdPlaceholder}
                hint={t.addCustomer.fields.taxIdHint}
              />
            </div>
          </FormSection>

          <FormSection
            number={2}
            title={t.addCustomer.sections.contact.title}
            subtitle={t.addCustomer.sections.contact.subtitle}
            progress={sec2Complete ? t.addCustomer.sections.address.done : t.addCustomer.sections.contact.progress}
            isComplete={sec2Complete}
          >
            <PhoneInput
              label={t.addCustomer.fields.phonePrimary}
              required
              value={form.phonePrimary}
              onChange={(digits) => { update("phonePrimary", digits); setPhoneErrors((p) => ({ ...p, primary: undefined })); }}
              error={phoneErrors.primary}
            />
            <PhoneInput
              label={t.addCustomer.fields.phoneSecondary}
              value={form.phoneSecondary}
              onChange={(digits) => { update("phoneSecondary", digits); setPhoneErrors((p) => ({ ...p, secondary: undefined })); }}
              error={phoneErrors.secondary}
            />
            <Input
              label={t.addCustomer.fields.email}
              variant="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder={t.addCustomer.fields.emailPlaceholder}
              error={form.email && !/.+@.+\..+/.test(form.email) ? t.addCustomer.fields.emailError : undefined}
            />
          </FormSection>

          <FormSection
            number={3}
            title={t.addCustomer.sections.address.title}
            subtitle={t.addCustomer.sections.address.subtitle}
            progress={sec3Complete ? t.addCustomer.sections.address.done : t.addCustomer.sections.address.progress}
            isComplete={sec3Complete}
          >
            <div className={styles.row2}>
              <Select
                label={t.addCustomer.fields.governorate}
                required
                value={form.governorate}
                onChange={(e) => update("governorate", e.target.value)}
                placeholder={t.addCustomer.fields.governoratePlaceholder}
                options={PALESTINIAN_GOVERNORATES.map((g) => ({ value: g.id, label: g.nameAr }))}
                fullWidth
              />
              <Input
                label={t.addCustomer.fields.city}
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
                placeholder="مثال: بيتا، حوارة، رافات..."
              />
            </div>
          </FormSection>
        </div>
      </div>

      {/* Save bar */}
      <div className={styles.saveBar}>
        <div className={styles.saveBarStart}>
          <span className={`status-dot status-dot--${savedAt ? "green" : "gray"}`} aria-hidden />
          <span className={styles.autosaveText}>
            {savedAt ? `${t.addCustomer.autosaveSaved} (${timeAgo(savedAt, t)})` : t.addCustomer.autosaveUnsaved}
          </span>
        </div>
        <div className={styles.saveBarEnd}>
          <Button variant="secondary" size="sm" onClick={() => { if (isDirty()) setShowExitWarning(true); else navigate("/customers"); }}>{t.addCustomer.cancel}</Button>
          <Button variant="secondary" size="sm" onClick={() => navigate("/customers")}>حفظ كمسودة</Button>
          <Button variant="primary" size="sm" leftIcon={<Save size={13} />} disabled={!canSave} onClick={handleSave}>
            {isEditMode ? t.common.saveChanges : t.addCustomer.saveCustomer}
          </Button>
        </div>
      </div>

      {showExitWarning && createPortal(
        <div
          style={{ position: "fixed", inset: 0, zIndex: 1200, background: "rgba(15,23,42,0.48)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 18 }}
          onClick={() => setShowExitWarning(false)}
        >
          <div
            style={{ width: "min(420px, 92vw)", background: "var(--app-surface-1)", borderRadius: "var(--app-radius-xl)", boxShadow: "var(--app-shadow-xl)", padding: "var(--app-space-6)", direction: "rtl" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--app-space-3)" }}>
              <div style={{ width: 40, height: 40, borderRadius: "var(--app-radius-md)", background: "#FEF3C7", color: "#D97706", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--app-text-primary)" }}>تغييرات غير محفوظة</h3>
                <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--app-text-muted)", lineHeight: 1.6 }}>
                  هل أنت متأكد من المغادرة؟ سيتم فقدان أي بيانات لم يتم حفظها.
                </p>
              </div>
            </div>
            <div style={{ height: 1, background: "var(--app-border)", margin: "var(--app-space-4) 0" }} />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--app-space-2)" }}>
              <button
                type="button"
                onClick={() => setShowExitWarning(false)}
                style={{ border: "1.5px solid var(--app-border)", background: "var(--app-surface-1)", color: "var(--app-text-secondary)", font: "inherit", fontSize: 13, fontWeight: 600, padding: "8px 18px", borderRadius: "var(--app-radius-md)", cursor: "pointer" }}
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={() => { setShowExitWarning(false); navigate("/customers"); }}
                style={{ border: "none", background: "#EF4444", color: "#fff", font: "inherit", fontSize: 13, fontWeight: 700, padding: "8px 18px", borderRadius: "var(--app-radius-md)", cursor: "pointer" }}
              >
                مغادرة بدون حفظ
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </Container>
  );
}

function timeAgo(d: Date, t: typeof translations.en): string {
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 5) return t.addCustomer.timeAgo.now;
  if (sec < 60) return `${sec}${t.addCustomer.timeAgo.seconds}`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}${t.addCustomer.timeAgo.minutes}`;
  return formatTimeValue(d);
}
