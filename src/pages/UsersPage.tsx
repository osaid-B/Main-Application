import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Search, Shield, Users } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { ROLE_LABELS } from "../lib/permissions";
import type { Role } from "../lib/permissions";
import { Button } from "../components/ui/Button";
import { Avatar } from "../components/ui/Avatar";
import { Container } from "../components/layout/Container";

const USERS_STORAGE_KEY = "atlas_users_data";

interface StoredUser {
  id: string;
  username: string;
  email: string;
  role: Role;
  active: boolean;
  lastLogin: string;
  createdAt: string;
}

const DEFAULT_USERS: StoredUser[] = [
  { id: "1", username: "admin",   email: "admin@atlas.ps",   role: "admin",   active: true, lastLogin: new Date().toISOString(), createdAt: "2025-01-01" },
  { id: "2", username: "manager", email: "manager@atlas.ps", role: "manager", active: true, lastLogin: new Date().toISOString(), createdAt: "2025-01-01" },
  { id: "3", username: "cashier", email: "cashier@atlas.ps", role: "cashier", active: true, lastLogin: new Date().toISOString(), createdAt: "2025-02-01" },
];

function loadUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as StoredUser[];
  } catch { /* ignore */ }
  return DEFAULT_USERS;
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

const ALL_ROLES: Role[] = ["admin", "manager", "cashier"];

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { isArabic } = useSettings();
  const [users, setUsers] = useState<StoredUser[]>(() => loadUsers());
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  const handleRoleChange = (userId: string, newRole: Role) => {
    setSavingUserId(userId);
    setTimeout(() => {
      setUsers((prev) => {
        const updated = prev.map((u) =>
          u.id === userId ? { ...u, role: newRole } : u
        );
        saveUsers(updated);
        return updated;
      });
      setSavingUserId(null);
    }, 200);
  };

  const handleToggleActive = (userId: string) => {
    setUsers((prev) => {
      const updated = prev.map((u) =>
        u.id === userId ? { ...u, active: !u.active } : u
      );
      saveUsers(updated);
      return updated;
    });
  };

  return (
    <Container>
      <div style={{ direction: "rtl", padding: "16px 0" }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 24,
        }}>
          <div>
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              fontSize: 13, fontWeight: 600, color: "#2563EB", marginBottom: 4,
            }}>
              <Users size={16} />
              {isArabic ? "إدارة المستخدمين" : "User Management"}
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", margin: 0 }}>
              {isArabic ? "المستخدمون" : "Users"}
            </h2>
          </div>
          <div style={{
            fontSize: 13, color: "#64748B", background: "#F8FAFC",
            padding: "8px 14px", borderRadius: 8, border: "1px solid #E2E8F0",
          }}>
            {isArabic ? "إجمالي المستخدمين" : "Total Users"}: <strong>{users.length}</strong>
          </div>
        </div>

        {/* Search */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "#F8FAFC", border: "1px solid #E2E8F0",
          borderRadius: 10, padding: "8px 12px", marginBottom: 20,
        }}>
          <Search size={16} color="#94A3B8" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isArabic ? "بحث عن مستخدم..." : "Search users..."}
            style={{
              flex: 1, border: "none", background: "transparent",
              fontSize: 14, outline: "none", fontFamily: "inherit",
              color: "#0F172A",
            }}
          />
        </div>

        {/* Users List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((u) => {
            const isExpanded = expandedId === u.id;
            const isSaving = savingUserId === u.id;
            const isSelf = currentUser?.username === u.username;

            return (
              <div
                key={u.id}
                style={{
                  background: "white",
                  border: `1px solid ${isSelf ? "#DBEAFE" : "#E2E8F0"}`,
                  borderRadius: 12,
                  transition: "border-color 200ms",
                }}
              >
                {/* Row */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr auto",
                    gap: 12, padding: "14px 16px",
                    alignItems: "center", cursor: "pointer",
                  }}
                  onClick={() => setExpandedId(isExpanded ? null : u.id)}
                >
                  {/* Name + Avatar */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar name={u.username} size="sm" tone={u.active ? "accent" : "neutral"} />
                    <div>
                      <div style={{
                        fontSize: 14, fontWeight: 600,
                        color: u.active ? "#0F172A" : "#94A3B8",
                      }}>
                        {u.username}
                        {isSelf && (
                          <span style={{
                            fontSize: 11, color: "#2563EB", marginRight: 6,
                            background: "#EFF6FF", padding: "1px 6px",
                            borderRadius: 4, fontWeight: 500,
                          }}>
                            {isArabic ? "أنت" : "You"}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: "#94A3B8" }}>{u.email}</div>
                    </div>
                  </div>

                  {/* Role */}
                  <div style={{ fontSize: 13, color: "#475569" }}>
                    {ROLE_LABELS[u.role]?.[isArabic ? "ar" : "en"] || u.role}
                  </div>

                  {/* Status */}
                  <div>
                    <span style={{
                      fontSize: 12, fontWeight: 500,
                      padding: "3px 10px", borderRadius: 20,
                      background: u.active ? "#ECFDF5" : "#FEF2F2",
                      color: u.active ? "#059669" : "#DC2626",
                    }}>
                      {u.active
                        ? (isArabic ? "نشط" : "Active")
                        : (isArabic ? "غير نشط" : "Inactive")}
                    </span>
                  </div>

                  {/* Expand toggle */}
                  <div style={{ color: "#94A3B8" }}>
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>
                </div>

                {/* Expanded: Edit role + actions */}
                {isExpanded && (
                  <div style={{
                    borderTop: "1px solid #F1F5F9",
                    padding: "16px",
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between", gap: 16,
                    flexWrap: "wrap",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Shield size={14} color="#64748B" />
                      <span style={{ fontSize: 13, color: "#475569", fontWeight: 500 }}>
                        {isArabic ? "الدور" : "Role"}:
                      </span>
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                        disabled={isSaving}
                        style={{
                          padding: "6px 10px", borderRadius: 8,
                          border: "1px solid #E2E8F0", fontSize: 13,
                          fontFamily: "inherit", background: "white",
                          color: "#0F172A", cursor: "pointer",
                          outline: "none", minWidth: 140,
                          opacity: isSaving ? 0.6 : 1,
                        }}
                      >
                        {ALL_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABELS[r]?.[isArabic ? "ar" : "en"] || r}
                          </option>
                        ))}
                      </select>
                      {isSaving && (
                        <span style={{ fontSize: 12, color: "#2563EB" }}>
                          {isArabic ? "جاري الحفظ..." : "Saving..."}
                        </span>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <Button
                        variant={u.active ? "secondary" : "primary"}
                        size="sm"
                        type="button"
                        onClick={() => handleToggleActive(u.id)}
                      >
                        {u.active
                          ? (isArabic ? "تعطيل" : "Deactivate")
                          : (isArabic ? "تفعيل" : "Activate")}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div style={{
            textAlign: "center", padding: "60px 20px",
            color: "#94A3B8", fontSize: 14,
          }}>
            {isArabic ? "لا توجد نتائج مطابقة" : "No matching users found"}
          </div>
        )}
      </div>
    </Container>
  );
}
