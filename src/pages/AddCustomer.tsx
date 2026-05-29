import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useData } from "../context/DataContext";
import { useSettings } from "../context/SettingsContext";
import type { Customer } from "../data/types";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CheckCircle2,
  Crown,
  RefreshCw,
  Save,
  User as UserIcon,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { PhoneInput } from "../components/ui/PhoneInput";
import { Select } from "../components/ui/Select";
import { Badge } from "../components/ui/Badge";
import { Container } from "../components/layout/Container";
import { FormSection } from "../components/forms/FormSection";
import { ButtonGroup } from "../components/forms/ButtonGroup";
import { RadioCardGroup } from "../components/forms/RadioCardGroup";
import { TagInput } from "../components/forms/TagInput";
import {
  SALES_REPS,
  type CustomerClassification,
  type CustomerType,
  type Currency,
  type PaymentTerms,
} from "../data/customersMock";
import { PALESTINIAN_GOVERNORATES } from "../config/palestineConfig";
import { validatePhone } from "../utils/phoneValidation";
import { translations } from "../i18n/translations";
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
  paymentTerms: PaymentTerms;
  currency: Currency;
  creditLimit: string;
  salesRep: string;
  classification: CustomerClassification;
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
  paymentTerms: "net30",
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

function blockNonDecimal(e: ReactKeyboardEvent<HTMLInputElement>) {
  if (e.ctrlKey || e.metaKey) return;
  const allowed = ["0","1","2","3","4","5","6","7","8","9",".","Backspace","Delete","Tab","ArrowLeft","ArrowRight","Home","End"];
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
        paymentTerms: (existingCustomer.paymentTerms as FormState["paymentTerms"]) ?? "net30",
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

  const completion = useMemo(() => {
    const TOTAL_FIELDS = 15;
    const filled = (Object.keys(form) as Array<keyof FormState>).reduce((sum, k) => {
      const v = form[k];
      if (Array.isArray(v)) return sum + (v.length > 0 ? 1 : 0);
      if (typeof v === "string") return sum + (v.trim() ? 1 : 0);
      return sum;
    }, 0);
    return { filled, total: TOTAL_FIELDS, pct: Math.round((filled / TOTAL_FIELDS) * 100) };
  }, [form]);

  // Section completeness flags (drive the green ✓ on FormSection)
  const sec1Complete = !!form.name && !!form.code && !!form.type;
  const sec2Complete = !!form.phonePrimary;
  const sec3Complete = !!form.governorate;
  const sec4Complete = !!form.paymentTerms && !!form.currency;

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
        paymentTerms: form.paymentTerms,
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
      paymentTerms: form.paymentTerms,
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
          <h1 className={styles.title}>
            {isEditMode ? t.common.edit : t.addCustomer.pageTitle}
          </h1>
          <p className={styles.subtitle}>
            {isEditMode ? (existingCustomer?.name ?? "") : t.addCustomer.pageSubtitle}
          </p>
        </div>
      </header>

      <div className={styles.layout}>
        {/* ─── Left: Form ─── */}
        <div className={styles.formCol}>
          <FormSection
            number={1}
            title={t.addCustomer.sections.basic.title}
            subtitle={t.addCustomer.sections.basic.subtitle}
            progress={sec1Complete ? "4 / 4 ✓" : `${[form.name, form.type, form.code, form.taxId].filter(Boolean).length} / 4`}
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
                error={form.taxId && form.taxId.length !== 9 ? t.addCustomer.fields.taxIdError : undefined}
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

          <FormSection
            number={4}
            title={t.addCustomer.sections.commercial.title}
            subtitle={t.addCustomer.sections.commercial.subtitle}
            isComplete={sec4Complete}
          >
            <ButtonGroup<PaymentTerms>
              label={t.addCustomer.fields.paymentTerms}
              value={form.paymentTerms}
              onChange={(v) => update("paymentTerms", v)}
              options={[
                { value: "cash",  label: t.addCustomer.fields.termCash },
                { value: "net30", label: t.addCustomer.fields.termNet30 },
                { value: "net60", label: t.addCustomer.fields.termNet60 },
                { value: "net90", label: t.addCustomer.fields.termNet90 },
              ]}
            />
            <ButtonGroup<Currency>
              label={t.addCustomer.fields.currency}
              value={form.currency}
              onChange={(v) => update("currency", v)}
              options={[
                { value: "ILS", label: "₪ ILS" },
                { value: "USD", label: "$ USD" },
                { value: "JOD", label: "د.أ JOD" },
              ]}
            />
            <Input
              label={t.addCustomer.fields.creditLimit}
              variant="number"
              value={form.creditLimit}
              onKeyDown={blockNonDecimal}
              onChange={(e) => update("creditLimit", e.target.value.replace(/[^\d.]/g, "").replace(/(\.\d{2})\d+/, "$1"))}
              placeholder="0"
              hint={`${t.addCustomer.fields.creditLimitHint} (${form.currency})`}
            />
          </FormSection>

          <FormSection
            number={5}
            title={t.addCustomer.sections.advanced.title}
            subtitle={t.addCustomer.sections.advanced.subtitle}
            collapsible
            defaultCollapsed
          >
            <Input
              label={t.addCustomer.fields.salesRep}
              value={form.salesRep}
              onChange={(e) => update("salesRep", e.target.value)}
              hint={t.addCustomer.fields.salesRepHint}
            />
            <ButtonGroup<CustomerClassification>
              label={t.addCustomer.fields.classification}
              value={form.classification}
              onChange={(v) => update("classification", v)}
              options={[
                { value: "standard", label: t.addCustomer.fields.classificationStandard },
                { value: "vip",      label: "VIP" },
                { value: "risk",     label: t.addCustomer.fields.classificationRisk },
              ]}
            />
            <Input
              label={t.addCustomer.fields.defaultDiscount}
              variant="number"
              value={form.defaultDiscount}
              onKeyDown={blockNonDigits}
              onChange={(e) => {
                const v = e.target.value.replace(/[^\d]/g, "").slice(0, 3);
                update("defaultDiscount", Number(v) > 100 ? "100" : v);
              }}
              placeholder="0"
              hint={t.addCustomer.fields.defaultDiscountHint}
            />
            <TagInput
              label={t.addCustomer.fields.alerts}
              value={form.alerts}
              onChange={(v) => update("alerts", v)}
              hint={t.addCustomer.fields.alertsHint}
              suggestions={["High balance", "Overdue", "Credit warning", "New account"]}
            />
          </FormSection>
        </div>

        {/* ─── Right: Live Preview ─── */}
        <aside className={styles.previewCol}>
          <CustomerPreviewCard form={form} completion={completion} />
        </aside>
      </div>

      {/* Floating save bar */}
      <div className={styles.saveBar}>
        <span className={styles.autosave}>
          <span className={`status-dot status-dot--${savedAt ? "green" : "gray"}`} aria-hidden />
          {savedAt ? `${t.addCustomer.autosaveSaved} (${timeAgo(savedAt, t)})` : t.addCustomer.autosaveUnsaved}
        </span>
        <div className={styles.saveBarActions}>
          <Button variant="secondary" size="sm" onClick={() => navigate("/customers")}>{t.addCustomer.cancel}</Button>
          {!isEditMode && <Button variant="secondary" size="sm">{t.addCustomer.saveAsDraft}</Button>}
          <Button variant="primary" size="sm" leftIcon={<Save size={14} />} disabled={!canSave} onClick={handleSave}>
            {isEditMode ? t.common.saveChanges : t.addCustomer.saveCustomer} <kbd className={styles.kbd}>⌘S</kbd>
          </Button>
        </div>
      </div>
    </Container>
  );
}

type T = typeof translations.en;

function timeAgo(d: Date, t: T): string {
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 5) return t.addCustomer.timeAgo.now;
  if (sec < 60) return `${sec}${t.addCustomer.timeAgo.seconds}`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}${t.addCustomer.timeAgo.minutes}`;
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

interface PreviewProps {
  form: FormState;
  completion: { filled: number; total: number; pct: number };
}

function CustomerPreviewCard({ form, completion }: PreviewProps) {
  const { t } = useSettings();
  const initials = form.name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "؟";

  return (
    <section className={styles.previewCard}>
      <header className={styles.previewHeader}>
        <h3>{t.addCustomer.preview.title}</h3>
        <Badge variant={completion.pct >= 80 ? "success" : completion.pct >= 50 ? "info" : "neutral"} size="sm">
          {completion.pct}% {t.addCustomer.preview.complete}
        </Badge>
      </header>
      <div className={styles.previewProgress}>
        <div className={styles.previewBar} style={{ width: `${completion.pct}%` }} />
      </div>
      <p className={styles.previewMeta}>{completion.filled} / {completion.total} {t.addCustomer.preview.fields}</p>

      <div className={styles.previewBody}>
        <div className={styles.previewAvatar}>
          <span>{initials}</span>
          {form.classification === "vip" && <Crown size={12} className={styles.previewCrown} aria-hidden />}
        </div>
        <div className={styles.previewIdentity}>
          <strong>{form.name || t.addCustomer.preview.customerName}</strong>
          <span>{form.code}</span>
        </div>
        <div className={styles.previewTags}>
          <Badge variant="info" size="sm">{typeLabel(form.type, t)}</Badge>
          {form.classification === "vip" && <Badge variant="warning" size="sm">VIP</Badge>}
          {form.classification === "risk" && <Badge variant="danger" size="sm">{t.addCustomer.fields.classificationRisk}</Badge>}
          <Badge variant="neutral" size="sm">{paymentLabel(form.paymentTerms, t)}</Badge>
          <Badge variant="neutral" size="sm">{form.currency}</Badge>
        </div>

        <Row label={t.addCustomer.preview.phone}        value={form.phonePrimary || "—"} />
        <Row label={t.addCustomer.preview.email}        value={form.email || "—"} />
        <Row label={t.addCustomer.preview.governorate}  value={form.governorate || "—"} />
        <Row label={t.addCustomer.preview.city}         value={form.city || "—"} />
        <Row label={t.addCustomer.preview.taxId}        value={form.taxId || "—"} />
        <Row label={t.addCustomer.preview.creditLimit}  value={form.creditLimit ? `${form.creditLimit} ${form.currency}` : "—"} />
        <Row label={t.addCustomer.preview.salesRep}     value={form.salesRep} />
        <Row
          label={t.addCustomer.preview.alertsLabel}
          value={form.alerts.length > 0 ? form.alerts.join(" · ") : "—"}
        />
      </div>

      {completion.pct === 100 && (
        <div className={styles.previewOK}>
          <CheckCircle2 size={14} /> {t.addCustomer.preview.allComplete}
        </div>
      )}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.previewRow}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function typeLabel(type: CustomerType, t: T): string {
  if (type === "individual") return t.addCustomer.fields.typeIndividual;
  if (type === "company") return t.addCustomer.fields.typeCompany;
  return t.addCustomer.fields.typeInstitution;
}

function paymentLabel(p: PaymentTerms, t: T): string {
  if (p === "cash") return t.addCustomer.fields.termCash;
  if (p === "net30") return t.addCustomer.fields.termNet30;
  if (p === "net60") return t.addCustomer.fields.termNet60;
  return t.addCustomer.fields.termNet90;
}
