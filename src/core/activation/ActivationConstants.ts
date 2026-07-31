export enum ActivationCommands {
  DEEP_CLEAN = 'deep-clean-activation',
  RESTORE_BIOS = 'restore-oem-bios-key',
  SCAN_LICENSE = 'run-action-WINDOWS_LICENSE_SCAN',
  REMOVE_KEY = 'remove-product-key',
  REMOVE_KMS_HOST = 'remove-kms-host',
  REMOVE_TASKS = 'remove-scheduled-tasks',
  REMOVE_SERVICES = 'remove-services',
  REMOVE_REGISTRY = 'remove-registry-artifacts',
  REMOVE_HOSTS = 'remove-hosts-redirect',
  RESTART_SPPSVC = 'restart-sppsvc'
}

export enum ActivationEvents {
  STEP_STARTED = 'ACTIVATION_STEP_STARTED',
  STEP_COMPLETED = 'ACTIVATION_STEP_COMPLETED',
  VERIFICATION_DONE = 'ACTIVATION_VERIFICATION_DONE',
  REPORT_GENERATED = 'ACTIVATION_REPORT_GENERATED'
}

export enum ActivationErrorCodes {
  SUCCESS = 'SUCCESS',
  EXECUTION_FAILED = 'ACTIVATION_EXECUTION_FAILED',
  VERIFICATION_FAILED = 'ACTIVATION_VERIFICATION_FAILED',
  PREREQUISITE_FAILED = 'ACTIVATION_PREREQUISITE_FAILED',
  STEP_TIMEOUT = 'ACTIVATION_STEP_TIMEOUT',
  UNKNOWN_ERROR = 'ACTIVATION_UNKNOWN_ERROR'
}

export const ActivationConstants = Object.freeze({
  DEFAULT_TIMEOUT_MS: 30000,
  STEP_TIMEOUT_MS: 10000,
  KMS_DEFAULT_PORT: 1688,
  OFFICE_APP_ID: '0ff1ce15-a989-479d-af46-f275c6370663',
  WINDOWS_APP_ID: '55c92734-d682-4d71-983e-d6ec3f16059f'
});

export interface StructuredActivationError {
  code: ActivationErrorCodes;
  message: string;
  step: string;
  strategy: string;
  category: string;
  evidence: unknown[];
}
