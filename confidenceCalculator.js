/**
 * @typedef {import('./types').DecisionResult} DecisionResult
 * @typedef {import('./types').EvidenceMatrix} EvidenceMatrix
 * @typedef {import('./types').ConfidenceConfig} ConfidenceConfig
 * @typedef {import('./types').CalculationTrace} CalculationTrace
 */

/**
 * Checks if a condition object from the config matches the given decision and evidence.
 * @param {object} condition - The condition from the config file (e.g., { "decisionType": "PIRACY_TOOL_DETECTED" }).
 * @param {DecisionResult} decision - The decision result being evaluated.
 * @param {EvidenceMatrix} evidenceMatrix - The evidence matrix.
 * @returns {boolean} - True if the condition matches, false otherwise.
 */
function conditionMatches(condition, decision, evidenceMatrix) {
  return Object.entries(condition).every(([key, value]) => {
    if (key === 'decisionType') {
      return decision.decisionType === value;
    }
    if (key === 'matchedEvidenceCount') {
      return value.gt !== undefined && decision.matchedEvidenceIds.length > value.gt;
    }
    if (key === 'matchedRelationshipCount') {
        return value.gt !== undefined && decision.matchedRelationshipIds.length > value.gt;
    }
    if (key === 'evidenceSource') {
        return decision.matchedEvidenceIds.some(id => {
            const evidence = evidenceMatrix.getEvidenceById(id);
            return evidence && evidence.evidenceSource === value;
        });
    }
    return false;
  });
}

/**
 * Calculates the confidence score for a single decision.
 * This is the core logic that interprets the confidence.config.json.
 * @param {DecisionResult} decision - The decision to calculate confidence for.
 * @param {EvidenceMatrix} evidenceMatrix - The full evidence matrix.
 * @param {ConfidenceConfig} config - The confidence calculation configuration.
 * @returns {{score: number, trace: CalculationTrace[]}} - The calculated score and a trace of the steps.
 */
function calculate(decision, evidenceMatrix, config) {
  let score = config.baseConfidence || 0.5;
  const trace = [{
    step: 'Base Confidence',
    scoreBefore: 0,
    scoreAfter: score,
    explanation: `Started with base confidence of ${score}.`
  }];

  for (const factor of config.factors) {
    for (const adj of factor.adjustments) {
      if (conditionMatches(adj.if, decision, evidenceMatrix)) {
        const scoreBefore = score;
        let explanation = `Factor '${factor.factorId}' applied`;

        if (adj.then.weight) {
          score *= adj.then.weight;
          explanation += ` (weight: ${adj.then.weight})`;
        }
        if (adj.then.boost) {
          score += adj.then.boost;
          explanation += ` (boost: ${adj.then.boost})`;
        }

        // Clamp score between 0 and 1
        score = Math.max(0, Math.min(1, score));

        trace.push({
          step: factor.factorId,
          scoreBefore: parseFloat(scoreBefore.toFixed(4)),
          scoreAfter: parseFloat(score.toFixed(4)),
          explanation: explanation
        });
      }
    }
  }

  return { score, trace };
}

/**
 * Determines the confidence level string (e.g., "HIGH") based on a score.
 * @param {number} score - The confidence score (0-1).
 * @param {Array<{level: string, threshold: number}>} levels - The levels from the config.
 * @returns {string} - The calculated confidence level.
 */
function getConfidenceLevel(score, levels) {
  const sortedLevels = [...levels].sort((a, b) => b.threshold - a.threshold);
  for (const level of sortedLevels) {
    if (score >= level.threshold) {
      return level.level;
    }
  }
  return sortedLevels[sortedLevels.length - 1]?.level || 'UNDEFINED';
}

module.exports = { calculate, getConfidenceLevel };
