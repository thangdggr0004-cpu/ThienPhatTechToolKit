/**
 * WIN EVENT COLLECTOR V1
 * Category: ENVIRONMENT | Priority: MEDIUM (3)
 * Description: Reads Microsoft-Windows-Security-SPP Event Log IDs 12288, 12289, 1003, 16384 as supporting evidence.
 */

const path = require('path');
const frameworkPath = path.resolve(__dirname, '../../EnterpriseCollectorFramework.cjs');
const { BaseCollector, COLLECTOR_CATEGORIES, COLLECTOR_PRIORITIES, NORMALIZED_STATES } = require(frameworkPath);

class WinEventCollector extends BaseCollector {
  constructor() {
    super({
      collectorId: 'WinEventCollector',
      collectorName: 'Windows Security-SPP Event Log Collector',
      version: '1.0.0',
      category: COLLECTOR_CATEGORIES.ENVIRONMENT,
      priority: COLLECTOR_PRIORITIES.MEDIUM,
      confidenceWeight: 5,
      timeoutMs: 5000
    });
  }

  async collect(context = {}) {
    const rawData = context.rawData || {};
    const sysData = rawData.System || {};
    const kmsEvents = sysData.KMSEvents || [];

    const eventCount = kmsEvents.length;

    return {
      normalizedState: NORMALIZED_STATES.UNKNOWN, // Supporting evidence only - never decides activation state alone
      eventCount,
      kmsEvents,
      evidenceItems: [
        {
          componentName: 'Nhật Ký Sự Kiện Hệ Thống (Event Viewer - Security-SPP)',
          status: 'PASS',
          dataSource: 'Event Log (Microsoft-Windows-Security-SPP: 12288/12289/1003/16384)',
          confidenceWeight: 5,
          details: eventCount > 0
            ? `Ghi nhận ${eventCount} sự kiện SPP gần nhất trong nhật ký Application.`
            : 'Chưa tìm thấy bản ghi sự kiện SPP bất thường trong nhật ký Application gần đây.'
        }
      ]
    };
  }
}

module.exports = WinEventCollector;
