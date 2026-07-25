/**
 * ENVIRONMENT ASSESSMENT COLLECTOR V1
 * Category: ENVIRONMENT | Priority: LOW (4)
 * Description: Evaluates environment artifacts including Hosts redirects, Scheduled Tasks, and Suspicious Services.
 * MUST NOT conclude "Crack" or "Pirated" - reports raw technical observations only.
 */

const path = require('path');
const frameworkPath = path.resolve(__dirname, '../../EnterpriseCollectorFramework.cjs');
const { BaseCollector, COLLECTOR_CATEGORIES, COLLECTOR_PRIORITIES, NORMALIZED_STATES } = require(frameworkPath);

class EnvironmentAssessmentCollector extends BaseCollector {
  constructor() {
    super({
      collectorId: 'EnvironmentAssessmentCollector',
      collectorName: 'Windows Environment Artifacts Assessment Collector',
      version: '1.0.0',
      category: COLLECTOR_CATEGORIES.ENVIRONMENT,
      priority: COLLECTOR_PRIORITIES.LOW,
      confidenceWeight: 10,
      timeoutMs: 5000
    });
  }

  async collect(context = {}) {
    const rawData = context.rawData || {};
    const sysData = rawData.System || {};

    const piratedFiles = sysData.PiratedFiles || [];
    const suspiciousTasks = sysData.SuspiciousTasks || [];
    const suspiciousServices = sysData.SuspiciousServices || [];
    const hostsRedirects = sysData.HostsRedirects || [];

    const artifactCount = piratedFiles.length + suspiciousTasks.length + suspiciousServices.length + hostsRedirects.length;
    const hasArtifacts = artifactCount > 0;

    return {
      normalizedState: hasArtifacts ? NORMALIZED_STATES.UNKNOWN : NORMALIZED_STATES.LICENSED,
      artifactCount,
      piratedFiles,
      suspiciousTasks,
      suspiciousServices,
      hostsRedirects,
      evidenceItems: [
        {
          componentName: 'Đánh Giá Môi Trường & Dấu Vết Cấu Hình (Environment Artifacts)',
          status: hasArtifacts ? 'WARNING' : 'PASS',
          dataSource: 'System Environment Inspection (Hosts / Tasks / Services / Files)',
          confidenceWeight: 10,
          details: hasArtifacts
            ? `Phát hiện ${artifactCount} đặc điểm cấu hình cần lưu ý (Hosts: ${hostsRedirects.length}, Tasks: ${suspiciousTasks.length}, Services: ${suspiciousServices.length}, Files: ${piratedFiles.length})`
            : 'Môi trường hệ thống sạch sẽ, không phát hiện điều hướng hosts hoặc dịch vụ cấu hình bất thường.'
        }
      ]
    };
  }
}

module.exports = EnvironmentAssessmentCollector;
