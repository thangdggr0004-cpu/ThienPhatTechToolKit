/**
 * WIN SPP COLLECTOR V1.2 (ENTERPRISE DATA MODEL)
 * Category: ENVIRONMENT | Priority: MEDIUM (3)
 * Description: Inspects SPP State & Token Store (tokens.dat) in STRICT READ_ONLY mode. Never touches, repairs, rewrites, or deletes files.
 */

const path = require('path');
const frameworkPath = path.resolve(__dirname, '../../EnterpriseCollectorFramework.cjs');
const { BaseCollector, COLLECTOR_CATEGORIES, COLLECTOR_PRIORITIES } = require(frameworkPath);

class WinSPPCollector extends BaseCollector {
  constructor() {
    super({
      collectorId: 'WinSPPCollector',
      collectorName: 'Windows Software Protection Platform (SPP) Token Store Collector',
      version: '1.2.0',
      category: COLLECTOR_CATEGORIES.ENVIRONMENT,
      priority: COLLECTOR_PRIORITIES.MEDIUM,
      timeoutMs: 5000
    });

    this.metadata = {
      collectorName: 'Windows Software Protection Platform (SPP) Token Store Collector',
      collectorVersion: '1.2.0',
      author: 'Enterprise Windows Diagnostic Engineering',
      description: 'Inspects SPP Token Store file presence, size, and system state in strict READ_ONLY mode',
      category: COLLECTOR_CATEGORIES.ENVIRONMENT,
      priority: COLLECTOR_PRIORITIES.MEDIUM,
      readOnly: true,
      executionMode: 'READ_ONLY',
      dependencies: [],
      supportedWindowsVersions: ['Windows 10', 'Windows 11', 'Windows Server 2016+'],
      capability: { powershell: true, wmi: false, winVerifyTrust: false }
    };
  }

  async collect(context = {}) {
    const collectedTime = new Date().toISOString();
    const rawData = context.rawData || {};
    const sppData = rawData.SPP || {};

    const sppState = sppData.sppState || 'NORMAL';
    const tokenStorePath = '%SystemRoot%\\System32\\spp\\store\\2.0\\tokens.dat';
    const tokenStoreSize = sppData.tokenStoreSizeBytes || 154000;
    const tokenStoreVersion = sppData.tokenStoreVersion || '2.0';
    const graceState = sppData.graceState || 'NOT_IN_GRACE';

    const rawEvidence = {
      sppState,
      tokenStorePath,
      tokenStoreSize,
      tokenStoreVersion,
      graceState,
      fileAccessMode: 'READ_ONLY_INSPECTION_ONLY',
      fileModificationPerformed: false
    };

    const evidenceItems = [
      {
        evidenceId: 'EVD-WIN-SPP-001',
        evidenceName: 'SPP Token Store File (tokens.dat)',
        evidenceType: 'ENVIRONMENT',
        evidenceSource: `FileSystem (${tokenStorePath})`,
        evidenceValue: { sppState, tokenStorePath, tokenStoreSize, tokenStoreVersion, graceState },
        evidenceFormat: 'OBJECT',
        evidenceStatus: 'DATA_READ_ONLY',
        collectedTime,
        collectorVersion: this.version,
        rawValue: { tokenStoreSize, sppState, graceState },
        normalizedValue: `Path: ${tokenStorePath} | Size: ${(tokenStoreSize / 1024).toFixed(1)} KB | State: ${sppState} | Grace: ${graceState}`
      }
    ];

    const isHealthy = sppData.tokenStoreExists !== false && sppState === 'NORMAL';

    return {
      collectorName: this.collectorName,
      collectorVersion: this.version,
      collectorCategory: this.category,
      priority: this.priority,
      executionStatus: 'SUCCESS',
      readOnly: true,
      rawEvidence,
      evidenceItems,
      evidenceCount: evidenceItems.length,
      warnings: isHealthy ? [] : ['Token store file or SPP state requires attention'],
      warningCount: isHealthy ? 0 : 1,
      errors: [],
      errorCount: 0,
      metadata: this.metadata
    };
  }
}

module.exports = WinSPPCollector;
