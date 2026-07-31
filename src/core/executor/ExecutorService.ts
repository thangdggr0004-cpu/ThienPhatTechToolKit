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