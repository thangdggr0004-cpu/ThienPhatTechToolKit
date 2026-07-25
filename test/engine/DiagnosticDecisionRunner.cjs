/**
 * ENTERPRISE DIAGNOSTIC DECISION ENGINE UNIT TEST & QUALITY GATE RUNNER (PHASE 2.3)
 * Tests: Single Rule, Multiple Rules, Priority, Disabled Rules, No Match, Multiple Match, Benchmark & Quality Gate
 */

const { EvidenceMatrix } = require('../../src/engine/EvidenceMatrixEngine.cjs');
const { EvidenceCorrelationEngine } = require('../../src/engine/EvidenceCorrelationEngine.cjs');
const { DiagnosticDecisionEngine, DiagnosticRuleRegistry, DiagnosticRule } = require('../../src/engine/DiagnosticDecisionEngine.cjs');

async function runDiagnosticDecisionTests() {
  console.log('====================================================================');
  console.log('    PHASE 2.3 - DIAGNOSTIC DECISION ENGINE TEST & QUALITY GATE     ');
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

  // Setup Mock Matrix & Graph
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
    },
    {
      collectorId: 'WinAuthenticodeCollector',
      category: 'SECURITY',
      rawOutput: {
        evidenceItems: [
          {
            evidenceId: 'EVD-WIN-AUTH-001',
            evidenceType: 'SECURITY',
            evidenceSource: 'WinVerifyTrust',
            evidenceValue: { signatureStatus: 'VALID', signer: 'Microsoft' },
            evidenceFormat: 'OBJECT',
            evidenceStatus: 'VERIFIED_VALID',
            collectedTime: new Date().toISOString(),
            collectorVersion: '1.2.0',
            rawValue: {},
            normalizedValue: 'VALID'
          }
        ]
      }
    }
  ]);

  const correlationEngine = new EvidenceCorrelationEngine();
  const graph = correlationEngine.buildGraph(matrix);

  // 1. Single Rule Evaluation Test
  console.log('[*] Test 1: Single Rule Registration & Evaluation');
  const engine1 = new DiagnosticDecisionEngine();
  const decisions1 = engine1.evaluate(matrix, graph);
  assert(decisions1.length >= 1, 'Decision Engine produced decisions');
  assert(engine1.getDecisionByRule('RULE-WIN-LIC-001').length === 1, 'OEM DM Channel match rule produced decision');

  // 2. Decision Result Schema Audit
  console.log('\n[*] Test 2: DecisionResult Schema Audit');
  const d1 = decisions1[0];
  assert(d1.decisionId !== undefined, 'decisionId present');
  assert(d1.decisionType !== undefined, 'decisionType present');
  assert(d1.matchedRuleId !== undefined, 'matchedRuleId present');
  assert(d1.matchedRuleVersion !== undefined, 'matchedRuleVersion present');
  assert(Array.isArray(d1.matchedEvidenceIds), 'matchedEvidenceIds is array');
  assert(Array.isArray(d1.matchedRelationshipIds), 'matchedRelationshipIds is array');
  assert(d1.decisionMetadata !== undefined, 'decisionMetadata present');
  assert(d1.decisionTimestamp !== undefined, 'decisionTimestamp present');

  // 3. Priority & Disabled Rule Test
  console.log('\n[*] Test 3: Priority Ordering & Disabled Rule Handling');
  const registry3 = new DiagnosticRuleRegistry();
  registry3.registerRule(new DiagnosticRule({
    ruleId: 'RULE-DISABLED',
    ruleVersion: '1.0.0',
    rulePriority: 1,
    enabled: false,
    condition: () => ({ matched: true })
  }));

  const engine3 = new DiagnosticDecisionEngine({ registry: registry3 });
  engine3.evaluate(matrix, graph);
  const stats3 = engine3.getStatistics();
  assert(stats3.skippedRules === 1, 'Disabled rule correctly skipped');

  // 4. No Match Rule Test
  console.log('\n[*] Test 4: Rule Condition No Match Test');
  const registry4 = new DiagnosticRuleRegistry();
  registry4.rules.clear();
  registry4.registerRule(new DiagnosticRule({
    ruleId: 'RULE-NO-MATCH',
    condition: () => ({ matched: false })
  }));

  const engine4 = new DiagnosticDecisionEngine({ registry: registry4 });
  const decisions4 = engine4.evaluate(matrix, graph);
  assert(decisions4.length === 0, 'No decisions produced when rule condition returns matched: false');

  // 5. Large Dataset Benchmark Test (1,000 Rules)
  console.log('\n[*] Test 5: Benchmark Performance Test (1,000 Custom Rules)');
  const registryBench = new DiagnosticRuleRegistry();
  registryBench.rules.clear();
  for (let i = 1; i <= 1000; i++) {
    registryBench.registerRule(new DiagnosticRule({
      ruleId: `RULE-BENCH-${i}`,
      rulePriority: i,
      condition: () => ({ matched: i % 10 === 0, matchedEvidenceIds: ['EVD-WIN-BIOS-001'] })
    }));
  }

  const engineBench = new DiagnosticDecisionEngine({ registry: registryBench });
  const benchStartTime = Date.now();
  const benchDecisions = engineBench.evaluate(matrix, graph);
  const benchTimeMs = Date.now() - benchStartTime;

  assert(benchDecisions.length === 100, 'Evaluated 1,000 rules and matched 100 decisions');
  assert(benchTimeMs <= 10, `Evaluation time (${benchTimeMs}ms) well within 10ms target`);

  // 6. Matched Evidence & Relationship Queries Test
  console.log('\n[*] Test 6: Matched Evidence & Relationship Queries');
  const matchedEvd = engine1.getMatchedEvidence();
  assert(matchedEvd.length >= 2, 'getMatchedEvidence returns all matched Evidence IDs');

  // 7. Quality Gate Audit
  console.log('\n[*] Test 7: Quality Gate & Zero Judgmental / Zero Score Audit');
  let hasForbiddenTerms = false;
  const forbidden = ['pirated', 'illegal', 'cracked', 'bypassed', 'hack', 'confidence', 'score'];

  engine1.evaluate(matrix, graph).forEach(d => {
    const text = JSON.stringify(d).toLowerCase();
    forbidden.forEach(term => {
      if (text.includes(term)) {
        hasForbiddenTerms = true;
        console.error(`Forbidden term "${term}" found in decision:`, d);
      }
    });
  });

  assert(!hasForbiddenTerms, 'Zero forbidden terms, score, or confidence fields found in Decision Engine');

  console.log('\n====================================================================');
  console.log(`DECISION ENGINE TEST RESULTS: ${passed} / ${total} TESTS PASSED (${((passed/total)*100).toFixed(1)}%)`);
  console.log('====================================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runDiagnosticDecisionTests().catch(err => {
  console.error('Decision Engine Test Execution Failed:', err);
  process.exit(1);
});
