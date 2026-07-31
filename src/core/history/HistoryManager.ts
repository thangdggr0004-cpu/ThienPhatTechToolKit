import { ExecutionSession } from '../domain/ExecutionSession.js';
import { ActionHistory } from '../domain/ActionHistory.js';
import { ActionResult } from '../domain/ActionResult.js';
import { ActionExecution } from '../domain/ActionExecution.js';
import { HistoryStorage } from './HistoryStorage.js';
import { AuditLogger, AuditLogLevel } from './AuditLogger.js';
import { NoActiveSessionError, SessionNotFoundError } from './HistoryErrors.js';

/**
 * Manages the history and session logging for the application.
 * Follows the Singleton pattern generally, but left as a standard class for DI.
 */
export class HistoryManager {
  private currentSession: ExecutionSession | null = null;

  constructor(
    private readonly storage: HistoryStorage,
    private readonly auditLogger: AuditLogger
  ) {}

  /**
   * Starts a new execution session.
   * End the previous one if it exists.
   */
  public async startSession(machineId: string, technicianName?: string): Promise<ExecutionSession> {
    if (this.currentSession) {
      await this.endSession();
    }

    const sessionId = this.generateId();
    this.currentSession = {
      sessionId,
      startTime: Date.now(),
      machineId,
      technicianName,
      history: [],
      isDirty: false
    };

    await this.storage.saveSession(this.currentSession);
    
    await this.auditLogger.log({
      level: AuditLogLevel.INFO,
      source: 'HistoryManager',
      sessionId,
      message: `Started new session for machine ${machineId}`
    });

    return this.currentSession;
  }

  /**
   * Ends the current active session.
   */
  public async endSession(): Promise<void> {
    if (!this.currentSession) {
      return;
    }

    this.currentSession.endTime = Date.now();
    await this.storage.saveSession(this.currentSession);

    await this.auditLogger.log({
      level: AuditLogLevel.INFO,
      source: 'HistoryManager',
      sessionId: this.currentSession.sessionId,
      message: 'Ended session'
    });

    this.currentSession = null;
  }

  /**
   * Gets the currently active session.
   * @throws NoActiveSessionError if there is no active session
   */
  public getActiveSession(): ExecutionSession {
    if (!this.currentSession) {
      throw new NoActiveSessionError();
    }
    return this.currentSession;
  }

  /**
   * Records an action result into the current active session.
   * Called by the ActionExecutor when an action finishes running.
   */
  public async recordAction(execution: ActionExecution, result: ActionResult): Promise<ActionHistory> {
    if (!this.currentSession) {
      throw new NoActiveSessionError();
    }

    const historyRecord: ActionHistory = {
      historyId: this.generateId(),
      execution,
      result,
      timestamp: Date.now(),
      undone: false
    };

    this.currentSession.history.push(historyRecord);
    this.currentSession.isDirty = true;

    // Persist immediately after recording an action
    await this.storage.saveSession(this.currentSession);

    // Audit log if it's an error or requires sensitive tracking (can be customized)
    if (!result.success) {
      await this.auditLogger.log({
        level: AuditLogLevel.WARN,
        source: 'HistoryManager',
        actionId: execution.actionId,
        sessionId: this.currentSession.sessionId,
        message: `Action execution failed`,
        details: { execution, result }
      });
    } else {
      await this.auditLogger.log({
        level: AuditLogLevel.INFO,
        source: 'HistoryManager',
        actionId: execution.actionId,
        sessionId: this.currentSession.sessionId,
        message: `Action execution succeeded`
      });
    }

    return historyRecord;
  }

  /**
   * Marks a specific action history as undone (e.g., after rollback).
   */
  public async markActionUndone(historyId: string): Promise<void> {
    if (!this.currentSession) {
      throw new NoActiveSessionError();
    }

    const record = this.currentSession.history.find(h => h.historyId === historyId);
    if (!record) {
      throw new Error(`ActionHistory with ID ${historyId} not found in current session.`);
    }

    record.undone = true;
    this.currentSession.isDirty = true;
    await this.storage.saveSession(this.currentSession);

    await this.auditLogger.log({
      level: AuditLogLevel.INFO,
      source: 'HistoryManager',
      actionId: record.execution.actionId,
      sessionId: this.currentSession.sessionId,
      message: `Action marked as undone (rollback)`
    });
  }

  /**
   * Generate unique identifier.
   */
  private generateId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
}
