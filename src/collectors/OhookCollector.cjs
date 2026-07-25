/**
 * OHOOK COLLECTOR V1
 * Category: FILESYSTEM | Priority: HIGH
 * Description: Gathers Office directory sppcs.dll file integrity evidence.
 */

const path = require('path');
const frameworkPath = path.resolve(__dirname, '../../EnterpriseCollectorFramework.cjs');
const { BaseCollector, COLLECTOR_CATEGORIES, COLLECTOR_PRIORITIES, NORMALIZED_STATES } = require(frameworkPath);

class OhookCollector extends BaseCollector {
  constructor() {
    super({
      collectorId: 'OhookCollector',
      collectorName: 'OHook File Integrity Collector',
      version: '1.0.0',
      category: COLLECTOR_CATEGORIES.FILESYSTEM,
      priority: COLLECTOR_PRIORITIES.HIGH,
      confidenceWeight: 25
    });
  }

  async collect(context = {}) {
    const rawData = context.rawData || {};
    const ohookDllFound = Boolean(rawData.ohookDllFound);

    return {
      normalizedState: ohookDllFound ? NORMALIZED_STATES.UNLICENSED : NORMALIZED_STATES.LICENSED,
      ohookDllFound,
      evidenceItems: [
        {
          componentName: 'Kiểm Tra Tệp Thư Mục Office (sppcs.dll)',
          status: ohookDllFound ? 'FAIL' : 'PASS',
          dataSource: 'FileIntegrity',
          confidenceWeight: 25,
          details: ohookDllFound ? 'Phát hiện tệp sppcs.dll lạ trong thư mục Office' : 'Sạch sẽ, không có tệp lạ'
        }
      ]
    };
  }
}

module.exports = OhookCollector;
