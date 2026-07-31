import { WindowsLicenseCategory } from './ActivationClassification.js';
import { ExecutionStep } from './ExecutionStep.js';
import { StructuredEvidence } from '../domain/EvidenceModel.js';

export interface ForensicReportPayload {
  licenseCategory: WindowsLicenseCategory;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  verification: {
    passed: boolean;
    issues: string[];
  };
  executionTime: number;
  executionSteps: ExecutionStep[];
  evidenceBefore: StructuredEvidence[];
  evidenceAfter: StructuredEvidence[];
  warnings: string[];
  errors: string[];
  finalVerdict: 'GENUINE' | 'UNLICENSED' | 'TAMPERED' | 'WARNING';
}

export class ActivationReportGenerator {
  public static generateJSONReport(payload: ForensicReportPayload): string {
    const evidenceSources = Array.from(new Set(payload.evidenceAfter.map(e => e.source)));
    const crossValidationCount = evidenceSources.length;
    const confidenceScore = payload.verification.passed ? 100 : (crossValidationCount >= 2 ? 90 : 70);

    const report = {
      reportId: `RPT_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      summary: {
        category: payload.licenseCategory,
        status: payload.verification.passed ? 'SUCCESS' : 'FAILED',
        verdict: payload.finalVerdict,
        confidence: confidenceScore,
        totalDurationMs: payload.executionTime,
        stepsExecuted: payload.executionSteps.length
      },
      forensicVerification: {
        evidenceChain: payload.evidenceAfter.map(e => `${e.source.toUpperCase()}::${(e as any).path || (e as any).name || (e as any).hostname || 'Evidence'}`),
        ruleTriggered: payload.verification.issues.length > 0 ? 'CRACK_REMAINING_RULE' : 'CLEAN_VERIFIED_RULE',
        confidenceScore,
        decisionReason: payload.verification.passed
          ? 'Tất cả các nguồn dữ liệu độc lập (Filesystem, Tasks, Services, Hosts) đều xác nhận hệ thống sạch hoàn toàn.'
          : `Phát hiện ${payload.verification.issues.length} vi phạm chưa được xử lý triệt để.`,
        verificationSources: evidenceSources,
        crossValidation: {
          sourcesCount: crossValidationCount,
          isMultiSourceValidated: crossValidationCount >= 2
        }
      },
      forensics: {
        stateBefore: payload.before,
        stateAfter: payload.after,
        verificationIssues: payload.verification.issues,
        evidenceBefore: payload.evidenceBefore,
        evidenceAfter: payload.evidenceAfter
      },
      executionPipeline: payload.executionSteps.map(step => ({
        stepName: step.name,
        durationMs: step.duration,
        success: step.success,
        errors: step.errors,
        warnings: step.warnings
      })),
      diagnostics: {
        warnings: payload.warnings,
        errors: payload.errors
      }
    };

    return JSON.stringify(report, null, 2);
  }
}
