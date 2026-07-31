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