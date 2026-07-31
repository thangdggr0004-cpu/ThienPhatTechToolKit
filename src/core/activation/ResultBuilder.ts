import { ActivationOperationResult } from './ActivationResult.js';
import { WindowsLicenseCategory } from './ActivationClassification.js';
import { ExecutionStep } from './ExecutionStep.js';
import { StructuredEvidence } from '../domain/EvidenceModel.js';

export class ResultBuilder {
  private result: ActivationOperationResult;

  constructor() {
    this.result = {
      success: false,
      verificationPassed: false,
      rollbackPerformed: false,
      rollbackReason: '',
      strategyUsed: 'UnknownStrategy',
      licenseCategory: 'Unknown',
      changed: false,
      oldState: {},
      newState: {},
      evidenceBefore: [],
      evidenceAfter: [],
      executionSteps: [],
      executionTime: 0,
      warnings: [],
      errors: []
    };
  }

  public setStrategy(strategy: string): this {
    this.result.strategyUsed = strategy;
    return this;
  }

  public setCategory(category: WindowsLicenseCategory): this {
    this.result.licenseCategory = category;
    return this;
  }

  public setOldState(state: Record<string, unknown>): this {
    this.result.oldState = state;
    return this;
  }

  public setNewState(state: Record<string, unknown>): this {
    this.result.newState = state;
    return this;
  }

  public setEvidenceBefore(ev: StructuredEvidence[]): this {
    this.result.evidenceBefore = ev;
    return this;
  }

  public setEvidenceAfter(ev: StructuredEvidence[]): this {
    this.result.evidenceAfter = ev;
    return this;
  }

  public addExecutionStep(step: ExecutionStep): this {
    this.result.executionSteps.push(step);
    return this;
  }

  public setVerification(passed: boolean, issues: string[]): this {
    this.result.verificationPassed = passed;
    if (!passed) {
      this.result.errors.push(...issues);
    }
    return this;
  }

  public addWarning(warning: string): this {
    this.result.warnings.push(warning);
    return this;
  }

  public addError(error: string): this {
    this.result.errors.push(error);
    return this;
  }

  public setExecutionTime(timeMs: number): this {
    this.result.executionTime = timeMs;
    return this;
  }

  public build(): ActivationOperationResult {
    // CRITICAL INVARIANT: Success CANNOT be true if verification failed or errors exist
    this.result.changed = this.result.executionSteps.some(s => s.success);
    this.result.success = this.result.verificationPassed && this.result.errors.length === 0;
    return Object.freeze({ ...this.result });
  }
}
