/**
 * SystemSnapshot represents the frozen state of the system at a specific point in time.
 * This is the primary input for the Recommendation Engine.
 */
export interface SystemSnapshot {
  timestamp: number;
  os: {
    name: string;
    version: string;
    buildNumber: string;
    architecture: string;
  };
  windowsLicense: {
    status: number; // 0 = Unlicensed, 1 = Licensed, etc.
    description: string;
    hasOA3Key: boolean;
    productKeyChannel: string;
    kmsPort: number;
    gracePeriodRemaining: number;
  };
  officeLicense?: {
    status: number;
    installedVersions: string[];
    hasKMS: boolean;
  };
  services: {
    sppsvc: 'running' | 'stopped' | 'disabled' | 'unknown';
  };
  network: {
    isOnline: boolean;
    hostsFileModified: boolean;
  };
  rawEvidence: any[]; // Raw data from backend scans
  structuredEvidences?: import('./EvidenceModel.js').StructuredEvidence[];
}
