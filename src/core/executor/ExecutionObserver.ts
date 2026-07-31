import { ExecutionEvent } from './ExecutionEvent.js';

export interface ExecutionObserver {
  onEvent(event: ExecutionEvent): void;
}