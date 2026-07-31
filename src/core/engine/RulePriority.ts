/**
 * Priority definitions for rules to determine evaluation order and recommendation ranking.
 */
export enum RulePriority {
  CRITICAL = 100,
  HIGH = 75,
  MEDIUM = 50,
  LOW = 25,
  OPTIONAL = 0
}
