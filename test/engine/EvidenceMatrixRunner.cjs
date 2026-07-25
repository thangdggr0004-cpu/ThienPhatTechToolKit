/**
 * ENTERPRISE EVIDENCE MATRIX ENGINE V1.0 UNIT TEST & QUALITY GATE RUNNER (PHASE 2.1)
 * Tests: Single Collector, Multiple Collectors, Duplicate IDs, Empty Collector, Large Dataset, Invalid Inputs
 */

const { EvidenceMatrix } = require('../../src/engine/EvidenceMatrixEngine.cjs');

async function runEvidenceMatrixTests() {
  console.log('====================================================================');
  console.log('    PHASE 2.1 - EVIDENCE MATRIX ENGINE UNIT TEST & QUALITY GATE     ');
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

  // 1. Single Collector Test
  console.log('[*] Test 1: Single Collector Evidence Addition & Indexing');
  const matrix1 = new EvidenceMatrix();
  const mockSingleCollectorResult = {
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
          evidenceName: 'Firmware BIOS / UEFI Metadata',
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

  matrix1.addCollectorResult(mockSingleCollectorResult);
  assert(matrix1.getAllEvidence().length === 1, 'Matrix holds exactly 1 EvidenceItem');
  assert(matrix1.getEvidenceById('EVD-WIN-BIOS-001') !== null, 'O(1) Lookup by Evidence ID returns correct item');
  assert(matrix1.getEvidenceByCollector('WinBIOSCollector').length === 1, 'Query by Collector ID returns 1 item');

  // 2. Multiple Collectors Test
  console.log('\n[*] Test 2: Multiple Collectors Integration');
  const matrix2 = new EvidenceMatrix();
  const mockResults = [
    mockSingleCollectorResult,
    {
      collectorId: 'WinLicenseCollector',
      collectorName: 'Windows WMI SoftwareLicensingProduct Collector',
      category: 'LICENSE',
      success: true,
      rawOutput: {
        evidenceItems: [
          {
            evidenceId: 'EVD-WIN-LIC-001',
            evidenceName: 'WMI SoftwareLicensingProduct State',
            evidenceType: 'LICENSE',
            evidenceSource: 'WMI (SoftwareLicensingProduct)',
            evidenceValue: { licenseStatus: 1 },
            evidenceFormat: 'OBJECT',
            evidenceStatus: 'DATA_PRESENT',
            collectedTime: new Date().toISOString(),
            collectorVersion: '1.2.0',
            rawValue: { licenseStatus: 1 },
            normalizedValue: 'Status: 1'
          }
        ]
      }
    }
  ];

  matrix2.addCollectorResults(mockResults);
  assert(matrix2.getAllEvidence().length === 2, 'Matrix holds 2 EvidenceItems from 2 Collectors');
  assert(matrix2.getEvidenceByCategory('FIRMWARE').length === 1, 'Query by Category FIRMWARE returns 1 item');
  assert(matrix2.getEvidenceByCategory('LICENSE').length === 1, 'Query by Category LICENSE returns 1 item');

  // 3. Duplicate Evidence ID Detection Test
  console.log('\n[*] Test 3: Duplicate Evidence ID Detection');
  const matrix3 = new EvidenceMatrix();
  matrix3.addCollectorResult(mockSingleCollectorResult);
  matrix3.addCollectorResult(mockSingleCollectorResult); // Add duplicate
  const stats3 = matrix3.getStatistics();
  assert(stats3.duplicateIdsDetectedCount === 1, 'Detected 1 duplicate Evidence ID correctly');

  // 4. Empty Collector Test
  console.log('\n[*] Test 4: Empty Collector Handling');
  const matrix4 = new EvidenceMatrix();
  matrix4.addCollectorResult({ collectorId: 'EmptyCollector', rawOutput: { evidenceItems: [] } });
  assert(matrix4.getAllEvidence().length === 0, 'Empty Collector result handled gracefully with 0 evidence items');

  // 5. Large Dataset Test (Performance & Indexing Benchmark)
  console.log('\n[*] Test 5: Large Dataset Performance Benchmark (10,000 Evidence Items)');
  const matrix5 = new EvidenceMatrix();
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

  const benchStartTime = Date.now();
  matrix5.addCollectorResult({ collectorId: 'BenchCollector', rawOutput: { evidenceItems: largeItems } });
  const benchExecTime = Date.now() - benchStartTime;

  const lookupStartTime = Date.now();
  const foundItem = matrix5.getEvidenceById('EVD-BENCH-9999');
  const lookupTimeMs = Date.now() - lookupStartTime;

  assert(matrix5.getAllEvidence().length === 10000, `Matrix stored 10,000 items in ${benchExecTime}ms`);
  assert(foundItem && foundItem.evidenceId === 'EVD-BENCH-9999', 'Target item found');
  assert(lookupTimeMs <= 5, `O(1) Lookup time (${lookupTimeMs}ms) well within 5ms target`);

  // 6. Invalid CollectorResult Handling Test
  console.log('\n[*] Test 6: Invalid CollectorResult Exception Handling');
  const matrix6 = new EvidenceMatrix();
  let threwError = false;
  try {
    matrix6.addCollectorResult(null);
  } catch (err) {
    threwError = true;
  }
  assert(threwError, 'Invalid CollectorResult input throws TypeError as expected');

  // 7. Quality Gate Audit
  console.log('\n[*] Test 7: Quality Gate & Schema Integrity Audit');
  const integrity = matrix5.validateIntegrity();
  assert(integrity.isValid === true, 'Matrix integrity check PASSED');
  assert(integrity.duplicateCount === 0, 'Zero unexpected duplicates in clean dataset');

  console.log('\n====================================================================');
  console.log(`EVIDENCE MATRIX TEST RESULTS: ${passed} / ${total} TESTS PASSED (${((passed/total)*100).toFixed(1)}%)`);
  console.log('====================================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runEvidenceMatrixTests().catch(err => {
  console.error('Evidence Matrix Test Execution Failed:', err);
  process.exit(1);
});
