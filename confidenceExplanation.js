/**
 * @typedef {import('./types').CalculationTrace} CalculationTrace
 */

/**
 * Generates a human-readable explanation from a calculation trace.
 * @param {CalculationTrace[]} trace - The trace of confidence calculation steps.
 * @returns {string} - A summary of how the confidence score was calculated.
 */
function getExplanation(trace) {
    if (!trace || trace.length === 0) {
        return "No calculation trace available.";
    }

    const finalScore = trace[trace.length - 1].scoreAfter;
    let explanation = `Final confidence score of ${finalScore} was reached through the following steps:
`;
    
    trace.forEach(item => {
        explanation += `- ${item.step}: ${item.explanation} (Score changed from ${item.scoreBefore} to ${item.scoreAfter})
`;
    });

    return explanation;
}

module.exports = { getExplanation };
