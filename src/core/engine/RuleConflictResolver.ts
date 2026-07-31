import { RecommendationRule } from '../domain/index.js';

/**
 * Resolves conflicts when one rule overrides another.
 */
export class RuleConflictResolver {
  public static resolve(activeRules: RecommendationRule[]): RecommendationRule[] {
    const overriddenIds = new Set<string>();
    activeRules.forEach(rule => {
      if (rule.overrides?.length) {
        rule.overrides.forEach(id => overriddenIds.add(id));
      }
    });
    return activeRules.filter(rule => !overriddenIds.has(rule.id));
  }
}
