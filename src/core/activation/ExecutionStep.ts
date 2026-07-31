import { StructuredEvidence } from '../domain/EvidenceModel.js';

export interface ExecutionStep {
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  evidenceBefore: StructuredEvidence[];
  evidenceAfter: StructuredEvidence[];
  errors: string[];
  warnings: string[];
}
