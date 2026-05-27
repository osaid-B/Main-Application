import { useMemo, useState } from "react";
import { Search, Plus } from "lucide-react";
import { Container } from "../../components/layout/Container";
import { Stack } from "../../components/layout/Stack";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { useSettings } from "../../context/SettingsContext";
import { useFactory } from "../../context/FactoryContext";
import type { ImportOrderStatus } from "../../data/types";
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
  const { importOrders: IMPORT_ORDERS } = useFactory();

  const [query, setQuery]         = useState("");
  const [statusFilter, setFilter] = useState<ImportOrderStatus | "">("");
  const [detailTarget, setDetail] = useState<typeof IMPORT_ORDERS[0] | null>(null);

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
          <Button variant="primary" size="sm" leftIcon={<Plus size={14} />}>{tc.newImport}</Button>
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
              {filtered.length === 0 && (
                <tr><td colSpan={11} className={styles.empty}>{tc.noData}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Stack>

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
