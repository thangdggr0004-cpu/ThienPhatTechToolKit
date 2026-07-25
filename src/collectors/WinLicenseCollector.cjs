/**
 * WIN LICENSE COLLECTOR V1.2 (ENTERPRISE DATA MODEL)
 * Category: LICENSE | Priority: CRITICAL (1)
 * Description: Reads WMI SoftwareLicensingProduct for Windows ApplicationID without scoring or judgements.
 */

const path = require('path');
const frameworkPath = path.resolve(__dirname, '../../EnterpriseCollectorFramework.cjs');
const { BaseCollector, COLLECTOR_CATEGORIES, COLLECTOR_PRIORITIES } = require(frameworkPath);

class WinLicenseCollector extends BaseCollector {
  constructor() {
    super({
      collectorId: 'WinLicenseCollector',
      collectorName: 'Windows WMI SoftwareLicensingProduct Collector',
      version: '1.2.0',
      category: COLLECTOR_CATEGORIES.LICENSE,
      priority: COLLECTOR_PRIORITIES.CRITICAL,
      timeoutMs: 5000,
      requires: { wmi: true }
    });

    this.metadata = {
      collectorName: 'Windows WMI SoftwareLicensingProduct Collector',
      collectorVersion: '1.2.0',
      author: 'Enterprise Windows Diagnostic Engineering',
      description: 'Gathers SoftwareLicensingProduct WMI properties for Windows ApplicationID',
      category: COLLECTOR_CATEGORIES.LICENSE,
      priority: COLLECTOR_PRIORITIES.CRITICAL,
      readOnly: true,
      executionMode: 'READ_ONLY',
      dependencies: [],
      supportedWindowsVersions: ['Windows 10', 'Windows 11', 'Windows Server 2016+'],
      capability: { powershell: true, wmi: true, winVerifyTrust: false }
    };
  }

  async collect(context = {}) {
    const collectedTime = new Date().toISOString();
    const rawData = context.rawData || {};
    const winData = rawData.Windows || {};

    const licenseStatus = winData.LicenseStatus !== undefined ? winData.LicenseStatus : (winData.LicenseStatusText || 'UNKNOWN');
    const licenseStatusReason = winData.LicenseStatusReason || winData.ErrorCode || '0x00000000';
    const productKeyChannel = winData.ProductKeyChannel || winData.Channel || 'UNKNOWN';
    const partialProductKey = winData.PartialProductKey || winData.PartialKey || 'NONE';
    const activationID = winData.ActivationID || winData.ActivationId || 'NONE';
    const applicationID = winData.ApplicationID || '55c92734-d682-4d71-983e-d6ec3f16059f';
    const skuID = winData.ID || winData.SkuId || winData.SKUID || 'NONE';
    const licenseFamily = winData.LicenseFamily || winData.Family || winData.Description || 'UNKNOWN';
    const gracePeriod = winData.GracePeriodRemaining !== undefined ? winData.GracePeriodRemaining : 0;
    const remainingRearmCount = winData.RemainingRearmCount !== undefined ? winData.RemainingRearmCount : 1001;
    const trustedTime = winData.TrustedTime || collectedTime;
    const evaluationEndDate = winData.EvaluationEndDate || 'NONE';

    const rawEvidence = {
      licenseStatus,
      licenseStatusReason,
      productKeyChannel,
      partialProductKey,
      activationID,
      applicationID,
      skuID,
      licenseFamily,
      gracePeriod,
      remainingRearmCount,
      trustedTime,
      evaluationEndDate
    };

    const evidenceItems = [
      {
        evidenceId: 'EVD-WIN-LIC-001',
        evidenceName: 'WMI SoftwareLicensingProduct State',
        evidenceType: 'LICENSE',
        evidenceSource: 'WMI (SoftwareLicensingProduct: 55c92734-d682-4d71-983e-d6ec3f16059f)',
        evidenceValue: { licenseStatus, licenseStatusReason, productKeyChannel, partialProductKey, activationID, applicationID },
        evidenceFormat: 'OBJECT',
        evidenceStatus: 'DATA_PRESENT',
        collectedTime,
        collectorVersion: this.version,
        rawValue: { licenseStatus, productKeyChannel, partialProductKey, activationID },
        normalizedValue: `Status: ${licenseStatus} | Channel: ${productKeyChannel} | Key: ...${partialProductKey}`
      },
      {
        evidenceId: 'EVD-WIN-LIC-002',
        evidenceName: 'WMI License Extended Attributes',
        evidenceType: 'LICENSE',
        evidenceSource: 'WMI (SoftwareLicensingProduct Metadata)',
        evidenceValue: { skuID, licenseFamily, gracePeriod, remainingRearmCount, trustedTime, evaluationEndDate },
        evidenceFormat: 'OBJECT',
        evidenceStatus: 'DATA_PRESENT',
        collectedTime,
        collectorVersion: this.version,
        rawValue: { skuID, licenseFamily, gracePeriod, remainingRearmCount },
        normalizedValue: `Family: ${licenseFamily} | SKU: ${skuID} | GraceRemaining: ${gracePeriod}m`
      }
    ];

    const isLicensed = licenseStatus === 1 || licenseStatus === 'LICENSED';

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
