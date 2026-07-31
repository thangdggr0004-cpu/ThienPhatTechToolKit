import { ExecutionSession } from '../domain/ExecutionSession.js';

/**
 * Interface for storing and retrieving ExecutionSessions.
 * Supports different implementations (Memory, FileSystem, Database).
 */
export interface HistoryStorage {
  /**
   * Saves or updates a session in the storage.
   * @param session The execution session to save
   */
  saveSession(session: ExecutionSession): Promise<void>;

  /**
   * Retrieves a session by its ID.
   * @param sessionId The unique identifier of the session
   * @returns The session if found, or null
   */
  getSession(sessionId: string): Promise<ExecutionSession | null>;

  /**
   * Retrieves all sessions.
   * @returns Array of all execution sessions
   */
  getAllSessions(): Promise<ExecutionSession[]>;
}
