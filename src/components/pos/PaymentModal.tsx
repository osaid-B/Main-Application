import { useEffect, useState } from "react";
import { Banknote, Check, CheckCircle2, CreditCard, Sparkles, X, Building2 } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Input } from "../ui/Input";
import type { LoyaltyCustomer } from "../../data/posMock";
import styles from "./PaymentModal.module.css";

type Method = "cash" | "card" | "coins" | "transfer";
type Screen = "method" | "cash" | "coins" | "transfer" | "success";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  subtotal: number;
  tax: number;
  itemsCount: number;
  customer: LoyaltyCustomer | null;
  onAttachCustomer: (c: LoyaltyCustomer) => void;
  onComplete: () => void;
}

const QUICK_CASH = [15, 20, 50, 100];

/**
 * Atlas POS Payment Modal — multi-screen flow:
 *  method -> cash | coins | transfer -> success
 */
export function PaymentModal({
  isOpen, onClose, total, subtotal, tax, itemsCount, customer, onComplete,
}: Props) {
  const [screen, setScreen] = useState<Screen>("method");
  const [method, setMethod] = useState<Method | null>(null);
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [coinsToRedeem, setCoinsToRedeem] = useState<number>(0);
  const [transferRef, setTransferRef] = useState("");

  useEffect(() => {
    if (isOpen) {
      setScreen("method"); setMethod(null);
      setCashReceived(0); setCoinsToRedeem(0); setTransferRef("");
    }
  }, [isOpen]);

  function go(m: Method) {
    setMethod(m);
    if (m === "cash")     setScreen("cash");
    else if (m === "coins")    setScreen("coins");
    else if (m === "transfer") setScreen("transfer");
    else                       setScreen("success"); // card auto-success in demo
  }

  function complete() {
    setScreen("success");
  }

  function done() {
    onComplete();
  }

  const change = Math.max(0, cashReceived - total);
  const maxCoins = customer ? customer.coins : 0;
  const coinValue = coinsToRedeem * 0.05;
  const finalTotal = Math.max(0, total - coinValue);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" isDismissible={screen !== "success"}>
      <header className={styles.head}>
        <div>
          <span className={styles.headLabel}>TOTAL DUE</span>
          <strong className={styles.headTotal}>₪{total.toFixed(2)}</strong>
        </div>
        <div className={styles.headMeta}>
          <span>Sale POS-9821</span>
          <span>·</span>
          <span>{itemsCount} items</span>
          <span>·</span>
          <span>Lane 2</span>
        </div>
      </header>

      {/* ─── Screen: METHOD ─── */}
      {screen === "method" && (
        <div className={styles.body}>
          <span className={styles.step}>STEP 1 of 2</span>
          <h2 className={styles.title}>اختر طريقة الدفع</h2>

          <div className={styles.methods}>
            <MethodCard
              icon={<Banknote size={18} />}
              label="Cash"
              hint="DRAWER"
              tone="green"
              selected={method === "cash"}
              onClick={() => setMethod("cash")}
            />
            <MethodCard
              icon={<CreditCard size={18} />}
              label="Card"
              hint="MADA / VISA"
              tone="blue"
              selected={method === "card"}
              onClick={() => setMethod("card")}
            />
            <MethodCard
              icon={<Sparkles size={18} />}
              label="Coins"
              hint={customer ? `${customer.coins.toLocaleString()} available` : "NO CUSTOMER"}
              tone="orange"
              selected={method === "coins"}
              onClick={() => customer && setMethod("coins")}
              disabled={!customer}
            />
            <MethodCard
              icon={<Building2 size={18} />}
              label="Transfer"
              hint="BANK · REF"
              tone="blue"
              selected={method === "transfer"}
              onClick={() => setMethod("transfer")}
            />
          </div>

          <footer className={styles.foot}>
            <Button variant="secondary" size="md" onClick={onClose}>إلغاء</Button>
            <Button variant="primary" size="md" disabled={!method} onClick={() => method && go(method)}>
              متابعة <kbd className={styles.kbd}>↵</kbd>
            </Button>
          </footer>
        </div>
      )}

      {/* ─── Screen: CASH ─── */}
      {screen === "cash" && (
        <div className={styles.body}>
          <span className={styles.step}>STEP 2 of 2 · CASH</span>
          <h2 className={styles.title}>المبلغ المُستلم</h2>

          <Input
            variant="number"
            label="المبلغ المُستلم"
            value={cashReceived || ""}
            onChange={(e) => setCashReceived(Number(e.target.value) || 0)}
            placeholder="0.00"
          />

          <div className={styles.changeBox}>
            <span>المتبقي للزبون</span>
            <strong>₪{change.toFixed(2)}</strong>
          </div>

          <div className={styles.quickRow}>
            <button
              type="button"
              className={`${styles.quickChip} ${cashReceived === total ? styles.quickActive : ""}`}
              onClick={() => setCashReceived(total)}
            >
              ₪{total.toFixed(2)} <span>(تماماً)</span>
            </button>
            {QUICK_CASH.map((amt) => (
              <button
                key={amt}
                type="button"
                className={`${styles.quickChip} ${cashReceived === amt ? styles.quickActive : ""}`}
                onClick={() => setCashReceived(amt)}
              >
                ₪{amt}
              </button>
            ))}
          </div>

          <Summary subtotal={subtotal} tax={tax} total={total} />

          <footer className={styles.foot}>
            <Button variant="secondary" size="md" onClick={() => setScreen("method")}>رجوع</Button>
            <Button
              variant="primary"
              size="md"
              leftIcon={<Check size={14} />}
              disabled={cashReceived < total}
              onClick={complete}
            >
              إتمام البيع
            </Button>
          </footer>
        </div>
      )}

      {/* ─── Screen: COINS ─── */}
      {screen === "coins" && customer && (
        <div className={styles.body}>
          <span className={styles.step}>STEP 2 of 2 · COINS</span>
          <h2 className={styles.title}>استبدال العملات</h2>

          <div className={styles.balanceBox}>
            <span>الرصيد المتاح</span>
            <strong>{customer.coins.toLocaleString()} <em>عملة</em></strong>
          </div>

          <div className={styles.sliderWrap}>
            <input
              type="range"
              min={0}
              max={maxCoins}
              step={50}
              value={coinsToRedeem}
              onChange={(e) => setCoinsToRedeem(Number(e.target.value))}
              className={styles.slider}
              aria-label="Coins to redeem"
            />
            <div className={styles.sliderTicks}>
              <span>0</span>
              <span>{Math.floor(maxCoins / 2).toLocaleString()}</span>
              <span>{maxCoins.toLocaleString()}</span>
            </div>
          </div>

          <div className={styles.quickRow}>
            {[100, 250, 500, 750, maxCoins].map((amt, i) => (
              <button
                key={i}
                type="button"
                className={`${styles.quickChip} ${coinsToRedeem === amt ? styles.quickActive : ""}`}
                onClick={() => setCoinsToRedeem(Math.min(amt, maxCoins))}
                disabled={amt > maxCoins}
              >
                {amt === maxCoins ? "Max" : amt}
              </button>
            ))}
          </div>

          <p className={styles.coinsCalc}>
            استبدال <strong>{coinsToRedeem.toLocaleString()}</strong> عملة
            → خصم <strong>₪{coinValue.toFixed(2)}</strong>
          </p>

          <div className={styles.finalBox}>
            <span>الإجمالي بعد الخصم</span>
            <strong>₪{finalTotal.toFixed(2)}</strong>
          </div>

          <footer className={styles.foot}>
            <Button variant="secondary" size="md" onClick={() => setScreen("method")}>رجوع</Button>
            <Button variant="primary" size="md" leftIcon={<Check size={14} />} onClick={complete}>
              إتمام البيع
            </Button>
          </footer>
        </div>
      )}

      {/* ─── Screen: TRANSFER ─── */}
      {screen === "transfer" && (
        <div className={styles.body}>
          <span className={styles.step}>STEP 2 of 2 · TRANSFER</span>
          <h2 className={styles.title}>تحويل بنكي</h2>

          <Summary subtotal={subtotal} tax={tax} total={total} />

          <Input label="حساب التحويل" placeholder="بنك فلسطين — حساب رئيسي" />
          <Input
            label="رقم المرجع"
            value={transferRef}
            onChange={(e) => setTransferRef(e.target.value)}
            placeholder="مثلاً: REF-998421"
            required
          />
          <Input variant="date" label="تاريخ التحويل" />

          <div className={styles.warning}>
            ستُسجَّل الفاتورة كـ "بانتظار التأكيد" حتى يتم التحقق من التحويل.
          </div>

          <footer className={styles.foot}>
            <Button variant="secondary" size="md" onClick={() => setScreen("method")}>رجوع</Button>
            <Button variant="primary" size="md" disabled={!transferRef} onClick={complete}>
              إتمام البيع
            </Button>
          </footer>
        </div>
      )}

      {/* ─── Screen: SUCCESS ─── */}
      {screen === "success" && (
        <div className={`${styles.body} ${styles.successBody}`}>
          <div className={styles.successCheck} aria-hidden>
            <CheckCircle2 size={48} />
          </div>
          <h2 className={styles.successTitle}>تم الدفع بنجاح</h2>
          <p className={styles.successSub}>شكراً — اكتملت المعاملة.</p>

          <div className={styles.successDetails}>
            <Row label="الفاتورة"  value="POS-9821" mono />
            <Row label="الطريقة"   value={method === "cash" ? "نقد" : method === "card" ? "بطاقة" : method === "coins" ? "عملات + نقد" : "تحويل"} />
            <Row label="المدفوع"   value={`₪${(method === "cash" ? cashReceived : finalTotal).toFixed(2)}`} mono />
            {method === "cash" && change > 0 && (
              <Row label="الباقي" value={`₪${change.toFixed(2)}`} mono tone="success" />
            )}
            {method === "coins" && coinsToRedeem > 0 && (
              <Row label="عملات مُستبدلة" value={coinsToRedeem.toLocaleString()} mono />
            )}
          </div>

          <div className={styles.successActions}>
            <Button variant="secondary" size="md">طباعة الفاتورة</Button>
            <Button variant="secondary" size="md">إرسال WhatsApp</Button>
          </div>

          <Button variant="primary" size="md" onClick={done} className={styles.newSaleBtn}>
            بيع جديد
          </Button>
          <Badge variant="success" size="sm">+{Math.floor(total * 4)} عملة مُكتسبة</Badge>
        </div>
      )}
    </Modal>
  );
}

function MethodCard({
  icon, label, hint, tone, selected, onClick, disabled,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  tone: "green" | "blue" | "orange";
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`${styles.methodCard} ${styles[`tone_${tone}`]} ${selected ? styles.methodSelected : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className={styles.methodIcon}>{icon}</span>
      <strong>{label}</strong>
      <span className={styles.methodHint}>{hint}</span>
      {selected && (
        <span className={styles.methodCheck} aria-hidden>
          <Check size={11} />
        </span>
      )}
    </button>
  );
}

function Summary({ subtotal, tax, total }: { subtotal: number; tax: number; total: number }) {
  return (
    <div className={styles.summary}>
      <div className={styles.summaryRow}><span>المجموع الفرعي</span><strong>₪{subtotal.toFixed(2)}</strong></div>
      <div className={styles.summaryRow}><span>VAT 16%</span><strong>₪{tax.toFixed(2)}</strong></div>
      <div className={styles.summaryRowFinal}><span>الإجمالي</span><strong>₪{total.toFixed(2)}</strong></div>
    </div>
  );
}

function Row({ label, value, mono, tone }: { label: string; value: string; mono?: boolean; tone?: "success" }) {
  return (
    <div className={styles.successRow}>
      <span>{label}</span>
      <strong className={`${mono ? styles.mono : ""} ${tone === "success" ? styles.toneSuccess : ""}`}>{value}</strong>
    </div>
  );
}

// Tiny X-import keeper so linter doesn't whine (we use X inside JSX below)
void X;
