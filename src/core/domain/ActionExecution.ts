/**
 * Defines the strict lifecycle states of an executing action.
 */
export type ExecutionState = 
  | 'IDLE' 
  | 'VALIDATING' 
  | 'CONFIRM' 
  | 'BACKUP' 
  | 'RUNNING' 
  | 'SUCCESS' 
  | 'ERROR' 
  | 'AUTO_RESCAN' 
  | 'RECOMMENDATION' 
  | 'COMPLETE';

/**
 * ActionExecution tracks a single instance of a running SystemAction.
 */
export interface ActionExecution {
  executionId: string;             // UUID for this specific execution run
  actionId: string;                // Reference to the SystemAction being executed
  state: ExecutionState;           // Current lifecycle state
  startTime: number;               // Timestamp (ms)
  endTime?: number;                // Timestamp (ms) if completed
  progress: number;                // 0 to 100
  currentStepMessage: string;      // Real-time message (e.g., 'Đang dọn dẹp Registry...')
  payload?: any;                   // Dynamic arguments passed to the IPC backend
}
