import { AuditLogger, AuditLogEntry, AuditLogLevel } from './AuditLogger.js';

/**
 * In-memory implementation of AuditLogger.
 * Suitable for testing or ephemeral executions.
 */
export class MemoryAuditLogger implements AuditLogger {
  private logs: AuditLogEntry[] = [];

  async log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    const newEntry: AuditLogEntry = {
      ...entry,
      id: this.generateId(),
      timestamp: Date.now()
    };
    
    // Deep clone to ensure the log is immutable once recorded
    this.logs.push(JSON.parse(JSON.stringify(newEntry)));
  }

  async getLogs(): Promise<AuditLogEntry[]> {
    // Return a deep copy to prevent external mutation
    return JSON.parse(JSON.stringify(this.logs));
  }

  /**
   * Clears all audit logs. Specific to the memory implementation.
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * Simple ID generator fallback.
   */
  private generateId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
}
