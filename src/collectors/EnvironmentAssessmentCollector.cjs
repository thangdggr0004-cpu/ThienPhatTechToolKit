/**
 * ENVIRONMENT ASSESSMENT COLLECTOR V1.2 (ENTERPRISE DATA MODEL)
 * Category: ENVIRONMENT | Priority: LOW (4)
 * Description: Gathers environment technical artifacts (Hosts redirects, Scheduled Tasks, Custom Services, Non-standard Files, Environment Notes) without judgements or scoring.
 * STRICTLY NO USE OF TERMS: Crack, Pirated, Illegal, Hack, Bypass, Activator.
 */

const path = require('path');
const frameworkPath = path.resolve(__dirname, '../../EnterpriseCollectorFramework.cjs');
const { BaseCollector, COLLECTOR_CATEGORIES, COLLECTOR_PRIORITIES } = require(frameworkPath);

class EnvironmentAssessmentCollector extends BaseCollector {
  constructor() {
    super({
      collectorId: 'EnvironmentAssessmentCollector',
      collectorName: 'Windows Environment Artifacts Collector',
      version: '1.2.0',
      category: COLLECTOR_CATEGORIES.ENVIRONMENT,
      priority: COLLECTOR_PRIORITIES.LOW,
      timeoutMs: 5000
    });

    this.metadata = {
      collectorName: 'Windows Environment Artifacts Collector',
      collectorVersion: '1.2.0',
      author: 'Enterprise Windows Diagnostic Engineering',
      description: 'Gathers environment artifacts (Hosts file redirects, scheduled tasks, custom services, non-standard files, environment notes)',
      category: COLLECTOR_CATEGORIES.ENVIRONMENT,
      priority: COLLECTOR_PRIORITIES.LOW,
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

    const hostsRedirects = sysData.HostsRedirects || [];
    const scheduledTasks = sysData.ScheduledTasks || sysData.SuspiciousTasks || [];
    const customServices = sysData.CustomServices || sysData.SuspiciousServices || [];
    const nonStandardFiles = sysData.NonStandardFiles || sysData.PiratedFiles || [];
    const environmentNotes = sysData.EnvironmentNotes || 'Standard system environment query performed';

    const totalArtifacts = hostsRedirects.length + scheduledTasks.length + customServices.length + nonStandardFiles.length;
    const hasArtifacts = totalArtifacts > 0;

    const rawEvidence = {
      hostsRedirects,
      scheduledTasks,
      customServices,
      nonStandardFiles,
      environmentNotes,
      totalArtifacts
    };

    const evidenceItems = [
      {
        evidenceId: 'EVD-WIN-ENV-001',
        evidenceName: 'Hosts File Domain Redirect Entries',
        evidenceType: 'ENVIRONMENT',
        evidenceSource: 'FileSystem (%SystemRoot%\\System32\\drivers\\etc\\hosts)',
        evidenceValue: { hostsRedirects, count: hostsRedirects.length },
        evidenceFormat: 'ARRAY',
        evidenceStatus: hostsRedirects.length > 0 ? 'DATA_PRESENT' : 'NOT_CONFIGURED',
        collectedTime,
        collectorVersion: this.version,
        rawValue: hostsRedirects,
        normalizedValue: `HostsRedirectsCount: ${hostsRedirects.length}`
      },
      {
        evidenceId: 'EVD-WIN-ENV-002',
        evidenceName: 'System Scheduled Tasks & Custom Services Inspection',
        evidenceType: 'ENVIRONMENT',
        evidenceSource: 'Task Scheduler & Service Control Manager',
        evidenceValue: { scheduledTasks, customServices, nonStandardFiles, environmentNotes },
        evidenceFormat: 'OBJECT',
        evidenceStatus: (scheduledTasks.length > 0 || customServices.length > 0 || nonStandardFiles.length > 0) ? 'DATA_PRESENT' : 'NOT_CONFIGURED',
        collectedTime,
        collectorVersion: this.version,
        rawValue: { scheduledTasks, customServices, nonStandardFiles },
        normalizedValue: `Tasks: ${scheduledTasks.length} | CustomServices: ${customServices.length} | NonStandardFiles: ${nonStandardFiles.length}`
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
      warnings: hasArtifacts ? ['Non-standard environment artifacts logged'] : [],
      warningCount: hasArtifacts ? 1 : 0,
      errors: [],
      errorCount: 0,
      metadata: this.metadata
    };
  }
}

module.exports = EnvironmentAssessmentCollector;
