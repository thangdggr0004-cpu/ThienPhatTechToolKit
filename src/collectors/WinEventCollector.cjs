/**
 * WIN EVENT COLLECTOR V1.1 (PURE EVIDENCE COLLECTOR)
 * Category: ENVIRONMENT | Priority: MEDIUM (3)
 * Description: Supporting Evidence Collector reading Microsoft-Windows-Security-SPP Event Log IDs (12288, 12289, 1003, 16384). No decision or confidence logic.
 */

const path = require('path');
const frameworkPath = path.resolve(__dirname, '../../EnterpriseCollectorFramework.cjs');
const { BaseCollector, COLLECTOR_CATEGORIES, COLLECTOR_PRIORITIES } = require(frameworkPath);

class WinEventCollector extends BaseCollector {
  constructor() {
    super({
      collectorId: 'WinEventCollector',
      collectorName: 'Windows Security-SPP Event Log Collector',
      version: '1.1.0',
      category: COLLECTOR_CATEGORIES.ENVIRONMENT,
      priority: COLLECTOR_PRIORITIES.MEDIUM,
      timeoutMs: 5000
    });

    this.metadata = {
      collectorName: 'Windows Security-SPP Event Log Collector',
      collectorVersion: '1.1.0',
      author: 'Enterprise Windows Diagnostic Engineering',
      description: 'Gathers supporting event log entries for Security-SPP (Event IDs 12288, 12289, 1003, 16384)',
      category: COLLECTOR_CATEGORIES.ENVIRONMENT,
      priority: COLLECTOR_PRIORITIES.MEDIUM,
      executionMode: 'READ_ONLY',
      readOnly: true,
      dependencies: [],
      capability: { powershell: true, wmi: false, winVerifyTrust: false },
      supportedWindowsVersions: ['Windows 10', 'Windows 11', 'Windows Server 2016+']
    };
  }

  async collect(context = {}) {
    const rawData = context.rawData || {};
    const sysData = rawData.System || {};
    const eventLogs = sysData.KMSEvents || sysData.SPPEvents || [];

    const eventCount = eventLogs.length;

    const rawEvidence = {
      eventLogProvider: 'Microsoft-Windows-Security-SPP',
      queriedEventIds: [12288, 12289, 1003, 16384],
      totalEventsFound: eventCount,
      events: eventLogs.map(e => ({
        eventId: e.EventID || e.eventId || 0,
        timeCreated: e.TimeCreated || e.timeCreated || new Date().toISOString(),
        message: e.Message || e.message || 'SPP Event Log Entry'
      }))
    };

    const evidenceItems = [
      {
        componentName: 'Nhật Ký Sự Kiện Hệ Thống (Event Log - Security-SPP)',
        status: 'PASS',
        dataSource: 'Windows Event Log (Microsoft-Windows-Security-SPP)',
        details: eventCount > 0
          ? `Thu thập ${eventCount} bản ghi sự kiện SPP gần nhất (IDs 12288/12289/1003/16384).`
          : 'Không phát hiện bản ghi sự kiện SPP mới trong nhật ký Application.'
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
      warnings: [],
      warningCount: 0,
      errors: [],
      errorCount: 0,
      metadata: this.metadata
    };
  }
}

module.exports = WinEventCollector;
