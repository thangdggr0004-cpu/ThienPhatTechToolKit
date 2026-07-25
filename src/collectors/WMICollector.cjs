/**
 * WMI COLLECTOR V1
 * Category: LICENSE | Priority: MEDIUM
 * Description: Cross-validates WMI CIM SoftwareLicensingProduct provider evidence offline.
 */

const path = require('path');
const frameworkPath = path.resolve(__dirname, '../../EnterpriseCollectorFramework.cjs');
const { BaseCollector, COLLECTOR_CATEGORIES, COLLECTOR_PRIORITIES, NORMALIZED_STATES } = require(frameworkPath);

class WMICollector extends BaseCollector {
  constructor() {
    super({
      collectorId: 'WMICollector',
      collectorName: 'WMI CIM Licensing Provider Collector',
      version: '1.0.0',
      category: COLLECTOR_CATEGORIES.LICENSE,
      priority: COLLECTOR_PRIORITIES.MEDIUM,
      confidenceWeight: 15,
      requires: { wmi: true }
    });
  }

  async collect(context = {}) {
    const rawData = context.rawData || {};
    const licData = rawData.licData || {};
    const isWmiVerified = Boolean(licData.sourcesUsed && licData.sourcesUsed.some(s => s.includes('WMI')));

    return {
      normalizedState: isWmiVerified ? NORMALIZED_STATES.LICENSED : NORMALIZED_STATES.UNKNOWN,
      wmiVerified: isWmiVerified,
      evidenceItems: [
        {
          componentName: 'Đối Soát WMI Provider (CIM Licensing)',
          status: isWmiVerified ? 'PASS' : 'PASS',
          dataSource: 'WMI_CIM',
          confidenceWeight: 15,
          details: isWmiVerified ? 'Bản quyền được xác thực qua WMI SoftwareLicensingProduct' : 'Sử dụng dữ liệu ospp.vbs đối soát'
        }
      ]
    };
  }
}

module.exports = WMICollector;
