/**
 * WIN LICENSE COLLECTOR V1
 * Category: WINDOWS | Priority: CRITICAL (1)
 * Description: Reads WMI SoftwareLicensingProduct for Windows ApplicationID (55c92734-d682-4d71-983e-d6ec3f16059f).
 */

const path = require('path');
const frameworkPath = path.resolve(__dirname, '../../EnterpriseCollectorFramework.cjs');
const { BaseCollector, COLLECTOR_CATEGORIES, COLLECTOR_PRIORITIES, NORMALIZED_STATES } = require(frameworkPath);

class WinLicenseCollector extends BaseCollector {
  constructor() {
    super({
      collectorId: 'WinLicenseCollector',
      collectorName: 'Windows WMI SoftwareLicensingProduct Collector',
      version: '1.0.0',
      category: COLLECTOR_CATEGORIES.WINDOWS,
      priority: COLLECTOR_PRIORITIES.CRITICAL,
      confidenceWeight: 25,
      timeoutMs: 5000,
      requires: { wmi: true }
    });
  }

  async collect(context = {}) {
    const rawData = context.rawData || {};
    const winData = rawData.Windows || {};

    const licenseStatusNum = winData.LicenseStatus;
    const isLicensed = (licenseStatusNum === 1 || winData.LicenseStatusText === 'LICENSED');
    const channel = winData.Channel || winData.ProductKeyChannel || 'UNKNOWN';
    const description = winData.Description || winData.LicenseFamily || 'N/A';
    const partialKey = winData.PartialProductKey || 'N/A';
    const kmsHost = winData.KeyManagementServiceMachine || null;
    const graceRemaining = winData.GracePeriodRemaining !== undefined ? winData.GracePeriodRemaining : 0;
    const activationID = winData.ActivationID || 'N/A';

    return {
      normalizedState: isLicensed ? NORMALIZED_STATES.LICENSED : NORMALIZED_STATES.UNLICENSED,
      licenseStatusNum,
      channel,
      description,
      partialKey,
      kmsHost,
      graceRemaining,
      activationID,
      evidenceItems: [
        {
          componentName: 'Bản Quyền Windows (WMI SoftwareLicensingProduct)',
          status: isLicensed ? 'PASS' : 'WARNING',
          dataSource: 'WMI (ApplicationID = 55c92734-d682-4d71-983e-d6ec3f16059f)',
          confidenceWeight: 25,
          details: `Trạng thái: ${isLicensed ? 'LICENSED (1)' : 'UNLICENSED / GRACE'} | Kênh: ${channel} | Khóa: ...${partialKey} | Mô tả: ${description}`
        }
      ]
    };
  }
}

module.exports = WinLicenseCollector;
