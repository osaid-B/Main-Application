import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext";
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
import { Badge } from "../components/ui/Badge";
import { Container } from "../components/layout/Container";
import { FormSection } from "../components/forms/FormSection";
import { ButtonGroup } from "../components/forms/ButtonGroup";
import { RadioCardGroup } from "../components/forms/RadioCardGroup";
import { TagInput } from "../components/forms/TagInput";
import { SmartLocationPicker } from "../components/forms/SmartLocationPicker";
import {
  CITIES_BY_GOVERNORATE,
  GOVERNORATES,
  SALES_REPS,
  type CustomerClassification,
  type CustomerType,
  type Currency,
  type PaymentTerms,
} from "../data/customersMock";
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
  neighborhood: string;
  street: string;
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
  code: `C-${Math.floor(1000 + Math.random() * 9000)}`,
  taxId: "",
  phonePrimary: "",
  phoneSecondary: "",
  email: "",
  governorate: "",
  city: "",
  neighborhood: "",
  street: "",
  paymentTerms: "net30",
  currency: "ILS",
  creditLimit: "",
  salesRep: SALES_REPS[0],
  classification: "standard",
  defaultDiscount: "",
  alerts: [],
};

const REQUIRED_KEYS: Array<keyof FormState> = [
  "name", "type", "code", "phonePrimary", "governorate", "city",
];

function generateCustomerId(customers: Customer[]): string {
  const max = customers.reduce((m, c) => {
    const match = c.id.match(/^CUST-(\d+)$/i);
    return match ? Math.max(m, Number(match[1])) : m;
  }, 1000);
  return `CUST-${max + 1}`;
}

export default function AddCustomer() {
  const navigate = useNavigate();
  const { addCustomer, customers } = useData();
  const [form, setForm] = useState<FormState>(() => ({
    ...INITIAL,
    code: generateCustomerId(customers),
  }));
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const autosaveRef = useRef<number | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => {
      // Cascading reset: changing governorate clears city.
      if (key === "governorate" && prev.governorate !== value) {
        return { ...prev, governorate: value as string, city: "" };
      }
      return { ...prev, [key]: value };
    });
  }

  // Autosave indicator (drafts persisted in localStorage)
  useEffect(() => {
    if (autosaveRef.current) window.clearTimeout(autosaveRef.current);
    autosaveRef.current = window.setTimeout(() => {
      try {
        window.localStorage.setItem("atlas-customer-draft", JSON.stringify(form));
        setSavedAt(new Date());
      } catch { /* ignore quota */ }
    }, 800);
    return () => { if (autosaveRef.current) window.clearTimeout(autosaveRef.current); };
  }, [form]);

  // Cmd/Ctrl+S to save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        // In a real app: persist + navigate.
        setSavedAt(new Date());
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const completion = useMemo(() => {
    const TOTAL_FIELDS = 17;
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
  const sec3Complete = !!form.governorate && !!form.city;
  const sec4Complete = !!form.paymentTerms && !!form.currency;

  const cityOptions = form.governorate ? CITIES_BY_GOVERNORATE[form.governorate] ?? [] : [];

  const missing = REQUIRED_KEYS.filter((k) => {
    const v = form[k];
    return Array.isArray(v) ? v.length === 0 : !v;
  });
  const canSave = missing.length === 0;

  function handleSave() {
    if (!canSave) return;
    const today = new Date().toISOString().split("T")[0];
    const id = generateCustomerId(customers);
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
      address: [form.neighborhood, form.street].filter(Boolean).join(", ") || undefined,
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
            <ArrowLeft size={14} /> العودة إلى العملاء
          </button>
          <h1 className={styles.title}>إضافة عميل جديد</h1>
          <p className={styles.subtitle}>
            املأ الأقسام الأربعة بالتسلسل. الحفظ التلقائي مفعّل — يمكنك إغلاق الصفحة والعودة لاحقاً.
          </p>
        </div>
        <div className={styles.pageActions}>
          <Button variant="secondary" size="sm" onClick={() => navigate("/customers")}>إلغاء</Button>
          <Button variant="secondary" size="sm">حفظ كمسودة</Button>
          <Button variant="primary" size="sm" leftIcon={<Save size={14} />} disabled={!canSave} onClick={handleSave}>
            حفظ العميل
          </Button>
        </div>
      </header>

      <div className={styles.layout}>
        {/* ─── Left: Form ─── */}
        <div className={styles.formCol}>
          <FormSection
            number={1}
            title="المعلومات الأساسية"
            subtitle="الاسم، النوع، الرقم، والمعرّف الضريبي."
            progress={sec1Complete ? "4 / 4 ✓" : `${[form.name, form.type, form.code, form.taxId].filter(Boolean).length} / 4`}
            isComplete={sec1Complete}
          >
            <Input
              label="اسم العميل"
              required
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="مثال: شركة فلسطين للتجارة"
              error={!form.name ? undefined : form.name.trim().length < 3 ? "يجب أن يكون 3 أحرف على الأقل" : undefined}
            />

            <RadioCardGroup<CustomerType>
              label="نوع العميل *"
              value={form.type}
              onChange={(v) => update("type", v)}
              options={[
                { value: "individual",  label: "فرد",   description: "شخص طبيعي",  icon: UserIcon },
                { value: "company",     label: "شركة",  description: "شركة تجارية", icon: Building2 },
                { value: "institution", label: "مؤسسة", description: "غير ربحية / حكومية", icon: Briefcase },
              ]}
            />

            <div className={styles.row2}>
              <div className={styles.codeField}>
                <Input
                  label="رقم العميل"
                  required
                  value={form.code}
                  readOnly
                  hint="يُولَّد تلقائياً"
                />
                <button
                  type="button"
                  className={styles.refreshBtn}
                  onClick={() => update("code", generateCustomerId(customers))}
                  aria-label="إنشاء رقم جديد"
                  title="إنشاء رقم جديد"
                >
                  <RefreshCw size={13} />
                </button>
              </div>
              <Input
                label="الرقم الضريبي"
                value={form.taxId}
                onChange={(e) => update("taxId", e.target.value.replace(/[^\d]/g, "").slice(0, 9))}
                placeholder="9 أرقام"
                hint="اختياري — يجب أن يكون 9 أرقام إن وُجد"
                error={form.taxId && form.taxId.length !== 9 ? "يجب 9 أرقام بالضبط" : undefined}
              />
            </div>
          </FormSection>

          <FormSection
            number={2}
            title="معلومات التواصل"
            subtitle="الهاتف والبريد الإلكتروني."
            progress={sec2Complete ? "تم" : "1 من 3 مطلوب"}
            isComplete={sec2Complete}
          >
            <Input
              label="رقم الجوال"
              required
              variant="tel"
              value={form.phonePrimary}
              onChange={(e) => update("phonePrimary", e.target.value)}
              placeholder="+970 59 xxx xxxx"
              leftIcon={<span className={styles.dialPrefix}>+970</span>}
            />
            <Input
              label="رقم آخر"
              variant="tel"
              value={form.phoneSecondary}
              onChange={(e) => update("phoneSecondary", e.target.value)}
              placeholder="اختياري"
            />
            <Input
              label="البريد الإلكتروني"
              variant="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="name@example.com"
              error={form.email && !/.+@.+\..+/.test(form.email) ? "بريد إلكتروني غير صالح" : undefined}
            />
          </FormSection>

          <FormSection
            number={3}
            title="تفاصيل العنوان"
            subtitle="المحافظة والمدينة وعنوان التواصل."
            progress={sec3Complete ? "تم" : "مطلوب"}
            isComplete={sec3Complete}
          >
            <div className={styles.row2}>
              <SmartLocationPicker
                label="المحافظة"
                required
                options={GOVERNORATES}
                value={form.governorate}
                onChange={(v) => update("governorate", v)}
                placeholder="اختر محافظة…"
              />
              <SmartLocationPicker
                label="المدينة / القرية"
                required
                options={cityOptions}
                value={form.city}
                onChange={(v) => update("city", v)}
                placeholder={form.governorate ? "اختر مدينة…" : "اختر المحافظة أولاً"}
                disabled={!form.governorate}
                allowAddNew
              />
            </div>
            <div className={styles.row2}>
              <Input
                label="الحي"
                value={form.neighborhood}
                onChange={(e) => update("neighborhood", e.target.value)}
                placeholder="اختياري"
              />
              <Input
                label="الشارع"
                value={form.street}
                onChange={(e) => update("street", e.target.value)}
                placeholder="اختياري"
              />
            </div>
          </FormSection>

          <FormSection
            number={4}
            title="المعلومات التجارية"
            subtitle="شروط الدفع، العملة، والحد الائتماني."
            isComplete={sec4Complete}
          >
            <ButtonGroup<PaymentTerms>
              label="شروط الدفع"
              value={form.paymentTerms}
              onChange={(v) => update("paymentTerms", v)}
              options={[
                { value: "cash",  label: "نقدي" },
                { value: "net15", label: "Net 15" },
                { value: "net30", label: "Net 30" },
                { value: "net60", label: "Net 60" },
                { value: "net90", label: "Net 90" },
              ]}
            />
            <ButtonGroup<Currency>
              label="العملة المفضلة"
              value={form.currency}
              onChange={(v) => update("currency", v)}
              options={[
                { value: "ILS", label: "₪ ILS" },
                { value: "USD", label: "$ USD" },
                { value: "JOD", label: "د.أ JOD" },
                { value: "EUR", label: "€ EUR" },
              ]}
            />
            <Input
              label="الحد الائتماني"
              variant="number"
              value={form.creditLimit}
              onChange={(e) => update("creditLimit", e.target.value.replace(/[^\d]/g, ""))}
              placeholder="0"
              hint={`بالعملة المختارة (${form.currency})`}
            />
          </FormSection>

          <FormSection
            number={5}
            title="إعدادات متقدمة"
            subtitle="مندوب المبيعات، التصنيف، الخصم الافتراضي، التنبيهات."
            collapsible
            defaultCollapsed
          >
            <Input
              label="مندوب المبيعات"
              value={form.salesRep}
              onChange={(e) => update("salesRep", e.target.value)}
              hint="حدد من قائمة المندوبين"
            />
            <ButtonGroup<CustomerClassification>
              label="تصنيف العميل"
              value={form.classification}
              onChange={(v) => update("classification", v)}
              options={[
                { value: "standard", label: "قياسي" },
                { value: "vip",      label: "VIP" },
                { value: "risk",     label: "مخاطر" },
              ]}
            />
            <Input
              label="خصم افتراضي %"
              variant="number"
              value={form.defaultDiscount}
              onChange={(e) => update("defaultDiscount", e.target.value.replace(/[^\d]/g, "").slice(0, 2))}
              placeholder="0"
              hint="من 0 إلى 99"
            />
            <TagInput
              label="تنبيهات"
              value={form.alerts}
              onChange={(v) => update("alerts", v)}
              hint="استخدم Enter لإضافة، Backspace للحذف"
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
          {savedAt ? `تم حفظ المسودة (${timeAgo(savedAt)})` : "لم يتم الحفظ بعد"}
        </span>
        <div className={styles.saveBarActions}>
          <Button variant="secondary" size="sm" onClick={() => navigate("/customers")}>إلغاء</Button>
          <Button variant="secondary" size="sm">حفظ كمسودة</Button>
          <Button variant="primary" size="sm" leftIcon={<Save size={14} />} disabled={!canSave} onClick={handleSave}>
            حفظ العميل <kbd className={styles.kbd}>⌘S</kbd>
          </Button>
        </div>
      </div>
    </Container>
  );
}

function timeAgo(d: Date): string {
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 5) return "الآن";
  if (sec < 60) return `قبل ${sec} ث`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `قبل ${min} د`;
  return d.toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" });
}

interface PreviewProps {
  form: FormState;
  completion: { filled: number; total: number; pct: number };
}

function CustomerPreviewCard({ form, completion }: PreviewProps) {
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
        <h3>معاينة مباشرة</h3>
        <Badge variant={completion.pct >= 80 ? "success" : completion.pct >= 50 ? "info" : "neutral"} size="sm">
          {completion.pct}% مكتمل
        </Badge>
      </header>
      <div className={styles.previewProgress}>
        <div className={styles.previewBar} style={{ width: `${completion.pct}%` }} />
      </div>
      <p className={styles.previewMeta}>{completion.filled} / {completion.total} حقل</p>

      <div className={styles.previewBody}>
        <div className={styles.previewAvatar}>
          <span>{initials}</span>
          {form.classification === "vip" && <Crown size={12} className={styles.previewCrown} aria-hidden />}
        </div>
        <div className={styles.previewIdentity}>
          <strong>{form.name || "اسم العميل"}</strong>
          <span>{form.code}</span>
        </div>
        <div className={styles.previewTags}>
          <Badge variant="info" size="sm">{typeLabel(form.type)}</Badge>
          {form.classification === "vip" && <Badge variant="warning" size="sm">VIP</Badge>}
          {form.classification === "risk" && <Badge variant="danger" size="sm">مخاطر</Badge>}
          <Badge variant="neutral" size="sm">{paymentLabel(form.paymentTerms)}</Badge>
          <Badge variant="neutral" size="sm">{form.currency}</Badge>
        </div>

        <Row label="الهاتف"        value={form.phonePrimary || "—"} />
        <Row label="البريد"        value={form.email || "—"} />
        <Row label="المحافظة"      value={form.governorate || "—"} />
        <Row label="المدينة"        value={form.city || "—"} />
        <Row label="الحي / الشارع" value={[form.neighborhood, form.street].filter(Boolean).join(" · ") || "—"} />
        <Row label="الرقم الضريبي" value={form.taxId || "—"} />
        <Row label="الحد الائتماني" value={form.creditLimit ? `${form.creditLimit} ${form.currency}` : "—"} />
        <Row label="المندوب"        value={form.salesRep} />
        <Row
          label="التنبيهات"
          value={form.alerts.length > 0 ? form.alerts.join(" · ") : "—"}
        />
      </div>

      {completion.pct === 100 && (
        <div className={styles.previewOK}>
          <CheckCircle2 size={14} /> جميع الحقول مكتملة
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

function typeLabel(t: CustomerType): string {
  return t === "individual" ? "فرد" : t === "company" ? "شركة" : "مؤسسة";
}

function paymentLabel(p: PaymentTerms): string {
  return p === "cash" ? "نقدي" : p === "net15" ? "Net 15" : p === "net30" ? "Net 30" : p === "net60" ? "Net 60" : "Net 90";
}
