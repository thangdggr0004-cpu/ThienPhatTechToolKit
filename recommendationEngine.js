/**
 * @typedef {import('./types').AssessmentResult} AssessmentResult
 * @typedef {import('./types').RecommendationConfig} RecommendationConfig
 * @typedef {import('./types').Recommendation} Recommendation
 */

/**
 * The main entry point for the Recommendation Engine (Phase 2.6).
 * This is a stateless function that generates recommendations based on the final assessment.
 * The logic is 100% driven by the provided recommendation.config.json.
 *
 * @param {AssessmentResult} assessment - The final assessment object from the Assessment Engine.
 * @param {RecommendationConfig} config - The configuration object that drives the recommendations.
 * @returns {{success: boolean, recommendations: Recommendation[], error?: object}} - An object containing the success status and the array of recommendations.
 */
function runRecommendationEngine(assessment, config) {
  if (!assessment || !config) {
    return {
      success: false,
      recommendations: [],
      error: { code: 'MISSING_INPUTS', message: 'Recommendation Engine requires assessment and config.' }
    };
  }

  try {
    const recommendations = [];
    const appliedRecommendationIds = new Set();

    const sortedRecs = [...config.recommendations].sort((a,b) => a.priority - b.priority);

    for (const rec of sortedRecs) {
      if (appliedRecommendationIds.has(rec.recommendationId)) continue;

      const condition = rec.if;
      let isMatched = false;

      if (condition.decisionType) {
        const matchingDecision = assessment.rawResults.find(r => r.decisionType === condition.decisionType);
        if (matchingDecision) {
            if (condition.confidenceLevel?.gte) {
                const levelMap = { "LOW": 1, "MEDIUM": 2, "HIGH": 3, "VERY_HIGH": 4 };
                if (levelMap[matchingDecision.confidence.level] >= levelMap[condition.confidenceLevel.gte]) {
                    isMatched = true;
                }
            } else {
                isMatched = true;
            }
        }
      } else if (condition.overallStatus) {
        if (assessment.overallStatus === condition.overallStatus) {
          isMatched = true;
        }
      }

      if (isMatched) {
        recommendations.push({
            ...rec.then,
            recommendationId: rec.recommendationId,
            priority: rec.priority
        });
        appliedRecommendationIds.add(rec.recommendationId);
      }
    }

    return {
      success: true,
      recommendations,
    };

  } catch (e) {
    return {
      success: false,
      recommendations: [],
      error: { code: 'RECOMMENDATION_GENERATION_FAILED', message: e.message }
    };
  }
}

module.exports = { runRecommendationEngine };
