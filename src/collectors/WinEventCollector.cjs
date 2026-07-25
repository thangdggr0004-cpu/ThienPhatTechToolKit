/**
 * WIN EVENT COLLECTOR V1.2 (ENTERPRISE DATA MODEL)
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
      version: '1.2.0',
      category: COLLECTOR_CATEGORIES.ENVIRONMENT,
      priority: COLLECTOR_PRIORITIES.MEDIUM,
      timeoutMs: 5000
    });

    this.metadata = {
      collectorName: 'Windows Security-SPP Event Log Collector',
      collectorVersion: '1.2.0',
      author: 'Enterprise Windows Diagnostic Engineering',
      description: 'Gathers supporting event log entries for Security-SPP (Event IDs 12288, 12289, 1003, 16384)',
      category: COLLECTOR_CATEGORIES.ENVIRONMENT,
      priority: COLLECTOR_PRIORITIES.MEDIUM,
      readOnly: true,
      executionMode: 'READ_ONLY',
      dependencies: [],
      supportedWindowsVersions: ['Windows 10', 'Windows 11', 'Windows Server 2016+'],
      capability: { powershell: true, wmi: false, winVerifyTrust: false }
    };
  }

  async collect(context = {}) {
    const collectedTime = new Date().toISOString();
    const rawData = context.rawData || {};
    const sysData = rawData.System || {};
    const eventLogs = sysData.KMSEvents || sysData.SPPEvents || [];

    const provider = 'Microsoft-Windows-Security-SPP';
    const machineName = sysData.MachineName || process.env.COMPUTERNAME || 'LOCAL_HOST';

    const events = eventLogs.map(e => ({
      provider,
      eventId: e.EventID || e.eventId || 12288,
      level: e.Level || 'Information',
      time: e.TimeCreated || e.timeCreated || collectedTime,
      message: e.Message || e.message || 'Security-SPP Event Log Entry',
      machineName
    }));

    const rawEvidence = {
      provider,
      queriedEventIds: [12288, 12289, 1003, 16384],
      totalEventsFound: events.length,
      events,
      machineName
    };

    const evidenceItems = [
      {
        evidenceId: 'EVD-WIN-EVT-001',
        evidenceName: 'Security-SPP Application Event Log Entries',
        evidenceType: 'ENVIRONMENT',
        evidenceSource: `Windows Event Log (${provider})`,
        evidenceValue: rawEvidence,
        evidenceFormat: 'ARRAY',
        evidenceStatus: 'RECORDED',
        collectedTime,
        collectorVersion: this.version,
        rawValue: events,
        normalizedValue: `TotalEvents: ${events.length} | Provider: ${provider} | Machine: ${machineName}`
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
