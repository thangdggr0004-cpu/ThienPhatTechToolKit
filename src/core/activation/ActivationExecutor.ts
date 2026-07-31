import { ExecutionStep } from './ExecutionStep.js';
import { StructuredEvidence } from '../domain/EvidenceModel.js';
import { ActivationCommands } from './ActivationConstants.js';

export interface IBackendAdapter {
  execute(channel: string, payload: unknown): Promise<Record<string, unknown>>;
}

export class ActivationExecutor {
  constructor(private readonly adapter: IBackendAdapter) {}

  private static inferResultSignals(result: Record<string, unknown>): { success: boolean; errors: string[] } {
    const errors: string[] = [];

    const directSuccess = result.success ?? result.Success;
    const directError = result.error ?? result.Error;

    const output = result.output;
    const outputObj = output && typeof output === 'object' ? (output as Record<string, unknown>) : null;
    const outputSuccess = outputObj ? (outputObj.success ?? outputObj.Success) : undefined;
    const outputError = outputObj ? (outputObj.error ?? outputObj.Error) : undefined;

    const isFalse = (v: unknown): boolean => v === false || v === 0 || String(v).trim().toLowerCase() === 'false';

    if (directError) errors.push(String(directError));
    if (outputError) errors.push(String(outputError));

    if (isFalse(directSuccess)) errors.push('Backend payload signaled failure (success=false).');
    if (isFalse(outputSuccess)) errors.push('Backend output payload signaled failure (output.success=false).');

    return { success: errors.length === 0, errors };
  }


  private static normalizeWindowsScanPayload(raw: Record<string, unknown>): Record<string, unknown> {
    const top = raw;
    const data = (top.Data as Record<string, unknown>) || top;
    const windows = (top.Windows as Record<string, unknown>) || (data.Windows as Record<string, unknown>) || data;
    const system = (top.System as Record<string, unknown>) || (data.System as Record<string, unknown>) || {};

    const pickArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
    const toStringArray = (value: unknown): string[] => pickArray(value)
      .map(item => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          const rec = item as Record<string, unknown>;
          return String(rec.Name ?? rec.Path ?? rec.Action ?? rec.hostname ?? rec.Hostname ?? '');
        }
        return '';
      })
      .filter(Boolean);

    return {
      ...data,
      ...windows,
      status: Number(windows.LicenseStatus ?? data.status ?? data.LicenseStatus ?? 0),
      description: String(windows.Description ?? data.description ?? data.Description ?? ''),
      hasOA3Key: Boolean(windows.HasOA3Key ?? data.hasOA3Key ?? data.HasOA3Key ?? false),
      productKeyChannel: String(windows.ProductKeyChannel ?? data.productKeyChannel ?? data.ProductKeyChannel ?? ''),
      kmsHost: String(windows.KeyManagementServiceMachine ?? data.kmsHost ?? data.KeyManagementServiceMachine ?? ''),
      kmsPort: Number(windows.KeyManagementServicePort ?? data.kmsPort ?? data.KeyManagementServicePort ?? 0),
      gracePeriodRemaining: Number(windows.GracePeriodRemaining ?? data.gracePeriodRemaining ?? data.GracePeriodRemaining ?? 0),
      piratedFiles: toStringArray(system.PiratedFiles ?? data.piratedFiles),
      suspiciousTasks: toStringArray(system.SuspiciousTasks ?? data.suspiciousTasks),
      suspiciousServices: toStringArray(system.SuspiciousServices ?? data.suspiciousServices),
      hostsRedirects: toStringArray(system.HostsRedirects ?? data.hostsRedirects)
    };
  }

  public async executeStep(
    name: string,
    channel: ActivationCommands | string,
    payload: unknown,
    evidenceBefore: StructuredEvidence[] = []
  ): Promise<{ step: ExecutionStep; resultData: Record<string, unknown> }> {
    const startTime = Date.now();
    try {
      const res = await this.adapter.execute(channel, payload);
      const endTime = Date.now();

      const signals = ActivationExecutor.inferResultSignals(res);

      const step: ExecutionStep = {
        name,
        startTime,
        endTime,
        duration: endTime - startTime,
        success: signals.success,
        evidenceBefore,
        evidenceAfter: [],
        errors: signals.errors,
        warnings: []
      };

      return { step, resultData: res };
    } catch (err: unknown) {
      const endTime = Date.now();
      const errorMessage = err instanceof Error ? err.message : String(err);

      const step: ExecutionStep = {
        name,
        startTime,
        endTime,
        duration: endTime - startTime,
        success: false,
        evidenceBefore,
        evidenceAfter: [],
        errors: [errorMessage],
        warnings: []
      };

      return { step, resultData: { error: errorMessage } };
    }
  }

  public async scanState(): Promise<Record<string, unknown>> {
    try {
      const fresh = await this.adapter.execute(ActivationCommands.SCAN_LICENSE, {});
      return ActivationExecutor.normalizeWindowsScanPayload(fresh || {});
    } catch {
      return {};
    }
  }
}
