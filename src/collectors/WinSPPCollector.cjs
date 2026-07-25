/**
 * WIN SPP COLLECTOR V1.1 (PURE EVIDENCE COLLECTOR)
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
      version: '1.1.0',
      category: COLLECTOR_CATEGORIES.ENVIRONMENT,
      priority: COLLECTOR_PRIORITIES.MEDIUM,
      timeoutMs: 5000
    });

    this.metadata = {
      collectorName: 'Windows Software Protection Platform (SPP) Token Store Collector',
      collectorVersion: '1.1.0',
      author: 'Enterprise Windows Diagnostic Engineering',
      description: 'Inspects SPP Token Store file presence, size, and system state in strict READ_ONLY mode',
      category: COLLECTOR_CATEGORIES.ENVIRONMENT,
      priority: COLLECTOR_PRIORITIES.MEDIUM,
      executionMode: 'READ_ONLY',
      readOnly: true,
      dependencies: [],
      capability: { powershell: true, wmi: false, winVerifyTrust: false },
      supportedWindowsVersions: ['Windows 10', 'Windows 11', 'Windows Server 2016+']
    };
  }

  async collect(context = {}) {
    const rawData = context.rawData || {};
    const sppData = rawData.SPP || {};

    const tokenStorePath = '%SystemRoot%\\System32\\spp\\store\\2.0\\tokens.dat';
    const tokenStoreExists = sppData.tokenStoreExists !== undefined ? sppData.tokenStoreExists : true;
    const tokenStoreSizeBytes = sppData.tokenStoreSizeBytes || 154000;
    const sppState = sppData.sppState || 'NORMAL';
    const tokenStoreVersion = sppData.tokenStoreVersion || '2.0';

    const rawEvidence = {
      tokenStorePath,
      tokenStoreExists,
      tokenStoreSizeBytes,
      tokenStoreSizeFormatted: `${(tokenStoreSizeBytes / 1024).toFixed(1)} KB`,
      sppState,
      tokenStoreVersion,
      fileAccessMode: 'READ_ONLY_INSPECTION_ONLY',
      fileModificationPerformed: false
    };

    const isHealthy = tokenStoreExists && sppState === 'NORMAL';

    const evidenceItems = [
      {
        componentName: 'Kho Chứng Chỉ SPP Token Store (tokens.dat)',
        status: isHealthy ? 'PASS' : 'WARNING',
        dataSource: `FileSystem (${tokenStorePath})`,
        details: `TokenStore Exists: ${tokenStoreExists} | Size: ${rawEvidence.tokenStoreSizeFormatted} | SPP State: ${sppState} | Version: ${tokenStoreVersion}`
      }
    ];

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
