/**
 * ENVIRONMENT ASSESSMENT COLLECTOR V1.1 (PURE EVIDENCE COLLECTOR)
 * Category: ENVIRONMENT | Priority: LOW (4)
 * Description: Gathers environment technical artifacts (Hosts redirects, Scheduled Tasks, Non-standard Services, File entries) without judgmental terms or scoring.
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
      version: '1.1.0',
      category: COLLECTOR_CATEGORIES.ENVIRONMENT,
      priority: COLLECTOR_PRIORITIES.LOW,
      timeoutMs: 5000
    });

    this.metadata = {
      collectorName: 'Windows Environment Artifacts Collector',
      collectorVersion: '1.1.0',
      author: 'Enterprise Windows Diagnostic Engineering',
      description: 'Gathers environment artifacts (Hosts file redirects, scheduled tasks, non-standard services, binary entries)',
      category: COLLECTOR_CATEGORIES.ENVIRONMENT,
      priority: COLLECTOR_PRIORITIES.LOW,
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

    const nonStandardFiles = sysData.NonStandardFiles || sysData.PiratedFiles || [];
    const scheduledTasks = sysData.ScheduledTasks || sysData.SuspiciousTasks || [];
    const customServices = sysData.CustomServices || sysData.SuspiciousServices || [];
    const hostsRedirects = sysData.HostsRedirects || [];

    const totalArtifacts = nonStandardFiles.length + scheduledTasks.length + customServices.length + hostsRedirects.length;
    const hasArtifacts = totalArtifacts > 0;

    const rawEvidence = {
      hostsRedirectsCount: hostsRedirects.length,
      hostsRedirectsList: hostsRedirects,
      scheduledTasksCount: scheduledTasks.length,
      scheduledTasksList: scheduledTasks,
      customServicesCount: customServices.length,
      customServicesList: customServices,
      nonStandardFilesCount: nonStandardFiles.length,
      nonStandardFilesList: nonStandardFiles
    };

    const evidenceItems = [
      {
        componentName: 'Thu Thập Môi Trường & Dấu Vết Cấu Hình (Environment Artifacts)',
        status: hasArtifacts ? 'WARNING' : 'PASS',
        dataSource: 'System Environment Query (Hosts / Tasks / Services / File System)',
        details: hasArtifacts
          ? `Ghi nhận ${totalArtifacts} đặc điểm cấu hình môi trường (Hosts: ${hostsRedirects.length}, Tasks: ${scheduledTasks.length}, Services: ${customServices.length}, Files: ${nonStandardFiles.length})`
          : 'Cấu hình môi trường hệ thống tiêu chuẩn, không có điều hướng Hosts hoặc tác vụ tùy chỉnh liên quan đến KMS/Licensing.'
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
