import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Activity,
  Layers,
  FileCheck2,
  Zap,
  Copy,
  Download,
  Filter,
  Check,
  Info
} from 'lucide-react';

// Dictionary giải thích thuật ngữ kỹ thuật
const TOOLTIPS: Record<string, string> = {
  KMS: 'Key Management Service - Máy chủ quản lý bản quyền của Microsoft.',
  GVLK: 'Generic Volume License Key - Khóa mặc định để kích hoạt qua KMS.',
  MAK: 'Multiple Activation Key - Khóa kích hoạt trực tiếp với máy chủ Microsoft.',
  Retail: 'Bản quyền bán lẻ cho cá nhân.',
  Volume: 'Bản quyền khối dành cho doanh nghiệp.',
  Mondo: 'Phiên bản Office thử nghiệm chứa đầy đủ tính năng.',
  ClickToRun: 'Công nghệ cài đặt Office trực tuyến của Microsoft (C2R).',
  IFEO: 'Image File Execution Options - Khóa Registry điều hướng tiến trình Windows.',
  Authenticode: 'Chữ ký số xác thực phần mềm chính hãng từ Microsoft.',
  SystemConfidence: 'Độ tin cậy kiểm tra tính toàn vẹn hệ thống Office.',
  ActivationConfidence: 'Độ tin cậy xác định nguồn gốc kích hoạt.'
};

export default function OfficeLicenseAnalyzer() {
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [report, setReport] = useState<any | null>(null);
  const [restoreResult, setRestoreResult] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'matrix' | 'plan' | 'audit' | 'postReport'>('matrix');
  
  // Audit log filter & copy state
  const [logFilter, setLogFilter] = useState<string>('ALL');
  const [copiedLog, setCopiedLog] = useState<boolean>(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const handleRunScanV3 = async () => {
    setIsScanning(true);
    setRestoreResult(null);
    const isElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined;
    if (isElectron) {
      try {
        const res = await (window as any).electronAPI.scanOfficeEngineV3();
        if (res && res.success) {
          setReport(res.report);
        } else {
          alert("Lỗi chẩn đoán V3: " + (res ? res.error : "Không có dữ liệu"));
        }
      } catch (err: any) {
        alert("Lỗi thực thi Engine V3: " + err.message);
      }
    } else {
      // Mock Data cho giao diện Dev
      setTimeout(() => {
        setReport({
          timestamp: new Date().toLocaleString('vi-VN'),
          skuInfo: { skuName: 'Office 2021 ProPlusRetail', channel: 'Retail', bitness: 'x64', installType: 'ClickToRun', buildNumber: '16.0.17328' },
          provenance: {
            activationStatus: 'LICENSED',
            activationMethod: 'KMS Client (GVLK)',
            activationSource: 'Không xác định được KMS Host',
            confidence: 80,
            recommendation: 'Không xác định được KMS Host từ dữ liệu hiện có. Nếu cần xác minh nguồn kích hoạt, hãy kiểm tra cấu hình KMS bằng công cụ quản trị Office.',
            evidenceUsed: [
              'ActivationType: KMS',
              'License Name: Office19ProPlus2019VL_KMS_Client_AE',
              'Status: LICENSED',
              'Reasoning: KMS Host = No Data (Không lấy được thông tin tên Host từ hệ thống).'
            ],
            kmsHostInfo: { host: 'Không đọc được dữ liệu', port: 1688, reachability: 'UNKNOWN', hostType: 'KMS Host = No Data' }
          },
          matrix: [
            { componentName: 'Bản Quyền Office (OSPP License)', status: 'PASS', dataSource: 'OSPP', confidenceWeight: 20, details: 'Trạng thái: LICENSED (Key: ...37XMB)' },
            { componentName: 'Chữ Ký Số DLL Hệ Thống (sppc.dll)', status: 'PASS', dataSource: 'Authenticode', confidenceWeight: 25, details: 'Chữ ký: Valid (CN=Microsoft Corporation)' },
            { componentName: 'Kiểm Tra Tệp Thư Mục Office (sppcs.dll)', status: 'PASS', dataSource: 'FileIntegrity', confidenceWeight: 25, details: 'Sạch sẽ, không phát hiện tệp lạ trong thư mục cài đặt' },
            { componentName: 'Registry Hooks (IFEO Debugger)', status: 'PASS', dataSource: 'Registry', confidenceWeight: 20, details: 'Sạch sẽ, không có khóa bẫy tiến trình' }
          ],
          confidenceResult: { confidencePercentage: 100, level: { label: 'Đã xác nhận', code: 'CONFIRMED' } },
          surgicalPlan: {
            stepCount: 0,
            summary: 'Hệ thống hoàn toàn sạch sẽ và nguyên bản. Không cần thực hiện thao tác khôi phục.',
            targetActions: []
          },
          impactResult: { riskLevel: 'LOW', officeImpact: 'Không ảnh hưởng ứng dụng Office.', windowsImpact: 'Không tác động tệp hệ thống Windows.', clickToRunImpact: 'Dịch vụ ClickToRun hoạt động bình thường.', licenseImpact: 'Bảo lưu bản quyền hiện có.', isSafeToProceed: true },
          decisionResult: { actionAllowed: 'ALLOW_RESTORE', reason: 'Không phát hiện dấu hiệu can thiệp tệp hoặc Registry. Chi tiết kích hoạt xem tại mục Thông Tin Kích Hoạt.', recommendedNextStep: 'Không cần thao tác khôi phục.' },
          auditLogs: [
            { collectorName: 'CompatibilityLayer', dataSource: 'Registry/Filesystem', details: 'SKU: Office 2021 ProPlusRetail, Build: 16.0.17328', timestamp: new Date().toISOString() },
            { collectorName: 'EnterpriseLicenseCollector', dataSource: 'ospp.vbs+WMI', details: 'Status: LICENSED, Name: Office19ProPlus2019VL_KMS_Client_AE, ActivationType: KMS', timestamp: new Date().toISOString() },
            { collectorName: 'AuthenticodeCollector', dataSource: 'Win32 API', details: 'Signer: CN=Microsoft Corporation', timestamp: new Date().toISOString() }
          ]
        });
      }, 800);
    }
    setIsScanning(false);
  };

  const handleRestoreV3 = async () => {
    if (!window.confirm("BẮT ĐẦU KHÔI PHỤC AN TOÀN:\n\n1. Kiểm tra an toàn hệ thống (Quyền Admin, Tiến trình Office đang mở).\n2. Thực hiện từng bước: Tự động Sao lưu -> Khôi phục -> Kiểm tra lại.\n3. Nếu xảy ra lỗi: Tự động Hoàn tác 100% trạng thái ban đầu.\n\nBạn có muốn tiếp tục không?")) return;

    setIsRestoring(true);
    const isElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined;
    if (isElectron) {
      try {
        const res = await (window as any).electronAPI.restoreOfficeEngineV3();
        setRestoreResult(res);
        if (res.success) {
          alert("KHÔI PHỤC HOÀN TẤT:\n\n" + (res.postRestoreReport?.summary || 'Hệ thống đã phục hồi nguyên bản!'));
          setReport(res.postRestoreReport?.afterReport || report);
        } else {
          alert("CẢNH BÁO KHÔI PHỤC:\n\n" + (res.error || 'Có lỗi xảy ra'));
        }
      } catch (err: any) {
        alert("Lỗi thực thi khôi phục: " + err.message);
      }
    } else {
      setTimeout(() => {
        setRestoreResult({
          success: true,
          rolledBack: false,
          executionLogs: [
            '[BẮT ĐẦU] Khởi tạo quy trình khôi phục an toàn...',
            '[HOÀN TẤT] Khôi phục thành công!',
            '[QUÉT LẠI] Kiểm tra lại dữ liệu...',
            '[ĐÁNH GIÁ] Kiểm tra hoạt động Office -> ĐẠT 100% ✓'
          ],
          postRestoreReport: {
            before: { confidence: 100, decision: 'ALLOW_RESTORE' },
            after: { confidence: 100, decision: 'ALLOW_RESTORE' },
            healthCheck: { overallStatus: 'PASS', c2rServiceActive: true, wordLaunchable: true },
            summary: 'Office đã trở về trạng thái nguyên bản của Microsoft (100% ĐẠT).'
          }
        });
        alert("Khôi phục hoàn tất thành công!");
      }, 1200);
    }
    setIsRestoring(false);
  };

  const decision = report?.decisionResult?.actionAllowed || 'NONE';
  const systemConfidence = report?.confidenceResult?.confidencePercentage || 0;
  const activationConfidence = report?.provenance?.confidence || 0;
  const targetActionsCount = report?.surgicalPlan?.targetActions?.length || 0;

  // Lọc và Copy/Export Logs
  const getFilteredLogs = () => {
    if (!report || !report.auditLogs) return [];
    if (logFilter === 'ALL') return report.auditLogs;
    return report.auditLogs.filter((log: any) => 
      (log.collectorName && log.collectorName.toUpperCase().includes(logFilter)) ||
      (log.dataSource && log.dataSource.toUpperCase().includes(logFilter))
    );
  };

  const copyAuditLogs = () => {
    const logsStr = JSON.stringify(getFilteredLogs(), null, 2);
    navigator.clipboard.writeText(logsStr);
    setCopiedLog(true);
    setTimeout(() => setCopiedLog(false), 2000);
  };

  const exportAuditLogsTxt = () => {
    const logsStr = getFilteredLogs().map((l: any) => `[${l.timestamp || ''}] [${l.collectorName}] (${l.dataSource}): ${l.details}`).join('\n');
    const blob = new Blob([logsStr], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OfficeAuditLog_${Date.now()}.txt`;
    a.click();
  };

  const exportAuditLogsJson = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OfficeReport_${Date.now()}.json`;
    a.click();
  };

  const renderTooltipIcon = (term: string) => (
    <span className="relative inline-flex items-center ml-1 cursor-pointer group">
      <Info 
        className="w-3.5 h-3.5 text-slate-400 hover:text-blue-600 transition-colors"
        onMouseEnter={() => setActiveTooltip(term)}
        onMouseLeave={() => setActiveTooltip(null)}
      />
      {activeTooltip === term && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-60 p-2 bg-slate-900 text-white text-[11px] font-normal rounded-lg shadow-xl z-50 pointer-events-none whitespace-normal leading-tight">
          <strong className="text-blue-400 block mb-0.5">{term}:</strong>
          {TOOLTIPS[term]}
        </span>
      )}
    </span>
  );

  return (
    <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-5 shadow-xs text-slate-800 space-y-5 font-sans">
      
      {/* --------------------------------------------------------------------- */}
      {/* KHU VỰC TIÊU ĐỀ & THANH TÓM TẮT NGAN 1 DÒNG                            */}
      {/* --------------------------------------------------------------------- */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-900 text-white rounded-lg shadow-2xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                CHẨN ĐOÁN &amp; KHÔI PHỤC BẢN QUYỀN MS OFFICE V3
              </h3>
              <p className="text-[11px] text-slate-500">
                Phân tích đối soát đa nguồn • Đánh giá độ tin cậy bằng chứng • Tự động khôi phục an toàn.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-slate-400 shrink-0">
            {report ? `Thời gian: ${report.timestamp}` : 'Chưa quét'}
          </span>
        </div>

        {/* THANH TÓM TẮT 1 DÒNG */}
        {report && (
          <div className="bg-slate-900 text-slate-200 px-3.5 py-2 rounded-lg text-xs font-mono flex flex-wrap items-center justify-between gap-2 shadow-inner">
            <div className="flex flex-wrap items-center gap-3">
              <span>Trạng thái: <strong className="text-emerald-400">{report.provenance?.activationStatus || 'N/A'}</strong></span>
              <span className="text-slate-600">|</span>
              <span>Kích hoạt: <strong className="text-blue-300">{report.provenance?.activationMethod || 'N/A'}</strong> {renderTooltipIcon('KMS')}</span>
              <span className="text-slate-600">|</span>
              <span>Độ tin cậy: <strong className="text-blue-400">{activationConfidence}%</strong></span>
            </div>
            <div>
              Khôi phục: <strong className={targetActionsCount > 0 ? 'text-amber-400' : 'text-emerald-400'}>{targetActionsCount > 0 ? 'Có kế hoạch' : 'Không cần thiết'}</strong>
            </div>
          </div>
        )}
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* TẦNG 1: TÓM TẮT HỆ THỐNG                                               */}
      {/* --------------------------------------------------------------------- */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Ô 1: Phiên Bản Office */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phiên Bản Office</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">HỆ THỐNG</span>
            </div>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              {report.skuInfo?.skuName || 'Office'}
              {renderTooltipIcon('ClickToRun')}
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Kênh: <span className="font-semibold text-slate-700">{report.skuInfo?.channel}</span> | Build: <span className="font-semibold text-slate-700">{report.skuInfo?.buildNumber}</span> ({report.skuInfo?.bitness})
            </div>
          </div>

          {/* Ô 2: Độ Tin Cậy Hệ Thống */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                Độ Tin Cậy
                {renderTooltipIcon('SystemConfidence')}
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-900 text-white rounded">HỆ THỐNG</span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`text-xl font-black font-mono ${systemConfidence >= 95 ? 'text-emerald-600' : systemConfidence >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                {systemConfidence}%
              </div>
              <div className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                {report.confidenceResult?.level?.label || 'Đã xác nhận'}
              </div>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
              <div 
                className={`h-full transition-all duration-500 ${systemConfidence >= 95 ? 'bg-emerald-500' : systemConfidence >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${systemConfidence}%` }}
              />
            </div>
          </div>

          {/* Ô 3: Kết Luận */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kết Luận</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">HỆ THỐNG</span>
            </div>
            <div className="text-xs font-semibold text-slate-800 leading-snug">
              {report.decisionResult?.reason}
            </div>
            {systemConfidence === 100 && activationConfidence < 100 && (
              <div className="text-[10px] text-slate-500 bg-slate-50 p-1.5 rounded border border-slate-200 leading-tight">
                ℹ️ <strong>Độ tin cậy hệ thống:</strong> 100% (Toàn vẹn tệp/Registry). <strong>Độ tin cậy kích hoạt:</strong> {activationConfidence}% (Phương thức kích hoạt). Hai chỉ số này độc lập.
              </div>
            )}
            <div className="text-[11px] text-blue-700 font-semibold">👉 {report.decisionResult?.recommendedNextStep}</div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TẦNG 2: THÔNG TIN KÍCH HOẠT                                           */}
      {/* --------------------------------------------------------------------- */}
      {report && report.provenance && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600" /> THÔNG TIN KÍCH HOẠT
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">KÍCH HOẠT</span>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold font-mono bg-blue-50 text-blue-800 border border-blue-200 flex items-center">
                Độ tin cậy: {report.provenance.confidence}%
                {renderTooltipIcon('ActivationConfidence')}
              </span>
            </div>
          </div>

          {/* CHỈNH DẠNG ĐƯỜNG LƯỚI BẢNG LƯU TRỮ */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5 text-xs font-mono">
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Trạng Thái</span>
              <span className="font-bold text-emerald-700 text-xs mt-1 block">{report.provenance.activationStatus}</span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Phương Thức</span>
              <span className="font-bold text-slate-800 text-xs mt-1 block flex items-center">
                {report.provenance.activationMethod}
                {renderTooltipIcon('GVLK')}
              </span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 md:col-span-2">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Nguồn Kích Hoạt</span>
              <span className="font-bold text-slate-800 text-xs mt-1 block">{report.provenance.activationSource}</span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 block uppercase flex items-center">
                Độ Tin Cậy
                {renderTooltipIcon('ActivationConfidence')}
              </span>
              <span className="font-bold text-blue-700 text-xs mt-1 block">{report.provenance.confidence}%</span>
            </div>
          </div>

          {/* KHUYẾN NGHỊ */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-700 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900">Khuyến nghị:</span> {report.provenance.recommendation}
            </div>
          </div>

          {/* THÔNG TIN MÁY CHỦ KMS */}
          {report.provenance.kmsHostInfo && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] font-mono bg-slate-900 text-slate-300 p-2.5 rounded-lg">
              <div>KMS Host: <span className="font-bold text-white">{report.provenance.kmsHostInfo.host}</span></div>
              <div>Cổng (Port): <span className="font-bold text-white">{report.provenance.kmsHostInfo.port || 1688}</span></div>
              <div>Kết nối: <span className="font-bold text-emerald-400">{report.provenance.kmsHostInfo.reachability || 'UNKNOWN'}</span></div>
              <div>Phân loại: <span className="font-bold text-blue-300">{report.provenance.kmsHostInfo.hostType}</span></div>
            </div>
          )}
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* NÚT ĐIỀU KHIỂN                                                         */}
      {/* --------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <button
          onClick={handleRunScanV3}
          disabled={isScanning || isRestoring}
          className="w-full py-3 px-4 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50"
        >
          {isScanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {isScanning ? 'ĐANG QUÉT HỆ THỐNG...' : 'BẮT ĐẦU KIỂM TRA OFFICE'}
        </button>

        <button
          onClick={handleRestoreV3}
          disabled={isScanning || isRestoring || !report || decision === 'BLOCK_RESTORE' || targetActionsCount === 0}
          className={`w-full py-3 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.99] ${
            targetActionsCount > 0 && !isRestoring
              ? 'bg-red-600 hover:bg-red-700 text-white cursor-pointer shadow-red-100'
              : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
          }`}
        >
          {isRestoring ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
          {isRestoring 
            ? 'ĐANG KHÔI PHỤC...' 
            : targetActionsCount === 0 
              ? 'Hệ thống sạch - Không cần thao tác' 
              : 'KHÔI PHỤC AN TOÀN'}
        </button>
      </div>

      {/* NHẬT KÝ THỰC THI KHÔI PHỤC */}
      {restoreResult && restoreResult.executionLogs && (
        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-400 whitespace-pre-wrap shadow-inner space-y-2">
          <div className="font-bold text-emerald-300 border-b border-slate-800 pb-2 flex items-center justify-between">
            <span className="flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-400" /> NHẬT KÝ KHÔI PHỤC:</span>
            <span className="text-[10px] text-slate-400">Tự động hoàn tác nếu có lỗi ✓</span>
          </div>
          <div className="max-h-40 overflow-y-auto pr-2">
            {restoreResult.executionLogs.map((log: string, idx: number) => (
              <div key={idx} className={log.includes('FAIL') ? 'text-red-400 font-bold' : log.includes('COMMIT') ? 'text-emerald-300 font-bold' : ''}>
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TẦNG 3: TAB CHI TIẾT                                                  */}
      {/* --------------------------------------------------------------------- */}
      {report && (
        <div className="space-y-3">
          <div className="bg-white p-1 rounded-xl border border-slate-200 flex flex-wrap gap-1 text-xs shadow-2xs">
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3.5 py-2 rounded-lg font-bold transition-all ${activeTab === 'matrix' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Kết Quả Kiểm Tra
            </button>
            <button
              onClick={() => setActiveTab('plan')}
              className={`px-3.5 py-2 rounded-lg font-bold transition-all ${activeTab === 'plan' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Kế Hoạch Khôi Phục
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3.5 py-2 rounded-lg font-bold transition-all ${activeTab === 'audit' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Nhật Ký Hệ Thống
            </button>
            {restoreResult && restoreResult.postRestoreReport && (
              <button
                onClick={() => setActiveTab('postReport')}
                className={`px-3.5 py-2 rounded-lg font-bold transition-all ${activeTab === 'postReport' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'}`}
              >
                Kết Quả Khôi Phục
              </button>
            )}
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 font-mono text-xs text-slate-700 min-h-[160px] shadow-2xs">
            
            {/* Tab 1: Kết Quả Kiểm Tra */}
            {activeTab === 'matrix' && (
              <div className="space-y-3">
                <div className="font-bold text-slate-900 text-xs flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="flex items-center gap-2"><FileCheck2 className="w-4 h-4 text-blue-600" /> BẢNG KẾT QUẢ KIỂM TRA CHI TIẾT:</span>
                  <span className="text-[11px] text-slate-400 font-normal">Trọng số độ tin cậy hệ thống</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-bold text-[10px] uppercase">
                        <th className="py-2 px-3">Thành Phần</th>
                        <th className="py-2 px-3">Trạng Thái</th>
                        <th className="py-2 px-3">Nguồn Dữ Liệu</th>
                        <th className="py-2 px-3">Trọng Số</th>
                        <th className="py-2 px-3">Chi Tiết Bằng Chứng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {report.matrix && report.matrix.map((item: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-slate-800 flex items-center gap-1">
                            {item.componentName}
                            {item.componentName.includes('IFEO') && renderTooltipIcon('IFEO')}
                            {item.componentName.includes('sppc.dll') && renderTooltipIcon('Authenticode')}
                          </td>
                          <td className="py-2.5 px-3">
                            {item.status === 'PASS' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> ✔ ĐẠT
                              </span>
                            )}
                            {item.status === 'WARNING' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <AlertTriangle className="w-3 h-3 text-amber-600" /> ▲ LƯU Ý
                              </span>
                            )}
                            {item.status === 'FAIL' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                                <XCircle className="w-3 h-3 text-red-600" /> ✖ LỖI
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500">{item.dataSource}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-700">{item.confidenceWeight}%</td>
                          <td className="py-2.5 px-3 text-slate-600">{item.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 2: Kế Hoạch Khôi Phục */}
            {activeTab === 'plan' && (
              <div className="space-y-3">
                <div className="font-bold text-slate-900 text-xs flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Zap className="w-4 h-4 text-blue-600" /> CHI TIẾT KẾ HOẠCH KHÔI PHỤC:
                </div>
                <div className="text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-200 font-bold text-xs">
                  {report.surgicalPlan?.summary}
                </div>
                {report.surgicalPlan?.targetActions && report.surgicalPlan.targetActions.length > 0 ? (
                  <div className="space-y-2">
                    <div className="font-bold text-slate-800 text-xs">CÁC THAO TÁC CẦN THỰC HIỆN ({report.surgicalPlan.targetActions.length}):</div>
                    {report.surgicalPlan.targetActions.map((act: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col gap-1">
                        <div className="flex justify-between items-center font-bold text-slate-900 text-xs">
                          <span>Bước {idx + 1}: {act.type}</span>
                          <span className="text-[10px] text-slate-400 font-normal">Mục tiêu: {act.target}</span>
                        </div>
                        <div className="text-[11px] text-slate-600">{act.description}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-emerald-700 font-bold p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Hệ thống nguyên bản. Không cần thực hiện thao tác khôi phục.
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Nhật Ký Hệ Thống */}
            {activeTab === 'audit' && (
              <div className="space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-600" /> CHI TIẾT NHẬT KÝ HỆ THỐNG:
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                      <Filter className="w-3 h-3 text-slate-500" />
                      <select 
                        value={logFilter} 
                        onChange={(e) => setLogFilter(e.target.value)} 
                        className="bg-transparent text-slate-700 font-bold text-[11px] focus:outline-none"
                      >
                        <option value="ALL">Tất cả Nhật ký</option>
                        <option value="COLLECTOR">Nguồn Thu Thập</option>
                        <option value="REGISTRY">Registry</option>
                        <option value="AUTHENTICODE">Chữ Ký Số</option>
                        <option value="LICENSE">Bản Quyền</option>
                      </select>
                    </div>

                    <button 
                      onClick={copyAuditLogs} 
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold border border-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedLog ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      {copiedLog ? 'Đã Sao Chép' : 'Sao Chép'}
                    </button>

                    <button 
                      onClick={exportAuditLogsTxt} 
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold border border-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Download className="w-3 h-3 text-slate-600" /> Tệp TXT
                    </button>

                    <button 
                      onClick={exportAuditLogsJson} 
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Download className="w-3 h-3 text-blue-400" /> Báo Cáo JSON
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {getFilteredLogs().map((log: any, idx: number) => (
                    <div key={idx} className="p-2 bg-slate-50 rounded border border-slate-200 text-[11px] font-mono text-slate-700 flex justify-between">
                      <span>[{log.collectorName}] ({log.dataSource}): {log.details}</span>
                      <span className="text-slate-400 shrink-0 ml-2">{log.timestamp ? log.timestamp.split('T')[1]?.slice(0, 8) : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 4: Kết Quả Khôi Phục */}
            {activeTab === 'postReport' && restoreResult?.postRestoreReport && (
              <div className="space-y-3">
                <div className="font-bold text-emerald-800 text-xs flex items-center gap-2 border-b border-slate-100 pb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> SO SÁNH TRƯỚC VÀ SAU KHÔI PHỤC:
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="font-bold text-slate-700 mb-1">TRƯỚC KHÔI PHỤC</div>
                    <div>Độ tin cậy: <span className="font-bold text-slate-900">{restoreResult.postRestoreReport.before.confidence}%</span></div>
                    <div>Kết luận: <span className="font-bold text-slate-900">{restoreResult.postRestoreReport.before.decision}</span></div>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div className="font-bold text-emerald-800 mb-1">SAU KHÔI PHỤC</div>
                    <div>Độ tin cậy: <span className="font-bold text-emerald-700">{restoreResult.postRestoreReport.after.confidence}%</span></div>
                    <div>Kết luận: <span className="font-bold text-emerald-700">{restoreResult.postRestoreReport.after.decision}</span></div>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 font-bold text-xs">
                  Trạng thái Office: <span className="text-emerald-600">{restoreResult.postRestoreReport.healthCheck?.overallStatus} ✓</span>
                  <div className="text-[11px] font-normal text-slate-500 mt-1">{restoreResult.postRestoreReport.summary}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
