import { RecommendationRule, ActionRecommendation } from '../domain/index.js';
import { EngineContext } from './RecommendationContext.js';
import { RuleEvaluationError } from './EngineErrors.js';

/**
 * Safely generates recommendations from rules.
 */
export class RecommendationFactory {
  public static createFromRule(rule: RecommendationRule, context: EngineContext): ActionRecommendation | null {
    try {
      return rule.generate(context as any);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      throw new RuleEvaluationError(rule.id, err);
    }
  }
}
