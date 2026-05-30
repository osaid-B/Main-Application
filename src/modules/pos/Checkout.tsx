import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { POS_PRODUCTS, POS_CATEGORIES } from "../../data/posMock";
import type { PosProduct } from "../../data/posMock";
import { useSettings } from "../../context/SettingsContext";

interface CartItem {
  product: PosProduct;
  qty: number;
}

export default function Checkout() {
  const { formatCurrency } = useSettings();
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [payMethod, setPayMethod] = useState<"cash" | "card" | "wallet">("cash");
  const [cashGiven, setCashGiven] = useState("");

  const filtered = useMemo(() => {
    return POS_PRODUCTS.filter((p) => {
      if (selectedCat !== "all" && p.category !== selectedCat) return false;
      if (search) {
        const q = search.toLowerCase();
        return p.name.toLowerCase().includes(q) || (p.barcode ?? "").includes(q);
      }
      return true;
    });
  }, [search, selectedCat]);

  function addToCart(product: PosProduct) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing)
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i
        );
      return [...prev, { product, qty: 1 }];
    });
  }

  function changeQty(id: string, delta: number) {
    setCart((prev) => {
      const updated = prev.map((i) =>
        i.product.id === id ? { ...i, qty: i.qty + delta } : i
      );
      return updated.filter((i) => i.qty > 0);
    });
  }

  function removeFromCart(id: string) {
    setCart((prev) => prev.filter((i) => i.product.id !== id));
  }

  const subtotal = useMemo(
    () => cart.reduce((s, i) => s + i.product.price * i.qty, 0),
    [cart]
  );
  const tax = useMemo(() => subtotal * 0.16, [subtotal]);
  const total = useMemo(() => subtotal + tax, [subtotal, tax]);
  const change = useMemo(() => {
    const given = parseFloat(cashGiven);
    return isNaN(given) ? 0 : given - total;
  }, [cashGiven, total]);

  function completeSale() {
    if (cart.length === 0) return;
    alert("تم إتمام البيع بنجاح! ✅");
    setCart([]);
    setCashGiven("");
  }

  const categories = [
    { id: "all", label: "الكل" },
    ...POS_CATEGORIES.filter((c) => c.id !== "all").map((c) => ({
      id: c.id,
      label: c.label,
    })),
  ];

  return (
    <div className="module-pos checkout-layout" style={{ height: "calc(100vh - 52px)" }}>
      {/* Product Browser */}
      <div className="checkout-products">
        <div className="product-search-bar">
          <span
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--color-text-muted)",
              pointerEvents: "none",
              display: "flex",
            }}
          >
            <Search size={16} />
          </span>
          <input
            className="ds-input"
            placeholder="بحث عن منتج بالاسم أو الباركود..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingRight: 40, fontSize: 14, padding: "11px 40px 11px 14px" }}
          />
        </div>

        <div className="category-pills">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`category-pill${selectedCat === c.id ? " category-pill--active" : ""}`}
              onClick={() => setSelectedCat(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="products-grid">
          {filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              className="product-card"
              onClick={() => addToCart(p)}
            >
              <div className="product-card__name">
                {p.emoji && (
                  <span style={{ marginLeft: 4 }}>{p.emoji}</span>
                )}
                {p.name}
              </div>
              <div>
                <div className="product-card__price">{formatCurrency(p.price)}</div>
                <div className="product-card__stock">مخزون: {p.stock}</div>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div
              style={{
                gridColumn: "1/-1",
                textAlign: "center",
                padding: "60px",
                color: "var(--color-text-muted)",
                fontFamily: "Cairo, sans-serif",
              }}
            >
              لا توجد منتجات
            </div>
          )}
        </div>
      </div>

      {/* Cart */}
      <div className="checkout-cart">
        <div className="cart-header">
          <span className="cart-title">السلة</span>
          <span className="ds-badge ds-badge--neutral">{cart.length} عنصر</span>
        </div>

        <div className="cart-items">
          {cart.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "40px 20px",
                color: "var(--color-text-muted)",
                fontFamily: "Cairo, sans-serif",
                fontSize: 13,
              }}
            >
              أضف منتجات من القائمة
            </div>
          )}
          {cart.map((item) => (
            <div key={item.product.id} className="cart-item">
              <div className="cart-item__name">{item.product.name}</div>
              <div className="cart-item__qty-ctrl">
                <button
                  type="button"
                  className="qty-btn"
                  onClick={() => changeQty(item.product.id, -1)}
                >
                  −
                </button>
                <span
                  style={{
                    fontFamily: "Inter, monospace",
                    fontWeight: 600,
                    minWidth: 20,
                    textAlign: "center",
                  }}
                >
                  {item.qty}
                </span>
                <button
                  type="button"
                  className="qty-btn"
                  onClick={() => changeQty(item.product.id, 1)}
                >
                  +
                </button>
              </div>
              <div className="cart-item__total">
                {formatCurrency(item.product.price * item.qty)}
              </div>
              <button
                type="button"
                className="ds-btn ds-btn--ghost ds-btn--icon"
                onClick={() => removeFromCart(item.product.id)}
                style={{ color: "var(--color-danger)", marginRight: 4 }}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <div className="cart-summary-row">
            <span>المجموع</span>
            <span className="amount">{formatCurrency(subtotal)}</span>
          </div>
          <div className="cart-summary-row">
            <span>ضريبة القيمة المضافة ١٦٪</span>
            <span className="amount">{formatCurrency(tax)}</span>
          </div>
          <div className="cart-summary-row total">
            <span>الإجمالي</span>
            <span className="amount">{formatCurrency(total)}</span>
          </div>
        </div>

        <div className="payment-methods">
          {(["cash", "card", "wallet"] as const).map((m) => (
            <button
              key={m}
              type="button"
              className={`payment-method-btn${payMethod === m ? " payment-method-btn--active" : ""}`}
              onClick={() => setPayMethod(m)}
            >
              {m === "cash" ? "نقداً" : m === "card" ? "بطاقة" : "محفظة"}
            </button>
          ))}
        </div>

        {payMethod === "cash" && (
          <div style={{ padding: "0 var(--space-5) var(--space-3)" }}>
            <label
              style={{
                fontSize: 12,
                color: "var(--color-text-muted)",
                fontFamily: "Cairo, sans-serif",
                display: "block",
                marginBottom: 6,
              }}
            >
              المبلغ المدفوع
            </label>
            <input
              className="ds-input"
              type="number"
              placeholder="0.00"
              value={cashGiven}
              onChange={(e) => setCashGiven(e.target.value)}
              style={{ marginBottom: 8 }}
            />
            {parseFloat(cashGiven) > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 14,
                  fontWeight: 700,
                  color:
                    change >= 0
                      ? "var(--color-success)"
                      : "var(--color-danger)",
                  fontFamily: "Cairo, sans-serif",
                }}
              >
                <span>الباقي</span>
                <span style={{ fontFamily: "Inter, monospace" }}>
                  {formatCurrency(Math.abs(change))}
                </span>
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          className="checkout-complete-btn"
          onClick={completeSale}
          disabled={cart.length === 0}
        >
          إتمام البيع
        </button>
        <div
          style={{
            textAlign: "center",
            paddingBottom: "var(--space-3)",
          }}
        >
          <button
            type="button"
            className="ds-btn ds-btn--ghost ds-btn--sm"
            onClick={() => setCart([])}
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
