import { WindowsLicenseCategory, LicenseCapabilities } from './ActivationClassification.js';

export const CAPABILITY_CONFIG: Record<WindowsLicenseCategory, LicenseCapabilities> = Object.freeze({
  Retail: Object.freeze({
    canRestoreBios: false,
    canRemoveKey: true,
    canRearm: true,
    canInstallGenericKey: true,
    needRestartSppsvc: true,
    needRescan: true
  }),
  OEM_DM: Object.freeze({
    canRestoreBios: true,
    canRemoveKey: true,
    canRearm: true,
    canInstallGenericKey: true,
    needRestartSppsvc: true,
    needRescan: true
  }),
  OEM_COA: Object.freeze({
    canRestoreBios: false,
    canRemoveKey: true,
    canRearm: true,
    canInstallGenericKey: true,
    needRestartSppsvc: true,
    needRescan: true
  }),
  Volume_MAK: Object.freeze({
    canRestoreBios: false,
    canRemoveKey: true,
    canRearm: true,
    canInstallGenericKey: false,
    needRestartSppsvc: true,
    needRescan: true
  }),
  Volume_KMS: Object.freeze({
    canRestoreBios: false,
    canRemoveKey: true,
    canRearm: true,
    canInstallGenericKey: true,
    needRestartSppsvc: true,
    needRescan: true
  }),
  Windows_Server: Object.freeze({
    canRestoreBios: false,
    canRemoveKey: true,
    canRearm: true,
    canInstallGenericKey: true,
    needRestartSppsvc: true,
    needRescan: true
  }),
  Evaluation: Object.freeze({
    canRestoreBios: false,
    canRemoveKey: false,
    canRearm: true,
    canInstallGenericKey: false,
    needRestartSppsvc: true,
    needRescan: true
  }),
  VirtualMachine: Object.freeze({
    canRestoreBios: false,
    canRemoveKey: true,
    canRearm: true,
    canInstallGenericKey: true,
    needRestartSppsvc: true,
    needRescan: true
  }),
  Unknown: Object.freeze({
    canRestoreBios: false,
    canRemoveKey: true,
    canRearm: true,
    canInstallGenericKey: false,
    needRestartSppsvc: true,
    needRescan: true
  })
});
