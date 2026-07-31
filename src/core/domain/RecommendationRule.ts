import { SystemSnapshot } from './SystemSnapshot.js';
import { ActionRecommendation } from './ActionRecommendation.js';
import { ActionHistory } from './ActionHistory.js';

/**
 * RecommendationContext holds additional state needed by the engine to evaluate rules.
 */
export interface RecommendationContext {
  snapshot: SystemSnapshot;
  history: ActionHistory[];
  isOffline: boolean;
}

/**
 * RecommendationRule is a single unit of logic in the Recommendation Engine.
 */
export interface RecommendationRule {
  id: string;
  name: string;
  weight: number;                  // Used to resolve conflicts and ranking
  
  /**
   * Evaluates if this rule applies to the current context.
   */
  evaluate: (context: RecommendationContext) => boolean;
  
  /**
   * Generates the concrete recommendation if evaluate() returns true.
   */
  generate: (context: RecommendationContext) => ActionRecommendation | null;
  
  /**
   * IDs of other rules that must pass before this rule can be evaluated.
   */
  requires?: string[];
  
  /**
   * IDs of other rules that this rule overrides (conflict resolution).
   */
  overrides?: string[];
}
