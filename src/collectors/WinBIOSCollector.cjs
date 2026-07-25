/**
 * WIN BIOS COLLECTOR V1
 * Category: WINDOWS | Priority: CRITICAL (1)
 * Description: Reads OEM OA3 product key from ACPI MSDM Firmware Table via SoftwareLicensingService.
 */

const path = require('path');
const frameworkPath = path.resolve(__dirname, '../../EnterpriseCollectorFramework.cjs');
const { BaseCollector, COLLECTOR_CATEGORIES, COLLECTOR_PRIORITIES, NORMALIZED_STATES } = require(frameworkPath);

class WinBIOSCollector extends BaseCollector {
  constructor() {
    super({
      collectorId: 'WinBIOSCollector',
      collectorName: 'Windows OA3 BIOS Key Collector',
      version: '1.0.0',
      category: COLLECTOR_CATEGORIES.WINDOWS,
      priority: COLLECTOR_PRIORITIES.CRITICAL,
      confidenceWeight: 20,
      timeoutMs: 5000,
      requires: { wmi: true }
    });
  }

  async collect(context = {}) {
    const rawData = context.rawData || {};
    const winData = rawData.Windows || {};
    
    const hasOA3Key = winData.HasOA3Key === true || !!winData.OA3Key;
    const oa3KeyPartial = winData.OA3Key || (hasOA3Key ? 'PRESENT' : '');

    return {
      normalizedState: hasOA3Key ? NORMALIZED_STATES.LICENSED : NORMALIZED_STATES.UNKNOWN,
      hasOA3Key,
      oa3KeyPartial,
      evidenceItems: [
        {
          componentName: 'Khóa OA3 BIOS (ACPI MSDM Firmware)',
          status: hasOA3Key ? 'PASS' : 'WARNING',
          dataSource: 'WMI (SoftwareLicensingService.OA3xOriginalProductKey)',
          confidenceWeight: 20,
          details: hasOA3Key
            ? `Phát hiện khóa OA3 nhúng trong BIOS (Key: ...${oa3KeyPartial})`
            : 'Không phát hiện khóa OA3 trong BIOS/UEFI (Máy tính DIY hoặc không có tem OEM OEM_DM)'
        }
      ]
    };
  }
}

module.exports = WinBIOSCollector;
