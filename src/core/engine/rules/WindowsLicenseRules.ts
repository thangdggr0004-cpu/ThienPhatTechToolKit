import { RecommendationRule, RecommendationContext } from '../../domain/RecommendationRule.js';
import { ActionRecommendation } from '../../domain/ActionRecommendation.js';
import { FileEvidence, TaskEvidence, HostEvidence, LicenseEvidence } from '../../domain/EvidenceModel.js';

export const WindowsNotActivatedRule: RecommendationRule = {
  id: 'RULE_WIN_NOT_ACTIVATED',
  name: 'Windows Chưa Kích Hoạt',
  weight: 90,
  evaluate: (context: RecommendationContext) => {
    const licenseEv = context.snapshot.structuredEvidences?.find(e => e.source === 'license') as LicenseEvidence | undefined;
    if (licenseEv) {
      return licenseEv.status === 0;
    }
    return context.snapshot.windowsLicense?.status === 0;
  },
  generate: (context: RecommendationContext): ActionRecommendation => {
    return {
      id: 'REC_WIN_ACTIVATE',
      actionId: 'WINDOWS_ACTIVATE',
      title: 'Kích hoạt Windows',
      reason: 'WMI SoftwareLicensingProduct trả về LicenseStatus = 0',
      systemImpact: 'Khôi phục tính năng cá nhân hóa (Personalize) và xóa watermark.',
      priority: 'HIGH',
      riskWarning: 'Không có rủi ro.',
      estimatedTime: '5 phút',
      executeLabel: 'Kích hoạt ngay',
      expectedResult: 'Windows đã kích hoạt thành công.',
      dismissable: false
    };
  }
};

export const WindowsKMSCrackRule: RecommendationRule = {
  id: 'RULE_WIN_KMS_CRACK',
  name: 'Phát Hiện KMS Crack',
  weight: 100,
  evaluate: (context: RecommendationContext) => {
    const evidences = context.snapshot.structuredEvidences || [];
    
    const fileEv = evidences.find(e => e.source === 'filesystem' && (e as FileEvidence).exists) as FileEvidence | undefined;
    const taskEv = evidences.find(e => e.source === 'task' && (e as TaskEvidence).suspicious) as TaskEvidence | undefined;
    const hostEv = evidences.find(e => e.source === 'hosts' && (e as HostEvidence).suspicious) as HostEvidence | undefined;
    const licenseEv = evidences.find(e => e.source === 'license') as LicenseEvidence | undefined;

    const isKmsChannel = licenseEv ? (licenseEv.channel === 'VOLUME_KMSCLIENT' && licenseEv.status === 1) : false;
    const hasKmsHost = licenseEv ? (!!licenseEv.kmsHost && licenseEv.kmsHost !== '') : false;

    const { windowsLicense } = context.snapshot;
    const fallbackKms = windowsLicense ? (windowsLicense.productKeyChannel === 'VOLUME_KMSCLIENT' && windowsLicense.status === 1) : false;
    const fallbackHost = windowsLicense ? (!!(windowsLicense as any).kmsHost && (windowsLicense as any).kmsHost !== '') : false;
    const fallbackFiles = windowsLicense ? ((windowsLicense as any).piratedFiles?.length > 0) : false;
    const fallbackTasks = windowsLicense ? ((windowsLicense as any).suspiciousTasks?.length > 0) : false;
    const fallbackHosts = windowsLicense ? ((windowsLicense as any).hostsRedirects?.length > 0) : false;

    return !!fileEv || !!taskEv || !!hostEv || isKmsChannel || hasKmsHost || fallbackKms || fallbackHost || fallbackFiles || fallbackTasks || fallbackHosts;
  },
  generate: (context: RecommendationContext): ActionRecommendation => {
    const evidences = (context.snapshot.structuredEvidences || []).filter(e => e.confidence > 50);
    return {
      id: 'REC_WIN_REMOVE_CRACK',
      actionId: 'WINDOWS_REMOVE_CRACK',
      title: 'Gỡ bỏ Công cụ Crack KMS',
      reason: 'Phát hiện Kênh Volume:GVLK với kết nối KMS khả nghi.',
      systemImpact: 'Windows sẽ mất bản quyền tạm thời cho đến khi được kích hoạt lại bằng phương pháp an toàn.',
      priority: 'CRITICAL',
      riskWarning: 'Rủi ro bảo mật trung bình nếu giữ lại crack KMS.',
      estimatedTime: '2 phút',
      executeLabel: 'Gỡ bỏ KMS',
      expectedResult: 'Hệ thống sạch, không còn tool bẻ khóa.',
      dismissable: false,
      evidences
    };
  },
  overrides: ['RULE_WIN_NOT_ACTIVATED']
};
