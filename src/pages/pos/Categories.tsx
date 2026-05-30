import { useMemo, useState } from "react";
import { ChevronUp, ChevronDown, Plus, Search } from "lucide-react";
import { Container } from "../../components/layout/Container";
import { Stack } from "../../components/layout/Stack";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { useSettings } from "../../context/SettingsContext";
import { useData } from "../../context/DataContext";
import {
  POS_PRODUCT_CATEGORIES as INITIAL_CATS,
  type PosProductCategory,
  type PosCategoryStatus,
} from "../../data/posMock";
import styles from "./Categories.module.css";

export default function Categories() {
  const { t, formatCurrency } = useSettings();
  const tc = t.pos.categories;
  const { products } = useData();

  const [categories, setCategories] = useState<PosProductCategory[]>(INITIAL_CATS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [productQuery, setProductQuery] = useState("");
  const [editing, setEditing] = useState<PosProductCategory | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const selectedCategory = categories.find((c) => c.id === selectedId) ?? null;

  const activeProducts = useMemo(() => products.filter((p) => !p.isDeleted && !p.archived), [products]);

  const categoryProducts = useMemo(() => {
    if (!selectedCategory) return [];
    const catName = selectedCategory.name.toLowerCase();
    return activeProducts.filter((p) => p.category.toLowerCase() === catName);
  }, [selectedCategory, activeProducts]);

  const filteredProducts = useMemo(() => {
    if (!productQuery) return categoryProducts;
    const q = productQuery.toLowerCase();
    return categoryProducts.filter((p) =>
      p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q),
    );
  }, [categoryProducts, productQuery]);

  const topLevel = categories.filter((c) => !c.parentId);

  function parentName(parentId?: string) {
    if (!parentId) return null;
    return categories.find((c) => c.id === parentId)?.name ?? null;
  }

  function toggleStatus(id: string) {
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const next: PosCategoryStatus = c.status === "active" ? "inactive" : "active";
        return { ...c, status: next };
      }),
    );
  }

  function moveUp(id: string) {
    setCategories((prev) => {
      const idx = prev.findIndex((c) => c.id === id);
      if (idx <= 0) return prev;
      const arr = [...prev];
      [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
      return arr;
    });
  }

  function moveDown(id: string) {
    setCategories((prev) => {
      const idx = prev.findIndex((c) => c.id === id);
      if (idx >= prev.length - 1) return prev;
      const arr = [...prev];
      [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
      return arr;
    });
  }

  function saveCategory(data: Omit<PosProductCategory, "id" | "productCount" | "sortOrder">) {
    if (editing) {
      setCategories((prev) => prev.map((c) => (c.id === editing.id ? { ...c, ...data } : c)));
      setEditing(null);
    } else {
      const id = `cat-${String(categories.length + 1).padStart(2, "0")}`;
      setCategories((prev) => [...prev, { ...data, id, productCount: 0, sortOrder: prev.length + 1 }]);
      setIsAdding(false);
    }
  }

  return (
    <Container maxWidth="full" padding="md">
      <Stack gap="lg">
        <header className={styles.header}>
          <div>
            <div className={styles.breadcrumb}>{tc.breadcrumb}</div>
            <p className={styles.subtitle}>{tc.pageSubtitle}</p>
          </div>
          <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setIsAdding(true)}>
            {tc.addCategory}
          </Button>
        </header>

        <div className={styles.splitView}>
          {/* Left panel: category list */}
          <aside className={styles.leftPanel}>
            {categories.map((c, idx) => {
              const parent = parentName(c.parentId);
              const isSelected = c.id === selectedId;
              return (
                <div
                  key={c.id}
                  className={`${styles.catRow} ${isSelected ? styles.catRowActive : ""} ${c.parentId ? styles.catRowChild : ""}`}
                  onClick={() => setSelectedId(c.id)}
                >
                  <div className={styles.catRowMain}>
                    {c.parentId && <span className={styles.indent} aria-hidden="true" />}
                    <div className={styles.catCell}>
                      <span className={styles.catName}>{c.name}</span>
                      <span className={styles.catNameAr}>{c.nameAr}</span>
                      {parent && <span className={styles.parentLabel}>{parent}</span>}
                    </div>
                    <Badge variant={c.status === "active" ? "success" : "neutral"} size="sm">
                      {tc.status[c.status]}
                    </Badge>
                    <span className={styles.productCount}>
                      {activeProducts.filter((p) => p.category.toLowerCase() === c.name.toLowerCase()).length}
                    </span>
                  </div>
                  <div className={styles.catRowActions} onClick={(e) => e.stopPropagation()}>
                    <button type="button" className={styles.iconBtn} onClick={() => moveUp(c.id)} aria-label={tc.actions2.moveUp} disabled={idx === 0}>
                      <ChevronUp size={12} />
                    </button>
                    <button type="button" className={styles.iconBtn} onClick={() => moveDown(c.id)} aria-label={tc.actions2.moveDown} disabled={idx === categories.length - 1}>
                      <ChevronDown size={12} />
                    </button>
                    <button type="button" className={styles.iconBtn} onClick={() => setEditing(c)}>
                      {tc.actions.edit}
                    </button>
                    <button
                      type="button"
                      className={`${styles.iconBtn} ${c.status === "active" ? styles.iconBtnDanger : ""}`}
                      onClick={() => toggleStatus(c.id)}
                    >
                      {c.status === "active" ? tc.actions.deactivate : tc.actions.activate}
                    </button>
                  </div>
                </div>
              );
            })}
          </aside>

          {/* Right panel: products in selected category */}
          <section className={styles.rightPanel}>
            {!selectedCategory ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyStateText}>{tc.rightPanel.selectPrompt}</p>
              </div>
            ) : (
              <>
                <div className={styles.rightHeader}>
                  <div>
                    <span className={styles.rightTitle}>{selectedCategory.name}</span>
                    <span className={styles.rightSubtitle}>{tc.rightPanel.title}</span>
                  </div>
                  <Input
                    variant="search"
                    placeholder={tc.searchPlaceholder}
                    value={productQuery}
                    onChange={(e) => setProductQuery(e.target.value)}
                    leftIcon={<Search size={13} />}
                  />
                </div>
                <div className={`${styles.productTableWrap} atlas-table-wrapper`}>
                  <table className={`${styles.table} atlas-table`}>
                    <colgroup>
                      <col />
                      <col className="col-w-100" />
                      <col className="col-currency col-w-120" />
                      <col className="col-w-90" />
                      <col className="col-w-90" />
                    </colgroup>
                    <thead>
                      <tr>
                        <th>{tc.cols.name}</th>
                        <th className="col-code">ID</th>
                        <th className="col-num">{t.common.price}</th>
                        <th className="col-num">{tc.cols.products}</th>
                        <th className="col-badge">{tc.cols.status}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((p) => (
                        <tr key={p.id}>
                          <td><span className={styles.catName}>{p.name}</span></td>
                          <td className="col-code"><span className={styles.mono}>{p.id}</span></td>
                          <td className={`${styles.numEnd} ${styles.mono} col-num`}>{formatCurrency(p.price)}</td>
                          <td className={`${styles.numEnd} ${styles.mono} col-num`}>{p.stock}</td>
                          <td className="col-badge">
                            <Badge variant={p.stock > 0 ? "success" : "danger"} size="sm">
                              {p.stock > 0 ? t.common.active : t.common.inactive}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                      {filteredProducts.length === 0 && (
                        <tr>
                          <td colSpan={5} className={styles.empty}>{tc.rightPanel.noProducts}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        </div>
      </Stack>

      {(isAdding || editing !== null) && (
        <CategoryFormModal
          initial={editing ?? undefined}
          topLevel={topLevel}
          onSave={saveCategory}
          onClose={() => { setIsAdding(false); setEditing(null); }}
        />
      )}
    </Container>
  );
}

function CategoryFormModal({
  initial,
  topLevel,
  onSave,
  onClose,
}: {
  initial?: PosProductCategory;
  topLevel: PosProductCategory[];
  onSave: (data: Omit<PosProductCategory, "id" | "productCount" | "sortOrder">) => void;
  onClose: () => void;
}) {
  const { t } = useSettings();
  const tc = t.pos.categories;

  const [name,     setName]     = useState(initial?.name     ?? "");
  const [nameAr,   setNameAr]   = useState(initial?.nameAr   ?? "");
  const [parentId, setParentId] = useState(initial?.parentId ?? "");
  const [status,   setStatus]   = useState<PosCategoryStatus>(initial?.status ?? "active");

  function handleSave() {
    if (!name.trim()) return;
    onSave({ name: name.trim(), nameAr: nameAr.trim(), parentId: parentId || undefined, status });
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={initial ? tc.form.editTitle : tc.form.createTitle}
      size="sm"
      footer={
        <div className={styles.formFooter}>
          <Button variant="ghost" onClick={onClose}>{t.common.cancel}</Button>
          <Button variant="primary" onClick={handleSave} disabled={!name.trim()}>
            {initial ? t.common.saveChanges : tc.addCategory}
          </Button>
        </div>
      }
    >
      <div className={styles.formGrid}>
        <div className={styles.formRow}>
          <Input label={tc.form.name}   value={name}   onChange={(e) => setName(e.target.value)}   required placeholder="e.g. Beverages" />
          <Input label={tc.form.nameAr} value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="e.g. مشروبات" />
        </div>
        <div className={styles.formRow}>
          <div>
            <label className={styles.formLabel}>{tc.form.parent}</label>
            <select className={styles.formSelect} value={parentId} onChange={(e) => setParentId(e.target.value)}>
              <option value="">{tc.form.none}</option>
              {topLevel.filter((c) => !initial || c.id !== initial.id).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={styles.formLabel}>{tc.form.status}</label>
            <select className={styles.formSelect} value={status} onChange={(e) => setStatus(e.target.value as PosCategoryStatus)}>
              <option value="active">{tc.status.active}</option>
              <option value="inactive">{tc.status.inactive}</option>
            </select>
          </div>
        </div>
      </div>
    </Modal>
  );
}
