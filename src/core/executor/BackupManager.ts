import { ExecutionContext } from './ExecutionContext.js';

export interface IBackupManager {
  createBackup(context: ExecutionContext): Promise<string>;
}

export class BackupManager implements IBackupManager {
  public async createBackup(context: ExecutionContext): Promise<string> {
    context.token.throwIfCancelled();
    // Simulate IPC call for backup
    return `backup_${context.executionId}`;
  }
}