import { useMemo, useState } from "react";
import { Search, Plus } from "lucide-react";
import { Container } from "../../components/layout/Container";
import { Stack } from "../../components/layout/Stack";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { useSettings } from "../../context/SettingsContext";
import { useToast } from "../../components/ui/Toast";
import type { ProductionOrderStatus } from "../../data/types";
import { FACTORY_ORDERS, FACTORY_PRODUCTS, FACTORY_BOMS } from "../../data/factoryMock";
import styles from "./factory.module.css";

const STATUS_VARIANT: Record<ProductionOrderStatus, "success" | "warning" | "info" | "neutral"> = {
  planned:      "info",
  "in-progress": "warning",
  done:         "success",
  cancelled:    "neutral",
};

export default function FactoryOrders() {
  const { t } = useSettings();
  const tc = t.factory.orders;
  const { toast } = useToast();

  const [orders, setOrders]       = useState(FACTORY_ORDERS);
  const [query, setQuery]         = useState("");
  const [statusFilter, setFilter] = useState<ProductionOrderStatus | "">("");
  const [detailTarget, setDetail] = useState<typeof FACTORY_ORDERS[0] | null>(null);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter && o.status !== statusFilter) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return o.id.toLowerCase().includes(q) || o.productId.toLowerCase().includes(q);
    });
  }, [orders, query, statusFilter]);

  function getProductName(id: string) {
    return FACTORY_PRODUCTS.find((p) => p.id === id)?.name ?? id;
  }

  function updateStatus(id: string, status: ProductionOrderStatus) {
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
    const msg = status === "in-progress" ? tc.toast.started : status === "done" ? tc.toast.completed : tc.toast.cancelled;
    toast(msg, { type: status === "cancelled" ? "info" : "success" });
  }

  const bom = detailTarget ? FACTORY_BOMS.find((b) => b.productId === detailTarget.productId) : null;

  return (
    <Container maxWidth="full" padding="md">
      <Stack gap="lg">
        <header className={styles.header}>
          <div>
            <div className={styles.breadcrumb}>{tc.breadcrumb}</div>
            <h1 className={styles.title}>{tc.pageTitle}</h1>
            <p className={styles.subtitle}>{tc.pageSubtitle}</p>
          </div>
          <div className={styles.headerActions}>
            <Button variant="secondary" size="sm">{tc.export}</Button>
            <Button variant="primary" size="sm" leftIcon={<Plus size={14} />}>{tc.newOrder}</Button>
          </div>
        </header>

        <div className={styles.filterBar}>
          <div className={styles.searchWrap}>
            <Input variant="search" placeholder={tc.searchPlaceholder} value={query} onChange={(e) => setQuery(e.target.value)} leftIcon={<Search size={14} />} fullWidth />
          </div>
          <select className={styles.filterSelect} value={statusFilter} onChange={(e) => setFilter(e.target.value as ProductionOrderStatus | "")}>
            <option value="">{tc.filters.allStatuses}</option>
            {(["planned", "in-progress", "done", "cancelled"] as ProductionOrderStatus[]).map((s) => (
              <option key={s} value={s}>{tc.status[s]}</option>
            ))}
          </select>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{tc.cols.orderId}</th>
                <th>{tc.cols.product}</th>
                <th className={styles.numEnd}>{tc.cols.quantity}</th>
                <th>{tc.cols.startDate}</th>
                <th>{tc.cols.dueDate}</th>
                <th>{tc.cols.status}</th>
                <th>{tc.cols.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id}>
                  <td><span className={styles.mono}>{o.id}</span></td>
                  <td>{getProductName(o.productId)}</td>
                  <td className={`${styles.numEnd} ${styles.mono}`}>{o.quantity.toLocaleString()}</td>
                  <td className={styles.mono}>{o.startDate}</td>
                  <td className={styles.mono}>{o.dueDate}</td>
                  <td><Badge variant={STATUS_VARIANT[o.status]} size="sm">{tc.status[o.status]}</Badge></td>
                  <td>
                    <div className={styles.rowActions}>
                      <button type="button" className={styles.actionBtn} onClick={() => setDetail(o)}>{tc.actions.view}</button>
                      {o.status === "planned" && (
                        <button type="button" className={styles.actionBtn} onClick={() => updateStatus(o.id, "in-progress")}>{tc.actions.start}</button>
                      )}
                      {o.status === "in-progress" && (
                        <button type="button" className={styles.actionBtn} onClick={() => updateStatus(o.id, "done")}>{tc.actions.complete}</button>
                      )}
                      {(o.status === "planned" || o.status === "in-progress") && (
                        <button type="button" className={styles.actionBtn} onClick={() => updateStatus(o.id, "cancelled")}>{tc.actions.cancel}</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className={styles.empty}>{tc.noData}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Stack>

      {detailTarget && (
        <Modal isOpen onClose={() => setDetail(null)} title={`${tc.drawer.title} — ${detailTarget.id}`} size="md"
          footer={<Button variant="secondary" onClick={() => setDetail(null)}>{tc.drawer.close}</Button>}>
          <div className={styles.drawerMeta}>
            <span>{tc.cols.product}</span><span>{getProductName(detailTarget.productId)}</span>
            <span>{tc.cols.quantity}</span><span className={styles.mono}>{detailTarget.quantity.toLocaleString()}</span>
            <span>{tc.cols.startDate}</span><span className={styles.mono}>{detailTarget.startDate}</span>
            <span>{tc.cols.dueDate}</span><span className={styles.mono}>{detailTarget.dueDate}</span>
            <span>{tc.cols.status}</span><span><Badge variant={STATUS_VARIANT[detailTarget.status]} size="sm">{tc.status[detailTarget.status]}</Badge></span>
          </div>
          {bom && (
            <>
              <div className={styles.drawerSection}>{tc.drawer.bom}</div>
              <table className={styles.detailTable}>
                <thead>
                  <tr>
                    <th>{tc.drawer.material}</th>
                    <th className={styles.numEnd}>{tc.drawer.qty}</th>
                  </tr>
                </thead>
                <tbody>
                  {bom.lines.map((line) => (
                    <tr key={line.materialId}>
                      <td>{line.materialName}</td>
                      <td className={`${styles.numEnd} ${styles.mono}`}>{line.quantity} {line.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </Modal>
      )}
    </Container>
  );
}
