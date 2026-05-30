import { useMemo, useState } from "react";
import { Search, LayoutGrid, List, Plus } from "lucide-react";
import { Container } from "../../components/layout/Container";
import { Stack } from "../../components/layout/Stack";
import { Grid } from "../../components/layout/Grid";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { useSettings } from "../../context/SettingsContext";
import { useToast } from "../../components/ui/Toast";
import { useData } from "../../context/DataContext";
import type { Product } from "../../data/types";
import styles from "./PosProducts.module.css";

type ViewMode = "grid" | "table";

function stockStatus(p: Product): "outOfStock" | "low" | "active" {
  if (p.stock === 0) return "outOfStock";
  const threshold = p.reorderThreshold ?? p.minStock ?? 5;
  if (p.stock <= threshold) return "low";
  return "active";
}

const STATUS_VARIANT = {
  active:      "success",
  low:         "warning",
  outOfStock:  "danger",
} as const;

export default function PosProducts() {
  const { t, formatCurrency } = useSettings();
  const tc = t.posProducts;
  const { toast } = useToast();
  const { products, addProduct, updateProduct, lowStockCount, outOfStockCount } = useData();

  const [query, setQuery]           = useState("");
  const [catFilter, setCatFilter]   = useState("");
  const [view, setView]             = useState<ViewMode>("table");
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [newPrice, setNewPrice]     = useState("");

  // Add product form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", price: "", stock: "", unit: "" });

  // Treat isActive=undefined as active (undefined means not explicitly disabled)
  const activeProducts = useMemo(
    () => products.filter((p) => !p.isDeleted && !p.archived && p.isActive !== false),
    [products],
  );

  const categories = useMemo(() => [...new Set(activeProducts.map((p) => p.category))], [activeProducts]);

  const filtered = useMemo(() => {
    return activeProducts.filter((p) => {
      if (catFilter && p.category !== catFilter) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
    });
  }, [activeProducts, query, catFilter]);

  const catCount = categories.length;

  function savePrice() {
    if (!editTarget) return;
    const price = parseFloat(newPrice);
    if (isNaN(price) || price < 0) {
      toast(tc.editPrice.invalidPrice ?? "Invalid price", { type: "error" });
      return;
    }
    updateProduct({ ...editTarget, price });
    setEditTarget(null);
    toast(tc.actions.edit + " ✓", { type: "success" });
  }

  function submitAddProduct() {
    const name = form.name.trim();
    const category = form.category.trim();
    const price = parseFloat(form.price);
    const stock = parseInt(form.stock, 10);
    if (!name || !category) {
      toast("Name and category are required", { type: "error" });
      return;
    }
    if (isNaN(price) || price < 0) {
      toast(tc.editPrice.invalidPrice ?? "Invalid price", { type: "error" });
      return;
    }
    if (isNaN(stock) || stock < 0) {
      toast("Invalid stock quantity", { type: "error" });
      return;
    }
    const id = `PRD-${Date.now()}`;
    addProduct({ id, name, category, price, stock, unit: form.unit.trim() || undefined, isActive: true });
    setShowAddModal(false);
    setForm({ name: "", category: "", price: "", stock: "", unit: "" });
    toast(`${name} added`, { type: "success" });
  }

  return (
    <Container maxWidth="full" padding="md">
      <Stack gap="lg">
        <header className={styles.header}>
          <div>
            <div className={styles.breadcrumb}>{tc.breadcrumb}</div>
            <p className={styles.subtitle}>{tc.pageSubtitle}</p>
          </div>
          <Button variant="primary" onClick={() => setShowAddModal(true)} leftIcon={<Plus size={14} />}>
            {tc.addProduct}
          </Button>
        </header>

        <Grid cols={4} gap="md" responsive>
          <Kpi label={tc.kpi.active}      value={String(activeProducts.length)} sub={tc.kpi.activeSub}      tone="success" />
          <Kpi label={tc.kpi.lowStock}    value={String(lowStockCount)}         sub={tc.kpi.lowStockSub}    tone="warning" />
          <Kpi label={tc.kpi.outOfStock}  value={String(outOfStockCount)}       sub={tc.kpi.outOfStockSub}  tone="danger"  />
          <Kpi label={tc.kpi.categories}  value={String(catCount)}              sub={tc.kpi.categoriesSub}  tone="info"    />
        </Grid>

        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <Input
              variant="search"
              placeholder={tc.searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              leftIcon={<Search size={14} />}
              fullWidth
            />
          </div>
          <select className={styles.filterSelect} value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
            <option value="">{tc.filters.allCategories}</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className={styles.viewToggle}>
            <button type="button" className={`${styles.viewBtn} ${view === "table" ? styles.viewBtnActive : ""}`} onClick={() => setView("table")} aria-label={tc.table}>
              <List size={14} />
            </button>
            <button type="button" className={`${styles.viewBtn} ${view === "grid" ? styles.viewBtnActive : ""}`} onClick={() => setView("grid")} aria-label={tc.grid}>
              <LayoutGrid size={14} />
            </button>
          </div>
        </div>

        {view === "table" ? (
          <div className={`${styles.tableWrap} atlas-table-wrapper`}>
            <table className={`${styles.table} atlas-table`}>
              <colgroup>
                <col />
                <col className="col-w-100" />
                <col className="col-w-110" />
                <col className="col-currency col-w-120" />
                <col className="col-w-90" />
                <col className="col-w-90" />
                <col className="col-actions" />
              </colgroup>
              <thead>
                <tr>
                  <th>{tc.cols.name}</th>
                  <th className="col-code">ID</th>
                  <th>{tc.cols.category}</th>
                  <th className="col-num">{tc.cols.price}</th>
                  <th className="col-num">{tc.cols.stock}</th>
                  <th className="col-badge">{tc.cols.status}</th>
                  <th className="col-actions">{tc.cols.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const st = stockStatus(p);
                  return (
                    <tr key={p.id}>
                      <td><span>{p.name}</span></td>
                      <td className="col-code"><span className={styles.mono}>{p.id}</span></td>
                      <td><span className={styles.catTag}>{p.category}</span></td>
                      <td className={`${styles.numEnd} ${styles.mono} col-num`}>{formatCurrency(p.price)}</td>
                      <td className={`${styles.numEnd} ${styles.mono} col-num ${st === "outOfStock" ? styles.stockZero : st === "low" ? styles.stockLow : ""}`}>{p.stock}</td>
                      <td className="col-badge"><Badge variant={STATUS_VARIANT[st]} size="sm">{tc.status[st]}</Badge></td>
                      <td className="col-actions">
                        <button type="button" className={styles.actionBtn} onClick={() => { setEditTarget(p); setNewPrice(String(p.price)); }}>
                          {tc.actions.edit}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className={styles.empty}>{tc.noData}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.productGrid}>
            {filtered.map((p) => {
              const st = stockStatus(p);
              return (
                <div key={p.id} className={styles.productCard}>
                  <div className={styles.cardName}>{p.name}</div>
                  <div className={styles.cardSku}>{p.id}</div>
                  <div className={styles.cardRow}>
                    <span className={styles.cardPrice}>{formatCurrency(p.price)}</span>
                    <Badge variant={STATUS_VARIANT[st]} size="sm">{tc.status[st]}</Badge>
                  </div>
                  <div className={styles.cardStock}>{tc.cols.stock}: {p.stock}</div>
                  <button type="button" className={styles.cardEditBtn} onClick={() => { setEditTarget(p); setNewPrice(String(p.price)); }}>
                    {tc.actions.edit}
                  </button>
                </div>
              );
            })}
            {filtered.length === 0 && <p className={styles.empty}>{tc.noData}</p>}
          </div>
        )}
      </Stack>

      {editTarget !== null && (
        <Modal
          isOpen
          onClose={() => setEditTarget(null)}
          title={`${tc.editPrice.title} — ${editTarget.name}`}
          size="sm"
          footer={
            <div className={styles.modalFooter}>
              <Button variant="ghost" onClick={() => setEditTarget(null)}>{t.common.cancel}</Button>
              <Button variant="primary" onClick={savePrice}>{tc.editPrice.save}</Button>
            </div>
          }
        >
          <div className={styles.editForm}>
            <label className={styles.editLabel}>{tc.editPrice.label}</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className={styles.editInput}
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              autoFocus
            />
          </div>
        </Modal>
      )}

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={tc.addProduct}
        size="md"
        footer={
          <div className={styles.modalFooter}>
            <Button variant="ghost" onClick={() => setShowAddModal(false)}>{t.common.cancel}</Button>
            <Button variant="primary" onClick={submitAddProduct}>{t.common.save ?? "Save"}</Button>
          </div>
        }
      >
        <div className={styles.addForm}>
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label className={styles.editLabel}>{tc.cols.name} *</label>
              <input
                className={styles.editInput}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="مثال: قهوة عربية 250g"
                autoFocus
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.editLabel}>{tc.cols.category} *</label>
              <input
                list="category-list"
                className={styles.editInput}
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="مثال: مشروبات"
              />
              <datalist id="category-list">
                {categories.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label className={styles.editLabel}>{tc.editPrice.label} *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={styles.editInput}
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.editLabel}>{tc.cols.stock} *</label>
              <input
                type="number"
                min="0"
                className={styles.editInput}
                value={form.stock}
                onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                placeholder="0"
              />
            </div>
          </div>
          <div className={styles.formField}>
            <label className={styles.editLabel}>الوحدة</label>
            <input
              className={styles.editInput}
              value={form.unit}
              onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
              placeholder="مثال: كغ، قطعة، صندوق"
            />
          </div>
        </div>
      </Modal>
    </Container>
  );
}

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: "success" | "info" | "warning" | "neutral" | "danger" }) {
  return (
    <article className={`${styles.kpi} ${styles[`kpi_${tone}`]}`}>
      <span className={styles.kpiLabel}>{label}</span>
      <strong className={styles.kpiValue}>{value}</strong>
      <span className={styles.kpiSub}>{sub}</span>
    </article>
  );
}
