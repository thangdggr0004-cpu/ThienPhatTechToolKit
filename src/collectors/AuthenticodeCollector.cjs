/**
 * AUTHENTICODE COLLECTOR V1
 * Category: SECURITY | Priority: HIGH
 * Description: Gathers System32 sppc.dll WinVerifyTrust digital signature verification.
 */

const path = require('path');
const frameworkPath = path.resolve(__dirname, '../../EnterpriseCollectorFramework.cjs');
const { BaseCollector, COLLECTOR_CATEGORIES, COLLECTOR_PRIORITIES, NORMALIZED_STATES } = require(frameworkPath);

class AuthenticodeCollector extends BaseCollector {
  constructor() {
    super({
      collectorId: 'AuthenticodeCollector',
      collectorName: 'System DLL Authenticode Signer Collector',
      version: '1.0.0',
      category: COLLECTOR_CATEGORIES.SECURITY,
      priority: COLLECTOR_PRIORITIES.HIGH,
      confidenceWeight: 25,
      requires: { winVerifyTrust: true }
    });
  }

  async collect(context = {}) {
    const rawData = context.rawData || {};
    const sysSppcAuthenticode = rawData.sysSppcAuthenticode || 'UNKNOWN';
    const sysSppcSigner = rawData.sysSppcSigner || '';

    const isAuthenticSppc = sysSppcAuthenticode === 'Valid' && sysSppcSigner && sysSppcSigner.includes('Microsoft Corporation');

    return {
      normalizedState: isAuthenticSppc ? NORMALIZED_STATES.LICENSED : NORMALIZED_STATES.UNKNOWN,
      sysSppcAuthenticode,
      sysSppcSigner,
      evidenceItems: [
        {
          componentName: 'Chữ Ký Số DLL Hệ Thống (sppc.dll)',
          status: isAuthenticSppc ? 'PASS' : 'FAIL',
          dataSource: 'Authenticode',
          confidenceWeight: 25,
          details: `Chữ ký: ${sysSppcAuthenticode} (${sysSppcSigner || 'Unsigned'})`
        }
      ]
    };
  }
}

module.exports = AuthenticodeCollector;
