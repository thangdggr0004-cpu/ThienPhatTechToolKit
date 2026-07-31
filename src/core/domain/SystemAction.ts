import { SystemSnapshot } from './SystemSnapshot.js';

/**
 * Categorization of actions to determine UI grouping and intent.
 */
export type ActionCategory = 'CLEAN' | 'RESTORE' | 'TROUBLESHOOT' | 'UTILITY';

/**
 * Risk levels to warn the technician before execution.
 */
export type RiskLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';

/**
 * SystemAction defines a statically registered capability of the toolkit.
 * It governs what an action is, when it can be seen, and when it can run.
 */
export interface SystemAction {
  id: string;                      // Unique identifier (e.g., 'WIN_CLEAN_KMS')
  name: string;                    // Human-readable name (e.g., 'Làm sạch cấu hình bản quyền')
  category: ActionCategory;        // Logical grouping
  purpose: string;                 // Detailed explanation of what it does
  
  // Logic & Conditions
  visibilityCondition: (snapshot: SystemSnapshot) => boolean; // Determines if action should be evaluated/visible
  executionCondition: (snapshot: SystemSnapshot) => boolean;  // Determines if action is currently executable
  
  // Safety & Requirements
  requireAdmin: boolean;           // Does it need UAC/Admin privileges?
  requireConfirm: boolean;         // Should the UI prompt for confirmation?
  canUndo: boolean;                // Is this action reversible?
  requireBackup: boolean;          // Should the system snapshot/backup before running?
  
  // Post-Execution Lifecycle
  autoRescan: boolean;             // Should the system automatically trigger a new scan on completion?
  generateNext: boolean;           // Should it trigger the recommendation engine to find the next step?
  
  // Metadata & UI
  riskLevel: RiskLevel;
  estimatedTime: string;           // e.g., '5-10 giây'
  successMessage: string;          // Toast/Feedback on success
  errorMessage: string;            // Default error message
  
  version?: string;                // For compatibility
  deprecated?: boolean;            // If true, will not be recommended
  disabled?: boolean;              // If true, completely hidden/unusable
}
