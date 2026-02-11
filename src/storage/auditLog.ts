import { nanoid } from 'nanoid';
import { safeLocalStorage } from './safeStorage';

export type AuditLogEntry = {
  id: string;
  action: string;
  category: 'auth' | 'profile' | 'event' | 'calendar' | 'template' | 'settings' | 'system' | 'collaboration';
  timestamp: string;
  metadata?: Record<string, string>;
};

const AUDIT_KEY = 'nullcal:audit';
const MAX_ENTRIES = 200;

export const readAuditLog = (): AuditLogEntry[] => {
  const raw = safeLocalStorage.getItem(AUDIT_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as AuditLogEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const writeAuditLog = (entries: AuditLogEntry[]) => {
  safeLocalStorage.setItem(AUDIT_KEY, JSON.stringify(entries.slice(-MAX_ENTRIES)));
};

export const logAuditEvent = (payload: Omit<AuditLogEntry, 'id' | 'timestamp'>) => {
  const entry: AuditLogEntry = {
    id: nanoid(),
    timestamp: new Date().toISOString(),
    ...payload
  };
  const entries = readAuditLog();
  entries.push(entry);
  writeAuditLog(entries);
  return entry;
};

export const clearAuditLog = () => {
  safeLocalStorage.removeItem(AUDIT_KEY);
};
