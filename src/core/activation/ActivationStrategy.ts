import { ActivationExecutor } from './ActivationExecutor.js';
import { ResultBuilder } from './ResultBuilder.js';
import { VerificationEngine } from './VerificationEngine.js';
import { CapabilityResolver } from './CapabilityResolver.js';
import { WindowsLicenseCategory } from './ActivationClassification.js';
import { ActivationCommands } from './ActivationConstants.js';
import { StructuredEvidence } from '../domain/EvidenceModel.js';

export interface IActivationStrategy {
  readonly name: string;
  execute(
    snapshot: Record<string, unknown>,
    category: WindowsLicenseCategory,
    executor: ActivationExecutor,
    builder: ResultBuilder
  ): Promise<void>;
}

export class DeepCleanStrategy implements IActivationStrategy {
  public readonly name = 'DeepCleanStrategy';

  public async execute(
    snapshot: Record<string, unknown>,
    category: WindowsLicenseCategory,
    executor: ActivationExecutor,
    builder: ResultBuilder
  ): Promise<void> {
    builder.setStrategy(this.name).setCategory(category);

    const oldLicense = (snapshot?.windowsLicense as Record<string, unknown>) || {};
    builder.setOldState(oldLicense);
    const initialEvidence = (snapshot?.structuredEvidences as StructuredEvidence[]) || [];
    builder.setEvidenceBefore(initialEvidence);

    // Step 1: Deep Clean Execution
    const { step } = await executor.executeStep(
      'PipelineStep_DeepClean',
      ActivationCommands.DEEP_CLEAN,
      'windows',
      initialEvidence
    );
    builder.addExecutionStep(step);

    if (!step.success) {
      const errStr = step.errors.join('; ');
      builder.addError(`Thất bại tại bước ${step.name}: ${errStr}`);
      return;
    }

    // Step 2: Rescan & Final Verification
    const freshScan = await executor.scanState();
    builder.setNewState({
      status: freshScan?.status ?? 0,
      description: freshScan?.description || '',
      hasOA3Key: !!freshScan?.hasOA3Key,
      productKeyChannel: freshScan?.productKeyChannel || '',
      kmsHost: freshScan?.kmsHost || ''
    });

    const report = VerificationEngine.verifyDeepClean(freshScan);
    builder.setVerification(report.passed, report.issues);
    builder.setEvidenceAfter(report.evidenceAfter);
  }
}

export class RestoreBiosStrategy implements IActivationStrategy {
  public readonly name = 'RestoreBiosStrategy';

  public async execute(
    snapshot: Record<string, unknown>,
    category: WindowsLicenseCategory,
    executor: ActivationExecutor,
    builder: ResultBuilder
  ): Promise<void> {
    builder.setStrategy(this.name).setCategory(category);

    const oldLicense = (snapshot?.windowsLicense as Record<string, unknown>) || {};
    builder.setOldState(oldLicense);

    const hasOA3Key = !!oldLicense?.hasOA3Key;
    const isAllowed = CapabilityResolver.isBiosRestoreAllowed(category, hasOA3Key);

    if (!isAllowed) {
      builder.addError(`Không đủ điều kiện khôi phục Key BIOS đối với loại bản quyền '${category}' (HasOA3: ${hasOA3Key}).`);
      builder.setVerification(false, ['Điều kiện tiên quyết không thỏa mãn.']);
      return;
    }

    // Step 1: Execute BIOS Restore
    const { step } = await executor.executeStep(
      'PipelineStep_RestoreBiosKey',
      ActivationCommands.RESTORE_BIOS,
      {},
      []
    );
    builder.addExecutionStep(step);

    if (!step.success) {
      const errStr = step.errors.join('; ');
      builder.addError(`Thất bại tại bước ${step.name}: ${errStr}`);
      return;
    }

    // Step 2: Rescan & Verification
    const freshScan = await executor.scanState();
    builder.setNewState({
      status: freshScan?.status ?? 0,
      description: freshScan?.description || '',
      hasOA3Key: !!freshScan?.hasOA3Key,
      productKeyChannel: freshScan?.productKeyChannel || ''
    });

    const report = VerificationEngine.verifyBiosRestore(freshScan);
    builder.setVerification(report.passed, report.issues);
  }
}
