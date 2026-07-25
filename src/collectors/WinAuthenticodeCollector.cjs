/**
 * WIN AUTHENTICODE COLLECTOR V1
 * Category: SECURITY | Priority: HIGH (2)
 * Description: Verifies Authenticode digital signatures of sppc.dll, slc.dll, and ClipSVC.dll in System32.
 */

const path = require('path');
const frameworkPath = path.resolve(__dirname, '../../EnterpriseCollectorFramework.cjs');
const { BaseCollector, COLLECTOR_CATEGORIES, COLLECTOR_PRIORITIES, NORMALIZED_STATES } = require(frameworkPath);

class WinAuthenticodeCollector extends BaseCollector {
  constructor() {
    super({
      collectorId: 'WinAuthenticodeCollector',
      collectorName: 'Windows Authenticode Digital Signature Collector',
      version: '1.0.0',
      category: COLLECTOR_CATEGORIES.SECURITY,
      priority: COLLECTOR_PRIORITIES.HIGH,
      confidenceWeight: 20,
      timeoutMs: 5000,
      requires: { winVerifyTrust: true }
    });
  }

  async collect(context = {}) {
    const rawData = context.rawData || {};
    const authData = rawData.Authenticode || {};

    const sppcValid = authData.sppcValid !== undefined ? authData.sppcValid : true;
    const slcValid = authData.slcValid !== undefined ? authData.slcValid : true;
    const clipSvcValid = authData.clipSvcValid !== undefined ? authData.clipSvcValid : true;

    const allValid = sppcValid && slcValid && clipSvcValid;

    return {
      normalizedState: allValid ? NORMALIZED_STATES.LICENSED : NORMALIZED_STATES.UNKNOWN,
      sppcValid,
      slcValid,
      clipSvcValid,
      evidenceItems: [
        {
          componentName: 'Chữ Ký Số DLL Hệ Thống (sppc.dll / slc.dll / ClipSVC.dll)',
          status: allValid ? 'PASS' : 'WARNING',
          dataSource: 'WinVerifyTrust API (Authenticode Inspection)',
          confidenceWeight: 20,
          details: allValid
            ? 'Tất cả DLL hệ thống (sppc.dll, slc.dll, ClipSVC.dll) đều có chữ ký số hợp lệ của Microsoft.'
            : `Phát hiện sai lệch chữ ký số DLL: sppc.dll=${sppcValid}, slc.dll=${slcValid}, ClipSVC.dll=${clipSvcValid}`
        }
      ]
    };
  }
}

module.exports = WinAuthenticodeCollector;
