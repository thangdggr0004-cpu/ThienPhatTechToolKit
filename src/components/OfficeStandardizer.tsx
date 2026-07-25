import React, { useState, useEffect } from 'react';
import { 
  AlignLeft, 
  FileEdit, 
  Clock, 
  Trash2, 
  AlertTriangle, 
  UserX, 
  ShieldCheck, 
  Lock,
  CheckCircle2,
  Search,
  RefreshCw,
  ServerCrash
} from 'lucide-react';

import { 
  generateOfficeStandardizerScript, 
  generateRegionalFixScript,
  generateOfficeCacheCleanerScript,
  generateOfficeHistoryCleanerScript,
  generateFixWordCrashScript,
  generateClearOfficeCredentialsScript,
  generateRetailToVolumeScript,
  generateBlockOfficeUpdateScript
} from '../utils/scriptGenerator';
import { useTaskManager } from '../context/TaskManagerContext';

export default function OfficeStandardizer() {
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [successTask, setSuccessTask] = useState<string | null>(null);
  
  // Simulated Progress State
  const [progress, setProgress] = useState<number>(0);
  const [progressText, setProgressText] = useState<string>('');

  const { startTask, updateTask, completeTask, failTask } = useTaskManager();

  const executeUtility = async (scriptGenFunc: (args?: any) => string, taskId: string, taskTitle = 'Tiện Ích Office', args?: any) => {
    setActiveTask(taskId);
    setSuccessTask(null);
    setProgress(0);
    setProgressText('Đang khởi tạo...');
    
    startTask(taskId, taskTitle, 'Tiện Ích Office', 'Đang khởi tạo tiến trình...', 'office-standardizer');

    // Simulate Progress
    let currentP = 0;
    const pInterval = setInterval(() => {
      currentP += Math.floor(Math.random() * 15) + 5;
      if (currentP > 90) currentP = 90;
      setProgress(currentP);
      let pTxt = 'Đang thực thi...';
      if (currentP > 20 && currentP < 50) pTxt = 'Đang nạp bộ lệnh script...';
      else if (currentP >= 50 && currentP < 80) pTxt = 'Đang xử lý khóa Registry...';
      else if (currentP >= 80) pTxt = 'Đang áp dụng thay đổi...';
      setProgressText(pTxt);
      updateTask(taskId, currentP, `${pTxt} (${currentP}%)`, `[*] ${pTxt}`);
    }, 250);

    const scriptArgs = args || {
      pageSize: 'A4',
      marginTop: 20,
      marginBottom: 20,
      marginLeft: 30,
      marginRight: 15,
      fontName: 'Times New Roman',
      fontSizeTitle: 14,
      fontSizeBody: 14,
      lineSpacing: 1.25,
    };

    const script = scriptGenFunc(scriptArgs);
    const isElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined;
    
    const finishTask = (success: boolean, errMsg?: string) => {
      clearInterval(pInterval);
      if (success) {
        setProgress(100);
        setProgressText('Hoàn thành!');
        setSuccessTask(taskId);
        completeTask(taskId, `Đã hoàn tất ${taskTitle}!`);
        setTimeout(() => {
          setActiveTask(null);
          setSuccessTask(null);
        }, 2000);
      } else {
        setActiveTask(null);
        failTask(taskId, errMsg || 'Lỗi thực thi');
        window.alert("Lỗi thực thi: " + errMsg);
      }
    };

    if (isElectron) {
      try {
        await (window as any).electronAPI.applyOfficeStandard({ script });
        finishTask(true);
      } catch (err: any) {
        finishTask(false, err.message);
      }
    } else {
      setTimeout(() => finishTask(true), 2000);
    }
  };

  const renderProgressBar = () => {
    // Generate the ascii progress bar block
    const totalBlocks = 20;
    const filledBlocks = Math.floor((progress / 100) * totalBlocks);
    const emptyBlocks = totalBlocks - filledBlocks;
    const bar = '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);

    return (
      <div className="flex flex-col items-center justify-center space-y-2 py-2 w-full">
        <div className="font-mono text-[11px] text-slate-700 font-bold bg-slate-100 px-3 py-1.5 rounded-md w-full text-center">
          {bar} {progress}%
        </div>
        <div className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">
          {progressText}
        </div>
      </div>
    );
  };

  const UtilityCard = ({ 
    id, title, description, icon: Icon, onClick, colorClass, btnText 
  }: { 
    id: string, title: string, description: string, icon: any, onClick: () => void, colorClass: string, btnText: string 
  }) => {
    const isRunning = activeTask === id;
    const isSuccess = successTask === id;

    // Hover effects (Ảnh 2): hover:-translate-y-1 hover:shadow-lg group-hover:rotate-6 hover:border-blue-400
    return (
      <div className="group bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-blue-400 transition-all duration-300 flex flex-col justify-between">
        <div>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${colorClass} transition-transform duration-300 group-hover:rotate-6`}>
            <Icon className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-800 text-[15px]">{title}</h3>
          <p className="text-slate-500 text-xs mt-1.5 leading-relaxed min-h-[40px]">
            {description}
          </p>
        </div>
        
        <div className="mt-5 min-h-[40px] flex items-end">
          {isRunning ? (
            <div className="w-full animate-fade-in">
              {renderProgressBar()}
            </div>
          ) : (
            <button
              onClick={onClick}
              disabled={activeTask !== null}
              className={`w-full py-2.5 px-4 rounded text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                isSuccess 
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-200'
              } ${activeTask !== null && !isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSuccess ? (
                <><CheckCircle2 className="w-4 h-4" /> Hoàn tất!</>
              ) : (
                <>{btnText}</>
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  const IntegrityScannerSection = () => {
    const [scanState, setScanState] = useState<'idle'|'scanning'|'done'>('idle');
    const [isRestoring, setIsRestoring] = useState(false);
    const [scanResult, setScanResult] = useState<any>(null);
    const [restoreLog, setRestoreLog] = useState<string>('');

    const handleScan = async () => {
      setScanState('scanning');
      setScanResult(null);
      setRestoreLog('');
      const isElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined;
      if (isElectron) {
        try {
          const res = await (window as any).electronAPI.scanOfficeIntegrity();
          setScanResult(res);
        } catch(e: any) {
          setScanResult({ HasIssues: true, Summary: 'Lỗi khi gọi API quét: ' + e.message, Files: [], RegistryHooks: [], InjectedModules: [] });
        }
      } else {
        setTimeout(() => {
          setScanResult({
            HasIssues: true,
            Summary: "PHÁT HIỆN DẤU HIỆU CAN THIỆP BẢN QUYỀN OFFICE! Cần tiến hành khôi phục an toàn 3 lớp.",
            Files: [
              { Path: "C:\\Windows\\System32\\sppc.dll", SHA256: "E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855", Status: "Unknown", Signer: "Unsigned/Tampered", IsAuthentic: false }
            ],
            RegistryHooks: [
              { Target: "HKLM:\\SOFTWARE\\...\\sppsvc.exe", Type: "IFEO Debugger Hook", Value: "KMSAuto.exe" }
            ],
            InjectedModules: []
          });
        }, 1200);
      }
      setScanState('done');
    };

    const handleRestore = async () => {
      if (!window.confirm("HỆ THỐNG SẼ THỰC HIỆN KHÔI PHỤC AN TOÀN 3 LỚP:\n\n1. Sao lưu sppc.dll & Dừng toàn bộ tiến trình Office.\n2. Triệt hạ các Hook IFEO & AppInit_DLLs độc hại.\n3. Nạp lại DLL gốc chuẩn Microsoft từ kho WinSXS bằng SFC.\n\nBạn có muốn tiến hành không?")) return;
      
      setIsRestoring(true);
      const isElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined;
      if (isElectron) {
        try {
          const res = await (window as any).electronAPI.restoreOfficeIntegrity();
          setRestoreLog(res.log || 'Không có log.');
          if (res.success) {
            window.alert("Đã khôi phục an toàn thành công! Vui lòng bấm Quét lại để kiểm chứng.");
          } else {
            window.alert("Khôi phục thất bại: " + res.log);
          }
        } catch(e: any) {
          window.alert('Lỗi khôi phục: ' + e.message);
        }
      } else {
        setTimeout(() => {
          setRestoreLog("[1/3] Đang sao lưu Registry & Dừng tiến trình Office...\n[2/3] Đã xóa bỏ Hook IFEO trong Registry.\n[3/3] System File Checker: sfc /scanfile=sppc.dll -> Successful!\n[✓] Hoàn tất khôi phục an toàn.");
          alert("Demo: Khôi phục mô phỏng thành công!");
        }, 1500);
      }
      setIsRestoring(false);
    };

    const hasIssues = scanResult && scanResult.HasIssues;

    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl text-white space-y-6 relative overflow-hidden">
        {/* Decorative background gradient */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <ServerCrash className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                HỆ THỐNG CHẨN ĐOÁN & PHỤC HỒI LÕI BẢN QUYỀN OFFICE
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">3 Lớp Bảo Vệ</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Bóc tách các cơ chế bẻ khóa (Hook IFEO, DLL Injection, sppc.dll bị sửa đổi) và tự động nạp lại DLL zin chuẩn Microsoft từ kho WinSXS.
              </p>
            </div>
          </div>
        </div>

        {/* 4 Status Indicator Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative z-10">
          <div className="bg-slate-800/80 border border-slate-700/60 p-3.5 rounded-lg flex items-center gap-3">
            <ShieldCheck className={`w-5 h-5 ${scanResult ? (scanResult.Files?.every((f:any)=>f.IsAuthentic) ? 'text-emerald-400' : 'text-rose-400') : 'text-slate-500'}`} />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-mono">Chữ Ký Authenticode</div>
              <div className="text-xs font-bold text-slate-200">
                {!scanResult ? 'Chưa kiểm tra' : (scanResult.Files?.every((f:any)=>f.IsAuthentic) ? 'Chuẩn Microsoft ✓' : 'Bị Sửa Đổi / Giả Mạo ⚠️')}
              </div>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/60 p-3.5 rounded-lg flex items-center gap-3">
            <Lock className={`w-5 h-5 ${scanResult ? (scanResult.RegistryHooks?.length === 0 ? 'text-emerald-400' : 'text-amber-400') : 'text-slate-500'}`} />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-mono">Registry Hooks (IFEO)</div>
              <div className="text-xs font-bold text-slate-200">
                {!scanResult ? 'Chưa kiểm tra' : (scanResult.RegistryHooks?.length === 0 ? 'Sạch Sẽ ✓' : `Phát Hiện ${scanResult.RegistryHooks.length} Hook ⚠️`)}
              </div>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/60 p-3.5 rounded-lg flex items-center gap-3">
            <AlertTriangle className={`w-5 h-5 ${scanResult ? (scanResult.InjectedModules?.length === 0 ? 'text-emerald-400' : 'text-rose-400') : 'text-slate-500'}`} />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-mono">AppInit_DLLs Injection</div>
              <div className="text-xs font-bold text-slate-200">
                {!scanResult ? 'Chưa kiểm tra' : (scanResult.InjectedModules?.length === 0 ? 'An Toàn ✓' : `Có ${scanResult.InjectedModules.length} Tiến Trình Bị Tiêm ⚠️`)}
              </div>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/60 p-3.5 rounded-lg flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-cyan-400" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-mono">Phục Hồi WinSXS (SFC)</div>
              <div className="text-xs font-bold text-cyan-300">
                Sẵn Sàng 3 Lớp
              </div>
            </div>
          </div>
        </div>

        {/* Diagnostic Terminal Display */}
        {scanResult && (
          <div className="bg-slate-950 rounded-xl p-4 font-mono text-[11px] leading-relaxed text-slate-300 border border-slate-800 max-h-60 overflow-y-auto space-y-2 relative z-10 shadow-inner">
            <div className="text-emerald-400 font-bold flex items-center gap-2">
              <span>[SCAN REPORT - {scanResult.Timestamp || 'NOW'}]</span>
              <span>{scanResult.Summary}</span>
            </div>
            
            {scanResult.Files?.map((f: any, i: number) => (
              <div key={i} className="text-slate-400 pl-2">
                📂 <span className="text-slate-200">{f.Path}</span> 
                {f.SHA256 && <span className="text-slate-500 text-[10px] block pl-5">SHA256: {f.SHA256}</span>}
                <span className={`block pl-5 ${f.IsAuthentic ? 'text-emerald-400' : 'text-rose-400 font-bold'}`}>
                  Chữ ký: {f.Signer} [{f.Status}]
                </span>
              </div>
            ))}

            {scanResult.RegistryHooks?.map((h: any, i: number) => (
              <div key={i} className="text-amber-400 pl-2">
                ⚠️ [HOOK] {h.Type} -&gt; {h.Target} (Value: {h.Value})
              </div>
            ))}

            {restoreLog && (
              <div className="mt-3 pt-3 border-t border-slate-800 text-cyan-300 whitespace-pre-wrap">
                {restoreLog}
              </div>
            )}
          </div>
        )}

        {/* Action Button Bar */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2 relative z-10">
          <button 
            onClick={handleScan}
            disabled={scanState === 'scanning' || isRestoring}
            className="flex-1 py-3 px-5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            {scanState === 'scanning' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {scanState === 'scanning' ? 'ĐANG QUÉT & SOI HỆ THỐNG...' : 'QUÉT CHẨN ĐOÁN LÕI (FULL DIAGNOSTICS)'}
          </button>
          
          <button 
            onClick={handleRestore}
            disabled={isRestoring || (!hasIssues && scanState !== 'done')}
            className={`flex-1 py-3 px-5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-98 cursor-pointer ${
              (hasIssues || scanState === 'done') && !isRestoring
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20 animate-pulse'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
            }`}
          >
            {isRestoring ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            {isRestoring ? 'ĐANG THỰC HIỆN KHÔI PHỤC 3 LỚP...' : 'KHÔI PHỤC AN TOÀN BẢN QUYỀN (3 LỚP)'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      
      {/* HEADER */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4">
        <div className="bg-emerald-100 p-3 rounded-xl shrink-0">
          <FileEdit className="w-8 h-8 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Tiện Ích Office Nâng Cao</h2>
          <p className="text-sm text-slate-500 mt-1">
            Bộ công cụ 1-Click giúp kỹ thuật viên chuẩn hóa Word/Excel, sửa các lỗi treo/văng cứng đầu và quản trị giấy phép an toàn, tối ưu nhất.
          </p>
        </div>
      </div>

      {/* SECTION 0: BỘ CHẨN ĐOÁN & PHỤC HỒI LÕI 3 LỚP (BÁM SÁT KẾ HOẠCH) */}
      <IntegrityScannerSection />

      {/* SECTION 1: CHUẨN HÓA & TỐI ƯU */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider flex items-center gap-2">
          <AlignLeft className="w-4 h-4 text-emerald-500" /> Chuẩn Hóa & Tối Ưu
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <UtilityCard
            id="std-word"
            title="Chuẩn Hóa Word Việt Nam"
            description="Tự động cấu hình Font Times New Roman 14, căn lề chuẩn Nghị định (2-2-3-2), giãn dòng 1.25."
            icon={FileEdit}
            colorClass="bg-blue-50 text-blue-600"
            btnText="Áp dụng 1-Click"
            onClick={() => executeUtility(generateOfficeStandardizerScript, 'std-word')}
          />
          <UtilityCard
            id="fix-date"
            title="Sửa Lỗi Ngày Tháng (Excel)"
            description="Sửa lỗi đảo ngược ngày/tháng trong Excel, ép định dạng vùng hệ thống về chuẩn dd/MM/yyyy."
            icon={Clock}
            colorClass="bg-indigo-50 text-indigo-600"
            btnText="Sửa lỗi ngay"
            onClick={() => executeUtility(generateRegionalFixScript, 'fix-date')}
          />
          <UtilityCard
            id="clean-cache"
            title="Dọn Dẹp Office Cache"
            description="Xóa rác, temp cache giúp giảm dung lượng ổ C và tăng tốc khởi động Word/Excel."
            icon={Trash2}
            colorClass="bg-orange-50 text-orange-600"
            btnText="Dọn dẹp"
            onClick={() => executeUtility(generateOfficeCacheCleanerScript, 'clean-cache')}
          />
          <UtilityCard
            id="clean-history"
            title="Xóa Lịch Sử File Gần Đây"
            description="Xóa sạch danh sách Recent Files trong Office để bảo mật thông tin tài liệu nhạy cảm."
            icon={Trash2}
            colorClass="bg-slate-100 text-slate-600"
            btnText="Xóa lịch sử"
            onClick={() => executeUtility(generateOfficeHistoryCleanerScript, 'clean-history')}
          />
        </div>
      </div>

      {/* SECTION 2: SỬA LỖI CHUYÊN SÂU */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-500" /> Sửa Lỗi Chuyên Sâu
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          <UtilityCard
            id="fix-crash"
            title="Sửa Lỗi Treo/Crash Word & Excel"
            description="Đóng băng toàn bộ Office, gỡ bỏ các Add-in rác (Foxit, Acrobat...) và xóa bộ đệm cấu hình Normal.dotm bị lỗi. Trị dứt điểm bệnh cứ mở file là bị treo, văng ứng dụng."
            icon={AlertTriangle}
            colorClass="bg-rose-50 text-rose-600"
            btnText="Xử lý Treo/Crash"
            onClick={() => executeUtility(generateFixWordCrashScript, 'fix-crash')}
          />
          <UtilityCard
            id="clear-creds"
            title="Sửa Lỗi Kẹt Tài Khoản (Account Error)"
            description="Xóa sạch thông tin đăng nhập trong Credential Manager và các khóa Identity của Office. Cực kỳ hiệu quả khi máy bị lỗi không thể xác minh đăng nhập hoặc lỗi chấm than vàng."
            icon={UserX}
            colorClass="bg-amber-50 text-amber-600"
            btnText="Xóa Phiên Đăng Nhập Cũ"
            onClick={() => executeUtility(generateClearOfficeCredentialsScript, 'clear-creds')}
          />
        </div>
      </div>

      {/* SECTION 3: QUẢN TRỊ BẢN QUYỀN (THAY CHO CRACK) */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-violet-500" /> Quản Trị Giấy Phép & Bản Quyền
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          <UtilityCard
            id="retail-to-volume"
            title="Chuyển Đổi Kênh Cấp Phép (Retail -> Volume)"
            description="Quét và nạp chứng chỉ Volume (VL) vào Office Retail. Thao tác này là bắt buộc nếu bạn muốn sử dụng máy chủ KMS nội bộ doanh nghiệp để kích hoạt số lượng lớn."
            icon={ShieldCheck}
            colorClass="bg-violet-50 text-violet-600"
            btnText="Cài Đặt Chứng Chỉ Volume"
            onClick={() => executeUtility(generateRetailToVolumeScript, 'retail-to-volume')}
          />
          <UtilityCard
            id="block-updates"
            title="Đóng Băng Cập Nhật Office"
            description="Vô hiệu hóa luồng cập nhật của Microsoft qua Group Policy và Registry. Giúp bảo vệ tính ổn định của phiên bản hiện tại, tránh việc tự động tải bản vá làm mất chứng chỉ cấp phép."
            icon={Lock}
            colorClass="bg-cyan-50 text-cyan-600"
            btnText="Chặn Luồng Cập Nhật (Khuyên Dùng)"
            onClick={() => executeUtility(generateBlockOfficeUpdateScript, 'block-updates')}
          />
        </div>
      </div>
      
    </div>
  );
}
