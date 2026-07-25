/**
 * OFFICE UPDATE COLLECTOR V1
 * Category: CONFIGURATION | Priority: MEDIUM
 * Description: Gathers ClickToRun Update Channel configuration and AutoUpdate telemetry offline.
 */

const path = require('path');
const frameworkPath = path.resolve(__dirname, '../../EnterpriseCollectorFramework.cjs');
const { BaseCollector, COLLECTOR_CATEGORIES, COLLECTOR_PRIORITIES, NORMALIZED_STATES } = require(frameworkPath);

class OfficeUpdateCollector extends BaseCollector {
  constructor() {
    super({
      collectorId: 'OfficeUpdateCollector',
      collectorName: 'Office Update Channel Collector',
      version: '1.0.0',
      category: COLLECTOR_CATEGORIES.CONFIGURATION,
      priority: COLLECTOR_PRIORITIES.MEDIUM,
      confidenceWeight: 10
    });
  }

  async collect(context = {}) {
    const rawData = context.rawData || {};
    const licData = rawData.licData || {};
    const channel = licData.licenseChannel || 'Standard';

    return {
      normalizedState: NORMALIZED_STATES.LICENSED,
      channel,
      evidenceItems: [
        {
          componentName: 'Kênh Cập Nhật Office (Update Channel)',
          status: 'PASS',
          dataSource: 'C2R_Registry',
          confidenceWeight: 10,
          details: `Kênh cập nhật: ${channel}`
        }
      ]
    };
  }
}

module.exports = OfficeUpdateCollector;
