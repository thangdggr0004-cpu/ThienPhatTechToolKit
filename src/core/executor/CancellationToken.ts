import { ExecutionCancelledError } from './ExecutorErrors.js';

export class CancellationToken {
  private _isCancelled: boolean = false;
  private _reason?: string;

  public get isCancelled(): boolean {
    return this._isCancelled;
  }

  public get reason(): string | undefined {
    return this._reason;
  }

  public cancel(reason?: string): void {
    this._isCancelled = true;
    this._reason = reason;
  }

  public throwIfCancelled(): void {
    if (this._isCancelled) {
      throw new ExecutionCancelledError(this._reason || 'Execution was cancelled.');
    }
  }
}