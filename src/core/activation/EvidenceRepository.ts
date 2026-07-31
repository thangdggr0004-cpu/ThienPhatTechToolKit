import {
  StructuredEvidence,
  FileEvidence,
  RegistryEvidence,
  ServiceEvidence,
  TaskEvidence,
  HostEvidence,
  ProcessEvidence,
  EventEvidence,
  LicenseEvidence
} from '../domain/EvidenceModel.js';

export class EvidenceRepository {
  private readonly evidences: readonly StructuredEvidence[];

  constructor(evidences: StructuredEvidence[] = []) {
    this.evidences = Object.freeze([...evidences]);
  }

  public getAll(): readonly StructuredEvidence[] {
    return this.evidences;
  }

  public getLicenseEvidence(): LicenseEvidence | undefined {
    return this.evidences.find(e => e.source === 'license') as LicenseEvidence | undefined;
  }

  public getFileEvidence(): FileEvidence[] {
    return this.evidences.filter(e => e.source === 'filesystem') as FileEvidence[];
  }

  public getRegistryArtifacts(): RegistryEvidence[] {
    return this.evidences.filter(e => e.source === 'registry') as RegistryEvidence[];
  }

  public getSuspiciousFiles(): FileEvidence[] {
    return this.getFileEvidence().filter(f => f.exists && f.confidence >= 50);
  }

  public getSuspiciousTasks(): TaskEvidence[] {
    return (this.evidences.filter(e => e.source === 'task') as TaskEvidence[]).filter(t => t.suspicious);
  }

  public getSuspiciousServices(): ServiceEvidence[] {
    return (this.evidences.filter(e => e.source === 'service') as ServiceEvidence[]).filter(s => s.suspicious);
  }

  public getHostsRedirects(): HostEvidence[] {
    return (this.evidences.filter(e => e.source === 'hosts') as HostEvidence[]).filter(h => h.suspicious);
  }

  public getActivationEvents(): EventEvidence[] {
    return this.evidences.filter(e => e.source === 'event') as EventEvidence[];
  }

  public getRunningActivationProcesses(): ProcessEvidence[] {
    return (this.evidences.filter(e => e.source === 'process') as ProcessEvidence[]).filter(p => p.suspicious);
  }

  public getHighConfidenceEvidence(threshold = 80): StructuredEvidence[] {
    return this.evidences.filter(e => e.confidence >= threshold);
  }

  public getCriticalEvidence(): StructuredEvidence[] {
    return this.evidences.filter(e => e.confidence >= 90);
  }

  public getEvidenceAboveConfidence(confidence: number): StructuredEvidence[] {
    return this.evidences.filter(e => e.confidence >= confidence);
  }

  public getEvidenceByCategory(category: StructuredEvidence['source']): StructuredEvidence[] {
    return this.evidences.filter(e => e.source === category);
  }

  public countCriticalEvidence(): number {
    return this.getCriticalEvidence().length;
  }

  public hasEvidence(predicate: (evidence: StructuredEvidence) => boolean): boolean {
    return this.evidences.some(predicate);
  }

  public findEvidence(predicate: (evidence: StructuredEvidence) => boolean): StructuredEvidence | undefined {
    return this.evidences.find(predicate);
  }

  public countEvidence(predicate?: (evidence: StructuredEvidence) => boolean): number {
    return predicate ? this.evidences.filter(predicate).length : this.evidences.length;
  }
}
