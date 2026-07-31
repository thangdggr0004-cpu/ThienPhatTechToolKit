import { ActionRecommendation, RecommendationPriority } from '../domain/index.js';

/**
 * Fluent builder for ActionRecommendation.
 */
export class RecommendationBuilder {
  private id: string = crypto.randomUUID();
  private actionId: string = '';
  private title: string = '';
  private reason: string = '';
  private systemImpact: string = '';
  private priority: RecommendationPriority = 'SUGGESTED';
  private riskWarning: string = '';
  private estimatedTime: string = '';
  private executeLabel: string = 'Thực hiện';
  private expectedResult: string = '';
  private dismissable: boolean = true;

  public withActionId(actionId: string): this { this.actionId = actionId; return this; }
  public withTitle(title: string): this { this.title = title; return this; }
  public withReason(reason: string): this { this.reason = reason; return this; }
  public withSystemImpact(impact: string): this { this.systemImpact = impact; return this; }
  public withPriority(priority: RecommendationPriority): this { this.priority = priority; return this; }
  public withRiskWarning(warning: string): this { this.riskWarning = warning; return this; }
  public withEstimatedTime(time: string): this { this.estimatedTime = time; return this; }
  public withExecuteLabel(label: string): this { this.executeLabel = label; return this; }
  public withExpectedResult(result: string): this { this.expectedResult = result; return this; }
  public setDismissable(dismissable: boolean): this { this.dismissable = dismissable; return this; }

  public build(): ActionRecommendation {
    if (!this.actionId || !this.title || !this.reason) {
      throw new Error('ActionRecommendation missing mandatory fields.');
    }
    return {
      id: this.id,
      actionId: this.actionId,
      title: this.title,
      reason: this.reason,
      systemImpact: this.systemImpact,
      priority: this.priority,
      riskWarning: this.riskWarning,
      estimatedTime: this.estimatedTime,
      executeLabel: this.executeLabel,
      expectedResult: this.expectedResult,
      dismissable: this.dismissable
    };
  }
}
