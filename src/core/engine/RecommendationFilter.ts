import { ActionRecommendation } from '../domain/index.js';
import { EngineContext } from './RecommendationContext.js';

/**
 * Filters out invalid or dismissed recommendations.
 */
export class RecommendationFilter {
  public static filter(
    recommendations: ActionRecommendation[], 
    context: EngineContext,
    isValidActionCallback: (actionId: string) => boolean
  ): ActionRecommendation[] {
    return recommendations.filter(rec => {
      if (!isValidActionCallback(rec.actionId)) return false;

      const hasBeenDismissed = context.history.some(h => 
        h.execution.actionId === rec.actionId && 
        h.result.exitCode === -1 && 
        h.result.stdout === 'DISMISSED'
      );

      return !hasBeenDismissed;
    });
  }
}
