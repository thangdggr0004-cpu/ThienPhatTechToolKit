/**
 * ENTERPRISE COLLECTOR FRAMEWORK TEST SUITE V1
 * Standalone verification runner using Synthetic Mock Collectors.
 * Tests 12 Framework Guarantees without requiring real Windows/Office runtime.
 */

const {
  BaseCollector,
  CollectorRegistry,
  CollectorPipeline,
  CollectorHealthMonitor,
  CollectorCapabilityManager,
  EvidenceNormalizer,
  COLLECTOR_CATEGORIES,
  COLLECTOR_PRIORITIES,
  NORMALIZED_STATES,
  CAPABILITY_DECISION
} = require('../../EnterpriseCollectorFramework.cjs');

// ============================================================================
// SYNTHETIC MOCK COLLECTORS
// ============================================================================

class SuccessCollector extends BaseCollector {
  constructor() {
    super({
      collectorId: 'SuccessCollector',
      collectorName: 'Synthetic Success Collector',
      category: COLLECTOR_CATEGORIES.LICENSE,
      priority: COLLECTOR_PRIORITIES.HIGH,
      confidenceWeight: 25,
      version: '1.0.0'
    });
  }

  async collect(context) {
    return {
      normalizedState: NORMALIZED_STATES.LICENSED,
      evidenceItems: [
        { componentName: 'Mock License', status: 'PASS', dataSource: 'WMI', confidenceWeight: 25, details: 'Valid Key' }
      ]
    };
  }
}

class CriticalSuccessCollector extends BaseCollector {
  constructor() {
    super({
      collectorId: 'CriticalSuccessCollector',
      collectorName: 'Critical Priority Collector',
      category: COLLECTOR_CATEGORIES.SECURITY,
      priority: COLLECTOR_PRIORITIES.CRITICAL,
      confidenceWeight: 30
    });
  }

  async collect(context) {
    return {
      normalizedState: NORMALIZED_STATES.LICENSED,
      evidenceItems: [
        { componentName: 'Authenticode DLL', status: 'PASS', dataSource: 'Win32', confidenceWeight: 30, details: 'Signed' }
      ]
    };
  }
}

class FailCollector extends BaseCollector {
  constructor() {
    super({
      collectorId: 'FailCollector',
      collectorName: 'Synthetic Fail Collector',
      category: COLLECTOR_CATEGORIES.FILESYSTEM,
      priority: COLLECTOR_PRIORITIES.MEDIUM,
      confidenceWeight: 20
    });
  }

  async collect(context) {
    return {
      normalizedState: NORMALIZED_STATES.UNLICENSED,
      evidenceItems: [
        { componentName: 'Tampered File', status: 'FAIL', dataSource: 'Filesystem', confidenceWeight: 20, details: 'DLL Mismatch' }
      ]
    };
  }
}

class ExceptionCollector extends BaseCollector {
  constructor() {
    super({
      collectorId: 'ExceptionCollector',
      collectorName: 'Synthetic Exception Throwing Collector',
      category: COLLECTOR_CATEGORIES.REGISTRY,
      priority: COLLECTOR_PRIORITIES.LOW
    });
  }

  async collect(context) {
    throw new Error('Synthetic internal crash during registry read!');
  }
}

class TimeoutCollector extends BaseCollector {
  constructor() {
    super({
      collectorId: 'TimeoutCollector',
      collectorName: 'Synthetic Timeout Collector',
      category: COLLECTOR_CATEGORIES.NETWORK,
      priority: COLLECTOR_PRIORITIES.LOW,
      timeoutMs: 100 // 100ms timeout for test speed
    });
  }

  async collect(context) {
    // Sleep 500ms to trigger 100ms timeout, using unref to not hold Node process open
    await new Promise(r => {
      const timer = setTimeout(r, 500);
      if (timer.unref) timer.unref();
    });
    return { normalizedState: NORMALIZED_STATES.LICENSED };
  }
}

class UnsupportedCollector extends BaseCollector {
  constructor() {
    super({
      collectorId: 'UnsupportedCollector',
      collectorName: 'Synthetic Unsupported Environment Collector',
      category: COLLECTOR_CATEGORIES.OFFICE,
      requires: { powershell: true, wmi: true },
      supportedEnvironment: { installType: 'MSI' } // Context will be ClickToRun
    });
  }

  async collect(context) {
    return { normalizedState: NORMALIZED_STATES.LICENSED };
  }
}

// ============================================================================
// TEST SUITE RUNNER (12 TEST AREAS)
// ============================================================================

async function runFrameworkTestSuite() {
  console.log('====================================================================');
  console.log('       ENTERPRISE COLLECTOR FRAMEWORK V1 - TEST SUITE RUNNER       ');
  console.log('====================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, testName) {
    totalTests++;
    if (condition) {
      console.log(`  ✓ PASS - ${testName}`);
      passedTests++;
    } else {
      console.log(`  ✖ FAIL - ${testName}`);
    }
  }

  // 1. Registry Test
  console.log('[*] Testing 1: CollectorRegistry Registration & Query');
  const registry = new CollectorRegistry();
  const successCol = new SuccessCollector();
  const critCol = new CriticalSuccessCollector();
  registry.register(successCol);
  registry.register(critCol);
  assert(registry.getCollector('SuccessCollector') !== null, 'Registry returns registered collector by ID');
  assert(registry.getCollectors().length === 2, 'Registry returns all active collectors');

  // 2. Priority Test
  console.log('\n[*] Testing 2: Priority Ordering (CRITICAL before HIGH)');
  const sorted = registry.getCollectors();
  assert(sorted[0].collectorId === 'CriticalSuccessCollector', 'CRITICAL priority collector runs before HIGH priority');

  // 3. Evidence Normalizer Test
  console.log('\n[*] Testing 3: EvidenceNormalizer Rules');
  assert(EvidenceNormalizer.normalizeActivationState(true) === 'LICENSED', 'Normalize boolean true -> LICENSED');
  assert(EvidenceNormalizer.normalizeActivationState('Office Activated LICENSED') === 'LICENSED', 'Normalize string "LICENSED" -> LICENSED');
  assert(EvidenceNormalizer.normalizeActivationState('NOT ACTIVATED') === 'UNLICENSED', 'Normalize string "NOT ACTIVATED" -> UNLICENSED');

  // 4. Capability Manager Test
  console.log('\n[*] Testing 4: CollectorCapabilityManager Evaluation');
  const unsuppCol = new UnsupportedCollector();
  const decisionRun = CollectorCapabilityManager.evaluateCapability(successCol, { installType: 'ClickToRun' });
  const decisionSkip = CollectorCapabilityManager.evaluateCapability(unsuppCol, { installType: 'ClickToRun' });
  assert(decisionRun === CAPABILITY_DECISION.RUN, 'Supported collector evaluates to RUN');
  assert(decisionSkip === CAPABILITY_DECISION.UNSUPPORTED, 'Unsupported environment collector evaluates to UNSUPPORTED');

  // 5. Skip Unsupported Test
  console.log('\n[*] Testing 5: Pipeline Skipping Unsupported Collectors');
  registry.register(unsuppCol);
  const healthMon = new CollectorHealthMonitor();
  const pipeline = new CollectorPipeline(registry, healthMon);
  const res1 = await pipeline.executePipeline({ installType: 'ClickToRun' });
  assert(res1.results.length === 2, 'Pipeline skips UnsupportedCollector silently without failure');

  // 6. Exception Isolation Test
  console.log('\n[*] Testing 6: Exception Isolation (Pipeline survives Collector Crash)');
  const excCol = new ExceptionCollector();
  registry.register(excCol);
  const res2 = await pipeline.executePipeline({ installType: 'ClickToRun' });
  assert(res2.results.length === 3, 'Pipeline executes subsequent collectors after an exception');
  const excResult = res2.results.find(r => r.collectorId === 'ExceptionCollector');
  assert(excResult.success === false, 'Crashing collector is marked success = false in Result');
  assert(excResult.errors.length > 0, 'Crashing collector error message captured in Result');

  // 7. Timeout Enforcement Test
  console.log('\n[*] Testing 7: Timeout Enforcement');
  const timeoutCol = new TimeoutCollector();
  registry.register(timeoutCol);
  const res3 = await pipeline.executePipeline({ installType: 'ClickToRun' });
  const timeoutResult = res3.results.find(r => r.collectorId === 'TimeoutCollector');
  assert(timeoutResult.success === false, 'Slow collector exceeding timeoutMs is terminated');
  assert(timeoutResult.errors[0].includes('timed out'), 'Timeout error message properly recorded');

  // 8. Health Monitor Test
  console.log('\n[*] Testing 8: CollectorHealthMonitor Tracking');
  const metrics = healthMon.getAllMetrics();
  assert(metrics['SuccessCollector'] !== undefined, 'Health monitor records metrics for SuccessCollector');
  assert(metrics['SuccessCollector'].successRatePercentage === 100, 'SuccessCollector shows 100% success rate');
  assert(metrics['ExceptionCollector'].failures > 0, 'ExceptionCollector failures recorded in health metrics');

  // 9. Metadata Validation Test
  console.log('\n[*] Testing 9: Collector Metadata Validation');
  assert(successCol.version === '1.0.0', 'Collector metadata version present');
  assert(successCol.canRunParallel === false, 'Collector metadata canRunParallel flag present');
  assert(successCol.timeoutMs === 5000, 'Collector metadata default timeoutMs present');

  // 10. Result Schema Validation Test
  console.log('\n[*] Testing 10: CollectorResult Schema Integrity');
  const successRes = res3.results.find(r => r.collectorId === 'SuccessCollector');
  assert(successRes.timestamp !== undefined, 'CollectorResult contains valid ISO timestamp');
  assert(successRes.executionTimeMs >= 0, 'CollectorResult contains executionTimeMs');

  // 11. Matrix Builder Integration Test
  console.log('\n[*] Testing 11: Pipeline Evidence Matrix Builder Integration');
  class MockMatrixBuilder {
    constructor() { this.items = []; }
    addEvidence(comp, status, src, weight, details) {
      this.items.push({ comp, status, src, weight, details });
    }
  }
  const mb = new MockMatrixBuilder();
  await pipeline.executePipeline({ installType: 'ClickToRun' }, mb);
  assert(mb.items.length > 0, 'Pipeline populates MatrixBuilder with evidence items');

  // 12. Framework Performance Test
  console.log('\n[*] Testing 12: Framework Performance (Fast Pipeline Execution)');
  const startTime = Date.now();
  await pipeline.executePipeline({ installType: 'ClickToRun' });
  const duration = Date.now() - startTime;
  assert(duration < 1000, `Full pipeline execution finished in ${duration}ms (< 1000ms target)`);

  // SUMMARY
  console.log('\n====================================================================');
  console.log(`RESULTS: ${passedTests} / ${totalTests} FRAMEWORK TESTS PASSED (${((passedTests/totalTests)*100).toFixed(1)}%)`);
  console.log('====================================================================');

  if (passedTests === totalTests) {
    console.log('🎉 ENTERPRISE COLLECTOR FRAMEWORK V1 VALIDATED 100%! ALL GUARANTEES MET!');
    process.exit(0);
  } else {
    console.log('✖ FRAMEWORK TEST SUITE FAILED!');
    process.exit(1);
  }
}

runFrameworkTestSuite().catch(err => {
  console.error('Fatal Test Runner Exception:', err);
  process.exit(1);
});
