import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useData } from "./DataContext";
import { useFactory } from "./FactoryContext";
import { POS_REFUNDS, LOYALTY_PROFILES, LOYALTY_SETTINGS_DEFAULT } from "../data/posMock";
import { formatCurrencyValue, formatIntegerValue } from "../utils/displayFormatters";

export type NotificationSeverity = "info" | "warning" | "error" | "success";
export type NotificationCategory = "invoice" | "inventory" | "factory" | "pos" | "loyalty" | "system" | "hr";

export interface Notification {
  id: string;
  title: string;
  titleAr: string;
  body: string;
  bodyAr: string;
  category: NotificationCategory;
  severity: NotificationSeverity;
  timestamp: Date;
  read: boolean;
  actionLabel?: string;
  actionLabelAr?: string;
  actionRoute?: string;
  entityId?: string;
}

interface NotificationsContextValue {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismiss: (id: string) => void;
  clearAll: () => void;
  addNotification: (n: Omit<Notification, "id" | "timestamp" | "read">) => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

const STORAGE_KEY = "atlas-notif-state-v1";
const MANUAL_KEY = "atlas-notif-manual-v1";
interface NotifState { read: string[]; dismissed: string[] }

function loadManual(): Omit<Notification, "read">[] {
  try {
    const raw = localStorage.getItem(MANUAL_KEY);
    if (raw) {
      const arr = JSON.parse(raw) as Array<Omit<Notification, "read"> & { timestamp: string }>;
      return arr.map((n) => ({ ...n, timestamp: new Date(n.timestamp) }));
    }
  } catch { /* ignore */ }
  return [];
}

function loadState(): NotifState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as NotifState;
  } catch { /* ignore */ }
  return { read: [], dismissed: [] };
}

const SEV_RANK: Record<NotificationSeverity, number> = { error: 0, warning: 1, info: 2, success: 3 };

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { invoices, customers } = useData();
  const { rawMaterials, batches, factoryOrders } = useFactory();

  const [state, setState] = useState<NotifState>(loadState);
  const [manual, setManual] = useState<Omit<Notification, "read">[]>(loadManual);

  const generated = useMemo((): Omit<Notification, "read">[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().slice(0, 10);
    const in3 = new Date(today);
    in3.setDate(today.getDate() + 3);
    const in3Str = in3.toISOString().slice(0, 10);

    const list: Omit<Notification, "read">[] = [];

    // ── Invoices ─────────────────────────────────────────────────────────────
    for (const inv of invoices) {
      if (!inv.date || inv.status === "Paid") continue;
      const customerName = customers.find((c) => c.id === inv.customerId)?.name ?? inv.customerId;
      const amount = formatCurrencyValue(inv.amount ?? inv.total ?? 0);

      if (inv.date < todayStr) {
        list.push({
          id: `notif:invoice:overdue:${inv.id}`,
          entityId: inv.id,
          category: "invoice",
          severity: "error",
          title: "Overdue Invoice",
          titleAr: "فاتورة متأخرة",
          body: `${customerName} — ${amount} overdue since ${inv.date}`,
          bodyAr: `${customerName} — ${amount} متأخرة منذ ${inv.date}`,
          timestamp: new Date(inv.date),
          actionLabel: "View Invoice",
          actionLabelAr: "عرض الفاتورة",
          actionRoute: `/invoices?highlight=${inv.id}`,
        });
      } else if (inv.date <= in3Str) {
        list.push({
          id: `notif:invoice:due-soon:${inv.id}`,
          entityId: inv.id,
          category: "invoice",
          severity: "warning",
          title: "Invoice Due Soon",
          titleAr: "فاتورة تستحق قريباً",
          body: `${customerName} — ${amount} due on ${inv.date}`,
          bodyAr: `${customerName} — ${amount} تستحق بتاريخ ${inv.date}`,
          timestamp: new Date(inv.date),
          actionLabel: "View Invoice",
          actionLabelAr: "عرض الفاتورة",
          actionRoute: `/invoices?highlight=${inv.id}`,
        });
      }
    }

    // ── Raw Materials ─────────────────────────────────────────────────────────
    for (const mat of rawMaterials) {
      if (mat.onHand > mat.reorderPoint) continue;
      const isOut = mat.onHand === 0;
      list.push({
        id: `notif:inventory:${isOut ? "out" : "low"}:${mat.id}`,
        entityId: mat.id,
        category: "inventory",
        severity: isOut ? "error" : "warning",
        title: isOut ? "Out of Stock" : "Low Stock Alert",
        titleAr: isOut ? "نفاد المخزون" : "تحذير: مخزون منخفض",
        body: `${mat.name} — ${mat.onHand} ${mat.unit} remaining (reorder at ${mat.reorderPoint})`,
        bodyAr: `${mat.nameAr ?? mat.name} — ${mat.onHand} ${mat.unit} متبقٍ (إعادة الطلب عند ${mat.reorderPoint})`,
        timestamp: new Date(),
        actionLabel: "View Material",
        actionLabelAr: "عرض المادة",
        actionRoute: "/factory/inventory/raw",
      });
    }

    // ── Batches on hold (quarantine) ──────────────────────────────────────────
    for (const batch of batches) {
      if (batch.status !== "quarantine") continue;
      list.push({
        id: `notif:factory:batch-hold:${batch.id}`,
        entityId: batch.id,
        category: "factory",
        severity: "error",
        title: "Batch On Hold",
        titleAr: "دفعة معلّقة",
        body: `Batch ${batch.id} — ${batch.productName}: QC failed, requires review`,
        bodyAr: `الدفعة ${batch.id} — ${batch.productName}: فشل فحص الجودة، يتطلب مراجعة`,
        timestamp: new Date(),
        actionLabel: "View QC",
        actionLabelAr: "عرض الجودة",
        actionRoute: "/factory/qc",
      });
    }

    // ── Production orders delayed ─────────────────────────────────────────────
    for (const order of factoryOrders) {
      if (order.status !== "in-progress" || !order.dueDate || order.dueDate >= todayStr) continue;
      const daysLate = Math.floor((today.getTime() - new Date(order.dueDate).getTime()) / 86_400_000);
      list.push({
        id: `notif:factory:order-delayed:${order.id}`,
        entityId: order.id,
        category: "factory",
        severity: "error",
        title: "Production Order Delayed",
        titleAr: "أمر إنتاج متأخر",
        body: `Order ${order.id} — ${order.productId} overdue by ${daysLate} day${daysLate !== 1 ? "s" : ""}`,
        bodyAr: `أمر الإنتاج ${order.id} — ${order.productId} متأخر بـ ${daysLate} يوم`,
        timestamp: new Date(order.dueDate),
        actionLabel: "View Order",
        actionLabelAr: "عرض الأمر",
        actionRoute: "/factory/orders",
      });
    }

    // ── POS refunds pending ───────────────────────────────────────────────────
    for (const refund of POS_REFUNDS) {
      if (refund.status !== "pending") continue;
      list.push({
        id: `notif:pos:refund:${refund.id}`,
        entityId: refund.id,
        category: "pos",
        severity: "warning",
        title: "Refund Pending Approval",
        titleAr: "استرداد بانتظار الموافقة",
        body: `Refund ${refund.id} — ₪${refund.refundAmount.toFixed(2)} awaiting approval`,
        bodyAr: `الاسترداد ${refund.id} — ₪${refund.refundAmount.toFixed(2)} بانتظار الموافقة`,
        timestamp: new Date(refund.date),
        actionLabel: "Review",
        actionLabelAr: "مراجعة",
        actionRoute: "/pos/refunds",
      });
    }

    // ── Loyalty coins expiring ────────────────────────────────────────────────
    const ls = LOYALTY_SETTINGS_DEFAULT;
    if (ls.expiryEnabled && ls.expiryMonths > 0) {
      const warnDays = ls.expiryWarningDays ?? 30;
      for (const profile of LOYALTY_PROFILES) {
        if (!profile.coinsBalance || profile.coinsBalance <= 0) continue;
        const expiryDate = new Date(profile.memberSince);
        expiryDate.setMonth(expiryDate.getMonth() + ls.expiryMonths);
        const daysLeft = Math.floor((expiryDate.getTime() - today.getTime()) / 86_400_000);
        if (daysLeft >= 0 && daysLeft <= warnDays) {
          list.push({
            id: `notif:loyalty:expiry:${profile.customerId}`,
            entityId: profile.customerId,
            category: "loyalty",
            severity: "info",
            title: "Coins Expiring Soon",
            titleAr: "نقاط الولاء على وشك الانتهاء",
            body: `${profile.customerName} — ${formatIntegerValue(profile.coinsBalance)} coins expire in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`,
            bodyAr: `${profile.customerName} — ${formatIntegerValue(profile.coinsBalance)} نقطة تنتهي خلال ${daysLeft} يوم`,
            timestamp: expiryDate,
            actionLabel: "View Profile",
            actionLabelAr: "عرض الملف",
            actionRoute: `/pos/loyalty/profile?id=${profile.customerId}`,
          });
        }
      }
    }

    return list.sort((a, b) => SEV_RANK[a.severity] - SEV_RANK[b.severity] || b.timestamp.getTime() - a.timestamp.getTime());
  }, [invoices, customers, rawMaterials, batches, factoryOrders]);

  const dismissedSet = useMemo(() => new Set(state.dismissed), [state.dismissed]);
  const readSet = useMemo(() => new Set(state.read), [state.read]);

  const notifications = useMemo((): Notification[] => {
    const allGenerated = [...generated, ...manual];
    const visible = allGenerated
      .filter((n) => !dismissedSet.has(n.id))
      .map((n) => ({ ...n, read: readSet.has(n.id) }));
    // unread first within same severity bucket
    return visible.sort((a, b) => {
      if (a.read !== b.read) return a.read ? 1 : -1;
      return SEV_RANK[a.severity] - SEV_RANK[b.severity] || b.timestamp.getTime() - a.timestamp.getTime();
    });
  }, [generated, manual, dismissedSet, readSet]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  function persist(next: NotifState) {
    setState(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  const markAsRead = useCallback((id: string) => {
    setState((prev) => {
      const next = { ...prev, read: [...new Set([...prev.read, id])] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setState((prev) => {
      const allIds = generated.filter((n) => !new Set(prev.dismissed).has(n.id)).map((n) => n.id);
      const next = { ...prev, read: [...new Set([...prev.read, ...allIds])] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, [generated]);

  const dismiss = useCallback((id: string) => {
    setState((prev) => {
      const next = { ...prev, dismissed: [...new Set([...prev.dismissed, id])] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setState((prev) => {
      const allIds = [...generated, ...manual].map((n) => n.id);
      const next = {
        read: [...new Set([...prev.read, ...allIds])],
        dismissed: [...new Set([...prev.dismissed, ...allIds])],
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, [generated, manual]);

  const addNotification = useCallback((n: Omit<Notification, "id" | "timestamp" | "read">) => {
    const id = `notif:manual:${Date.now()}:${Math.random().toString(36).slice(2)}`;
    const entry: Omit<Notification, "read"> = { ...n, id, timestamp: new Date() };
    setManual((prev) => {
      const next = [entry, ...prev].slice(0, 100); // keep latest 100
      localStorage.setItem(MANUAL_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // suppress unused warning on persist (used in clearAll/dismiss before refactor)
  void persist;

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, dismiss, clearAll, addNotification }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}
