import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCheck, Trash2 } from "lucide-react";
import { useNotifications } from "../context/NotificationsContext";
import type { Notification, NotificationCategory, NotificationSeverity } from "../context/NotificationsContext";
import { useSettings } from "../context/SettingsContext";
import { formatDateValue } from "../utils/displayFormatters";
import styles from "./Notifications.module.css";

type TabId = "all" | "unread" | NotificationCategory;

// ── Severity config ────────────────────────────────────────────────────────────
type SevConfig = { color: string; bg: string; border: string; icon: string; badge: string };

function getSevConfig(sev: NotificationSeverity, cat: NotificationCategory): SevConfig {
  if (cat === "inventory") {
    if (sev === "error") return { color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", icon: "📦", badge: "نفاد المخزون" };
    return { color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", icon: "📦", badge: "تنبيه مخزون" };
  }
  if (cat === "pos" && sev === "warning") return { color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", icon: "🔄", badge: "معلق" };
  if (cat === "factory" && sev === "warning") return { color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", icon: "⏰", badge: "متأخر" };
  switch (sev) {
    case "error":   return { color: "#DC2626", bg: "#FEF2F2", border: "#FECACA", icon: "⚠️", badge: "تحذير" };
    case "warning": return { color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", icon: "⏰", badge: "تنبيه" };
    case "success": return { color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0", icon: "✅", badge: "مكتمل" };
    default:        return { color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", icon: "💡", badge: "تذكير" };
  }
}

// ── FIX 1: sanitize body text that may contain "undefined" ────────────────────
function sanitizeBody(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/\bundefined\b/g, "")
    .replace(/متأخرة منذ\s+يوم/g, "متأخرة")
    .replace(/متأخرة منذ\s*،/g, "متأخرة،")
    .replace(/متأخرة منذ\s*$/g, "متأخرة")
    .replace(/overdue since\s*$/i, "overdue")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// ── Time helpers (preserved intact) ──────────────────────────────────────────
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
  return formatDateValue(ts);
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

// ── Main component ─────────────────────────────────────────────────────────────
export default function Notifications() {
  const navigate = useNavigate();
  const { t, isArabic } = useSettings();
  const tn = t.notifications;
  const { notifications, unreadCount, markAsRead, markAllAsRead, dismiss, clearAll } = useNotifications();

  const [tab, setTab] = useState<TabId>("all");

  const groupOrder = [tn.dateGroup.today, tn.dateGroup.yesterday, tn.dateGroup.thisWeek, tn.dateGroup.older];

  const TABS: { id: TabId; label: string; count?: number }[] = [
    { id: "all",       label: tn.tabs.all },
    { id: "unread",    label: tn.tabs.unread, count: unreadCount > 0 ? unreadCount : undefined },
    { id: "invoice",   label: tn.tabs.invoice },
    { id: "inventory", label: tn.tabs.inventory },
    { id: "factory",   label: tn.tabs.factory },
    { id: "pos",       label: tn.tabs.pos },
  ];

  // ── PRESERVED: filter + group logic ──────────────────────────────────────
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

  // ── PRESERVED: action handler ─────────────────────────────────────────────
  function handleAction(n: Notification) {
    markAsRead(n.id);
    if (n.actionRoute) navigate(n.actionRoute);
  }

  return (
    <div className={styles.page} dir={isArabic ? "rtl" : "ltr"}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{tn.pageTitle}</h1>
          <p className={styles.subtitle}>{tn.pageSubtitle}</p>
        </div>
        <div className={styles.headerActions}>
          {unreadCount > 0 && (
            <button type="button" className={styles.btnMarkRead} onClick={markAllAsRead}>
              <CheckCheck size={14} /> {tn.markAllRead}
            </button>
          )}
          {notifications.length > 0 && (
            <button type="button" className={styles.btnClear} onClick={clearAll}>
              <Trash2 size={14} /> {tn.clearAll}
            </button>
          )}
        </div>
      </header>

      {/* ── Pill tabs ──────────────────────────────────────────────────────── */}
      <div className={styles.pillTabs} role="tablist">
        {TABS.map((tb) => (
          <button
            key={tb.id}
            type="button"
            role="tab"
            aria-selected={tab === tb.id}
            className={`${styles.pillTab} ${tab === tb.id ? styles.pillTabActive : ""}`}
            onClick={() => setTab(tb.id)}
          >
            {tb.label}
            {tb.count !== undefined && (
              <span className={styles.tabBadge}>{tb.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      {displayed.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🔔</div>
          <p className={styles.emptyTitle}>
            {tab === "all" ? tn.empty : "لا توجد إشعارات في هذا التصنيف"}
          </p>
          <p className={styles.emptySub}>{tn.noNotificationsMore}</p>
          {tab !== "all" && (
            <button type="button" className={styles.btnShowAll} onClick={() => setTab("all")}>
              عرض الكل
            </button>
          )}
        </div>
      ) : (
        <div className={styles.groups}>
          {grouped.map(({ group, items }) => (
            <section key={group}>
              {/* FIX 5: Styled date group header */}
              <div className={styles.groupHeader}>
                <span className={styles.groupLine} />
                <span className={styles.groupLabel}>{group}</span>
                <span className={styles.groupLine} />
              </div>

              <div className={styles.cardList}>
                {items.map((n) => {
                  const sev = getSevConfig(n.severity, n.category);
                  const title = isArabic ? (n.titleAr ?? n.title) : n.title;
                  const body = sanitizeBody(isArabic ? (n.bodyAr ?? n.body) : n.body);
                  const actionLabel = isArabic ? (n.actionLabelAr ?? n.actionLabel) : n.actionLabel;

                  return (
                    <div
                      key={n.id}
                      className={`${styles.card} ${n.read ? styles.cardRead : styles.cardUnread}`}
                      style={{
                        borderInlineStartColor: n.read ? "#E2E8F0" : sev.color,
                        background: n.read ? "white" : `${sev.bg}26`,
                      }}
                      onClick={() => markAsRead(n.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") markAsRead(n.id); }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLDivElement;
                        el.style.background = n.read ? "#F8FAFC" : `${sev.bg}4D`;
                        if (!n.read) el.style.borderColor = `${sev.color}66`;
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLDivElement;
                        el.style.background = n.read ? "white" : `${sev.bg}26`;
                        if (!n.read) el.style.borderColor = "";
                      }}
                    >
                      {/* Icon circle */}
                      <div style={{
                        width: 44, height: 44, borderRadius: 12, background: sev.bg,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 22, flexShrink: 0,
                      }}>
                        {sev.icon}
                      </div>

                      {/* Content */}
                      <div className={styles.cardBody}>
                        {/* Row 1: title + badge | time + dismiss */}
                        <div className={styles.cardTop}>
                          <div className={styles.cardTitleRow}>
                            <span className={styles.cardTitle}>{title}</span>
                            <span style={{
                              fontSize: 11, borderRadius: 99, padding: "2px 8px",
                              background: sev.bg, color: sev.color,
                              border: `1px solid ${sev.border}`,
                              fontWeight: 600, whiteSpace: "nowrap",
                            }}>
                              {sev.badge}
                            </span>
                          </div>
                          <div className={styles.cardRight}>
                            <span className={styles.cardTime}>{relTime(n.timestamp, t)}</span>
                            <button
                              type="button"
                              className={styles.dismissBtn}
                              aria-label="Dismiss notification"
                              onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}
                            >
                              ×
                            </button>
                          </div>
                        </div>

                        {/* Row 2: Body text */}
                        <p className={styles.cardText}>{body}</p>

                        {/* Row 3: Action link */}
                        {actionLabel && (
                          <button
                            type="button"
                            className={styles.cardAction}
                            style={{ color: sev.color }}
                            onClick={(e) => { e.stopPropagation(); handleAction(n); }}
                          >
                            {actionLabel} {isArabic ? "←" : "→"}
                          </button>
                        )}
                      </div>

                      {/* Unread indicator dot */}
                      {!n.read && (
                        <div style={{
                          position: "absolute",
                          top: 14,
                          insetInlineEnd: 16,
                          width: 8, height: 8, borderRadius: "50%",
                          background: sev.color, flexShrink: 0,
                        }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
