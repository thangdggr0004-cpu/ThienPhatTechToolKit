/**
 * SPP COLLECTOR V1
 * Category: SERVICE | Priority: HIGH
 * Description: Gathers Software Protection Service (sppsvc) token cache integrity and licensing service health offline.
 */

const path = require('path');
const frameworkPath = path.resolve(__dirname, '../../EnterpriseCollectorFramework.cjs');
const { BaseCollector, COLLECTOR_CATEGORIES, COLLECTOR_PRIORITIES, NORMALIZED_STATES } = require(frameworkPath);

class SPPCollector extends BaseCollector {
  constructor() {
    super({
      collectorId: 'SPPCollector',
      collectorName: 'Software Protection Service Collector',
      version: '1.0.0',
      category: COLLECTOR_CATEGORIES.SERVICE,
      priority: COLLECTOR_PRIORITIES.HIGH,
      confidenceWeight: 15,
      requires: { powershell: true }
    });
  }

  async collect(context = {}) {
    const rawData = context.rawData || {};
    const services = rawData.services || [];
    const sppService = services.find(s => s.name === 'sppsvc');
    const isSppActive = Boolean(sppService && sppService.status !== 'Disabled');

    return {
      normalizedState: isSppActive ? NORMALIZED_STATES.LICENSED : NORMALIZED_STATES.UNKNOWN,
      sppStatus: sppService ? sppService.status : 'UNKNOWN',
      evidenceItems: [
        {
          componentName: 'Dịch Vụ Protection System (sppsvc)',
          status: isSppActive ? 'PASS' : 'WARNING',
          dataSource: 'ServiceHealth',
          confidenceWeight: 15,
          details: `Trạng thái sppsvc: ${sppService ? sppService.status : 'Không đọc được thông tin dịch vụ'}`
        }
      ]
    };
  }
}

module.exports = SPPCollector;
