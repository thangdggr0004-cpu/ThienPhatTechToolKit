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