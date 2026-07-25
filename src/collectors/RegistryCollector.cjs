/**
 * REGISTRY COLLECTOR V1
 * Category: REGISTRY | Priority: MEDIUM
 * Description: Gathers Image File Execution Options (IFEO) Debugger hooks and AppInit_DLLs.
 */

const path = require('path');
const frameworkPath = path.resolve(__dirname, '../../EnterpriseCollectorFramework.cjs');
const { BaseCollector, COLLECTOR_CATEGORIES, COLLECTOR_PRIORITIES, NORMALIZED_STATES } = require(frameworkPath);

class RegistryCollector extends BaseCollector {
  constructor() {
    super({
      collectorId: 'RegistryCollector',
      collectorName: 'IFEO & Registry Hook Collector',
      version: '1.0.0',
      category: COLLECTOR_CATEGORIES.REGISTRY,
      priority: COLLECTOR_PRIORITIES.MEDIUM,
      confidenceWeight: 20
    });
  }

  async collect(context = {}) {
    const rawData = context.rawData || {};
    const ifeoHooks = rawData.ifeoHooks || [];
    const hasHooks = (ifeoHooks && ifeoHooks.length > 0);

    return {
      normalizedState: hasHooks ? NORMALIZED_STATES.UNLICENSED : NORMALIZED_STATES.LICENSED,
      ifeoHooks,
      evidenceItems: [
        {
          componentName: 'Registry Hooks (IFEO Debugger)',
          status: hasHooks ? 'FAIL' : 'PASS',
          dataSource: 'Registry',
          confidenceWeight: 20,
          details: hasHooks ? `Phát hiện ${ifeoHooks.length} Hook bẫy Registry` : 'Không có Hook bẫy tiến trình'
        }
      ]
    };
  }
}

module.exports = RegistryCollector;
