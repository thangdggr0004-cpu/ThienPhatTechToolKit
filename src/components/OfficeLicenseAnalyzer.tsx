import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  HelpCircle,
  Activity,
  Layers,
  FileCheck2,
  Lock,
  Zap,
  Copy,
  Download,
  Filter,
  Check,
  Info
} from 'lucide-react';

// Technical Tooltip Dictionary
const TOOLTIPS: Record<string, string> = {
  KMS: 'Key Management Service - Máy chủ quản lý bản quyền nội bộ hoặc công khai của Microsoft.',
  GVLK: 'Generic Volume License Key - Khóa mặc định dùng để kích hoạt qua máy chủ KMS.',
  MAK: 'Multiple Activation Key - Khóa kích hoạt trực tiếp số lượng lớn với máy chủ Microsoft.',
  Retail: 'Giấy phép bán lẻ kích hoạt 1 máy duy nhất theo tài khoản hoặc key cá nhân.',
  Volume: 'Giấy phép khối doanh nghiệp dành cho tổ chức cài đặt số lượng lớn.',
  Mondo: 'Phiên bản Office nội bộ thử nghiệm của Microsoft chứa đầy đủ tính năng Enterprise.',
  ClickToRun: 'Công nghệ đóng gói và cài đặt Office trực tuyến hiện đại (C2R) của Microsoft.',
  IFEO: 'Image File Execution Options - Khóa Registry dùng để can thiệp hoặc bẫy tiến trình Windows.',
  Authenticode: 'Công nghệ xác thực Chữ ký số mã nguồn chính hãng do Microsoft cấp.',
  SystemConfidence: 'System Diagnostic Confidence (Level 1) - Mức độ tin cậy của kết luận về tính toàn vẹn của hệ thống Office dựa trên tất cả bằng chứng thu thập.',
  ActivationConfidence: 'Activation Provenance Confidence (Level 2) - Mức độ tin cậy khi xác định phương thức và nguồn gốc kích hoạt Office.'
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
      // Mock Data for Dev Preview
      setTimeout(() => {
        setReport({
          timestamp: new Date().toLocaleString('vi-VN'),
          skuInfo: { skuName: 'Office 2021 ProPlusRetail', channel: 'Retail', bitness: 'x64', installType: 'ClickToRun', buildNumber: '16.0.17328' },
          provenance: {
            activationStatus: 'LICENSED',
            activationMethod: 'KMS Client (GVLK)',
            activationSource: 'Không xác định được KMS Host',
            confidence: 80,
            recommendation: 'Không xác định được KMS Host từ dữ liệu hiện có. Nếu cần xác minh nguồn kích hoạt, hãy kiểm tra cấu hình KMS bằng các công cụ quản trị Office.',
            evidenceUsed: [
              'ActivationType: KMS',
              'License Name: Office19ProPlus2019VL_KMS_Client_AE',
              'Status: LICENSED',
              'Reasoning: KMS Host = No Data (Engine không thu thập được dữ liệu tên Host từ hệ thống).'
            ],
            kmsHostInfo: { host: 'Không đọc được dữ liệu', port: 1688, reachability: 'UNKNOWN', hostType: 'KMS Host = No Data' }
          },
          matrix: [
            { componentName: 'Bản Quyền Office (OSPP License)', status: 'PASS', dataSource: 'OSPP', confidenceWeight: 20, details: 'Trạng thái: LICENSED (Key: ...37XMB)' },
            { componentName: 'Chữ Ký Số DLL Hệ Thống (sppc.dll)', status: 'PASS', dataSource: 'Authenticode', confidenceWeight: 25, details: 'Chữ ký: Valid (CN=Microsoft Corporation)' },
            { componentName: 'Kiểm Tra Tệp Thư Mục Office (sppcs.dll)', status: 'PASS', dataSource: 'FileIntegrity', confidenceWeight: 25, details: 'Sạch sẽ, không phát hiện tệp lạ trong VFS' },
            { componentName: 'Registry Hooks (IFEO Debugger)', status: 'PASS', dataSource: 'Registry', confidenceWeight: 20, details: 'Sạch sẽ, không có Registry Hook nào bẫy tiến trình' }
          ],
          confidenceResult: { confidencePercentage: 100, level: { label: 'Đã xác nhận', code: 'CONFIRMED' } },
          surgicalPlan: {
            stepCount: 0,
            summary: 'Hệ thống hoàn toàn sạch sẽ & nguyên bản. Không có bất kỳ hành động vi phẫu nào cần thực hiện.',
            targetActions: []
          },
          impactResult: { riskLevel: 'LOW', officeImpact: 'Không làm gián đoạn ứng dụng Office.', windowsImpact: 'Không tác động tệp hệ thống Windows System32.', clickToRunImpact: 'Dịch vụ ClickToRun duy trì bình thường.', licenseImpact: 'Bảo lưu giấy phép hợp lệ đang có.', isSafeToProceed: true },
          decisionResult: { actionAllowed: 'ALLOW_RESTORE', reason: 'Không phát hiện dấu hiệu can thiệp tệp/Registry cần khôi phục (100% System Confidence). Chi tiết phương thức kích hoạt xem tại Activation Provenance.', recommendedNextStep: 'Không cần can thiệp khôi phục.' },
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
    if (!window.confirm("HỆ THỐNG SẼ THỰC HIỆN GIAO DỊCH KHÔI PHỤC VI PHẨU AN TOÀN ENTERPRISE V3:\n\n1. Kiểm tra lá chắn SafetyGuard (Admin, Office Process, Risk Level).\n2. Giao dịch Atomic Transaction: Backup -> Execute -> Verify từng bước.\n3. Nếu bất kỳ bước nào lỗi -> Tự động Rollback 100% nguyên trạng.\n4. Re-scan 100% & Kiểm tra sức khỏe Office Health Check.\n\nBạn có muốn bắt đầu không?")) return;

    setIsRestoring(true);
    const isElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined;
    if (isElectron) {
      try {
        const res = await (window as any).electronAPI.restoreOfficeEngineV3();
        setRestoreResult(res);
        if (res.success) {
          alert("GIAO DỊCH VI PHẨU HOÀN TẤT THÀNH CÔNG:\n\n" + (res.postRestoreReport?.summary || 'Hệ thống đã phục hồi nguyên bản!'));
          setReport(res.postRestoreReport?.afterReport || report);
        } else {
          alert("CẢNH BÁO GIAO DỊCH KHÔI PHỤC:\n\n" + (res.error || 'Có lỗi xảy ra'));
        }
      } catch (err: any) {
        alert("Lỗi thực thi Giao dịch V3: " + err.message);
      }
    } else {
      setTimeout(() => {
        setRestoreResult({
          success: true,
          rolledBack: false,
          executionLogs: [
            '[BEGIN TRANSACTION TX-98213] Khởi tạo quy trình khôi phục vi phẫu...',
            '[COMMIT TRANSACTION TX-98213] Giao dịch vi phẫu hoàn tất thành công!',
            '[RE-SCAN] Quét lại dữ liệu 100%...',
            '[HEALTH CHECK] Office Health Check -> PASS 100% ✓'
          ],
          postRestoreReport: {
            before: { confidence: 100, decision: 'ALLOW_RESTORE' },
            after: { confidence: 100, decision: 'ALLOW_RESTORE' },
            healthCheck: { overallStatus: 'PASS', c2rServiceActive: true, wordLaunchable: true },
            summary: 'Office đã trở về trạng thái hoàn toàn nguyên bản của Microsoft (100% PASS).'
          }
        });
        alert("Demo: Giao dịch khôi phục vi phẫu hoàn tất 100% thành công!");
      }, 1200);
    }
    setIsRestoring(false);
  };

  const decision = report?.decisionResult?.actionAllowed || 'NONE';
  const systemConfidence = report?.confidenceResult?.confidencePercentage || 0;
  const activationConfidence = report?.provenance?.confidence || 0;
  const targetActionsCount = report?.surgicalPlan?.targetActions?.length || 0;

  // Audit Logs Filter & Copy/Export Functions
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
    a.download = `OfficeDiagnostic_AuditLog_${Date.now()}.txt`;
    a.click();
  };

  const exportAuditLogsJson = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OfficeDiagnostic_Report_${Date.now()}.json`;
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
      {/* HEADER & ONE-LINE QUICK SUMMARY BAR                                   */}
      {/* --------------------------------------------------------------------- */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-900 text-white rounded-lg shadow-2xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                ENTERPRISE MS OFFICE DIAGNOSTIC &amp; RECOVERY ENGINE V3
              </h3>
              <p className="text-[11px] text-slate-500">
                Công cụ Chẩn đoán Kỹ thuật Chuẩn Microsoft Enterprise • Thước đo Bằng chứng Toán học • Giao dịch Phục hồi Vi phẫu Atomic.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-slate-400 shrink-0">
            {report ? `Thời gian: ${report.timestamp}` : 'Chưa chạy chẩn đoán'}
          </span>
        </div>

        {/* 1-LINE SUMMARY BAR: Integrity, License, Activation, Activation Confidence, Recovery */}
        {report && (
          <div className="bg-slate-900 text-slate-200 px-3.5 py-2 rounded-lg text-xs font-mono flex flex-wrap items-center justify-between gap-2 shadow-inner">
            <div className="flex flex-wrap items-center gap-3">
              <span>Integrity: <strong className="text-emerald-400">{systemConfidence}%</strong></span>
              <span className="text-slate-600">|</span>
              <span>License: <strong className="text-emerald-400">{report.provenance?.activationStatus || 'N/A'}</strong></span>
              <span className="text-slate-600">|</span>
              <span>Activation: <strong className="text-blue-300">{report.provenance?.activationMethod || 'N/A'}</strong> {renderTooltipIcon('KMS')}</span>
              <span className="text-slate-600">|</span>
              <span>Activation Confidence: <strong className="text-blue-400">{activationConfidence}%</strong></span>
            </div>
            <div>
              Recovery: <strong className={targetActionsCount > 0 ? 'text-amber-400' : 'text-emerald-400'}>{targetActionsCount > 0 ? 'Kế hoạch Vi phẫu' : 'Not Required'}</strong>
            </div>
          </div>
        )}
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* LEVEL 1: SYSTEM DIAGNOSTIC SUMMARY CARDS                              */}
      {/* --------------------------------------------------------------------- */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Card 1: Office SKU */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phiên Bản Office (SKU)</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">LEVEL 1</span>
            </div>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              {report.skuInfo?.skuName || 'Office'}
              {renderTooltipIcon('ClickToRun')}
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Kênh: <span className="font-semibold text-slate-700">{report.skuInfo?.channel}</span> | Build: <span className="font-semibold text-slate-700">{report.skuInfo?.buildNumber}</span> ({report.skuInfo?.bitness})
            </div>
          </div>

          {/* Card 2: ĐỘ TIN CẬY CHẨN ĐOÁN HỆ THỐNG (System Diagnostic Confidence) */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                ĐỘ TIN CẬY CHẨN ĐOÁN HỆ THỐNG
                {renderTooltipIcon('SystemConfidence')}
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-900 text-white rounded">LEVEL 1</span>
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

          {/* Card 3: Kết luận hệ thống */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kết luận hệ thống</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">LEVEL 1</span>
            </div>
            <div className="text-xs font-semibold text-slate-800 leading-snug">
              {report.decisionResult?.reason}
            </div>
            {systemConfidence === 100 && activationConfidence < 100 && (
              <div className="text-[10px] text-slate-500 bg-slate-50 p-1.5 rounded border border-slate-200 leading-tight">
                ℹ️ <strong>System Diagnostic Confidence:</strong> 100% (Toàn vẹn tệp/Registry). <strong>Activation Confidence:</strong> {activationConfidence}% (Phương thức kích hoạt). Hai chỉ số này đánh giá hai khía cạnh độc lập.
              </div>
            )}
            <div className="text-[11px] text-blue-700 font-semibold">👉 {report.decisionResult?.recommendedNextStep}</div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* LEVEL 2: ACTIVATION PROVENANCE (ACTIVATION PROVENANCE CONFIDENCE)     */}
      {/* --------------------------------------------------------------------- */}
      {report && report.provenance && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600" /> THÔNG TIN NGUỒN GỐC KÍCH HOẠT (ACTIVATION PROVENANCE)
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">LEVEL 2</span>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold font-mono bg-blue-50 text-blue-800 border border-blue-200 flex items-center">
                Activation Confidence: {report.provenance.confidence}%
                {renderTooltipIcon('ActivationConfidence')}
              </span>
            </div>
          </div>

          {/* PROPERTY GRID 5 FIELDS */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5 text-xs font-mono">
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Activation Status</span>
              <span className="font-bold text-emerald-700 text-xs mt-1 block">{report.provenance.activationStatus}</span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Activation Method</span>
              <span className="font-bold text-slate-800 text-xs mt-1 block flex items-center">
                {report.provenance.activationMethod}
                {renderTooltipIcon('GVLK')}
              </span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 md:col-span-2">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Thông tin nguồn kích hoạt</span>
              <span className="font-bold text-slate-800 text-xs mt-1 block">{report.provenance.activationSource}</span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 block uppercase flex items-center">
                ĐỘ TIN CẬY
                {renderTooltipIcon('ActivationConfidence')}
              </span>
              <span className="font-bold text-blue-700 text-xs mt-1 block">{report.provenance.confidence}%</span>
            </div>
          </div>

          {/* RECOMMENDATION NEUTRAL BOX */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-700 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900">Khuyến nghị kỹ thuật:</span> {report.provenance.recommendation}
            </div>
          </div>

          {/* KMS HOST INSPECTOR BREAKDOWN */}
          {report.provenance.kmsHostInfo && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] font-mono bg-slate-900 text-slate-300 p-2.5 rounded-lg">
              <div>KMS Host: <span className="font-bold text-white">{report.provenance.kmsHostInfo.host}</span></div>
              <div>Port: <span className="font-bold text-white">{report.provenance.kmsHostInfo.port || 1688}</span></div>
              <div>Reachability: <span className="font-bold text-emerald-400">{report.provenance.kmsHostInfo.reachability || 'UNKNOWN'}</span></div>
              <div>Host Type: <span className="font-bold text-blue-300">{report.provenance.kmsHostInfo.hostType}</span></div>
            </div>
          )}
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* ACTION CONTROL BUTTONS GRID (BUTTON UX SMART DISABLE)                 */}
      {/* --------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <button
          onClick={handleRunScanV3}
          disabled={isScanning || isRestoring}
          className="w-full py-3 px-4 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50"
        >
          {isScanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {isScanning ? 'ĐANG CHẨN ĐOÁN ENTERPRISE V3...' : 'CHẨN ĐOÁN BẢN QUYỀN ENGINE V3'}
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
            ? 'ĐANG THỰC THI GIAO DỊCH VI PHẨU...' 
            : targetActionsCount === 0 
              ? 'Hệ thống sạch - Không có thao tác cần thực hiện' 
              : 'KHÔI PHỤC VI PHẨU ENTERPRISE V3'}
        </button>
      </div>

      {/* RESTORE EXECUTION CONSOLE */}
      {restoreResult && restoreResult.executionLogs && (
        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-400 whitespace-pre-wrap shadow-inner space-y-2">
          <div className="font-bold text-emerald-300 border-b border-slate-800 pb-2 flex items-center justify-between">
            <span className="flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-400" /> NHẬT KÝ GIAO DỊCH VI PHẨU (TRANSACTION LOGS):</span>
            <span className="text-[10px] text-slate-400">Atomic Rollback Enabled ✓</span>
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
      {/* LEVEL 3: DETAILED DIAGNOSTICS & AUDIT TOOLS TABS                       */}
      {/* --------------------------------------------------------------------- */}
      {report && (
        <div className="space-y-3">
          <div className="bg-white p-1 rounded-xl border border-slate-200 flex flex-wrap gap-1 text-xs shadow-2xs">
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3.5 py-2 rounded-lg font-bold transition-all ${activeTab === 'matrix' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Ma Trận Bằng Chứng (Evidence Matrix)
            </button>
            <button
              onClick={() => setActiveTab('plan')}
              className={`px-3.5 py-2 rounded-lg font-bold transition-all ${activeTab === 'plan' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Kế Hoạch Vi Phẫu (Surgical Plan)
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3.5 py-2 rounded-lg font-bold transition-all ${activeTab === 'audit' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Nhật Ký Kiểm Toán (Audit Logs)
            </button>
            {restoreResult && restoreResult.postRestoreReport && (
              <button
                onClick={() => setActiveTab('postReport')}
                className={`px-3.5 py-2 rounded-lg font-bold transition-all ${activeTab === 'postReport' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'}`}
              >
                Báo Cáo Đối So Sánh (Before vs After)
              </button>
            )}
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 font-mono text-xs text-slate-700 min-h-[160px] shadow-2xs">
            
            {/* Tab 1: Evidence Matrix with ICONS (✔ ▲ ✖) */}
            {activeTab === 'matrix' && (
              <div className="space-y-3">
                <div className="font-bold text-slate-900 text-xs flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="flex items-center gap-2"><FileCheck2 className="w-4 h-4 text-blue-600" /> MA TRẬN CHẨN ĐOÁN ĐA BẰNG CHỨNG:</span>
                  <span className="text-[11px] text-slate-400 font-normal">Trọng số System Diagnostic Confidence</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-bold text-[10px] uppercase">
                        <th className="py-2 px-3">Thành Phần Kiểm Tra</th>
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
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> ✔ PASS
                              </span>
                            )}
                            {item.status === 'WARNING' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <AlertTriangle className="w-3 h-3 text-amber-600" /> ▲ WARNING
                              </span>
                            )}
                            {item.status === 'FAIL' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                                <XCircle className="w-3 h-3 text-red-600" /> ✖ FAILED
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

            {/* Tab 2: Surgical Plan */}
            {activeTab === 'plan' && (
              <div className="space-y-3">
                <div className="font-bold text-slate-900 text-xs flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Zap className="w-4 h-4 text-blue-600" /> KẾ HOẠCH KHÔI PHỤC VI PHẨU (SURGICAL RECOVERY PLAN):
                </div>
                <div className="text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-200 font-bold text-xs">
                  {report.surgicalPlan?.summary}
                </div>
                {report.surgicalPlan?.targetActions && report.surgicalPlan.targetActions.length > 0 ? (
                  <div className="space-y-2">
                    <div className="font-bold text-slate-800 text-xs">CÁC THAO TÁC CHỈ ĐỊNH AN TOÀN ({report.surgicalPlan.targetActions.length}):</div>
                    {report.surgicalPlan.targetActions.map((act: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col gap-1">
                        <div className="flex justify-between items-center font-bold text-slate-900 text-xs">
                          <span>Bước {idx + 1}: {act.type}</span>
                          <span className="text-[10px] text-slate-400 font-normal">Target: {act.target}</span>
                        </div>
                        <div className="text-[11px] text-slate-600">{act.description}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-emerald-700 font-bold p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Hệ thống nguyên bản 100%. Không có bất kỳ hành động vi phẫu nào cần thực hiện.
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Audit Logs */}
            {activeTab === 'audit' && (
              <div className="space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-600" /> NHẬT KÝ KIỂM TOÁN TỈ MỈ (EVIDENCE AUDIT LOGS):
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                      <Filter className="w-3 h-3 text-slate-500" />
                      <select 
                        value={logFilter} 
                        onChange={(e) => setLogFilter(e.target.value)} 
                        className="bg-transparent text-slate-700 font-bold text-[11px] focus:outline-none"
                      >
                        <option value="ALL">Tất cả Logs</option>
                        <option value="COLLECTOR">Collectors</option>
                        <option value="REGISTRY">Registry</option>
                        <option value="AUTHENTICODE">Authenticode</option>
                        <option value="LICENSE">Licensing</option>
                      </select>
                    </div>

                    <button 
                      onClick={copyAuditLogs} 
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold border border-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedLog ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      {copiedLog ? 'Đã Copy' : 'Copy'}
                    </button>

                    <button 
                      onClick={exportAuditLogsTxt} 
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold border border-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Download className="w-3 h-3 text-slate-600" /> TXT
                    </button>

                    <button 
                      onClick={exportAuditLogsJson} 
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Download className="w-3 h-3 text-blue-400" /> JSON Report
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

            {/* Tab 4: Post-Restore Report */}
            {activeTab === 'postReport' && restoreResult?.postRestoreReport && (
              <div className="space-y-3">
                <div className="font-bold text-emerald-800 text-xs flex items-center gap-2 border-b border-slate-100 pb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> BÁO CÁO ĐỐI SO SÁNH TRƯỚC VÀ SAU KHI KHÔI PHỤC:
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="font-bold text-slate-700 mb-1">TRƯỚC KHÔI PHỤC (BEFORE)</div>
                    <div>System Confidence: <span className="font-bold text-slate-900">{restoreResult.postRestoreReport.before.confidence}%</span></div>
                    <div>Decision: <span className="font-bold text-slate-900">{restoreResult.postRestoreReport.before.decision}</span></div>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div className="font-bold text-emerald-800 mb-1">SAU KHÔI PHỤC (AFTER)</div>
                    <div>System Confidence: <span className="font-bold text-emerald-700">{restoreResult.postRestoreReport.after.confidence}%</span></div>
                    <div>Decision: <span className="font-bold text-emerald-700">{restoreResult.postRestoreReport.after.decision}</span></div>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 font-bold text-xs">
                  Sức khỏe Office (Health Check): <span className="text-emerald-600">{restoreResult.postRestoreReport.healthCheck?.overallStatus} ✓</span>
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
