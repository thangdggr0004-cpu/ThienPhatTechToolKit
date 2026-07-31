import { RecommendationRule } from '../domain/index.js';
import { EngineContext } from './RecommendationContext.js';
import { RuleEvaluationError } from './EngineErrors.js';

/**
 * Safe evaluator for Recommendation Rules.
 */
export class RuleEvaluator {
  public static evaluate(rule: RecommendationRule, context: EngineContext): boolean {
    if ((rule as any).disabled || (rule as any).deprecated) {
      return false;
    }
    try {
      return rule.evaluate(context as any);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      throw new RuleEvaluationError(rule.id, err);
    }
  }
}
