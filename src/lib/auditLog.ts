// ATLAS ERP — Audit Log
// Logs sensitive actions with user context.

export interface AuditEntry {
  id: string
  userId: string
  userRole: string
  username: string
  action: 'create' | 'edit' | 'delete' | 'approve' | 'reject' | 'void' | 'reconcile' | 'export' | 'login' | 'logout'
  resource: string
  resourceId: string
  details?: Record<string, unknown>
  timestamp: string
  ipAddress: string
}

const AUDIT_STORAGE_KEY = 'atlas_audit_log'

function loadAuditLog(): AuditEntry[] {
  try {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY)
    if (raw) return JSON.parse(raw) as AuditEntry[]
  } catch { /* ignore */ }
  return []
}

function saveAuditLog(entries: AuditEntry[]) {
  localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(entries))
}

let idCounter = Date.now()
function generateId(): string {
  return `audit_${++idCounter}`
}

export function logAction(
  userId: string,
  username: string,
  userRole: string,
  action: AuditEntry['action'],
  resource: string,
  resourceId: string,
  details?: Record<string, unknown>,
): AuditEntry {
  const entry: AuditEntry = {
    id: generateId(),
    userId,
    username,
    userRole,
    action,
    resource,
    resourceId,
    details,
    timestamp: new Date().toISOString(),
    ipAddress: window.location.hostname,
  }

  const log = loadAuditLog()
  log.push(entry)
  // Keep last 1000 entries
  if (log.length > 1000) log.splice(0, log.length - 1000)
  saveAuditLog(log)

  return entry
}

export function getAuditLog(): AuditEntry[] {
  return loadAuditLog().reverse()
}

export function clearAuditLog() {
  localStorage.removeItem(AUDIT_STORAGE_KEY)
}
