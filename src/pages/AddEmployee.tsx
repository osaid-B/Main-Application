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

type EmpKind = "permanent" | "daily" | "temporary" | "intern";
type PayCycle = "daily" | "weekly" | "monthly";

export default function AddEmployee() {
  const navigate = useNavigate();
  const { t } = useSettings();
  const [kind, setKind] = useState<EmpKind>("permanent");
  const [name, setName] = useState("");
  const [salary, setSalary] = useState("");
  const [iban, setIban] = useState("");
  const [dailyRate, setDailyRate] = useState("");
  const [cycle, setCycle] = useState<PayCycle>("monthly");
  const [stipend, setStipend] = useState("");

  const canSave = !!name.trim();

  return (
    <Container maxWidth="lg" padding="md">
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        <div>
          <button
            type="button"
            onClick={() => navigate("/employees")}
            style={{ background: "transparent", border: 0, color: "var(--app-text-muted)", fontSize: 12, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, padding: 0, marginBottom: 8 }}
          >
            <ArrowLeft size={14} /> {t.addEmployee.backLink}
          </button>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700, color: "var(--app-text)" }}>{t.addEmployee.pageTitle}</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--app-text-muted)", maxWidth: 640 }}>
            {t.addEmployee.pageSubtitle}
          </p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Save size={14} />} disabled={!canSave} onClick={() => navigate("/employees")}>
          {t.addEmployee.saveEmployee}
        </Button>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <FormSection number={1} title="Employment type" subtitle="Drives compensation fields below.">
          <RadioCardGroup<EmpKind>
            value={kind}
            onChange={setKind}
            options={[
              { value: "permanent", label: "Permanent", description: "Monthly salary + allowances", icon: Briefcase },
              { value: "daily",     label: "Daily",     description: "Per-day rate + cycle",         icon: Calendar },
              { value: "temporary", label: "Temporary", description: "Fixed-term contract",          icon: Clock },
              { value: "intern",    label: "Intern",    description: "Stipend only",                  icon: GraduationCap },
            ]}
          />
        </FormSection>

        <FormSection number={2} title="Identification">
          <Input label="Full name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ahmad Khalil" />
        </FormSection>

        {kind === "permanent" && (
          <FormSection number={3} title="Compensation" subtitle="Monthly salary structure.">
            <Input label="Monthly salary" variant="number" value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="ILS" />
            <Input label="IBAN" value={iban} onChange={(e) => setIban(e.target.value.toUpperCase())} placeholder="PS… 28 chars" />
          </FormSection>
        )}

        {kind === "daily" && (
          <FormSection number={3} title="Daily compensation" subtitle="Per-day rate and payment cycle.">
            <Input label="Daily rate" variant="number" value={dailyRate} onChange={(e) => setDailyRate(e.target.value)} placeholder="ILS" />
            <ButtonGroup<PayCycle>
              label="Payment cycle"
              value={cycle}
              onChange={setCycle}
              options={[
                { value: "daily",   label: "Daily" },
                { value: "weekly",  label: "Weekly" },
                { value: "monthly", label: "End of month" },
              ]}
            />
          </FormSection>
        )}

        {kind === "intern" && (
          <FormSection number={3} title="Stipend">
            <Input label="Monthly stipend" variant="number" value={stipend} onChange={(e) => setStipend(e.target.value)} placeholder="ILS" />
          </FormSection>
        )}

        {kind === "temporary" && (
          <FormSection number={3} title="Contract details">
            <Input label="Monthly rate" variant="number" value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="ILS" hint="Fixed-term contract — start/end dates set in HR module." />
          </FormSection>
        )}
      </div>
    </Container>
  );
}
