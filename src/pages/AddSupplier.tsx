import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Container } from "../components/layout/Container";
import { FormSection } from "../components/forms/FormSection";
import { ButtonGroup } from "../components/forms/ButtonGroup";
import { RadioCardGroup } from "../components/forms/RadioCardGroup";
import { Globe, MapPin } from "lucide-react";

type SupplierKind = "local" | "import";

export default function AddSupplier() {
  const navigate = useNavigate();
  const [kind, setKind] = useState<SupplierKind>("local");
  const [name, setName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [country, setCountry] = useState("Palestine");
  const [swift, setSwift] = useState("");
  const [incoterms, setIncoterms] = useState<"CIF" | "DDP" | "EXW" | "FOB">("CIF");

  const canSave = !!name.trim();

  return (
    <Container maxWidth="lg" padding="md">
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        <div>
          <button
            type="button"
            onClick={() => navigate("/suppliers")}
            style={{ background: "transparent", border: 0, color: "var(--app-text-muted)", fontSize: 12, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, padding: 0, marginBottom: 8 }}
          >
            <ArrowLeft size={14} /> Back to suppliers
          </button>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700, color: "var(--app-text)" }}>Add Supplier</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--app-text-muted)", maxWidth: 640 }}>
            Choose local or import supplier — additional fields appear conditionally.
          </p>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Save size={14} />} disabled={!canSave} onClick={() => navigate("/suppliers")}>
          Save supplier
        </Button>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <FormSection number={1} title="Supplier type" subtitle="Sets the rest of the form.">
          <RadioCardGroup<SupplierKind>
            value={kind}
            onChange={setKind}
            options={[
              { value: "local",  label: "Local",   description: "Same country, ILS payments", icon: MapPin },
              { value: "import", label: "Import",  description: "Foreign · USD/EUR · Incoterms", icon: Globe },
            ]}
          />
        </FormSection>

        <FormSection number={2} title="Basics" subtitle="Identification + tax ID.">
          <Input label="Supplier name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. IndoChem Materials" />
          <Input label="Tax ID / VAT" value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="Optional" />
        </FormSection>

        {kind === "import" && (
          <FormSection number={3} title="Import details" subtitle="International logistics + banking.">
            <Input label="Country of origin" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. Indonesia" />
            <Input label="SWIFT / BIC" value={swift} onChange={(e) => setSwift(e.target.value)} placeholder="8-11 chars" />
            <ButtonGroup<"CIF" | "DDP" | "EXW" | "FOB">
              label="Incoterms"
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
    </Container>
  );
}
