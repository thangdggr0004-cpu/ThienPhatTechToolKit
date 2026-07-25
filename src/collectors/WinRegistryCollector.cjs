/**
 * WIN REGISTRY COLLECTOR V1.1 (PURE EVIDENCE COLLECTOR)
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
      version: '1.1.0',
      category: COLLECTOR_CATEGORIES.REGISTRY,
      priority: COLLECTOR_PRIORITIES.HIGH,
      timeoutMs: 5000
    });

    this.metadata = {
      collectorName: 'Windows Registry Licensing Collector',
      collectorVersion: '1.1.0',
      author: 'Enterprise Windows Diagnostic Engineering',
      description: 'Gathers raw Registry key values for SoftwareProtectionPlatform, ClipSVC, WPA, and KMS configurations',
      category: COLLECTOR_CATEGORIES.REGISTRY,
      priority: COLLECTOR_PRIORITIES.HIGH,
      executionMode: 'READ_ONLY',
      readOnly: true,
      dependencies: [],
      capability: { powershell: true, wmi: false, winVerifyTrust: false },
      supportedWindowsVersions: ['Windows 10', 'Windows 11', 'Windows Server 2016+']
    };
  }

  async collect(context = {}) {
    const rawData = context.rawData || {};
    const sysData = rawData.System || {};
    const regData = rawData.Registry || {};

    const sppPath = 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\SoftwareProtectionPlatform';
    const clipSvcPath = 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\ClipSVC';
    const wpaPath = 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\WPA';

    const noGenTicket = regData.NoGenTicket !== undefined ? regData.NoGenTicket : (sysData.NoGenTicket === true);
    const kmsHost = regData.KeyManagementServiceName || sysData.RegistryKmsHost || null;
    const kmsPort = regData.KeyManagementServicePort || 1688;

    const softwareProtectionPlatform = {
      registryPath: sppPath,
      kmsHost,
      kmsPort,
      noGenTicket,
      vskId: regData.VSKID || null
    };

    const clipSVC = {
      registryPath: clipSvcPath,
      installStatus: regData.ClipSvcInstallStatus || 'INSTALLED',
      licenseState: regData.ClipSvcLicenseState || 'NORMAL'
    };

    const wpa = {
      registryPath: wpaPath,
      wpaKeyPresent: regData.WpaKeyPresent !== undefined ? regData.WpaKeyPresent : true,
      tsforgeTrace: sysData.TSforgeTrace === true
    };

    const kmsConfiguration = {
      kmsHost,
      kmsPort,
      kmsLookupDomain: regData.KmsLookupDomain || null
    };

    const rawEvidence = {
      softwareProtectionPlatform,
      clipSVC,
      wpa,
      noGenTicket,
      kmsConfiguration,
      registryPathsChecked: [sppPath, clipSvcPath, wpaPath],
      registryValuesCollected: {
        KeyManagementServiceName: kmsHost || 'NOT_CONFIGURED',
        NoGenTicket: noGenTicket ? 1 : 0,
        TSforgeTrace: wpa.tsforgeTrace ? 1 : 0
      }
    };

    const hasAnomaly = noGenTicket || wpa.tsforgeTrace;

    const evidenceItems = [
      {
        componentName: 'Registry SoftwareProtectionPlatform & KMS Config',
        status: kmsHost ? 'WARNING' : 'PASS',
        dataSource: `Registry (${sppPath})`,
        details: `KMS Host: ${kmsHost || 'None (Standard Direct/OEM)'} | KMS Port: ${kmsPort} | NoGenTicket: ${noGenTicket}`
      },
      {
        componentName: 'Registry ClipSVC & WPA Activation Subsystem',
        status: hasAnomaly ? 'WARNING' : 'PASS',
        dataSource: `Registry (${clipSvcPath} & ${wpaPath})`,
        details: `ClipSVC State: ${clipSVC.licenseState} | WPA Key Present: ${wpa.wpaKeyPresent} | TSforgeTrace: ${wpa.tsforgeTrace}`
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
      warnings: hasAnomaly ? ['Registry flags warranting attention detected'] : [],
      warningCount: hasAnomaly ? 1 : 0,
      errors: [],
      errorCount: 0,
      metadata: this.metadata
    };
  }
}

module.exports = WinRegistryCollector;
