/**
 * ENTERPRISE EVIDENCE CORRELATION ENGINE UNIT TEST & QUALITY GATE RUNNER (PHASE 2.2.1 HARDENING)
 * Tests: Relationship Registry, Correlation Trace Traversal, Max Hops, Large Dataset Benchmark, Quality Gate
 */

const { EvidenceMatrix } = require('../../src/engine/EvidenceMatrixEngine.cjs');
const { EvidenceCorrelationEngine, CorrelatedEvidenceGraph, RelationshipRegistry, RelationshipTypeEnum } = require('../../src/engine/EvidenceCorrelationEngine.cjs');

async function runEvidenceCorrelationHardeningTests() {
  console.log('====================================================================');
  console.log('  PHASE 2.2.1 - EVIDENCE CORRELATION HARDENING TEST & QUALITY GATE   ');
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

  // 1. Relationship Registry Audit
  console.log('[*] Test 1: RelationshipRegistry Definitions Audit');
  const registry = new RelationshipRegistry();
  assert(registry.getDefinition(RelationshipTypeEnum.MATCH) !== null, 'MATCH definition exists in Registry');
  assert(registry.getDefinition(RelationshipTypeEnum.DEPENDENCY).direction === 'DIRECTIONAL', 'DEPENDENCY is DIRECTIONAL');
  assert(registry.getDefinition(RelationshipTypeEnum.MATCH).direction === 'SYMMETRIC', 'MATCH is SYMMETRIC');

  // 2. Unregistered Link Rejection Test
  console.log('\n[*] Test 2: Unregistered Relationship Link Validation');
  const graphInvalid = new CorrelatedEvidenceGraph({ registry });
  graphInvalid.addNode({ evidenceId: 'NODE-A', evidenceType: 'FIRMWARE' });
  graphInvalid.addNode({ evidenceId: 'NODE-B', evidenceType: 'LICENSE' });
  
  let rejected = false;
  try {
    graphInvalid.addLink({
      sourceEvidenceId: 'NODE-A',
      targetEvidenceId: 'NODE-B',
      relationshipType: 'INVALID_CUSTOM_RELATIONSHIP'
    });
  } catch (err) {
    rejected = true;
  }
  assert(rejected, 'Unregistered relationship type rejected by Registry validation');

  // 3. Correlation Trace BFS Path Traversal Test
  console.log('\n[*] Test 3: Correlation Trace BFS Path Traversal Audit');
  const graphTrace = new CorrelatedEvidenceGraph({ registry });
  graphTrace.addNode({ evidenceId: 'NODE-1', evidenceType: 'FIRMWARE' });
  graphTrace.addNode({ evidenceId: 'NODE-2', evidenceType: 'LICENSE' });
  graphTrace.addNode({ evidenceId: 'NODE-3', evidenceType: 'SECURITY' });

  graphTrace.addLink({ sourceEvidenceId: 'NODE-1', targetEvidenceId: 'NODE-2', relationshipType: RelationshipTypeEnum.MATCH });
  graphTrace.addLink({ sourceEvidenceId: 'NODE-2', targetEvidenceId: 'NODE-3', relationshipType: RelationshipTypeEnum.DEPENDENCY });

  const trace = graphTrace.tracePath('NODE-1', 'NODE-3', 5);
  assert(trace.traceMetadata.reachedTarget === true, 'Path tracing reached target NODE-3');
  assert(trace.hopCount === 2, 'Path tracing calculated exactly 2 hops');
  assert(trace.traversalPath.join('->') === 'NODE-1->NODE-2->NODE-3', 'Traversal path sequence recorded correctly');
  assert(trace.visitedNodes.length === 3, 'Recorded all 3 visited nodes');

  // 4. Max Hops Boundary Test
  console.log('\n[*] Test 4: Max Hops Boundary Enforcement');
  const traceRestricted = graphTrace.tracePath('NODE-1', 'NODE-3', 1); // Only 1 hop allowed
  assert(traceRestricted.traceMetadata.reachedTarget === false, 'ReachedTarget is false when maxHops exceeded');

  // 5. Evidence Matrix Engine & Correlation Integration Test
  console.log('\n[*] Test 5: Matrix Integration & Engine Auto-Correlation');
  const matrix = new EvidenceMatrix();
  matrix.addCollectorResults([
    {
      collectorId: 'WinBIOSCollector',
      category: 'WINDOWS',
      rawOutput: {
        evidenceItems: [
          {
            evidenceId: 'EVD-WIN-BIOS-001',
            evidenceType: 'FIRMWARE',
            evidenceSource: 'WMI',
            evidenceValue: { msdmPresent: true, oemChannel: 'OEM:DM', editionMatch: 'MATCH' },
            evidenceFormat: 'OBJECT',
            evidenceStatus: 'DATA_PRESENT',
            collectedTime: new Date().toISOString(),
            collectorVersion: '1.2.0',
            rawValue: {},
            normalizedValue: 'OEM:DM'
          }
        ]
      }
    },
    {
      collectorId: 'WinLicenseCollector',
      category: 'LICENSE',
      rawOutput: {
        evidenceItems: [
          {
            evidenceId: 'EVD-WIN-LIC-001',
            evidenceType: 'LICENSE',
            evidenceSource: 'WMI',
            evidenceValue: { productKeyChannel: 'OEM:DM', licenseStatus: 1 },
            evidenceFormat: 'OBJECT',
            evidenceStatus: 'DATA_PRESENT',
            collectedTime: new Date().toISOString(),
            collectorVersion: '1.2.0',
            rawValue: {},
            normalizedValue: 'Status 1'
          }
        ]
      }
    }
  ]);

  const correlationEngine = new EvidenceCorrelationEngine();
  const builtGraph = correlationEngine.buildGraph(matrix);
  assert(builtGraph.getGraphHealth().nodeCount === 2, 'Built graph with 2 nodes');
  assert(builtGraph.getGraphHealth().linkCount >= 1, 'Auto-correlated BIOS and License with Registry-validated link');

  // 6. Large Dataset Traversal Benchmark Test (10,000 Nodes)
  console.log('\n[*] Test 6: Large Dataset Path Traversal Benchmark (10,000 Nodes)');
  const largeGraph = new CorrelatedEvidenceGraph();
  for (let i = 1; i <= 10000; i++) {
    largeGraph.addNode({ evidenceId: `NODE-${i}`, evidenceType: 'BENCH', evidenceSource: 'BENCH' });
  }
  for (let i = 1; i < 1000; i++) {
    largeGraph.addLink({
      sourceEvidenceId: `NODE-${i}`,
      targetEvidenceId: `NODE-${i + 1}`,
      relationshipType: RelationshipTypeEnum.RELATED
    });
  }

  const benchStartTime = Date.now();
  const benchTrace = largeGraph.tracePath('NODE-1', 'NODE-50', 100);
  const benchTimeMs = Date.now() - benchStartTime;

  assert(benchTrace.traceMetadata.reachedTarget === true, 'Path traced from NODE-1 to NODE-50');
  assert(benchTrace.hopCount === 49, 'Traversed exactly 49 hops');
  assert(benchTimeMs <= 5, `Path Traversal execution time (${benchTimeMs}ms) well within 5ms target`);

  // 7. Quality Gate Audit
  console.log('\n[*] Test 7: Quality Gate & Zero Decision Audit');
  let hasDecisionOrScore = false;
  builtGraph.links.forEach(l => {
    if (l.decision !== undefined || l.score !== undefined || l.assessment !== undefined) {
      hasDecisionOrScore = true;
    }
  });
  assert(!hasDecisionOrScore, 'Zero Decision, Score, or Assessment fields in Graph Links');

  console.log('\n====================================================================');
  console.log(`HARDENING TEST RESULTS: ${passed} / ${total} TESTS PASSED (${((passed/total)*100).toFixed(1)}%)`);
  console.log('====================================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runEvidenceCorrelationHardeningTests().catch(err => {
  console.error('Correlation Hardening Test Execution Failed:', err);
  process.exit(1);
});
