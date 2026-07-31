import { SystemSnapshot, ActionHistory } from '../domain/index.js';
import { ContextValidationError } from './EngineErrors.js';

/**
 * Context provided to rules during evaluation.
 */
export interface EngineContext {
  readonly snapshot: SystemSnapshot;
  readonly history: readonly ActionHistory[];
  readonly isOffline: boolean;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Builder for EngineContext.
 */
export class RecommendationContextBuilder {
  private snapshot?: SystemSnapshot;
  private history: ActionHistory[] = [];
  private isOffline: boolean = false;
  private metadata: Record<string, unknown> = {};

  public withSnapshot(snapshot: SystemSnapshot): this {
    this.snapshot = snapshot;
    return this;
  }

  public withHistory(history: ActionHistory[]): this {
    this.history = [...history];
    return this;
  }

  public setOfflineMode(isOffline: boolean): this {
    this.isOffline = isOffline;
    return this;
  }

  public addMetadata(key: string, value: unknown): this {
    this.metadata[key] = value;
    return this;
  }

  public build(): EngineContext {
    if (!this.snapshot) {
      throw new ContextValidationError('SystemSnapshot is required.');
    }
    return {
      snapshot: this.snapshot,
      history: Object.freeze([...this.history]),
      isOffline: this.isOffline,
      metadata: Object.freeze({ ...this.metadata })
    };
  }
}
