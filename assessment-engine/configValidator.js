function validateAssessmentConfig(config) {
    const errors = [];
    if (!config.scoring) errors.push("Missing 'scoring' object.");
    if (!config.overallStatusRules || !Array.isArray(config.overallStatusRules)) errors.push("Missing 'overallStatusRules' array.");
    if (!config.groups || !Array.isArray(config.groups)) errors.push("Missing 'groups' array.");
    return { isValid: errors.length === 0, errors };
}

module.exports = { validateAssessmentConfig };
