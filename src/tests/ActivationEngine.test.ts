import { ActivationEngine } from '../core/activation/ActivationEngine.js';
import { WindowsLicenseClassifier } from '../core/activation/ActivationClassification.js';
import { CapabilityResolver } from '../core/activation/CapabilityResolver.js';
import { ActivationCommands } from '../core/activation/ActivationConstants.js';
import { EvidenceRepository } from '../core/activation/EvidenceRepository.js';
import { EvidenceFactory } from '../core/activation/EvidenceFactory.js';

export async function testActivationEngine() {
  console.log('--- Testing Enterprise Evidence Architecture & Confidence Engine ---');

  // Test 1: EvidenceFactory & EvidenceRepository Business Queries
  const mockRawData = {
    description: 'Windows 11 Pro Retail',
    status: 1,
    productKeyChannel: 'RETAIL',
    piratedFiles: ['C:\\Windows\\AutoKMS.exe'],
    suspiciousTasks: ['AutoKMS']
  };

  const evidences = EvidenceFactory.createFromRawData(mockRawData);
  const repo = new EvidenceRepository(evidences);

  if (repo.countEvidence() !== 3) {
    throw new Error(`Expected 3 evidences, got ${repo.countEvidence()}`);
  }

  const suspiciousFiles = repo.getSuspiciousFiles();
  if (suspiciousFiles.length !== 1 || suspiciousFiles[0].path !== 'C:\\Windows\\AutoKMS.exe') {
    throw new Error('EvidenceRepository getSuspiciousFiles query failed!');
  }

  const criticalEvs = repo.getCriticalEvidence();
  if (criticalEvs.length !== 2) {
    throw new Error(`Expected 2 critical evidences, got ${criticalEvs.length}`);
  }
  console.log('[PASS] EvidenceFactory & EvidenceRepository business queries passed with 100% precision.');

  // Test 2: Invariant Check for BIOS Restore Forbidden Categories
  const forbidden = ['Retail', 'Volume_MAK', 'Volume_KMS', 'Windows_Server', 'VirtualMachine', 'Unknown', 'Evaluation'] as const;
  forbidden.forEach(cat => {
    const isAllowed = CapabilityResolver.isBiosRestoreAllowed(cat, true);
    if (isAllowed) {
      throw new Error(`INVARIANT VIOLATION: Bios restore must NOT be allowed for category '${cat}'!`);
    }
  });
  console.log('[PASS] Invariant: BIOS restore correctly forbidden for all ineligible categories.');

  // Test 3: DeepClean Strategy & Forensic Report Verification
  const mockSnapshotRetail = {
    systemInfo: { os: 'Windows 11 Pro' },
    windowsLicense: {
      status: 1,
      description: 'Windows(R) Operating System, RETAIL channel',
      hasOA3Key: false,
      productKeyChannel: 'RETAIL'
    }
  };

  const category = WindowsLicenseClassifier.classify(mockSnapshotRetail);
  if (category !== 'Retail') {
    throw new Error(`Expected 'Retail', got '${category}'`);
  }

  const mockAdapter = {
    execute: async (channel: string) => {
      if (channel === ActivationCommands.DEEP_CLEAN) return { success: true };
      if (channel === ActivationCommands.SCAN_LICENSE) {
        return {
          Data: {
            status: 0,
            description: 'Unlicensed',
            hasOA3Key: false,
            productKeyChannel: 'Unknown',
            kmsHost: '',
            piratedFiles: [],
            suspiciousTasks: []
          }
        };
      }
      return { success: true };
    }
  };

  const engine = new ActivationEngine(mockAdapter);
  const { result, reportJson } = await engine.deepCleanWindowsLicense(mockSnapshotRetail);

  if (!result.success || !result.verificationPassed || !result.changed) {
    throw new Error('deepCleanWindowsLicense failed verification or result invariant!');
  }

  if (result.strategyUsed !== 'DeepCleanStrategy') {
    throw new Error(`Expected Strategy 'DeepCleanStrategy', got '${result.strategyUsed}'`);
  }

  if (!reportJson || !reportJson.includes('crossValidation')) {
    throw new Error('Forensic Report JSON cross-validation details missing!');
  }

  console.log('[PASS] Enterprise Evidence Architecture & Forensic Report passed 100%.');
  return true;
}
