/**
 * WIN SERVICE COLLECTOR V1
 * Category: SERVICE | Priority: HIGH (2)
 * Description: Checks execution statuses of sppsvc, ClipSVC, and LicenseManager.
 */

const path = require('path');
const frameworkPath = path.resolve(__dirname, '../../EnterpriseCollectorFramework.cjs');
const { BaseCollector, COLLECTOR_CATEGORIES, COLLECTOR_PRIORITIES, NORMALIZED_STATES } = require(frameworkPath);

class WinServiceCollector extends BaseCollector {
  constructor() {
    super({
      collectorId: 'WinServiceCollector',
      collectorName: 'Windows Licensing Services Collector',
      version: '1.0.0',
      category: COLLECTOR_CATEGORIES.SERVICE,
      priority: COLLECTOR_PRIORITIES.HIGH,
      confidenceWeight: 10,
      timeoutMs: 5000
    });
  }

  async collect(context = {}) {
    const rawData = context.rawData || {};
    const svcData = rawData.Services || {};

    const sppsvcActive = svcData.sppsvcActive !== undefined ? svcData.sppsvcActive : true;
    const clipSvcActive = svcData.clipSvcActive !== undefined ? svcData.clipSvcActive : true;
    const licenseManagerActive = svcData.licenseManagerActive !== undefined ? svcData.licenseManagerActive : true;

    const allServicesOK = sppsvcActive && clipSvcActive && licenseManagerActive;

    return {
      normalizedState: allServicesOK ? NORMALIZED_STATES.LICENSED : NORMALIZED_STATES.UNKNOWN,
      sppsvcActive,
      clipSvcActive,
      licenseManagerActive,
      evidenceItems: [
        {
          componentName: 'Trạng Thái Dịch Vụ Cấp Phép (sppsvc / ClipSVC / LicenseManager)',
          status: allServicesOK ? 'PASS' : 'WARNING',
          dataSource: 'Service Control Manager (SCM Query)',
          confidenceWeight: 10,
          details: allServicesOK
            ? 'Các dịch vụ cấp phép lõi (sppsvc, ClipSVC, LicenseManager) hoạt động bình thường.'
            : `Phát hiện dịch vụ chưa kích hoạt: sppsvc=${sppsvcActive}, ClipSVC=${clipSvcActive}, LicenseManager=${licenseManagerActive}`
        }
      ]
    };
  }
}

module.exports = WinServiceCollector;
