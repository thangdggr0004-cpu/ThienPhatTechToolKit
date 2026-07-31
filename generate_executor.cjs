const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src/core/executor');
fs.mkdirSync(dir, { recursive: true });

const files = {
  'ExecutionState.ts': `
export enum ExecutorState {
  IDLE = 'IDLE',
  VALIDATING = 'VALIDATING',
  CONFIRM = 'CONFIRM',
  BACKUP = 'BACKUP',
  QUEUE = 'QUEUE',
  LOCK = 'LOCK',
  RUNNING = 'RUNNING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  ROLLBACK = 'ROLLBACK',
  AUTO_RESCAN = 'AUTO_RESCAN',
  RECOMMENDATION = 'RECOMMENDATION',
  UNLOCK = 'UNLOCK',
  COMPLETE = 'COMPLETE'
}
`,
  'ExecutorErrors.ts': `
export class ExecutorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExecutorError';
  }
}
export class ValidationFailedError extends ExecutorError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationFailedError';
  }
}
export class ExecutionTimeoutError extends ExecutorError {
  constructor(message: string) {
    super(message);
    this.name = 'ExecutionTimeoutError';
  }
}
export class ExecutionCancelledError extends ExecutorError {
  constructor(message: string) {
    super(message);
    this.name = 'ExecutionCancelledError';
  }
}
export class LockAcquisitionError extends ExecutorError {
  constructor(message: string) {
    super(message);
    this.name = 'LockAcquisitionError';
  }
}
`,
  'CancellationToken.ts': `
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
`,
  'ExecutionEvent.ts': `
import { ExecutorState } from './ExecutionState.js';

export interface ExecutionEvent<T = unknown> {
  readonly id: string;
  readonly timestamp: number;
  readonly type: string;
  readonly actionId: string;
  readonly state?: ExecutorState;
  readonly payload?: T;
}
`,
  'ExecutionEvents.ts': `
export enum ExecutionEventType {
  STATE_CHANGED = 'STATE_CHANGED',
  PROGRESS_UPDATED = 'PROGRESS_UPDATED',
  LOG_EMITTED = 'LOG_EMITTED',
  ERROR_THROWN = 'ERROR_THROWN',
  COMPLETED = 'COMPLETED'
}
`,
  'ExecutionObserver.ts': `
import { ExecutionEvent } from './ExecutionEvent.js';

export interface ExecutionObserver {
  onEvent(event: ExecutionEvent): void;
}
`,
  'EventBus.ts': `
import { ExecutionEvent } from './ExecutionEvent.js';
import { ExecutionObserver } from './ExecutionObserver.js';

export class EventBus {
  private observers: Set<ExecutionObserver> = new Set();

  public subscribe(observer: ExecutionObserver): () => void {
    this.observers.add(observer);
    return () => this.observers.delete(observer);
  }

  public publish(event: ExecutionEvent): void {
    this.observers.forEach(obs => {
      try {
        obs.onEvent(event);
      } catch (e) {
        console.error('Observer error:', e);
      }
    });
  }
}
`,
  'ExecutionProgress.ts': `
export interface ExecutionProgress {
  readonly percentage: number;
  readonly message: string;
  readonly step: number;
  readonly totalSteps: number;
}
`,
  'ExecutionResult.ts': `
import { ActionResult } from '../domain/index.js';

export interface ExecutionResult extends ActionResult {
  readonly stateAtCompletion: string;
  readonly wasRolledBack: boolean;
}
`,
  'ExecutionContext.ts': `
import { SystemAction } from '../domain/index.js';
import { CancellationToken } from './CancellationToken.js';
import { EventBus } from './EventBus.js';

export interface ExecutionContext {
  readonly executionId: string;
  readonly action: SystemAction;
  readonly token: CancellationToken;
  readonly bus: EventBus;
  readonly payload: Record<string, unknown>;
  readonly startTime: number;
}
`,
  'ExecutionPolicy.ts': `
import { SystemAction } from '../domain/index.js';

export interface ExecutionPolicy {
  canExecute(action: SystemAction): boolean;
  requiresAdmin(action: SystemAction): boolean;
  requiresConfirmation(action: SystemAction): boolean;
}

export class DefaultExecutionPolicy implements ExecutionPolicy {
  public canExecute(action: SystemAction): boolean {
    return !action.disabled;
  }
  public requiresAdmin(action: SystemAction): boolean {
    return action.requireAdmin === true;
  }
  public requiresConfirmation(action: SystemAction): boolean {
    return action.requireConfirm === true;
  }
}
`,
  'ExecutionValidator.ts': `
import { SystemAction, SystemSnapshot } from '../domain/index.js';
import { ValidationFailedError } from './ExecutorErrors.js';

export class ExecutionValidator {
  public static validate(action: SystemAction, snapshot: SystemSnapshot): void {
    if (!action) {
      throw new ValidationFailedError('Action is undefined.');
    }
    if (typeof action.executionCondition === 'function') {
      const canRun = action.executionCondition(snapshot);
      if (!canRun) {
        throw new ValidationFailedError(\`Execution condition failed for action \${action.id}.\`);
      }
    }
  }
}
`,
  'ExecutionTimeout.ts': `
import { CancellationToken } from './CancellationToken.js';

export class ExecutionTimeout {
  public static withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    token: CancellationToken
  ): Promise<T> {
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        token.cancel('Operation timed out.');
        reject(new Error(\`Timeout after \${timeoutMs}ms\`));
      }, timeoutMs);
    });

    return Promise.race([
      promise.finally(() => clearTimeout(timer)),
      timeoutPromise
    ]);
  }
}
`,
  'RetryPolicy.ts': `
import { CancellationToken } from './CancellationToken.js';

export class RetryPolicy {
  public static async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number,
    delayMs: number,
    token: CancellationToken
  ): Promise<T> {
    let attempt = 0;
    while (attempt < maxRetries) {
      token.throwIfCancelled();
      try {
        return await operation();
      } catch (error) {
        attempt++;
        if (attempt >= maxRetries) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    throw new Error('Retry exhausted');
  }
}
`,
  'BackupManager.ts': `
import { ExecutionContext } from './ExecutionContext.js';

export interface IBackupManager {
  createBackup(context: ExecutionContext): Promise<string>;
}

export class BackupManager implements IBackupManager {
  public async createBackup(context: ExecutionContext): Promise<string> {
    context.token.throwIfCancelled();
    // Simulate IPC call for backup
    return \`backup_\${context.executionId}\`;
  }
}
`,
  'RollbackManager.ts': `
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
`,
  'ExecutionLock.ts': `
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
`,
  'ExecutionQueue.ts': `
import { ExecutionContext } from './ExecutionContext.js';

export class ExecutionQueue {
  private queue: ExecutionContext[] = [];

  public enqueue(context: ExecutionContext): void {
    this.queue.push(context);
  }

  public dequeue(): ExecutionContext | undefined {
    return this.queue.shift();
  }

  public get length(): number {
    return this.queue.length;
  }

  public peek(): ExecutionContext | undefined {
    return this.queue[0];
  }
}
`,
  'ExecutionScheduler.ts': `
import { ExecutionQueue } from './ExecutionQueue.js';
import { ExecutionContext } from './ExecutionContext.js';

export class ExecutionScheduler {
  private queue: ExecutionQueue;
  private isProcessing: boolean = false;
  private processor: (context: ExecutionContext) => Promise<void>;

  constructor(processor: (context: ExecutionContext) => Promise<void>) {
    this.queue = new ExecutionQueue();
    this.processor = processor;
  }

  public schedule(context: ExecutionContext): void {
    this.queue.enqueue(context);
    this.processNext();
  }

  private async processNext(): Promise<void> {
    if (this.isProcessing) return;
    const next = this.queue.dequeue();
    if (!next) return;

    this.isProcessing = true;
    try {
      await this.processor(next);
    } catch (e) {
      console.error('Processor error', e);
    } finally {
      this.isProcessing = false;
      this.processNext();
    }
  }
}
`,
  'ExecutionSession.ts': `
import { ActionHistory } from '../domain/index.js';

export class ExecutionSession {
  private _history: ActionHistory[] = [];
  public get history(): readonly ActionHistory[] {
    return this._history;
  }
  public addRecord(record: ActionHistory): void {
    this._history.push(Object.freeze({ ...record }));
  }
}
`,
  'ActionExecutor.ts': `
import { SystemAction, SystemSnapshot, ActionResult } from '../domain/index.js';
import { ExecutorState } from './ExecutionState.js';
import { ExecutionContext } from './ExecutionContext.js';
import { CancellationToken } from './CancellationToken.js';
import { EventBus } from './EventBus.js';
import { ExecutionValidator } from './ExecutionValidator.js';
import { ExecutionLock } from './ExecutionLock.js';
import { BackupManager, IBackupManager } from './BackupManager.js';
import { RollbackManager, IRollbackManager } from './RollbackManager.js';
import { ExecutionEvents, ExecutionEventType } from './ExecutionEvents.js';
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
  ): Promise<void> {
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
      
      const result = await RetryPolicy.executeWithRetry(
        () => this.backendAdapter.execute(action.id, payload),
        3, 
        1000, 
        token
      );

      if (result.success) {
        emitState(ExecutorState.SUCCESS);
      } else {
        emitState(ExecutorState.ERROR);
        throw new ExecutorError('Backend returned failure exit code.');
      }
      
    } catch (error) {
      emitState(ExecutorState.ERROR);
      
      if (backupId) {
        emitState(ExecutorState.ROLLBACK);
        await this.rollbackManager.rollback(context, backupId);
      }
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
`,
  'ExecutorFactory.ts': `
import { ActionExecutor, IBackendAdapter } from './ActionExecutor.js';

export class ExecutorFactory {
  public static create(adapter: IBackendAdapter): ActionExecutor {
    return new ActionExecutor(adapter);
  }
}
`,
  'ExecutorService.ts': `
import { ActionExecutor } from './ActionExecutor.js';

export class ExecutorService {
  private static instance: ActionExecutor;

  public static getInstance(): ActionExecutor {
    if (!this.instance) {
      throw new Error('ExecutorService not initialized with a backend adapter.');
    }
    return this.instance;
  }

  public static setInstance(executor: ActionExecutor): void {
    this.instance = executor;
  }
}
`,
  'index.ts': `
export * from './ExecutionState.js';
export * from './ExecutorErrors.js';
export * from './CancellationToken.js';
export * from './ExecutionEvent.js';
export * from './ExecutionEvents.js';
export * from './ExecutionObserver.js';
export * from './EventBus.js';
export * from './ExecutionProgress.js';
export * from './ExecutionResult.js';
export * from './ExecutionContext.js';
export * from './ExecutionPolicy.js';
export * from './ExecutionValidator.js';
export * from './ExecutionTimeout.js';
export * from './RetryPolicy.js';
export * from './BackupManager.js';
export * from './RollbackManager.js';
export * from './ExecutionLock.js';
export * from './ExecutionQueue.js';
export * from './ExecutionScheduler.js';
export * from './ExecutionSession.js';
export * from './ActionExecutor.js';
export * from './ExecutorFactory.js';
export * from './ExecutorService.js';
`
};

for (const [name, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(dir, name), content.trim());
}
console.log('24 Executor files created successfully.');
