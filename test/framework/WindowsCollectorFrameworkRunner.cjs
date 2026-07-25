/**
 * WINDOWS COLLECTOR FRAMEWORK V1.2 TEST SUITE RUNNER
 * Verifies Phase 1.2 Enterprise Data Model & Evidence Schema Standardization for Windows Module
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
  console.log('  WINDOWS COLLECTOR FRAMEWORK V1.2 - ENTERPRISE DATA MODEL TEST SUITE');
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
  console.log('[*] Test Section 1: Registration of 8 Windows Collectors');
  const registry = new CollectorRegistry();

  const collectors = [
    new WinBIOSCollector(),
    new WinLicenseCollector(),
    new WinAuthenticodeCollector(),
    new WinRegistryCollector(),
    new WinServiceCollector(),
    new WinSPPCollector(),
    new WinEventCollector(),
    new EnvironmentAssessmentCollector()
  ];

  collectors.forEach(c => registry.register(c));

  assert(registry.getCollectors({ maxPriority: 999 }).length === 8, 'Registry holds exactly 8 registered Windows collectors');
  assert(registry.getCollector('WinBIOSCollector').priority === COLLECTOR_PRIORITIES.CRITICAL, 'WinBIOSCollector is Priority 1 (CRITICAL)');
  assert(registry.getCollector('EnvironmentAssessmentCollector').priority === COLLECTOR_PRIORITIES.LOW, 'EnvironmentAssessmentCollector is Priority 4 (LOW)');

  // 2. Metadata Audit (Yêu cầu 4)
  console.log('\n[*] Test Section 2: Collector Metadata Audit (Yêu cầu 4)');
  let metadataValid = true;
  collectors.forEach(c => {
    const meta = c.metadata;
    if (!meta || !meta.collectorName || meta.collectorVersion !== '1.2.0' || !meta.author || !meta.description ||
        !meta.category || meta.priority === undefined || meta.executionMode !== 'READ_ONLY' ||
        meta.readOnly !== true || !Array.isArray(meta.dependencies) || !meta.capability || !Array.isArray(meta.supportedWindowsVersions)) {
      metadataValid = false;
      console.error(`Missing or invalid metadata fields in ${c.collectorId}`);
    }
  });
  assert(metadataValid, 'All 8 Collectors contain 100% required Enterprise metadata fields (Version 1.2.0)');

  // 3. Priority Sorting
  console.log('\n[*] Test Section 3: Priority Ordering (Priority 1 -> 4)');
  const sorted = registry.getCollectors();
  assert(sorted[0].priority <= sorted[sorted.length - 1].priority, 'Priority 1 collectors sorted before Priority 4');

  // 4. Pipeline Execution & Independence (Yêu cầu 14)
  console.log('\n[*] Test Section 4: Pipeline Execution & Collector Independence');
  const pipeline = new CollectorPipeline(registry);

  const mockContext = {
    rawData: {
      Windows: {
        HasOA3Key: true,
        OA3Key: 'ABC12',
        LicenseStatus: 1,
        Channel: 'OEM:DM',
        Description: 'Windows 11 Pro OEM',
        PartialProductKey: '8HVX7',
        Edition: 'Professional'
      },
      BIOS: { msdmPresent: true, vendor: 'LENOVO', manufacturer: 'LENOVO', oemEdition: 'Professional' },
      Authenticode: { sppcValid: true, slcValid: true, clipSvcValid: true },
      System: { NoGenTicket: false, TSforgeTrace: false, NonStandardFiles: [], ScheduledTasks: [], CustomServices: [], HostsRedirects: [], KMSEvents: [] },
      Services: { sppsvcActive: true, clipSvcActive: true, licenseManagerActive: true },
      SPP: { tokenStoreExists: true, tokenStoreSizeBytes: 154000, sppState: 'NORMAL' }
    }
  };

  const { results } = await pipeline.executePipeline(mockContext);
  assert(results.length === 8, 'Pipeline executed all 8 collectors');
  assert(results.every(r => r.success === true), 'All 8 collectors executed successfully without runtime exceptions');

  // 5. Standardized Evidence Item Schema Audit (Yêu cầu 3)
  console.log('\n[*] Test Section 5: Enterprise Evidence Schema Audit (Yêu cầu 3)');
  let evidenceSchemaValid = true;
  results.forEach(r => {
    const raw = r.rawOutput || {};
    (raw.evidenceItems || []).forEach(item => {
      if (!item.evidenceId || !item.evidenceName || !item.evidenceType || !item.evidenceSource ||
          item.evidenceValue === undefined || !item.evidenceFormat || !item.evidenceStatus ||
          !item.collectedTime || item.collectorVersion !== '1.2.0' || item.rawValue === undefined ||
          item.normalizedValue === undefined) {
        evidenceSchemaValid = false;
        console.error(`Invalid evidence item schema in ${r.collectorId}:`, item);
      }
    });
  });
  assert(evidenceSchemaValid, '100% Evidence Items adhere to Enterprise Evidence Item Schema');

  // 6. Zero PASS / WARNING / FAIL in Evidence Items (Yêu cầu 1 & 2)
  console.log('\n[*] Test Section 6: Zero PASS/WARNING/FAIL in Evidence Items Verification (Yêu cầu 1 & 2)');
  let hasJudgmentalStatus = false;
  results.forEach(r => {
    const raw = r.rawOutput || {};
    (raw.evidenceItems || []).forEach(item => {
      if (item.status === 'PASS' || item.status === 'WARNING' || item.status === 'FAIL' ||
          item.evidenceStatus === 'PASS' || item.evidenceStatus === 'WARNING' || item.evidenceStatus === 'FAIL') {
        hasJudgmentalStatus = true;
        console.error(`Found PASS/WARNING/FAIL in evidence item of ${r.collectorId}`);
      }
    });
  });
  assert(!hasJudgmentalStatus, 'Zero PASS/WARNING/FAIL status found in Evidence Items across all 8 Collectors');

  // 7. Zero Judgmental/Legal/Decision Terms Audit (Yêu cầu 12 & 13)
  console.log('\n[*] Test Section 7: Zero Judgmental/Legal/Decision Terms Audit (Yêu cầu 12 & 13)');
  let hasJudgmentalTerms = false;
  const forbiddenTerms = ['crack', 'pirated', 'illegal', 'hack', 'bypass', 'activator'];
  
  results.forEach(r => {
    const raw = r.rawOutput || {};
    (raw.evidenceItems || []).forEach(item => {
      const details = JSON.stringify(item).toLowerCase();
      forbiddenTerms.forEach(term => {
        if (details.includes(term)) {
          hasJudgmentalTerms = true;
          console.error(`Forbidden term "${term}" found in ${r.collectorId}`);
        }
      });
    });
  });
  assert(!hasJudgmentalTerms, 'Zero forbidden judgmental/illegal terms found in evidence details');

  console.log('\n====================================================================');
  console.log(`RESULTS: ${passed} / ${total} WINDOWS FRAMEWORK V1.2 TESTS PASSED (${((passed/total)*100).toFixed(1)}%)`);
  console.log('====================================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runWindowsFrameworkTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
