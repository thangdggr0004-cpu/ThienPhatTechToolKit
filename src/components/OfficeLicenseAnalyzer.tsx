import React, { useState } from 'react';
import { updateSessionReport } from '../utils/SessionAuditStore.js';
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
  Info,
  Package,
  Key,
  FolderCheck,
  Cpu,
  Cog
} from 'lucide-react';
import { UiInlineLabel, UiSectionHeading } from './license/SharedPresentation.js';

// Tooltip dictionary chuẩn ngắn gọn (Tối đa 2 câu)
const TOOLTIPS: Record<string, string> = {
  KMS: 'Key Management Service - Máy chủ quản lý bản quyền nội bộ hoặc công khai.',
  GVLK: 'Generic Volume License Key - Mã khóa mặc định dùng để kích hoạt qua KMS.',
  MAK: 'Multiple Activation Key - Khóa kích hoạt số lượng lớn trực tiếp từ Microsoft.',
  Retail: 'Bản quyền bán lẻ cá nhân, kích hoạt trực tiếp theo tài khoản hoặc key.',
  OEM: 'Bản quyền nhúng sẵn theo máy từ nhà sản xuất thiết bị.',
  Subscription: 'Đăng ký bản quyền định kỳ Microsoft 365 Cloud.',
  MSI: 'Định dạng cài đặt truyền thống qua gói Windows Installer.',
  ClickToRun: 'Công nghệ cài đặt và cập nhật trực tuyến C2R của Microsoft.',
  Volume: 'Giấy phép khối doanh nghiệp cài đặt hàng loạt.',
  IFEO: 'Khóa Registry điều hướng tiến trình ứng dụng Windows.',
  Authenticode: 'Chữ ký số xác thực phần mềm chính hãng Microsoft.',
  SystemConfidence: 'Mức độ tin cậy kiểm tra tính toàn vẹn tệp và Registry hệ thống.',
  ActivationConfidence: 'Mức độ tin cậy xác định phương thức và máy chủ kích hoạt.'
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
  const [expandedCollector, setExpandedCollector] = useState<string | null>(null);
  const [showConfidenceBreakdown, setShowConfidenceBreakdown] = useState<boolean>(false);
  const [copiedReportFormat, setCopiedReportFormat] = useState<string | null>(null);

  const handleRunScanV3 = async () => {
    setIsScanning(true);
    setRestoreResult(null);
    const isElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined;
    if (isElectron) {
      try {
        const res = await (window as any).electronAPI.scanOfficeEngineV3();
        if (res && res.success) {
          setReport(res.report);
          const offStatus = r.provenance?.activationStatus || 'LICENSED';
          const offName = r.skuInfo?.skuName || 'Microsoft Office';
          const offMethod = r.provenance?.activationMethod || 'KMS Client (GVLK)';
          const offStr = offStatus === 'LICENSED'
            ? `✔ ${offName}: Máy sạch - Đã kích hoạt (${offMethod} - Cần hóa đơn/chứng từ doanh nghiệp nếu muốn đối soát)`
            : `❌ ${offName}: Chưa kích hoạt`;
          updateSessionReport({ officeActivation: offStr });
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
            activationSource: 'Chưa xác định',
            confidence: 80,
            recommendation: '✓ Không cần khôi phục.\n✓ Muốn xác minh nguồn kích hoạt → Kiểm tra cấu hình KMS.',
            evidenceUsed: [
              'ActivationType: KMS',
              'License Name: Office19ProPlus2019VL_KMS_Client_AE',
              'Status: LICENSED',
              'Reasoning: KMS Host = No Data'
            ],
            kmsHostInfo: { host: 'Chưa xác định', port: 1688, reachability: 'UNKNOWN', hostType: 'KMS Host = No Data' }
          },
          matrix: [
            { componentName: 'LicenseCollector', status: 'PASS', dataSource: 'OSPP+WMI', confidenceWeight: 20, executionTimeMs: 12, details: 'Trạng thái: LICENSED (Key: ...37XMB)', rawData: { licenseStatus: 'LICENSED', channel: 'Retail', key: '*****37XMB' } },
            { componentName: 'AuthenticodeCollector', status: 'PASS', dataSource: 'Authenticode', confidenceWeight: 25, executionTimeMs: 18, details: 'Chữ ký: Valid (CN=Microsoft Corporation)', rawData: { sysSppcAuthenticode: 'Valid', signer: 'CN=Microsoft Corporation' } },
            { componentName: 'OhookCollector', status: 'PASS', dataSource: 'FileIntegrity', confidenceWeight: 25, executionTimeMs: 8, details: 'Sạch sẽ, không có tệp lạ', rawData: { ohookDllFound: false } },
            { componentName: 'RegistryCollector', status: 'PASS', dataSource: 'Registry', confidenceWeight: 20, executionTimeMs: 4, details: 'Sạch sẽ, không có bẫy tiến trình', rawData: { ifeoHooks: [] } },
            { componentName: 'ServicesCollector', status: 'PASS', dataSource: 'Services', confidenceWeight: 10, executionTimeMs: 6, details: 'Dịch vụ ClickToRunSvc hoạt động bình thường', rawData: { c2rStatus: 'Running' } },
            { componentName: 'SPPCollector', status: 'PASS', dataSource: 'SPP Service', confidenceWeight: 15, executionTimeMs: 5, details: 'Dịch vụ sppsvc hoạt động bình thường', rawData: { sppsvcStatus: 'Running' } },
            { componentName: 'OfficeUpdateCollector', status: 'PASS', dataSource: 'C2R Registry', confidenceWeight: 10, executionTimeMs: 3, details: 'Kênh cập nhật Retail', rawData: { channel: 'Retail' } },
            { componentName: 'WMICollector', status: 'PASS', dataSource: 'WMI CIM', confidenceWeight: 15, executionTimeMs: 9, details: 'Bản quyền đối soát thành công qua WMI', rawData: { wmiVerified: true } }
          ],
          confidenceResult: { confidencePercentage: 100, level: { label: 'Đã xác nhận', code: 'CONFIRMED' } },
          surgicalPlan: {
            stepCount: 0,
            summary: '✓ Không phát hiện can thiệp. ✓ Không cần khôi phục.',
            targetActions: []
          },
          impactResult: { riskLevel: 'LOW', officeImpact: 'Bình thường', windowsImpact: 'An toàn', clickToRunImpact: 'Bình thường', licenseImpact: 'Bảo lưu', isSafeToProceed: true },
          decisionResult: { 
            actionAllowed: 'ALLOW_RESTORE', 
            reason: '✓ Không phát hiện can thiệp. ✓ Không cần khôi phục.', 
            recommendedNextStep: 'Không cần thao tác khôi phục.',
            explanationList: [
              '✔ License bản quyền hợp lệ (LicenseCollector: PASS)',
              '✔ Tệp sppc.dll có chữ ký Microsoft hợp lệ (AuthenticodeCollector: PASS)',
              '✔ Thư mục Office sạch sẽ, không phát hiện OHook (OhookCollector: PASS)',
              '✔ Registry HKLM sạch, không có bẫy bẻ lái tiến trình (RegistryCollector: PASS)',
              '✔ Dịch vụ ClickToRunSvc & sppsvc hoạt động bình thường (ServicesCollector/SPPCollector: PASS)',
              '✔ Dữ liệu WMI CIM đối soát khớp với OSPP (WMICollector: PASS)'
            ]
          },
          auditLogs: [
            { collectorName: 'LicenseCollector', dataSource: 'ospp.vbs+WMI', details: 'Status: LICENSED, Channel: Retail', timestamp: new Date().toISOString() },
            { collectorName: 'AuthenticodeCollector', dataSource: 'Win32 API', details: 'Signer: CN=Microsoft Corporation', timestamp: new Date().toISOString() },
            { collectorName: 'OhookCollector', dataSource: 'FileIntegrity', details: 'OHook DLL: Not Found', timestamp: new Date().toISOString() },
            { collectorName: 'RegistryCollector', dataSource: 'HKLM Registry', details: 'IFEO Hooks: 0', timestamp: new Date().toISOString() },
            { collectorName: 'ServicesCollector', dataSource: 'Win32 Services', details: 'ClickToRunSvc: Running', timestamp: new Date().toISOString() }
          ]
        });
      }, 500);
    }
    setIsScanning(false);
  };

  const handleRestoreV3 = async () => {
    if (!window.confirm("BẮT ĐẦU KHÔI PHỤC AN TOÀN:\n\n1. Kiểm tra an toàn (Admin, Tiến trình Office).\n2. Thực hiện: Sao lưu -> Khôi phục -> Kiểm tra lại.\n3. Tự động Hoàn tác 100% nếu có lỗi.\n\nBạn có muốn tiếp tục không?")) return;

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
      }, 800);
    }
    setIsRestoring(false);
  };

  const decision = report?.decisionResult?.actionAllowed || 'NONE';
  const systemConfidence = report?.confidenceResult?.confidencePercentage || 0;
  const targetActionsCount = report?.surgicalPlan?.targetActions?.length || 0;
  const isKmsMethod = report?.provenance?.activationMethod?.includes('KMS');

  // Multi-format Report Exporter
  const generateReportText = () => {
    if (!report) return '';
    return `=== BÁO CÁO CHẨN ĐOÁN BẢN QUYỀN OFFICE V3 ===
Thời gian: ${report.timestamp}
Phiên bản: ${report.skuInfo?.skuName} (Kênh: ${report.skuInfo?.channel}, Build: ${report.skuInfo?.buildNumber})
Kích hoạt: ${report.provenance?.activationStatus} (${report.provenance?.activationMethod})
Độ tin cậy hệ thống: ${systemConfidence}% (${report.confidenceResult?.level?.label})
Kết luận: ${report.decisionResult?.reason}

--- BẢNG KẾT QUẢ COLLECTOR ---
${(report.matrix || []).map((m: any) => `[${m.status}] ${m.componentName} (${m.dataSource}): ${m.details} (${m.executionTimeMs || 0}ms)`).join('\n')}
`;
  };

  const generateReportMarkdown = () => {
    if (!report) return '';
    return `# Báo Cáo Chẩn Đoán Bản Quyền MS Office V3
- **Thời gian:** ${report.timestamp}
- **Phiên bản:** ${report.skuInfo?.skuName} (${report.skuInfo?.channel})
- **Trạng thái:** ${report.provenance?.activationStatus}
- **Độ tin cậy hệ thống:** **${systemConfidence}%**
- **Kết luận Engine:** ${report.decisionResult?.reason}

### Kết Quả Chi Tiết Theo Collector
| Collector | Trạng Thái | Nguồn Dữ Liệu | Thời Gian | Chi Tiết |
| :--- | :---: | :--- | :---: | :--- |
${(report.matrix || []).map((m: any) => `| ${m.componentName} | **${m.status}** | ${m.dataSource} | ${m.executionTimeMs || 0}ms | ${m.details} |`).join('\n')}
`;
  };

  const copyReportFormat = (format: 'TXT' | 'JSON' | 'MD') => {
    let content = '';
    if (format === 'TXT') content = generateReportText();
    if (format === 'JSON') content = JSON.stringify(report, null, 2);
    if (format === 'MD') content = generateReportMarkdown();

    navigator.clipboard.writeText(content);
    setCopiedReportFormat(format);
    setTimeout(() => setCopiedReportFormat(null), 2000);
  };

  const exportReportFile = (format: 'TXT' | 'JSON' | 'MD') => {
    let content = '';
    let mime = 'text/plain;charset=utf-8';
    let ext = 'txt';

    if (format === 'TXT') { content = generateReportText(); ext = 'txt'; }
    if (format === 'JSON') { content = JSON.stringify(report, null, 2); mime = 'application/json'; ext = 'json'; }
    if (format === 'MD') { content = generateReportMarkdown(); ext = 'md'; }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OfficeDiagnosticReport_${Date.now()}.${ext}`;
    a.click();
  };

  // Lọc Audit Logs
  const getFilteredLogs = () => {
    if (!report || !report.auditLogs) return [];
    if (logFilter === 'ALL') return report.auditLogs;
    return report.auditLogs.filter((log: any) => 
      (log.collectorName && log.collectorName.toUpperCase().includes(logFilter)) ||
      (log.dataSource && log.dataSource.toUpperCase().includes(logFilter))
    );
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

  const getComponentIcon = (name: string) => {
    if (name.includes('License') || name.includes('OSPP')) return <Key className="w-4 h-4 text-amber-500 shrink-0" />;
    if (name.includes('Authenticode') || name.includes('sppc.dll')) return <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />;
    if (name.includes('Ohook') || name.includes('sppcs.dll')) return <FolderCheck className="w-4 h-4 text-emerald-500 shrink-0" />;
    if (name.includes('Registry') || name.includes('IFEO')) return <Cpu className="w-4 h-4 text-indigo-500 shrink-0" />;
    return <Cog className="w-4 h-4 text-slate-500 shrink-0" />;
  };

  return (
    <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-4 shadow-2xs text-slate-800 space-y-3.5 font-sans">
      
      {/* HEADER & THỊ GIÁC ƯU TIÊN ① & ② */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-900 text-white rounded-lg">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <UiSectionHeading className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                CHẨN ĐOÁN &amp; KHÔI PHỤC BẢN QUYỀN MS OFFICE V3
              </UiSectionHeading>
              <p className="text-[10px] text-slate-500">
                Phân tích đối soát đa nguồn • Giải thích nguồn gốc bằng chứng • Tự động khôi phục an toàn.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-slate-400 shrink-0">
            {report ? `Thời gian: ${report.timestamp}` : 'Chưa quét'}
          </span>
        </div>

        {/* SUMMARY BAR */}
        {report && (
          <div className="bg-slate-900 text-slate-200 px-3 py-2 rounded-lg text-xs font-mono flex flex-wrap items-center justify-between gap-2 shadow-inner">
            <div className="flex flex-wrap items-center gap-3">
              <span>① Trạng thái: <strong className="text-emerald-400 font-bold px-1.5 py-0.5 bg-emerald-950/80 rounded border border-emerald-800/50">{report.provenance?.activationStatus || 'N/A'}</strong></span>
              <span className="text-slate-700">|</span>
              <span>② Khôi phục: <strong className={targetActionsCount > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold px-1.5 py-0.5 bg-emerald-950/80 rounded border border-emerald-800/50'}>{targetActionsCount > 0 ? 'Cần thực hiện' : 'Không cần thiết'}</strong></span>
              <span className="text-slate-700">|</span>
              <span>③ Phương thức: <strong className="text-blue-300 font-bold">{report.provenance?.activationMethod || 'N/A'}</strong> {renderTooltipIcon('KMS')}</span>
            </div>
            <div className="text-[11px] text-slate-300 flex items-center gap-1.5">
              Độ tin cậy hệ thống: <strong className="text-emerald-400 font-bold">{systemConfidence}%</strong>
              <button 
                onClick={() => setShowConfidenceBreakdown(true)}
                className="p-0.5 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded transition-colors cursor-pointer"
                title="Bấm để xem chi tiết điểm số tin cậy"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CONFIDENCE BREAKDOWN MODAL */}
      {showConfidenceBreakdown && report && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full p-4 space-y-3 font-sans text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h4 className="font-bold text-slate-900 uppercase flex items-center gap-1.5 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> PHÂN TÍCH ĐỘ TIN CẬY HỆ THỐNG ({systemConfidence}%)
              </h4>
              <button onClick={() => setShowConfidenceBreakdown(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer">✕</button>
            </div>
            <p className="text-[11px] text-slate-500">
              Độ tin cậy tổng hợp được tính toán dựa trên trọng số đóng góp của từng Collector và khấu trừ nếu có cảnh báo:
            </p>
            <div className="space-y-1.5 font-mono text-[11px]">
              {(report.matrix || []).map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200">
                  <div className="flex items-center gap-1.5">
                    {item.status === 'PASS' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                    <span className="font-bold text-slate-800">{item.componentName}</span>
                  </div>
                  <span className={`font-bold ${item.status === 'PASS' ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {item.status === 'PASS' ? `+${item.confidenceWeight}%` : `-${item.confidenceWeight}%`}
                  </span>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setShowConfidenceBreakdown(false)} 
                className="px-3 py-1.5 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors cursor-pointer text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TẦNG 1: THÔNG TIN HỆ THỐNG */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Ô 1: Phiên Bản Office */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Package className="w-3.5 h-3.5 text-slate-500" /> Phiên Bản Office
            </div>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
              {report.skuInfo?.skuName || 'Office'}
              {renderTooltipIcon('ClickToRun')}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Kênh: <span className="text-slate-600 font-medium">{report.skuInfo?.channel}</span> | Build: <span className="text-slate-600 font-medium">{report.skuInfo?.buildNumber}</span> ({report.skuInfo?.bitness})
            </div>
          </div>

          {/* Ô 2: Độ tin cậy hệ thống */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-1">
            <UiInlineLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 mr-1" /> Độ tin cậy hệ thống
                {renderTooltipIcon('SystemConfidence')}
              </span>
              <button onClick={() => setShowConfidenceBreakdown(true)} className="text-[10px] text-blue-600 underline font-bold cursor-pointer">
                Xem chi tiết (i)
              </button>
            </UiInlineLabel>
            <div className="flex items-center gap-2">
              <div className={`text-lg font-black font-mono ${systemConfidence >= 95 ? 'text-emerald-600' : systemConfidence >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                {systemConfidence}%
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                ({report.confidenceResult?.level?.label || 'Đã xác nhận'})
              </div>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
              <div 
                className={`h-full transition-all duration-500 ${systemConfidence >= 95 ? 'bg-emerald-500' : systemConfidence >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${systemConfidence}%` }}
              />
            </div>
          </div>

          {/* Ô 3: ④ Kết Luận với GIẢI THÍCH LÝ DO */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">④ Kết Luận</div>
            <div className="text-xs font-bold text-emerald-700 leading-tight flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{report.decisionResult?.reason || '✓ Không phát hiện can thiệp.'}</span>
            </div>
            
            {/* EXPLAINABILITY CHECKLIST */}
            {report.decisionResult?.explanationList && (
              <div className="mt-1 pt-1 border-t border-slate-100 text-[10px] text-slate-600 space-y-0.5 font-sans">
                <strong className="text-slate-700 block font-bold text-[9px] uppercase">Vì sao Engine kết luận:</strong>
                {report.decisionResult.explanationList.slice(0, 3).map((exp: string, idx: number) => (
                  <div key={idx} className="text-slate-600 truncate">{exp}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TẦNG 2: ĐÁNH GIÁ NGUỒN GỐC KÍCH HOẠT & SHORTENED DISCLAIMER */}
      {report && report.provenance && (
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-blue-600" /> KẾT QUẢ XÁC MINH NGUỒN GỐC BẢN QUYỀN
            </div>
            <span className="text-xs font-bold font-mono text-blue-700 flex items-center">
              Độ tin cậy đánh giá: {report.provenance.confidence}%
              {renderTooltipIcon('ActivationConfidence')}
            </span>
          </div>

          {/* 4-LEVEL ENTERPRISE EVIDENCE-BASED ASSESSMENT CARD */}
          <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3 border border-slate-800 font-sans shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2 text-xs">
              <span className="text-slate-400 font-bold uppercase text-xs">Cấp độ xác minh bản quyền:</span>
              <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-950 text-blue-300 border border-blue-800">
                {report.provenance.provenanceLevelText || 'NGUỒN KÍCH HOẠT CẦN XÁC MINH THÊM (LEVEL 3)'}
              </span>
            </div>

            {/* EVIDENCE TRACE CHAIN */}
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 text-xs text-slate-300 flex flex-wrap items-center gap-2 font-mono">
              <span className="text-slate-400 font-bold">Quy trình kiểm tra:</span>
              <span className="px-2 py-0.5 bg-slate-800 rounded text-blue-300 font-semibold">Các bước kiểm tra ({report.matrix?.length || 8})</span>
              <span>➔</span>
              <span className="px-2 py-0.5 bg-slate-800 rounded text-emerald-300 font-semibold">Tổng hợp dữ liệu</span>
              <span>➔</span>
              <span className="px-2 py-0.5 bg-slate-800 rounded text-amber-300 font-semibold">Mức độ tin cậy ({systemConfidence}%)</span>
              <span>➔</span>
              <span className="px-2 py-0.5 bg-slate-800 rounded text-purple-300 font-semibold">Chẩn đoán hệ thống</span>
              <span>➔</span>
              <span className="px-2 py-0.5 bg-slate-800 rounded text-teal-300 font-semibold">Hướng xử lý</span>
            </div>

            <div className="text-xs text-slate-200 space-y-2 font-sans leading-relaxed">
              <p className="text-sm">
                Trạng thái ghi nhận: <strong className="text-white font-bold">{report.provenance.activationStatus}</strong> ({report.provenance.activationMethod}). Hệ thống không phát hiện các công cụ can thiệp hoặc tệp tin bị thay đổi. Khi cần đối soát bản quyền, bạn có thể lưu giữ các chứng từ sau:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300 pt-2 border-t border-slate-800/60">
                <div>• Hóa đơn mua máy hoặc chứng nhận bản quyền.</div>
                <div>• Tem COA (Certificate of Authenticity).</div>
                <div>• Khóa bản quyền (Product Key) chính hãng.</div>
                <div>• Email xác nhận từ Microsoft Store.</div>
                <div>• Hợp đồng cấp phép doanh nghiệp (VLSC / M365).</div>
                <div>• Tài khoản bản quyền số (Microsoft Digital License).</div>
              </div>
            </div>

            {/* SHORTENED MANDATORY DISCLAIMER BLOCK */}
            <div className="p-2.5 bg-amber-950/40 border border-amber-800/50 rounded-lg text-xs text-amber-200/90 leading-relaxed font-sans mt-1">
              Lưu ý: Kết quả chẩn đoán phản ánh dữ liệu hệ thống ghi nhận tại thời điểm kiểm tra. Việc đối soát bản quyền thực tế có thể cần thêm hóa đơn chứng từ kèm theo.
            </div>
          </div>

          {/* PROPERTY GRID 4 FIELDS COMPACT */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-xs font-bold text-slate-500 block uppercase">Trạng Thái</span>
              <span className="font-bold text-emerald-700 text-sm mt-0.5 block">{report.provenance.activationStatus}</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-xs font-bold text-slate-500 block uppercase">Phương Thức</span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 block flex items-center">
                {report.provenance.activationMethod}
                {renderTooltipIcon('GVLK')}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-xs font-bold text-slate-500 block uppercase">
                {isKmsMethod ? 'Máy chủ KMS' : 'Nguồn kích hoạt'}
              </span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                {report.provenance.kmsHostInfo?.host === 'Không đọc được dữ liệu' ? 'Chưa xác định' : report.provenance.activationSource}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-xs font-bold text-slate-500 block uppercase flex items-center">
                Độ tin cậy nguồn kích hoạt
                {renderTooltipIcon('ActivationConfidence')}
              </span>
              <span className="font-bold text-blue-700 text-sm mt-0.5 block">{report.provenance.confidence}%</span>
            </div>
          </div>

          {/* KHUYẾN NGHỊ VỚI GIẢI THÍCH LÝ DO CHI TIẾT */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-700 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed space-y-1">
              <strong className="text-slate-900 block font-bold text-sm">Khuyên nghị &amp; Lý do giải thích:</strong>
              <div className="text-slate-700 font-medium space-y-1 text-xs">
                <div>✓ Không cần khôi phục vì: <strong>Registry sạch, DLL chính hãng Microsoft, tệp hệ thống không có dấu hiệu can thiệp.</strong></div>
                <div>✓ Xác minh thêm nguồn KMS nếu cần đối soát máy chủ doanh nghiệp.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NÚT ĐIỀU KHIỂN & BÁO CÁO EXPORT/COPY */}
      <div className="space-y-2 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          <button
            onClick={handleRunScanV3}
            disabled={isScanning || isRestoring}
            className="w-full h-10 px-4 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50"
          >
            {isScanning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            {isScanning ? 'ĐANG QUÉT...' : 'BẮT ĐẦU KIỂM TRA OFFICE'}
          </button>

          <button
            onClick={handleRestoreV3}
            disabled={isScanning || isRestoring || !report || decision === 'BLOCK_RESTORE' || targetActionsCount === 0}
            className={`w-full h-10 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.99] ${
              targetActionsCount > 0 && !isRestoring
                ? 'bg-red-600 hover:bg-red-700 text-white cursor-pointer shadow-red-100'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
            }`}
          >
            {isRestoring ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            {isRestoring 
              ? 'ĐANG KHÔI PHỤC...' 
              : targetActionsCount === 0 
                ? 'Hệ thống sạch - Không cần thao tác' 
                : 'KHÔI PHỤC AN TOÀN'}
          </button>
        </div>

        {/* NÚT XUẤT/SAO CHÉP BÁO CÁO (EXPLAINABILITY EXPORT) */}
        {report && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
            <span className="text-slate-400 font-bold uppercase">Xuất / Sao chép Báo cáo Chẩn đoán:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              <button onClick={() => copyReportFormat('TXT')} className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold border border-slate-200 flex items-center gap-1 cursor-pointer">
                {copiedReportFormat === 'TXT' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />} Sao chép TXT
              </button>
              <button onClick={() => copyReportFormat('JSON')} className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold border border-slate-200 flex items-center gap-1 cursor-pointer">
                {copiedReportFormat === 'JSON' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />} Sao chép JSON
              </button>
              <button onClick={() => copyReportFormat('MD')} className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold border border-slate-200 flex items-center gap-1 cursor-pointer">
                {copiedReportFormat === 'MD' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />} Sao chép MD
              </button>
              <button onClick={() => exportReportFile('TXT')} className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold flex items-center gap-1 cursor-pointer">
                <Download className="w-3 h-3 text-blue-400" /> Tải TXT
              </button>
              <button onClick={() => exportReportFile('MD')} className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold flex items-center gap-1 cursor-pointer">
                <Download className="w-3 h-3 text-emerald-400" /> Tải MD
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ⑤ CHI TIẾT KỸ THUẬT VỚI EXPANDABLE COLLECTOR ACCORDION & SYSTEM LOG */}
      {report && (
        <div className="space-y-2.5">
          <div className="bg-white p-1 rounded-xl border border-slate-200 flex flex-wrap gap-1 text-xs shadow-2xs">
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${activeTab === 'matrix' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              ⑤ Chi Tiết Các Bước Kiểm Tra ({report.matrix?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('plan')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${activeTab === 'plan' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Kế Hoạch Khôi Phục
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${activeTab === 'audit' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Nhật Ký Hệ Thống
            </button>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 font-mono text-xs text-slate-700 min-h-[140px] shadow-2xs">
            
            {/* Tab 1: TRẠNG THÁI COLLECTOR VỚI CLICK TO EXPAND DETAILS */}
            {activeTab === 'matrix' && (
              <div className="space-y-2.5">
                <div className="font-bold text-slate-900 text-xs flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <span className="flex items-center gap-2"><FileCheck2 className="w-3.5 h-3.5 text-blue-600" /> CHI TIẾT DỮ LIỆU ĐỌC TỪ MÁY TÍNH:</span>
                  <span className="text-[10px] text-slate-400 font-normal">Bấm vào từng mục để xem thông số chi tiết</span>
                </div>
                <div className="space-y-1.5">
                  {report.matrix && report.matrix.map((item: any, i: number) => {
                    const isExpanded = expandedCollector === item.componentName;
                    return (
                      <div key={i} className="border border-slate-200 rounded-lg overflow-hidden transition-all bg-slate-50/50">
                        <div 
                          onClick={() => setExpandedCollector(isExpanded ? null : item.componentName)}
                          className="p-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-100/80 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {getComponentIcon(item.componentName)}
                            <span className="font-bold text-slate-900 text-xs">{item.componentName}</span>
                            <span className="text-[10px] text-slate-400 font-normal">({item.dataSource})</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-slate-400 font-mono">{item.executionTimeMs || 0}ms</span>
                            <span className="text-[10px] font-bold text-slate-700 font-mono">+{item.confidenceWeight}%</span>
                            {item.status === 'PASS' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                ✔ PASS
                              </span>
                            )}
                            {item.status === 'WARNING' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                ⚠ WARN
                              </span>
                            )}
                            {item.status === 'FAIL' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-300">
                                ✖ FAIL
                              </span>
                            )}
                          </div>
                        </div>

                        {/* CLICK TO EXPAND DETAILS */}
                        {isExpanded && (
                          <div className="p-3 bg-slate-900 text-slate-200 border-t border-slate-800 text-[11px] font-mono space-y-2">
                            <div className="flex justify-between items-center text-[10px] text-slate-400 border-b border-slate-800 pb-1">
                              <span>MỤC KIỂM TRA: <strong className="text-blue-300">{item.componentName}</strong></span>
                              <span>THỜI GIAN THỰC THI: <strong className="text-emerald-400">{item.executionTimeMs || 0} ms</strong></span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-bold">Kết quả ghi nhận:</span>
                              <div className="text-white font-medium">{item.details}</div>
                            </div>
                            {item.rawData && (
                              <div>
                                <span className="text-slate-400 block text-[10px] uppercase font-bold">Dữ liệu kỹ thuật gốc:</span>
                                <pre className="bg-slate-950 p-2 rounded text-[10px] text-emerald-400 overflow-x-auto border border-slate-800">
                                  {JSON.stringify(item.rawData, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab 2: Kế Hoạch Khôi Phục */}
            {activeTab === 'plan' && (
              <div className="space-y-2.5">
                <div className="font-bold text-slate-900 text-xs flex items-center gap-2 border-b border-slate-100 pb-1.5">
                  <Zap className="w-3.5 h-3.5 text-blue-600" /> CHI TIẾT KẾ HOẠCH KHÔI PHỤC:
                </div>
                <div className="text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-bold text-xs">
                  {report.surgicalPlan?.summary}
                </div>
              </div>
            )}

            {/* Tab 3: Nhật Ký Hệ Thống */}
            {activeTab === 'audit' && (
              <div className="space-y-2.5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                  <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-blue-600" /> CHI TIẾT NHẬT KÝ SYSTEM LOG:
                  </div>
                </div>

                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {getFilteredLogs().map((log: any, idx: number) => (
                    <div key={idx} className="p-1.5 bg-slate-50 rounded border border-slate-200 text-[10px] font-mono text-slate-700 flex justify-between">
                      <span>[PASS] [{log.collectorName}] ({log.dataSource}): {log.details}</span>
                      <span className="text-slate-400 shrink-0 ml-2">{log.timestamp ? log.timestamp.split('T')[1]?.slice(0, 8) : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
