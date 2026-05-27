import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Briefcase, Calendar, Clock, GraduationCap, Save } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Container } from "../components/layout/Container";
import { FormSection } from "../components/forms/FormSection";
import { RadioCardGroup } from "../components/forms/RadioCardGroup";
import { ButtonGroup } from "../components/forms/ButtonGroup";
import { useSettings } from "../context/SettingsContext";
import { PALESTINIAN_GOVERNORATES, PALESTINIAN_BANKS } from "../config/palestineConfig";

type EmpKind = "permanent" | "daily" | "temporary" | "intern";
type PayCycle = "daily" | "weekly" | "monthly";

export default function AddEmployee() {
  const navigate = useNavigate();
  const { t } = useSettings();
  const te = t.addEmployee;

  const [kind, setKind] = useState<EmpKind>("permanent");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [governorate, setGovernorate] = useState("");
  const [department, setDepartment] = useState("");
  const [salary, setSalary] = useState("");
  const [dailyRate, setDailyRate] = useState("");
  const [stipend, setStipend] = useState("");
  const [iban, setIban] = useState("");
  const [bank, setBank] = useState("");
  const [cycle, setCycle] = useState<PayCycle>("monthly");

  const canSave = !!name.trim();

  const selectStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid var(--app-border)",
    borderRadius: "var(--app-radius-sm)",
    fontSize: 14,
    background: "var(--app-surface)",
    color: "var(--app-text)",
  };

  return (
    <Container maxWidth="lg" padding="md">
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        <div>
          <button
            type="button"
            onClick={() => navigate("/employees")}
            style={{ background: "transparent", border: 0, color: "var(--app-text-muted)", fontSize: 12, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, padding: 0, marginBottom: 8 }}
          >
            <ArrowLeft size={14} /> {te.backLink}
          </button>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700, color: "var(--app-text)" }}>{te.pageTitle}</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--app-text-muted)", maxWidth: 640 }}>{te.pageSubtitle}</p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Save size={14} />} disabled={!canSave} onClick={() => navigate("/employees")}>
          {te.saveEmployee}
        </Button>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <FormSection number={1} title={te.sec1Title} subtitle={te.sec1Subtitle}>
          <RadioCardGroup<EmpKind>
            value={kind}
            onChange={setKind}
            options={[
              { value: "permanent", label: te.typePermanent, description: te.typePermanentDesc, icon: Briefcase },
              { value: "daily",     label: te.typeDaily,     description: te.typeDailyDesc,     icon: Calendar },
              { value: "temporary", label: te.typeTemporary, description: te.typeTemporaryDesc, icon: Clock },
              { value: "intern",    label: te.typeIntern,    description: te.typeInternDesc,     icon: GraduationCap },
            ]}
          />
        </FormSection>

        <FormSection number={2} title={te.sec2Title} subtitle={te.sec2Subtitle}>
          <Input
            label={te.nameLabel}
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={te.namePlaceholder}
          />
          <Input
            label={te.phoneLabel}
            variant="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={te.phonePlaceholder}
          />
          <Input
            label={te.idLabel}
            value={nationalId}
            onChange={(e) => setNationalId(e.target.value.replace(/\D/g, "").slice(0, 9))}
            placeholder={te.idPlaceholder}
          />
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 4 }}>{te.govLabel}</label>
            <select value={governorate} onChange={(e) => setGovernorate(e.target.value)} style={selectStyle}>
              <option value="">{te.govPlaceholder}</option>
              {PALESTINIAN_GOVERNORATES.map((g) => (
                <option key={g.id} value={g.nameAr}>{g.nameAr}</option>
              ))}
            </select>
          </div>
          <Input
            label={te.departmentLabel}
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder={te.departmentPlaceholder}
          />
        </FormSection>

        <FormSection number={3} title={te.sec3Title} subtitle={te.sec3Subtitle}>
          {kind === "permanent" && (
            <Input label={te.monthlySalaryLabel} variant="number" value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="0" />
          )}
          {kind === "daily" && (
            <>
              <Input label={te.dailyRateLabel} variant="number" value={dailyRate} onChange={(e) => setDailyRate(e.target.value)} placeholder="0" />
              <ButtonGroup<PayCycle>
                label={te.payCycleLabel}
                value={cycle}
                onChange={setCycle}
                options={[
                  { value: "daily",   label: te.cycleDaily },
                  { value: "weekly",  label: te.cycleWeekly },
                  { value: "monthly", label: te.cycleMonthly },
                ]}
              />
            </>
          )}
          {kind === "temporary" && (
            <Input label={te.monthlySalaryLabel} variant="number" value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="0" />
          )}
          {kind === "intern" && (
            <Input label={te.stipendLabel} variant="number" value={stipend} onChange={(e) => setStipend(e.target.value)} placeholder="0" />
          )}
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 4 }}>{te.bankLabel}</label>
            <select value={bank} onChange={(e) => setBank(e.target.value)} style={selectStyle}>
              <option value="">{te.bankPlaceholder}</option>
              {PALESTINIAN_BANKS.map((b) => (
                <option key={b.id} value={b.nameAr}>{b.nameAr}</option>
              ))}
            </select>
          </div>
          <Input
            label={te.ibanLabel}
            value={iban}
            onChange={(e) => setIban(e.target.value.toUpperCase().slice(0, 28))}
            placeholder={te.ibanPlaceholder}
          />
        </FormSection>
      </div>
    </Container>
  );
}
