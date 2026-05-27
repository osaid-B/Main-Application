import { useMemo, useState } from "react";
import { Search, LayoutGrid, List } from "lucide-react";
import { Container } from "../../components/layout/Container";
import { Stack } from "../../components/layout/Stack";
import { Grid } from "../../components/layout/Grid";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { useSettings } from "../../context/SettingsContext";
import { useToast } from "../../components/ui/Toast";
import { POS_PRODUCTS, type PosProduct } from "../../data/posMock";
import styles from "./PosProducts.module.css";

type ViewMode = "grid" | "table";

const LOW_STOCK_THRESHOLD = 25;

function stockStatus(p: PosProduct): "outOfStock" | "low" | "active" {
  if (p.stock === 0) return "outOfStock";
  if (p.stock <= LOW_STOCK_THRESHOLD) return "low";
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

  const [products, setProducts] = useState<PosProduct[]>(POS_PRODUCTS);
  const [query, setQuery]       = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [view, setView]         = useState<ViewMode>("table");
  const [editTarget, setEditTarget] = useState<PosProduct | null>(null);
  const [newPrice, setNewPrice]     = useState("");

  const categories = [...new Set(products.map((p) => p.category))];

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (catFilter && p.category !== catFilter) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    });
  }, [products, query, catFilter]);

  const active     = products.length;
  const lowStock   = products.filter((p) => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD).length;
  const outOfStock = products.filter((p) => p.stock === 0).length;
  const catCount   = categories.length;

  function savePrice() {
    if (!editTarget) return;
    const price = parseFloat(newPrice);
    if (isNaN(price) || price < 0) return;
    setProducts((prev) => prev.map((p) => p.id === editTarget.id ? { ...p, price } : p));
    setEditTarget(null);
    toast(tc.actions.edit + " ✓", { type: "success" });
  }

  return (
    <Container maxWidth="full" padding="md">
      <Stack gap="lg">
        <header className={styles.header}>
          <div>
            <div className={styles.breadcrumb}>{tc.breadcrumb}</div>
            <h1 className={styles.title}>{tc.pageTitle}</h1>
            <p className={styles.subtitle}>{tc.pageSubtitle}</p>
          </div>
        </header>

        <Grid cols={4} gap="md" responsive>
          <Kpi label={tc.kpi.active}      value={String(active)}      sub={tc.kpi.activeSub}      tone="success" />
          <Kpi label={tc.kpi.lowStock}    value={String(lowStock)}    sub={tc.kpi.lowStockSub}    tone="warning" />
          <Kpi label={tc.kpi.outOfStock}  value={String(outOfStock)}  sub={tc.kpi.outOfStockSub}  tone="danger"  />
          <Kpi label={tc.kpi.categories}  value={String(catCount)}    sub={tc.kpi.categoriesSub}  tone="info"    />
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
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{tc.cols.name}</th>
                  <th>{tc.cols.sku}</th>
                  <th>{tc.cols.category}</th>
                  <th className={styles.numEnd}>{tc.cols.price}</th>
                  <th className={styles.numEnd}>{tc.cols.stock}</th>
                  <th>{tc.cols.status}</th>
                  <th>{tc.cols.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const st = stockStatus(p);
                  return (
                    <tr key={p.id}>
                      <td>
                        <div className={styles.nameCell}>
                          <span className={styles.emoji}>{p.emoji}</span>
                          <span>{p.name}</span>
                        </div>
                      </td>
                      <td><span className={styles.mono}>{p.sku}</span></td>
                      <td><span className={styles.catTag}>{p.category}</span></td>
                      <td className={`${styles.numEnd} ${styles.mono}`}>{formatCurrency(p.price)}</td>
                      <td className={`${styles.numEnd} ${styles.mono} ${st === "outOfStock" ? styles.stockZero : st === "low" ? styles.stockLow : ""}`}>{p.stock}</td>
                      <td><Badge variant={STATUS_VARIANT[st]} size="sm">{tc.status[st]}</Badge></td>
                      <td>
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
                  <div className={styles.cardEmoji}>{p.emoji}</div>
                  <div className={styles.cardName}>{p.name}</div>
                  <div className={styles.cardSku}>{p.sku}</div>
                  <div className={styles.cardRow}>
                    <span className={styles.cardPrice}>{formatCurrency(p.price)}</span>
                    <Badge variant={STATUS_VARIANT[st]} size="sm">{tc.status[st]}</Badge>
                  </div>
                  <div className={styles.cardStock}>Stock: {p.stock}</div>
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

      {editTarget && (
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
