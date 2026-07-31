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