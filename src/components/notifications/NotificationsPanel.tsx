import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, CheckCheck, Factory, FileText, Package, ShoppingCart, Star, X } from "lucide-react";
import { useNotifications } from "../../context/NotificationsContext";
import type { Notification, NotificationCategory, NotificationSeverity } from "../../context/NotificationsContext";
import { useSettings } from "../../context/SettingsContext";
import styles from "./NotificationsPanel.module.css";

const CAT_ICON: Record<NotificationCategory, typeof FileText> = {
  invoice:   FileText,
  inventory: Package,
  factory:   Factory,
  pos:       ShoppingCart,
  loyalty:   Star,
  system:    Bell,
};

const SEV_CLASS: Record<NotificationSeverity, string> = {
  error:   styles.sevError,
  warning: styles.sevWarning,
  info:    styles.sevInfo,
  success: styles.sevSuccess,
};

type TabId = "all" | "unread" | NotificationCategory;

function relTime(ts: Date): string {
  const diffMs = Date.now() - ts.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "yesterday";
  if (diffD < 7) return `${diffD}d ago`;
  return ts.toLocaleDateString();
}

export default function NotificationsPanel() {
  const { t } = useSettings();
  const tc = (t as Record<string, unknown>).notifications as Record<string, string & Record<string, string>>;
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

  const TABS: { id: TabId; label: string }[] = [
    { id: "all",       label: tc?.tabs?.all      ?? "All" },
    { id: "unread",    label: `${tc?.tabs?.unread ?? "Unread"}${unreadCount > 0 ? ` (${unreadCount})` : ""}` },
    { id: "invoice",   label: tc?.tabs?.invoice   ?? "Invoices" },
    { id: "inventory", label: tc?.tabs?.inventory ?? "Inventory" },
    { id: "factory",   label: tc?.tabs?.factory   ?? "Factory" },
    { id: "pos",       label: tc?.tabs?.pos       ?? "POS" },
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
        aria-label={tc?.bell ?? "Notifications"}
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
          aria-label={tc?.panelTitle ?? "Notifications"}
        >
          {/* Header */}
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>{tc?.panelTitle ?? "Notifications"}</span>
            <div className={styles.panelActions}>
              {unreadCount > 0 && (
                <button type="button" className={styles.actionLink} onClick={markAllAsRead} title={tc?.markAllRead ?? "Mark all read"}>
                  <CheckCheck size={13} />
                </button>
              )}
              {notifications.length > 0 && (
                <button type="button" className={styles.actionLink} onClick={clearAll} title={tc?.clearAll ?? "Clear all"}>
                  <X size={13} />
                </button>
              )}
              <button type="button" className={styles.actionLink} onClick={() => { setIsOpen(false); navigate("/notifications"); }} title={tc?.viewAll ?? "View all"}>
                {tc?.viewAll ?? "View all"}
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
                <p>{tc?.empty ?? "All caught up!"}</p>
              </div>
            ) : (
              displayed.map((n) => <NotifCard key={n.id} n={n} onAction={handleAction} onDismiss={dismiss} onClick={handleCardClick} />)
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotifCard({
  n, onAction, onDismiss, onClick,
}: {
  n: Notification;
  onAction: (n: Notification) => void;
  onDismiss: (id: string) => void;
  onClick: (n: Notification) => void;
}) {
  const Icon = CAT_ICON[n.category];
  return (
    <div
      className={`${styles.card} ${SEV_CLASS[n.severity]} ${n.read ? styles.cardRead : styles.cardUnread}`}
      onClick={() => onClick(n)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick(n); }}
      aria-label={n.title}
    >
      <div className={styles.cardIcon}>
        <Icon size={14} />
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardTop}>
          <span className={styles.cardTitle}>{n.title}</span>
          <span className={styles.cardTime}>{relTime(n.timestamp)}</span>
        </div>
        <p className={styles.cardText}>{n.body}</p>
        {n.actionLabel && (
          <button
            type="button"
            className={styles.cardAction}
            onClick={(e) => { e.stopPropagation(); onAction(n); }}
          >
            {n.actionLabel} →
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
