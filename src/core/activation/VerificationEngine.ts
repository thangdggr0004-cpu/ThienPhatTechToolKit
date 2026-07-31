import { StructuredEvidence } from '../domain/EvidenceModel.js';
import { EvidenceRepository } from './EvidenceRepository.js';
import { EvidenceFactory } from './EvidenceFactory.js';

export interface VerificationReport {
  passed: boolean;
  confidence: number;
  issues: string[];
  evidenceUsed: StructuredEvidence[];
  evidenceAfter: StructuredEvidence[];
}

export class VerificationEngine {
  public static verifyDeepCleanWithRepository(repository: EvidenceRepository): VerificationReport {
    const issues: string[] = [];
    const evidenceUsed: StructuredEvidence[] = [];

    // 1. License Evidence Query
    const licenseEv = repository.getLicenseEvidence();
    if (licenseEv) {
      if (licenseEv.kmsHost && licenseEv.kmsHost !== '') {
        evidenceUsed.push(licenseEv);
        issues.push(`[KMS Host] Máy chủ KMS chưa được xóa hoàn toàn: ${licenseEv.kmsHost}`);
      }
    }

    // 2. File System Evidence Query
    const suspiciousFiles = repository.getSuspiciousFiles();
    if (suspiciousFiles.length > 0) {
      evidenceUsed.push(...suspiciousFiles);
      const paths = suspiciousFiles.map(f => f.path).join(', ');
      issues.push(`[File System] Vẫn còn tệp tin bẻ khóa: ${paths}`);
    }

    // 3. Task Scheduler Evidence Query
    const suspiciousTasks = repository.getSuspiciousTasks();
    if (suspiciousTasks.length > 0) {
      evidenceUsed.push(...suspiciousTasks);
      const tasks = suspiciousTasks.map(t => t.name).join(', ');
      issues.push(`[Task Scheduler] Vẫn còn tác vụ ẩn lậu: ${tasks}`);
    }

    // 4. Services Evidence Query
    const suspiciousServices = repository.getSuspiciousServices();
    if (suspiciousServices.length > 0) {
      evidenceUsed.push(...suspiciousServices);
      const svcs = suspiciousServices.map(s => s.name).join(', ');
      issues.push(`[Services] Vẫn còn dịch vụ ngầm lậu: ${svcs}`);
    }

    // 5. Hosts Redirects Query
    const hostsRedirects = repository.getHostsRedirects();
    if (hostsRedirects.length > 0) {
      evidenceUsed.push(...hostsRedirects);
      const hosts = hostsRedirects.map(h => h.hostname).join(', ');
      issues.push(`[Hosts File] Vẫn còn dòng chuyển hướng file hosts: ${hosts}`);
    }

    // Confidence Engine Calculation based on Independent Evidence Sources
    const distinctSources = new Set(evidenceUsed.map(e => e.source)).size;
    let confidence = 0;

    if (issues.length === 0) {
      confidence = 100; // Clean system with 100% confidence
    } else if (distinctSources >= 3) {
      confidence = 95; // 3+ independent sources confirm tampering
    } else if (distinctSources === 2) {
      confidence = 90; // 2 independent sources confirm tampering
    } else if (distinctSources === 1) {
      confidence = 70; // 1 source suspicious
    } else {
      confidence = 0;
    }

    return {
      passed: issues.length === 0 && confidence >= 90,
      confidence,
      issues,
      evidenceUsed,
      evidenceAfter: evidenceUsed
    };
  }

  public static verifyDeepClean(winData: Record<string, unknown>): VerificationReport {
    const evidences = EvidenceFactory.createFromRawData(winData);
    const repository = new EvidenceRepository(evidences);
    return this.verifyDeepCleanWithRepository(repository);
  }

  public static verifyBiosRestore(winData: Record<string, unknown>): VerificationReport {
    const issues: string[] = [];
    const status = Number(winData?.status ?? 0);
    const hasOA3 = !!winData?.hasOA3Key;
    const channel = String(winData?.productKeyChannel || '').toUpperCase();
    const kmsHost = String(winData?.kmsHost || '');

    if (!hasOA3) {
      issues.push('[OA3 Key] Không tìm thấy khóa OA3 trong BIOS phần cứng.');
    }
    if (status !== 1) {
      issues.push('[License Status] Khôi phục Key BIOS nhưng trạng thái bản quyền chưa đạt Licensed (Status = 1).');
    }
    if (channel.includes('VOLUME_KMSCLIENT')) {
      issues.push('[License Channel] Kênh cấp phép không đúng (vẫn là Volume KMS).');
    }
    if (kmsHost !== '') {
      issues.push(`[KMS Host] Vẫn còn liên kết tới máy chủ KMS: ${kmsHost}`);
    }

    return {
      passed: issues.length === 0,
      confidence: issues.length === 0 ? 100 : 90,
      issues,
      evidenceUsed: [],
      evidenceAfter: []
    };
  }
}
