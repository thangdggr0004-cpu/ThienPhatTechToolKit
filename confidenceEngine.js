const { calculate, getConfidenceLevel } = require('./confidenceCalculator.js');
const { getExplanation } = require('./confidenceExplanation.js');

/**
 * @typedef {import('./types').DecisionResult} DecisionResult
 * @typedef {import('./types').EvidenceMatrix} EvidenceMatrix
 * @typedef {import('./types').ConfidenceConfig} ConfidenceConfig
 * @typedef {import('./types').DecisionResultWithConfidence} DecisionResultWithConfidence
 */

/**
 * The main entry point for the Confidence Engine (Phase 2.4).
 * This is a pure function that takes decision results and enriches them with a confidence score.
 * The logic is 100% driven by the provided confidence.config.json.
 *
 * @param {DecisionResult[]} decisionResults - An array of decision results from the Decision Engine.
 * @param {EvidenceMatrix} evidenceMatrix - The full evidence matrix used for the decisions.
 * @param {ConfidenceConfig} config - The configuration object that drives the confidence calculation.
 * @returns {{success: boolean, results: DecisionResultWithConfidence[], error?: object}} - An object containing the success status and the array of enriched results.
 */
function runConfidenceEngine(decisionResults, evidenceMatrix, config) {
  if (!decisionResults || !evidenceMatrix || !config) {
    return {
      success: false,
      results: [],
      error: { code: 'MISSING_INPUTS', message: 'Confidence Engine requires decisionResults, evidenceMatrix, and config.' }
    };
  }

  try {
    const resultsWithConfidence = decisionResults.map(decision => {
      const { score, trace } = calculate(decision, evidenceMatrix, config);
      const level = getConfidenceLevel(score, config.levels);
      const explanation = getExplanation(trace);

      // Create a new object that includes all original decision properties
      // and adds the new confidence-related fields.
      const result = {
        ...decision,
        confidence: {
          score: parseFloat(score.toFixed(4)),
          level,
          calculationTrace: trace,
          explanation,
        }
      };
      
      return result;
    });

    return {
      success: true,
      results: resultsWithConfidence
    };

  } catch (e) {
    return {
      success: false,
      results: [],
      error: { code: 'CONFIDENCE_CALCULATION_FAILED', message: e.message }
    };
  }
}

module.exports = { runConfidenceEngine };
