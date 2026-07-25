/**
 * LICENSE COLLECTOR V1
 * Category: LICENSE | Priority: CRITICAL
 * Description: Gathers multi-source Office licensing, GVLK, Retail, MAK, Subscription status.
 */

const path = require('path');
const frameworkPath = path.resolve(__dirname, '../../EnterpriseCollectorFramework.cjs');
const { BaseCollector, COLLECTOR_CATEGORIES, COLLECTOR_PRIORITIES, NORMALIZED_STATES } = require(frameworkPath);

class LicenseCollector extends BaseCollector {
  constructor() {
    super({
      collectorId: 'LicenseCollector',
      collectorName: 'Enterprise License Collector',
      version: '1.0.0',
      category: COLLECTOR_CATEGORIES.LICENSE,
      priority: COLLECTOR_PRIORITIES.CRITICAL,
      confidenceWeight: 20,
      timeoutMs: 8000
    });
  }

  async collect(context = {}) {
    const rawData = context.rawData || {};
    const licData = rawData.licData || {};
    const licenseStatus = rawData.licenseStatus || licData.licenseStatus || 'UNKNOWN';
    const isLicensed = (licenseStatus === 'LICENSED' || licData.activationState === 'LICENSED');
    const sourcesStr = licData.sourcesUsed ? licData.sourcesUsed.join('+') : 'ospp.vbs';

    return {
      normalizedState: isLicensed ? NORMALIZED_STATES.LICENSED : NORMALIZED_STATES.UNLICENSED,
      licenseStatus,
      licData,
      evidenceItems: [
        {
          componentName: 'Bản Quyền Office (OSPP License)',
          status: isLicensed ? 'PASS' : 'WARNING',
          dataSource: `MultiSource (${sourcesStr})`,
          confidenceWeight: 20,
          details: `Trạng thái: ${licenseStatus || 'Chưa kích hoạt'} (Kênh: ${licData.licenseChannel || 'Standard'}, Key: ...${rawData.partialKey || licData.partialKey || 'N/A'})`
        }
      ]
    };
  }
}

module.exports = LicenseCollector;
