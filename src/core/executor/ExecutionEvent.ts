import { ExecutorState } from './ExecutionState.js';

export interface ExecutionEvent<T = unknown> {
  readonly id: string;
  readonly timestamp: number;
  readonly type: string;
  readonly actionId: string;
  readonly state?: ExecutorState;
  readonly payload?: T;
}