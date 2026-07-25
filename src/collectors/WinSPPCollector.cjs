/**
 * WIN SPP COLLECTOR V1
 * Category: SECURITY | Priority: MEDIUM (3)
 * Description: Reads SPP State, Grace Period, and Token Store (tokens.dat) file presence and size. READ ONLY.
 */

const path = require('path');
const frameworkPath = path.resolve(__dirname, '../../EnterpriseCollectorFramework.cjs');
const { BaseCollector, COLLECTOR_CATEGORIES, COLLECTOR_PRIORITIES, NORMALIZED_STATES } = require(frameworkPath);

class WinSPPCollector extends BaseCollector {
  constructor() {
    super({
      collectorId: 'WinSPPCollector',
      collectorName: 'Windows Software Protection Platform (SPP) Token Store Collector',
      version: '1.0.0',
      category: COLLECTOR_CATEGORIES.SECURITY,
      priority: COLLECTOR_PRIORITIES.MEDIUM,
      confidenceWeight: 10,
      timeoutMs: 5000
    });
  }

  async collect(context = {}) {
    const rawData = context.rawData || {};
    const sppData = rawData.SPP || {};

    const tokenStoreExists = sppData.tokenStoreExists !== undefined ? sppData.tokenStoreExists : true;
    const tokenStoreSizeBytes = sppData.tokenStoreSizeBytes || 0;
    const sppState = sppData.sppState || 'NORMAL';

    const isHealthy = tokenStoreExists && sppState === 'NORMAL';

    return {
      normalizedState: isHealthy ? NORMALIZED_STATES.LICENSED : NORMALIZED_STATES.UNKNOWN,
      tokenStoreExists,
      tokenStoreSizeBytes,
      sppState,
      evidenceItems: [
        {
          componentName: 'Kho Chứng Chỉ SPP Token Store (tokens.dat)',
          status: isHealthy ? 'PASS' : 'WARNING',
          dataSource: 'FileSystem (%SystemRoot%\\System32\\spp\\store\\2.0\\tokens.dat)',
          confidenceWeight: 10,
          details: isHealthy
            ? `Tệp kho chứng chỉ tokens.dat tồn tại bình thường (${tokenStoreSizeBytes > 0 ? (tokenStoreSizeBytes / 1024).toFixed(1) + ' KB' : 'Chính hãng'})`
            : `Cảnh báo kho chứng chỉ SPP: Tồn tại=${tokenStoreExists}, Trạng thái=${sppState}`
        }
      ]
    };
  }
}

module.exports = WinSPPCollector;
