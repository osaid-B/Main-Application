import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, Factory, FileText, Package, ShoppingCart, Star, Trash2, X } from "lucide-react";
import { Container } from "../components/layout/Container";
import { Stack } from "../components/layout/Stack";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { useNotifications } from "../context/NotificationsContext";
import type { Notification, NotificationCategory, NotificationSeverity } from "../context/NotificationsContext";
import styles from "./Notifications.module.css";

type TabId = "all" | "unread" | NotificationCategory;

const CAT_ICON: Record<NotificationCategory, typeof FileText> = {
  invoice:   FileText,
  inventory: Package,
  factory:   Factory,
  pos:       ShoppingCart,
  loyalty:   Star,
  system:    Bell,
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

function relTime(ts: Date): string {
  const ms = Date.now() - ts.getTime();
  const min = Math.floor(ms / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "yesterday";
  if (d < 7) return `${d}d ago`;
  return ts.toLocaleDateString();
}

function dateGroup(ts: Date): string {
  const now = new Date();
  const diffD = Math.floor((now.getTime() - ts.getTime()) / 86_400_000);
  if (diffD === 0) return "Today";
  if (diffD === 1) return "Yesterday";
  if (diffD < 7) return "This Week";
  return "Older";
}

const GROUP_ORDER = ["Today", "Yesterday", "This Week", "Older"];

export default function Notifications() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, dismiss, clearAll } = useNotifications();

  const [tab, setTab] = useState<TabId>("all");

  const TABS: { id: TabId; label: string }[] = [
    { id: "all",       label: "All" },
    { id: "unread",    label: unreadCount > 0 ? `Unread (${unreadCount})` : "Unread" },
    { id: "invoice",   label: "Invoices" },
    { id: "inventory", label: "Inventory" },
    { id: "factory",   label: "Factory" },
    { id: "pos",       label: "POS" },
    { id: "loyalty",   label: "Loyalty" },
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
      const g = dateGroup(n.timestamp);
      const arr = map.get(g) ?? [];
      arr.push(n);
      map.set(g, arr);
    }
    return GROUP_ORDER.filter((g) => map.has(g)).map((g) => ({ group: g, items: map.get(g)! }));
  }, [displayed]);

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
            <h1 className={styles.title}>Notifications</h1>
            <p className={styles.subtitle}>Activity alerts from all modules</p>
          </div>
          <div className={styles.headerActions}>
            {unreadCount > 0 && (
              <Button variant="secondary" size="sm" leftIcon={<CheckCheck size={13} />} onClick={markAllAsRead}>
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button variant="ghost" size="sm" leftIcon={<Trash2 size={13} />} onClick={clearAll}>
                Clear all
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
            <p>All caught up! No notifications to show.</p>
          </div>
        ) : (
          <div className={styles.groups}>
            {grouped.map(({ group, items }) => (
              <section key={group}>
                <h2 className={styles.groupLabel}>{group}</h2>
                <div className={styles.cardList}>
                  {items.map((n) => {
                    const Icon = CAT_ICON[n.category];
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
                              <span className={styles.cardTitle}>{n.title}</span>
                              <Badge variant={SEV_VARIANT[n.severity]} size="sm">{n.severity}</Badge>
                            </div>
                            <div className={styles.cardRight}>
                              <span className={styles.cardTime}>{relTime(n.timestamp)}</span>
                              <button
                                type="button"
                                className={styles.dismissBtn}
                                aria-label="Dismiss notification"
                                onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </div>

                          <p className={styles.cardText}>{n.body}</p>

                          {n.actionLabel && (
                            <button
                              type="button"
                              className={styles.cardAction}
                              onClick={(e) => { e.stopPropagation(); handleAction(n); }}
                            >
                              {n.actionLabel} →
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
