import { SystemAction, SystemSnapshot, ActionResult } from '../domain/index.js';
import { ExecutorState } from './ExecutionState.js';
import { ExecutionContext } from './ExecutionContext.js';
import { CancellationToken } from './CancellationToken.js';
import { EventBus } from './EventBus.js';
import { ExecutionValidator } from './ExecutionValidator.js';
import { ExecutionLock } from './ExecutionLock.js';
import { BackupManager, IBackupManager } from './BackupManager.js';
import { RollbackManager, IRollbackManager } from './RollbackManager.js';
import { ExecutionEventType } from './ExecutionEvents.js';
import { ExecutorError } from './ExecutorErrors.js';
import { RetryPolicy } from './RetryPolicy.js';

export interface IBackendAdapter {
  execute(actionId: string, payload: any): Promise<ActionResult>;
}

export class ActionExecutor {
  private lock: ExecutionLock = new ExecutionLock();
  private backupManager: IBackupManager = new BackupManager();
  private rollbackManager: IRollbackManager = new RollbackManager();

  constructor(private backendAdapter: IBackendAdapter) {}

  public async execute(
    action: SystemAction,
    snapshot: SystemSnapshot,
    bus: EventBus,
    payload: Record<string, unknown> = {}
  ): Promise<ActionResult> {
    const token = new CancellationToken();
    const executionId = crypto.randomUUID();
    const context: ExecutionContext = {
      executionId,
      action,
      token,
      bus,
      payload,
      startTime: Date.now()
    };

    let backupId: string | undefined;

    const emitState = (state: ExecutorState) => {
      bus.publish({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        type: ExecutionEventType.STATE_CHANGED,
        actionId: action.id,
        state
      });
    };

    try {
      emitState(ExecutorState.IDLE);
      
      // VALIDATING
      emitState(ExecutorState.VALIDATING);
      ExecutionValidator.validate(action, snapshot);
      
      // CONFIRM (assumed handled by UI before calling execute, but keeping state transition)
      emitState(ExecutorState.CONFIRM);
      
      // BACKUP
      if (action.requireBackup) {
        emitState(ExecutorState.BACKUP);
        backupId = await this.backupManager.createBackup(context);
      }

      // QUEUE (Skipped in direct execute, handled by scheduler if used)
      emitState(ExecutorState.QUEUE);
      
      // LOCK
      emitState(ExecutorState.LOCK);
      this.lock.acquire(executionId);

      // RUNNING
      emitState(ExecutorState.RUNNING);
      
      let finalResult: ActionResult;

      const result = await RetryPolicy.executeWithRetry(
        () => this.backendAdapter.execute(action.id, payload),
        3, 
        1000, 
        token
      );

      finalResult = result;

      if (result.success) {
        emitState(ExecutorState.SUCCESS);
      } else {
        emitState(ExecutorState.ERROR);
        throw new ExecutorError('Backend returned failure exit code.');
      }
      
      return finalResult;
      
    } catch (error: any) {
      emitState(ExecutorState.ERROR);
      
      if (backupId) {
        emitState(ExecutorState.ROLLBACK);
        await this.rollbackManager.rollback(context, backupId);
      }

      return {
        executionId,
        actionId: action.id,
        success: false,
        exitCode: 1,
        stdout: '',
        stderr: error.message,
        executionTimeMs: Date.now() - context.startTime,
        data: null,
        error: error.message
      } as any;
    } finally {
      // AUTO RESCAN
      emitState(ExecutorState.AUTO_RESCAN);
      
      // RECOMMENDATION
      emitState(ExecutorState.RECOMMENDATION);
      
      // UNLOCK
      emitState(ExecutorState.UNLOCK);
      this.lock.release(executionId);
      
      // COMPLETE
      emitState(ExecutorState.COMPLETE);
    }
  }
}