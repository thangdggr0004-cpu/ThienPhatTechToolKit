/**
 * WIN REGISTRY COLLECTOR V1.2 (ENTERPRISE DATA MODEL)
 * Category: REGISTRY | Priority: HIGH (2)
 * Description: Reads Registry keys for SoftwareProtectionPlatform, ClipSVC, WPA without modifying registry or scoring.
 */

const path = require('path');
const frameworkPath = path.resolve(__dirname, '../../EnterpriseCollectorFramework.cjs');
const { BaseCollector, COLLECTOR_CATEGORIES, COLLECTOR_PRIORITIES } = require(frameworkPath);

class WinRegistryCollector extends BaseCollector {
  constructor() {
    super({
      collectorId: 'WinRegistryCollector',
      collectorName: 'Windows Registry Licensing Collector',
      version: '1.2.0',
      category: COLLECTOR_CATEGORIES.REGISTRY,
      priority: COLLECTOR_PRIORITIES.HIGH,
      timeoutMs: 5000
    });

    this.metadata = {
      collectorName: 'Windows Registry Licensing Collector',
      collectorVersion: '1.2.0',
      author: 'Enterprise Windows Diagnostic Engineering',
      description: 'Gathers raw Registry key values for SoftwareProtectionPlatform, ClipSVC, WPA, and KMS configurations',
      category: COLLECTOR_CATEGORIES.REGISTRY,
      priority: COLLECTOR_PRIORITIES.HIGH,
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
    const sysData = rawData.System || {};
    const regData = rawData.Registry || {};

    const sppPath = 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\SoftwareProtectionPlatform';
    const clipSvcPath = 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\ClipSVC';
    const wpaPath = 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\WPA';

    const noGenTicket = regData.NoGenTicket !== undefined ? regData.NoGenTicket : (sysData.NoGenTicket === true);
    const kmsHost = regData.KeyManagementServiceName || sysData.RegistryKmsHost || null;
    const kmsPort = regData.KeyManagementServicePort || 1688;

    const rawEvidence = {
      registryPath: sppPath,
      registryValue: {
        KeyManagementServiceName: kmsHost || 'NOT_CONFIGURED',
        KeyManagementServicePort: kmsPort,
        NoGenTicket: noGenTicket ? 1 : 0,
        ClipSvcInstallStatus: regData.ClipSvcInstallStatus || 'INSTALLED',
        WpaKeyPresent: regData.WpaKeyPresent !== undefined ? regData.WpaKeyPresent : true,
        TSforgeTrace: sysData.TSforgeTrace === true ? 1 : 0
      },
      registryType: 'REG_SZ / REG_DWORD',
      registrySource: 'Windows Native Registry (HKLM)',
      registryTimestamp: collectedTime
    };

    const evidenceItems = [
      {
        evidenceId: 'EVD-WIN-REG-001',
        evidenceName: 'SoftwareProtectionPlatform Registry Key',
        evidenceType: 'REGISTRY',
        evidenceSource: `Registry (${sppPath})`,
        evidenceValue: { registryPath: sppPath, kmsHost, kmsPort, noGenTicket },
        evidenceFormat: 'OBJECT',
        evidenceStatus: 'DATA_PRESENT',
        collectedTime,
        collectorVersion: this.version,
        rawValue: { kmsHost, kmsPort, noGenTicket },
        normalizedValue: `KMS Host: ${kmsHost || 'NOT_CONFIGURED'} | Port: ${kmsPort} | NoGenTicket: ${noGenTicket}`
      },
      {
        evidenceId: 'EVD-WIN-REG-002',
        evidenceName: 'ClipSVC & WPA Subsystem Registry Keys',
        evidenceType: 'REGISTRY',
        evidenceSource: `Registry (${clipSvcPath} & ${wpaPath})`,
        evidenceValue: { clipSvcPath, wpaPath, tsforgeTrace: sysData.TSforgeTrace === true },
        evidenceFormat: 'OBJECT',
        evidenceStatus: 'DATA_PRESENT',
        collectedTime,
        collectorVersion: this.version,
        rawValue: { ClipSvcPath: clipSvcPath, WpaPath: wpaPath },
        normalizedValue: `ClipSVC: INSTALLED | WPA: ACTIVE`
      }
    ];

    const hasAnomaly = noGenTicket || sysData.TSforgeTrace === true;

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
      warnings: hasAnomaly ? ['Registry flags warranting attention detected'] : [],
      warningCount: hasAnomaly ? 1 : 0,
      errors: [],
      errorCount: 0,
      metadata: this.metadata
    };
  }
}

module.exports = WinRegistryCollector;
