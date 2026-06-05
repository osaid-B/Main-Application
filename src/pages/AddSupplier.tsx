import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Globe, MapPin, X } from "lucide-react";
import "./AddSupplier.css";
import { Input } from "../components/ui/Input";
import { PhoneInput } from "../components/ui/PhoneInput";
import { Select } from "../components/ui/Select";
import { FormSection } from "../components/forms/FormSection";
import { ButtonGroup } from "../components/forms/ButtonGroup";
import { RadioCardGroup } from "../components/forms/RadioCardGroup";
import { useData } from "../context/DataContext";
import { useSettings } from "../context/SettingsContext";
import type { Supplier } from "../data/types";
import { PALESTINIAN_GOVERNORATES, PALESTINIAN_BANKS } from "../config/palestineConfig";
import { validatePhone } from "../utils/phoneValidation";

type SupplierKind = "local" | "import";

function generateSupplierId(suppliers: Supplier[]): string {
  const max = suppliers.reduce((m, s) => {
    const match = s.id.match(/^SUP-(\d+)$/i);
    return match ? Math.max(m, Number(match[1])) : m;
  }, 1000);
  return `SUP-${max + 1}`;
}

export default function AddSupplier() {
  const navigate = useNavigate();
  const { t } = useSettings();
  const ts = t.addSupplier;
  const { suppliers, addSupplier } = useData();

  const [kind, setKind] = useState<SupplierKind>("local");
  const [name, setName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [governorate, setGovernorate] = useState("");
  const [bank, setBank] = useState("");
  const [country, setCountry] = useState("فلسطين");
  const [swift, setSwift] = useState("");
  const [incoterms, setIncoterms] = useState<"CIF" | "DDP" | "EXW" | "FOB">("CIF");
  const [phoneError, setPhoneError] = useState<string | undefined>();

  const canSave = !!name.trim();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") navigate("/suppliers");
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [navigate]);

  function handleSave() {
    if (!canSave) return;
    if (phone) {
      const result = validatePhone(phone);
      if (!result.valid) { setPhoneError(result.error); return; }
    }
    setPhoneError(undefined);
    const id = generateSupplierId(suppliers);
    const notes = [
      taxId.trim() && `رقم ضريبي: ${taxId.trim()}`,
      bank && `بنك: ${bank}`,
      governorate && `محافظة: ${governorate}`,
      swift.trim() && `SWIFT: ${swift.trim()}`,
      kind === "import" ? `Incoterms: ${incoterms}` : "",
    ].filter(Boolean).join(" | ");

    addSupplier({
      id,
      name: name.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      address: kind === "local" ? governorate : country.trim() || undefined,
      notes: notes || undefined,
      isDeleted: false,
    });
    navigate("/suppliers");
  }

  return (
    <div
      className="add-supplier-backdrop"
      onClick={() => navigate("/suppliers")}
    >
      <div
        className="add-supplier-modal"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky header */}
        <div className="add-supplier-header">
          <div>
            <h2 className="add-supplier-title">إضافة مورد جديد</h2>
            <p className="add-supplier-subtitle">أدخل تفاصيل المورد واحفظ.</p>
          </div>
          <button
            type="button"
            className="add-supplier-close"
            onClick={() => navigate("/suppliers")}
            aria-label="إغلاق"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="add-supplier-body">
          <FormSection number={1} title={ts.sec1Title} subtitle={ts.sec1Subtitle}>
            <RadioCardGroup<SupplierKind>
              value={kind}
              onChange={setKind}
              options={[
                { value: "local",  label: ts.typeLocal,  description: ts.typeLocalDesc,  icon: MapPin },
                { value: "import", label: ts.typeImport, description: ts.typeImportDesc, icon: Globe },
              ]}
            />
          </FormSection>

          <FormSection number={2} title={ts.sec2Title} subtitle={ts.sec2Subtitle}>
            <Input
              label={ts.nameLabel}
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={ts.namePlaceholder}
            />
            <Input
              label={ts.taxIdLabel}
              value={taxId}
              onKeyDown={(e) => {
                if (e.ctrlKey || e.metaKey) return;
                const allowed = ["0","1","2","3","4","5","6","7","8","9","Backspace","Delete","Tab","ArrowLeft","ArrowRight","Home","End"];
                if (!allowed.includes(e.key)) e.preventDefault();
              }}
              onChange={(e) => setTaxId(e.target.value.replace(/\D/g, "").slice(0, 9))}
              placeholder={ts.taxIdPlaceholder}
            />
            <PhoneInput
              label={ts.phoneLabel}
              value={phone}
              onChange={(digits) => { setPhone(digits); setPhoneError(undefined); }}
              error={phoneError}
            />
            <Input
              label={ts.emailLabel}
              variant="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={ts.emailPlaceholder}
            />
            {kind === "local" && (
              <Select
                label={ts.govLabel}
                value={governorate}
                onChange={(e) => setGovernorate(e.target.value)}
                placeholder={ts.govPlaceholder}
                options={PALESTINIAN_GOVERNORATES.map((g) => ({ value: g.nameAr, label: g.nameAr }))}
                fullWidth
              />
            )}
            <Select
              label={ts.bankLabel}
              value={bank}
              onChange={(e) => setBank(e.target.value)}
              placeholder={ts.bankPlaceholder}
              options={PALESTINIAN_BANKS.map((b) => ({ value: b.nameAr, label: b.nameAr }))}
              fullWidth
            />
          </FormSection>

          {kind === "import" && (
            <FormSection number={3} title={ts.sec3Title} subtitle={ts.sec3Subtitle}>
              <Input
                label={ts.countryLabel}
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder={ts.countryPlaceholder}
              />
              <Input
                label={ts.swiftLabel}
                value={swift}
                onChange={(e) => setSwift(e.target.value.toUpperCase().slice(0, 11))}
                placeholder={ts.swiftPlaceholder}
              />
              <ButtonGroup<"CIF" | "DDP" | "EXW" | "FOB">
                label={ts.incotermsLabel}
                value={incoterms}
                onChange={setIncoterms}
                options={[
                  { value: "CIF", label: "CIF" },
                  { value: "DDP", label: "DDP" },
                  { value: "EXW", label: "EXW" },
                  { value: "FOB", label: "FOB" },
                ]}
              />
            </FormSection>
          )}
        </div>

        {/* Sticky footer */}
        <div className="add-supplier-footer">
          <button
            type="button"
            className="add-supplier-btn-ghost"
            onClick={() => navigate("/suppliers")}
          >
            {ts.cancel}
          </button>
          <button
            type="button"
            className="add-supplier-btn-secondary"
            onClick={() => navigate("/suppliers")}
          >
            حفظ كمسودة
          </button>
          <button
            type="button"
            className="add-supplier-btn-primary"
            onClick={handleSave}
            disabled={!canSave}
          >
            {ts.saveSupplier}
          </button>
        </div>
      </div>
    </div>
  );
}
