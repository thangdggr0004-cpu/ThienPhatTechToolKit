import { WindowsLicenseClassifier, WindowsLicenseCategory } from './ActivationClassification.js';
import { ActivationOperationResult } from './ActivationResult.js';
import { ActivationExecutor, IBackendAdapter } from './ActivationExecutor.js';
import { ResultBuilder } from './ResultBuilder.js';
import { DeepCleanStrategy, RestoreBiosStrategy } from './ActivationStrategy.js';
import { ActivationReportGenerator } from './ActivationReport.js';

export class ActivationEngine {
  private readonly executor: ActivationExecutor;

  constructor(adapter: IBackendAdapter) {
    this.executor = new ActivationExecutor(adapter);
  }

  public async deepCleanWindowsLicense(snapshot: Record<string, unknown>): Promise<{ result: ActivationOperationResult; reportJson: string }> {
    const startTime = Date.now();
    const builder = new ResultBuilder();
    const category: WindowsLicenseCategory = WindowsLicenseClassifier.classify(snapshot);

    try {
      const strategy = new DeepCleanStrategy();
      await strategy.execute(snapshot, category, this.executor, builder);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      builder.addError(`Lỗi không xử lý trong ActivationEngine: ${msg}`);
      builder.setVerification(false, [msg]);
    }

    const result = builder.setExecutionTime(Date.now() - startTime).build();

    const reportJson = ActivationReportGenerator.generateJSONReport({
      licenseCategory: category,
      before: result.oldState,
      after: result.newState,
      verification: {
        passed: result.verificationPassed,
        issues: result.errors
      },
      executionTime: result.executionTime,
      executionSteps: result.executionSteps,
      evidenceBefore: result.evidenceBefore,
      evidenceAfter: result.evidenceAfter,
      warnings: result.warnings,
      errors: result.errors,
      finalVerdict: result.success ? 'UNLICENSED' : 'TAMPERED'
    });

    return { result, reportJson };
  }

  public async restoreOemBiosKey(snapshot: Record<string, unknown>): Promise<{ result: ActivationOperationResult; reportJson: string }> {
    const startTime = Date.now();
    const builder = new ResultBuilder();
    const category: WindowsLicenseCategory = WindowsLicenseClassifier.classify(snapshot);

    try {
      const strategy = new RestoreBiosStrategy();
      await strategy.execute(snapshot, category, this.executor, builder);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      builder.addError(`Lỗi không xử lý trong ActivationEngine: ${msg}`);
      builder.setVerification(false, [msg]);
    }

    const result = builder.setExecutionTime(Date.now() - startTime).build();

    const reportJson = ActivationReportGenerator.generateJSONReport({
      licenseCategory: category,
      before: result.oldState,
      after: result.newState,
      verification: {
        passed: result.verificationPassed,
        issues: result.errors
      },
      executionTime: result.executionTime,
      executionSteps: result.executionSteps,
      evidenceBefore: result.evidenceBefore,
      evidenceAfter: result.evidenceAfter,
      warnings: result.warnings,
      errors: result.errors,
      finalVerdict: result.success ? 'GENUINE' : 'WARNING'
    });

    return { result, reportJson };
  }
}
