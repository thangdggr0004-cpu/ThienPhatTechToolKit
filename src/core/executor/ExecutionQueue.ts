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