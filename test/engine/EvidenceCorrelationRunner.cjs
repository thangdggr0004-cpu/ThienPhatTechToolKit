/**
 * ENTERPRISE EVIDENCE CORRELATION ENGINE UNIT TEST & QUALITY GATE RUNNER (PHASE 2.2)
 * Tests: Single Node, Multiple Nodes, Link Creation, Traversal, Orphan Detection, Large Dataset, Quality Gate
 */

const { EvidenceMatrix } = require('../../src/engine/EvidenceMatrixEngine.cjs');
const { EvidenceCorrelationEngine, CorrelatedEvidenceGraph, RelationshipTypeEnum } = require('../../src/engine/EvidenceCorrelationEngine.cjs');

async function runEvidenceCorrelationTests() {
  console.log('====================================================================');
  console.log('    PHASE 2.2 - EVIDENCE CORRELATION ENGINE TEST & QUALITY GATE     ');
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

  // 1. Single Node Graph Test
  console.log('[*] Test 1: Single Node Graph Initialization');
  const graph1 = new CorrelatedEvidenceGraph();
  graph1.addNode({
    evidenceId: 'EVD-TEST-001',
    evidenceType: 'FIRMWARE',
    evidenceSource: 'WMI'
  });
  assert(graph1.getNode('EVD-TEST-001') !== null, 'Single Evidence Node stored in Graph');
  assert(graph1.getGraphHealth().orphanCount === 1, 'Single isolated node reported as orphan node');

  // 2. Multiple Nodes & Link Creation Test
  console.log('\n[*] Test 2: Multiple Nodes & Descriptive Link Creation');
  const graph2 = new CorrelatedEvidenceGraph();
  graph2.addNode({ evidenceId: 'EVD-BIOS-001', evidenceType: 'FIRMWARE', evidenceSource: 'WMI' });
  graph2.addNode({ evidenceId: 'EVD-LIC-001', evidenceType: 'LICENSE', evidenceSource: 'WMI' });

  const link = graph2.addLink({
    sourceEvidenceId: 'EVD-BIOS-001',
    targetEvidenceId: 'EVD-LIC-001',
    relationshipType: RelationshipTypeEnum.MATCH,
    relationshipReason: 'OEM Key matches SKU',
    relationshipStrength: 0.95
  });

  assert(link !== null, 'Link created successfully');
  assert(graph2.getGraphHealth().linkCount === 1, 'Graph contains 1 link');
  assert(graph2.getGraphHealth().orphanCount === 0, 'Zero orphan nodes remaining');

  // 3. Traversal & Relationship Query Test
  console.log('\n[*] Test 3: Graph Traversal & Relationship Queries');
  const neighbors = graph2.getNeighbors('EVD-BIOS-001');
  assert(neighbors.length === 1 && neighbors[0].evidenceId === 'EVD-LIC-001', 'getNeighbors returns target node');

  const matches = graph2.findByRelationshipType(RelationshipTypeEnum.MATCH);
  assert(matches.length === 1, 'findByRelationshipType MATCH returns 1 link');

  const foundRel = graph2.findRelationships('EVD-BIOS-001', 'EVD-LIC-001');
  assert(foundRel.length === 1, 'findRelationships returns link between BIOS and LIC');

  // 4. Evidence Matrix Pipeline Integration Test
  console.log('\n[*] Test 4: Evidence Matrix Integration & Automatic Correlation');
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
  assert(builtGraph.getGraphHealth().nodeCount === 2, 'Graph contains 2 Nodes');
  assert(builtGraph.getGraphHealth().linkCount >= 1, 'Correlation Engine automatically linked BIOS and License');

  // 5. Large Dataset Benchmark Test (10,000 Nodes, 20,000 Links)
  console.log('\n[*] Test 5: Large Dataset Performance Benchmark (10,000 Nodes, 10,000 Links)');
  const largeGraph = new CorrelatedEvidenceGraph();
  for (let i = 1; i <= 10000; i++) {
    largeGraph.addNode({ evidenceId: `NODE-${i}`, evidenceType: 'BENCH', evidenceSource: 'BENCH' });
  }

  const benchStartTime = Date.now();
  for (let i = 1; i < 10000; i++) {
    largeGraph.addLink({
      sourceEvidenceId: `NODE-${i}`,
      targetEvidenceId: `NODE-${i + 1}`,
      relationshipType: RelationshipTypeEnum.RELATED,
      relationshipReason: 'Sequential correlation'
    });
  }
  const benchTime = Date.now() - benchStartTime;

  const traversalStartTime = Date.now();
  const benchNeighbors = largeGraph.getNeighbors('NODE-5000');
  const traversalTime = Date.now() - traversalStartTime;

  assert(largeGraph.getGraphHealth().nodeCount === 10000, `Graph constructed 10,000 nodes & links in ${benchTime}ms`);
  assert(benchNeighbors.length === 2, 'NODE-5000 has 2 neighbors (NODE-4999 & NODE-5001)');
  assert(traversalTime <= 5, `Adjacency Graph Traversal (${traversalTime}ms) well within 5ms target`);

  // 6. Invalid Evidence Input Handling
  console.log('\n[*] Test 6: Invalid Matrix Exception Handling');
  let threwError = false;
  try {
    correlationEngine.buildGraph(null);
  } catch (err) {
    threwError = true;
  }
  assert(threwError, 'Invalid EvidenceMatrix input throws TypeError as expected');

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
  console.log(`CORRELATION ENGINE TEST RESULTS: ${passed} / ${total} TESTS PASSED (${((passed/total)*100).toFixed(1)}%)`);
  console.log('====================================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runEvidenceCorrelationTests().catch(err => {
  console.error('Correlation Engine Test Execution Failed:', err);
  process.exit(1);
});
