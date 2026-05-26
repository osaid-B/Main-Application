import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Container } from "../../components/layout/Container";
import { Stack } from "../../components/layout/Stack";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { useSettings } from "../../context/SettingsContext";
import {
  POS_PRODUCT_CATEGORIES as INITIAL_CATS,
  type PosProductCategory,
  type PosCategoryStatus,
} from "../../data/posMock";
import styles from "./Categories.module.css";

export default function Categories() {
  const { t } = useSettings();
  const tc = t.pos.categories;

  const [categories, setCategories] = useState<PosProductCategory[]>(INITIAL_CATS);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<PosProductCategory | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const filtered = useMemo(() =>
    categories.filter((c) => {
      if (!query) return true;
      const q = query.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.nameAr.includes(q);
    }),
  [categories, query]);

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
            <div className={styles.breadcrumb}>POS · CATEGORIES</div>
            <h1 className={styles.title}>{tc.pageTitle}</h1>
            <p className={styles.subtitle}>{tc.pageSubtitle}</p>
          </div>
          <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setIsAdding(true)}>
            {tc.addCategory}
          </Button>
        </header>

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
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{tc.cols.name}</th>
                <th className={styles.numEnd}>{tc.cols.products}</th>
                <th>{tc.cols.parent}</th>
                <th>{tc.cols.status}</th>
                <th>{tc.cols.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const parent = parentName(c.parentId);
                return (
                  <tr key={c.id}>
                    <td>
                      <div className={styles.catCell}>
                        <span className={styles.catName}>{c.name}</span>
                        <span className={styles.catNameAr}>{c.nameAr}</span>
                      </div>
                    </td>
                    <td className={`${styles.numEnd} ${styles.mono}`}>{c.productCount}</td>
                    <td>
                      {parent ? (
                        <span className={styles.parentBadge}>{parent}</span>
                      ) : (
                        <span style={{ color: "var(--app-text-light)", fontSize: 11 }}>—</span>
                      )}
                    </td>
                    <td>
                      <Badge variant={c.status === "active" ? "success" : "neutral"} size="sm">
                        {tc.status[c.status]}
                      </Badge>
                    </td>
                    <td>
                      <div className={styles.actionBtns}>
                        <button type="button" className={styles.iconBtn} onClick={() => setEditing(c)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className={`${styles.iconBtn} ${c.status === "active" ? styles.iconBtnDanger : ""}`}
                          onClick={() => toggleStatus(c.id)}
                        >
                          {c.status === "active" ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className={styles.empty}>{tc.noCategories}</td>
                </tr>
              )}
            </tbody>
          </table>
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
