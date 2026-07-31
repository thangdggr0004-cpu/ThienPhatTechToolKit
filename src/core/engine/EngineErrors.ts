/**
 * Base error for Recommendation Engine.
 */
export class EngineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EngineError';
  }
}

/**
 * Thrown when a cyclic dependency is detected in rules.
 */
export class RuleDependencyError extends EngineError {
  constructor(message: string) {
    super(message);
    this.name = 'RuleDependencyError';
  }
}

/**
 * Thrown when context data is invalid or missing.
 */
export class ContextValidationError extends EngineError {
  constructor(message: string) {
    super(message);
    this.name = 'ContextValidationError';
  }
}

/**
 * Thrown when a rule evaluation throws an unexpected exception.
 */
export class RuleEvaluationError extends EngineError {
  constructor(ruleId: string, originalError: Error) {
    super(`Rule '${ruleId}' failed during evaluation: ${originalError.message}`);
    this.name = 'RuleEvaluationError';
  }
}
