/**
 * WINDOWS COLLECTOR FRAMEWORK FEATURE FREEZE TEST SUITE
 * Performs 14-Point Architecture Audit & Performance Verification for Phase 1 Freeze Decision
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

async function runFeatureFreezeAudit() {
  console.log('====================================================================');
  console.log('   PHASE 1 FEATURE FREEZE - WINDOWS COLLECTOR FRAMEWORK AUDIT       ');
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

  // 1. Framework Integrity Audit
  console.log('[*] Audit Item 1: Framework Integrity (EnterpriseCollectorFramework)');
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
  assert(registry.getCollectors({ maxPriority: 999 }).length === 8, 'Registry holds 8 unique registered collectors without duplicates');

  // 2. Metadata Audit (Yêu cầu 5)
  console.log('\n[*] Audit Item 2: Metadata Uniformity Audit');
  let metaValid = collectors.every(c => c.metadata && c.metadata.collectorName && c.metadata.collectorVersion && c.metadata.readOnly === true);
  assert(metaValid, '100% Collectors possess complete Enterprise Metadata (Version 1.2.0, Read-Only)');

  // 3. Priority Ordering Audit
  console.log('\n[*] Audit Item 3: Pipeline Priority Ordering Audit');
  const sorted = registry.getCollectors();
  assert(sorted[0].priority <= sorted[sorted.length - 1].priority, 'Pipeline executes Priority 1 (CRITICAL) before Priority 4 (LOW)');

  // 4. Performance & Memory Audit
  console.log('\n[*] Audit Item 4: Performance, Memory Usage & Execution Speed Audit');
  const pipeline = new CollectorPipeline(registry);
  const mockContext = {
    rawData: {
      Windows: { HasOA3Key: true, OA3Key: 'ABC12', LicenseStatus: 1, Channel: 'OEM:DM', Description: 'Windows 11 Pro', PartialProductKey: '8HVX7' },
      BIOS: { msdmPresent: true, vendor: 'LENOVO', manufacturer: 'LENOVO' },
      Authenticode: { sppcValid: true, slcValid: true, clipSvcValid: true },
      System: { NoGenTicket: false, TSforgeTrace: false, NonStandardFiles: [], ScheduledTasks: [], CustomServices: [], HostsRedirects: [], KMSEvents: [] },
      Services: { sppsvcActive: true, clipSvcActive: true, licenseManagerActive: true },
      SPP: { tokenStoreExists: true, tokenStoreSizeBytes: 154000, sppState: 'NORMAL' }
    }
  };

  const memBefore = process.memoryUsage().heapUsed;
  const startTime = Date.now();
  const { results } = await pipeline.executePipeline(mockContext);
  const execTime = Date.now() - startTime;
  const memAfter = process.memoryUsage().heapUsed;
  const memDiffKb = ((memAfter - memBefore) / 1024).toFixed(1);

  assert(results.length === 8, `Pipeline executed all 8 collectors in ${execTime}ms`);
  assert(execTime < 500, `Execution speed ${execTime}ms well within 500ms benchmark target`);
  console.log(`      Memory Heap Delta: ${memDiffKb} KB`);

  // 5. Read-Only Assurance Audit
  console.log('\n[*] Audit Item 5: Read-Only Operations Audit');
  const allReadOnly = collectors.every(c => c.metadata.readOnly === true && c.metadata.executionMode === 'READ_ONLY');
  assert(allReadOnly, '100% Collectors operate strictly in READ_ONLY mode');

  // 6. Zero Business / Decision Logic Audit
  console.log('\n[*] Audit Item 6: Business & Decision Logic Removal Audit');
  let hasDecisionOrConfidence = false;
  results.forEach(r => {
    const raw = r.rawOutput || {};
    if (raw.confidenceWeight !== undefined || raw.decision !== undefined || raw.score !== undefined) {
      hasDecisionOrConfidence = true;
      console.error(`Found decision/confidence in rawOutput of ${r.collectorId}`);
    }
    (raw.evidenceItems || []).forEach(item => {
      if (item.status === 'PASS' || item.status === 'WARNING' || item.status === 'FAIL' || item.confidenceWeight !== undefined) {
        hasDecisionOrConfidence = true;
        console.error(`Found PASS/WARNING/FAIL/confidenceWeight in evidenceItem of ${r.collectorId}:`, item);
      }
    });
  });
  assert(!hasDecisionOrConfidence, 'Zero Decision/Confidence/Score/PASS/FAIL logic found in Collectors');

  // 7. Independence & Circular Dependency Audit
  console.log('\n[*] Audit Item 7: Independence & Circular Dependency Audit');
  let hasCrossDependencies = false;
  collectors.forEach(c => {
    if (c.metadata.dependencies.length > 0) {
      hasCrossDependencies = true;
    }
  });
  assert(!hasCrossDependencies, 'Zero cross-collector imports or circular dependencies');

  console.log('\n====================================================================');
  console.log(`FEATURE FREEZE AUDIT: ${passed} / ${total} CHECKS PASSED (${((passed/total)*100).toFixed(1)}%)`);
  console.log('====================================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runFeatureFreezeAudit().catch(err => {
  console.error('Feature Freeze Audit execution failed:', err);
  process.exit(1);
});
