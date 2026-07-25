/**
 * ENTERPRISE EVIDENCE MATRIX ENGINE V1.1 UNIT TEST & QUALITY GATE RUNNER (PHASE 2.1.1 HARDENING)
 * Tests: Duplicate Policy, Immutable Protection, Matrix Health Metrics, O(1) Indexing, Regression
 */

const { EvidenceMatrix, DuplicatePolicyEnum } = require('../../src/engine/EvidenceMatrixEngine.cjs');

async function runEvidenceMatrixHardeningTests() {
  console.log('====================================================================');
  console.log('   PHASE 2.1.1 - EVIDENCE MATRIX HARDENING TEST & QUALITY GATE      ');
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

  // 1. Single & Multiple Collector Test
  console.log('[*] Test 1: Collector Integration & Indexing');
  const matrix1 = new EvidenceMatrix();
  const mockResult1 = {
    collectorId: 'WinBIOSCollector',
    collectorName: 'Windows OA3 BIOS Key Collector',
    category: 'WINDOWS',
    success: true,
    rawOutput: {
      collectorName: 'Windows OA3 BIOS Key Collector',
      collectorVersion: '1.2.0',
      evidenceItems: [
        {
          evidenceId: 'EVD-WIN-BIOS-001',
          evidenceName: 'Firmware BIOS Metadata',
          evidenceType: 'FIRMWARE',
          evidenceSource: 'WMI (Win32_BIOS)',
          evidenceValue: { vendor: 'LENOVO' },
          evidenceFormat: 'OBJECT',
          evidenceStatus: 'DATA_PRESENT',
          collectedTime: new Date().toISOString(),
          collectorVersion: '1.2.0',
          rawValue: { vendor: 'LENOVO' },
          normalizedValue: 'LENOVO'
        }
      ]
    }
  };

  matrix1.addCollectorResult(mockResult1);
  assert(matrix1.getAllEvidence().length === 1, 'Matrix stores 1 EvidenceItem');
  assert(matrix1.getEvidenceById('EVD-WIN-BIOS-001') !== null, 'O(1) Lookup by ID works');

  // 2. Duplicate Evidence Policy Test (KEEP_FIRST, KEEP_LATEST, STRICT_REJECT)
  console.log('\n[*] Test 2: Explicit Duplicate Evidence Policy Audit');
  // KEEP_FIRST (Default)
  const matrixKeepFirst = new EvidenceMatrix({ duplicatePolicy: DuplicatePolicyEnum.KEEP_FIRST });
  matrixKeepFirst.addCollectorResult(mockResult1);
  matrixKeepFirst.addCollectorResult(mockResult1); // Duplicate
  assert(matrixKeepFirst.getMatrixHealth().duplicateCount === 1, 'KEEP_FIRST audits 1 duplicate event');

  // STRICT_REJECT
  const matrixStrict = new EvidenceMatrix({ duplicatePolicy: DuplicatePolicyEnum.STRICT_REJECT });
  let strictThrew = false;
  try {
    matrixStrict.addCollectorResult(mockResult1);
    matrixStrict.addCollectorResult(mockResult1);
  } catch (err) {
    strictThrew = true;
  }
  assert(strictThrew, 'STRICT_REJECT policy throws error on duplicate Evidence ID');

  // 3. Immutable Evidence Contract Test
  console.log('\n[*] Test 3: Immutable Evidence Protection Audit');
  const storedItem = matrix1.getEvidenceById('EVD-WIN-BIOS-001');
  let mutationFailed = false;
  try {
    storedItem.evidenceName = 'MUTATED_TITLE';
  } catch (err) {
    mutationFailed = true; // Throws error in strict mode
  }
  if (!mutationFailed) {
    mutationFailed = storedItem.evidenceName !== 'MUTATED_TITLE'; // Verify value didn't change
  }
  assert(mutationFailed, 'EvidenceItem inside Matrix is Immutable and protected against mutation');

  // 4. Matrix Health Metrics Test
  console.log('\n[*] Test 4: Comprehensive Matrix Health Metrics Audit');
  const health = matrix1.getMatrixHealth();
  assert(health.matrixVersion === '1.1.0', 'Matrix Health reports version 1.1.0');
  assert(health.integrityStatus === 'HEALTHY', 'Integrity Status is HEALTHY');
  assert(health.lastBuildTime !== undefined, 'Last build timestamp recorded');
  assert(health.collectorCoverage.registeredCount === 1, 'Collector coverage calculated accurately');

  // 5. Large Dataset Benchmark
  console.log('\n[*] Test 5: Large Dataset Performance Benchmark (10,000 Items)');
  const matrixBench = new EvidenceMatrix();
  const largeItems = [];
  for (let i = 1; i <= 10000; i++) {
    largeItems.push({
      evidenceId: `EVD-BENCH-${i}`,
      evidenceName: `Benchmark Evidence ${i}`,
      evidenceType: i % 2 === 0 ? 'SECURITY' : 'REGISTRY',
      evidenceSource: 'BenchmarkSource',
      evidenceValue: { index: i },
      evidenceFormat: 'OBJECT',
      evidenceStatus: 'DATA_PRESENT',
      collectedTime: new Date().toISOString(),
      collectorVersion: '1.2.0',
      rawValue: i,
      normalizedValue: `Bench_${i}`
    });
  }

  const startTime = Date.now();
  matrixBench.addCollectorResult({ collectorId: 'BenchCollector', rawOutput: { evidenceItems: largeItems } });
  const benchTime = Date.now() - startTime;

  const found = matrixBench.getEvidenceById('EVD-BENCH-5000');
  assert(matrixBench.getAllEvidence().length === 10000, `Matrix loaded 10,000 items in ${benchTime}ms`);
  assert(found !== null, 'Target item retrieved');

  // 6. Quality Gate Audit
  console.log('\n[*] Test 6: Quality Gate Integrity Audit');
  const integrity = matrixBench.validateIntegrity();
  assert(integrity.isValid === true, 'Matrix integrity check PASSED');
  assert(integrity.health.integrityStatus === 'HEALTHY', 'Health status is HEALTHY');

  console.log('\n====================================================================');
  console.log(`HARDENING TEST RESULTS: ${passed} / ${total} TESTS PASSED (${((passed/total)*100).toFixed(1)}%)`);
  console.log('====================================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runEvidenceMatrixHardeningTests().catch(err => {
  console.error('Hardening Test Execution Failed:', err);
  process.exit(1);
});
