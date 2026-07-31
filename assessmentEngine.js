/**
 * @typedef {import('./types').DecisionResultWithConfidence} DecisionResultWithConfidence
 * @typedef {import('./types').AssessmentConfig} AssessmentConfig
 * @typedef {import('./types').AssessmentResult} AssessmentResult
 */

/**
 * The main entry point for the Assessment Engine (Phase 2.5).
 * This is a pure function that takes results from the Confidence Engine and produces a final assessment.
 * The logic is 100% driven by the provided assessment.config.json.
 *
 * @param {DecisionResultWithConfidence[]} confidenceResults - An array of decision results with confidence scores.
 * @param {AssessmentConfig} config - The configuration object that drives the assessment.
 * @returns {{success: boolean, assessment: AssessmentResult, error?: object}} - An object containing the success status and the final assessment.
 */
function runAssessmentEngine(confidenceResults, config) {
  if (!confidenceResults || !config) {
    return {
      success: false,
      assessment: null,
      error: { code: 'MISSING_INPUTS', message: 'Assessment Engine requires confidenceResults and config.' }
    };
  }

  try {
    // 1. Calculate Overall Score
    let overallScore = config.scoring.baseScore || 100;
    const scoreDeductions = [];

    for (const deductionRule of config.scoring.deductions) {
      for (const result of confidenceResults) {
        if (result.decisionType === deductionRule.if.decisionType) {
          let pointsToDeduct = deductionRule.points;
          if (deductionRule.weightedByConfidence) {
            pointsToDeduct *= result.confidence.score;
          }
          overallScore -= pointsToDeduct;
          scoreDeductions.push({
              deductedFor: result.decisionType,
              points: parseFloat(pointsToDeduct.toFixed(2))
          });
        }
      }
    }
    overallScore = Math.max(0, Math.min(100, overallScore));

    // 2. Determine Overall Status
    let overallStatus = 'UNKNOWN';
    const sortedStatusRules = [...config.overallStatusRules].sort((a,b) => a.priority - b.priority);

    for (const rule of sortedStatusRules) {
        const check = (result) => {
            const levelMap = { "LOW": 1, "MEDIUM": 2, "HIGH": 3, "VERY_HIGH": 4 };
            if (rule.if.decisionType && result.decisionType !== rule.if.decisionType) return false;
            if (rule.if.confidenceLevel?.gte) {
                return levelMap[result.confidence.level] >= levelMap[rule.if.confidenceLevel.gte];
            }
            return true;
        }
        if(confidenceResults.some(check)) {
            overallStatus = rule.thenSet;
            break; // First rule (by priority) that matches determines the status
        }
    }
     // Fallback status based on score if no specific rule hit
    if (overallStatus === 'UNKNOWN') {
        if (overallScore >= 90) overallStatus = 'HEALTHY';
        else if (overallScore >= 70) overallStatus = 'GOOD';
        else if (overallScore >= 50) overallStatus = 'NEEDS_ATTENTION';
        else overallStatus = 'POOR';
    }


    // 3. Group Decisions
    const groupedDecisions = {};
    for (const group of config.groups) {
        groupedDecisions[group.groupId] = {
            displayName: group.displayName,
            decisions: confidenceResults.filter(r => group.decisionTypes.includes(r.decisionType))
        };
    }


    const assessment = {
      assessmentId: `ASMT-${Date.now()}`,
      timestamp: new Date().toISOString(),
      overallScore: parseFloat(overallScore.toFixed(2)),
      overallStatus,
      scoring: {
        baseScore: config.scoring.baseScore,
        deductions: scoreDeductions,
      },
      groups: groupedDecisions,
      rawResults: confidenceResults,
    };

    return {
      success: true,
      assessment: assessment,
    };

  } catch (e) {
    return {
      success: false,
      assessment: null,
      error: { code: 'ASSESSMENT_CALCULATION_FAILED', message: e.message }
    };
  }
}

module.exports = { runAssessmentEngine };
