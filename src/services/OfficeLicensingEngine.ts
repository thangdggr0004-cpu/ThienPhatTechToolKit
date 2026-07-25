/**
 * Office Licensing 10-Layer Diagnostic Engine (Types & Interfaces)
 * Clean Architecture & SOLID Compliant Data Contract
 */

export interface OfficeFileIntegrity {
  path: string;
  exists: boolean;
  sha256?: string;
  authenticodeStatus: 'Valid' | 'Invalid' | 'NotSigned' | 'Unknown' | 'Missing';
  signerSubject?: string;
  publisher?: string;
  isAuthentic: boolean;
  details?: string;
}

export interface OfficeRegistryHook {
  targetPath: string;
  type: 'IFEO' | 'AppInit' | 'KMSHostOverride' | 'COMHook';
  propertyName: string;
  value: string;
  isSuspicious: boolean;
  description: string;
}

export interface OfficeInjectedModule {
  processName: string;
  pid: number;
  moduleName: string;
  modulePath: string;
  company?: string;
  isSuspicious: boolean;
}

export interface OfficeServiceInfo {
  name: string;
  displayName: string;
  status: 'Running' | 'Stopped' | 'NotFound' | 'Unknown';
  startType: string;
}

export interface OfficeLicenseState {
  isLicensed: boolean;
  channel: string;
  description: string;
  partialKey: string;
  licenseStatusText: string;
  kmsHost?: string;
  gracePeriodDays?: number;
}

export interface OfficeDiagnosticReport {
  timestamp: string;
  layers: {
    l1_infoCollection: { status: 'pass' | 'fail' | 'warn'; details: string };
    l2_licenseDetection: OfficeLicenseState;
    l3_dllIntegrity: OfficeFileIntegrity[];
    l4_digitalSignature: { isAllValid: boolean; details: string };
    l5_injectionDetection: OfficeInjectedModule[];
    l6_registryDetection: OfficeRegistryHook[];
    l7_servicesDetection: OfficeServiceInfo[];
    l8_evidenceEvaluation: {
      hasTampering: boolean;
      confidenceLevel: 'High' | 'Medium' | 'Low' | 'InsufficientData';
      riskScore: number;
      verdict: 'Genuine' | 'Tampered' | 'KMS_Intercepted' | 'Unlicensed' | 'InsufficientData';
      evidences: string[];
    };
  };
  hasIssues: boolean;
  summary: string;
}
