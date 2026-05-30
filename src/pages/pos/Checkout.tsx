import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Barcode,
  Plus,
  Minus,
  ShoppingCart,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Input } from "../../components/ui/Input";
import { useToast } from "../../components/ui/Toast";
import {
  POS_CATEGORIES,
  POS_PRODUCTS,
  LOYALTY_CUSTOMERS,
  type LoyaltyCustomer,
  type PosCategory,
  type PosProduct,
} from "../../data/posMock";
import { PaymentModal } from "../../components/pos/PaymentModal";
import { formatIntegerValue, formatTimeValue } from "../../utils/displayFormatters";
import styles from "./Checkout.module.css";

interface CartLine {
  product: PosProduct;
  qty: number;
}

const TAX_RATE = 0.16;

export default function Checkout() {
  const { toast } = useToast();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [category, setCategory] = useState<PosCategory>("all");
  const [query, setQuery] = useState("");
  const [customer, setCustomer] = useState<LoyaltyCustomer | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [now, setNow] = useState(new Date());
  const [saleId] = useState(() => (9821 + Math.floor(Math.random() * 100)).toString().slice(0, 4));

  // Barcode scanner: captures rapid keystrokes followed by Enter (typical scanner behavior)
  const scanBuffer = useRef("");
  const scanTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const filteredProducts = useMemo(() => {
    return POS_PRODUCTS.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (query) {
        const q = query.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
      }
      return true;
    });
  }, [category, query]);

  function addToCart(p: PosProduct) {
    if (p.stock <= 0) return;
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === p.id);
      if (existing) {
        return prev.map((c) => (c.product.id === p.id ? { ...c, qty: c.qty + 1 } : c));
      }
      return [...prev, { product: p, qty: 1 }];
    });
  }

  // Barcode scanner: listens for rapid digit input + Enter from hardware scanners
  useEffect(() => {
    function handleScan(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.key === "Enter") {
        const code = scanBuffer.current.trim();
        scanBuffer.current = "";
        if (scanTimer.current) clearTimeout(scanTimer.current);

        if (code.length >= 8) {
          const found = POS_PRODUCTS.find((p) => p.barcode === code || p.sku === code);
          if (found) {
            addToCart(found);
            toast(`تمت إضافة: ${found.name}`, { type: "success" });
          } else {
            toast("المنتج غير موجود", { type: "error" });
          }
        }
        return;
      }

      if (e.key.length === 1) {
        scanBuffer.current += e.key;
        if (scanTimer.current) clearTimeout(scanTimer.current);
        scanTimer.current = setTimeout(() => { scanBuffer.current = ""; }, 500);
      }
    }

    window.addEventListener("keydown", handleScan);
    return () => {
      window.removeEventListener("keydown", handleScan);
      if (scanTimer.current) clearTimeout(scanTimer.current);
    };
  }, [toast]);

  function adjustQty(id: string, delta: number) {
    setCart((prev) =>
      prev
        .map((c) => (c.product.id === id ? { ...c, qty: c.qty + delta } : c))
        .filter((c) => c.qty > 0),
    );
  }

  function removeItem(id: string) {
    setCart((prev) => prev.filter((c) => c.product.id !== id));
  }

  function clearCart() {
    setCart([]);
    setCustomer(null);
  }

  function completeSale() {
    clearCart();
    setPaymentOpen(false);
  }

  const totals = useMemo(() => {
    const subtotal = cart.reduce((s, c) => s + c.product.price * c.qty, 0);
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;
    const itemsCount = cart.reduce((s, c) => s + c.qty, 0);
    return { subtotal, tax, total, itemsCount, lines: cart.length };
  }, [cart]);

  const attachWalkInDemo = useCallback(() => {
    setCustomer(LOYALTY_CUSTOMERS[0]);
  }, []);

  // Keyboard shortcuts F1-F12
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "F1") { e.preventDefault(); document.getElementById("pos-search")?.focus(); }
      else if (e.key === "F2") { e.preventDefault(); attachWalkInDemo(); }
      else if (e.key === "F4") { e.preventDefault(); /* hold sale — placeholder */ }
      else if (e.key === "F12") { e.preventDefault(); if (cart.length > 0) setPaymentOpen(true); }
      else if (e.key === "Escape") { setPaymentOpen(false); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cart.length, attachWalkInDemo]);

  const time = formatTimeValue(now, { hour: "2-digit", minute: "2-digit", second: "2-digit" }, "en-GB");

  return (
    <div className={styles.pos}>
      {/* POS top strip */}
      <header className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <strong className={styles.brand}>POS</strong>
          <span className={styles.topMeta}>أحمد قاسم</span>
          <span className={styles.topSep}>·</span>
          <span className={styles.topMeta}>شيفت #142</span>
          <span className={styles.topSep}>·</span>
          <span className={styles.topMeta}>فرع غزة — صندوق 2</span>
        </div>
        <div className={styles.topbarRight}>
          <span className={styles.statusOnline}>
            <span className="status-dot status-dot--green status-dot--pulse" aria-hidden />
            متصل
          </span>
          <span className={styles.clock}>{time}</span>
        </div>
      </header>

      <div className={styles.layout}>
        {/* ─── Cart side ─── */}
        <aside className={styles.cartSide}>
          <header className={styles.cartHeader}>
            <div>
              <h2>السلة الحالية</h2>
              <span className={styles.cartSubId}>POS-{saleId}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={clearCart} disabled={cart.length === 0} leftIcon={<Trash2 size={12} />}>
              إفراغ
            </Button>
          </header>

          <div className={styles.cartStats}>
            <span>{totals.lines} أصناف</span>
            <span>·</span>
            <span>{totals.itemsCount} قطعة</span>
          </div>

          {/* Customer attach */}
          {customer ? (
            <div className={styles.customerChip}>
              <div className={styles.customerChipBody}>
                <strong>{customer.name}</strong>
                <span>{customer.code} · {formatIntegerValue(customer.coins)} عملة</span>
              </div>
              <Badge variant={customer.tier === "platinum" ? "info" : customer.tier === "gold" ? "warning" : "neutral"} size="sm">
                {customer.tier === "platinum" ? "Platinum" : customer.tier === "gold" ? "Gold" : "Silver"}
              </Badge>
              <button type="button" className={styles.customerRemove} onClick={() => setCustomer(null)} aria-label="Detach customer">
                <X size={12} />
              </button>
            </div>
          ) : (
            <button type="button" className={styles.addCustomerBtn} onClick={attachWalkInDemo}>
              <UserPlus size={14} /> إضافة زبون
            </button>
          )}

          {/* Cart items */}
          <ul className={styles.cartList}>
            {cart.length === 0 ? (
              <li className={styles.emptyCart}>
                <ShoppingCart size={42} aria-hidden />
                <strong>السلة فارغة</strong>
                <p>امسح باركود المنتج، أو اضغط على أي بطاقة لإضافتها.</p>
                <span className={styles.emptyHint}>ابدأ بالمسح <kbd>F1</kbd> أو <kbd>F2</kbd></span>
              </li>
            ) : (
              cart.map((line) => (
                <li key={line.product.id} className={styles.cartItem}>
                  <span className={styles.cartItemEmoji} aria-hidden>{line.product.emoji}</span>
                  <div className={styles.cartItemInfo}>
                    <strong>{line.product.name}</strong>
                    <span>{line.product.sku}</span>
                  </div>
                  <div className={styles.qtyCtrls}>
                    <button type="button" onClick={() => adjustQty(line.product.id, -1)} aria-label="Decrease quantity">
                      <Minus size={11} />
                    </button>
                    <strong>{line.qty}</strong>
                    <button type="button" onClick={() => adjustQty(line.product.id, +1)} aria-label="Increase quantity">
                      <Plus size={11} />
                    </button>
                  </div>
                  <div className={styles.cartItemTotal}>
                    <strong>₪{(line.product.price * line.qty).toFixed(2)}</strong>
                    <span>{line.qty} × ₪{line.product.price.toFixed(2)}</span>
                  </div>
                  <button type="button" className={styles.removeBtn} onClick={() => removeItem(line.product.id)} aria-label="Remove">
                    <X size={12} />
                  </button>
                </li>
              ))
            )}
          </ul>

          {/* Totals */}
          {cart.length > 0 && (
            <div className={styles.totals}>
              <div className={styles.totalRow}>
                <span>المجموع الفرعي</span>
                <strong>₪{totals.subtotal.toFixed(2)}</strong>
              </div>
              <div className={styles.totalRow}>
                <span>ضريبة 16%</span>
                <strong>₪{totals.tax.toFixed(2)}</strong>
              </div>
              <div className={styles.totalRowFinal}>
                <span>الإجمالي</span>
                <strong>₪{totals.total.toFixed(2)}</strong>
              </div>
            </div>
          )}

          <button
            type="button"
            className={styles.payBtn}
            disabled={cart.length === 0}
            onClick={() => setPaymentOpen(true)}
          >
            دفع ₪{totals.total.toFixed(2)} <kbd>F12</kbd>
          </button>
        </aside>

        {/* ─── Products side ─── */}
        <main className={styles.productsSide}>
          <div className={styles.searchRow}>
            <div className={styles.searchField}>
              <Input
                id="pos-search"
                variant="search"
                placeholder="ابحث بالاسم أو الباركود…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                fullWidth
              />
              <kbd className={styles.searchKbd}>F1</kbd>
            </div>
            <Button variant="secondary" size="sm" leftIcon={<Barcode size={14} />}>
              مسح <kbd className={styles.btnKbd}>F2</kbd>
            </Button>
          </div>
          <div className={styles.scannerHint}>
            <Barcode size={12} />
            <span>📷 امسح الباركود — يُضاف المنتج تلقائيًا</span>
          </div>

          <div className={styles.cats}>
            {POS_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`${styles.catChip} ${category === c.id ? styles.catActive : ""}`}
                onClick={() => setCategory(c.id)}
              >
                <span>{c.label}</span>
                <span className={styles.catCount}>{c.count}</span>
              </button>
            ))}
          </div>

          <div className={styles.grid}>
            {filteredProducts.map((p) => {
              const oos = p.stock === 0;
              return (
                <button
                  key={p.id}
                  type="button"
                  className={`${styles.prodCard} ${oos ? styles.prodOOS : ""}`}
                  onClick={() => addToCart(p)}
                  disabled={oos}
                >
                  <span className={styles.stockBadge}>{oos ? "نفذ" : p.stock}</span>
                  <span className={styles.prodEmoji} aria-hidden>{p.emoji}</span>
                  <strong className={styles.prodName}>{p.name}</strong>
                  <span className={styles.prodPrice}>₪{p.price.toFixed(2)}</span>
                </button>
              );
            })}
          </div>
        </main>
      </div>

      {/* Bottom hotbar */}
      <footer className={styles.hotbar}>
        <span className={styles.hot}><kbd>F1</kbd> بحث</span>
        <span className={styles.hot}><kbd>F2</kbd> زبون</span>
        <span className={styles.hot}><kbd>F3</kbd> خصم</span>
        <span className={styles.hot}><kbd>F4</kbd> تعليق</span>
        <span className={styles.hot}><kbd>F5</kbd> استدعاء</span>
        <span className={styles.hot}><kbd>F9</kbd> استرجاع</span>
        <span className={styles.hot}><kbd>F12</kbd> دفع</span>
        <span className={styles.hot}><kbd>Esc</kbd> إلغاء</span>
        <span className={styles.shiftInfo}>شيفت #142 · بدأ 06:00 · معاملات اليوم {totals.lines}</span>
      </footer>

      <PaymentModal
        isOpen={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        total={totals.total}
        subtotal={totals.subtotal}
        tax={totals.tax}
        itemsCount={totals.itemsCount}
        customer={customer}
        onAttachCustomer={setCustomer}
        onComplete={completeSale}
      />
    </div>
  );
}
