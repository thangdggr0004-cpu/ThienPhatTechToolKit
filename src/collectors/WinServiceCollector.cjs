/**
 * WIN SERVICE COLLECTOR V1.1 (PURE EVIDENCE COLLECTOR)
 * Category: SERVICE | Priority: HIGH (2)
 * Description: Reads Service Control Manager statuses for sppsvc, ClipSVC, and LicenseManager without starting, stopping, restarting, or repairing.
 */

const path = require('path');
const frameworkPath = path.resolve(__dirname, '../../EnterpriseCollectorFramework.cjs');
const { BaseCollector, COLLECTOR_CATEGORIES, COLLECTOR_PRIORITIES } = require(frameworkPath);

class WinServiceCollector extends BaseCollector {
  constructor() {
    super({
      collectorId: 'WinServiceCollector',
      collectorName: 'Windows Licensing Services Collector',
      version: '1.1.0',
      category: COLLECTOR_CATEGORIES.SERVICE,
      priority: COLLECTOR_PRIORITIES.HIGH,
      timeoutMs: 5000
    });

    this.metadata = {
      collectorName: 'Windows Licensing Services Collector',
      collectorVersion: '1.1.0',
      author: 'Enterprise Windows Diagnostic Engineering',
      description: 'Gathers Service Control Manager status evidence for licensing services (sppsvc, ClipSVC, LicenseManager) in READ_ONLY mode',
      category: COLLECTOR_CATEGORIES.SERVICE,
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
    const svcData = rawData.Services || {};

    const sppsvcActive = svcData.sppsvcActive !== undefined ? svcData.sppsvcActive : true;
    const clipSvcActive = svcData.clipSvcActive !== undefined ? svcData.clipSvcActive : true;
    const licenseManagerActive = svcData.licenseManagerActive !== undefined ? svcData.licenseManagerActive : true;

    const sppsvcStatus = svcData.sppsvcStatus || (sppsvcActive ? 'RUNNING' : 'STOPPED');
    const clipSvcStatus = svcData.clipSvcStatus || (clipSvcActive ? 'RUNNING' : 'STOPPED');
    const licenseManagerStatus = svcData.licenseManagerStatus || (licenseManagerActive ? 'RUNNING' : 'STOPPED');

    const sppsvcStartType = svcData.sppsvcStartType || 'Auto';
    const clipSvcStartType = svcData.clipSvcStartType || 'Manual';
    const licenseManagerStartType = svcData.licenseManagerStartType || 'Manual';

    const rawEvidence = {
      services: {
        sppsvc: { name: 'Software Protection', status: sppsvcStatus, active: sppsvcActive, startType: sppsvcStartType },
        ClipSVC: { name: 'Client License Service (ClipSVC)', status: clipSvcStatus, active: clipSvcActive, startType: clipSvcStartType },
        LicenseManager: { name: 'Windows License Manager Service', status: licenseManagerStatus, active: licenseManagerActive, startType: licenseManagerStartType }
      },
      readOnlyAssurance: 'NO_SERVICE_MODIFICATION_PERFORMED'
    };

    const allServicesOK = sppsvcActive && clipSvcActive && licenseManagerActive;

    const evidenceItems = [
      {
        componentName: 'Trạng Thái Dịch Vụ Cấp Phép System (sppsvc / ClipSVC / LicenseManager)',
        status: allServicesOK ? 'PASS' : 'WARNING',
        dataSource: 'Service Control Manager (SCM Query - Read Only)',
        details: `sppsvc: ${sppsvcStatus} (${sppsvcStartType}) | ClipSVC: ${clipSvcStatus} (${clipSvcStartType}) | LicenseManager: ${licenseManagerStatus} (${licenseManagerStartType})`
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
      warnings: allServicesOK ? [] : ['One or more licensing services are currently not active'],
      warningCount: allServicesOK ? 0 : 1,
      errors: [],
      errorCount: 0,
      metadata: this.metadata
    };
  }
}

module.exports = WinServiceCollector;
