import { WindowsLicenseCategory } from './ActivationClassification.js';
import { ExecutionStep } from './ExecutionStep.js';
import { StructuredEvidence } from '../domain/EvidenceModel.js';

export interface ActivationOperationResult {
  success: boolean;
  verificationPassed: boolean;
  rollbackPerformed: boolean;
  rollbackReason: string;
  strategyUsed: string;
  licenseCategory: WindowsLicenseCategory;
  changed: boolean;
  oldState: Record<string, unknown>;
  newState: Record<string, unknown>;
  evidenceBefore: StructuredEvidence[];
  evidenceAfter: StructuredEvidence[];
  executionSteps: ExecutionStep[];
  executionTime: number;
  warnings: string[];
  errors: string[];
}
