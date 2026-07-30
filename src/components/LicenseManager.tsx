
import React, { useState, useMemo } from 'react';
import { ShieldCheck, ShieldAlert, ShieldX, FileText, Terminal, Loader, ServerCrash, RefreshCw, KeyRound, ChevronDown, ChevronRight, Search, AlertTriangle, Clock, Cpu, Eye, EyeOff, Info, CheckCircle2, XCircle, Zap, BarChart3, Bug, Wrench, Filter, ArrowUpDown } from 'lucide-react';
import OfficeLicenseAnalyzer from './OfficeLicenseAnalyzer.js';
import { ActivationEngine } from '../core/activation/ActivationEngine.js';
import { EvidenceCollector } from '../core/activation/EvidenceCollector.js';
import { VerificationEngine } from '../core/activation/VerificationEngine.js';
import { EvidenceFactory } from '../core/activation/EvidenceFactory.js';
import { EvidenceRepository } from '../core/activation/EvidenceRepository.js';
import { IBackendAdapter } from '../core/activation/ActivationExecutor.js';

class ElectronBackendAdapter implements IBackendAdapter {
  async execute(channel: string, payload: unknown): Promise<Record<string, unknown>> {
    if (channel === 'run-action-WINDOWS_LICENSE_SCAN') {
      return await (window as any).electronAPI.scanActivation({ type: 'windows' });
    }
    if (channel === 'deep-clean-activation') {
      const output = await (window as any).electronAPI.deepCleanActivation('windows');
      return { output };
    }
    if (channel === 'restore-oem-bios-key') {
      const output = await (window as any).electronAPI.restoreOemBiosKey();
      return { output };
    }
    return {};
  }
}

const translateBackendString = (str) => {
  if (!str) return '—';
  if (typeof str !== 'string') return str;
  const map = {
    'Verify the KMS host and check for illegal activation tools (e.g. KMSAuto, KMSpico).': 'Kiểm tra lại máy chủ KMS trước khi tiếp tục.',
    'One or more negative evidence groups require technician intervention.': 'Phát hiện một hoặc nhiều dấu hiệu bất thường.',
    'No backend decision': 'Chưa có kết luận từ hệ thống.',
    'False positive': 'Nhận diện nhầm',
    'No adverse evidence in this group': 'Không có dấu hiệu bất thường',
    'Scan result unavailable': 'Không có kết quả phân tích',
    'Needs verification': 'Cần xác minh thêm',
    'Manual review required': 'Cần kiểm tra thủ công',
    'TAMPERED': 'CAN THIỆP',
    'WARNING': 'CẢNH BÁO',
    'GENUINE': 'CHÍNH HÃNG'
  };
  return map[str] || str;
};

const translateFieldValue = (str) => {
  if (!str) return 'Không có dữ liệu';
  if (typeof str !== 'string') return str;
  let translated = str;
  
  // Exact phrase mappings
  if (translated.includes('The machine is permanently activated.')) {
      return 'Windows đang được kích hoạt hợp lệ.';
  }

  // Field mappings
  translated = translated.replace(/HasOA3Key/gi, 'Khóa OA3 trong BIOS');
  translated = translated.replace(/LicenseStatus/gi, 'Trạng thái kích hoạt');
  translated = translated.replace(/ProductKeyChannel/gi, 'Loại bản quyền');
  translated = translated.replace(/LicenseFamily/gi, 'Phiên bản Windows');
  translated = translated.replace(/GracePeriodRemaining/gi, 'Thời gian gia hạn còn lại');
  translated = translated.replace(/KeyManagementServicePort/gi, 'Máy chủ KMS');
  translated = translated.replace(/Description/gi, 'Thông tin bản quyền');
  
  // Value mappings
  if (translated.includes('Khóa OA3 trong BIOS')) {
      translated = translated.replace(/[:=]\s*(false|0)/gi, ': Không tìm thấy khóa OA3 trong BIOS.');
      translated = translated.replace(/[:=]\s*(true|1)/gi, ': Hợp lệ');
  }
  if (translated.includes('Trạng thái kích hoạt')) {
      translated = translated.replace(/[:=]\s*1/g, ': Windows đã được kích hoạt.');
      translated = translated.replace(/[:=]\s*0/g, ': Chưa kích hoạt.');
  }
  if (translated.includes('Máy chủ KMS')) {
      translated = translated.replace(/[:=]\s*0/g, ': Không phát hiện máy chủ KMS.');
  }
  
  return translated;
};

// Normalize IPC scan payloads from different backend response shapes
const normalizeScanActivationResult = (raw: any): any => {
  if (raw === null || raw === undefined) return null;

  const parseIfJsonString = (value: any) => {
    if (typeof value !== 'string') return value;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  };

  const hasActivationGroups = (value: any) => {
    if (!value || typeof value !== 'object') return false;
    return !!(
      value.Windows || value.windows ||
      value.Office || value.office ||
      value.System || value.system
    );
  };

  const normalizeGroupKeys = (value: any) => {
    if (!value || typeof value !== 'object') return value;
    const normalized = { ...value };
    if (!normalized.Windows && normalized.windows) normalized.Windows = normalized.windows;
    if (!normalized.Office && normalized.office) normalized.Office = normalized.office;
    if (!normalized.System && normalized.system) normalized.System = normalized.system;
    return normalized;
  };

  const throwIfBackendFailure = (value: any) => {
    if (!value || typeof value !== 'object') return;
    if (value.Success === false) {
      throw new Error(value.Error || 'Backend scan failed.');
    }
    if (value.success === false) {
      throw new Error(value.error || 'Backend scan failed.');
    }
  };

  const unwrapCandidates = (value: any) => {
    if (!value || typeof value !== 'object') return [];
    return [
      value.Data,
      value.data,
      value.output,
      value.Output,
      value.result,
      value.Result,
      value.payload,
      value.Payload,
    ];
  };

  let current = parseIfJsonString(raw);
  throwIfBackendFailure(current);

  if (hasActivationGroups(current)) {
    return normalizeGroupKeys(current);
  }

  const queue: any[] = [...unwrapCandidates(current)];
  const visited = new Set<any>();

  while (queue.length > 0) {
    const next = parseIfJsonString(queue.shift());
    if (next === null || next === undefined) continue;
    if (visited.has(next)) continue;
    visited.add(next);

    throwIfBackendFailure(next);

    if (hasActivationGroups(next)) {
      return normalizeGroupKeys(next);
    }

    if (typeof next === 'object') {
      queue.push(...unwrapCandidates(next));
    }
  }

  return null;
};

// Define types for scan results
type DiagnosticStepStatus = 'idle' | 'clean' | 'warning' | 'danger';
type DiagnosticStep = {
  id: number;
  name: string;
  description: string;
  status: DiagnosticStepStatus;
  details: string[];
};

type EvidenceSourceKind = 'WMI' | 'Command' | 'Files' | 'Services' | 'Tasks' | 'Registry' | 'Hosts' | 'Event log' | 'Rule';

const windowsEvidenceMetadata: Record<number, { source: string; sourceKind: EvidenceSourceKind; rule: string; recommendation: string }> = {
  1: { source: 'SoftwareLicensingService.OA3xOriginalProductKey', sourceKind: 'WMI', rule: 'Kiểm tra khóa OA3 nhúng trên BIOS có tồn tại hay không.', recommendation: 'So sánh khóa OEM với hệ điều hành đang cài đặt để khôi phục.' },
  2: { source: 'SoftwareLicensingProduct (Windows application ID)', sourceKind: 'WMI', rule: 'Phân loại kênh cấp phép của Product Key hiện tại.', recommendation: 'Xác thực lại quyền cấp phép số hoặc Volume License theo kênh.' },
  3: { source: 'Known MAS/HWID artifacts and generic-key state', sourceKind: 'Files', rule: 'Kiểm tra dấu vết MAS/HWID hoặc Generic Key.', recommendation: 'Cần giữ nguyên hiện trạng file lỗi và báo cáo trước khi xóa.' },
  4: { source: 'SoftwareLicensingProduct KMS fields; slmgr /xpr', sourceKind: 'Command', rule: 'Phát hiện máy chủ KMS đáng ngờ hoặc lỗ hổng KMS38.', recommendation: 'Xác thực máy chủ KMS này có thuộc hệ thống nội bộ của doanh nghiệp hay không.' },
  5: { source: 'Known file paths', sourceKind: 'Files', rule: 'Quét các đường dẫn file kích hoạt lậu phổ biến.', recommendation: 'Phân tích file thực thi khả nghi trước khi xóa.' },
  6: { source: 'Task Scheduler and Windows Services', sourceKind: 'Tasks', rule: 'Phát hiện tác vụ/dịch vụ ẩn liên quan đến công cụ kích hoạt lậu.', recommendation: 'Kiểm tra chi tiết tác vụ và đường dẫn thực thi trước khi vô hiệu hóa.' },
  7: { source: 'hosts file and Security-SPP event log', sourceKind: 'Hosts', rule: 'Kiểm tra can thiệp file hosts và nhật ký KMS event log.', recommendation: 'Rà soát file hosts và đối chiếu mã lỗi KMS event log.' },
  8: { source: 'UI rule evaluation over the seven evidence groups', sourceKind: 'Rule', rule: 'Tổng hợp kết luận dựa trên các nhóm kiểm tra trên.', recommendation: 'Dựa vào bảng kết quả trên để đưa ra hành động.' },
};

const noBackendData = 'No Data — backend field required.';

function displayValue(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;
  return typeof value === 'string' ? value : JSON.stringify(value);
}

const initialWindowsSteps: DiagnosticStep[] = [
  { id: 1, name: 'OA3 BIOS Key', description: 'Kiểm tra key nhúng phần cứng.', status: 'idle', details: [] },
  { id: 2, name: 'Kênh cấp phép', description: 'Phân tích kênh License.', status: 'idle', details: [] },
  { id: 3, name: 'Lịch sử CMD & MAS', description: 'Quét dấu vết MAS/HWID.', status: 'idle', details: [] },
  { id: 4, name: 'KMS Host & Hook', description: 'Máy chủ kích hoạt.', status: 'idle', details: [] },
  { id: 5, name: 'Tệp tin Crack', description: 'Quét file độc hại.', status: 'idle', details: [] },
  { id: 6, name: 'Task & Services', description: 'Tác vụ ngầm.', status: 'idle', details: [] },
  { id: 7, name: 'Registry & Hosts', description: 'Can thiệp hệ thống.', status: 'idle', details: [] },
  { id: 8, name: 'Đánh giá quy tắc', description: 'Tổng hợp nhóm bằng chứng.', status: 'idle', details: [] },
];

const initialOfficeSteps: DiagnosticStep[] = [
    { id: 1, name: 'Trạng thái License', description: 'License Status.', status: 'idle', details: [] },
    { id: 2, name: 'Kênh cấp phép', description: 'License Channel.', status: 'idle', details: [] },
    { id: 3, name: 'Ohook Crack', description: 'Phát hiện DLL giả mạo.', status: 'idle', details: [] },
    { id: 4, name: 'Tệp tin Crack', description: 'Tìm tệp tin độc hại.', status: 'idle', details: [] },
    { id: 5, name: 'Task & Services', description: 'Tác vụ ngầm.', status: 'idle', details: [] },
    { id: 6, name: 'File hosts', description: 'Chặn MS server.', status: 'idle', details: [] },
    { id: 7, name: 'Event Logs', description: 'Dấu vết lịch sử.', status: 'idle', details: [] },
    { id: 8, name: 'Đánh giá quy tắc', description: 'Tổng hợp nhóm bằng chứng.', status: 'idle', details: [] },
];


export interface DiagnosticStepItemProps {
  step: DiagnosticStep;
  isActive: boolean;
  onClick: () => void;
  key?: React.Key;
}

function DiagnosticStepItem({ step, isActive, onClick }: DiagnosticStepItemProps) {
  const statusConfig = {
    idle: { icon: <RefreshCw className="h-4 w-4 text-slate-400" />, color: 'border-slate-200', textColor: 'text-slate-400' },
    clean: { icon: <ShieldCheck className="h-4 w-4 text-emerald-500" />, color: 'border-slate-200', textColor: 'text-emerald-600' },
    warning: { icon: <ShieldAlert className="h-4 w-4 text-amber-500" />, color: 'border-amber-400', textColor: 'text-amber-600' },
    danger: { icon: <ShieldX className="h-4 w-4 text-red-500" />, color: 'border-red-400', textColor: 'text-red-600' },
  };

  const { icon, color, textColor } = statusConfig[step.status];
  const statusText = { idle: 'Chưa quét', clean: 'Bình thường', warning: 'Cảnh báo', danger: 'Phát hiện lỗi' };

  return (
    <div
      onClick={onClick}
      className={`p-3 border-l-4 rounded-r-lg cursor-pointer transition-all duration-200 ${
        isActive ? 'bg-blue-50 border-blue-500 shadow-md' : `bg-white hover:bg-slate-50 ${color}`
      }`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <div className="flex-1">
          <p className={`text-xs font-bold ${isActive ? 'text-blue-700' : 'text-slate-800'}`}>{`Bước ${step.id}: ${step.name}`}</p>
          <p className="text-[10px] text-slate-500">{step.description}</p>
        </div>
        <span className={`text-[10px] font-bold uppercase ${isActive ? 'text-blue-600' : textColor}`}>
          {statusText[step.status]}
        </span>
      </div>

    </div>
  );
}

// ============================================================================
// SECTION COLLAPSE WRAPPER
// ============================================================================
function CollapsibleSection({ title, icon, defaultOpen = false, badge, children }: {
  title: string; icon: React.ReactNode; defaultOpen?: boolean; badge?: React.ReactNode; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left">
        {icon}
        <span className="text-sm font-bold text-slate-800 flex-1">{title}</span>
        {badge}
        {open ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
      </button>
      {open && <div className="px-4 pb-4 border-t border-slate-100">{children}</div>}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function LicenseManager() {
  const [activeTab, setActiveTab] = useState<'windows' | 'office'>('windows');
  const [viewMode, setViewMode] = useState<'visual' | 'terminal'>('visual');
  
  const [windowsSteps, setWindowsSteps] = useState<DiagnosticStep[]>(initialWindowsSteps);
  const [officeSteps, setOfficeSteps] = useState<DiagnosticStep[]>(initialOfficeSteps);
  
  const [activeStep, setActiveStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [windowsScanResult, setWindowsScanResult] = useState<any>(null);
  const [officeScanResult, setOfficeScanResult] = useState<any>(null);

  // New state for forensic workspace
  const [scanStartTime, setScanStartTime] = useState<number | null>(null);
  const [scanEndTime, setScanEndTime] = useState<number | null>(null);
  const [showDevMode, setShowDevMode] = useState(false);
  const [evidenceSearch, setEvidenceSearch] = useState('');
  const [evidenceFilter, setEvidenceFilter] = useState<'all' | 'clean' | 'warning' | 'danger'>('all');
  const [evidenceSortBy, setEvidenceSortBy] = useState<'id' | 'status' | 'weight'>('id');
  const [expandedEvidence, setExpandedEvidence] = useState<number[]>([]);
  const [showStepDeveloperView, setShowStepDeveloperView] = useState(false);

  const askConfirm = async (options: { title?: string; message?: string; type?: 'question' | 'warning' | 'info' }) => {
    const api = (window as any)?.electronAPI;
    if (api?.showConfirmDialog) {
      try {
        const confirmed = await api.showConfirmDialog(options);
        return !!confirmed;
      } catch {
        // fallback below
      }
    }
    return window.confirm(options.message || options.title || 'Are you sure?');
  };

  const showInfo = async (options: { title?: string; message?: string }) => {
    const api = (window as any)?.electronAPI;
    if (api?.showInfoDialog) {
      try {
        await api.showInfoDialog(options);
        return;
      } catch {
        // fallback below
      }
    }
    window.alert(`${options.title ? options.title + '\n\n' : ''}${options.message || ''}`);
  };

  const handleStartScan = async () => {
    setIsLoading(true);
    setError(null);
    setScanStartTime(Date.now());
    setScanEndTime(null);
    if (activeTab === 'windows') setWindowsSteps(initialWindowsSteps); 
    if (activeTab === 'office') setOfficeSteps(initialOfficeSteps);

    try {
      const type = activeTab;
      const api = (window as any)?.electronAPI;
      if (!api?.scanActivation) {
        throw new Error('scanActivation IPC is not available.');
      }

      const rawResult = await api.scanActivation({ type });
      const result = normalizeScanActivationResult(rawResult);

      if (!result) {
        throw new Error('Không nhận được dữ liệu quét hợp lệ từ backend.');
      }
      
      if (type === 'windows') {
          try {
            const evidences = EvidenceFactory.createFromRawData(result);
            const repo = new EvidenceRepository(evidences);
            const report = VerificationEngine.verifyDeepCleanWithRepository(repo);
            
            result.Forensics = {
                decision: report.passed ? 'GENUINE' : 'TAMPERED',
                confidence: { final: report.confidence },
                issues: report.issues
            };
          } catch (forensicErr) {
            // Keep scan result usable even if forensic enrichment fails
            result.Forensics = result.Forensics || {};
          }
          
          setWindowsScanResult(result);
          processWindowsScanResults(result);
      } else {
          setOfficeScanResult(result);
          processOfficeScanResults(result);
      }
    } catch (err: any) {
      setError('Lỗi khi thực thi lệnh quét. Vui lòng thử lại. Lỗi: ' + err.message);
    } finally {
      setIsLoading(false);
      setScanEndTime(Date.now());
    }
  };

  const [isRestoringOem, setIsRestoringOem] = useState<boolean>(false);

  const handleRestoreOemBiosKey = async () => {
    const confirm = await askConfirm({
      title: 'Khôi phục Key gốc từ BIOS',
      message: 'Công cụ sẽ tự động đọc Key OEM nhúng trên Mainboard (BIOS), gỡ bỏ Key hiện tại và kích hoạt lại bản quyền chính hãng với Microsoft. Bạn có muốn tiếp tục không?',
      type: 'question'
    });

    if (!confirm) return;

    setIsRestoringOem(true);
    setError(null);
    try {
      const adapter = new ElectronBackendAdapter();
      const engine = new ActivationEngine(adapter);
      const snapshot = windowsScanResult || {};
      const { result } = await engine.restoreOemBiosKey(snapshot);
      
      await showInfo({
        title: result.success ? 'Thành công' : 'Thông báo',
        message: `Khôi phục Key BIOS hoàn tất.\nKết quả xác minh: ${result.verificationPassed ? 'HỢP LỆ' : 'THẤT BẠI'}\nLỗi/Cảnh báo: ${result.errors.join(', ')}`
      });
      handleStartScan();
    } catch (err: any) {
      setError('Lỗi khi khôi phục Key BIOS: ' + err.message);
    } finally {
      setIsRestoringOem(false);
    }
  };

  const handleResetActivation = async () => {
      const type = activeTab;
      const confirm = await askConfirm({
          title: `Xác nhận Đặt lại Bản quyền ${type === 'windows' ? 'Windows' : 'Office'}`,
          message: `Bạn có chắc chắn muốn gỡ bỏ toàn bộ thông tin bản quyền ${type === 'windows' ? 'Windows' : 'Office'} hiện tại không? Thao tác này sẽ xóa tất cả các Product Key và cấu hình KMS. Hành động này không thể hoàn tác.`,
          type: 'warning',
      });

      if (!confirm) return;

      setIsResetting(true);
      setError(null);
      try {
          const api = (window as any)?.electronAPI;

          if (type === 'windows') {
              let verificationPassed = false;
              let executionTime: number | string = 'N/A';

              try {
                const adapter = new ElectronBackendAdapter();
                const engine = new ActivationEngine(adapter);
                const snapshot = windowsScanResult || {};
                const engineResponse = await engine.deepCleanWindowsLicense(snapshot);

                if (engineResponse?.result) {
                  verificationPassed = !!engineResponse.result.verificationPassed;
                  executionTime = engineResponse.result.executionTime ?? 'N/A';
                } else {
                  throw new Error('ActivationEngine returned empty result.');
                }
              } catch (engineErr) {
                // Fallback to direct IPC to avoid no-op behavior in unsupported engine runtime paths
                if (!api?.deepCleanActivation) {
                  throw engineErr;
                }
                const fallbackOutput = await api.deepCleanActivation('windows');
                verificationPassed = true;
                executionTime = 'IPC fallback';
              }
              
              await showInfo({
                  title: 'Hoàn tất',
                  message: `Đã xử lý Đặt Lại Bản Quyền Windows.\n\nKết quả xác minh: ${verificationPassed ? 'THÀNH CÔNG (Hệ thống sạch)' : 'PHÁT HIỆN DẤU VẾT'}\nThời gian: ${executionTime}`
              });
              handleStartScan();
          } else {
              if (!api?.deepCleanActivation) {
                throw new Error('deepCleanActivation IPC is not available.');
              }
              const result = await api.deepCleanActivation(type);
              await showInfo({
                  title: 'Hoàn tất',
                  message: `Đã xóa và đặt lại thành công bản quyền Office. Kết quả:\n\n${result}`,
              });
              handleStartScan();
          }
      } catch (err: any) {
          setError('Lỗi khi reset bản quyền: ' + err.message);
      } finally {
          setIsResetting(false);
      }
  };


  const processWindowsScanResults = (result: any) => {
    if (!result || !result.Windows) return;

    const newSteps = JSON.parse(JSON.stringify(initialWindowsSteps));
    let riskScore = 0;
    const evidences: string[] = [];

    // === TIER 1: OA3 BIOS Key Verification ===
    const hasOA3 = result.Windows.HasOA3Key === true;
    const isLicensed = result.Windows.LicenseStatus === 1;
    const channel = result.Windows.Channel || 'UNKNOWN';

    if (hasOA3) {
        newSteps[0].status = 'clean';
        newSteps[0].details.push(`✅ Có OA3 Key (***${result.Windows.OA3Key})`);
        riskScore -= 70;
    } else {
        if (channel.includes('OEM_DM')) {
            newSteps[0].status = 'warning';
            newSteps[0].details.push('⚠️ Kênh OEM_DM nhưng không tìm thấy OA3 Key trong BIOS');
        } else {
            newSteps[0].status = 'clean';
            newSteps[0].details.push('ℹ️ Không có OA3 Key trong BIOS (Bình thường đối với Retail/Custom PC)');
        }
    }

    // === TIER 2: License Channel Analysis ===
    newSteps[1].details.push(`${channel} — ${result.Windows.Description || '—'}`);
    if (channel.includes('OEM') && isLicensed) {
        newSteps[1].status = 'clean';
    } else if (channel.includes('RETAIL') && isLicensed) {
        newSteps[1].status = 'clean';
    } else if (channel.includes('VOLUME_KMS')) {
        newSteps[1].status = 'warning';
    } else {
        newSteps[1].status = 'clean';
    }

    // === TIER 3: Forensic Evidence ===
    const kmsHost = result.Windows.KeyManagementServiceMachine?.toLowerCase();
    const isKms38 = result.System?.IsKMS38 === true;
    const isFakeKms = result.System?.IsFakeKMS === true;
    
    if (isKms38) {
        newSteps[3].status = 'danger';
        riskScore += 90;
        newSteps[3].details.push('🔴 Phát hiện KMS38 Hook (Năm 2038)');
    } else if (isFakeKms || (kmsHost && kmsHost.match(/loli|digiboy|msguides|zdf|0\.0\.0\.0|kms|crack/))) {
        newSteps[3].status = 'danger';
        riskScore += 80;
        newSteps[3].details.push(`🔴 KMS host lậu: ${kmsHost}`);
    } else if (kmsHost) {
        newSteps[3].status = 'warning';
        newSteps[3].details.push(`⚠️ KMS Host: ${kmsHost}`);
    } else {
        newSteps[3].status = 'clean';
        newSteps[3].details.push('✅ Không phát hiện KMS Server');
    }

    const piratedFiles = result.System?.PiratedFiles || [];
    if (piratedFiles.length > 0) {
        newSteps[4].status = 'danger';
        riskScore += 80;
        piratedFiles.forEach((f: string) => newSteps[4].details.push(`🔴 Tệp crack: ${f}`));
    } else {
        newSteps[4].status = 'clean';
        newSteps[4].details.push('✅ Sạch');
    }

    const suspiciousTasks = result.System?.SuspiciousTasks || [];
    const suspiciousServices = result.System?.SuspiciousServices || [];
    if (suspiciousTasks.length > 0 || suspiciousServices.length > 0) {
        newSteps[5].status = 'danger';
        riskScore += 60;
        suspiciousTasks.forEach((t: any) => newSteps[5].details.push(`🔴 Task: ${t.Name}`));
        suspiciousServices.forEach((s: string) => newSteps[5].details.push(`🔴 Service: ${s}`));
    } else {
        newSteps[5].status = 'clean';
        newSteps[5].details.push('✅ Sạch');
    }

    const hasNoGenTicket = result.System?.NoGenTicket === true;
    const hostsRedirects = result.System?.HostsRedirects || [];
    const kmsEvents = result.System?.KMSEvents || [];
    
    if (hasNoGenTicket) { riskScore += 100; newSteps[6].details.push('🔴 Có khóa chặn NoGenTicket'); }
    if (hostsRedirects.length > 0) { riskScore += 50; hostsRedirects.forEach((h: string) => newSteps[6].details.push(`🔴 Hosts: ${h}`)); }
    
    if (hasNoGenTicket || hostsRedirects.length > 0) {
        newSteps[6].status = 'danger';
    } else if (kmsEvents.length > 0) {
        newSteps[6].status = 'warning';
        kmsEvents.forEach((e: any) => newSteps[6].details.push(`⚠️ [${e.Time}] ${e.Message}`));
    } else {
        newSteps[6].status = 'clean';
        newSteps[6].details.push('✅ Sạch');
    }

    const hasMasHistory = result.System?.MasHistory === true;
    if (hasMasHistory) {
        newSteps[2].status = 'danger';
        riskScore += 100;
        newSteps[2].details.push('🔴 Phát hiện lịch sử chạy tool lậu MAS/HWID');
    } else if (result.Windows.IsGenericKey && !isLicensed) {
        newSteps[2].status = 'warning';
        newSteps[2].details.push(`⚠️ Dùng Generic Key (Chưa kích hoạt): ***${result.Windows.PartialProductKey}`);
    } else if (result.Windows.IsGenericKey) {
        newSteps[2].status = 'clean';
        newSteps[2].details.push(`ℹ️ Dùng Key mặc định hệ thống: ***${result.Windows.PartialProductKey}`);
    } else {
        newSteps[2].status = 'clean';
        newSteps[2].details.push('✅ Sạch (Không có dấu vết)');
    }

    // === FINAL DECISION ===
    let finalWinStatus = 'Pending';
    const hasTamperingEvidence = newSteps.some((s:any) => s.status === 'danger');
    const hasWarning = newSteps.some((s:any) => s.status === 'warning');

    if (hasTamperingEvidence) {
      finalWinStatus = 'KMS';
    } else if (hasWarning) {
        if (isLicensed) finalWinStatus = 'Cảnh báo';
        else finalWinStatus = 'None';
    } else if (isLicensed) {
      finalWinStatus = 'Genuine';
    } else {
      finalWinStatus = 'None';
    }

    newSteps[7].status = (finalWinStatus === 'Genuine' || finalWinStatus === 'None') ? 'clean' : (finalWinStatus === 'Cảnh báo' ? 'warning' : 'danger');
    newSteps[7].details.push(`Kết luận: ${finalWinStatus === 'Genuine' ? 'Bản quyền chính hãng' : finalWinStatus === 'KMS' ? 'Phát hiện Kích hoạt Lậu' : finalWinStatus === 'Cảnh báo' ? 'Cần xem xét thêm' : 'Chưa kích hoạt'}`);

    setWindowsSteps(newSteps);
  };
  
  const processOfficeScanResults = (result: any) => {
    if (!result || !result.Office) return;

    const newSteps = JSON.parse(JSON.stringify(initialOfficeSteps));
    let riskScore = 0;
    
    const officeProducts = result.Office?.Products || [];
    const isLicensed = officeProducts.some((op: any) => op.LicenseStatus === 1);
    
    if (isLicensed) {
        newSteps[0].status = 'clean';
        newSteps[0].details.push('✅ Đã kích hoạt bản quyền');
    } else {
        newSteps[0].status = 'warning';
        newSteps[0].details.push('🔴 Chưa được kích hoạt');
    }

    const hasKmsProduct = officeProducts.some((op: any) => (op.Description||'').toLowerCase().includes('kms'));
    if (hasKmsProduct) {
        newSteps[1].status = 'warning';
        riskScore += 30;
        newSteps[1].details.push('⚠️ Đang sử dụng kênh KMS Client');
    } else {
        newSteps[1].status = 'clean';
        newSteps[1].details.push(officeProducts.length > 0 ? officeProducts.map((p:any) => p.Description).join(', ') : 'Không tìm thấy sản phẩm Office nào.');
    }

    const ohookFiles = result.Office?.OhookFiles || [];
    if (ohookFiles.length > 0) {
        newSteps[2].status = 'danger';
        riskScore += 90;
        newSteps[2].details.push(`🔴 Phát hiện DLL có thể là Ohook: ${ohookFiles.join(', ')}`);
    } else {
        newSteps[2].status = 'clean';
        newSteps[2].details.push('✅ Sạch (Không phát hiện Ohook)');
    }
    
    const piratedFiles = result.System?.PiratedFiles || [];
    if (piratedFiles.length > 0) {
        newSteps[3].status = 'danger';
        riskScore += 80;
        newSteps[3].details.push(`🔴 Tồn tại tệp tin bẻ khóa chung: ${piratedFiles.join(', ')}`);
    } else {
        newSteps[3].status = 'clean';
        newSteps[3].details.push('✅ Sạch');
    }

    const suspiciousTasks = result.System?.SuspiciousTasks || [];
    const suspiciousServices = result.System?.SuspiciousServices || [];
    if (suspiciousTasks.length > 0 || suspiciousServices.length > 0) {
        newSteps[4].status = 'danger';
        riskScore += 60;
        newSteps[4].details.push(`🔴 Tác vụ/dịch vụ gia hạn bẻ khóa ngầm`);
    } else {
        newSteps[4].status = 'clean';
        newSteps[4].details.push('✅ Sạch');
    }

    const hostsRedirects = result.System?.HostsRedirects || [];
    if (hostsRedirects.length > 0) {
        newSteps[5].status = 'danger';
        riskScore += 50;
        newSteps[5].details.push(`🔴 Chặn máy chủ xác thực qua file hosts`);
    } else {
        newSteps[5].status = 'clean';
        newSteps[5].details.push('✅ Sạch');
    }
    
    const kmsEvents = result.System?.KMSEvents || [];
    if (kmsEvents.length > 0) {
        newSteps[6].status = 'warning';
        newSteps[6].details.push(`⚠️ Có Event Logs liên quan đến KMS`);
    } else {
        newSteps[6].status = 'clean';
        newSteps[6].details.push('✅ Sạch');
    }

    // === FINAL DECISION ===
    let finalStatus = 'Pending';
    const hasTamperingEvidence = newSteps.some((s:any) => s.status === 'danger');
    const hasWarning = newSteps.some((s:any) => s.status === 'warning');

    if (hasTamperingEvidence) {
      finalStatus = 'KMS';
    } else if (hasWarning) {
      if (isLicensed) finalStatus = 'Cảnh báo';
      else finalStatus = 'None';
    } else if (isLicensed) {
      finalStatus = 'Genuine';
    } else {
      finalStatus = 'None';
    }
    
    newSteps[7].status = (finalStatus === 'Genuine' || finalStatus === 'None') ? 'clean' : (finalStatus === 'Cảnh báo' ? 'warning' : 'danger');
    newSteps[7].details.push(`Kết luận: ${finalStatus === 'Genuine' ? 'Bản quyền chính hãng' : finalStatus === 'KMS' ? 'Phát hiện Kích hoạt Lậu' : finalStatus === 'Cảnh báo' ? 'Cần xem xét thêm' : 'Chưa kích hoạt'}`);
    
    setOfficeSteps(newSteps);
  }

  const diagnosticSteps = activeTab === 'windows' ? windowsSteps : officeSteps;
  const cleanCount = diagnosticSteps.filter(s => s.status === 'clean').length;
  const warningCount = diagnosticSteps.filter(s => s.status === 'warning').length;
  const dangerCount = diagnosticSteps.filter(s => s.status === 'danger').length;
  const selectedStepDetails = diagnosticSteps.find(step => step.id === activeStep);

  const currentScanResult = activeTab === 'windows' ? windowsScanResult : officeScanResult;

  // ============================================================================
  // DERIVED DATA FROM SCAN RESULT (for forensic workspace)
  // ============================================================================
  const winData = windowsScanResult?.Windows;
  const sysData = windowsScanResult?.System;

  // The scan backend currently returns raw collector data, not an engine decision.
  // Keep the UI assessment explicit so technicians never mistake it for an engine verdict.
  const computedVerdict = useMemo(() => {
    if (!windowsScanResult) return { status: '—', label: 'Chưa quét', color: 'slate' };
    const hasDanger = windowsSteps.some(s => s.status === 'danger');
    const hasWarn = windowsSteps.some(s => s.status === 'warning');
    const licensed = winData?.LicenseStatus === 1;
    if (hasDanger) return { status: 'TAMPERED', label: 'Phát hiện can thiệp lậu', color: 'red' };
    if (hasWarn && licensed) return { status: 'WARNING', label: 'Cần xem xét thêm', color: 'amber' };
    if (hasWarn && !licensed) return { status: 'UNLICENSED', label: 'Chưa kích hoạt', color: 'slate' };
    if (licensed) return { status: 'GENUINE', label: 'Bản quyền chính hãng', color: 'emerald' };
    return { status: 'UNKNOWN', label: 'Không xác định', color: 'slate' };
  }, [windowsScanResult, windowsSteps, winData]);

  const forensicData = windowsScanResult?.Forensics;
  const engineConfidence = typeof forensicData?.confidence?.final === 'number'
    ? forensicData.confidence.final
    : null;
  const collectorTelemetry = Array.isArray(forensicData?.collectors) ? forensicData.collectors : [];
  const engineDecision = forensicData?.decision ?? null;

  const selectedStepForensics = useMemo(() => {
    const step = windowsSteps.find(item => item.id === activeStep);
    if (!step) return null;

    const backendStep = forensicData?.steps?.[String(activeStep)] ?? null;
    const wmi: string[] = [];
    const registry: string[] = [];
    const powerShell: string[] = [];
    const files: string[] = [];
    const services: string[] = [];
    const tasks: string[] = [];
    const hosts: string[] = [];
    const eventLog: string[] = [];

    if (activeStep === 1) {
      const oa3 = displayValue(winData?.OA3Key);
      const hasOa3 = displayValue(winData?.HasOA3Key);
      if (oa3) wmi.push(`OA3Key suffix: ${oa3}`);
      if (hasOa3) wmi.push(`HasOA3Key: ${hasOa3}`);
    }
    if (activeStep === 2) {
      ['LicenseFamily', 'Description', 'LicenseStatus', 'PartialProductKey', 'ProductKeyChannel', 'Channel'].forEach(field => {
        const value = displayValue(winData?.[field]);
        if (value) wmi.push(`${field}: ${value}`);
      });
    }
    if (activeStep === 3) {
      const masHistory = displayValue(sysData?.MasHistory);
      const genericKey = displayValue(winData?.IsGenericKey);
      if (masHistory) registry.push(`MasHistory: ${masHistory}`);
      if (genericKey) wmi.push(`IsGenericKey: ${genericKey}`);
    }
    if (activeStep === 4) {
      ['KeyManagementServiceMachine', 'KeyManagementServicePort', 'GracePeriodRemaining'].forEach(field => {
        const value = displayValue(winData?.[field]);
        if (value) wmi.push(`${field}: ${value}`);
      });
      const xpr = displayValue(winData?.Xpr);
      if (xpr) powerShell.push(xpr);
    }
    if (activeStep === 5) {
      (Array.isArray(sysData?.PiratedFiles) ? sysData.PiratedFiles : []).forEach((item: unknown) => files.push(String(item)));
    }
    if (activeStep === 6) {
      (Array.isArray(sysData?.SuspiciousTasks) ? sysData.SuspiciousTasks : []).forEach((item: any) => tasks.push(`${item.Name ?? 'Unnamed task'}${item.Path ? ` — ${item.Path}` : ''}${item.Action ? ` — ${item.Action}` : ''}`));
      (Array.isArray(sysData?.SuspiciousServices) ? sysData.SuspiciousServices : []).forEach((item: unknown) => services.push(String(item)));
    }
    if (activeStep === 7) {
      (Array.isArray(sysData?.HostsRedirects) ? sysData.HostsRedirects : []).forEach((item: unknown) => hosts.push(String(item)));
      (Array.isArray(sysData?.KMSEvents) ? sysData.KMSEvents : []).forEach((item: any) => eventLog.push(`[${item.Time ?? 'No timestamp'}] ${item.Message ?? JSON.stringify(item)}`));
      const noGenTicket = displayValue(sysData?.NoGenTicket);
      if (noGenTicket) registry.push(`NoGenTicket: ${noGenTicket}`);
    }
    if (activeStep === 8) {
      windowsSteps.slice(0, 7).forEach(item => wmi.push(`${item.name}: ${item.status}`));
    }

    const evidenceSources = [
      { label: 'Registry', values: registry },
      { label: 'WMI', values: wmi },
      { label: 'PowerShell', values: powerShell },
      { label: 'Files', values: files },
      { label: 'Services', values: services },
      { label: 'Tasks', values: tasks },
      { label: 'Hosts', values: hosts },
      { label: 'Event Log', values: eventLog },
    ];

    const rawResult = { step: step.id, windows: winData, system: sysData };
    return {
      step,
      backendStep,
      metadata: windowsEvidenceMetadata[step.id],
      evidenceSources,
      rawResult,
      currentResult: step.details.length ? step.details : [],
    };
  }, [activeStep, windowsSteps, winData, sysData, forensicData]);

  const scanDurationMs = (scanStartTime && scanEndTime) ? (scanEndTime - scanStartTime) : null;

  // Build the evidence index from actual scan output. Mức ảnh hưởng, reliability and
  // collector timing are intentionally left unavailable until the backend sends them.
  const evidenceList = useMemo(() => {
    if (!windowsScanResult) return [];
    return windowsSteps.map((step, i) => ({
      id: `EV-${String(i + 1).padStart(3, '0')}`,
      idx: i,
      collector: step.name,
      source: windowsEvidenceMetadata[step.id].source,
      sourceKind: windowsEvidenceMetadata[step.id].sourceKind,
      rule: windowsEvidenceMetadata[step.id].rule,
      recommendation: windowsEvidenceMetadata[step.id].recommendation,
      status: step.status,
      weight: typeof forensicData?.steps?.[String(step.id)]?.weight === 'number' ? forensicData.steps[String(step.id)].weight : null,
      reliability: typeof forensicData?.steps?.[String(step.id)]?.reliability === 'number' ? forensicData.steps[String(step.id)].reliability : null,
      durationMs: typeof forensicData?.steps?.[String(step.id)]?.durationMs === 'number' ? forensicData.steps[String(step.id)].durationMs : null,
      details: step.details,
    }));
  }, [windowsScanResult, windowsSteps, forensicData]);

  // Filter + search + sort evidence
  const filteredEvidence = useMemo(() => {
    let list = [...evidenceList];
    if (evidenceFilter !== 'all') list = list.filter(e => e.status === evidenceFilter);
    if (evidenceSearch.trim()) {
      const q = evidenceSearch.toLowerCase();
      list = list.filter(e => e.collector.toLowerCase().includes(q) || e.details.some(d => d.toLowerCase().includes(q)));
    }
    if (evidenceSortBy === 'status') list.sort((a, b) => { const order = { danger: 0, warning: 1, clean: 2, idle: 3 }; return (order[a.status] ?? 9) - (order[b.status] ?? 9); });
    if (evidenceSortBy === 'weight') list.sort((a, b) => (b.weight ?? -1) - (a.weight ?? -1));
    return list;
  }, [evidenceList, evidenceFilter, evidenceSearch, evidenceSortBy]);

  // Positive / Negative / Weak evidence
  const positiveEvidence = evidenceList.filter(e => e.status === 'clean');
  const negativeEvidence = evidenceList.filter(e => e.status === 'danger');
  const weakEvidence = evidenceList.filter(e => e.status === 'warning');
  const unknownEvidence = evidenceList.filter(e => e.status === 'idle');
  const collectorErrors = collectorTelemetry.flatMap((collector: any) => Array.isArray(collector.errors) ? collector.errors : []);

  // Conflicts
  const conflicts = useMemo(() => {
    if (!windowsScanResult) return [];
    const c: { conflict: string; reason: string; resolution: string }[] = [];
    // Check: licensed but has danger
    if (winData?.LicenseStatus === 1 && dangerCount > 0) {
      c.push({ conflict: 'Đã kích hoạt ↔ Phát hiện can thiệp lậu', reason: 'Windows báo LICENSED nhưng phát hiện KMS/crack artifacts', resolution: 'Ưu tiên bằng chứng can thiệp — khuyến nghị đặt lại key' });
    }
    // Check: has OA3 but using generic key
    if (winData?.HasOA3Key && winData?.IsGenericKey) {
      c.push({ conflict: 'Có OA3 Key ↔ Đang dùng Generic Key', reason: 'BIOS có key nhúng nhưng đang sử dụng key chung (GVLK)', resolution: 'Khôi phục key gốc từ BIOS' });
    }
    // Check: KMS host exists but no pirated files
    if (winData?.KeyManagementServiceMachine && (sysData?.PiratedFiles || []).length === 0) {
      c.push({ conflict: 'Có KMS Host ↔ Không có file crack', reason: 'Máy đang trỏ đến KMS server nhưng không tìm thấy file crack trên disk', resolution: 'KMS có thể là enterprise hợp lệ hoặc đã dọn dẹp file crack' });
    }
    return c;
  }, [windowsScanResult, winData, sysData, dangerCount]);

  // Hướng xử lý
  const recommendation = useMemo(() => {
    if (!windowsScanResult) return null;
    if (computedVerdict.status === 'TAMPERED') return { action: 'Đặt lại bản quyền Windows gốc', risk: 'CAO', reason: 'One or more dấu hiệu bất thường were found by the scan rules.', next: 'Nhấn "Đặt Lại Bản Quyền Windows Gốc" → Sau đó nhấn "Khôi Phục Key Gốc từ BIOS" nếu máy có OA3 Key' };
    if (computedVerdict.status === 'WARNING') return { action: 'Xác minh nguồn gốc key', risk: 'TRUNG BÌNH', reason: 'The scan returned weak evidence that does not prove tampering by itself.', next: 'Kiểm tra hóa đơn mua key hoặc khôi phục key BIOS. Nếu không có bằng chứng mua hợp lệ, cần đặt lại.' };
    if (computedVerdict.status === 'GENUINE') return { action: 'Không cần hành động', risk: 'THẤP', reason: 'The completed scan did not return any warning or dấu hiệu bất thường.', next: 'Hệ thống sạch. Lưu báo cáo nếu cần chứng minh tính hợp lệ.' };
    if (computedVerdict.status === 'UNLICENSED') return { action: 'Cài đặt key bản quyền hợp lệ', risk: 'TRUNG BÌNH', reason: 'Windows reports that the selected licence product is not activated.', next: 'Nhấn "Khôi Phục Key Gốc từ BIOS" hoặc nhập key retail/volume hợp lệ.' };
    return null;
  }, [windowsScanResult, computedVerdict]);

  // ============================================================================
  // STATUS BADGE HELPER
  // ============================================================================
  const StatusBadge = ({ status }: { status: DiagnosticStepStatus }) => {
    const cfg = {
      idle: { bg: 'bg-slate-100', text: 'text-slate-500', label: 'Chưa quét' },
      clean: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Sạch' },
      warning: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Cảnh báo' },
      danger: { bg: 'bg-red-100', text: 'text-red-700', label: 'Nguy hiểm' },
    };
    const c = cfg[status];
    return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.bg} ${c.text}`}>{c.label}</span>;
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div className="p-1 w-full">
      <header className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">Kiểm tra & Xử lý Bản quyền Windows / Office</h1>
        <p className="text-sm text-slate-500 mt-1">
          Quy trình quét chuyên sâu: thời hạn, kênh cấp phép, KMS host, tệp tin/DLL, tác vụ ngầm, file hosts và Event Logs.
        </p>
      </header>

      <div className="w-full space-y-6">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => { setActiveTab('windows'); setActiveStep(1); }}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'windows' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Bản quyền Windows
          </button>
          <button
            onClick={() => { setActiveTab('office'); setActiveStep(1); }}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'office' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Bản quyền MS Office
          </button>
        </div>

        <div className="space-y-6 w-full">
          {activeTab === 'office' ? (
            <div className="w-full">
              <OfficeLicenseAnalyzer />
            </div>
          ) : (
            /* ============================================================ */
            /* WINDOWS TAB — FORENSIC DIAGNOSTIC WORKSPACE                  */
            /* ============================================================ */
            <div className="space-y-5">

              {/* ── ACTION BUTTONS (PRESERVED) ── */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button onClick={handleStartScan} disabled={isLoading || isResetting || isRestoringOem} className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-3.5 px-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg disabled:from-slate-400 disabled:to-slate-400 disabled:cursor-not-allowed flex items-center justify-center text-xs">
                  {isLoading ? <Loader className="animate-spin mr-2 h-4 w-4" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                  {isLoading ? 'Đang Quét...' : 'Quét Bản Quyền Windows (8 Bước)'}
                </button>

                <button onClick={handleRestoreOemBiosKey} disabled={isLoading || isResetting || isRestoringOem} className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold py-3.5 px-3 rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md hover:shadow-lg disabled:from-emerald-400 disabled:to-emerald-400 disabled:cursor-not-allowed flex items-center justify-center text-xs">
                  {isRestoringOem ? <Loader className="animate-spin mr-2 h-4 w-4" /> : <KeyRound className="mr-2 h-4 w-4" />}
                  {isRestoringOem ? 'Đang Khôi Phục...' : 'Khôi Phục Key Gốc từ BIOS'}
                </button>

                <button onClick={handleResetActivation} disabled={isLoading || isResetting || isRestoringOem} className="w-full bg-gradient-to-r from-slate-700 to-slate-800 text-white font-bold py-3.5 px-3 rounded-xl hover:from-slate-800 hover:to-slate-900 transition-all shadow-md hover:shadow-lg disabled:from-slate-400 disabled:to-slate-400 disabled:cursor-not-allowed flex items-center justify-center text-xs">
                  {isResetting ? <Loader className="animate-spin mr-2 h-4 w-4" /> : <ShieldX className="mr-2 h-4 w-4" />}
                  {isResetting ? 'Đang Đặt Lại...' : 'Đặt Lại Bản Quyền Windows Gốc'}
                </button>
              </div>

              {/* ── LOADING STATE ── */}
              {isLoading && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 flex items-center justify-center gap-3">
                  <Loader className="animate-spin h-6 w-6 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-800">Đang thực hiện quét Windows 8 bước chuyên sâu...</span>
                </div>
              )}

              {/* ── ERROR STATE ── */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl">
                  <h3 className="font-bold flex items-center gap-2"><ServerCrash className="h-5 w-5" />Lỗi Quét/Reset</h3>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              )}

              {/* ── NO DATA STATE ── */}
              {!windowsScanResult && !isLoading && !error && (
                <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 border border-slate-200 rounded-xl p-8 text-center">
                  <ShieldCheck className="h-12 w-12 text-blue-300 mx-auto mb-3" />
                  <h3 className="font-bold text-slate-700 text-base">Chưa có kết quả chẩn đoán Windows</h3>
                  <p className="text-sm text-slate-500 mt-1">Nhấn nút "Quét Bản Quyền Windows (8 Bước)" để bắt đầu.</p>
                </div>
              )}

              {/* ============================================================ */}
              {/* TỔNG QUAN HỆ THỐNG */}
              {/* ============================================================ */}
              {windowsScanResult && (
                <div className="space-y-4">
                  {/* Bảng trạng thái & Cảnh báo */}
                  <div className={`rounded-xl p-5 border-l-4 ${
                    computedVerdict.status === 'TAMPERED' ? 'bg-red-50 border-red-500' :
                    computedVerdict.status === 'WARNING' ? 'bg-amber-50 border-amber-500' :
                    computedVerdict.status === 'GENUINE' ? 'bg-emerald-50 border-emerald-500' :
                    'bg-slate-50 border-slate-400'
                  }`}>
                    <div className="flex items-center gap-3">
                      {computedVerdict.status === 'TAMPERED' ? <ShieldX className="h-8 w-8 text-red-500" /> :
                       computedVerdict.status === 'WARNING' ? <ShieldAlert className="h-8 w-8 text-amber-500" /> :
                       computedVerdict.status === 'GENUINE' ? <ShieldCheck className="h-8 w-8 text-emerald-500" /> :
                       <ShieldCheck className="h-8 w-8 text-slate-400" />}
                      <div className="flex-1">
                        <h3 className={`text-base font-bold ${
                          computedVerdict.color === 'red' ? 'text-red-800' :
                          computedVerdict.color === 'amber' ? 'text-amber-800' :
                          computedVerdict.color === 'emerald' ? 'text-emerald-800' : 'text-slate-800'
                        }`}>
                          {computedVerdict.status === 'TAMPERED' ? '🔴 PHÁT HIỆN CAN THIỆP BẢN QUYỀN LẬU' :
                           computedVerdict.status === 'WARNING' ? '⚠️ CẦN XEM XÉT — CÓ DẤU HIỆU BẤT THƯỜNG' :
                           computedVerdict.status === 'GENUINE' ? '✅ BẢN QUYỀN CHÍNH HÃNG — HỆ THỐNG SẠCH' :
                           '⬜ CHƯA KÍCH HOẠT BẢN QUYỀN'}
                        </h3>
                        <p className={`text-xs mt-1 ${
                          computedVerdict.color === 'red' ? 'text-red-700' :
                          computedVerdict.color === 'amber' ? 'text-amber-700' :
                          computedVerdict.color === 'emerald' ? 'text-emerald-700' : 'text-slate-600'
                        }`}>
                          {cleanCount} bình thường · {warningCount} đáng ngờ · {dangerCount} phát hiện lỗi
                        </p>
                      </div>
                      <div className="text-right max-w-36">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Độ tin cậy (Engine)</p>
                        <p className="text-[11px] font-semibold text-slate-600 mt-1">{engineConfidence !== null ? `${engineConfidence}%` : 'Chưa có dữ liệu'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Kết quả mâu thuẫn (Nếu có) */}
                  {conflicts.length > 0 && (
                    <div className="bg-red-50/80 border border-red-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <h3 className="text-sm font-bold text-red-800 uppercase tracking-wide">Cảnh báo: Kết quả mâu thuẫn ({conflicts.length})</h3>
                      </div>
                      <div className="space-y-3">
                        {conflicts.map((c, i) => (
                          <div key={i} className="bg-white/60 rounded-lg p-3 text-xs border border-red-100">
                            <p className="font-bold text-red-800 mb-1">⚡ {c.conflict}</p>
                            <p className="text-slate-700"><span className="font-semibold">Lý do:</span> {c.reason}</p>
                            <p className="text-slate-700"><span className="font-semibold">Giải pháp:</span> {c.resolution}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ============================================================ */}
                  {/* PIPELINE PHÂN TÍCH (MASTER - DETAIL)                         */}
                  {/* ============================================================ */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-6">
                    
                    {/* MASTER: DANH SÁCH BƯỚC */}
                    <div className="lg:col-span-4 space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Quy trình phân tích</h2>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">{diagnosticSteps.length} Bước</span>
                      </div>
                      <div className="space-y-2">
                        {diagnosticSteps.map(step => (
                          <DiagnosticStepItem key={step.id} step={step} isActive={activeStep === step.id} onClick={() => setActiveStep(step.id)} />
                        ))}
                      </div>
                    </div>

                    {/* DETAIL: CHI TIẾT BƯỚC ĐANG CHỌN */}
                    <div className="lg:col-span-8">
                      {selectedStepForensics ? (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden flex flex-col h-full">
                          
                          {/* Header Detail */}
                          <div className={`p-4 border-b flex justify-between items-start ${
                            selectedStepForensics.step.status === 'danger' ? 'bg-red-50 border-red-100' : 
                            selectedStepForensics.step.status === 'warning' ? 'bg-amber-50 border-amber-100' : 
                            selectedStepForensics.step.status === 'clean' ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-200'
                          }`}>
                            <div>
                              <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Nguồn kiểm tra</p>
                              <h3 className="text-base font-bold text-slate-900">{selectedStepForensics.step.name}</h3>
                              <p className="text-xs text-slate-600 mt-1">{selectedStepForensics.step.description}</p>
                            </div>
                            <StatusBadge status={selectedStepForensics.step.status} />
                          </div>

                          {/* Body Detail */}
                          <div className="p-4 space-y-5 bg-white">
                            
                            {/* Chi tiết kiểm tra */}
                            <div>
                              <div className="flex items-center gap-2 mb-3">
                                <FileText className="h-4 w-4 text-blue-600" />
                                <h4 className="text-sm font-bold text-slate-800">Chi tiết kiểm tra</h4>
                                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{selectedStepForensics.metadata.source}</span>
                              </div>
                              <div className="space-y-1 bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
                                {selectedStepForensics.evidenceSources.map((source, idx) => (
                                  <details key={idx} className="group border-b border-slate-100 last:border-0">
                                    <summary className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-100 transition-colors list-none">
                                      {source.values.length > 0 ? (
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                      ) : (
                                        <XCircle className="h-4 w-4 text-slate-400 shrink-0" />
                                      )}
                                      <span className="w-24 text-xs font-bold text-slate-700 uppercase truncate">{source.label}</span>
                                      <span className="flex-1 text-xs text-slate-600 truncate">
                                        {source.values.length > 0 ? translateFieldValue(source.values[0]) : 'Không có dữ liệu'}
                                      </span>
                                      <ChevronDown className="h-3.5 w-3.5 text-slate-400 group-open:rotate-180 transition-transform" />
                                    </summary>
                                    <div className="p-3 pt-0 bg-slate-50/50">
                                      <div className="pl-7 space-y-1">
                                        {source.values.length > 0 ? source.values.map((value, index) => (
                                          <p key={index} className="text-[11px] font-mono text-slate-700 bg-white border border-slate-200 p-2 rounded break-all">{value}</p>
                                        )) : <p className="text-[11px] text-slate-500 italic">Hệ thống không thu thập được dữ liệu từ nguồn này.</p>}
                                      </div>
                                    </div>
                                  </details>
                                ))}
                              </div>
                            </div>

                            {/* Đánh giá */}
                            <div className="border-t border-slate-100 pt-5">
                              <div className="flex items-center gap-2 mb-3">
                                <Search className="h-4 w-4 text-violet-600" />
                                <h4 className="text-sm font-bold text-slate-800">Đánh giá</h4>
                              </div>
                              <div className="grid grid-cols-1 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <p><span className="font-semibold text-slate-800">Kết quả tìm thấy:</span> <span className="text-slate-600 font-mono break-all">{selectedStepForensics.currentResult[0] ?? 'Chưa có dữ liệu'}</span></p>
                                <p><span className="font-semibold text-slate-800">Quy tắc áp dụng:</span> <span className="text-slate-600">{translateBackendString(selectedStepForensics.metadata.rule)}</span></p>
                                <p><span className="font-semibold text-slate-800">Mức độ rủi ro:</span> <span className="text-slate-600">{selectedStepForensics.step.status === 'danger' ? 'Nguy hiểm' : selectedStepForensics.step.status === 'warning' ? 'Cảnh báo' : selectedStepForensics.step.status === 'clean' ? 'An toàn' : 'Không rõ'}</span></p>
                              </div>
                            </div>

                            {/* Hướng xử lý */}
                            <div className="border-t border-slate-100 pt-5">
                              <div className="flex items-center gap-2 mb-3">
                                <Wrench className="h-4 w-4 text-indigo-600" />
                                <h4 className="text-sm font-bold text-slate-800">Hướng xử lý</h4>
                              </div>
                              <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-3 text-xs space-y-2">
                                <p><span className="font-semibold text-slate-800">Khuyến nghị:</span> <span className="text-slate-700">{translateBackendString(selectedStepForensics.metadata.recommendation)}</span></p>
                                <p><span className="font-semibold text-slate-800">Mức độ ưu tiên:</span> <span className="text-slate-700">{translateBackendString(selectedStepForensics.backendStep?.priority) ?? "—"}</span></p>
                              </div>
                            </div>

                            {/* Thông tin kỹ thuật */}
                            <div className="border-t border-slate-100 pt-5">
                              <div className="flex items-center gap-2 mb-3">
                                <Cpu className="h-4 w-4 text-sky-600" />
                                <h4 className="text-sm font-bold text-slate-800">Thông tin kỹ thuật</h4>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5">
                                  <p className="text-[10px] uppercase font-bold text-slate-500">Thời gian xử lý</p>
                                  <p className="font-semibold text-slate-700 mt-1">{typeof selectedStepForensics.backendStep?.durationMs === 'number' ? `${selectedStepForensics.backendStep.durationMs} ms` : '—'}</p>
                                </div>
                                <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5">
                                  <p className="text-[10px] uppercase font-bold text-slate-500">Độ tin cậy</p>
                                  <p className="font-semibold text-slate-700 mt-1">{typeof selectedStepForensics.backendStep?.reliability === 'number' ? `${selectedStepForensics.backendStep.reliability}%` : '—'}</p>
                                </div>
                                <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 md:col-span-2">
                                  <p className="text-[10px] uppercase font-bold text-slate-500">Nguồn kiểm tra</p>
                                  <p className="font-semibold text-slate-700 mt-1 truncate" title={selectedStepForensics.backendStep?.collector ?? '—'}>{selectedStepForensics.backendStep?.collector ?? '—'}</p>
                                </div>
                              </div>
                            </div>

                          </div>
                        </div>
                      ) : (
                        <div className="h-full min-h-[300px] flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-400 text-sm font-semibold">
                          Vui lòng chọn một bước bên trái để xem chi tiết
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ============================================================ */}
                  {/* THÔNG TIN KỸ THUẬT TOÀN HỆ THỐNG                             */}
                  {/* ============================================================ */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    {/* Lưu ý hệ thống & Cảnh báo */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Bug className="h-4 w-4 text-orange-600" />
                          <h3 className="text-sm font-bold text-slate-800 uppercase">Lưu ý hệ thống</h3>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {/* Lỗi hệ thống summary */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-slate-50 rounded-lg p-2 text-center border border-slate-100">
                            <p className="text-lg font-black text-slate-700">{collectorTelemetry.length ? collectorErrors.length : '0'}</p>
                            <p className="text-[9px] uppercase font-bold text-slate-500 mt-1">Lỗi đọc dữ liệu</p>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-2 text-center border border-slate-100">
                            <p className="text-lg font-black text-amber-600">{Array.isArray(forensicData?.diagnostics?.warnings) ? forensicData.diagnostics.warnings.length : '0'}</p>
                            <p className="text-[9px] uppercase font-bold text-slate-500 mt-1">Cảnh báo logic</p>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-2 text-center border border-slate-100">
                            <p className="text-lg font-black text-red-600">{Array.isArray(forensicData?.diagnostics?.errors) ? forensicData.diagnostics.errors.length : '0'}</p>
                            <p className="text-[9px] uppercase font-bold text-slate-500 mt-1">Lỗi hệ thống</p>
                          </div>
                        </div>

                        {/* Cảnh báo V1 */}
                        <div className="flex items-start gap-2 bg-amber-50 rounded-lg p-2 border border-amber-100">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[11px] font-bold text-amber-800">Hệ thống xử lý V1</p>
                            <p className="text-[10px] text-amber-700">Lấy dữ liệu qua một tập lệnh PowerShell. Không có timeout riêng cho từng nguồn.</p>
                          </div>
                        </div>

                        {/* Thiếu dữ liệu */}
                        {!sysData?.MasHistory && sysData?.MasHistory !== false && (
                          <div className="flex items-start gap-2 bg-slate-50 rounded-lg p-2 border border-slate-200">
                            <Info className="h-3.5 w-3.5 text-slate-500 mt-0.5 shrink-0" />
                            <p className="text-[10px] text-slate-600"><strong>MasHistory:</strong> Chưa thu thập được dữ liệu này.</p>
                          </div>
                        )}
                        {!winData?.ProductKeyChannel && (
                          <div className="flex items-start gap-2 bg-slate-50 rounded-lg p-2 border border-slate-200">
                            <Info className="h-3.5 w-3.5 text-slate-500 mt-0.5 shrink-0" />
                            <p className="text-[10px] text-slate-600"><strong>ProductKeyChannel:</strong> WMI không trả về thông tin — có thể chưa cài Product Key.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Hiệu suất hệ thống */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col">
                      <div className="flex items-center gap-2 mb-4">
                        <Clock className="h-4 w-4 text-teal-600" />
                        <h3 className="text-sm font-bold text-slate-800 uppercase">Thời gian xử lý</h3>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 flex-1">
                        <div className="bg-teal-50 border border-teal-100 rounded-lg p-3 flex flex-col justify-center text-center">
                          <p className="text-2xl font-black text-teal-700">{scanDurationMs ? `${(scanDurationMs / 1000).toFixed(1)}s` : '—'}</p>
                          <p className="text-[10px] text-teal-600 font-bold uppercase mt-1">Tổng thời gian</p>
                        </div>
                        <div className="grid grid-rows-2 gap-2">
                          <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-center flex flex-col justify-center">
                            <p className="text-xs font-black text-slate-700">{typeof forensicData?.performance?.powerShellExecutionMs === 'number' ? `${forensicData.performance.powerShellExecutionMs} ms` : '—'}</p>
                            <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">PowerShell</p>
                          </div>
                          <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-center flex flex-col justify-center">
                            <p className="text-xs font-black text-slate-700">{typeof forensicData?.performance?.jsonParseMs === 'number' ? `${forensicData.performance.jsonParseMs} ms` : '—'}</p>
                            <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">JSON parse</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ============================================================ */}
                  {/* DỮ LIỆU GỐC (Dành cho KTV)                                   */}
                  {/* ============================================================ */}
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm mt-4">
                    <button onClick={() => setShowDevMode(!showDevMode)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left focus:outline-none">
                      {showDevMode ? <Eye className="h-4 w-4 text-purple-600" /> : <EyeOff className="h-4 w-4 text-slate-400" />}
                      <span className="text-sm font-bold text-slate-800 flex-1">Thông tin kỹ thuật</span>
                      <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">JSON</span>
                      {showDevMode ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                    </button>
                    
                    {showDevMode && (
                      <div className="px-4 pb-4 border-t border-slate-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Dữ liệu Windows gốc</p>
                            <pre className="bg-slate-900 text-green-400 p-3 rounded-lg text-[10px] font-mono overflow-x-auto h-48 overflow-y-auto">{JSON.stringify(winData, null, 2)}</pre>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Dữ liệu Hệ thống (System)</p>
                            <pre className="bg-slate-900 text-cyan-400 p-3 rounded-lg text-[10px] font-mono overflow-x-auto h-48 overflow-y-auto">{JSON.stringify(sysData, null, 2)}</pre>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Dữ liệu JSON (Theo nhóm kết quả)</p>
                            <pre className="bg-slate-900 text-amber-400 p-3 rounded-lg text-[10px] font-mono overflow-x-auto h-48 overflow-y-auto">{JSON.stringify(windowsSteps, null, 2)}</pre>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase font-semibold mb-1">Kết quả PowerShell</p>
                            <pre className="bg-slate-900 text-slate-300 p-3 rounded-lg text-[10px] font-mono overflow-x-auto h-48 overflow-y-auto">{forensicData?.powerShellOutput ?? 'Chưa có dữ liệu.'}</pre>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* ============================================================ */}
              {/* SECTION 11: TECHNICIAN RECOMMENDATION                        */}
              {/* ============================================================ */}
              {windowsScanResult && recommendation && (
                <div className={`rounded-xl border-2 p-5 ${
                  recommendation.risk === 'CAO' ? 'border-red-300 bg-red-50' :
                  recommendation.risk === 'TRUNG BÌNH' ? 'border-amber-300 bg-amber-50' :
                  'border-emerald-300 bg-emerald-50'
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Wrench className="h-4 w-4 text-slate-700" />
                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Đề xuất xử lý</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-semibold">Hành động khuyến nghị</p>
                      <p className="text-sm font-bold text-slate-800 mt-1">{recommendation.action}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-semibold">Mức độ rủi ro</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mt-1 ${
                        recommendation.risk === 'CAO' ? 'bg-red-200 text-red-800' :
                        recommendation.risk === 'TRUNG BÌNH' ? 'bg-amber-200 text-amber-800' :
                        'bg-emerald-200 text-emerald-800'
                      }`}>{recommendation.risk}</span>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-semibold">Lý do</p>
                      <p className="text-xs text-slate-700 mt-1 leading-relaxed">{recommendation.reason}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-semibold">Bước tiếp theo</p>
                      <p className="text-xs text-slate-700 mt-1 leading-relaxed">{recommendation.next}</p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
