import { ActionResult } from './ActionResult.js';
import { ActionExecution } from './ActionExecution.js';

/**
 * ActionHistory represents a permanently recorded entry of an action that ran.
 */
export interface ActionHistory {
  historyId: string;               // UUID
  execution: ActionExecution;      // The execution context
  result: ActionResult;            // The final result
  timestamp: number;               // When it finished
  undone: boolean;                 // Has this action been rolled back?
}
