/**
 * WINDOWS COLLECTOR FRAMEWORK TEST SUITE RUNNER
 * Verifies Phase 1 Architecture Foundation for Windows Module
 */

const path = require('path');
const frameworkPath = path.resolve(__dirname, '../../EnterpriseCollectorFramework.cjs');
const { CollectorRegistry, CollectorPipeline, COLLECTOR_PRIORITIES } = require(frameworkPath);

// Import all 8 Windows Collectors
const WinBIOSCollector = require('../../src/collectors/WinBIOSCollector.cjs');
const WinLicenseCollector = require('../../src/collectors/WinLicenseCollector.cjs');
const WinAuthenticodeCollector = require('../../src/collectors/WinAuthenticodeCollector.cjs');
const WinRegistryCollector = require('../../src/collectors/WinRegistryCollector.cjs');
const WinServiceCollector = require('../../src/collectors/WinServiceCollector.cjs');
const WinSPPCollector = require('../../src/collectors/WinSPPCollector.cjs');
const WinEventCollector = require('../../src/collectors/WinEventCollector.cjs');
const EnvironmentAssessmentCollector = require('../../src/collectors/EnvironmentAssessmentCollector.cjs');

async function runWindowsFrameworkTests() {
  console.log('====================================================================');
  console.log('       WINDOWS COLLECTOR FRAMEWORK V1 - TEST SUITE RUNNER           ');
  console.log('====================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✓ PASS - ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL - ${message}`);
    }
  }

  // 1. Registry & Instantiation
  console.log('[*] Testing 1: Registration of 8 Windows Collectors');
  const registry = new CollectorRegistry();

  const c1 = new WinBIOSCollector();
  const c2 = new WinLicenseCollector();
  const c3 = new WinAuthenticodeCollector();
  const c4 = new WinRegistryCollector();
  const c5 = new WinServiceCollector();
  const c6 = new WinSPPCollector();
  const c7 = new WinEventCollector();
  const c8 = new EnvironmentAssessmentCollector();

  registry.register(c1);
  registry.register(c2);
  registry.register(c3);
  registry.register(c4);
  registry.register(c5);
  registry.register(c6);
  registry.register(c7);
  registry.register(c8);

  assert(registry.getCollectors({ maxPriority: 999 }).length === 8, 'Registry holds exactly 8 registered Windows collectors');
  assert(registry.getCollector('WinBIOSCollector').priority === COLLECTOR_PRIORITIES.CRITICAL, 'WinBIOSCollector is Priority 1 (CRITICAL)');
  assert(registry.getCollector('WinLicenseCollector').priority === COLLECTOR_PRIORITIES.CRITICAL, 'WinLicenseCollector is Priority 1 (CRITICAL)');
  assert(registry.getCollector('EnvironmentAssessmentCollector').priority === COLLECTOR_PRIORITIES.LOW, 'EnvironmentAssessmentCollector is Priority 4 (LOW)');

  // 2. Priority Sorting
  console.log('\n[*] Testing 2: Priority Ordering (Priority 1 -> 4)');
  const sorted = registry.getCollectors();
  assert(sorted[0].priority <= sorted[sorted.length - 1].priority, 'Priority 1 collectors sorted before Priority 4');

  // 3. Pipeline Execution & Independence
  console.log('\n[*] Testing 3: Pipeline Execution & Collector Independence');
  const pipeline = new CollectorPipeline(registry);

  const mockContext = {
    rawData: {
      Windows: {
        HasOA3Key: true,
        OA3Key: 'ABC12',
        LicenseStatus: 1,
        Channel: 'OEM',
        Description: 'Windows 11 Pro OEM',
        PartialProductKey: '8HVX7'
      },
      Authenticode: { sppcValid: true, slcValid: true, clipSvcValid: true },
      System: { NoGenTicket: false, TSforgeTrace: false, PiratedFiles: [], SuspiciousTasks: [], SuspiciousServices: [], HostsRedirects: [], KMSEvents: [] },
      Services: { sppsvcActive: true, clipSvcActive: true, licenseManagerActive: true },
      SPP: { tokenStoreExists: true, tokenStoreSizeBytes: 154000, sppState: 'NORMAL' }
    }
  };

  const { results } = await pipeline.executePipeline(mockContext);
  assert(results.length === 8, 'Pipeline returned exactly 8 CollectorResult objects');
  assert(results.every(r => r.success === true), 'All 8 collectors executed successfully without errors');
  assert(results.every(r => r.rawOutput && r.rawOutput.evidenceItems && r.rawOutput.evidenceItems.length > 0), 'Every collector returned valid evidenceItems');

  // 4. Evidence Integrity (No Legal Decisions)
  console.log('\n[*] Testing 4: Evidence Integrity (No Legal Conclusions)');
  let hasIllegalTerms = false;
  results.forEach(r => {
    (r.rawOutput?.evidenceItems || []).forEach(item => {
      const details = (item.details || '').toLowerCase();
      if (details.includes('crack') || details.includes('pirated') || details.includes('illegal') || details.includes('hack')) {
        hasIllegalTerms = true;
      }
    });
  });
  assert(!hasIllegalTerms, 'Zero judgmental / illegal terms found in evidence details');

  console.log('\n====================================================================');
  console.log(`RESULTS: ${passed} / ${total} WINDOWS FRAMEWORK TESTS PASSED (${((passed/total)*100).toFixed(1)}%)`);
  console.log('====================================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runWindowsFrameworkTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
