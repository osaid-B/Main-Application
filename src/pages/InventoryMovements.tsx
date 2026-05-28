import { useMemo, useState } from "react";
import { Plus, Download } from "lucide-react";
import { Container } from "../components/layout/Container";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { useSettings } from "../context/SettingsContext";
import { useData } from "../context/DataContext";
import type { StockMovement, MovementType } from "../data/types";
import styles from "./InventoryMovements.module.css";

const PAGE_SIZE = 25;

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export default function InventoryMovements() {
  const { t, formatCurrency, isArabic } = useSettings();
  const tc = t.inventoryMovements;
  const { stockMovements, products, addStockMovement } = useData();

  const today = new Date().toISOString().slice(0, 10);
  const [dateFrom, setDateFrom] = useState(daysAgo(30));
  const [dateTo,   setDateTo]   = useState(today);
  const [typeFilter, setTypeFilter] = useState<"" | MovementType>("");
  const [productFilter, setProductFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<StockMovement | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newForm, setNewForm] = useState({ type: "receive" as MovementType, productId: "", quantity: "", reason: "", reference: "" });

  const filtered = useMemo(() => {
    return stockMovements.filter(m => {
      if (m.date < dateFrom || m.date > dateTo) return false;
      if (typeFilter && m.type !== typeFilter) return false;
      if (productFilter && m.productId !== productFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!(m.reference ?? "").toLowerCase().includes(q) && !m.productName.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [stockMovements, dateFrom, dateTo, typeFilter, productFilter, search]);

  const todayEntries = useMemo(() => stockMovements.filter(m => m.date === today), [stockMovements, today]);
  const todayIn  = useMemo(() => todayEntries.reduce((s, m) => s + m.quantityIn, 0), [todayEntries]);
  const todayOut = useMemo(() => todayEntries.reduce((s, m) => s + m.quantityOut, 0), [todayEntries]);
  const netValue = useMemo(() => {
    return todayEntries.reduce((s, m) => {
      const p = products.find(x => x.id === m.productId);
      const cost = p?.purchasePrice ?? (p?.price ?? 0) * 0.6;
      return s + (m.quantityIn - m.quantityOut) * cost;
    }, 0);
  }, [todayEntries, products]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function submitNew() {
    const qty = parseInt(newForm.quantity, 10);
    if (!newForm.productId || isNaN(qty) || qty <= 0) return;
    const product = products.find(p => p.id === newForm.productId);
    if (!product) return;
    const isIn = newForm.type === "receive";
    const isOut = newForm.type === "issue" || newForm.type === "damage";
    const stockAfter = product.stock + (isIn ? qty : isOut ? -qty : 0);
    const m: StockMovement = {
      id: `MV-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      type: newForm.type,
      quantityIn: isIn ? qty : newForm.type === "adjustment" ? qty : 0,
      quantityOut: isOut ? qty : 0,
      stockAfter: Math.max(0, stockAfter),
      reference: newForm.reference || undefined,
      reason: newForm.reason || undefined,
      date: today,
      createdBy: isArabic ? "المستخدم الحالي" : "Current User",
    };
    addStockMovement(m);
    setShowNewModal(false);
    setNewForm({ type: "receive", productId: "", quantity: "", reason: "", reference: "" });
  }

  function exportCsv() {
    const rows = [
      ["Date", "Product", "Type", "In", "Out", "Stock After", "Reference", "Reason"],
      ...filtered.map(m => [m.date, m.productName, m.type, m.quantityIn, m.quantityOut, m.stockAfter, m.reference ?? "", m.reason ?? ""]),
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `movements-${dateFrom}-${dateTo}.csv`;
    a.click();
  }

  const typeCls: Record<MovementType, string> = {
    receive:    styles.typeReceive,
    issue:      styles.typeIssue,
    adjustment: styles.typeAdjustment,
    damage:     styles.typeDamage,
    transfer:   styles.typeTransfer,
  };

  return (
    <Container maxWidth="full" padding="md">
      <div className={styles.page}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <p className={styles.breadcrumb}>{isArabic ? "المخزون / الحركات" : "Inventory / Movements"}</p>
            <h1 className={styles.title}>{tc.pageTitle}</h1>
            <p className={styles.subtitle}>{tc.pageSubtitle}</p>
          </div>
          <div style={{ display: "flex", gap: "var(--app-space-2)" }}>
            <Button variant="secondary" size="sm" leftIcon={<Download size={13} />} onClick={exportCsv}>{tc.export}</Button>
            <Button variant="primary" size="sm" leftIcon={<Plus size={13} />} onClick={() => setShowNewModal(true)}>{tc.newMovement}</Button>
          </div>
        </div>

        <div className={styles.kpiGrid}>
          <div className={styles.kpi}>
            <span className={styles.kpiLabel}>{tc.todayMovements}</span>
            <strong className={styles.kpiValue}>{todayEntries.length}</strong>
          </div>
          <div className={styles.kpi}>
            <span className={styles.kpiLabel}>{tc.totalIn}</span>
            <strong className={styles.kpiValue} style={{ color: "var(--atlas-green, #16a34a)" }}>{todayIn}</strong>
          </div>
          <div className={styles.kpi}>
            <span className={styles.kpiLabel}>{tc.totalOut}</span>
            <strong className={styles.kpiValue} style={{ color: "var(--atlas-red, #dc2626)" }}>{todayOut}</strong>
          </div>
          <div className={styles.kpi}>
            <span className={styles.kpiLabel}>{tc.netValueChange}</span>
            <strong className={styles.kpiValue}>{formatCurrency(netValue, "ILS")}</strong>
          </div>
        </div>

        <div className={styles.filters}>
          <div className={styles.searchWrap}>
            <input className={styles.filterInput} style={{ width: "100%" }} placeholder={tc.searchPlaceholder}
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <input type="date" className={styles.filterInput} value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
          <input type="date" className={styles.filterInput} value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
          <select className={styles.filterSelect} value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value as "" | MovementType); setPage(1); }}>
            <option value="">{isArabic ? "جميع الأنواع" : "All Types"}</option>
            {(["receive","issue","adjustment","damage","transfer"] as MovementType[]).map(tp => (
              <option key={tp} value={tp}>{tc.types[tp]}</option>
            ))}
          </select>
          <select className={styles.filterSelect} value={productFilter}
            onChange={(e) => { setProductFilter(e.target.value); setPage(1); }}>
            <option value="">{isArabic ? "جميع المنتجات" : "All Products"}</option>
            {products.filter(p => !p.isDeleted).map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{tc.cols.date}</th>
                <th>{tc.cols.product}</th>
                <th>{tc.cols.type}</th>
                <th className={styles.numEnd}>{tc.cols.quantityIn}</th>
                <th className={styles.numEnd}>{tc.cols.quantityOut}</th>
                <th className={styles.numEnd}>{tc.cols.stockAfter}</th>
                <th>{tc.cols.reason}</th>
                <th>{tc.cols.reference}</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map(m => (
                <tr key={m.id} onClick={() => setSelected(m)}>
                  <td>{m.date}</td>
                  <td>{m.productName}</td>
                  <td><span className={`${styles.typeBadge} ${typeCls[m.type]}`}>{tc.types[m.type]}</span></td>
                  <td className={styles.numEnd}>
                    {m.quantityIn > 0 ? <span className={styles.qtyIn}>+{m.quantityIn}</span> : "—"}
                  </td>
                  <td className={styles.numEnd}>
                    {m.quantityOut > 0 ? <span className={styles.qtyOut}>-{m.quantityOut}</span> : "—"}
                  </td>
                  <td className={`${styles.numEnd} ${styles.qtyAfter}`}>{m.stockAfter}</td>
                  <td>{m.reason ?? "—"}</td>
                  <td>{m.reference ?? "—"}</td>
                </tr>
              ))}
              {pageRows.length === 0 && (
                <tr><td colSpan={8} className={styles.empty}>{tc.noMovements}</td></tr>
              )}
            </tbody>
          </table>
          {pageCount > 1 && (
            <div className={styles.pagination}>
              <span>{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length}</span>
              <div className={styles.pageBtns}>
                <button className={styles.pageBtn} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>‹</button>
                {Array.from({ length: Math.min(pageCount, 7) }, (_, i) => i + 1).map(n => (
                  <button key={n} className={`${styles.pageBtn} ${n === page ? styles.pageBtnActive : ""}`} onClick={() => setPage(n)}>{n}</button>
                ))}
                <button className={styles.pageBtn} disabled={page >= pageCount} onClick={() => setPage(p => p + 1)}>›</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Drawer */}
      {selected && (
        <div className={styles.drawer}>
          <div className={styles.drawerHeader}>
            <h3 className={styles.drawerTitle}>{isArabic ? "تفاصيل الحركة" : "Movement Details"}</h3>
            <button className={styles.drawerClose} onClick={() => setSelected(null)}>✕</button>
          </div>
          <div className={styles.drawerBody}>
            {[
              [isArabic ? "التاريخ" : "Date", selected.date],
              [isArabic ? "المنتج" : "Product", selected.productName],
              [isArabic ? "النوع" : "Type", tc.types[selected.type]],
              [isArabic ? "الوارد" : "Qty In",  selected.quantityIn > 0 ? `+${selected.quantityIn}` : "—"],
              [isArabic ? "الصادر" : "Qty Out", selected.quantityOut > 0 ? `-${selected.quantityOut}` : "—"],
              [isArabic ? "الكمية بعد" : "Stock After", selected.stockAfter],
              [isArabic ? "المرجع" : "Reference", selected.reference ?? "—"],
              [isArabic ? "السبب" : "Reason", selected.reason ?? "—"],
              [isArabic ? "بواسطة" : "Created By", selected.createdBy ?? "—"],
            ].map(([k, v]) => (
              <div key={String(k)} className={styles.drawerRow}>
                <span className={styles.drawerKey}>{k}</span>
                <span className={styles.drawerVal}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title={tc.form.title} size="sm"
        footer={
          <div className={styles.modalFooter}>
            <Button variant="ghost" onClick={() => setShowNewModal(false)}>{t.common.cancel}</Button>
            <Button variant="primary" onClick={submitNew}>{t.common.save}</Button>
          </div>
        }
      >
        <div className={styles.formField}>
          <label className={styles.formLabel}>{tc.form.type}</label>
          <select className={styles.formSelect} value={newForm.type}
            onChange={(e) => setNewForm(f => ({ ...f, type: e.target.value as MovementType }))}>
            {(["receive","issue","adjustment","damage"] as MovementType[]).map(tp => (
              <option key={tp} value={tp}>{tc.types[tp]}</option>
            ))}
          </select>
        </div>
        <div className={styles.formField}>
          <label className={styles.formLabel}>{tc.form.product}</label>
          <select className={styles.formSelect} value={newForm.productId}
            onChange={(e) => setNewForm(f => ({ ...f, productId: e.target.value }))}>
            <option value="">{isArabic ? "اختر المنتج..." : "Select product..."}</option>
            {products.filter(p => !p.isDeleted && p.isActive !== false).map(p => (
              <option key={p.id} value={p.id}>{p.name} ({isArabic ? "المخزون" : "Stock"}: {p.stock})</option>
            ))}
          </select>
        </div>
        <div className={styles.formField}>
          <label className={styles.formLabel}>{tc.form.quantity}</label>
          <input type="number" min="1" className={styles.formInput} value={newForm.quantity}
            onChange={(e) => setNewForm(f => ({ ...f, quantity: e.target.value }))} />
        </div>
        <div className={styles.formField}>
          <label className={styles.formLabel}>{tc.form.reason}</label>
          <input className={styles.formInput} value={newForm.reason}
            onChange={(e) => setNewForm(f => ({ ...f, reason: e.target.value }))} />
        </div>
        <div className={styles.formField}>
          <label className={styles.formLabel}>{tc.form.reference}</label>
          <input className={styles.formInput} value={newForm.reference}
            onChange={(e) => setNewForm(f => ({ ...f, reference: e.target.value }))} />
        </div>
      </Modal>
    </Container>
  );
}
