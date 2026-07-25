/**
 * SERVICES COLLECTOR V1
 * Category: SERVICE | Priority: MEDIUM
 * Description: Gathers ClickToRunSvc, sppsvc, osppsvc Windows Service health telemetry.
 */

const path = require('path');
const frameworkPath = path.resolve(__dirname, '../../EnterpriseCollectorFramework.cjs');
const { BaseCollector, COLLECTOR_CATEGORIES, COLLECTOR_PRIORITIES, NORMALIZED_STATES } = require(frameworkPath);

class ServicesCollector extends BaseCollector {
  constructor() {
    super({
      collectorId: 'ServicesCollector',
      collectorName: 'Office & Licensing Services Collector',
      version: '1.0.0',
      category: COLLECTOR_CATEGORIES.SERVICE,
      priority: COLLECTOR_PRIORITIES.MEDIUM,
      confidenceWeight: 10
    });
  }

  async collect(context = {}) {
    const rawData = context.rawData || {};
    const services = rawData.services || [];
    const c2rService = services.find(s => s.name === 'ClickToRunSvc');
    const isServiceActive = Boolean(c2rService && c2rService.status === 'Running');

    return {
      normalizedState: isServiceActive ? NORMALIZED_STATES.LICENSED : NORMALIZED_STATES.UNKNOWN,
      services,
      evidenceItems: []
    };
  }
}

module.exports = ServicesCollector;
