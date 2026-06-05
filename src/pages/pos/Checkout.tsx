import { useEffect, useMemo, useRef, useState } from "react";
import {
  Barcode,
  Plus,
  Minus,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useToast } from "../../components/ui/Toast";
import { useData } from "../../context/DataContext";
import type { Product } from "../../data/types";
import { PaymentModal } from "../../components/pos/PaymentModal";
import { formatTimeValue } from "../../utils/displayFormatters";
import styles from "./Checkout.module.css";

interface CartLine {
  product: Product;
  qty: number;
}

const BARCODE_TIMEOUT = 80;

const CATEGORY_EMOJI_MAP: Record<string, string> = {
  "مشروبات": "☕",
  "وجبات": "🍽️",
  "حلويات": "🍰",
  "خضروات": "🥦",
  "فواكه": "🍎",
  "ألبان": "🥛",
  "لحوم": "🥩",
  "مخبوزات": "🍞",
  "عصائر": "🧃",
  "بقالة": "🛒",
  "إلكترونيات": "📱",
  "ملابس": "👕",
  "أدوات": "🔧",
  "تنظيف": "🧹",
  "أجهزة": "💻",
  "صحة": "💊",
};

function getCategoryEmoji(category: string): string {
  return CATEGORY_EMOJI_MAP[category] ?? "📦";
}

function productColor(category: string): string {
  const palette = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#14B8A6"];
  let h = 0;
  for (let i = 0; i < category.length; i++) h = category.charCodeAt(i) + ((h << 5) - h);
  return palette[Math.abs(h) % palette.length];
}

const TAX_RATE = 0.16;

export default function Checkout() {
  const { toast } = useToast();
  const { products, deductStockOnSale } = useData();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [category, setCategory] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [now, setNow] = useState(new Date());
  const [saleId] = useState(() => (9821 + Math.floor(Math.random() * 100)).toString().slice(0, 4));
  const [scanFeedback, setScanFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const scanBuffer = useRef("");
  const scanTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const activeProducts = useMemo(
    () => products.filter((p) => !p.isDeleted && !p.archived && p.isActive !== false),
    [products],
  );

  const posCategories = useMemo(() => {
    const cats = [...new Set(activeProducts.map((p) => p.category).filter(Boolean))].sort();
    return cats;
  }, [activeProducts]);

  const filteredProducts = useMemo(() => {
    return activeProducts.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (query) {
        const q = query.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          (p.code ?? "").toLowerCase().includes(q) ||
          (p.barcode ?? "").includes(q)
        );
      }
      return true;
    });
  }, [activeProducts, category, query]);

  const searchResults = useMemo(() => {
    if (!query) return [];
    return filteredProducts.slice(0, 8);
  }, [query, filteredProducts]);

  function showScanFeedback(message: string, type: "success" | "error") {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setScanFeedback({ message, type });
    feedbackTimer.current = setTimeout(() => setScanFeedback(null), 1800);
  }

  function addToCart(p: Product) {
    const available = p.stock ?? 0;
    if (available <= 0) {
      toast(`"${p.name}" نفد المخزون`, { type: "error" });
      return;
    }
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === p.id);
      if (existing) {
        if (existing.qty >= available) {
          toast(`لا يمكن إضافة أكثر من ${available} وحدة من "${p.name}"`, { type: "warning" });
          return prev;
        }
        return prev.map((c) => (c.product.id === p.id ? { ...c, qty: c.qty + 1 } : c));
      }
      return [...prev, { product: p, qty: 1 }];
    });
  }

  // Barcode scanner: captures rapid keystrokes followed by Enter (hardware scanner behavior)
  useEffect(() => {
    function handleScan(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.key === "Enter") {
        const code = scanBuffer.current.trim();
        scanBuffer.current = "";
        if (scanTimer.current) clearTimeout(scanTimer.current);

        if (code.length >= 4) {
          const found = activeProducts.find((p) => p.barcode === code || p.code === code);
          if (found) {
            if ((found.stock ?? 0) <= 0) {
              showScanFeedback(`"${found.name}" نفد المخزون`, "error");
            } else {
              addToCart(found);
              showScanFeedback(`✓ ${found.name}`, "success");
            }
          } else {
            showScanFeedback("باركود غير معروف", "error");
          }
        }
        return;
      }

      if (e.key.length === 1) {
        scanBuffer.current += e.key;
        if (scanTimer.current) clearTimeout(scanTimer.current);
        scanTimer.current = setTimeout(() => { scanBuffer.current = ""; }, BARCODE_TIMEOUT);
      }
    }

    window.addEventListener("keydown", handleScan);
    return () => {
      window.removeEventListener("keydown", handleScan);
      if (scanTimer.current) clearTimeout(scanTimer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProducts]);

  // Close search dropdown on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  function adjustQty(id: string, delta: number) {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.product.id !== id) return c;
          const maxStock = c.product.stock ?? 0;
          const newQty = Math.min(c.qty + delta, maxStock);
          return { ...c, qty: newQty };
        })
        .filter((c) => c.qty > 0),
    );
  }

  function removeItem(id: string) {
    setCart((prev) => prev.filter((c) => c.product.id !== id));
  }

  function clearCart() {
    setCart([]);
  }

  function completeSale() {
    deductStockOnSale(
      cart.map((line) => ({
        productId: line.product.id,
        productName: line.product.name,
        qty: line.qty,
      })),
      `POS-${saleId}`,
    );
    toast("تم تسجيل البيع وتحديث المخزون ✓", { type: "success" });
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

  // Keyboard shortcuts F1-F12
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "F1") { e.preventDefault(); document.getElementById("pos-search")?.focus(); }
      else if (e.key === "F4") { e.preventDefault(); /* hold sale — placeholder */ }
      else if (e.key === "F12") { e.preventDefault(); if (cart.length > 0) setPaymentOpen(true); }
      else if (e.key === "Escape") { setShowDropdown(false); setPaymentOpen(false); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cart.length]);

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
                  {line.product.image ? (
                    <img
                      src={line.product.image}
                      alt=""
                      className={styles.cartItemImg}
                      aria-hidden
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <span
                      className={styles.cartItemEmoji}
                      aria-hidden
                      style={{
                        background: productColor(line.product.category),
                        borderRadius: "6px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: "700",
                        flexShrink: 0,
                      }}
                    >
                      {getCategoryEmoji(line.product.category)}
                    </span>
                  )}
                  <div className={styles.cartItemInfo}>
                    <strong>{line.product.name}</strong>
                    <span>{line.product.code ?? line.product.id}</span>
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
            <div className={styles.searchField} ref={searchRef}>
              <Input
                id="pos-search"
                variant="search"
                placeholder="ابحث بالاسم أو الباركود…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowDropdown(e.target.value.length > 0);
                }}
                onFocus={() => { if (query.length > 0) setShowDropdown(true); }}
                fullWidth
              />
              <kbd className={styles.searchKbd}>F1</kbd>

              {showDropdown && searchResults.length > 0 && (
                <div className={styles.searchDropdown}>
                  {searchResults.map((p) => {
                    const oos = (p.stock ?? 0) === 0;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        className={`${styles.dropdownItem} ${oos ? styles.dropdownItemOos : ""}`}
                        onMouseDown={() => {
                          addToCart(p);
                          setQuery("");
                          setShowDropdown(false);
                        }}
                      >
                        {p.image ? (
                          <img src={p.image} alt="" className={styles.dropdownItemImg} />
                        ) : (
                          <div
                            className={styles.dropdownItemAvatar}
                            style={{ background: productColor(p.category) }}
                            aria-hidden
                          >
                            {getCategoryEmoji(p.category)}
                          </div>
                        )}
                        <div className={styles.dropdownItemInfo}>
                          <span className={styles.dropdownItemName}>{p.name}</span>
                          <span className={styles.dropdownItemMeta}>{p.code ?? p.id} · {p.category}</span>
                        </div>
                        <div className={styles.dropdownItemRight}>
                          <span className={styles.dropdownItemPrice}>₪{p.price.toFixed(2)}</span>
                          {oos && <span className={styles.dropdownItemOosLabel}>نفد</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <Button variant="secondary" size="sm" leftIcon={<Barcode size={14} />}>
              مسح <kbd className={styles.btnKbd}>F2</kbd>
            </Button>
          </div>
          <div className={styles.scannerHint}>
            <Barcode size={12} />
            <span>امسح الباركود — يُضاف المنتج تلقائيًا</span>
          </div>

          <div className={styles.cats}>
            <button
              key="all"
              type="button"
              className={`${styles.catChip} ${category === "all" ? styles.catActive : ""}`}
              onClick={() => setCategory("all")}
            >
              <span>الكل</span>
              <span className={styles.catCount}>{activeProducts.length}</span>
            </button>
            {posCategories.map((c) => (
              <button
                key={c}
                type="button"
                className={`${styles.catChip} ${category === c ? styles.catActive : ""}`}
                onClick={() => setCategory(c)}
              >
                <span>{getCategoryEmoji(c)} {c}</span>
                <span className={styles.catCount}>{activeProducts.filter(p => p.category === c).length}</span>
              </button>
            ))}
          </div>

          <div className={styles.grid}>
            {filteredProducts.map((p) => {
              const stock = p.stock ?? 0;
              const oos = stock === 0;
              const low = !oos && stock <= (p.reorderThreshold ?? p.minStock ?? 5);
              return (
                <button
                  key={p.id}
                  type="button"
                  className={`${styles.prodCard} ${oos ? styles.prodOOS : ""}`}
                  onClick={() => addToCart(p)}
                  disabled={oos}
                >
                  <span
                    className={styles.stockBadge}
                    style={oos ? { background: "#FEE2E2", color: "#DC2626" } : low ? { background: "#FEF3C7", color: "#D97706" } : undefined}
                  >
                    {oos ? "نفد" : stock}
                  </span>
                  {p.image ? (
                    <img src={p.image} alt="" className={styles.prodImg} aria-hidden />
                  ) : (
                    <span
                      className={styles.prodEmoji}
                      aria-hidden
                      style={{
                        background: productColor(p.category),
                        borderRadius: "8px",
                        width: "40px",
                        height: "40px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "20px",
                      }}
                    >
                      {getCategoryEmoji(p.category)}
                    </span>
                  )}
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

      {/* Barcode scan feedback overlay */}
      {scanFeedback !== null && (
        <div className={`${styles.scanFeedback} ${scanFeedback.type === "success" ? styles.scanFeedbackSuccess : styles.scanFeedbackError}`}>
          {scanFeedback.message}
        </div>
      )}

      <PaymentModal
        isOpen={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        total={totals.total}
        subtotal={totals.subtotal}
        tax={totals.tax}
        itemsCount={totals.itemsCount}
        onComplete={completeSale}
      />
    </div>
  );
}
