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
        throw new ValidationFailedError(`Execution condition failed for action ${action.id}.`);
      }
    }
  }
}