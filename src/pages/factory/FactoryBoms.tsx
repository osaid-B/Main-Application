import { useMemo, useState } from "react";
import { FileText, Search } from "lucide-react";
import { Container } from "../../components/layout/Container";
import { Stack } from "../../components/layout/Stack";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { useSettings } from "../../context/SettingsContext";
import { Skeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { useFactory } from "../../context/FactoryContext";
import { useLoadingDelay } from "../../hooks/useLoadingDelay";
import styles from "./factory.module.css";

export default function FactoryBoms() {
  const { t, formatCurrency, isArabic } = useSettings();
  const tc = t.factory.boms;
  const { boms: FACTORY_BOMS } = useFactory();

  const [query, setQuery]         = useState("");
  const [detailTarget, setDetail] = useState<typeof FACTORY_BOMS[0] | null>(null);

  const filtered = useMemo(() => {
    if (!query) return FACTORY_BOMS;
    const q = query.toLowerCase();
    return FACTORY_BOMS.filter((b) =>
      b.id.toLowerCase().includes(q) ||
      b.productName.toLowerCase().includes(q) ||
      b.productNameAr.includes(q)
    );
  }, [FACTORY_BOMS, query]);

  const isLoading = useLoadingDelay();

  function totalStdCost(bom: typeof FACTORY_BOMS[0]) {
    return bom.lines.reduce((s, l) => s + l.quantity * l.unitCost, 0);
  }

  return (
    <Container maxWidth="full" padding="md">
      <Stack gap="lg">
        <header className={styles.header}>
          <div>
            <div className={styles.breadcrumb}>{tc.breadcrumb}</div>
            <p className={styles.subtitle}>{tc.pageSubtitle}</p>
          </div>
        </header>

        <div className={styles.filterBar}>
          <div className={styles.searchWrap}>
            <Input variant="search" placeholder={tc.searchPlaceholder} value={query} onChange={(e) => setQuery(e.target.value)} leftIcon={<Search size={14} />} fullWidth />
          </div>
        </div>

        <div className={`${styles.tableWrap} atlas-table-wrapper`}>
          {isLoading ? (
            <Skeleton variant="rect" height={240} />
          ) : filtered.length === 0 ? (
            <EmptyState icon={<FileText size={32} />} title={tc.noData} />
          ) : (
            <table className={`${styles.table} atlas-table`}>
              <colgroup>
                <col className="col-w-110" />
                <col />
                <col className="col-w-90" />
                <col className="col-date col-w-130" />
                <col className="col-w-80" />
                <col className="col-actions" />
              </colgroup>
              <thead>
                <tr>
                  <th className="col-code">{tc.cols.bomId}</th>
                  <th>{tc.cols.product}</th>
                  <th className="col-badge">{tc.cols.version}</th>
                  <th className="col-date">{tc.cols.effectiveDate}</th>
                  <th className="col-num">{tc.cols.lines}</th>
                  <th className="col-actions">{tc.cols.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((bom) => (
                  <tr key={bom.id}>
                    <td className="col-code"><span className={styles.mono}>{bom.id}</span></td>
                    <td>{bom.productName}</td>
                    <td className="col-badge"><span className={styles.tag}>{bom.version}</span></td>
                    <td className={`${styles.mono} col-date`}>{bom.effectiveDate}</td>
                    <td className={`${styles.numEnd} ${styles.mono} col-num`}>{bom.lines.length}</td>
                    <td className="col-actions">
                      <button type="button" className={styles.actionBtn} onClick={() => setDetail(bom)}>{tc.actions.view}</button>
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
            <span>{tc.cols.product}</span><span>{detailTarget.productName}</span>
            <span>{tc.cols.version}</span><span>{detailTarget.version}</span>
            <span>{tc.cols.effectiveDate}</span><span className={styles.mono}>{detailTarget.effectiveDate}</span>
          </div>
          <div className={styles.drawerSection}>{tc.drawer.material}</div>
          <table className={styles.detailTable}>
            <thead>
              <tr>
                <th>{tc.drawer.material}</th>
                <th className={styles.numEnd}>{tc.drawer.qty}</th>
                <th>{tc.drawer.unit}</th>
                <th className={styles.numEnd}>{tc.drawer.unitCost}</th>
                <th className={styles.numEnd}>{tc.drawer.lineCost}</th>
              </tr>
            </thead>
            <tbody>
              {detailTarget.lines.map((line) => (
                <tr key={line.materialId}>
                  <td>{isArabic ? line.materialNameAr : line.materialName}</td>
                  <td className={`${styles.numEnd} ${styles.mono}`}>{line.quantity}</td>
                  <td>{line.unit}</td>
                  <td className={`${styles.numEnd} ${styles.mono}`}>{formatCurrency(line.unitCost)}</td>
                  <td className={`${styles.numEnd} ${styles.mono}`}>{formatCurrency(line.quantity * line.unitCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className={styles.detailTotal}>
            <span>{tc.drawer.totalStdCost}</span>
            <span>{formatCurrency(totalStdCost(detailTarget))}</span>
          </div>
        </Modal>
      )}
    </Container>
  );
}
