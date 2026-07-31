const fs = require('fs');
const path = require('path');
const { DiagnosticRuleRegistry, DiagnosticRule } = require('./src/engine/DiagnosticDecisionEngine.cjs');

/**
 * @typedef {import('./types').DeclarativeCondition} DeclarativeCondition
 */

/**
 * A factory function that creates a executable condition function from a declarative JSON object.
 * This is the bridge between the JSON rule packs and the in-memory Decision Engine.
 * It PREVENTS the use of `eval()` by using a safe interpreter pattern.
 *
 * @param {DeclarativeCondition} declarativeCondition - The condition object from the rule pack JSON.
 * @returns {(matrix: import('./src/engine/EvidenceMatrixEngine.cjs').EvidenceMatrix, graph: import('./src/engine/EvidenceCorrelationEngine.cjs').CorrelatedEvidenceGraph) => {matched: boolean, matchedEvidenceIds: string[], metadata: object}}
 */
function createConditionFunction(declarativeCondition) {
  // This is the "safe interpreter"
  return (matrix, graph) => {
    try {
        const { type, evidenceType, evidenceProperty, operator, value } = declarativeCondition;

        const evidenceItems = matrix.getEvidenceByType(evidenceType);
        if (!evidenceItems || evidenceItems.length === 0) {
            return { matched: false };
        }

        let matchedItems = [];

        switch (type) {
            case 'EVIDENCE_PROPERTY_MATCH':
                matchedItems = evidenceItems.filter(item => {
                    const propValue = evidenceProperty.split('.').reduce((o, i) => o[i], item);
                    switch (operator) {
                        case 'EQUALS': return propValue === value;
                        case 'NOT_EQUALS': return propValue !== value;
                        case 'GT': return propValue > value;
                        case 'LT': return propValue < value;
                        default: return false;
                    }
                });
                break;

            case 'EVIDENCE_ARRAY_CONTAINS':
                 matchedItems = evidenceItems.filter(item => {
                    const propValue = evidenceProperty.split('.').reduce((o, i) => o[i], item);
                    return Array.isArray(propValue) && propValue.includes(value);
                 });
                 break;

            default:
                return { matched: false };
        }

        if (matchedItems.length > 0) {
            return {
                matched: true,
                matchedEvidenceIds: matchedItems.map(item => item.evidenceId),
                metadata: {
                    matchedProperty: evidenceProperty,
                    matchedValue: value,
                    matchedCount: matchedItems.length,
                }
            };
        }

        return { matched: false };
    } catch (e) {
        console.error(`Error executing declarative condition: ${e.message}`);
        return { matched: false };
    }
  };
}


/**
 * Loads a set of JSON rule packs from the file system and populates a DiagnosticRuleRegistry.
 *
 * @param {string[]} rulePackPaths - An array of absolute paths to the rule pack JSON files.
 * @returns {Promise<DiagnosticRuleRegistry>} - A promise that resolves to a fully populated rule registry.
 */
async function loadRuleRegistry(rulePackPaths) {
  const registry = new DiagnosticRuleRegistry();

  for (const packPath of rulePackPaths) {
    try {
      const packContent = await fs.promises.readFile(packPath, 'utf8');
      const rulePack = JSON.parse(packContent);

      for (const ruleDef of rulePack.rules) {
        if (!ruleDef.enabled) continue;

        const conditionFunc = createConditionFunction(ruleDef.condition);

        const rule = new DiagnosticRule({
          ...ruleDef,
          condition: conditionFunc, // Override the declarative condition with the executable one
        });

        registry.registerRule(rule);
      }
    } catch (e) {
      console.error(`Failed to load or parse rule pack at '${packPath}': ${e.message}`);
      // In a real scenario, you might want to handle this more gracefully.
    }
  }

  return registry;
}


module.exports = { loadRuleRegistry, createConditionFunction };
