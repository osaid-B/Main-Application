import { useMemo, useState } from "react";
import { Search, Plus, Ship } from "lucide-react";
import { Container } from "../../components/layout/Container";
import { Stack } from "../../components/layout/Stack";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { useSettings } from "../../context/SettingsContext";
import { Skeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { useFactory } from "../../context/FactoryContext";
import { useToast } from "../../components/ui/Toast";
import { useLoadingDelay } from "../../hooks/useLoadingDelay";
import type { ImportOrder, ImportOrderStatus } from "../../data/types";
import styles from "./factory.module.css";

const STATUS_VARIANT: Record<ImportOrderStatus, "info" | "warning" | "neutral" | "success" | "danger"> = {
  ordered:    "info",
  "in-transit": "warning",
  customs:    "neutral",
  received:   "success",
  cancelled:  "danger",
};

export default function FactoryImports() {
  const { t, formatCurrency } = useSettings();
  const tc = t.factory.imports;
  const { importOrders: IMPORT_ORDERS, addImportOrder } = useFactory();
  const { toast } = useToast();

  const [query, setQuery]         = useState("");
  const [statusFilter, setFilter] = useState<ImportOrderStatus | "">("");
  const [detailTarget, setDetail] = useState<ImportOrder | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);

  const isLoading = useLoadingDelay();

  const filtered = useMemo(() => {
    return IMPORT_ORDERS.filter((imp) => {
      if (statusFilter && imp.status !== statusFilter) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return imp.id.toLowerCase().includes(q) || imp.supplierName.toLowerCase().includes(q);
    });
  }, [IMPORT_ORDERS, query, statusFilter]);

  return (
    <Container maxWidth="full" padding="md">
      <Stack gap="lg">
        <header className={styles.header}>
          <div>
            <div className={styles.breadcrumb}>{tc.breadcrumb}</div>
            <h1 className={styles.title}>{tc.pageTitle}</h1>
            <p className={styles.subtitle}>{tc.pageSubtitle}</p>
          </div>
          <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setShowNewForm(true)}>{tc.newImport}</Button>
        </header>

        <div className={styles.filterBar}>
          <div className={styles.searchWrap}>
            <Input variant="search" placeholder={tc.searchPlaceholder} value={query} onChange={(e) => setQuery(e.target.value)} leftIcon={<Search size={14} />} fullWidth />
          </div>
          <select className={styles.filterSelect} value={statusFilter} onChange={(e) => setFilter(e.target.value as ImportOrderStatus | "")}>
            <option value="">{tc.filters.allStatuses}</option>
            {(["ordered", "in-transit", "customs", "received", "cancelled"] as ImportOrderStatus[]).map((s) => (
              <option key={s} value={s}>{tc.status[s]}</option>
            ))}
          </select>
        </div>

        <div className={styles.tableWrap}>
          {isLoading ? (
            <Skeleton variant="rect" height={280} />
          ) : filtered.length === 0 ? (
            <EmptyState icon={<Ship size={32} />} title={tc.noData} />
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{tc.cols.importId}</th>
                  <th>{tc.cols.supplier}</th>
                  <th>{tc.cols.origin}</th>
                  <th className={styles.numEnd}>{tc.cols.items}</th>
                  <th className={styles.numEnd}>{tc.cols.totalValue}</th>
                  <th>{tc.cols.currency}</th>
                  <th>{tc.cols.orderDate}</th>
                  <th>{tc.cols.eta}</th>
                  <th>{tc.cols.status}</th>
                  <th>{tc.cols.customsRef}</th>
                  <th>{tc.cols.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((imp) => (
                  <tr key={imp.id}>
                    <td><span className={styles.mono}>{imp.id}</span></td>
                    <td>{imp.supplierName}</td>
                    <td>{imp.origin}</td>
                    <td className={`${styles.numEnd} ${styles.mono}`}>{imp.items.length}</td>
                    <td className={`${styles.numEnd} ${styles.mono}`}>{formatCurrency(imp.totalValue)}</td>
                    <td><span className={styles.tag}>{imp.currency}</span></td>
                    <td className={styles.mono}>{imp.orderDate}</td>
                    <td className={styles.mono}>{imp.estimatedArrival}</td>
                    <td><Badge variant={STATUS_VARIANT[imp.status]} size="sm">{tc.status[imp.status]}</Badge></td>
                    <td className={styles.mono} style={{ fontSize: 11, color: "var(--app-text-muted)" }}>{imp.customsRef ?? "—"}</td>
                    <td>
                      <button type="button" className={styles.actionBtn} onClick={() => setDetail(imp)}>{tc.actions.view}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Stack>

      {showNewForm && (
        <NewImportModal
          onSave={(order) => {
            addImportOrder(order);
            setShowNewForm(false);
            toast(tc.newImport + " ✓", { type: "success" });
          }}
          onClose={() => setShowNewForm(false)}
        />
      )}

      {detailTarget && (
        <Modal isOpen onClose={() => setDetail(null)} title={`${tc.drawer.title} — ${detailTarget.id}`} size="md"
          footer={<Button variant="secondary" onClick={() => setDetail(null)}>{tc.drawer.close}</Button>}>
          <div className={styles.drawerMeta}>
            <span>{tc.cols.supplier}</span><span>{detailTarget.supplierName}</span>
            <span>{tc.cols.origin}</span><span>{detailTarget.origin}</span>
            <span>{tc.cols.totalValue}</span><span className={styles.mono}>{formatCurrency(detailTarget.totalValue)} {detailTarget.currency}</span>
            <span>{tc.cols.orderDate}</span><span className={styles.mono}>{detailTarget.orderDate}</span>
            <span>{tc.cols.eta}</span><span className={styles.mono}>{detailTarget.estimatedArrival}</span>
            <span>{tc.cols.status}</span><span><Badge variant={STATUS_VARIANT[detailTarget.status]} size="sm">{tc.status[detailTarget.status]}</Badge></span>
            {detailTarget.customsRef && <><span>{tc.cols.customsRef}</span><span className={styles.mono}>{detailTarget.customsRef}</span></>}
          </div>
          {detailTarget.notes && (
            <>
              <div className={styles.drawerSection}>{tc.drawer.notes}</div>
              <p style={{ fontSize: 13, color: "var(--app-text-muted)", margin: 0 }}>{detailTarget.notes}</p>
            </>
          )}
          <div className={styles.drawerSection}>{tc.drawer.items}</div>
          <table className={styles.detailTable}>
            <thead>
              <tr>
                <th>{tc.drawer.itemName}</th>
                <th className={styles.numEnd}>{tc.drawer.qty}</th>
                <th>{tc.drawer.unit}</th>
                <th className={styles.numEnd}>{tc.drawer.unitCost}</th>
                <th className={styles.numEnd}>{tc.drawer.lineTotal}</th>
              </tr>
            </thead>
            <tbody>
              {detailTarget.items.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.name}</td>
                  <td className={`${styles.numEnd} ${styles.mono}`}>{item.quantity.toLocaleString()}</td>
                  <td>{item.unit}</td>
                  <td className={`${styles.numEnd} ${styles.mono}`}>{formatCurrency(item.unitCost)}</td>
                  <td className={`${styles.numEnd} ${styles.mono}`}>{formatCurrency(item.quantity * item.unitCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className={styles.detailTotal}>
            <span>{t.common.total}</span>
            <span>{formatCurrency(detailTarget.totalValue)} {detailTarget.currency}</span>
          </div>
        </Modal>
      )}
    </Container>
  );
}

function NewImportModal({ onSave, onClose }: { onSave: (order: ImportOrder) => void; onClose: () => void }) {
  const { t } = useSettings();
  const tc = t.factory.imports;
  const today = new Date().toISOString().slice(0, 10);

  const [supplier, setSupplier]   = useState("");
  const [origin, setOrigin]       = useState("");
  const [currency, setCurrency]   = useState("USD");
  const [orderDate, setOrderDate] = useState(today);
  const [eta, setEta]             = useState("");
  const [notes, setNotes]         = useState("");

  function handleSave() {
    if (!supplier.trim() || !origin.trim() || !eta) return;
    const seq = String(Date.now()).slice(-4);
    const order: ImportOrder = {
      id: `IMP-${seq}`,
      supplierName: supplier.trim(),
      origin: origin.trim(),
      currency,
      orderDate,
      estimatedArrival: eta,
      items: [],
      totalValue: 0,
      status: "ordered",
      notes: notes.trim() || undefined,
    };
    onSave(order);
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={tc.form.title}
      size="sm"
      footer={
        <div style={{ display: "flex", gap: "var(--space-2)", justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={onClose}>{t.common.cancel}</Button>
          <Button variant="primary" onClick={handleSave} disabled={!supplier.trim() || !origin.trim() || !eta}>
            {tc.form.save}
          </Button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <Input label={tc.form.supplier} value={supplier} onChange={(e) => setSupplier(e.target.value)} required />
        <Input label={tc.form.origin} value={origin} onChange={(e) => setOrigin(e.target.value)} required />
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <Input label={tc.form.orderDate} type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
          <Input label={tc.form.eta} type="date" value={eta} onChange={(e) => setEta(e.target.value)} required />
        </div>
        <Input label={tc.form.notes} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
    </Modal>
  );
}
