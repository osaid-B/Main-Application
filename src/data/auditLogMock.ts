import type { SystemAuditEntry } from "./types";

export const AUDIT_EVENTS: SystemAuditEntry[] = [
  { id: "AUD-001", timestamp: "2026-05-26T09:14:00Z", actorId: "USR-001", actorName: "Sara Halim", action: "login", entity: "session", entityId: "SES-001", ip: "192.168.1.10" },
  { id: "AUD-002", timestamp: "2026-05-26T09:16:32Z", actorId: "USR-001", actorName: "Sara Halim", action: "create", entity: "customer", entityId: "CUST-120", ip: "192.168.1.10" },
  { id: "AUD-003", timestamp: "2026-05-26T09:45:11Z", actorId: "USR-002", actorName: "Ahmad Nasser", action: "update", entity: "invoice", entityId: "INV-8801", diff: { status: { from: "Pending", to: "Paid" } }, ip: "192.168.1.22" },
  { id: "AUD-004", timestamp: "2026-05-26T10:02:55Z", actorId: "USR-001", actorName: "Sara Halim", action: "export", entity: "customer", entityId: "bulk", ip: "192.168.1.10" },
  { id: "AUD-005", timestamp: "2026-05-26T10:30:04Z", actorId: "USR-003", actorName: "Laila Mansour", action: "delete", entity: "product", entityId: "PROD-099", ip: "10.0.0.5" },
  { id: "AUD-006", timestamp: "2026-05-25T14:20:00Z", actorId: "USR-002", actorName: "Ahmad Nasser", action: "login", entity: "session", entityId: "SES-002", ip: "192.168.1.22" },
  { id: "AUD-007", timestamp: "2026-05-25T14:25:18Z", actorId: "USR-002", actorName: "Ahmad Nasser", action: "create", entity: "purchase", entityId: "PO-1012", ip: "192.168.1.22" },
  { id: "AUD-008", timestamp: "2026-05-25T15:00:44Z", actorId: "USR-003", actorName: "Laila Mansour", action: "update", entity: "supplier", entityId: "SUP-1005", diff: { phone: { from: "+970591111111", to: "+970592222222" } }, ip: "10.0.0.5" },
  { id: "AUD-009", timestamp: "2026-05-24T11:10:00Z", actorId: "USR-001", actorName: "Sara Halim", action: "create", entity: "invoice", entityId: "INV-8810", ip: "192.168.1.10" },
  { id: "AUD-010", timestamp: "2026-05-24T11:45:30Z", actorId: "USR-001", actorName: "Sara Halim", action: "export", entity: "payment", entityId: "bulk", ip: "192.168.1.10" },
];
