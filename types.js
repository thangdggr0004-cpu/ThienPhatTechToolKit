/**
 * @typedef {object} EvidenceItem
 * @property {string} evidenceId - Unique ID for the piece of evidence.
 * @property {string} evidenceName - Human-readable name.
 * @property {string} evidenceType - Category of the evidence (e.g., 'LICENSE', 'FIRMWARE').
 * @property {string} evidenceSource - Where the evidence came from (e.g., 'WMI', 'REGISTRY').
 * @property {*} evidenceValue - The actual data collected.
 * @property {'OBJECT'|'STRING'|'NUMBER'|'BOOLEAN'} evidenceFormat - The format of evidenceValue.
 * @property {'DATA_PRESENT'|'DATA_MISSING'|'ERROR'} evidenceStatus - The status of the evidence.
 * @property {string} collectedTime - ISO 8601 timestamp.
 * @property {string} collectorVersion - Version of the collector that gathered this.
 */

/**
 * @typedef {import('./src/engine/EvidenceMatrixEngine.cjs').EvidenceMatrix} EvidenceMatrix
 */

/**
 * @typedef {object} DecisionResult
 * @property {string} decisionId - Unique ID for the decision.
 * @property {string} decisionType - Type of decision (e.g., 'OEM_DM_CHANNEL_MATCHED').
 * @property {string} matchedRuleId - The ID of the rule that triggered this decision.
 * @property {string[]} matchedEvidenceIds - IDs of evidence items that supported this decision.
 * @property {string[]} matchedRelationshipIds - IDs of relationships that supported this decision.
 * @property {object} decisionMetadata - Additional data related to the decision.
 * @property {string} decisionTimestamp - ISO 8601 timestamp.
 */

/**
 * @typedef {object} CalculationTrace
 * @property {string} step - The step in the calculation (e.g., 'Base Confidence', 'F-EVIDENCE-CORRELATION').
 * @property {number} scoreBefore - The score before this step.
 * @property {number} scoreAfter - The score after this step.
 * @property {string} explanation - A human-readable explanation of the step.
 */

/**
 * @typedef {DecisionResult & {confidence: {score: number, level: string, calculationTrace: CalculationTrace[], explanation: string}}} DecisionResultWithConfidence
 */

/**
 * @typedef {object} ConfidenceConfig
 * @property {number} baseConfidence
 * @property {Array<{factorId: string, description: string, adjustments: Array<{if: object, then: {weight?: number, boost?: number}}>}>} factors
 * @property {Array<{level: string, threshold: number}>} levels
 */

/**
 * @typedef {object} AssessmentConfig
 * @property {Array<{if: object, thenSet: string, priority: number}>} overallStatusRules
 * @property {{baseScore: number, deductions: Array<{if: object, points: number, weightedByConfidence: boolean}>}} scoring
 * @property {Array<{groupId: string, displayName: string, decisionTypes: string[]}>} groups
 */
 
/**
 * @typedef {object} AssessmentResult
 * @property {string} assessmentId
 * @property {string} timestamp
 * @property {number} overallScore
 * @property {string} overallStatus
 * @property {object} scoring
 * @property {object} groups
 * @property {DecisionResultWithConfidence[]} rawResults
 */

 /**
 * @typedef {object} DeclarativeCondition
 * @property {'EVIDENCE_PROPERTY_MATCH' | 'EVIDENCE_ARRAY_CONTAINS'} type
 * @property {string} evidenceType
 * @property {string} evidenceProperty
 * @property {'EQUALS' | 'NOT_EQUALS' | 'GT' | 'LT' | 'CONTAINS'} operator
 * @property {string | number | boolean} value
 */

 module.exports = {};
