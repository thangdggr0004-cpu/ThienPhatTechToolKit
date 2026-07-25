/**
 * WIN LICENSE COLLECTOR V1.1 (PURE EVIDENCE COLLECTOR)
 * Category: LICENSE | Priority: CRITICAL (1)
 * Description: Reads WMI SoftwareLicensingProduct for Windows ApplicationID without scoring or decisions.
 */

const path = require('path');
const frameworkPath = path.resolve(__dirname, '../../EnterpriseCollectorFramework.cjs');
const { BaseCollector, COLLECTOR_CATEGORIES, COLLECTOR_PRIORITIES } = require(frameworkPath);

class WinLicenseCollector extends BaseCollector {
  constructor() {
    super({
      collectorId: 'WinLicenseCollector',
      collectorName: 'Windows WMI SoftwareLicensingProduct Collector',
      version: '1.1.0',
      category: COLLECTOR_CATEGORIES.LICENSE,
      priority: COLLECTOR_PRIORITIES.CRITICAL,
      timeoutMs: 5000,
      requires: { wmi: true }
    });

    this.metadata = {
      collectorName: 'Windows WMI SoftwareLicensingProduct Collector',
      collectorVersion: '1.1.0',
      author: 'Enterprise Windows Diagnostic Engineering',
      description: 'Gathers SoftwareLicensingProduct WMI properties for Windows ApplicationID',
      category: COLLECTOR_CATEGORIES.LICENSE,
      priority: COLLECTOR_PRIORITIES.CRITICAL,
      executionMode: 'READ_ONLY',
      readOnly: true,
      dependencies: [],
      capability: { powershell: true, wmi: true, winVerifyTrust: false },
      supportedWindowsVersions: ['Windows 10', 'Windows 11', 'Windows Server 2016+']
    };
  }

  async collect(context = {}) {
    const rawData = context.rawData || {};
    const winData = rawData.Windows || {};

    const licenseStatus = winData.LicenseStatus !== undefined ? winData.LicenseStatus : (winData.LicenseStatusText || 'UNKNOWN');
    const description = winData.Description || 'N/A';
    const channel = winData.Channel || 'UNKNOWN';
    const productKeyChannel = winData.ProductKeyChannel || channel;
    const partialProductKey = winData.PartialProductKey || winData.PartialKey || 'NONE';
    const activationID = winData.ActivationID || winData.ActivationId || 'NONE';
    const applicationID = winData.ApplicationID || '55c92734-d682-4d71-983e-d6ec3f16059f';
    const skuID = winData.ID || winData.SkuId || winData.SKUID || 'NONE';
    const gracePeriod = winData.GracePeriodRemaining !== undefined ? winData.GracePeriodRemaining : 0;
    const licenseFamily = winData.LicenseFamily || winData.Family || description;

    const rawEvidence = {
      licenseStatus,
      description,
      channel,
      productKeyChannel,
      partialProductKey,
      activationID,
      applicationID,
      skuID,
      gracePeriod,
      licenseFamily
    };

    const isLicensed = licenseStatus === 1 || licenseStatus === 'LICENSED';

    const evidenceItems = [
      {
        componentName: 'Thông Tin Giấy Phép WMI (SoftwareLicensingProduct)',
        status: isLicensed ? 'PASS' : 'WARNING',
        dataSource: 'WMI (SoftwareLicensingProduct: 55c92734-d682-4d71-983e-d6ec3f16059f)',
        details: `LicenseStatus: ${licenseStatus} | Channel: ${productKeyChannel} | PartialKey: ...${partialProductKey} | ActivationID: ${activationID}`
      },
      {
        componentName: 'Cấu Hình Sản Phẩm & Grace Period',
        status: 'PASS',
        dataSource: 'WMI (SoftwareLicensingProduct Metadata)',
        details: `Description: ${description} | SKU ID: ${skuID} | GraceRemaining: ${gracePeriod} mins | Family: ${licenseFamily}`
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
      warnings: isLicensed ? [] : ['License status is not 1 (LICENSED)'],
      warningCount: isLicensed ? 0 : 1,
      errors: [],
      errorCount: 0,
      metadata: this.metadata
    };
  }
}

module.exports = WinLicenseCollector;
