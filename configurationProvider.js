const fs = require('fs');
const path = require('path');
const { validateConfidenceConfig } = require('./confidence-engine/configValidator.js');
const { validateAssessmentConfig } = require('./assessment-engine/configValidator.js');

// Simple validator for Recommendation Config - kept here as it's simple and has no separate engine folder
function validateRecommendationConfig(config) {
    const errors = [];
    if (!config.recommendations || !Array.isArray(config.recommendations)) {
        errors.push("Missing 'recommendations' array.");
    }
    return { isValid: errors.length === 0, errors };
}

/**
 * A dedicated provider to load and validate all required configurations for the pipeline.
 * This isolates file system access and validation logic from the pipeline orchestrator.
 * @returns {{confidenceConfig: object|null, assessmentConfig: object|null, recommendationConfig: object|null, error: object|null}}
 */
function loadAndValidateConfigurations() {
  try {
    // Load Confidence Config
    const confidenceConfigPath = path.join(__dirname, 'confidence.config.json');
    const confidenceConfig = JSON.parse(fs.readFileSync(confidenceConfigPath, 'utf8'));

    const configValidation = validateConfidenceConfig(confidenceConfig);
    if (!configValidation.isValid) {
      const errorMessage = `Invalid Confidence Configuration: ${configValidation.errors.join(', ')}`;
      return { confidenceConfig: null, assessmentConfig: null, recommendationConfig: null, error: { code: 'INVALID_CONFIDENCE_CONFIG', message: errorMessage } };
    }

    // Load Assessment Config
    const assessmentConfigPath = path.join(__dirname, 'assessment.config.json');
    const assessmentConfig = JSON.parse(fs.readFileSync(assessmentConfigPath, 'utf8'));

    const assessmentValidation = validateAssessmentConfig(assessmentConfig);
    if (!assessmentValidation.isValid) {
      const errorMessage = `Invalid Assessment Configuration: ${assessmentValidation.errors.join(', ')}`;
      return { confidenceConfig: null, assessmentConfig: null, recommendationConfig: null, error: { code: 'INVALID_ASSESSMENT_CONFIG', message: errorMessage } };
    }

    // Load Recommendation Config
    const recommendationConfigPath = path.join(__dirname, 'recommendation.config.json');
    const recommendationConfig = JSON.parse(fs.readFileSync(recommendationConfigPath, 'utf8'));

    const recommendationValidation = validateRecommendationConfig(recommendationConfig);
    if (!recommendationValidation.isValid) {
        const errorMessage = `Invalid Recommendation Configuration: ${recommendationValidation.errors.join(', ')}`;
        return { confidenceConfig: null, assessmentConfig: null, recommendationConfig: null, error: { code: 'INVALID_RECOMMENDATION_CONFIG', message: errorMessage } };
    }

    return { confidenceConfig, assessmentConfig, recommendationConfig, error: null };
  } catch (e) {
    // This handles errors like file not found or invalid JSON
    return { confidenceConfig: null, assessmentConfig: null, recommendationConfig: null, error: { code: 'CONFIG_LOAD_FAILURE', message: e.message } };
  }
}

module.exports = { loadAndValidateConfigurations };