import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "./AuthContext";

interface SidebarPreferences {
  hiddenItems: string[];       // item paths
  collapsedSections: string[]; // "workspace:sectionTitle"
  pinnedItems: string[];       // item paths (appear at top of nav)
}

const DEFAULTS: SidebarPreferences = {
  hiddenItems: [],
  collapsedSections: [],
  pinnedItems: [],
};

interface SidebarPreferencesContextValue {
  hiddenItems: string[];
  collapsedSections: string[];
  pinnedItems: string[];
  hideItem: (path: string) => void;
  showItem: (path: string) => void;
  toggleItem: (path: string) => void;
  isHidden: (path: string) => boolean;
  collapseSection: (key: string) => void;
  expandSection: (key: string) => void;
  toggleSection: (key: string) => void;
  isSectionCollapsed: (key: string) => boolean;
  pinItem: (path: string) => void;
  unpinItem: (path: string) => void;
  isPinned: (path: string) => boolean;
  resetToDefaults: () => void;
}

const SidebarPreferencesContext = createContext<SidebarPreferencesContextValue | null>(null);

function storageKey(userId: string) {
  return `atlas-sidebar-prefs-${userId}`;
}

function load(userId: string): SidebarPreferences {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<SidebarPreferences>) };
  } catch {
    return { ...DEFAULTS };
  }
}

function save(userId: string, prefs: SidebarPreferences) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(prefs));
  } catch {
    // storage full — ignore
  }
}

export function SidebarPreferencesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.username ?? "guest";
  const userIdRef = useRef(userId);

  // Keep ref in sync without triggering re-render
  useEffect(() => {
    userIdRef.current = userId;
  });

  const [prefs, setPrefs] = useState<SidebarPreferences>(() => load(userId));

  // Reload when user changes
  useEffect(() => {
    setPrefs(load(userId));
  }, [userId]);

  const update = useCallback((updater: (prev: SidebarPreferences) => SidebarPreferences) => {
    setPrefs((prev) => {
      const next = updater(prev);
      save(userIdRef.current, next);
      return next;
    });
  }, []);

  const hideItem = useCallback((path: string) => {
    update((p) => ({ ...p, hiddenItems: [...new Set([...p.hiddenItems, path])] }));
  }, [update]);

  const showItem = useCallback((path: string) => {
    update((p) => ({ ...p, hiddenItems: p.hiddenItems.filter((x) => x !== path) }));
  }, [update]);

  const toggleItem = useCallback((path: string) => {
    update((p) =>
      p.hiddenItems.includes(path)
        ? { ...p, hiddenItems: p.hiddenItems.filter((x) => x !== path) }
        : { ...p, hiddenItems: [...p.hiddenItems, path] }
    );
  }, [update]);

  const isHidden = useCallback((path: string) => prefs.hiddenItems.includes(path), [prefs.hiddenItems]);

  const collapseSection = useCallback((key: string) => {
    update((p) => ({ ...p, collapsedSections: [...new Set([...p.collapsedSections, key])] }));
  }, [update]);

  const expandSection = useCallback((key: string) => {
    update((p) => ({ ...p, collapsedSections: p.collapsedSections.filter((x) => x !== key) }));
  }, [update]);

  const toggleSection = useCallback((key: string) => {
    update((p) =>
      p.collapsedSections.includes(key)
        ? { ...p, collapsedSections: p.collapsedSections.filter((x) => x !== key) }
        : { ...p, collapsedSections: [...p.collapsedSections, key] }
    );
  }, [update]);

  const isSectionCollapsed = useCallback((key: string) => prefs.collapsedSections.includes(key), [prefs.collapsedSections]);

  const pinItem = useCallback((path: string) => {
    update((p) => ({ ...p, pinnedItems: [...new Set([...p.pinnedItems, path])] }));
  }, [update]);

  const unpinItem = useCallback((path: string) => {
    update((p) => ({ ...p, pinnedItems: p.pinnedItems.filter((x) => x !== path) }));
  }, [update]);

  const isPinned = useCallback((path: string) => prefs.pinnedItems.includes(path), [prefs.pinnedItems]);

  const resetToDefaults = useCallback(() => {
    update(() => ({ ...DEFAULTS }));
  }, [update]);

  return (
    <SidebarPreferencesContext.Provider
      value={{
        hiddenItems: prefs.hiddenItems,
        collapsedSections: prefs.collapsedSections,
        pinnedItems: prefs.pinnedItems,
        hideItem,
        showItem,
        toggleItem,
        isHidden,
        collapseSection,
        expandSection,
        toggleSection,
        isSectionCollapsed,
        pinItem,
        unpinItem,
        isPinned,
        resetToDefaults,
      }}
    >
      {children}
    </SidebarPreferencesContext.Provider>
  );
}

export function useSidebarPreferences() {
  const ctx = useContext(SidebarPreferencesContext);
  if (!ctx) throw new Error("useSidebarPreferences must be used inside SidebarPreferencesProvider");
  return ctx;
}
