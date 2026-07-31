import { ActionRecommendation, RecommendationPriority } from '../domain/index.js';

const PRIORITY_MAP: Record<RecommendationPriority, number> = {
  'CRITICAL': 100,
  'HIGH': 75,
  'SUGGESTED': 50,
  'LOW': 25
};

/**
 * Sorts recommendations by priority.
 */
export class RecommendationRanker {
  public static rank(recommendations: ActionRecommendation[]): ActionRecommendation[] {
    return [...recommendations].sort((a, b) => {
      const weightA = PRIORITY_MAP[a.priority] || 0;
      const weightB = PRIORITY_MAP[b.priority] || 0;
      return weightB - weightA;
    });
  }
}
