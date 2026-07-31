export interface ExecutionProgress {
  readonly percentage: number;
  readonly message: string;
  readonly step: number;
  readonly totalSteps: number;
}