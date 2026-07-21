import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, ShieldAlert, Scan, Trash2, Download, Terminal, CheckCircle2, AlertTriangle, Play, HelpCircle, FileText, Check, X } from 'lucide-react';
import { generateWinActivationScript, generateOfficeActivationScript, downloadFile } from '../utils/scriptGenerator';

export interface ScanStep {
  id: number;
  name: string;
  description: string;
  status: 'pending' | 'clean' | 'warning' | 'danger';
  details: string | string[];
}

const initialSteps: ScanStep[] = [
  { id: 1, name: 'Bước 1: Quét thời hạn kích hoạt (Expiration)', description: 'Kiểm tra ngày hết hạn của bản quyền hệ thống.', status: 'pending', details: '' },
  { id: 2, name: 'Bước 2: Phân tích Kênh cấp phép (License Channel)', description: 'Xác định loại giấy phép (Retail, OEM, hay Volume).', status: 'pending', details: '' },
  { id: 3, name: 'Bước 3: Xác định máy chủ KMS Host', description: 'Kiểm tra xem máy chủ kích hoạt có phải giả lập lậu hay không.', status: 'pending', details: [] },
  { id: 4, name: 'Bước 4: Quét tệp tin & DLL bẻ khóa (Inject Files)', description: 'Tìm các tệp tin độc hại, DLL của công cụ bẻ khóa.', status: 'pending', details: [] },
  { id: 5, name: 'Bước 5: Quét Task Scheduler & Services', description: 'Phát hiện các tác vụ và dịch vụ duy trì bẻ khóa chạy ngầm.', status: 'pending', details: [] },
  { id: 6, name: 'Bước 6: Kiểm tra chuyển hướng tệp hosts', description: 'Kiểm tra hành vi chặn máy chủ xác thực của Microsoft.', status: 'pending', details: [] },
  { id: 7, name: 'Bước 7: Truy vết Event Logs (Nhật ký hệ thống)', description: 'Quét nhật ký sự kiện Event Viewer để tìm dấu vết lịch sử.', status: 'pending', details: [] },
  { id: 8, name: 'Bước 8: Phân tích chữ ký số phần cứng (HWID)', description: 'Phân loại chứng chỉ số dựa trên Key dùng chung.', status: 'pending', details: [] },
];

type TabType = 'windows' | 'office';
type StatusType = 'Pending' | 'Genuine' | 'KMS' | 'None' | 'Warning';

interface ScanStatus {
  scanned: boolean;
  scanning: boolean;
  scanType: string;
  status: StatusType;
  logs: string[];
  progress: number;
}

const defaultScanStatus: ScanStatus = {
  scanned: false, scanning: false, scanType: 'deep',
  status: 'Pending', logs: [], progress: 0,
};

// ─── Hero Status Banner ──────────────────────────────────────────
function StatusBanner({ status, scanning, tab }: { status: StatusType; scanning: boolean; tab: TabType }) {
  if (scanning) return null;

  const configs: Record<StatusType, { bg: string; border: string; icon: React.ReactNode; title: string; desc: string; badge: string; badgeBg: string }> = {
    Pending: {
      bg: 'from-slate-50 to-slate-100', border: 'border-slate-200',
      icon: <Scan className="h-10 w-10 text-slate-400" />,
      title: 'Chưa xác định — Cần quét',
      desc: 'Nhấn nút bên dưới để hệ thống phân tích bản quyền chính xác của bạn qua 8 bước kiểm tra.',
      badge: 'CHƯA QUÉT', badgeBg: 'bg-slate-200 text-slate-600',
    },
    Genuine: {
      bg: 'from-emerald-50 to-green-50', border: 'border-emerald-200',
      icon: <ShieldCheck className="h-10 w-10 text-emerald-600" />,
      title: tab === 'windows' ? 'Windows Bản Quyền Chính Hãng' : 'Microsoft Office Chính Hãng',
      desc: 'Giấy phép kích hoạt kỹ thuật số an toàn tuyệt đối từ Microsoft. Không phát hiện tàn dư bẻ khóa.',
      badge: '✓ SẠCH', badgeBg: 'bg-emerald-100 text-emerald-700',
    },
    Warning: {
      bg: 'from-yellow-50 to-amber-50', border: 'border-yellow-300',
      icon: <AlertTriangle className="h-10 w-10 text-yellow-600" />,
      title: tab === 'windows' ? 'Bản Quyền Hợp Lệ Nhưng Có Rác Lậu' : 'Phát Hiện Tàn Dư Bẻ Khóa',
      desc: 'Hệ điều hành có bản quyền nhưng phát hiện tàn dư (tasks/files) của công cụ bẻ khóa đang chạy ngầm.',
      badge: '⚠ CẢNH BÁO', badgeBg: 'bg-yellow-100 text-yellow-700',
    },
    KMS: {
      bg: 'from-amber-50 to-orange-50', border: 'border-amber-300',
      icon: <ShieldAlert className="h-10 w-10 text-amber-600" />,
      title: tab === 'windows' ? 'Phát Hiện Kích Hoạt KMS Lậu' : 'Phát Hiện Office KMS Lậu',
      desc: 'Phát hiện mã kích hoạt KMS giả lập. Có thể chứa nguy cơ bảo mật. Nên dọn dẹp và kích hoạt chính hãng.',
      badge: '⚠ KMS', badgeBg: 'bg-amber-100 text-amber-700',
    },
    None: {
      bg: 'from-red-50 to-rose-50', border: 'border-red-200',
      icon: <AlertTriangle className="h-10 w-10 text-red-500" />,
      title: 'Chưa Kích Hoạt / Key Đã Xoá',
      desc: 'Không tìm thấy khoá sản phẩm hợp lệ hoặc khoá đã được gỡ sạch hoàn toàn khỏi hệ thống.',
      badge: '✗ KHÔNG CÓ', badgeBg: 'bg-red-100 text-red-700',
    },
  };

  const cfg = configs[status];
  return (
    <div className={`relative rounded-xl border ${cfg.border} bg-gradient-to-br ${cfg.bg} p-5 flex items-center gap-4 overflow-hidden`}>
      <div className="absolute right-0 top-0 h-full w-32 bg-white/20 blur-2xl pointer-events-none" />
      <div className="shrink-0 p-3 bg-white rounded-xl shadow-sm border border-white/80">
        {cfg.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${cfg.badgeBg}`}>{cfg.badge}</span>
        </div>
        <h3 className="text-base font-extrabold text-slate-900 leading-tight">{cfg.title}</h3>
        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{cfg.desc}</p>
      </div>
    </div>
  );
}

// ─── Scan Progress Bar ───────────────────────────────────────────
function ScanProgress({ scanning, progress }: { scanning: boolean; progress: number }) {
  if (!scanning) return null;
  return (
    <div className="bg-white rounded-xl border border-blue-100 p-4 space-y-2">
      <div className="flex justify-between items-center text-xs">
        <span className="font-semibold text-blue-700 flex items-center gap-1.5">
          <Scan className="h-3.5 w-3.5 animate-pulse" /> Đang quét bản quyền...
        </span>
        <span className="font-mono font-bold text-blue-600">{progress}%</span>
      </div>
      <div className="w-full h-2 bg-blue-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export default function ActivationScanner() {
  const [winStatus, setWinStatus] = useState<ScanStatus>(defaultScanStatus);
  const [officeStatus, setOfficeStatus] = useState<ScanStatus>(defaultScanStatus);
  const [winSteps, setWinSteps] = useState<ScanStep[]>(initialSteps);
  const [officeSteps, setOfficeSteps] = useState<ScanStep[]>(initialSteps);
  const [selectedStepId, setSelectedStepId] = useState<number | null>(1);
  const [viewMode, setViewMode] = useState<'steps' | 'terminal'>('steps');
  const [activeTab, setActiveTab] = useState<TabType>('windows');

  const simulateProgress = (setFn: React.Dispatch<React.SetStateAction<ScanStatus>>) => {
    let p = 0;
    const id = setInterval(() => {
      p += Math.floor(Math.random() * 18) + 8;
      if (p >= 90) { clearInterval(id); return; }
      setFn(prev => ({ ...prev, progress: Math.min(p, 90) }));
    }, 400);
    return id;
  };

  const startWinScan = async (type: string) => {
    setWinStatus({ ...defaultScanStatus, scanning: true });
    setWinSteps(initialSteps);
    const progressId = simulateProgress(setWinStatus);

    const isElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined;
    if (isElectron) {
      try {
        setWinStatus(prev => ({ ...prev, logs: ['[*] Đang truy vấn trạng thái bản quyền hệ thống thực tế (WMI/CIM)...'] }));
        const data = await (window as any).electronAPI.scanActivation();
        clearInterval(progressId);
        
        if (!data || !data.Windows) throw new Error("Dữ liệu trả về bị lỗi.");

        let riskScore = 0;
        const evidences: string[] = [];

        // === TIER 1: OA3 BIOS Key Verification ===
        const hasOA3 = data.Windows.HasOA3Key === true;
        const xprLower = data.Windows.Xpr?.toLowerCase() || '';
        const descLower = data.Windows.Description?.toLowerCase() || '';
        const isLicensed = data.Windows.LicenseStatus === 1;
        const isPermanent = xprLower.includes('permanently') || xprLower.includes('vĩnh viễn');
        const channel = data.Windows.Channel || 'UNKNOWN';

        if (hasOA3) {
          riskScore -= 70;
          evidences.push('✓ TIER 1: Phát hiện Product Key nhúng trong BIOS/UEFI (OA3) — Bằng chứng phần cứng chính hãng (-70)');
        } else {
          evidences.push('ℹ TIER 1: Không có Product Key OA3 trong BIOS (Máy tự build hoặc đã thay key)');
        }

        // === TIER 2: License Channel Analysis ===
        let t2Status: 'clean'|'warning'|'danger' = 'clean';
        if (channel === 'OEM' && isLicensed && isPermanent) {
          if (hasOA3) {
            riskScore -= 30;
            evidences.push('✓ TIER 2: Kênh OEM + BIOS Key xác thực — Chính hãng tuyệt đối (-30)');
          } else if (!data.Windows.IsGenericKey) {
            riskScore -= 20;
            evidences.push('✓ TIER 2: Kênh OEM, Key không phải Generic — Có thể hợp lệ (-20)');
          } else {
            riskScore += 40;
            t2Status = 'warning';
            evidences.push('⚠ TIER 2: Kênh OEM nhưng dùng Generic Key + không có OA3 — Dấu hiệu HWID Crack (+40)');
          }
        } else if (channel === 'RETAIL' && isLicensed && isPermanent) {
          if (!data.Windows.IsGenericKey) {
            riskScore -= 30;
            evidences.push('✓ TIER 2: Bản quyền Retail với Key riêng — Chính hãng (-30)');
          } else {
            riskScore += 40;
            t2Status = 'warning';
            evidences.push('⚠ TIER 2: Kênh Retail nhưng dùng Generic Key — Dấu hiệu HWID Crack (+40)');
          }
        } else if (channel === 'VOLUME_KMSCLIENT') {
          riskScore += 50;
          t2Status = 'danger';
          evidences.push('⚠ TIER 2: Kênh VOLUME_KMSCLIENT — Dấu hiệu KMS Crack hoặc Enterprise (+50)');
        } else if (channel === 'VOLUME_MAK' && isLicensed) {
          riskScore -= 10;
          t2Status = 'warning';
          evidences.push('ℹ TIER 2: Kênh VOLUME_MAK — Doanh nghiệp hợp lệ (-10)');
        }

        if (isLicensed && !data.Windows.KeyManagementServiceMachine) {
          riskScore -= 10;
          evidences.push('✓ Không sử dụng máy chủ KMS nội bộ (-10)');
        }

        // === TIER 3: Forensic Evidence ===
        const kmsHost = data.Windows.KeyManagementServiceMachine?.toLowerCase();
        let s3Status: 'clean'|'warning'|'danger' = 'clean';
        if (kmsHost) {
          if (kmsHost.match(/loli|digiboy|msguides|zdf|kms\.|0\.0\.0\.0/)) {
            riskScore += 60;
            s3Status = 'danger';
            evidences.push('⚠ TIER 3: Phát hiện Public KMS Server lậu: ' + kmsHost + ' (+60)');
          } else {
            s3Status = 'warning';
            evidences.push('ℹ TIER 3: Có máy chủ KMS (có thể là doanh nghiệp hợp lệ): ' + kmsHost);
          }
        }

        if (data.System.PiratedFiles.length > 0) {
          riskScore += 80;
          evidences.push('⚠ TIER 3: Tồn tại tệp tin bẻ khóa (AutoKMS/SECOH): ' + data.System.PiratedFiles.join(', ') + ' (+80)');
        }
        if (data.System.SuspiciousTasks.length > 0) {
          const taskNames = data.System.SuspiciousTasks.map((t:any) => t.Name).join(', ');
          riskScore += 60;
          evidences.push('⚠ TIER 3: Tồn tại tác vụ gia hạn bẻ khóa ngầm: ' + taskNames + ' (+60)');
        }
        if (data.System.SuspiciousServices.length > 0) {
          riskScore += 50;
          evidences.push('⚠ TIER 3: Tồn tại dịch vụ bẻ khóa: ' + data.System.SuspiciousServices.join(', ') + ' (+50)');
        }
        if (data.System.HostsRedirects.length > 0) {
          riskScore += 50;
          evidences.push('⚠ TIER 3: Chặn máy chủ xác thực qua file hosts (+50)');
        }
        if (data.System.TSforgeTrace) {
          riskScore += 70;
          evidences.push('⚠ TIER 3: Phát hiện dấu vết TSforge Crack trong Registry (+70)');
        }
        
        // === FINAL DECISION ===
        let finalWinStatus: StatusType = 'Pending';
        if (riskScore >= 60) {
          finalWinStatus = 'KMS';
          evidences.push('🔴 KẾT LUẬN: Phát hiện kích hoạt lậu (Risk Score = ' + riskScore + ')');
        } else if (riskScore > 0 || evidences.some(e => e.includes('⚠'))) {
          if (isLicensed) {
            finalWinStatus = 'Warning';
            evidences.push('🟡 KẾT LUẬN: Bản quyền hợp lệ nhưng có dấu hiệu đáng ngờ (Risk Score = ' + riskScore + ')');
          } else {
            finalWinStatus = 'None';
            evidences.push('⚠ Hệ thống chưa kích hoạt và có dấu hiệu đáng ngờ.');
          }
        } else if (isLicensed) {
          finalWinStatus = 'Genuine';
          evidences.push('🟢 KẾT LUẬN: Bản quyền chính hãng xác thực (Risk Score = ' + riskScore + ')');
        } else {
          finalWinStatus = 'None';
          evidences.push('✗ Hệ thống chưa được kích hoạt bản quyền.');
        }

        const realLogs = [
          '[*] BẮT ĐẦU QUÉT BẢN QUYỀN WINDOWS (RISK ENGINE V3 — 3 TẦNG XÁC MINH)...',
          `[TIER 1] OA3 BIOS Key: ${hasOA3 ? 'CÓ (***' + data.Windows.OA3Key + ')' : 'KHÔNG CÓ'}`,
          `[TIER 2] Kênh cấp phép: ${channel} | Mô tả: ${data.Windows.Description || 'N/A'}`,
          `[TIER 2] Generic Key: ${data.Windows.IsGenericKey ? 'CÓ (' + data.Windows.PartialProductKey + ')' : 'KHÔNG'}`,
          `[TIER 2] Trạng thái: ${isLicensed ? 'Licensed' : 'Unlicensed'} | Thời hạn: ${isPermanent ? 'Vĩnh viễn' : 'Có hạn'}`,
          `[TIER 3] KMS Host: ${kmsHost || 'Sạch (Không phát hiện)'}`,
          `[TIER 3] Tệp tin crack: ${data.System.PiratedFiles.join(', ') || 'Sạch'}`,
          `[TIER 3] Task & Dịch vụ: ${data.System.SuspiciousTasks.length + data.System.SuspiciousServices.length > 0 ? data.System.SuspiciousTasks.map((t:any) => t.Name).join(', ') : 'Sạch'}`,
          `[TIER 3] File hosts: ${data.System.HostsRedirects.join(', ') || 'Sạch'}`,
          `[TIER 3] Event Log: ${data.System.KMSEvents.length} sự kiện KMS.`,
          `[TIER 3] TSforge: ${data.System.TSforgeTrace ? 'PHÁT HIỆN' : 'Sạch'}`,
          `=> TỔNG ĐIỂM RỦI RO (RISK SCORE): ${riskScore}`,
          'BẰNG CHỨNG GIẢI THÍCH (EXPLAINABLE AI):',
          ...evidences.map(e => `  ${e}`),
          '[+] QUÉT HOÀN TẤT!'
        ];

        let s1: 'clean'|'warning'|'danger' = hasOA3 ? 'clean' : 'warning';
        let s2: 'clean'|'warning'|'danger' = t2Status;

        const updatedSteps: ScanStep[] = [
          { id: 1, name: 'Bước 1: OA3 BIOS Key', description: 'Kiểm tra key nhúng phần cứng.', status: s1, details: hasOA3 ? 'Có OA3 Key (***' + data.Windows.OA3Key + ')' : 'Không có OA3 Key trong BIOS' },
          { id: 2, name: 'Bước 2: Kênh cấp phép', description: 'Phân tích kênh License.', status: s2, details: `${channel} — ${data.Windows.Description || 'N/A'}` },
          { id: 3, name: 'Bước 3: Generic Key', description: 'Kiểm tra Key dùng chung.', status: data.Windows.IsGenericKey ? 'danger' : 'clean', details: data.Windows.IsGenericKey ? 'Generic Key: ***' + data.Windows.PartialProductKey : 'Key riêng (Không phải Generic)' },
          { id: 4, name: 'Bước 4: KMS Host', description: 'Máy chủ kích hoạt.', status: s3Status, details: kmsHost || 'Không phát hiện' },
          { id: 5, name: 'Bước 5: Tệp tin Crack', description: 'Quét file độc hại.', status: data.System.PiratedFiles.length > 0 ? 'danger' : 'clean', details: data.System.PiratedFiles.length > 0 ? data.System.PiratedFiles : 'Sạch' },
          { id: 6, name: 'Bước 6: Task & Services', description: 'Tác vụ ngầm.', status: (data.System.SuspiciousTasks.length + data.System.SuspiciousServices.length) > 0 ? 'danger' : 'clean', details: (data.System.SuspiciousTasks.length > 0 ? data.System.SuspiciousTasks.map((t:any) => t.Name) : []).concat(data.System.SuspiciousServices) },
          { id: 7, name: 'Bước 7: File hosts & Events', description: 'Chặn MS & lịch sử.', status: data.System.HostsRedirects.length > 0 ? 'danger' : data.System.KMSEvents.length > 0 ? 'warning' : 'clean', details: data.System.HostsRedirects.length > 0 ? data.System.HostsRedirects : data.System.KMSEvents.length > 0 ? data.System.KMSEvents.map((e:any) => `[${e.Time}] ${e.Message}`) : 'Sạch' },
          { id: 8, name: 'Bước 8: Tổng điểm Rủi ro', description: 'Risk Score Engine V3.', status: riskScore >= 60 ? 'danger' : riskScore > 0 || evidences.some(e => e.includes('⚠')) ? 'warning' : 'clean', details: evidences },
        ];

        setWinSteps(updatedSteps);
        setWinStatus(prev => ({ ...prev, scanning: false, scanned: true, status: finalWinStatus, logs: realLogs, progress: 100 }));
      } catch (err: any) {
        clearInterval(progressId);
        setWinStatus(prev => ({ ...prev, scanning: false, scanned: true, progress: 100, logs: ['[ERROR] Không thể quét Windows: ' + err.message] }));
      }
    } else {
      setTimeout(() => {
        clearInterval(progressId);
        setWinSteps(initialSteps.map(s => ({ ...s, status: 'clean' as const, details: 'Sạch (Demo mode)' })));
        setWinStatus(prev => ({ ...prev, scanning: false, scanned: true, status: 'Genuine', progress: 100, logs: ['[+] Demo: Windows Genuine'] }));
      }, 2500);
    }
  };

  const startOfficeScan = async (type: string) => {
    setOfficeStatus({ ...defaultScanStatus, scanning: true });
    setOfficeSteps(initialSteps);
    const progressId = simulateProgress(setOfficeStatus);

    const isElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined;
    if (isElectron) {
      try {
        setOfficeStatus(prev => ({ ...prev, logs: ['[*] Đang truy vấn trạng thái bản quyền Office thực tế (Risk Engine)...'] }));
        const data = await (window as any).electronAPI.scanActivation();
        clearInterval(progressId);

        let riskScore = 0;
        const evidences: string[] = [];
        
        const dstatusStr = data.Office.Dstatus || '';
        const dLower = dstatusStr.toLowerCase();
        
        const isLicensed = dLower.includes('licensed') && !dLower.includes('unlicensed');

        // === Office WMI Products Analysis ===
        const officeProducts = data.Office.Products || [];
        let hasKmsProduct = false;
        let hasRetailProduct = false;
        for (const op of officeProducts) {
          const opDesc = (op.Description || '').toLowerCase();
          if (opDesc.includes('kmsclient') || opDesc.includes('volume_kms')) {
            hasKmsProduct = true;
          }
          if (opDesc.includes('retail') || opDesc.includes('mak')) {
            hasRetailProduct = true;
          }
        }

        // === TIER 1: License Status ===
        if (isLicensed) {
          if (hasRetailProduct && !hasKmsProduct) {
            riskScore -= 50;
            evidences.push('✓ Bản quyền Office Retail/MAK hợp lệ (-50)');
          } else if (hasKmsProduct) {
            riskScore += 30;
            evidences.push('⚠ Office đang sử dụng kênh KMS Client (+30)');
          } else if (!dLower.includes('kms')) {
            riskScore -= 30;
            evidences.push('✓ Bản quyền Office hợp lệ (Không phải KMS) (-30)');
          } else {
            evidences.push('ℹ Bản quyền Office Volume KMS (Có thể là doanh nghiệp)');
          }
        }

        // === TIER 2: Ohook Detection (MAS Office Crack) ===
        const ohookFiles = data.Office.OhookFiles || [];
        if (ohookFiles.length > 0) {
          riskScore += 90;
          evidences.push('⚠ PHÁT HIỆN Ohook Crack (MAS): ' + ohookFiles.join(', ') + ' (+90)');
        }
        
        // === TIER 3: Forensic Evidence ===
        if (data.System.PiratedFiles.length > 0) {
          riskScore += 80;
          evidences.push('⚠ Tồn tại tệp tin bẻ khóa: ' + data.System.PiratedFiles.join(', ') + ' (+80)');
        }
        if (data.System.SuspiciousTasks.length > 0) {
          const taskNames = data.System.SuspiciousTasks.map((t:any) => t.Name).join(', ');
          riskScore += 60;
          evidences.push('⚠ Tồn tại tác vụ gia hạn bẻ khóa ngầm: ' + taskNames + ' (+60)');
        }
        
        // === FINAL DECISION ===
        let finalStatus: StatusType = 'Pending';
        if (riskScore >= 60) {
          finalStatus = 'KMS';
          evidences.push('🔴 KẾT LUẬN: Phát hiện Office kích hoạt lậu (Risk Score = ' + riskScore + ')');
        } else if (riskScore > 0 || evidences.some(e => e.includes('⚠'))) {
          if (isLicensed) {
            finalStatus = 'Warning';
            evidences.push('🟡 KẾT LUẬN: Office có bản quyền nhưng có dấu hiệu đáng ngờ (Risk Score = ' + riskScore + ')');
          } else {
            finalStatus = 'None';
          }
        }
        else if (isLicensed) {
          finalStatus = 'Genuine';
          evidences.push('🟢 KẾT LUẬN: Bản quyền Office chính hãng (Risk Score = ' + riskScore + ')');
        }
        else finalStatus = 'None';

        const realLogs = [
          '[*] BẮT ĐẦU QUÉT BẢN QUYỀN OFFICE (RISK ENGINE V3)...',
          `[TIER 1] Trạng thái: ${isLicensed ? 'Licensed' : 'Unlicensed'}`,
          `[TIER 1] Sản phẩm WMI: ${officeProducts.length > 0 ? officeProducts.map((p:any) => p.Name).join(', ') : 'Không tìm thấy'}`,
          `[TIER 2] Ohook Files: ${ohookFiles.length > 0 ? ohookFiles.join(', ') : 'Sạch (Không phát hiện)'}`,
          `[TIER 3] Tệp tin crack: ${data.System.PiratedFiles.join(', ') || 'Sạch'}`,
          `[TIER 3] Task & Dịch vụ: ${data.System.SuspiciousTasks.length > 0 ? data.System.SuspiciousTasks.map((t:any) => t.Name).join(', ') : 'Sạch'}`,
          ...dstatusStr.split('\n').map((l: string) => `  > ${l.trim()}`),
          `=> TỔNG ĐIỂM RỦI RO (RISK SCORE): ${riskScore}`,
          'BẰNG CHỨNG GIẢI THÍCH:',
          ...evidences.map(e => `  ${e}`),
          '[+] QUÉT HOÀN TẤT!'
        ];

        let s1: 'clean'|'warning'|'danger' = dLower.includes('grace') ? 'warning' : !isLicensed ? 'danger' : 'clean';
        let s2: 'clean'|'warning'|'danger' = hasKmsProduct ? 'danger' : dLower.includes('kms') || dLower.includes('volume') ? 'warning' : 'clean';
        let s3Ohook: 'clean'|'danger' = ohookFiles.length > 0 ? 'danger' : 'clean';

        const updatedSteps: ScanStep[] = [
          { id: 1, name: 'Bước 1: Trạng thái License', description: 'License Status.', status: s1, details: isLicensed ? 'Licensed' : 'Unlicensed' },
          { id: 2, name: 'Bước 2: Kênh cấp phép', description: 'License Channel.', status: s2, details: officeProducts.length > 0 ? officeProducts.map((p:any) => p.Description).join(' | ') : dstatusStr },
          { id: 3, name: 'Bước 3: Ohook Crack', description: 'Phát hiện DLL giả mạo.', status: s3Ohook, details: ohookFiles.length > 0 ? ohookFiles : 'Sạch (Không phát hiện Ohook)' },
          { id: 4, name: 'Bước 4: Tệp tin Crack', description: 'Tìm tệp tin độc hại.', status: data.System.PiratedFiles.length > 0 ? 'danger' : 'clean', details: data.System.PiratedFiles.length > 0 ? data.System.PiratedFiles : 'Sạch' },
          { id: 5, name: 'Bước 5: Task & Services', description: 'Tác vụ ngầm.', status: (data.System.SuspiciousTasks.length + data.System.SuspiciousServices.length) > 0 ? 'danger' : 'clean', details: (data.System.SuspiciousTasks.length > 0 ? data.System.SuspiciousTasks.map((t:any) => t.Name) : []).concat(data.System.SuspiciousServices) },
          { id: 6, name: 'Bước 6: File hosts', description: 'Chặn MS server.', status: data.System.HostsRedirects.length > 0 ? 'danger' : 'clean', details: data.System.HostsRedirects.length > 0 ? data.System.HostsRedirects : 'Sạch' },
          { id: 7, name: 'Bước 7: Event Logs', description: 'Dấu vết lịch sử.', status: data.System.KMSEvents.length > 0 ? 'warning' : 'clean', details: data.System.KMSEvents.map((e: any) => `[${e.Time}] ${e.Message}`) },
          { id: 8, name: 'Bước 8: Tổng điểm Rủi ro', description: 'Risk Score V3.', status: riskScore >= 60 ? 'danger' : riskScore > 0 ? 'warning' : 'clean', details: evidences },
        ];

        setOfficeSteps(updatedSteps);
        setOfficeStatus(prev => ({ ...prev, scanning: false, scanned: true, status: finalStatus, logs: realLogs, progress: 100 }));
      } catch (err: any) {
        clearInterval(progressId);
        setOfficeStatus(prev => ({ ...prev, scanning: false, scanned: true, progress: 100, logs: ['[ERROR] Không thể quét Office: ' + err.message] }));
      }
    } else {
      setTimeout(() => {
        clearInterval(progressId);
        setOfficeSteps(initialSteps.map(s => ({ ...s, status: 'clean' as const, details: 'Sạch (Demo mode)' })));
        setOfficeStatus(prev => ({ ...prev, scanning: false, scanned: true, status: 'Genuine', progress: 100, logs: ['[+] Demo: Office Genuine'] }));
      }, 2500);
    }
  };

  const handleDeepCleanKMS = async () => {
    if (!window.confirm('BẠN CÓ CHẮC CHẮN MUỐN DỌN DẸP KMS TRUY VẾT?\nThao tác này sẽ gỡ hoàn toàn key Windows, Office và xóa bỏ mọi dịch vụ giả lập lậu!')) return;

    const setStatus = activeTab === 'windows' ? setWinStatus : setOfficeStatus;
    setStatus(prev => ({ ...prev, scanning: true, logs: [...prev.logs, '[!] ĐANG THỰC HIỆN DỌN DẸP KMS CHUYÊN SÂU THỰC TẾ...'] }));
    const isElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined;

    if (isElectron) {
      try {
        const result = await (window as any).electronAPI.deepCleanKms();
        setStatus(prev => ({
          ...prev, status: 'None', scanning: false,
          logs: [...prev.logs, '[*] Đang chạy kịch bản dọn dẹp KMS tổng hợp...', ...result.split('\n').map((l: string) => `  > ${l.trim()}`), '[+] DỌN DẸP HOÀN TẤT THỰC TẾ! Khuyến nghị khởi động lại máy tính.']
        }));
        setWinSteps(initialSteps);
        setOfficeSteps(initialSteps);
        alert('Dọn dẹp tàn dư KMS thành công! Hãy khởi động lại máy để hoàn tất.');
      } catch (err: any) {
        setStatus(prev => ({ ...prev, scanning: false, logs: [...prev.logs, '[ERROR] Lỗi thực thi dọn dẹp: ' + err.message] }));
      }
    } else {
      setTimeout(() => {
        setStatus(prev => ({ ...prev, status: 'None', scanning: false, logs: [...prev.logs, '[+] (UI Demo) Đã chạy script dọn dẹp KMS tổng hợp thành công.'] }));
      }, 1500);
    }
  };

  const currentStatus = activeTab === 'windows' ? winStatus : officeStatus;
  const currentSteps = activeTab === 'windows' ? winSteps : officeSteps;
  const isScanning = currentStatus.scanning;

  return (
    <div className="space-y-5" id="activation-scanner-container">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-emerald-600" />
              Kiểm tra &amp; Xử lý Bản quyền Windows / Office
            </h2>
            <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-2 rounded border border-slate-100">
              Quy trình quét 8 bước chuyên sâu: thời hạn, kênh cấp phép, KMS host, tệp tin/DLL, tác vụ ngầm, file hosts và Event Logs.
            </p>
          </div>

          {/* Tab Switch */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0">
            {(['windows', 'office'] as TabType[]).map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setSelectedStepId(1); }}
                className={`px-4 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${activeTab === tab ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                {tab === 'windows' ? '🪟 Bản quyền Windows' : '📄 Bản quyền MS Office'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Progress Bar (khi đang quét) ───────────────────── */}
      <ScanProgress scanning={isScanning} progress={currentStatus.progress} />

      {/* ── Hero Status Banner ─────────────────────────────── */}
      <StatusBanner status={currentStatus.status} scanning={isScanning} tab={activeTab} />

      {/* ── Main Grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* Left: Actions */}
        <div className="lg:col-span-4 space-y-4">
          {/* Scan Button */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Hành động</h4>

            <button
              onClick={() => activeTab === 'windows' ? startWinScan('deep') : startOfficeScan('deep')}
              disabled={isScanning}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-all cursor-pointer shadow-sm"
            >
              {isScanning ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang quét...</>
              ) : (
                <><Scan className="h-4 w-4" /> Bắt đầu Quét 8 Bước {activeTab === 'windows' ? 'Windows' : 'Office'}</>
              )}
            </button>

            {currentStatus.status === 'KMS' && (
              <button
                onClick={handleDeepCleanKMS}
                disabled={isScanning}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-rose-600 hover:bg-rose-500 disabled:opacity-30 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                <Trash2 className="h-4 w-4" />
                Dọn dẹp Tàn dư KMS ngay
              </button>
            )}


          </div>

          {/* Step Summary Stats */}
          {currentStatus.scanned && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tóm tắt kết quả</h4>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Sạch', count: currentSteps.filter(s => s.status === 'clean').length, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
                  { label: 'Cảnh báo', count: currentSteps.filter(s => s.status === 'warning').length, color: 'text-amber-600 bg-amber-50 border-amber-200' },
                  { label: 'Nguy hiểm', count: currentSteps.filter(s => s.status === 'danger').length, color: 'text-red-600 bg-red-50 border-red-200' },
                ].map(({ label, count, color }) => (
                  <div key={label} className={`flex flex-col items-center p-2 rounded-lg border ${color}`}>
                    <span className="text-xl font-black">{count}</span>
                    <span className="text-[9px] font-bold uppercase">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Steps + Terminal */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* View Mode Toggle */}
          <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-1 flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-blue-600" />
              Kết quả chẩn đoán bản quyền
            </span>
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              {(['steps', 'terminal'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${viewMode === mode ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  <span className="font-semibold">{mode === 'steps' ? '8 Bước Trực Quan' : '📟 Terminal Logs'}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Steps View */}
          {viewMode === 'steps' ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Steps List */}
              <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-1">
                {currentSteps.map((step, idx) => (
                  <button
                    key={step.id}
                    onClick={() => setSelectedStepId(step.id)}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col gap-2 ${
                      selectedStepId === step.id
                        ? 'bg-blue-50 border-blue-300 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    } ${step.status === 'danger' ? 'border-b-4 border-b-red-400' : step.status === 'warning' ? 'border-b-4 border-b-amber-400' : step.status === 'clean' ? 'border-b-4 border-b-emerald-400' : ''}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        {step.status === 'clean' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                        {step.status === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                        {step.status === 'danger' && <ShieldAlert className="h-4 w-4 text-red-500 animate-pulse" />}
                        {step.status === 'pending' && (
                          isScanning
                            ? <div className="h-4 w-4 rounded-full border-2 border-slate-200 border-t-blue-500 animate-spin" />
                            : <div className="h-4 w-4 rounded-full border-2 border-slate-200 bg-slate-100" />
                        )}
                        <span className="text-[11px] font-bold text-slate-800">Bước {step.id}</span>
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        step.status === 'clean' ? 'bg-emerald-100 text-emerald-700' :
                        step.status === 'warning' ? 'bg-amber-100 text-amber-700' :
                        step.status === 'danger' ? 'bg-red-100 text-red-700' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {step.status === 'clean' ? 'Sạch' : step.status === 'warning' ? 'Cảnh báo' : step.status === 'danger' ? 'Nguy hiểm' : 'Chờ'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-slate-700 line-clamp-1">{step.name.split(': ')[1] || step.name}</p>
                      <p className="text-[9px] text-slate-500 line-clamp-2 mt-0.5">{step.description}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Step Detail Panel */}
              <div className="md:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col min-h-[250px]">
                <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2 mb-3">
                  Chi tiết — Bước {selectedStepId}
                </h4>
                <div className="flex-1 overflow-y-auto font-mono text-[10px] text-slate-600 space-y-1.5 max-h-[300px]">
                  {(() => {
                    const step = currentSteps.find(s => s.id === selectedStepId);
                    if (!step || step.status === 'pending') {
                      return <span className="text-slate-400 italic">Vui lòng chạy quét bản quyền để xem báo cáo chi tiết...</span>;
                    }
                    const details = Array.isArray(step.details) ? step.details : [step.details];
                    const isEmpty = details.length === 0 || (details.length === 1 && details[0] === '');
                    if (isEmpty) return <span className="text-emerald-600 font-semibold not-italic font-sans">🟢 Không phát hiện tàn dư độc hại.</span>;
                    return details.map((d, i) => (
                      <div key={i} className={`p-2 rounded-lg border break-all ${step.status === 'danger' ? 'bg-red-50 border-red-200 text-red-800' : step.status === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                        {d}
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          ) : (
            /* Terminal Logs */
            <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-xs flex flex-col min-h-[350px] shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3 text-slate-400 shrink-0">
                <span className="flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5 text-blue-400" />
                  Terminal Logs: Licensing Diagnosis
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                  {activeTab === 'windows' ? 'slmgr.vbs' : 'ospp.vbs'}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-1 max-h-[300px] text-slate-300">
                {currentStatus.logs.length === 0 ? (
                  <span className="text-slate-500 italic">[Hệ thống] Nhấn nút 'Bắt đầu Quét' để xem log...</span>
                ) : (
                  currentStatus.logs.map((log, i) => (
                    <div key={i} className={
                      log.startsWith('[+]') ? 'text-emerald-400' :
                      log.startsWith('[!') ? 'text-rose-400 font-semibold' :
                      log.startsWith('[*]') ? 'text-blue-400' :
                      log.startsWith('[ERROR]') ? 'text-red-400' :
                      'text-slate-300'
                    }>{log}</div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
