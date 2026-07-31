import { RecommendationRule, ActionRecommendation } from '../domain/index.js';
import { EngineContext } from './RecommendationContext.js';
import { RuleResolver } from './RuleResolver.js';
import { RuleEvaluator } from './RuleEvaluator.js';
import { RuleConflictResolver } from './RuleConflictResolver.js';
import { RecommendationFactory } from './RecommendationFactory.js';
import { RecommendationFilter } from './RecommendationFilter.js';
import { RecommendationMerger } from './RecommendationMerger.js';
import { RecommendationRanker } from './RecommendationRanker.js';
import { EngineError } from './EngineErrors.js';

export interface IRecommendationEngine {
  registerRule(rule: RecommendationRule): void;
  evaluateAll(context: EngineContext, isValidActionCallback: (actionId: string) => boolean): ActionRecommendation[];
}

/**
 * Core engine orchestrating rule evaluations and recommendation generation.
 */
export class RecommendationEngine implements IRecommendationEngine {
  private readonly rules: RecommendationRule[] = [];
  private sortedRulesCache: RecommendationRule[] | null = null;

  public registerRule(rule: RecommendationRule): void {
    if (this.rules.some(r => r.id === rule.id)) {
      throw new EngineError(`Rule with ID '${rule.id}' already exists.`);
    }
    this.rules.push(Object.freeze({ ...rule }));
    this.sortedRulesCache = null; // invalidate cache
  }

  public evaluateAll(context: EngineContext, isValidActionCallback: (actionId: string) => boolean): ActionRecommendation[] {
    try {
      if (!this.sortedRulesCache) {
        this.sortedRulesCache = RuleResolver.resolveDependencies(this.rules);
      }
      
      const activeRules = this.sortedRulesCache.filter(rule => RuleEvaluator.evaluate(rule, context));
      const nonConflictingRules = RuleConflictResolver.resolve(activeRules);
      
      const rawRecommendations: ActionRecommendation[] = [];
      nonConflictingRules.forEach(rule => {
        const rec = RecommendationFactory.createFromRule(rule, context);
        if (rec) rawRecommendations.push(rec);
      });

      const filtered = RecommendationFilter.filter(rawRecommendations, context, isValidActionCallback);
      const merged = RecommendationMerger.merge(filtered);
      
      return RecommendationRanker.rank(merged);
    } catch (error) {
      console.error('Engine evaluation failed:', error);
      return []; // Fail safely
    }
  }
}
