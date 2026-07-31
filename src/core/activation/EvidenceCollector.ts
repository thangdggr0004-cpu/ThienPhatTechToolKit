import { IBackendAdapter } from './ActivationExecutor.js';
import { EvidenceFactory } from './EvidenceFactory.js';
import { EvidenceRepository } from './EvidenceRepository.js';
import { ActivationCommands } from './ActivationConstants.js';

export class EvidenceCollector {
  constructor(private readonly adapter: IBackendAdapter) {}

  public async collectRepository(): Promise<EvidenceRepository> {
    try {
      const freshData = await this.adapter.execute(ActivationCommands.SCAN_LICENSE, {});
      const winData = (freshData?.Data || freshData) as Record<string, unknown>;
      const evidences = EvidenceFactory.createFromRawData(winData);
      return new EvidenceRepository(evidences);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('EvidenceCollector collection error:', msg);
      return new EvidenceRepository([]);
    }
  }
}
