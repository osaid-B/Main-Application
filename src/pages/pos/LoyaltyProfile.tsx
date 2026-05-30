import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useToast } from "../../components/ui/Toast";
import { Container } from "../../components/layout/Container";
import { Stack } from "../../components/layout/Stack";
import { Grid } from "../../components/layout/Grid";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Avatar } from "../../components/ui/Avatar";
import { Modal } from "../../components/ui/Modal";
import { Textarea } from "../../components/ui/Textarea";
import { Input } from "../../components/ui/Input";
import { useSettings } from "../../context/SettingsContext";
import {
  LOYALTY_PROFILES,
  LOYALTY_SETTINGS_DEFAULT,
  type LoyaltyMemberProfile,
  type LoyaltyProfileTransaction,
} from "../../data/posMock";
import styles from "./LoyaltyProfile.module.css";

type TabId = "history" | "tierProgress" | "adjustment";

const ACTION_VARIANT: Record<string, "success" | "info" | "neutral" | "warning"> = {
  earned:   "success",
  redeemed: "info",
  expired:  "neutral",
  adjusted: "warning",
};

const TIER_VARIANT: Record<string, "warning" | "neutral" | "success"> = {
  Bronze: "neutral",
  Silver: "warning",
  Gold:   "success",
};

const PAGE_SIZE = 10;

export default function LoyaltyProfile() {
  const { t, formatNumber } = useSettings();
  const tc = t.pos.loyaltyProfile;

  const [searchParams] = useSearchParams();
  const requestedId = searchParams.get("id");
  const profile: LoyaltyMemberProfile =
    LOYALTY_PROFILES.find((p) => p.customerId === requestedId) ?? LOYALTY_PROFILES[0];

  const { toast } = useToast();

  const [localProfile, setLocalProfile] = useState(profile);
  const [activeTab, setActiveTab] = useState<TabId>("history");
  const [page, setPage] = useState(0);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustType, setAdjustType] = useState<"add" | "deduct">("add");
  const [adjustReason, setAdjustReason] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const txSlice = localProfile.transactions.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(localProfile.transactions.length / PAGE_SIZE);

  // Tier progress
  const tiers = LOYALTY_SETTINGS_DEFAULT.tiers;
  const currentTierIdx = tiers.reduce((bestIdx, tier, idx) => {
    return localProfile.coinsBalance >= tier.minCoins ? idx : bestIdx;
  }, 0);
  const currentTier = tiers[currentTierIdx];
  const nextTier = tiers[currentTierIdx + 1] ?? null;
  const progressPct = nextTier
    ? Math.min(100, Math.round(((localProfile.coinsBalance - currentTier.minCoins) / (nextTier.minCoins - currentTier.minCoins)) * 100))
    : 100;

  function applyAdjustment() {
    const coins = parseInt(adjustAmount, 10) || 0;
    const delta = adjustType === "add" ? coins : -coins;
    const newBalance = localProfile.coinsBalance + delta;
    const newTx: LoyaltyProfileTransaction = {
      id: `adj-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      action: "adjusted",
      coins: delta,
      trigger: adjustReason.trim(),
      balanceAfter: newBalance,
    };
    setLocalProfile((prev) => ({
      ...prev,
      coinsBalance: newBalance,
      transactions: [newTx, ...prev.transactions],
    }));
    setAdjustAmount("");
    setAdjustReason("");
    setConfirmOpen(false);
    setActiveTab("history");
    toast(tc.adjustment.toast ?? "Adjustment recorded.", { type: "success" });
  }

  function handleAdjustment() {
    if (!adjustAmount || !adjustReason.trim()) return;
    setConfirmOpen(true);
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

        {/* Customer card */}
        <div className={styles.customerCard}>
          <Avatar name={localProfile.customerName} size="lg" tone="accent" />
          <div className={styles.customerInfo}>
            <div className={styles.customerName}>{localProfile.customerName}</div>
            <div className={styles.customerCode}>{localProfile.customerCode}</div>
            <div className={styles.customerMeta}>{tc.memberSince ?? "Member since"} {localProfile.memberSince}</div>
          </div>
          <div className={styles.tierBadgeWrap}>
            <Badge variant={TIER_VARIANT[localProfile.tier]} size="md">{localProfile.tier}</Badge>
          </div>
          <div className={styles.balanceDisplay}>
            <span className={styles.balanceValue}>{formatNumber(localProfile.coinsBalance)}</span>
            <span className={styles.balanceLabel}>{tc.coins ?? "coins"}</span>
          </div>
        </div>

        {/* Stats row */}
        <Grid cols={4} gap="md" responsive>
          <Kpi label={tc.stats.earned}       value={formatNumber(localProfile.totalEarned)}       tone="success" />
          <Kpi label={tc.stats.redeemed}     value={formatNumber(localProfile.totalRedeemed)}     tone="info"    />
          <Kpi label={tc.stats.expired}      value={formatNumber(localProfile.totalExpired)}      tone="neutral" />
          <Kpi label={tc.stats.transactions} value={String(localProfile.transactions.length)}     tone="warning" />
        </Grid>

        {/* Tabs */}
        <div className={styles.tabsBar} role="tablist">
          {(["history", "tierProgress", "adjustment"] as TabId[]).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tc.tabs[tab]}
            </button>
          ))}
        </div>

        {/* Tab: History */}
        {activeTab === "history" && (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{tc.cols.date}</th>
                  <th>{tc.cols.action}</th>
                  <th className={styles.numEnd}>{tc.cols.coins}</th>
                  <th>{tc.cols.trigger}</th>
                  <th className={styles.numEnd}>{tc.cols.balance}</th>
                </tr>
              </thead>
              <tbody>
                {txSlice.map((tx: LoyaltyProfileTransaction) => (
                  <tr key={tx.id}>
                    <td className={styles.mono}>{tx.date}</td>
                    <td>
                      <Badge variant={ACTION_VARIANT[tx.action] ?? "neutral"} size="sm">
                        {tc.actions[tx.action] ?? tx.action}
                      </Badge>
                    </td>
                    <td className={`${styles.numEnd} ${styles.mono} ${tx.coins >= 0 ? styles.coinPos : styles.coinNeg}`}>
                      {tx.coins >= 0 ? `+${tx.coins}` : String(tx.coins)}
                    </td>
                    <td className={styles.triggerCell}>{tx.trigger}</td>
                    <td className={`${styles.numEnd} ${styles.mono}`}>{formatNumber(tx.balanceAfter)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  type="button"
                  className={styles.pageBtn}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  ‹ Prev
                </button>
                <span className={styles.pageInfo}>{page + 1} / {totalPages}</span>
                <button
                  type="button"
                  className={styles.pageBtn}
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                >
                  Next ›
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab: Tier Progress */}
        {activeTab === "tierProgress" && (
          <div className={styles.tierCard}>
            <div className={styles.tierInfo}>
              <div>
                <div className={styles.tierLabel}>{tc.tier.current}</div>
                <div className={styles.tierName}>{currentTier.name}</div>
              </div>
              {nextTier && (
                <div>
                  <div className={styles.tierLabel}>{tc.tier.nextTier}</div>
                  <div className={styles.tierName}>{nextTier.name}</div>
                </div>
              )}
            </div>
            <div className={styles.progressLabel}>{tc.tier.progress}</div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
            </div>
            <div className={styles.progressMeta}>
              {formatNumber(profile.coinsBalance)} / {nextTier ? formatNumber(nextTier.minCoins) : "MAX"} coins ({progressPct}%)
            </div>
            <div className={styles.benefitsTitle}>{tc.tier.benefits}</div>
            <div className={styles.tiersGrid}>
              {tiers.map((tier) => (
                <div
                  key={tier.id}
                  className={`${styles.tierBenefitCard} ${tier.id === currentTier.id ? styles.tierBenefitActive : ""}`}
                >
                  <div className={styles.tierBenefitName}>{tier.name}</div>
                  <div className={styles.tierBenefitMultiplier}>{tier.multiplier}x</div>
                  <div className={styles.tierBenefitMin}>{formatNumber(tier.minCoins)}+ coins</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Manual Adjustment */}
        {activeTab === "adjustment" && (
          <div className={styles.adjustCard}>
            <h3 className={styles.adjustTitle}>{tc.adjustment.title}</h3>
            <div className={styles.adjustForm}>
              <div className={styles.adjustRow}>
                <div className={styles.adjustField}>
                  <Input
                    label={tc.adjustment.amount}
                    variant="number"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    placeholder="100"
                  />
                </div>
                <div className={styles.adjustField}>
                  <label className={styles.adjustLabel}>{tc.adjustment.type}</label>
                  <select
                    className={styles.adjustSelect}
                    value={adjustType}
                    onChange={(e) => setAdjustType(e.target.value as "add" | "deduct")}
                  >
                    <option value="add">{tc.adjustment.add}</option>
                    <option value="deduct">{tc.adjustment.deduct}</option>
                  </select>
                </div>
              </div>
              <Textarea
                label={tc.adjustment.reason}
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="e.g. Manual bonus for Ramadan promotion"
                rows={3}
              />
              <div className={styles.adjustFooter}>
                <Button
                  variant="primary"
                  onClick={handleAdjustment}
                  disabled={!adjustAmount || !adjustReason.trim()}
                >
                  {tc.adjustment.submit}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Stack>

      {confirmOpen && (
        <Modal
          isOpen
          onClose={() => setConfirmOpen(false)}
          title={tc.adjustment.confirmTitle ?? tc.adjustment.title}
          size="sm"
          footer={
            <div className={styles.adjustFooter}>
              <Button variant="ghost" onClick={() => setConfirmOpen(false)}>{t.common.cancel}</Button>
              <Button variant="primary" onClick={applyAdjustment}>{tc.adjustment.submit}</Button>
            </div>
          }
        >
          <p className={styles.confirmMsg}>{tc.adjustment.confirmMsg}</p>
        </Modal>
      )}
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
