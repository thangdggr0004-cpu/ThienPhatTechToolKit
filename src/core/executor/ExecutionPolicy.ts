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