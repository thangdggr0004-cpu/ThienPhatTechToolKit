import { ActionExecutor, IBackendAdapter } from './ActionExecutor.js';

export class ExecutorFactory {
  public static create(adapter: IBackendAdapter): ActionExecutor {
    return new ActionExecutor(adapter);
  }
}