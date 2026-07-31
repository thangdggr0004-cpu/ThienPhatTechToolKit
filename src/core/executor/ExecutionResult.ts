import { ActionResult } from '../domain/index.js';

export interface ExecutionResult extends ActionResult {
  readonly stateAtCompletion: string;
  readonly wasRolledBack: boolean;
}