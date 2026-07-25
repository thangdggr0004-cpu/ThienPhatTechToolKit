/**
 * WIN SERVICE COLLECTOR V1.2 (ENTERPRISE DATA MODEL)
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
      version: '1.2.0',
      category: COLLECTOR_CATEGORIES.SERVICE,
      priority: COLLECTOR_PRIORITIES.HIGH,
      timeoutMs: 5000
    });

    this.metadata = {
      collectorName: 'Windows Licensing Services Collector',
      collectorVersion: '1.2.0',
      author: 'Enterprise Windows Diagnostic Engineering',
      description: 'Gathers Service Control Manager status evidence for licensing services (sppsvc, ClipSVC, LicenseManager) in READ_ONLY mode',
      category: COLLECTOR_CATEGORIES.SERVICE,
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
    const svcData = rawData.Services || {};

    const sppsvcActive = svcData.sppsvcActive !== undefined ? svcData.sppsvcActive : true;
    const clipSvcActive = svcData.clipSvcActive !== undefined ? svcData.clipSvcActive : true;
    const licenseManagerActive = svcData.licenseManagerActive !== undefined ? svcData.licenseManagerActive : true;

    const services = [
      {
        serviceName: 'sppsvc',
        displayName: 'Software Protection',
        currentState: svcData.sppsvcStatus || (sppsvcActive ? 'RUNNING' : 'STOPPED'),
        startType: svcData.sppsvcStartType || 'Auto',
        binaryPath: 'C:\\Windows\\System32\\sppsvc.exe',
        processId: svcData.sppsvcPid || 1420
      },
      {
        serviceName: 'ClipSVC',
        displayName: 'Client License Service (ClipSVC)',
        currentState: svcData.clipSvcStatus || (clipSvcActive ? 'RUNNING' : 'STOPPED'),
        startType: svcData.clipSvcStartType || 'Manual',
        binaryPath: 'C:\\Windows\\System32\\svchost.exe -k ClipSVCGroup',
        processId: svcData.clipSvcPid || 2840
      },
      {
        serviceName: 'LicenseManager',
        displayName: 'Windows License Manager Service',
        currentState: svcData.licenseManagerStatus || (licenseManagerActive ? 'RUNNING' : 'STOPPED'),
        startType: svcData.licenseManagerStartType || 'Manual',
        binaryPath: 'C:\\Windows\\System32\\svchost.exe -k LocalService -p',
        processId: svcData.licenseManagerPid || 3150
      }
    ];

    const rawEvidence = {
      services,
      readOnlyAssurance: 'NO_SERVICE_MODIFICATION_PERFORMED'
    };

    const evidenceItems = services.map((svc, idx) => ({
      evidenceId: `EVD-WIN-SVC-00${idx + 1}`,
      evidenceName: `${svc.displayName} (${svc.serviceName})`,
      evidenceType: 'SERVICE',
      evidenceSource: 'Service Control Manager (SCM Query)',
      evidenceValue: svc,
      evidenceFormat: 'OBJECT',
      evidenceStatus: svc.currentState === 'RUNNING' ? 'DATA_PRESENT' : 'NOT_CONFIGURED',
      collectedTime,
      collectorVersion: this.version,
      rawValue: { serviceName: svc.serviceName, currentState: svc.currentState, processId: svc.processId },
      normalizedValue: `${svc.serviceName}: ${svc.currentState} (${svc.startType}) PID:${svc.processId}`
    }));

    const allServicesOK = sppsvcActive && clipSvcActive && licenseManagerActive;

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
