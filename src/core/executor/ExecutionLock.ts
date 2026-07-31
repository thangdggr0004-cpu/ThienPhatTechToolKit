import { LockAcquisitionError } from './ExecutorErrors.js';

export class ExecutionLock {
  private isLocked: boolean = false;
  private lockedBy: string | null = null;

  public acquire(executionId: string): void {
    if (this.isLocked && this.lockedBy !== executionId) {
      throw new LockAcquisitionError('System is currently locked by another execution.');
    }
    this.isLocked = true;
    this.lockedBy = executionId;
  }

  public release(executionId: string): void {
    if (this.lockedBy === executionId) {
      this.isLocked = false;
      this.lockedBy = null;
    }
  }

  public get isCurrentlyLocked(): boolean {
    return this.isLocked;
  }
}