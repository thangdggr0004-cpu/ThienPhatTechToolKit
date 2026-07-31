/**
 * ActionResult represents the final payload returned after an ActionExecution completes.
 */
export interface ActionResult {
  executionId: string;             // Reference to the execution run
  actionId: string;                // Reference to the SystemAction
  success: boolean;                // Did the backend script succeed?
  exitCode: number;                // OS exit code (0 usually means success)
  stdout: string;                  // Standard output log
  stderr: string;                  // Standard error log
  executionTimeMs: number;         // Total time taken in milliseconds
  errorDetails?: {
    code: string;
    message: string;
    isRecoverable: boolean;
  };
}
