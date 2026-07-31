import { ActionHistory } from '../domain/index.js';

export class ExecutionSession {
  private _history: ActionHistory[] = [];
  public get history(): readonly ActionHistory[] {
    return this._history;
  }
  public addRecord(record: ActionHistory): void {
    this._history.push(Object.freeze({ ...record }));
  }
}