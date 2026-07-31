import { RecommendationRule } from '../domain/index.js';
import { RuleDependencyError } from './EngineErrors.js';

/**
 * Resolves rule dependencies (topological sort).
 */
export class RuleResolver {
  public static resolveDependencies(rules: RecommendationRule[]): RecommendationRule[] {
    const sorted: RecommendationRule[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const ruleMap = new Map<string, RecommendationRule>();

    rules.forEach(r => ruleMap.set(r.id, r));

    const visit = (ruleId: string) => {
      if (visiting.has(ruleId)) {
        throw new RuleDependencyError(`Cyclic dependency: ${ruleId}`);
      }
      if (visited.has(ruleId)) return;
      visiting.add(ruleId);

      const rule = ruleMap.get(ruleId);
      if (rule?.requires) {
        rule.requires.forEach(reqId => {
          if (ruleMap.has(reqId)) visit(reqId);
        });
      }

      visiting.delete(ruleId);
      visited.add(ruleId);
      if (rule) sorted.push(rule);
    };

    rules.forEach(rule => {
      if (!visited.has(rule.id)) visit(rule.id);
    });

    return sorted;
  }
}
