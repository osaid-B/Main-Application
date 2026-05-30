import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, Factory, FileText, Package, ShoppingCart, Star, Trash2, UserCheck, X } from "lucide-react";
import { Container } from "../components/layout/Container";
import { Stack } from "../components/layout/Stack";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { useNotifications } from "../context/NotificationsContext";
import type { Notification, NotificationCategory, NotificationSeverity } from "../context/NotificationsContext";
import { useSettings } from "../context/SettingsContext";
import styles from "./Notifications.module.css";

type TabId = "all" | "unread" | NotificationCategory;

const CAT_ICON: Record<NotificationCategory, typeof FileText> = {
  invoice:   FileText,
  inventory: Package,
  factory:   Factory,
  pos:       ShoppingCart,
  loyalty:   Star,
  system:    Bell,
  hr:        UserCheck,
};

const SEV_VARIANT: Record<NotificationSeverity, "danger" | "warning" | "info" | "success"> = {
  error:   "danger",
  warning: "warning",
  info:    "info",
  success: "success",
};

const SEV_BORDER: Record<NotificationSeverity, string> = {
  error:   styles.sevError,
  warning: styles.sevWarning,
  info:    styles.sevInfo,
  success: styles.sevSuccess,
};

const SEVERITY_AR: Record<string, string> = {
  error:   "خطأ",
  warning: "تحذير",
  info:    "معلومة",
  success: "نجاح",
};

type T = ReturnType<typeof useSettings>["t"];

function relTime(ts: Date, t: T): string {
  const rl = t.notifications.relTime;
  const diffMs = Date.now() - ts.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return rl.justNow;
  if (diffMin < 60) return `${rl.prefix}${diffMin}${rl.mAgo}`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${rl.prefix}${diffH}${rl.hAgo}`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return rl.yesterday;
  if (diffD < 7) return `${rl.prefix}${diffD}${rl.dAgo}`;
  const d = ts.getDate().toString().padStart(2, "0");
  const m = (ts.getMonth() + 1).toString().padStart(2, "0");
  const y = ts.getFullYear();
  return `${d}/${m}/${y}`;
}

function dateGroup(ts: Date, t: T): string {
  const dg = t.notifications.dateGroup;
  const now = new Date();
  const diffD = Math.floor((now.getTime() - ts.getTime()) / 86_400_000);
  if (diffD === 0) return dg.today;
  if (diffD === 1) return dg.yesterday;
  if (diffD < 7) return dg.thisWeek;
  return dg.older;
}

export default function Notifications() {
  const navigate = useNavigate();
  const { t, isArabic } = useSettings();
  const tn = t.notifications;
  const { notifications, unreadCount, markAsRead, markAllAsRead, dismiss, clearAll } = useNotifications();

  const [tab, setTab] = useState<TabId>("all");

  const groupOrder = [tn.dateGroup.today, tn.dateGroup.yesterday, tn.dateGroup.thisWeek, tn.dateGroup.older];

  const TABS: { id: TabId; label: string }[] = [
    { id: "all",       label: tn.tabs.all },
    { id: "unread",    label: unreadCount > 0 ? `${tn.tabs.unread} (${unreadCount})` : tn.tabs.unread },
    { id: "invoice",   label: tn.tabs.invoice },
    { id: "inventory", label: tn.tabs.inventory },
    { id: "factory",   label: tn.tabs.factory },
    { id: "pos",       label: tn.tabs.pos },
    { id: "loyalty",   label: tn.tabs.loyalty },
  ];

  const displayed = useMemo(() =>
    notifications.filter((n) => {
      if (tab === "all") return true;
      if (tab === "unread") return !n.read;
      return n.category === tab;
    }),
  [notifications, tab]);

  const grouped = useMemo(() => {
    const map = new Map<string, Notification[]>();
    for (const n of displayed) {
      const g = dateGroup(n.timestamp, t);
      const arr = map.get(g) ?? [];
      arr.push(n);
      map.set(g, arr);
    }
    return groupOrder.filter((g) => map.has(g)).map((g) => ({ group: g, items: map.get(g)! }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayed, t]);

  function handleAction(n: Notification) {
    markAsRead(n.id);
    if (n.actionRoute) navigate(n.actionRoute);
  }

  return (
    <Container maxWidth="lg" padding="md">
      <Stack gap="lg">
        {/* Header */}
        <header className={styles.header}>
          <div>
            <p className={styles.subtitle}>{tn.pageSubtitle}</p>
          </div>
          <div className={styles.headerActions}>
            {unreadCount > 0 && (
              <Button variant="secondary" size="sm" leftIcon={<CheckCheck size={13} />} onClick={markAllAsRead}>
                {tn.markAllRead}
              </Button>
            )}
            {notifications.length > 0 && (
              <Button variant="ghost" size="sm" leftIcon={<Trash2 size={13} />} onClick={clearAll}>
                {tn.clearAll}
              </Button>
            )}
          </div>
        </header>

        {/* Tabs */}
        <div className={styles.tabs} role="tablist">
          {TABS.map((tb) => (
            <button
              key={tb.id}
              type="button"
              role="tab"
              aria-selected={tab === tb.id}
              className={`${styles.tab} ${tab === tb.id ? styles.tabActive : ""}`}
              onClick={() => setTab(tb.id)}
            >
              {tb.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {displayed.length === 0 ? (
          <div className={styles.empty}>
            <CheckCheck size={40} strokeWidth={1} />
            <p>{tn.empty} {tn.noNotificationsMore}</p>
          </div>
        ) : (
          <div className={styles.groups}>
            {grouped.map(({ group, items }) => (
              <section key={group}>
                <h2 className={styles.groupLabel}>{group}</h2>
                <div className={styles.cardList}>
                  {items.map((n) => {
                    const Icon = CAT_ICON[n.category];
                    const title = isArabic ? (n.titleAr ?? n.title) : n.title;
                    const body = isArabic ? (n.bodyAr ?? n.body) : n.body;
                    const actionLabel = isArabic ? (n.actionLabelAr ?? n.actionLabel) : n.actionLabel;
                    return (
                      <div
                        key={n.id}
                        className={`${styles.card} ${SEV_BORDER[n.severity]} ${n.read ? styles.cardRead : styles.cardUnread}`}
                        onClick={() => markAsRead(n.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") markAsRead(n.id); }}
                      >
                        <div className={`${styles.cardIcon} ${SEV_BORDER[n.severity]}`}>
                          <Icon size={15} />
                        </div>

                        <div className={styles.cardBody}>
                          <div className={styles.cardTop}>
                            <div className={styles.cardMeta}>
                              <span className={styles.cardTitle}>{title}</span>
                              <Badge variant={SEV_VARIANT[n.severity]} size="sm">{isArabic ? (SEVERITY_AR[n.severity] ?? n.severity) : n.severity}</Badge>
                            </div>
                            <div className={styles.cardRight}>
                              <span className={styles.cardTime}>{relTime(n.timestamp, t)}</span>
                              <button
                                type="button"
                                className={styles.dismissBtn}
                                aria-label="Dismiss notification"
                                style={{ minWidth: 32, minHeight: 32, display: "flex", alignItems: "center", justifyContent: "center" }}
                                onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </div>

                          <p className={styles.cardText}>{body}</p>

                          {actionLabel && (
                            <button
                              type="button"
                              className={styles.cardAction}
                              onClick={(e) => { e.stopPropagation(); handleAction(n); }}
                            >
                              {actionLabel} →
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </Stack>
    </Container>
  );
}
