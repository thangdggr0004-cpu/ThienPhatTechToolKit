/**
 * WIN REGISTRY COLLECTOR V1
 * Category: REGISTRY | Priority: HIGH (2)
 * Description: Reads SoftwareProtectionPlatform (NoGenTicket, KMS configs), ClipSVC, and HKLM:\SYSTEM\WPA.
 */

const path = require('path');
const frameworkPath = path.resolve(__dirname, '../../EnterpriseCollectorFramework.cjs');
const { BaseCollector, COLLECTOR_CATEGORIES, COLLECTOR_PRIORITIES, NORMALIZED_STATES } = require(frameworkPath);

class WinRegistryCollector extends BaseCollector {
  constructor() {
    super({
      collectorId: 'WinRegistryCollector',
      collectorName: 'Windows Registry Licensing Collector',
      version: '1.0.0',
      category: COLLECTOR_CATEGORIES.REGISTRY,
      priority: COLLECTOR_PRIORITIES.HIGH,
      confidenceWeight: 15,
      timeoutMs: 5000
    });
  }

  async collect(context = {}) {
    const rawData = context.rawData || {};
    const sysData = rawData.System || {};

    const hasNoGenTicket = sysData.NoGenTicket === true;
    const tsforgeTrace = sysData.TSforgeTrace === true;
    const regKmsHost = sysData.RegistryKmsHost || null;

    const hasAnomaly = hasNoGenTicket || tsforgeTrace;

    return {
      normalizedState: hasAnomaly ? NORMALIZED_STATES.UNKNOWN : NORMALIZED_STATES.LICENSED,
      hasNoGenTicket,
      tsforgeTrace,
      regKmsHost,
      evidenceItems: [
        {
          componentName: 'Cấu Hình Registry Hệ Thống (SoftwareProtectionPlatform & WPA)',
          status: hasAnomaly ? 'WARNING' : 'PASS',
          dataSource: 'Registry (HKLM:\\SOFTWARE\\...\\SoftwareProtectionPlatform & HKLM:\\SYSTEM\\WPA)',
          confidenceWeight: 15,
          details: hasAnomaly
            ? `Phát hiện điểm lưu ý Registry: NoGenTicket=${hasNoGenTicket}, TSforgeTrace=${tsforgeTrace}`
            : 'Cấu hình Registry SoftwareProtectionPlatform sạch sẽ, không có khóa NoGenTicket hay dấu vết WPA bất thường.'
        }
      ]
    };
  }
}

module.exports = WinRegistryCollector;
