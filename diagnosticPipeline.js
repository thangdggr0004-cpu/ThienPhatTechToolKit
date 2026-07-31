const { runDecisionEngine } = require('./decision-engine/index.js');
const { runConfidenceEngine } = require('./confidence-engine/index.js');
const { loadAndValidateConfigurations } = require('./configurationProvider.js');
const { runAssessmentEngine } = require('./assessment-engine/index.js');
const { runRecommendationEngine } = require('./recommendationEngine.js');

/**
 * @typedef {import('./confidence-engine/types').EvidenceMatrix} EvidenceMatrix
 */

/**
 * The main composition root for the internal diagnostic pipeline.
 * It orchestrates the flow of data through the various diagnostic engines.
 * @param {EvidenceMatrix} evidenceMatrix The raw evidence collected.
 * @returns {object} The final assessment result or an error object.
 */
function runPipeline(evidenceMatrix) {
  // 1. Load and validate all necessary configurations.
  const { confidenceConfig, assessmentConfig, recommendationConfig, error: configError } = loadAndValidateConfigurations();
  if (configError) {
    console.error("Pipeline halted due to configuration error.", configError);
    return { success: false, error: configError };
  }

  // 2. Run Decision Engine (Phase 2.3)
  const decisionResults = runDecisionEngine({ evidenceMatrix, correlatedEvidenceGraph: {} });

  // 3. Run Confidence Engine (Phase 2.4)
  const confidenceResults = runConfidenceEngine(decisionResults, evidenceMatrix, confidenceConfig);
  if (!confidenceResults.success) {
    console.error("Pipeline halted during Confidence Engine execution.", confidenceResults.error);
    return confidenceResults;
  }

  // 4. Run Assessment Engine (Phase 2.5)
  const assessmentResult = runAssessmentEngine(confidenceResults.results, assessmentConfig);
  if (!assessmentResult.success) {
    console.error("Pipeline halted during Assessment Engine execution.", assessmentResult.error);
    return assessmentResult;
  }

  // 5. Run Recommendation Engine (Phase 2.6)
  const recommendationResult = runRecommendationEngine(assessmentResult.assessment, recommendationConfig);
  if (!recommendationResult.success) {
      // Non-critical failure, log it but return the assessment
      console.error("Recommendation Engine failed.", recommendationResult.error);
  }
  
  const finalReport = {
      ...assessmentResult,
      recommendations: recommendationResult.success ? recommendationResult.recommendations : [],
  };

  // 6. Log and return the final report.
  console.log("Internal Pipeline Result (with Recommendations):", JSON.stringify(finalReport, null, 2));
  return finalReport;
}

module.exports = { runPipeline };