function validateConfidenceConfig(config) {
    const errors = [];
    if (!config.baseConfidence) errors.push("Missing 'baseConfidence'.");
    if (!config.factors || !Array.isArray(config.factors)) errors.push("Missing 'factors' array.");
    if (!config.levels || !Array.isArray(config.levels)) errors.push("Missing 'levels' array.");
    return { isValid: errors.length === 0, errors };
}

module.exports = { validateConfidenceConfig };
