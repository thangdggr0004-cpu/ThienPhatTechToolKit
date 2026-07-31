import { StructuredEvidence } from '../domain/EvidenceModel.js';

export class EvidenceFactory {
  private static toRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  }

  private static toStringArray(value: unknown, keyHints: string[] = []): string[] {
    if (!Array.isArray(value)) return [];
    return value
      .map(item => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          const record = item as Record<string, unknown>;
          for (const key of keyHints) {
            const candidate = record[key];
            if (typeof candidate === 'string' && candidate.trim().length > 0) return candidate;
          }
          const firstString = Object.values(record).find(v => typeof v === 'string' && v.trim().length > 0);
          if (typeof firstString === 'string') return firstString;
        }
        return '';
      })
      .filter(Boolean);
  }

  public static createFromRawData(rawWinData: Record<string, unknown>): StructuredEvidence[] {
    const evidences: StructuredEvidence[] = [];
    const timestamp = Date.now();

    const root = this.toRecord(rawWinData);
    const windows = this.toRecord(root.Windows ?? root.windows);
    const system = this.toRecord(root.System ?? root.system);
    const data = this.toRecord(root.Data ?? root.data);

    const merged = {
      ...data,
      ...windows,
      ...root,
      status: Number(windows.LicenseStatus ?? data.status ?? root.status ?? 0),
      description: String(windows.Description ?? data.description ?? root.description ?? ''),
      productKeyChannel: String(windows.ProductKeyChannel ?? data.productKeyChannel ?? root.productKeyChannel ?? ''),
      kmsHost: String(windows.KeyManagementServiceMachine ?? data.kmsHost ?? root.kmsHost ?? ''),
      kmsPort: Number(windows.KeyManagementServicePort ?? data.kmsPort ?? root.kmsPort ?? 0),
      hasOA3Key: Boolean(windows.HasOA3Key ?? data.hasOA3Key ?? root.hasOA3Key ?? false)
    };

    // 1. License Evidence
    evidences.push({
      source: 'license',
      confidence: 100,
      timestamp,
      rawData: merged,
      productName: String(merged.description || 'Windows'),
      status: Number(merged.status ?? 0),
      channel: String(merged.productKeyChannel || ''),
      kmsHost: String(merged.kmsHost || ''),
      kmsPort: Number(merged.kmsPort ?? 0),
      hasOA3Key: !!merged.hasOA3Key,
      isGenericKey: false
    });

    // 2. Pirated Files Evidence
    const piratedFiles = this.toStringArray(system.PiratedFiles ?? data.piratedFiles ?? root.piratedFiles, ['Path', 'Name']);
    piratedFiles.forEach(file => {
      evidences.push({
        source: 'filesystem',
        confidence: 90,
        timestamp,
        rawData: file,
        path: file,
        exists: true
      });
    });

    // 3. Suspicious Tasks Evidence
    const suspiciousTasks = this.toStringArray(system.SuspiciousTasks ?? data.suspiciousTasks ?? root.suspiciousTasks, ['Name', 'Path', 'Action']);
    suspiciousTasks.forEach(task => {
      evidences.push({
        source: 'task',
        confidence: 85,
        timestamp,
        rawData: task,
        name: task,
        path: task,
        action: 'execute',
        suspicious: true
      });
    });

    // 4. Suspicious Services Evidence
    const suspiciousServices = this.toStringArray(system.SuspiciousServices ?? data.suspiciousServices ?? root.suspiciousServices, ['Name', 'DisplayName']);
    suspiciousServices.forEach(service => {
      evidences.push({
        source: 'service',
        confidence: 85,
        timestamp,
        rawData: service,
        name: service,
        displayName: service,
        status: 'running',
        startMode: 'auto',
        suspicious: true
      });
    });

    // 5. Hosts Redirects Evidence
    const hostsRedirects = this.toStringArray(system.HostsRedirects ?? data.hostsRedirects ?? root.hostsRedirects, ['hostname', 'Hostname']);
    hostsRedirects.forEach(host => {
      evidences.push({
        source: 'hosts',
        confidence: 80,
        timestamp,
        rawData: host,
        ip: '127.0.0.1',
        hostname: host,
        lineNumber: 1,
        suspicious: true
      });
    });

    return Object.freeze(evidences) as StructuredEvidence[];
  }
}
