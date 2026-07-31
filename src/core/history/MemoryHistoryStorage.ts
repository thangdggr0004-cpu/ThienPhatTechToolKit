import { HistoryStorage } from './HistoryStorage.js';
import { ExecutionSession } from '../domain/ExecutionSession.js';
import { SessionNotFoundError } from './HistoryErrors.js';

/**
 * In-memory implementation of HistoryStorage.
 * Useful for testing or when persistence is not yet required.
 */
export class MemoryHistoryStorage implements HistoryStorage {
  private sessions: Map<string, ExecutionSession> = new Map();

  async saveSession(session: ExecutionSession): Promise<void> {
    // Deep clone to ensure immutability and prevent external mutations
    this.sessions.set(session.sessionId, JSON.parse(JSON.stringify(session)));
  }

  async getSession(sessionId: string): Promise<ExecutionSession | null> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }
    return JSON.parse(JSON.stringify(session));
  }

  async getAllSessions(): Promise<ExecutionSession[]> {
    const allSessions = Array.from(this.sessions.values());
    return JSON.parse(JSON.stringify(allSessions));
  }

  /**
   * Clears all stored sessions. Specific to the memory implementation.
   */
  clear(): void {
    this.sessions.clear();
  }
}
