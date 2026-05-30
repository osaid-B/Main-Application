import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download } from "lucide-react";
import { Container } from "../components/layout/Container";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { useSettings } from "../context/SettingsContext";
import { useData } from "../context/DataContext";
import type { MovementType } from "../data/types";
import styles from "./InventoryOverview.module.css";

const CATEGORY_AR: Record<string, string> = {
  "Electronics":   "إلكترونيات",
  "Accessories":   "إكسسوارات",
  "Food":          "مواد غذائية",
  "Beverages":     "مشروبات",
  "Dairy":         "ألبان",
  "Cleaning":      "منظفات",
  "Personal Care": "عناية شخصية",
};
function localizeCat(name: string, isArabic: boolean): string {
  return isArabic ? (CATEGORY_AR[name] ?? name) : name;
}

type StockStatus = "inStock" | "low" | "outOfStock";

function getStatus(stock: number, reorder: number): StockStatus {
  if (stock <= 0) return "outOfStock";
  if (stock <= reorder) return "low";
  return "inStock";
}

export default function InventoryOverview() {
  const { t, formatCurrency, isArabic } = useSettings();
  const tc = t.inventory;
  const { products, productCategories, addStockMovement, updateProduct } = useData();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | StockStatus>("");
  const [adjustTarget, setAdjustTarget] = useState<typeof products[0] | null>(null);
  const [adjForm, setAdjForm] = useState({ newQty: "", reason: "receive" as MovementType, notes: "" });

  const active = useMemo(() => products.filter(p => !p.isDeleted && !p.archived && p.isActive !== false), [products]);

  const filtered = useMemo(() => active.filter(p => {
    if (catFilter && p.category !== catFilter) return false;
    if (statusFilter) {
      const st = getStatus(p.stock, p.reorderThreshold ?? p.minStock ?? 5);
      if (st !== statusFilter) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.id.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [active, catFilter, statusFilter, search]);

  const totalValue = useMemo(() => active.reduce((s, p) => s + p.stock * (p.purchasePrice ?? p.price * 0.6), 0), [active]);
  const lowCount = useMemo(() => active.filter(p => { const r = p.reorderThreshold ?? p.minStock ?? 5; return p.stock > 0 && p.stock <= r; }).length, [active]);
  const outCount = useMemo(() => active.filter(p => p.stock <= 0).length, [active]);

  function openAdjust(p: typeof products[0]) {
    setAdjustTarget(p);
    setAdjForm({ newQty: String(p.stock), reason: "receive", notes: "" });
  }

  function submitAdjust() {
    if (!adjustTarget) return;
    const newQty = parseInt(adjForm.newQty, 10);
    if (isNaN(newQty) || newQty < 0) return;
    const diff = newQty - adjustTarget.stock;
    const movement = {
      id: `MV-${Date.now()}`,
      productId: adjustTarget.id,
      productName: adjustTarget.name,
      type: adjForm.reason,
      quantityIn: diff > 0 ? diff : 0,
      quantityOut: diff < 0 ? -diff : 0,
      stockAfter: newQty,
      reason: adjForm.notes || undefined,
      date: new Date().toISOString().slice(0, 10),
      createdBy: t.inventoryMovements.currentUser,
    };
    addStockMovement(movement);
    updateProduct({ ...adjustTarget, stock: newQty });
    setAdjustTarget(null);
  }

  function exportCsv() {
    const rows = [
      ["Product", "SKU", "Category", "Qty", "Unit", "Stock Value", "Reorder Point"],
      ...filtered.map(p => [
        p.name, p.id, p.category, p.stock, p.unit ?? "",
        (p.stock * (p.purchasePrice ?? p.price * 0.6)).toFixed(2),
        p.reorderThreshold ?? p.minStock ?? 5,
      ]),
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "inventory.csv";
    a.click();
  }

  const statusCls: Record<StockStatus, string> = {
    inStock:    styles.statusInStock,
    low:        styles.statusLow,
    outOfStock: styles.statusOut,
  };

  return (
    <Container maxWidth="full" padding="md">
      <div className={styles.page}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <p className={styles.breadcrumb}>{isArabic ? "المخزون" : "Inventory"}</p>
            <p className={styles.subtitle}>{tc.pageSubtitle}</p>
          </div>
          <div style={{ display: "flex", gap: "var(--app-space-2)" }}>
            <Button variant="secondary" size="sm" leftIcon={<Download size={13} />} onClick={exportCsv}>{tc.export}</Button>
          </div>
        </div>

        <div className={styles.kpiGrid}>
          <div className={`${styles.kpi} ${styles.kpiTotal}`}>
            <span className={styles.kpiLabel}>{isArabic ? "إجمالي المنتجات" : "Total SKUs"}</span>
            <strong className={styles.kpiNum}>{active.length}</strong>
            <span className={styles.kpiSub}>{isArabic ? "منتج نشط" : "active products"}</span>
          </div>
          <div className={`${styles.kpi} ${styles.kpiValue}`}>
            <span className={styles.kpiLabel}>{tc.totalValue}</span>
            <strong className={styles.kpiNum}>{formatCurrency(totalValue, "ILS")}</strong>
          </div>
          <div className={`${styles.kpi} ${styles.kpiLow}`}>
            <span className={styles.kpiLabel}>{tc.statusLow}</span>
            <strong className={styles.kpiNum}>{lowCount}</strong>
          </div>
          <div className={`${styles.kpi} ${styles.kpiOut}`}>
            <span className={styles.kpiLabel}>{tc.statusOut}</span>
            <strong className={styles.kpiNum}>{outCount}</strong>
          </div>
        </div>

        <div className={styles.filters}>
          <div className={styles.searchWrap}>
            <input className={styles.filterInput} style={{ width: "100%" }} placeholder={tc.searchPlaceholder}
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className={styles.filterSelect} value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
            <option value="">{isArabic ? "الفئة" : tc.statusAll}</option>
            {productCategories.map(c => <option key={c} value={c}>{localizeCat(c, isArabic)}</option>)}
          </select>
          <select className={styles.filterSelect} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "" | StockStatus)}>
            <option value="">{isArabic ? "الحالة" : tc.statusAll}</option>
            <option value="inStock">{tc.statusInStock}</option>
            <option value="low">{tc.statusLow}</option>
            <option value="outOfStock">{tc.statusOut}</option>
          </select>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <colgroup>
              <col />
              <col className="col-w-100" />
              <col className="col-w-110" />
              <col className="col-w-90" />
              <col className="col-w-72" />
              <col className="col-currency" />
              <col className="col-w-100" />
              <col className="col-w-90" />
              <col className="col-actions" />
            </colgroup>
            <thead>
              <tr>
                <th>{tc.cols.product}</th>
                <th>{tc.cols.sku}</th>
                <th>{tc.cols.category}</th>
                <th className={styles.numEnd}>{tc.cols.quantity}</th>
                <th>{tc.cols.unit}</th>
                <th className={styles.numEnd}>{tc.cols.stockValue}</th>
                <th className={styles.numEnd}>{tc.cols.reorderPoint}</th>
                <th>{tc.cols.status}</th>
                <th className="col-actions">{tc.cols.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const reorder = p.reorderThreshold ?? p.minStock ?? 5;
                const st = getStatus(p.stock, reorder);
                const val = p.stock * (p.purchasePrice ?? p.price * 0.6);
                return (
                  <tr key={p.id}>
                    <td className={styles.productName}>{p.name}</td>
                    <td><span className={styles.skuChip}>{p.id}</span></td>
                    <td><span className={styles.catChip}>{localizeCat(p.category, isArabic)}</span></td>
                    <td className={`${styles.numEnd} ${styles.mono}`}>{p.stock}</td>
                    <td>{p.unit ?? "—"}</td>
                    <td className={`${styles.numEnd} ${styles.mono}`}>{formatCurrency(val, "ILS")}</td>
                    <td className={`${styles.numEnd} ${styles.mono}`}>{reorder}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${statusCls[st]}`}>
                        {tc.statusBadge[st]}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 2 }}>
                        <button className={styles.actionBtn} onClick={() => openAdjust(p)}>{tc.actions.adjustQty}</button>
                        <button className={styles.actionBtn} onClick={() => navigate(`/inventory/movements?product=${p.id}`)}>{tc.actions.viewMovements}</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className={styles.empty}>{tc.noStock}</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.summaryBar} style={{ borderTop: "2px solid var(--app-border-strong)" }}>
          <span className={styles.summaryLabel}>{tc.totalValue}:</span>
          <span className={styles.summaryValue}>{formatCurrency(totalValue, "ILS")}</span>
        </div>
      </div>

      {adjustTarget && (
        <Modal isOpen onClose={() => setAdjustTarget(null)} title={tc.form.adjustTitle} size="sm"
          footer={
            <div className={styles.modalFooter}>
              <Button variant="ghost" onClick={() => setAdjustTarget(null)}>{t.common.cancel}</Button>
              <Button variant="primary" onClick={submitAdjust}>{t.common.save}</Button>
            </div>
          }
        >
          <div className={styles.formField}>
            <label className={styles.formLabel}>{tc.form.currentQty}</label>
            <input className={styles.formInput} value={adjustTarget.stock} readOnly />
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>{tc.form.newQty}</label>
            <input type="number" min="0" className={styles.formInput} value={adjForm.newQty}
              onChange={(e) => setAdjForm(f => ({ ...f, newQty: e.target.value }))} autoFocus />
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>{tc.form.reason}</label>
            <select className={styles.formSelect} value={adjForm.reason}
              onChange={(e) => setAdjForm(f => ({ ...f, reason: e.target.value as MovementType }))}>
              <option value="receive">{tc.form.reasonReceive}</option>
              <option value="issue">{tc.form.reasonIssue}</option>
              <option value="adjustment">{tc.form.reasonAdjust}</option>
              <option value="damage">{tc.form.reasonDamage}</option>
            </select>
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>{tc.form.notes}</label>
            <input className={styles.formInput} value={adjForm.notes}
              onChange={(e) => setAdjForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
        </Modal>
      )}
    </Container>
  );
}
