import { Warehouse } from "lucide-react";
import { Container } from "../../components/layout/Container";
import { Stack } from "../../components/layout/Stack";
import { Grid } from "../../components/layout/Grid";
import { Badge } from "../../components/ui/Badge";
import { useSettings } from "../../context/SettingsContext";
import { Skeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { useFactory } from "../../context/FactoryContext";
import { useLoadingDelay } from "../../hooks/useLoadingDelay";
import type { WarehouseZone } from "../../data/types";
import styles from "./factory.module.css";

const ZONE_VARIANT: Record<WarehouseZone, "info" | "success" | "warning" | "danger"> = {
  raw:        "info",
  finished:   "success",
  packaging:  "warning",
  quarantine: "danger",
};

export default function FactoryWarehouse() {
  const { t } = useSettings();
  const tc = t.factory.warehouse;
  const { warehouseLocations: WAREHOUSE_LOCATIONS } = useFactory();

  const isLoading = useLoadingDelay();
  const totalCapacity = WAREHOUSE_LOCATIONS.reduce((s, l) => s + l.capacity, 0);
  const totalUsed     = WAREHOUSE_LOCATIONS.reduce((s, l) => s + l.used, 0);
  const totalFree     = totalCapacity - totalUsed;
  const utilPct       = totalCapacity > 0 ? Math.round(totalUsed / totalCapacity * 100) : 0;

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
          <Kpi label={tc.kpi.totalCapacity} value={totalCapacity.toLocaleString()} tone="info"    />
          <Kpi label={tc.kpi.usedCapacity}  value={totalUsed.toLocaleString()}     tone="warning" />
          <Kpi label={tc.kpi.freeCapacity}  value={totalFree.toLocaleString()}     tone="success" />
          <Kpi label={tc.kpi.utilisation}   value={`${utilPct}%`}                 tone="neutral" />
        </Grid>

        <div className={`${styles.tableWrap} atlas-table-wrapper`}>
          {isLoading ? (
            <Skeleton variant="rect" height={280} />
          ) : WAREHOUSE_LOCATIONS.length === 0 ? (
            <EmptyState icon={<Warehouse size={32} />} title={tc.noData} />
          ) : (
            <table className={`${styles.table} atlas-table`}>
              <colgroup>
                <col className="col-w-110" />
                <col />
                <col className="col-w-90" />
                <col className="col-w-90" />
                <col className="col-w-80" />
                <col className="col-w-80" />
                <col className="col-w-90" />
                <col className="col-w-100" />
                <col />
              </colgroup>
              <thead>
                <tr>
                  <th className="col-code">{tc.cols.locationId}</th>
                  <th>{tc.cols.name}</th>
                  <th>{tc.cols.zone}</th>
                  <th className="col-num">{tc.cols.capacity}</th>
                  <th className="col-num">{tc.cols.used}</th>
                  <th className="col-num">{tc.cols.free}</th>
                  <th className="col-num">{tc.cols.utilPct}</th>
                  <th>{tc.cols.temperature}</th>
                  <th>{tc.cols.notes}</th>
                </tr>
              </thead>
              <tbody>
                {WAREHOUSE_LOCATIONS.map((loc) => {
                  const free = loc.capacity - loc.used;
                  const pct  = loc.capacity > 0 ? Math.round(loc.used / loc.capacity * 100) : 0;
                  const fillClass = pct >= 90 ? styles.utilFillDanger : pct >= 70 ? styles.utilFillWarn : styles.utilFill;
                  return (
                    <tr key={loc.id}>
                      <td><span className={styles.mono}>{loc.id}</span></td>
                      <td>{loc.name}</td>
                      <td><Badge variant={ZONE_VARIANT[loc.zone]} size="sm">{tc.zones[loc.zone]}</Badge></td>
                      <td className={`${styles.numEnd} ${styles.mono}`}>{loc.capacity.toLocaleString()}</td>
                      <td className={`${styles.numEnd} ${styles.mono}`}>{loc.used.toLocaleString()}</td>
                      <td className={`${styles.numEnd} ${styles.mono}`}>{free.toLocaleString()}</td>
                      <td style={{ minWidth: 100 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div className={styles.utilBar} style={{ width: 60 }}>
                            <div className={fillClass} style={{ width: `${pct}%` }} />
                          </div>
                          <span className={styles.mono} style={{ fontSize: 11 }}>{pct}%</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 11, color: "var(--app-text-muted)" }}>{loc.temperature ?? "—"}</td>
                      <td style={{ fontSize: 11, color: "var(--app-text-muted)", maxWidth: 160 }}>{loc.notes ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Stack>
    </Container>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone: "success" | "info" | "warning" | "neutral" | "danger" }) {
  return (
    <article className={`${styles.kpi} ${styles[`kpi_${tone}`]}`}>
      <span className={styles.kpiLabel}>{label}</span>
      <strong className={styles.kpiValue}>{value}</strong>
    </article>
  );
}
