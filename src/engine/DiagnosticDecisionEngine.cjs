/**
 * ENTERPRISE WINDOWS DIAGNOSTIC DECISION ENGINE V1.0 (PHASE 2.3)
 * Category: DIAGNOSTIC ENGINE | Module 3
 * Description: 100% Rule-Driven Decision Engine evaluating EvidenceMatrix and CorrelatedEvidenceGraph.
 * STRICTLY NO CONFIDENCE, NO ASSESSMENT, NO RECOMMENDATION, NO EXPLANATION.
 * NO HARDCODED BUSINESS LOGIC - 100% RULE DRIVEN VIA DiagnosticRuleRegistry & RulePacks.
 */

class DiagnosticRule {
  constructor(options = {}) {
    if (!options.ruleId || typeof options.condition !== 'function') {
      throw new TypeError('DiagnosticRule requires ruleId and condition function.');
    }

    this.ruleId = options.ruleId;
    this.ruleVersion = options.ruleVersion || '1.0.0';
    this.rulePriority = options.rulePriority !== undefined ? options.rulePriority : 5; // 1 (Highest) to 10 (Lowest)
    this.ruleCategory = options.ruleCategory || 'LICENSING';
    this.description = options.description || 'Enterprise Diagnostic Rule';
    this.condition = options.condition; // (matrix, graph) => { matched: boolean, matchedEvidenceIds: [], matchedRelationshipIds: [], metadata: {} }
    this.decisionType = options.decisionType || 'TECHNICAL_DECISION';
    this.enabled = options.enabled !== undefined ? options.enabled : true;
    this.ruleMetadata = Object.freeze(options.ruleMetadata || {});
  }
}

class DiagnosticRuleRegistry {
  constructor() {
    this.registryVersion = '1.0.0';
    this.rules = new Map();
    this._initializeDefaultRules();
  }

  _initializeDefaultRules() {
    // Default Rule 1: OEM DM License Channel Match
    this.registerRule(new DiagnosticRule({
      ruleId: 'RULE-WIN-LIC-001',
      ruleVersion: '1.0.0',
      rulePriority: 1,
      ruleCategory: 'LICENSING',
      description: 'Verifies OEM DM product key match between Firmware MSDM and WMI License',
      decisionType: 'OEM_DM_CHANNEL_MATCHED',
      condition: (matrix, graph) => {
        const biosItems = matrix.getEvidenceByCategory('FIRMWARE');
        const licItems = matrix.getEvidenceByCategory('LICENSE');
        if (biosItems.length === 0 || licItems.length === 0) return { matched: false };

        const biosVal = biosItems[0].evidenceValue || {};
        const licVal = licItems[0].evidenceValue || {};

        if (biosVal.msdmPresent && (licVal.productKeyChannel === 'OEM:DM' || biosVal.oemChannel === 'OEM:DM')) {
          const links = graph.findByRelationshipType('MATCH');
          return {
            matched: true,
            matchedEvidenceIds: [biosItems[0].evidenceId, licItems[0].evidenceId],
            matchedRelationshipIds: links.map(l => l.linkId),
            metadata: { channel: 'OEM:DM', partialKey: licVal.partialProductKey }
          };
        }
        return { matched: false };
      }
    }));

    // Default Rule 2: Authenticode System DLL Integrity Verified
    this.registerRule(new DiagnosticRule({
      ruleId: 'RULE-WIN-SEC-001',
      ruleVersion: '1.0.0',
      rulePriority: 2,
      ruleCategory: 'SECURITY',
      description: 'Verifies system licensing DLL WinVerifyTrust digital signatures',
      decisionType: 'AUTHENTICODE_DLL_SIGNATURES_VERIFIED',
      condition: (matrix, graph) => {
        const authItems = matrix.getEvidenceByCategory('SECURITY');
        if (authItems.length === 0) return { matched: false };

        const authVal = authItems[0].evidenceValue || {};
        if (authVal.signatureStatus === 'VALID' || authVal.signatureStatus === 'VERIFIED_VALID') {
          return {
            matched: true,
            matchedEvidenceIds: [authItems[0].evidenceId],
            matchedRelationshipIds: [],
            metadata: { signer: authVal.signer, companyName: authVal.companyName }
          };
        }
        return { matched: false };
      }
    }));

    // Default Rule 3: Licensing Services Active State
    this.registerRule(new DiagnosticRule({
      ruleId: 'RULE-WIN-SVC-001',
      ruleVersion: '1.0.0',
      rulePriority: 3,
      ruleCategory: 'SERVICE',
      description: 'Verifies status of sppsvc, ClipSVC, and LicenseManager services',
      decisionType: 'LICENSING_SERVICES_ACTIVE',
      condition: (matrix, graph) => {
        const svcItems = matrix.getEvidenceByCategory('SERVICE');
        if (svcItems.length === 0) return { matched: false };

        const matchedIds = svcItems.map(s => s.evidenceId);
        const allActive = svcItems.every(s => (s.evidenceValue?.currentState === 'RUNNING' || s.evidenceStatus === 'DATA_PRESENT'));

        if (allActive) {
          return {
            matched: true,
            matchedEvidenceIds: matchedIds,
            matchedRelationshipIds: [],
            metadata: { serviceCount: svcItems.length }
          };
        }
        return { matched: false };
      }
    }));
  }

  registerRule(rule) {
    if (!(rule instanceof DiagnosticRule)) {
      throw new TypeError('Must be an instance of DiagnosticRule.');
    }
    this.rules.set(rule.ruleId, rule);
  }

  getRule(ruleId) {
    return this.rules.get(ruleId) || null;
  }

  getAllRules() {
    return Array.from(this.rules.values()).sort((a, b) => a.rulePriority - b.rulePriority);
  }
}

class DiagnosticDecisionEngine {
  constructor(options = {}) {
    this.engineVersion = '1.0.0';
    this.registry = options.registry || new DiagnosticRuleRegistry();
    this.decisions = new Map(); // Map<decisionId, DecisionResult>
    this.lastEvaluationStats = null;
  }

  /**
   * Evaluates EvidenceMatrix and CorrelatedEvidenceGraph against RuleRegistry
   * @param {EvidenceMatrix} evidenceMatrix - Phase 2.1 EvidenceMatrix
   * @param {CorrelatedEvidenceGraph} correlatedGraph - Phase 2.2 CorrelatedEvidenceGraph
   */
  evaluate(evidenceMatrix, correlatedGraph) {
    if (!evidenceMatrix || !correlatedGraph) {
      throw new TypeError('Both EvidenceMatrix and CorrelatedEvidenceGraph are required for evaluation.');
    }

    const startTime = Date.now();
    this.decisions.clear();

    const rules = this.registry.getAllRules();
    let executedRules = 0;
    let matchedRules = 0;
    let skippedRules = 0;

    for (const rule of rules) {
      if (!rule.enabled) {
        skippedRules++;
        continue;
      }

      executedRules++;

      try {
        const matchResult = rule.condition(evidenceMatrix, correlatedGraph);

        if (matchResult && matchResult.matched) {
          matchedRules++;

          const decisionId = `DECISION-${rule.ruleId}-${this.decisions.size + 1}`;
          const decisionResult = Object.freeze({
            decisionId,
            decisionType: rule.decisionType,
            matchedRuleId: rule.ruleId,
            matchedRuleVersion: rule.ruleVersion,
            matchedEvidenceIds: Object.freeze(matchResult.matchedEvidenceIds || []),
            matchedRelationshipIds: Object.freeze(matchResult.matchedRelationshipIds || []),
            decisionMetadata: Object.freeze({ ...rule.ruleMetadata, ...(matchResult.metadata || {}) }),
            decisionTimestamp: new Date().toISOString()
          });

          this.decisions.set(decisionId, decisionResult);
        }
      } catch (err) {
        console.error(`Rule evaluation error in [${rule.ruleId}]:`, err);
      }
    }

    const executionTimeMs = Date.now() - startTime;

    this.lastEvaluationStats = Object.freeze({
      engineVersion: this.engineVersion,
      ruleCount: rules.length,
      executedRules,
      matchedRules,
      skippedRules,
      executionTimeMs,
      decisionCount: this.decisions.size,
      timestamp: new Date().toISOString()
    });

    return Array.from(this.decisions.values());
  }

  /** Evaluates a single specific rule by Rule ID */
  evaluateRule(ruleId, evidenceMatrix, correlatedGraph) {
    const rule = this.registry.getRule(ruleId);
    if (!rule || !rule.enabled) return null;

    const matchResult = rule.condition(evidenceMatrix, correlatedGraph);
    if (!matchResult || !matchResult.matched) return null;

    return Object.freeze({
      decisionId: `DECISION-${rule.ruleId}-SINGLE`,
      decisionType: rule.decisionType,
      matchedRuleId: rule.ruleId,
      matchedRuleVersion: rule.ruleVersion,
      matchedEvidenceIds: Object.freeze(matchResult.matchedEvidenceIds || []),
      matchedRelationshipIds: Object.freeze(matchResult.matchedRelationshipIds || []),
      decisionMetadata: Object.freeze({ ...rule.ruleMetadata, ...(matchResult.metadata || {}) }),
      decisionTimestamp: new Date().toISOString()
    });
  }

  /** Gets decision by Decision ID */
  getDecision(decisionId) {
    return this.decisions.get(decisionId) || null;
  }

  /** Gets decisions produced by a specific Rule ID */
  getDecisionByRule(ruleId) {
    return Array.from(this.decisions.values()).filter(d => d.matchedRuleId === ruleId);
  }

  /** Gets all matched Evidence IDs across all evaluated decisions */
  getMatchedEvidence() {
    const ids = new Set();
    for (const d of this.decisions.values()) {
      d.matchedEvidenceIds.forEach(id => ids.add(id));
    }
    return Array.from(ids);
  }

  /** Gets all matched Relationship IDs across all evaluated decisions */
  getMatchedRelationships() {
    const ids = new Set();
    for (const d of this.decisions.values()) {
      d.matchedRelationshipIds.forEach(id => ids.add(id));
    }
    return Array.from(ids);
  }

  /** Gets evaluation statistics */
  getStatistics() {
    return this.lastEvaluationStats || {
      engineVersion: this.engineVersion,
      ruleCount: this.registry.getAllRules().length,
      executedRules: 0,
      matchedRules: 0,
      skippedRules: 0,
      executionTimeMs: 0,
      decisionCount: 0
    };
  }
}

module.exports = { DiagnosticDecisionEngine, DiagnosticRuleRegistry, DiagnosticRule };
