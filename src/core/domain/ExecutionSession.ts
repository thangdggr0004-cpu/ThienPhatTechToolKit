import { ActionHistory } from './ActionHistory.js';

/**
 * ExecutionSession tracks the entire lifecycle of a technician's interaction
 * from the moment the app is opened until it is closed.
 */
export interface ExecutionSession {
  sessionId: string;               // UUID
  startTime: number;
  endTime?: number;
  machineId: string;               // Unique hardware identifier of the client PC
  technicianName?: string;         // Optional name of the user
  history: ActionHistory[];        // All actions performed in this session
  isDirty: boolean;                // True if actions were performed but not yet verified
}
