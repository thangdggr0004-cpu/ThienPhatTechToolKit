import { WindowsLicenseCategory, LicenseCapabilities } from './ActivationClassification.js';
import { CAPABILITY_CONFIG } from './ActivationCapabilityConfig.js';

export class CapabilityResolver {
  public static resolve(category: WindowsLicenseCategory): LicenseCapabilities {
    return CAPABILITY_CONFIG[category] || CAPABILITY_CONFIG.Unknown;
  }

  public static isBiosRestoreAllowed(category: WindowsLicenseCategory, hasOA3Key: boolean): boolean {
    if (!hasOA3Key) return false;
    const forbiddenCategories: WindowsLicenseCategory[] = [
      'Retail',
      'Volume_MAK',
      'Volume_KMS',
      'Windows_Server',
      'VirtualMachine',
      'Unknown',
      'Evaluation'
    ];
    if (forbiddenCategories.includes(category)) return false;
    return this.resolve(category).canRestoreBios;
  }
}
