import { ExecutionContext } from './ExecutionContext.js';

export interface IRollbackManager {
  rollback(context: ExecutionContext, backupId: string): Promise<boolean>;
}

export class RollbackManager implements IRollbackManager {
  public async rollback(context: ExecutionContext, backupId: string): Promise<boolean> {
    // Simulate IPC call for rollback
    return true;
  }
}