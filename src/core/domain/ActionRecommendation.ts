/**
 * Priority levels for recommendations to determine ranking on the UI.
 */
export type RecommendationPriority = 'CRITICAL' | 'HIGH' | 'SUGGESTED' | 'LOW';

/**
 * ActionRecommendation represents a dynamically generated suggestion
 * from the Recommendation Engine based on the current SystemSnapshot.
 */
export interface ActionRecommendation {
  id: string;                      // Unique ID for the recommendation instance
  actionId: string;                // Reference to the registered SystemAction
  title: string;                   // Highlighted title (e.g., 'Khôi phục Key BIOS')
  reason: string;                  // Why this is recommended (e.g., 'Tìm thấy Key gốc trong BIOS')
  systemImpact: string;            // What commands/changes will happen under the hood
  priority: RecommendationPriority; // Sorting priority
  riskWarning: string;             // Displayed risk to the user
  estimatedTime: string;           // Copied from SystemAction
  executeLabel: string;            // Label for the execute button (e.g., 'Thực hiện')
  expectedResult: string;          // Expected state after completion
  dismissable: boolean;            // Can the user permanently hide this recommendation?
  evidences?: import('./EvidenceModel.js').StructuredEvidence[]; // Attached evidence objects
}
