import { IRecommendationEngine, RecommendationEngine } from './RecommendationEngine.js';

/**
 * Singleton service exposing the Recommendation Engine.
 */
export class RecommendationEngineService {
  private static instance: IRecommendationEngine;

  private constructor() {}

  public static getInstance(): IRecommendationEngine {
    if (!RecommendationEngineService.instance) {
      RecommendationEngineService.instance = new RecommendationEngine();
    }
    return RecommendationEngineService.instance;
  }
  
  public static setInstance(engine: IRecommendationEngine): void {
      RecommendationEngineService.instance = engine;
  }
}
