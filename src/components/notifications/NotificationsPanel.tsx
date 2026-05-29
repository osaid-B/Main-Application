import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, CheckCheck, Factory, FileText, Package, ShoppingCart, Star, UserCheck, X } from "lucide-react";
import { useNotifications } from "../../context/NotificationsContext";
import type { Notification, NotificationCategory, NotificationSeverity } from "../../context/NotificationsContext";
import { useSettings } from "../../context/SettingsContext";
import styles from "./NotificationsPanel.module.css";

type T = ReturnType<typeof useSettings>["t"];

const CAT_ICON: Record<NotificationCategory, typeof FileText> = {
  invoice:   FileText,
  inventory: Package,
  factory:   Factory,
  pos:       ShoppingCart,
  loyalty:   Star,
  system:    Bell,
  hr:        UserCheck,
};

const SEV_CLASS: Record<NotificationSeverity, string> = {
  error:   styles.sevError,
  warning: styles.sevWarning,
  info:    styles.sevInfo,
  success: styles.sevSuccess,
};

type TabId = "all" | "unread" | NotificationCategory;

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
  return ts.toLocaleDateString();
}

export default function NotificationsPanel() {
  const { t, isArabic } = useSettings();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, dismiss, clearAll } = useNotifications();

  const [isOpen, setIsOpen]   = useState(false);
  const [tab, setTab]         = useState<TabId>("all");
  const panelRef              = useRef<HTMLDivElement>(null);
  const triggerRef            = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handler(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) setIsOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function handler(e: KeyboardEvent) { if (e.key === "Escape") setIsOpen(false); }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen]);

  const tn = t.notifications;
  const TABS: { id: TabId; label: string }[] = [
    { id: "all",       label: tn.tabs.all },
    { id: "unread",    label: unreadCount > 0 ? `${tn.tabs.unread} (${unreadCount})` : tn.tabs.unread },
    { id: "invoice",   label: tn.tabs.invoice },
    { id: "inventory", label: tn.tabs.inventory },
    { id: "factory",   label: tn.tabs.factory },
    { id: "pos",       label: tn.tabs.pos },
    { id: "loyalty",   label: tn.tabs.loyalty },
  ];

  const displayed = notifications.filter((n) => {
    if (tab === "all") return true;
    if (tab === "unread") return !n.read;
    return n.category === tab;
  });

  function handleAction(n: Notification) {
    markAsRead(n.id);
    if (n.actionRoute) { navigate(n.actionRoute); setIsOpen(false); }
  }

  function handleCardClick(n: Notification) {
    markAsRead(n.id);
  }

  return (
    <div className={styles.wrap}>
      <button
        ref={triggerRef}
        type="button"
        className="atlas-icon-btn"
        aria-label={tn.bell}
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((v) => !v)}
      >
        <Bell size={15} />
        {unreadCount > 0 && (
          <span className="atlas-notif-badge" aria-label={`${unreadCount} unread notifications`}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          ref={panelRef}
          className={styles.panel}
          role="dialog"
          aria-label={tn.panelTitle}
        >
          {/* Header */}
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>{tn.panelTitle}</span>
            <div className={styles.panelActions}>
              {unreadCount > 0 && (
                <button type="button" className={styles.actionLink} onClick={markAllAsRead} title={tn.markAllRead}>
                  <CheckCheck size={13} />
                </button>
              )}
              {notifications.length > 0 && (
                <button type="button" className={styles.actionLink} onClick={clearAll} title={tn.clearAll}>
                  <X size={13} />
                </button>
              )}
              <button type="button" className={styles.actionLink} onClick={() => { setIsOpen(false); navigate("/notifications"); }} title={tn.viewAll}>
                {tn.viewAll}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className={styles.tabs} role="tablist">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                className={`${styles.tab} ${tab === t.id ? styles.tabActive : ""}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* List */}
          <div className={styles.list}>
            {displayed.length === 0 ? (
              <div className={styles.empty}>
                <Check size={28} strokeWidth={1.5} />
                <p>{tn.empty}</p>
              </div>
            ) : (
              displayed.map((n) => <NotifCard key={n.id} n={n} onAction={handleAction} onDismiss={dismiss} onClick={handleCardClick} t={t} isArabic={isArabic} />)
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotifCard({
  n, onAction, onDismiss, onClick, t, isArabic,
}: {
  n: Notification;
  onAction: (n: Notification) => void;
  onDismiss: (id: string) => void;
  onClick: (n: Notification) => void;
  t: T;
  isArabic: boolean;
}) {
  const Icon = CAT_ICON[n.category];
  const title = isArabic ? (n.titleAr ?? n.title) : n.title;
  const body = isArabic ? (n.bodyAr ?? n.body) : n.body;
  const actionLabel = isArabic ? (n.actionLabelAr ?? n.actionLabel) : n.actionLabel;
  return (
    <div
      className={`${styles.card} ${SEV_CLASS[n.severity]} ${n.read ? styles.cardRead : styles.cardUnread}`}
      onClick={() => onClick(n)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick(n); }}
      aria-label={title}
    >
      <div className={styles.cardIcon}>
        <Icon size={14} />
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardTop}>
          <span className={styles.cardTitle}>{title}</span>
          <span className={styles.cardTime}>{relTime(n.timestamp, t)}</span>
        </div>
        <p className={styles.cardText}>{body}</p>
        {actionLabel && (
          <button
            type="button"
            className={styles.cardAction}
            onClick={(e) => { e.stopPropagation(); onAction(n); }}
          >
            {actionLabel} →
          </button>
        )}
      </div>
      <button
        type="button"
        className={styles.cardDismiss}
        aria-label="Dismiss"
        onClick={(e) => { e.stopPropagation(); onDismiss(n.id); }}
      >
        <X size={11} />
      </button>
    </div>
  );
}
