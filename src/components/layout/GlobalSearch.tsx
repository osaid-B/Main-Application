import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { ChevronRight, FileText, Package, ShoppingCart, Truck, User, Users, Wallet, type LucideIcon } from "lucide-react";
import { SearchBox } from "../ui/SearchBox";
import { useData } from "../../context/DataContext";
import { useSettings } from "../../context/SettingsContext";
import styles from "./GlobalSearch.module.css";

const MAX_PER_GROUP = 5;

type SearchItem = { id: string; label: string; sub?: string; path: string };
type SearchGroup = { label: string; icon: LucideIcon; items: SearchItem[] };

export default function GlobalSearch() {
  const navigate = useNavigate();
  const { isArabic } = useSettings();
  const { customers, suppliers, employees, invoices, expenses, payments, products } = useData();

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const q = query.trim().slice(0, 60).toLowerCase();

  // ── Search results ─────────────────────────────────────────
  const groups = useMemo((): SearchGroup[] => {
    if (q.length < 1) return [];
    const out: SearchGroup[] = [];

    const matchCust = customers
      .filter(c => (c.name + c.code + c.phone + c.email).toLowerCase().includes(q))
      .slice(0, MAX_PER_GROUP);
    if (matchCust.length) out.push({
      label: isArabic ? "العملاء" : "Customers",
      icon: Users,
      items: matchCust.map(c => ({ id: c.id, label: c.name, sub: c.code ?? c.phone, path: "/customers" })),
    });

    const matchSupp = suppliers
      .filter(s => (s.name + s.phone + s.email).toLowerCase().includes(q))
      .slice(0, MAX_PER_GROUP);
    if (matchSupp.length) out.push({
      label: isArabic ? "الموردون" : "Suppliers",
      icon: Truck,
      items: matchSupp.map(s => ({ id: s.id, label: s.name, sub: s.phone, path: "/suppliers" })),
    });

    const matchEmp = employees
      .filter(e => (e.name + e.phone + e.nationalId).toLowerCase().includes(q))
      .slice(0, MAX_PER_GROUP);
    if (matchEmp.length) out.push({
      label: isArabic ? "الموظفون" : "Employees",
      icon: User,
      items: matchEmp.map(e => ({ id: e.id, label: e.name, sub: e.phone, path: "/employees" })),
    });

    const matchProd = products
      .filter(p => (p.name + p.code + p.barcode + p.category).toLowerCase().includes(q))
      .slice(0, MAX_PER_GROUP);
    if (matchProd.length) out.push({
      label: isArabic ? "المنتجات" : "Products",
      icon: Package,
      items: matchProd.map(p => ({ id: p.id, label: p.name, sub: p.code ?? p.category, path: "/pos/products" })),
    });

    const matchInv = invoices
      .filter(inv => {
        const custName = customers.find(c => c.id === inv.customerId)?.name ?? "";
        return (inv.id + custName).toLowerCase().includes(q);
      })
      .slice(0, MAX_PER_GROUP);
    if (matchInv.length) out.push({
      label: isArabic ? "الفواتير" : "Invoices",
      icon: FileText,
      items: matchInv.map(inv => ({
        id: inv.id,
        label: customers.find(c => c.id === inv.customerId)?.name ?? inv.id,
        sub: inv.id,
        path: `/invoices?highlight=${inv.id}`,
      })),
    });

    const matchPay = payments
      .filter(p => (p.customerName + p.id + p.referenceNumber + p.invoiceId).toLowerCase().includes(q))
      .slice(0, MAX_PER_GROUP);
    if (matchPay.length) out.push({
      label: isArabic ? "المدفوعات" : "Payments",
      icon: Wallet,
      items: matchPay.map(p => ({ id: p.id, label: p.customerName ?? p.id, sub: p.referenceNumber ?? p.invoiceId, path: "/payments" })),
    });

    const matchExp = expenses
      .filter(e => ((e.description ?? "") + (e.vendor ?? "") + (e.payee ?? "") + e.category).toLowerCase().includes(q))
      .slice(0, MAX_PER_GROUP);
    if (matchExp.length) out.push({
      label: isArabic ? "المصروفات" : "Expenses",
      icon: ShoppingCart,
      items: matchExp.map(e => ({ id: e.id, label: e.description ?? e.category, sub: e.vendor ?? e.payee, path: "/expenses" })),
    });

    return out;
  }, [q, customers, suppliers, employees, invoices, expenses, payments, products, isArabic]);

  const flatItems = useMemo(() => groups.flatMap(g => g.items), [groups]);
  const totalResults = flatItems.length;

  // ── Dropdown position ──────────────────────────────────────
  useEffect(() => {
    if (!open || !wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: "fixed",
      top: rect.bottom + 6,
      insetInlineStart: rect.left,
      width: Math.max(rect.width, 420),
      zIndex: 200,
    });
  }, [open]);

  // ── Close on outside click / Escape ────────────────────────
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); }
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const handleSelect = useCallback((path: string) => {
    navigate(path);
    setOpen(false);
    setQuery("");
  }, [navigate]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      setActiveIdx(i => Math.min(i + 1, totalResults - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flatItems[activeIdx]) handleSelect(flatItems[activeIdx].path);
    }
  }

  let flatOffset = 0;

  return (
    <div className={styles.wrapper} ref={wrapRef}>
      <SearchBox
        ref={inputRef}
        value={query}
        onChange={e => {
          setQuery(e.target.value);
          setActiveIdx(0);
          setOpen(true);
        }}
        onFocus={() => { if (q.length >= 1 || query.trim().length >= 1) setOpen(true); }}
        onKeyDown={handleKeyDown}
        placeholder={isArabic ? "ابحث عن عميل، فاتورة، مورد، موظف، منتج..." : "Search customers, invoices, suppliers, employees..."}
        fullWidth
      />

      {open && totalResults > 0 && createPortal(
        <div className={styles.dropdown} style={dropdownStyle} role="listbox">
          {groups.map(group => {
            const Icon = group.icon;
            const groupStart = flatOffset;
            flatOffset += group.items.length;
            return (
              <div key={group.label} className={styles.group}>
                <div className={styles.groupLabel}>
                  <Icon size={12} aria-hidden />
                  <span>{group.label}</span>
                </div>
                {group.items.map((item, localIdx) => {
                  const globalIdx = groupStart + localIdx;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="option"
                      aria-selected={activeIdx === globalIdx}
                      className={`${styles.result} ${activeIdx === globalIdx ? styles.resultActive : ""}`}
                      onClick={() => handleSelect(item.path)}
                      onMouseEnter={() => setActiveIdx(globalIdx)}
                    >
                      <span className={styles.resultLabel}>{item.label}</span>
                      {item.sub && <span className={styles.resultSub}>{item.sub}</span>}
                      <ChevronRight size={13} className={styles.resultChevron} aria-hidden />
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>,
        document.body
      )}

      {open && q.length >= 1 && totalResults === 0 && createPortal(
        <div className={styles.dropdown} style={dropdownStyle}>
          <div className={styles.empty}>
            {isArabic ? "لا توجد نتائج مطابقة" : "No matching results"}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
