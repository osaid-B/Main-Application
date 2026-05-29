import { useMemo, useState } from "react";
import { ClipboardList, Search, Plus } from "lucide-react";
import { Container } from "../../components/layout/Container";
import { Stack } from "../../components/layout/Stack";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { useSettings } from "../../context/SettingsContext";
import { useToast } from "../../components/ui/Toast";
import { Skeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { useFactory } from "../../context/FactoryContext";
import { useLoadingDelay } from "../../hooks/useLoadingDelay";
import type { ProductionOrderStatus, ProductionOrder } from "../../data/types";
import styles from "./factory.module.css";

const STATUS_VARIANT: Record<ProductionOrderStatus, "success" | "warning" | "info" | "neutral"> = {
  planned:      "info",
  "in-progress": "warning",
  done:         "success",
  cancelled:    "neutral",
};

export default function FactoryOrders() {
  const { t, isArabic } = useSettings();
  const tc = t.factory.orders;
  const { toast } = useToast();
  const { factoryOrders, boms, factoryProducts, updateOrderStatus } = useFactory();

  const [query, setQuery]         = useState("");
  const [statusFilter, setFilter] = useState<ProductionOrderStatus | "">("");
  const [detailTarget, setDetail] = useState<ProductionOrder | null>(null);

  const filtered = useMemo(() => {
    return factoryOrders.filter((o) => {
      if (statusFilter && o.status !== statusFilter) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return o.id.toLowerCase().includes(q) || o.productId.toLowerCase().includes(q);
    });
  }, [factoryOrders, query, statusFilter]);

  function getProductName(id: string) {
    return factoryProducts.find((p) => p.id === id)?.name ?? id;
  }

  function handleStatusChange(id: string, status: ProductionOrderStatus) {
    const shortStock = updateOrderStatus(id, status);
    if (shortStock.length > 0) {
      toast(`${tc.toast.lowStock ?? "Low stock"}: ${shortStock.join(", ")}`, { type: "warning" });
    }
    const msg = status === "in-progress" ? tc.toast.started : status === "done" ? tc.toast.completed : tc.toast.cancelled;
    toast(msg, { type: status === "cancelled" ? "info" : "success" });
  }

  const isLoading = useLoadingDelay();
  const bom = detailTarget ? boms.find((b) => b.productId === detailTarget.productId) : null;

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

        <div className={`${styles.tableWrap} atlas-table-wrapper`}>
          {isLoading ? (
            <Skeleton variant="rect" height={280} />
          ) : filtered.length === 0 ? (
            <EmptyState icon={<ClipboardList size={32} />} title={tc.noData} />
          ) : (
            <table className={`${styles.table} atlas-table`}>
              <colgroup>
                <col className="col-w-110" />
                <col />
                <col className="col-w-100" />
                <col className="col-date" />
                <col className="col-date" />
                <col className="col-w-80" />
                <col className="col-w-90" />
                <col className="col-w-100" />
                <col className="col-actions" />
              </colgroup>
              <thead>
                <tr>
                  <th className="col-code">{tc.cols.orderId}</th>
                  <th>{tc.cols.product}</th>
                  <th className="col-num">{tc.cols.quantity}</th>
                  <th className="col-date">{tc.cols.startDate}</th>
                  <th className="col-date">{tc.cols.dueDate}</th>
                  <th className="col-badge">{tc.cols.status}</th>
                  <th className="col-actions">{tc.cols.actions}</th>
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
                          <button type="button" className={styles.actionBtn} onClick={() => handleStatusChange(o.id, "in-progress")}>{tc.actions.start}</button>
                        )}
                        {o.status === "in-progress" && (
                          <button type="button" className={styles.actionBtn} onClick={() => handleStatusChange(o.id, "done")}>{tc.actions.complete}</button>
                        )}
                        {(o.status === "planned" || o.status === "in-progress") && (
                          <button type="button" className={styles.actionBtn} onClick={() => handleStatusChange(o.id, "cancelled")}>{tc.actions.cancel}</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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
                      <td>{isArabic ? line.materialNameAr : line.materialName}</td>
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
