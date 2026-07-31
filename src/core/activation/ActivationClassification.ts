export type WindowsLicenseCategory =
  | 'Retail'
  | 'OEM_DM'
  | 'OEM_COA'
  | 'Volume_MAK'
  | 'Volume_KMS'
  | 'Windows_Server'
  | 'Evaluation'
  | 'VirtualMachine'
  | 'Unknown';

export interface LicenseCapabilities {
  canRestoreBios: boolean;
  canRemoveKey: boolean;
  canRearm: boolean;
  canInstallGenericKey: boolean;
  needRestartSppsvc: boolean;
  needRescan: boolean;
}

export const CAPABILITY_MATRIX: Record<WindowsLicenseCategory, LicenseCapabilities> = {
  Retail: {
    canRestoreBios: false,
    canRemoveKey: true,
    canRearm: true,
    canInstallGenericKey: true,
    needRestartSppsvc: true,
    needRescan: true
  },
  OEM_DM: {
    canRestoreBios: true,
    canRemoveKey: true,
    canRearm: true,
    canInstallGenericKey: true,
    needRestartSppsvc: true,
    needRescan: true
  },
  OEM_COA: {
    canRestoreBios: false,
    canRemoveKey: true,
    canRearm: true,
    canInstallGenericKey: true,
    needRestartSppsvc: true,
    needRescan: true
  },
  Volume_MAK: {
    canRestoreBios: false,
    canRemoveKey: true,
    canRearm: true,
    canInstallGenericKey: false,
    needRestartSppsvc: true,
    needRescan: true
  },
  Volume_KMS: {
    canRestoreBios: false,
    canRemoveKey: true,
    canRearm: true,
    canInstallGenericKey: true,
    needRestartSppsvc: true,
    needRescan: true
  },
  Windows_Server: {
    canRestoreBios: false,
    canRemoveKey: true,
    canRearm: true,
    canInstallGenericKey: true,
    needRestartSppsvc: true,
    needRescan: true
  },
  Evaluation: {
    canRestoreBios: false,
    canRemoveKey: false,
    canRearm: true,
    canInstallGenericKey: false,
    needRestartSppsvc: true,
    needRescan: true
  },
  VirtualMachine: {
    canRestoreBios: false,
    canRemoveKey: true,
    canRearm: true,
    canInstallGenericKey: true,
    needRestartSppsvc: true,
    needRescan: true
  },
  Unknown: {
    canRestoreBios: false,
    canRemoveKey: true,
    canRearm: true,
    canInstallGenericKey: false,
    needRestartSppsvc: true,
    needRescan: true
  }
};

export class WindowsLicenseClassifier {
  public static classify(snapshot: any): WindowsLicenseCategory {
    const desc = (snapshot?.windowsLicense?.description || '').toUpperCase();
    const channel = (snapshot?.windowsLicense?.productKeyChannel || '').toUpperCase();
    const osName = (snapshot?.systemInfo?.os || '').toUpperCase();

    if (osName.includes('SERVER')) return 'Windows_Server';
    if (desc.includes('EVALUATION')) return 'Evaluation';
    if (desc.includes('VMWARE') || desc.includes('VBOX') || desc.includes('HYPER-V')) return 'VirtualMachine';

    if (channel.includes('OEM_DM') || desc.includes('OEM_DM')) return 'OEM_DM';
    if (channel.includes('OEM_COA') || desc.includes('OEM_COA')) return 'OEM_COA';
    if (channel.includes('RETAIL') || desc.includes('RETAIL')) return 'Retail';
    if (channel.includes('VOLUME_KMSCLIENT') || desc.includes('VOLUME_KMSCLIENT')) return 'Volume_KMS';
    if (channel.includes('VOLUME_MAK') || desc.includes('VOLUME_MAK')) return 'Volume_MAK';

    return 'Unknown';
  }
}
