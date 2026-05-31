import "./Treasury.css";
import { useState, useCallback } from "react";
import { Camera, ChevronDown, ChevronUp, HelpCircle, Link2, Loader2, X } from "lucide-react";
import { Modal } from "../components/ui/Modal";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Tooltip } from "../components/ui/Tooltip";
import { Badge } from "../components/ui/Badge";
import type { TreasuryInstrument, InstrumentDirection, PalestinianCurrency } from "../types/treasury";
import { PALESTINIAN_BANKS, CURRENCY_RATES } from "../types/treasury";
import { parseMicrLine, DEMO_MICR_SCAN } from "../utils/micrParser";
import type { MicrParseResult } from "../utils/micrParser";

type ModalTab = "check" | "transfer";

// ── Auto-fill field states ────────────────────────────────────────────────────
type FieldSource = "manual" | "ocr" | "confirmed";

function sourceTag(src: FieldSource) {
  if (src === "ocr") return <span className="trs-autofill-tag">مقروء آلياً</span>;
  if (src === "confirmed") return null;
  return null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const today = new Date().toISOString().slice(0, 10);


function toDDMMYYYY(iso: string): string {
  if (!iso) return "";
  if (iso.includes("/")) return iso;
  const [yyyy, mm, dd] = iso.split("-");
  return `${dd}/${mm}/${yyyy}`;
}

function addMonths(isoDate: string, months: number): string {
  const d = new Date(isoDate);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function monthsDiff(isoA: string, isoB: string): number {
  const a = new Date(isoA);
  const b = new Date(isoB);
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

// ─── AddInstrumentModal ───────────────────────────────────────────────────────

interface AddInstrumentModalProps {
  onSave: (data: Omit<TreasuryInstrument, "id" | "createdAt" | "updatedAt" | "statusHistory">, saveAsDraft: boolean) => void;
  onClose: () => void;
  defaultDirection?: InstrumentDirection;
}

export function AddInstrumentModal({
  onSave,
  onClose,
  defaultDirection = "incoming",
}: AddInstrumentModalProps) {
  const [tab,       setTab]       = useState<ModalTab>("check");
  const [direction, setDirection] = useState<InstrumentDirection>(defaultDirection);

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={
        tab === "check"
          ? direction === "incoming" ? "إضافة شيك وارد" : "إضافة شيك صادر"
          : direction === "incoming" ? "إضافة تحويل وارد" : "إضافة تحويل صادر"
      }
      size="lg"
      footer={null}
    >
      {/* Tabs */}
      <div className="trs-modal-tabs">
        <button
          type="button"
          className={`trs-modal-tab ${tab === "check" ? "active" : ""}`}
          onClick={() => setTab("check")}
        >
          شيك
        </button>
        <button
          type="button"
          className={`trs-modal-tab ${tab === "transfer" ? "active" : ""}`}
          onClick={() => setTab("transfer")}
        >
          تحويل بنكي
        </button>
      </div>

      {tab === "check" ? (
        <CheckForm direction={direction} onDirectionChange={setDirection} onSave={onSave} onClose={onClose} />
      ) : (
        <TransferForm direction={direction} onDirectionChange={setDirection} onSave={onSave} onClose={onClose} />
      )}
    </Modal>
  );
}

// ─── CheckForm ────────────────────────────────────────────────────────────────

interface CheckFormProps {
  direction: InstrumentDirection;
  onDirectionChange: (d: InstrumentDirection) => void;
  onSave: AddInstrumentModalProps["onSave"];
  onClose: () => void;
}

function CheckForm({ direction, onDirectionChange, onSave, onClose }: CheckFormProps) {
  // Amounts & dates
  const [amount,         setAmount]         = useState("");
  const [currency,       setCurrency]       = useState<PalestinianCurrency>("ILS");
  const [instrumentDate, setInstrumentDate] = useState(today);
  const [dueDate,        setDueDate]        = useState(addMonths(today, 1));

  // Drawer
  const [drawerName, setDrawerName] = useState("");
  const [drawerType, setDrawerType] = useState<"customer" | "supplier" | "other">("customer");

  // Bank
  const [bankId,         setBankId]         = useState<string>(PALESTINIAN_BANKS[0].id);
  const [branchName,     setBranchName]     = useState("");
  const [branchCode,     setBranchCode]     = useState("");
  const [accountNumber,  setAccountNumber]  = useState("");
  const [checkNumber,    setCheckNumber]    = useState("");

  // MICR
  const [micrRaw,         setMicrRaw]         = useState("");
  const [micrResult,      setMicrResult]      = useState<MicrParseResult | null>(null);
  const [micrOpen,        setMicrOpen]        = useState(false);
  const [ocrScanning,     setOcrScanning]     = useState(false);
  const [ocrResult,       setOcrResult]       = useState<MicrParseResult | null>(null);
  const [showOcrResult,   setShowOcrResult]   = useState(false);
  const [fieldSources,    setFieldSources]    = useState<Record<string, FieldSource>>({});

  // Linked invoices
  const [linkedInvoices, setLinkedInvoices] = useState<string[]>([]);
  const [invInput,       setInvInput]       = useState("");

  // Notes / image
  const [notes,    setNotes]    = useState("");
  const [imageUrl] = useState("");

  // Validation warnings
  const dueDateIso = dueDate;
  const dueDateWarning = (() => {
    if (!dueDateIso || !instrumentDate) return null;
    if (dueDateIso < instrumentDate) return "تاريخ الاستحقاق يجب أن يكون بعد أو مساوٍ لتاريخ الشيك.";
    if (dueDateIso < today) return "⚠ الشيك منتهي الصلاحية — تاريخ الاستحقاق في الماضي.";
    if (monthsDiff(today, dueDateIso) > 6) return "⚠ شيك آجل بعيد — تاريخ الاستحقاق يتجاوز 6 أشهر.";
    return null;
  })();

  const selectedBank = PALESTINIAN_BANKS.find(b => b.id === bankId)!;

  const handleOcrScan = useCallback(() => {
    setOcrScanning(true);
    // Simulate OCR with demo MICR string
    setTimeout(() => {
      const result = parseMicrLine(DEMO_MICR_SCAN);
      setOcrResult(result);
      setShowOcrResult(true);
      setOcrScanning(false);
    }, 1400);
  }, []);

  const handleApplyOcr = useCallback(() => {
    if (!ocrResult) return;
    if (ocrResult.bankCode) {
      const foundBank = PALESTINIAN_BANKS.find(b => b.code === ocrResult.bankCode);
      if (foundBank) setBankId(foundBank.id);
    }
    if (ocrResult.branchCode)    { setBranchCode(ocrResult.branchCode);       setFieldSources(p => ({ ...p, branchCode: "ocr" })); }
    if (ocrResult.accountNumber) { setAccountNumber(ocrResult.accountNumber); setFieldSources(p => ({ ...p, accountNumber: "ocr" })); }
    if (ocrResult.checkNumber)   { setCheckNumber(ocrResult.checkNumber);     setFieldSources(p => ({ ...p, checkNumber: "ocr" })); }
    setMicrRaw(DEMO_MICR_SCAN);
    setMicrResult(ocrResult);
    setMicrOpen(true);
    setShowOcrResult(false);
  }, [ocrResult]);

  const handleParseMicr = useCallback(() => {
    if (!micrRaw.trim()) return;
    const result = parseMicrLine(micrRaw);
    setMicrResult(result);
    if (result.bank) setBankId(result.bank.id);
    if (result.branchCode)    setBranchCode(result.branchCode);
    if (result.accountNumber) setAccountNumber(result.accountNumber);
    if (result.checkNumber)   setCheckNumber(result.checkNumber);
  }, [micrRaw]);

  const handleSave = (asDraft: boolean) => {
    if (!amount || !drawerName || !accountNumber) return;

    const numAmount = parseFloat(amount);
    const amountInILS = numAmount * (CURRENCY_RATES[currency] ?? 1);

    onSave({
      type: "check",
      direction,
      status: asDraft ? "draft" : "pending",
      amount: numAmount,
      currency,
      amountInILS,
      instrumentDate: toDDMMYYYY(instrumentDate),
      dueDate: toDDMMYYYY(dueDate),
      drawerName,
      drawerType,
      payeeName: direction === "incoming" ? "أطلس لإدارة الأعمال" : drawerName,
      bankId,
      bankName: selectedBank.nameAr,
      branchName,
      branchCode,
      accountNumber,
      checkNumber: checkNumber || undefined,
      swiftCode: selectedBank.swift,
      micrRaw: micrRaw || undefined,
      micrBankCode: micrResult?.bankCode,
      micrAccountNumber: micrResult?.accountNumber,
      micrCheckNumber: micrResult?.checkNumber,
      micrVerified: Object.values(fieldSources).every(s => s === "confirmed" || s === "manual"),
      linkedInvoiceIds: linkedInvoices,
      linkedPaymentIds: [],
      notes: notes || undefined,
      imageUrl: imageUrl || undefined,
      createdBy: "admin",
    }, asDraft);
  };

  const amtNum = parseFloat(amount) || 0;
  const amountInILS = amtNum * (CURRENCY_RATES[currency] ?? 1);

  return (
    <div>
      {/* Section 1: Direction & OCR */}
      <div className="trs-form-section">
        <div className="trs-form-section-title">نوع الشيك</div>

        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {(["incoming", "outgoing"] as const).map(d => (
            <button
              key={d}
              type="button"
              onClick={() => onDirectionChange(d)}
              style={{
                flex: 1, padding: "8px 0", borderRadius: "var(--app-radius-sm)",
                border: `2px solid ${direction === d ? "#3b5bdb" : "var(--app-border-strong)"}`,
                background: direction === d ? "#eef2ff" : "var(--app-surface)",
                color: direction === d ? "#3b5bdb" : "var(--app-text-soft)",
                fontWeight: 700, fontSize: 13.5, cursor: "pointer", transition: "all 0.15s",
              }}
            >
              {d === "incoming" ? "◉ وارد (مستلم)" : "○ صادر (صادر منا)"}
            </button>
          ))}
        </div>

        {/* OCR Scanner */}
        {!showOcrResult ? (
          <div
            className="trs-ocr-scan-area"
            role="button"
            tabIndex={0}
            onClick={handleOcrScan}
            onKeyDown={e => e.key === "Enter" && handleOcrScan()}
          >
            {ocrScanning ? (
              <>
                <Loader2 size={22} style={{ margin: "0 auto 6px", animation: "spin 1s linear infinite" }} />
                <div className="trs-ocr-scan-title">جارٍ تحليل الشيك...</div>
              </>
            ) : (
              <>
                <Camera size={22} style={{ margin: "0 auto 6px" }} />
                <div className="trs-ocr-scan-title">مسح الشيك ضوئياً</div>
                <div className="trs-ocr-scan-sub">ارفع صورة الشيك أو اسحبها هنا</div>
              </>
            )}
          </div>
        ) : ocrResult ? (
          <div className="trs-ocr-result-box">
            <div className="trs-ocr-result-title">
              نتائج المسح الضوئي
              <Badge variant={ocrResult.confidence === "high" ? "success" : ocrResult.confidence === "medium" ? "warning" : "danger"}>
                {ocrResult.confidence === "high" ? "ثقة عالية" : ocrResult.confidence === "medium" ? "ثقة متوسطة" : "ثقة منخفضة"}
              </Badge>
            </div>
            {ocrResult.bank && (
              <div className="trs-ocr-result-row">
                <span className="trs-ocr-result-key">البنك</span>
                <span className="trs-ocr-result-val">{ocrResult.bank.nameAr} ✓</span>
              </div>
            )}
            {ocrResult.branchCode && (
              <div className="trs-ocr-result-row">
                <span className="trs-ocr-result-key">كود الفرع</span>
                <span className="trs-ocr-result-val">{ocrResult.branchCode}</span>
              </div>
            )}
            {ocrResult.accountNumber && (
              <div className="trs-ocr-result-row">
                <span className="trs-ocr-result-key">رقم الحساب</span>
                <span className="trs-ocr-result-val">{ocrResult.accountNumber}</span>
              </div>
            )}
            {ocrResult.checkNumber && (
              <div className="trs-ocr-result-row">
                <span className="trs-ocr-result-key">رقم الشيك</span>
                <span className="trs-ocr-result-val">{ocrResult.checkNumber}</span>
              </div>
            )}
            {ocrResult.warnings.length > 0 && (
              <div className="trs-ocr-disclaimer">
                {ocrResult.warnings.map((w, i) => <div key={i}>⚠ {w}</div>)}
              </div>
            )}
            <div className="trs-ocr-disclaimer">
              البيانات المقروءة آلياً يجب التحقق منها يدوياً قبل الحفظ.<br />
              النظام غير مسؤول عن أخطاء القراءة الآلية.
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <Button variant="secondary" size="sm" onClick={() => setShowOcrResult(false)}>تعديل</Button>
              <Button variant="primary" size="sm" onClick={handleApplyOcr}>تأكيد وملء النموذج</Button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Section 2: Amount & Dates */}
      <div className="trs-form-section">
        <div className="trs-form-section-title">المبلغ والتواريخ</div>
        <div className="trs-form-grid">
          <div className="trs-form-field">
            <label className="trs-form-label required">المبلغ</label>
            <Input
              variant="number"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
          </div>
          <div className="trs-form-field">
            <label className="trs-form-label required">العملة</label>
            <Select
              value={currency}
              onChange={e => setCurrency(e.target.value as PalestinianCurrency)}
              options={[
                { value: "ILS", label: "₪ شيكل (ILS)" },
                { value: "JOD", label: "د.أ دينار أردني (JOD)" },
                { value: "USD", label: "$ دولار أمريكي (USD)" },
              ]}
            />
          </div>
          <div className="trs-form-field">
            <label className="trs-form-label required">
              تاريخ الشيك
              <Tooltip content="التاريخ المكتوب على الشيك." side="top">
                <span className="trs-help-icon">?</span>
              </Tooltip>
            </label>
            <Input
              variant="date"
              value={instrumentDate}
              onChange={e => setInstrumentDate(e.target.value)}
            />
          </div>
          <div className="trs-form-field">
            <label className="trs-form-label required">
              تاريخ الاستحقاق
              <Tooltip content="الشيك الآجل هو شيك بتاريخ مستقبلي. لا يمكن صرفه قبل هذا التاريخ." side="top">
                <span className="trs-help-icon">?</span>
              </Tooltip>
            </label>
            <Input
              variant="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
            />
            {dueDateWarning && (
              <span style={{ fontSize: 11.5, color: dueDate < today ? "var(--app-danger)" : "var(--app-warning)", marginTop: 3 }}>
                {dueDateWarning}
              </span>
            )}
          </div>
        </div>
        {currency !== "ILS" && amtNum > 0 && (
          <div style={{ marginTop: 8, fontSize: 12, color: "var(--app-text-muted)" }}>
            يعادل تقريباً ₪{amountInILS.toLocaleString("ar-PS", { maximumFractionDigits: 0 })} (بسعر الصرف الحالي)
          </div>
        )}
      </div>

      {/* Section 3: Drawer */}
      <div className="trs-form-section">
        <div className="trs-form-section-title">بيانات الساحب</div>
        <div className="trs-form-grid">
          <div className="trs-form-field">
            <label className="trs-form-label required">نوع الطرف</label>
            <Select
              value={drawerType}
              onChange={e => setDrawerType(e.target.value as "customer" | "supplier" | "other")}
              options={[
                { value: "customer", label: "زبون" },
                { value: "supplier", label: "مورد" },
                { value: "other",    label: "أخرى" },
              ]}
            />
          </div>
          <div className="trs-form-field">
            <label className="trs-form-label required">الاسم الكامل</label>
            <Input
              placeholder="اسم الساحب أو الشركة"
              value={drawerName}
              onChange={e => setDrawerName(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Section 4: Banking */}
      <div className="trs-form-section">
        <div className="trs-form-section-title">البيانات البنكية</div>
        <div className="trs-form-grid">
          <div className="trs-form-field">
            <label className="trs-form-label required">البنك</label>
            <Select
              value={bankId}
              onChange={e => setBankId(e.target.value)}
              options={PALESTINIAN_BANKS.map(b => ({ value: b.id, label: b.nameAr }))}
            />
          </div>
          <div className="trs-form-field">
            <label className="trs-form-label">اسم الفرع</label>
            <Input
              placeholder="مثال: رام الله - المنارة"
              value={branchName}
              onChange={e => setBranchName(e.target.value)}
            />
          </div>
          <div className="trs-form-field">
            <label className="trs-form-label">رمز الفرع</label>
            <div className={`trs-autofill-wrap${fieldSources.branchCode === "ocr" ? " trs-autofill-input" : ""}`}>
              {sourceTag(fieldSources.branchCode ?? "manual")}
              <Input
                placeholder="3 أرقام"
                value={branchCode}
                maxLength={3}
                onChange={e => { setBranchCode(e.target.value); setFieldSources(p => ({ ...p, branchCode: "confirmed" })); }}
                className={fieldSources.branchCode === "ocr" ? "trs-autofill-input" : ""}
              />
            </div>
          </div>
          <div className="trs-form-field">
            <label className="trs-form-label required">
              رقم الحساب
              <Tooltip content="رقم الحساب المصرفي — 10 إلى 13 رقماً." side="top">
                <span className="trs-help-icon">?</span>
              </Tooltip>
            </label>
            <div className={`trs-autofill-wrap${fieldSources.accountNumber === "ocr" ? "" : ""}`}>
              {sourceTag(fieldSources.accountNumber ?? "manual")}
              <Input
                placeholder="10-13 رقم"
                value={accountNumber}
                onChange={e => { setAccountNumber(e.target.value); setFieldSources(p => ({ ...p, accountNumber: "confirmed" })); }}
                className={fieldSources.accountNumber === "ocr" ? "trs-autofill-input" : ""}
              />
            </div>
          </div>
          <div className="trs-form-field">
            <label className="trs-form-label required">رقم الشيك</label>
            <div className={`trs-autofill-wrap${fieldSources.checkNumber === "ocr" ? "" : ""}`}>
              {sourceTag(fieldSources.checkNumber ?? "manual")}
              <Input
                placeholder="6 أرقام"
                maxLength={6}
                value={checkNumber}
                onChange={e => { setCheckNumber(e.target.value); setFieldSources(p => ({ ...p, checkNumber: "confirmed" })); }}
                className={fieldSources.checkNumber === "ocr" ? "trs-autofill-input" : ""}
              />
            </div>
          </div>
        </div>

        {/* MICR collapsible */}
        <button
          type="button"
          onClick={() => setMicrOpen(o => !o)}
          style={{
            display: "flex", alignItems: "center", gap: 6, marginTop: 12,
            fontSize: 12.5, fontWeight: 700, color: "var(--app-text-muted)",
            background: "none", border: "none", cursor: "pointer", padding: 0,
          }}
        >
          {micrOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          بيانات MICR (للمسح الضوئي)
          <Tooltip content="MICR هو الرمز المطبوع في أسفل الشيك بحبر خاص. يمكن قراءته آلياً." side="top">
            <HelpCircle size={13} style={{ color: "var(--app-text-subtle)" }} />
          </Tooltip>
        </button>

        {micrOpen && (
          <div style={{ marginTop: 10, padding: "12px 14px", background: "var(--app-surface-muted)", borderRadius: "var(--app-radius-sm)", border: "1px solid var(--app-border)" }}>
            <div className="trs-form-field" style={{ marginBottom: 8 }}>
              <label className="trs-form-label">
                السطر الخام (MICR)
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <Input
                  placeholder="⑆031500⑆ 1234567890 ⑉ 000125 ⑈"
                  value={micrRaw}
                  onChange={e => setMicrRaw(e.target.value)}
                  fullWidth
                />
                <Button variant="secondary" size="sm" onClick={handleParseMicr}>
                  تحليل
                </Button>
              </div>
            </div>
            {micrResult && (
              <div style={{ fontSize: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                <div>كود البنك: <strong style={{ fontFamily: "var(--font-mono)" }}>{micrResult.bankCode ?? "—"}</strong></div>
                <div>كود الفرع: <strong style={{ fontFamily: "var(--font-mono)" }}>{micrResult.branchCode ?? "—"}</strong></div>
                <div>رقم الحساب: <strong style={{ fontFamily: "var(--font-mono)" }}>{micrResult.accountNumber ?? "—"}</strong></div>
                <div>رقم الشيك: <strong style={{ fontFamily: "var(--font-mono)" }}>{micrResult.checkNumber ?? "—"}</strong></div>
                {micrResult.warnings.length > 0 && (
                  <div style={{ gridColumn: "span 2", color: "var(--app-warning)", fontSize: 11.5 }}>
                    {micrResult.warnings.map((w, i) => <div key={i}>⚠ {w}</div>)}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section 5: Linked invoices */}
      <div className="trs-form-section">
        <div className="trs-form-section-title">
          <Link2 size={12} /> ربط بالفواتير
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <Input
            placeholder="رقم الفاتورة (مثال: FAT-2401)"
            value={invInput}
            onChange={e => setInvInput(e.target.value)}
            fullWidth
          />
          <Button
            variant="secondary"
            size="sm"
            disabled={!invInput.trim()}
            onClick={() => { if (invInput.trim()) { setLinkedInvoices(p => [...p, invInput.trim()]); setInvInput(""); } }}
          >
            ربط
          </Button>
        </div>
        {linkedInvoices.map(inv => (
          <div key={inv} className="trs-inv-link-row">
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: "#3b5bdb" }}>{inv}</span>
            <Button variant="icon" size="sm" onClick={() => setLinkedInvoices(p => p.filter(i => i !== inv))}>
              <X size={12} />
            </Button>
          </div>
        ))}
        {linkedInvoices.length > 0 && (
          <div className="trs-inv-link-total">
            <span style={{ fontSize: 12.5, fontWeight: 700 }}>الفواتير المرتبطة: {linkedInvoices.length}</span>
            <span style={{ fontSize: 12.5, color: "var(--app-text-muted)" }}>مبلغ الشيك: ₪{(parseFloat(amount) || 0).toLocaleString("ar-PS")}</span>
          </div>
        )}
      </div>

      {/* Section 6: Notes */}
      <div className="trs-form-section">
        <div className="trs-form-section-title">ملاحظات</div>
        <textarea
          style={{ width: "100%", height: 72, padding: "8px 10px", resize: "vertical", fontFamily: "inherit", fontSize: 13, border: "1px solid var(--app-border-strong)", borderRadius: "var(--app-radius-sm)", background: "var(--app-surface)" }}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="ملاحظات اختيارية..."
        />
      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 12, borderTop: "1px solid var(--app-border)" }}>
        <Button variant="secondary" onClick={onClose}>إلغاء</Button>
        <Button
          variant="ghost"
          disabled={!amount || !drawerName || !accountNumber}
          onClick={() => handleSave(true)}
        >
          حفظ كمسودة
        </Button>
        <Button
          variant="primary"
          disabled={!amount || !drawerName || !accountNumber || !checkNumber}
          onClick={() => handleSave(false)}
        >
          حفظ وتقديم ←
        </Button>
      </div>
    </div>
  );
}

// ─── TransferForm ─────────────────────────────────────────────────────────────

interface TransferFormProps {
  direction: InstrumentDirection;
  onDirectionChange: (d: InstrumentDirection) => void;
  onSave: AddInstrumentModalProps["onSave"];
  onClose: () => void;
}

function TransferForm({ direction, onDirectionChange, onSave, onClose }: TransferFormProps) {
  const [amount,         setAmount]         = useState("");
  const [currency,       setCurrency]       = useState<PalestinianCurrency>("ILS");
  const [transferDate,   setTransferDate]   = useState(today);
  const [partyName,      setPartyName]      = useState("");
  const [bankId,         setBankId]         = useState<string>(PALESTINIAN_BANKS[0].id);
  const [iban,           setIban]           = useState("");
  const [reference,      setReference]      = useState("");
  const [notes,          setNotes]          = useState("");
  const [linkedInvoices, setLinkedInvoices] = useState<string[]>([]);
  const [invInput,       setInvInput]       = useState("");

  const selectedBank = PALESTINIAN_BANKS.find(b => b.id === bankId)!;

  const handleSave = (asDraft: boolean) => {
    if (!amount || !partyName) return;
    const numAmount = parseFloat(amount);
    onSave({
      type: "bank_transfer",
      direction,
      status: asDraft ? "draft" : "pending",
      amount: numAmount,
      currency,
      amountInILS: numAmount * (CURRENCY_RATES[currency] ?? 1),
      instrumentDate: toDDMMYYYY(transferDate),
      dueDate: toDDMMYYYY(transferDate),
      drawerName: direction === "outgoing" ? "أطلس لإدارة الأعمال" : partyName,
      drawerType: direction === "incoming" ? "other" : "other",
      payeeName: direction === "outgoing" ? partyName : "أطلس لإدارة الأعمال",
      bankId,
      bankName: selectedBank.nameAr,
      accountNumber: iban.slice(-10) || "0000000000",
      iban: iban || undefined,
      swiftCode: selectedBank.swift,
      micrVerified: false,
      referenceNumber: reference || undefined,
      linkedInvoiceIds: linkedInvoices,
      linkedPaymentIds: [],
      notes: notes || undefined,
      createdBy: "admin",
    }, asDraft);
  };

  return (
    <div>
      {/* Direction */}
      <div className="trs-form-section">
        <div className="trs-form-section-title">اتجاه التحويل</div>
        <div style={{ display: "flex", gap: 8 }}>
          {(["incoming", "outgoing"] as const).map(d => (
            <button
              key={d}
              type="button"
              onClick={() => onDirectionChange(d)}
              style={{
                flex: 1, padding: "8px 0", borderRadius: "var(--app-radius-sm)",
                border: `2px solid ${direction === d ? "#3b5bdb" : "var(--app-border-strong)"}`,
                background: direction === d ? "#eef2ff" : "var(--app-surface)",
                color: direction === d ? "#3b5bdb" : "var(--app-text-soft)",
                fontWeight: 700, fontSize: 13.5, cursor: "pointer",
              }}
            >
              {d === "incoming" ? "◉ وارد" : "○ صادر"}
            </button>
          ))}
        </div>
      </div>

      {/* Amount & date */}
      <div className="trs-form-section">
        <div className="trs-form-section-title">المبلغ والتاريخ</div>
        <div className="trs-form-grid">
          <div className="trs-form-field">
            <label className="trs-form-label required">المبلغ</label>
            <Input variant="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div className="trs-form-field">
            <label className="trs-form-label required">العملة</label>
            <Select value={currency} onChange={e => setCurrency(e.target.value as PalestinianCurrency)}
              options={[{ value: "ILS", label: "₪ شيكل" }, { value: "JOD", label: "د.أ دينار" }, { value: "USD", label: "$ دولار" }]} />
          </div>
          <div className="trs-form-field" style={{ gridColumn: "span 2" }}>
            <label className="trs-form-label required">تاريخ التحويل</label>
            <Input variant="date" value={transferDate} onChange={e => setTransferDate(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Party */}
      <div className="trs-form-section">
        <div className="trs-form-section-title">{direction === "incoming" ? "من" : "إلى"}</div>
        <div className="trs-form-grid">
          <div className="trs-form-field">
            <label className="trs-form-label required">الاسم</label>
            <Input placeholder="اسم الجهة المُحوِّلة أو المُستقبِلة" value={partyName} onChange={e => setPartyName(e.target.value)} />
          </div>
          <div className="trs-form-field">
            <label className="trs-form-label required">البنك</label>
            <Select value={bankId} onChange={e => setBankId(e.target.value)}
              options={PALESTINIAN_BANKS.map(b => ({ value: b.id, label: b.nameAr }))} />
          </div>
          <div className="trs-form-field" style={{ gridColumn: "span 2" }}>
            <label className="trs-form-label">IBAN</label>
            <Input placeholder="PS92ARAB..." value={iban} onChange={e => setIban(e.target.value)} />
          </div>
          <div className="trs-form-field" style={{ gridColumn: "span 2" }}>
            <label className="trs-form-label">مرجع التحويل / الغرض</label>
            <Input placeholder="رقم مرجع أو وصف الغرض" value={reference} onChange={e => setReference(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Linked invoices */}
      <div className="trs-form-section">
        <div className="trs-form-section-title"><Link2 size={12} /> ربط بالفواتير (اختياري)</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <Input placeholder="رقم الفاتورة" value={invInput} onChange={e => setInvInput(e.target.value)} fullWidth />
          <Button variant="secondary" size="sm" disabled={!invInput.trim()}
            onClick={() => { if (invInput.trim()) { setLinkedInvoices(p => [...p, invInput.trim()]); setInvInput(""); } }}>
            ربط
          </Button>
        </div>
        {linkedInvoices.map(inv => (
          <div key={inv} className="trs-inv-link-row">
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: "#3b5bdb" }}>{inv}</span>
            <Button variant="icon" size="sm" onClick={() => setLinkedInvoices(p => p.filter(i => i !== inv))}>
              <X size={12} />
            </Button>
          </div>
        ))}
      </div>

      {/* Notes */}
      <div className="trs-form-section">
        <div className="trs-form-section-title">ملاحظات</div>
        <textarea
          style={{ width: "100%", height: 60, padding: "8px 10px", resize: "vertical", fontFamily: "inherit", fontSize: 13, border: "1px solid var(--app-border-strong)", borderRadius: "var(--app-radius-sm)", background: "var(--app-surface)" }}
          value={notes} onChange={e => setNotes(e.target.value)} placeholder="ملاحظات اختيارية..." />
      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 12, borderTop: "1px solid var(--app-border)" }}>
        <Button variant="secondary" onClick={onClose}>إلغاء</Button>
        <Button variant="ghost" disabled={!amount || !partyName} onClick={() => handleSave(true)}>حفظ كمسودة</Button>
        <Button variant="primary" disabled={!amount || !partyName} onClick={() => handleSave(false)}>حفظ وتقديم ←</Button>
      </div>
    </div>
  );
}
