
import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, ShieldX, FileText, Terminal, Loader, ServerCrash, RefreshCw, KeyRound } from 'lucide-react';
import OfficeLicenseAnalyzer from './OfficeLicenseAnalyzer';

// Define types for scan results
type DiagnosticStepStatus = 'idle' | 'clean' | 'warning' | 'danger';
type DiagnosticStep = {
  id: number;
  name: string;
  description: string;
  status: DiagnosticStepStatus;
  details: string[];
};

const initialWindowsSteps: DiagnosticStep[] = [
  { id: 1, name: 'OA3 BIOS Key', description: 'Kiểm tra key nhúng phần cứng.', status: 'idle', details: [] },
  { id: 2, name: 'Kênh cấp phép', description: 'Phân tích kênh License.', status: 'idle', details: [] },
  { id: 3, name: 'Lịch sử CMD & MAS', description: 'Quét dấu vết MAS/HWID.', status: 'idle', details: [] },
  { id: 4, name: 'KMS Host & Hook', description: 'Máy chủ kích hoạt.', status: 'idle', details: [] },
  { id: 5, name: 'Tệp tin Crack', description: 'Quét file độc hại.', status: 'idle', details: [] },
  { id: 6, name: 'Task & Services', description: 'Tác vụ ngầm.', status: 'idle', details: [] },
  { id: 7, name: 'Registry & Hosts', description: 'Can thiệp hệ thống.', status: 'idle', details: [] },
  { id: 8, name: 'Tổng điểm Rủi ro', description: 'Risk Score Engine V4.', status: 'idle', details: [] },
];

const initialOfficeSteps: DiagnosticStep[] = [
    { id: 1, name: 'Trạng thái License', description: 'License Status.', status: 'idle', details: [] },
    { id: 2, name: 'Kênh cấp phép', description: 'License Channel.', status: 'idle', details: [] },
    { id: 3, name: 'Ohook Crack', description: 'Phát hiện DLL giả mạo.', status: 'idle', details: [] },
    { id: 4, name: 'Tệp tin Crack', description: 'Tìm tệp tin độc hại.', status: 'idle', details: [] },
    { id: 5, name: 'Task & Services', description: 'Tác vụ ngầm.', status: 'idle', details: [] },
    { id: 6, name: 'File hosts', description: 'Chặn MS server.', status: 'idle', details: [] },
    { id: 7, name: 'Event Logs', description: 'Dấu vết lịch sử.', status: 'idle', details: [] },
    { id: 8, name: 'Tổng điểm Rủi ro', description: 'Risk Score Engine V4.', status: 'idle', details: [] },
];


function DiagnosticStepItem({ step, isActive, onClick }: { step: DiagnosticStep, isActive: boolean, onClick: () => void }) {
  const statusConfig = {
    idle: { icon: <RefreshCw className="h-4 w-4 text-slate-400" />, color: 'border-slate-200', textColor: 'text-slate-400' },
    clean: { icon: <ShieldCheck className="h-4 w-4 text-emerald-500" />, color: 'border-slate-200', textColor: 'text-emerald-600' },
    warning: { icon: <ShieldAlert className="h-4 w-4 text-amber-500" />, color: 'border-amber-400', textColor: 'text-amber-600' },
    danger: { icon: <ShieldX className="h-4 w-4 text-red-500" />, color: 'border-red-400', textColor: 'text-red-600' },
  };

  const { icon, color, textColor } = statusConfig[step.status];
  const statusText = { idle: 'Chưa quét', clean: 'Sạch', warning: 'Cảnh báo', danger: 'Nguy hiểm' };

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

  const handleStartScan = async () => {
    setIsLoading(true);
    setError(null);
    if (activeTab === 'windows') setWindowsSteps(initialWindowsSteps); 
    if (activeTab === 'office') setOfficeSteps(initialOfficeSteps);

    try {
      const type = activeTab;
      const result = await (window as any).electronAPI.scanActivation({ type });
      
      if (type === 'windows') {
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
    }
  };

  const [isRestoringOem, setIsRestoringOem] = useState<boolean>(false);

  const handleRestoreOemBiosKey = async () => {
    const confirm = await (window as any).electronAPI.showConfirmDialog({
      title: 'Khôi phục Key gốc từ BIOS',
      message: 'Công cụ sẽ tự động đọc Key OEM nhúng trên Mainboard (BIOS), gỡ bỏ Key hiện tại và kích hoạt lại bản quyền chính hãng với Microsoft. Bạn có muốn tiếp tục không?',
      type: 'question'
    });

    if (!confirm) return;

    setIsRestoringOem(true);
    setError(null);
    try {
      const res = await (window as any).electronAPI.restoreOemBiosKey();
      await (window as any).electronAPI.showInfoDialog({
        title: res.success ? 'Thành công' : 'Thông báo',
        message: res.message
      });
      if (res.success) {
        handleStartScan();
      }
    } catch (err: any) {
      setError('Lỗi khi khôi phục Key BIOS: ' + err.message);
    } finally {
      setIsRestoringOem(false);
    }
  };

  const handleResetActivation = async () => {
      const type = activeTab;
      const confirm = await (window as any).electronAPI.showConfirmDialog({
          title: `Xác nhận Đặt lại Bản quyền ${type === 'windows' ? 'Windows' : 'Office'}`,
          message: `Bạn có chắc chắn muốn gỡ bỏ toàn bộ thông tin bản quyền ${type === 'windows' ? 'Windows' : 'Office'} hiện tại không? Thao tác này sẽ xóa tất cả các Product Key và cấu hình KMS. Hành động này không thể hoàn tác.`,
          type: 'warning',
      });

      if (!confirm) return;

      setIsResetting(true);
      setError(null);
      try {
          const result = await (window as any).electronAPI.deepCleanActivation(type);
          await (window as any).electronAPI.showInfoDialog({
              title: 'Hoàn tất',
              message: `Đã xóa và đặt lại thành công bản quyền ${type === 'windows' ? 'Windows' : 'Office'}. Kết quả:\n\n${result}`,
          });
          // Rescan after reset
          handleStartScan();
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
        newSteps[0].status = 'warning';
        newSteps[0].details.push('⚠️ Không có OA3 Key trong BIOS');
    }

    // === TIER 2: License Channel Analysis ===
    newSteps[1].details.push(`${channel} — ${result.Windows.Description || 'N/A'}`);
    if (channel.includes('OEM') && isLicensed) {
        if (hasOA3) { riskScore -= 30; newSteps[1].status = 'clean'; }
        else { newSteps[1].status = 'warning'; }
    } else if (channel.includes('RETAIL') && isLicensed) {
        if (!result.Windows.IsGenericKey) { riskScore -= 30; newSteps[1].status = 'clean'; }
        else { newSteps[1].status = 'warning'; }
    } else if (channel.includes('VOLUME_KMS')) {
        newSteps[1].status = 'warning';
    } else {
        newSteps[1].status = 'clean';
    }

    // === TIER 3: Forensic Evidence ===
    const kmsHost = result.Windows.KeyManagementServiceMachine?.toLowerCase();
    const isKms38 = result.Windows.IsKMS38 === true;
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
    } else if (result.Windows.IsGenericKey) {
        newSteps[2].status = 'warning';
        if (!hasOA3) riskScore += 50;
        newSteps[2].details.push(`⚠️ Dùng Generic Key: ***${result.Windows.PartialProductKey}`);
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
        if (isLicensed) finalWinStatus = 'Warning';
        else finalWinStatus = 'None';
    } else if (isLicensed) {
      finalWinStatus = 'Genuine';
    } else {
      finalWinStatus = 'None';
    }

    newSteps[7].status = (finalWinStatus === 'Genuine' || finalWinStatus === 'None') ? 'clean' : (finalWinStatus === 'Warning' ? 'warning' : 'danger');
    newSteps[7].details.push(`Kết luận: ${finalWinStatus === 'Genuine' ? 'Bản quyền chính hãng' : finalWinStatus === 'KMS' ? 'Phát hiện Kích hoạt Lậu' : finalWinStatus === 'Warning' ? 'Cần xem xét thêm' : 'Chưa kích hoạt'}`);
    newSteps[7].details.push(`Risk Score V4: ${riskScore}`);

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
      if (isLicensed) finalStatus = 'Warning';
      else finalStatus = 'None';
    } else if (isLicensed) {
      finalStatus = 'Genuine';
    } else {
      finalStatus = 'None';
    }
    
    newSteps[7].status = (finalStatus === 'Genuine' || finalStatus === 'None') ? 'clean' : (finalStatus === 'Warning' ? 'warning' : 'danger');
    newSteps[7].details.push(`Kết luận: ${finalStatus === 'Genuine' ? 'Bản quyền chính hãng' : finalStatus === 'KMS' ? 'Phát hiện Kích hoạt Lậu' : finalStatus === 'Warning' ? 'Cần xem xét thêm' : 'Chưa kích hoạt'}`);
    newSteps[7].details.push(`Risk Score V4: ${riskScore}`);
    
    setOfficeSteps(newSteps);
  }

  const diagnosticSteps = activeTab === 'windows' ? windowsSteps : officeSteps;
  const cleanCount = diagnosticSteps.filter(s => s.status === 'clean').length;
  const warningCount = diagnosticSteps.filter(s => s.status === 'warning').length;
  const dangerCount = diagnosticSteps.filter(s => s.status === 'danger').length;
  const totalScore = warningCount + dangerCount * 5;

  const selectedStepDetails = diagnosticSteps.find(step => step.id === activeStep);

  const currentScanResult = activeTab === 'windows' ? windowsScanResult : officeScanResult;

  const MainResultCard = () => {
    const isWindows = activeTab === 'windows';
    const currentResultObj = isWindows ? currentScanResult?.Windows : currentScanResult?.Office;
    const isLicensed = isWindows 
      ? currentResultObj?.LicenseStatus === 1 
      : (currentResultObj?.Products || []).some((p: any) => p.LicenseStatus === 1);
    const hasProductKey = isWindows 
      ? !!currentResultObj?.PartialProductKey 
      : (currentResultObj?.Products || []).some((p: any) => !!p.PartialProductKey);

    if (isLoading) return (
        <div className="bg-slate-50 border border-slate-200 text-slate-800 p-4 rounded-lg flex items-center justify-center">
            <Loader className="animate-spin mr-3 h-5 w-5" />
            <h3 className="font-bold">Đang thực hiện quét {isWindows ? 'Windows' : 'MS Office'} 8 bước chuyên sâu...</h3>
        </div>
    );
    if (error) return (
         <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
            <h3 className="font-bold flex items-center gap-2"><ServerCrash className="h-5 w-5" />Lỗi Quét/Reset</h3>
            <p className="text-sm mt-1">{error}</p>
        </div>
    );
    if (!currentScanResult) return (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg">
            <h3 className="font-bold">Chưa có kết quả chẩn đoán {isWindows ? 'Windows' : 'MS Office'}</h3>
            <p className="text-sm mt-1">Nhấn nút "Quét Bản Quyền {isWindows ? 'Windows' : 'MS Office'}" bên dưới để kiểm tra độc lập.</p>
        </div>
    );

    // Tier 1: Danger (Active Crack / KMS / Ohook / Crack tasks)
    if (dangerCount > 0) return (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
            <h3 className="font-bold flex items-center gap-2 text-base"><ShieldX className="h-5 w-5 text-red-600" />🔴 PHÁT HIỆN TIẾN TRÌNH BẺ KHÓA / RISKY TAMPERING</h3>
            <p className="text-sm mt-1 text-red-700">
              Phát hiện dấu hiệu can thiệp bản quyền lậu ({isWindows ? 'KMS Server / Task bẻ khóa ngầm' : 'Ohook DLL / KMS Client'}). Bạn nên bấm "Đặt Lại Bản Quyền {isWindows ? 'Windows' : 'MS Office'} Gốc" để làm sạch.
            </p>
        </div>
    );

    // Tier 2: Clean but No Key / Unlicensed (Matching getiwc.online "MÁY TRỐNG")
    if (!isLicensed && !hasProductKey) return (
        <div className="bg-slate-100 border border-slate-300 text-slate-800 p-4 rounded-lg">
            <h3 className="font-bold flex items-center gap-2 text-base text-slate-800"><ShieldCheck className="h-5 w-5 text-slate-600" />👉 MÁY TRỐNG: HỆ THỐNG SẠCH VÀ KHÔNG CÓ KEY</h3>
            <p className="text-xs mt-2 text-slate-600 leading-relaxed">
              Hệ thống hoàn toàn sạch sẽ, không có bất kỳ tiến trình hay tệp tin bẻ khóa ngầm nào. Máy tính hiện chưa được cài đặt Product Key ({isWindows ? 'Windows' : 'MS Office'}) hoặc vừa được gỡ bỏ bản quyền thành công.
            </p>
        </div>
    );

    // Tier 3: Clean but Generic Key / HWID (Matching getiwc.online Warning)
    if (warningCount > 0) return (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-lg">
            <h3 className="font-bold flex items-center gap-2 text-base text-amber-800"><ShieldCheck className="h-5 w-5 text-amber-600" />👉 MÁY SẠCH: KHÔNG CÓ TIẾN TRÌNH CRACK CHẠY NGẦM</h3>
            <div className="text-xs mt-2 text-slate-700 space-y-1 leading-relaxed">
              <p>Tuy nhiên, máy đang sử dụng <strong>Key chung (Generic Key)</strong> không đi kèm Key BIOS.</p>
              <p>Đây có thể là hành vi <span className="text-red-600 font-semibold">kích hoạt HWID/MAS</span> hoặc <span className="text-emerald-700 font-semibold">giấy phép số HỢP LỆ</span> liên kết phần cứng.</p>
              <p className="text-slate-500 pt-1">Để chứng minh tính hợp lệ, bạn cần nhập lại Key gốc(*) hoặc cung cấp giao dịch mua bán hợp lệ.</p>
              <p className="text-[11px] text-slate-400 italic">(*) Key gốc có thể là key OEM, Retail mua ngoài, hoặc là key lưu trong BIOS.</p>
            </div>
        </div>
    );

    // Tier 4: Genuine OEM / Retail Key
    return (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-lg">
            <h3 className="font-bold flex items-center gap-2 text-base"><ShieldCheck className="h-5 w-5 text-emerald-600" />✅ {isWindows ? 'Windows' : 'MS Office'} BẢN QUYỀN CHÍNH HÃNG NGUYÊN BẢN</h3>
            <p className="text-sm mt-1 text-emerald-700">Hệ thống hoàn toàn sạch sẽ, không có bất kỳ dấu hiệu can thiệp hay bẻ khóa nào.</p>
        </div>
    );
  }


  return (
    <div className="p-1">
      <header className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">Kiểm tra & Xử lý Bản quyền Windows / Office</h1>
        <p className="text-sm text-slate-500 mt-1">
          Quy trình quét 8 bước chuyên sâu: thời hạn, kênh cấp phép, KMS host, tệp tin/DLL, tác vụ ngầm, file hosts và Event Logs.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
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

          <div className="space-y-6">
            {activeTab === 'office' ? (
              <OfficeLicenseAnalyzer />
            ) : (
              <>
                <MainResultCard />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button onClick={handleStartScan} disabled={isLoading || isResetting || isRestoringOem} className="w-full bg-blue-600 text-white font-bold py-3 px-3 rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center text-xs">
                    {isLoading ? <Loader className="animate-spin mr-2 h-4 w-4" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                    {isLoading ? 'Đang Quét...' : 'Quét Bản Quyền Windows (8 Bước)'}
                  </button>

                  <button onClick={handleRestoreOemBiosKey} disabled={isLoading || isResetting || isRestoringOem} className="w-full bg-emerald-600 text-white font-bold py-3 px-3 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm disabled:bg-emerald-400 disabled:cursor-not-allowed flex items-center justify-center text-xs">
                    {isRestoringOem ? <Loader className="animate-spin mr-2 h-4 w-4" /> : <KeyRound className="mr-2 h-4 w-4" />}
                    {isRestoringOem ? 'Đang Khôi Phục...' : 'Khôi Phục Key Gốc từ BIOS'}
                  </button>

                  <button onClick={handleResetActivation} disabled={isLoading || isResetting || isRestoringOem} className="w-full bg-slate-800 text-white font-bold py-3 px-3 rounded-lg hover:bg-slate-900 transition-colors shadow-sm disabled:bg-slate-500 disabled:cursor-not-allowed flex items-center justify-center text-xs">
                    {isResetting ? <Loader className="animate-spin mr-2 h-4 w-4" /> : <ShieldX className="mr-2 h-4 w-4" />}
                    {isResetting ? 'Đang Đặt Lại...' : 'Đặt Lại Bản Quyền Windows Gốc'}
                  </button>
                </div>
                
                {currentScanResult && <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-emerald-100/60 p-3 rounded-lg"><span className="font-bold text-emerald-700 text-xl">{cleanCount}</span><p className="text-xs text-emerald-600">SẠCH</p></div>
                    <div className="bg-amber-100/60 p-3 rounded-lg"><span className="font-bold text-amber-700 text-xl">{warningCount}</span><p className="text-xs text-amber-600">CẢNH BÁO</p></div>
                    <div className="bg-red-100/60 p-3 rounded-lg"><span className="font-bold text-red-700 text-xl">{dangerCount}</span><p className="text-xs text-red-600">NGUY HIỂM</p></div>
                </div>}
              </>
            )}
          </div>
        </div>
      </div>

      {activeTab === 'windows' && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-slate-800">KẾT QUẢ CHẨN ĐOÁN BẢN QUYỀN (WINDOWS)</h2>
              <div className="flex items-center gap-2 rounded-lg bg-slate-200 p-0.5">
                  <button onClick={() => setViewMode('visual')} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${viewMode === 'visual' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>
                      <FileText className="inline w-3 h-3 mr-1.5"/>8 Bước Trực Quan
                  </button>
                  <button onClick={() => setViewMode('terminal')} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${viewMode === 'terminal' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>
                      <Terminal className="inline w-3 h-3 mr-1.5"/>Terminal Logs
                  </button>
              </div>
          </div>

          {viewMode === 'visual' && currentScanResult && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                      {diagnosticSteps.map(step => (
                          <DiagnosticStepItem key={step.id} step={step} isActive={activeStep === step.id} onClick={() => setActiveStep(step.id)} />
                      ))}
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-slate-200 h-full min-h-[200px]">
                      <h3 className="font-bold text-slate-800">{`CHI TIẾT — BƯỚC ${selectedStepDetails?.id}`}</h3>
                      <div className="mt-4 text-sm text-slate-600 space-y-2 text-left">
                         {selectedStepDetails?.details.map((line, index) => (
                             <p key={index} className="text-xs font-mono" dangerouslySetInnerHTML={{ __html: line.replace(/🔴/g, '<span class="text-red-500">🔴</span>').replace(/⚠️/g, '<span class="text-amber-500">⚠️</span>').replace(/✅/g, '<span class="text-emerald-500">✅</span>') }}></p>
                         ))}
                         {selectedStepDetails?.details.length === 0 && <p className="text-xs text-slate-400">Chưa có thông tin chi tiết cho bước này.</p>}
                      </div>
                  </div>
              </div>
          )}

          {viewMode === 'terminal' && (
              <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-xs overflow-x-auto min-h-[250px] shadow-inner text-left">
                  {rawLogs ? rawLogs.split('\n').map((line, i) => (
                      <div key={i} className="py-0.5">{line}</div>
                  )) : <div className="text-slate-500 italic">Chưa có dữ liệu terminal logs. Hãy nhấn "Quét Bản Quyền Windows (8 Bước)".</div>}
              </div>
          )}
        </div>
      )}
    </div>
  );
}
