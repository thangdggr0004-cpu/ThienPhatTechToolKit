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
  Cpu,
  Server,
  Zap,
  RotateCcw
} from 'lucide-react';

export default function OfficeLicenseAnalyzer() {
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [report, setReport] = useState<any | null>(null);
  const [restoreResult, setRestoreResult] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'matrix' | 'plan' | 'audit' | 'postReport'>('matrix');

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
          matrix: [
            { componentName: 'Bản Quyền Office (OSPP License)', status: 'PASS', dataSource: 'OSPP', confidenceWeight: 20, details: 'Trạng thái: LICENSED (Key: ...37XMB)' },
            { componentName: 'Chữ Ký Số DLL Hệ Thống (sppc.dll)', status: 'PASS', dataSource: 'Authenticode', confidenceWeight: 25, details: 'Chữ ký: Valid (CN=Microsoft Corporation)' },
            { componentName: 'Kiểm Tra Tệp Thư Mục Office (sppcs.dll)', status: 'FAIL', dataSource: 'FileIntegrity', confidenceWeight: 25, details: 'Phát hiện tệp sppcs.dll lạ trong thư mục Office VFS' },
            { componentName: 'Registry Hooks (IFEO Debugger)', status: 'FAIL', dataSource: 'Registry', confidenceWeight: 20, details: 'Phát hiện 1 Hook bẫy Registry chuyển hướng sppsvc.exe' }
          ],
          confidenceResult: { confidencePercentage: 72, level: { label: 'Có dấu hiệu', code: 'INDICATIONS_FOUND' } },
          surgicalPlan: {
            stepCount: 2,
            summary: 'Kế hoạch vi phẫu gồm 2 bước: Gỡ bỏ tệp sppcs.dll OHook giả mạo; Xóa bẫy Registry IFEO Debugger.',
            targetActions: [
              { type: 'REMOVE_OHOOK_DLL', target: 'vfs\\System\\sppcs.dll', description: 'Gỡ bỏ tệp sppcs.dll OHook giả mạo trong thư mục Office VFS' },
              { type: 'REMOVE_IFEO_KEYS', target: 'HKLM:\\...\\sppsvc.exe', description: 'Xóa bẫy Registry IFEO Debugger chuyển hướng sppsvc.exe' }
            ]
          },
          impactResult: { riskLevel: 'LOW', officeImpact: 'Không làm gián đoạn ứng dụng Office.', windowsImpact: 'Không tác động tệp hệ thống Windows System32.', clickToRunImpact: 'Dịch vụ ClickToRun duy trì bình thường.', licenseImpact: 'Bảo lưu giấy phép hợp lệ đang có.', isSafeToProceed: true },
          decisionResult: { actionAllowed: 'WARN_ONLY', reason: 'Có dấu hiệu bất thường (72% Confidence). Đưa ra cảnh báo cho người dùng.', recommendedNextStep: 'Xem xét kế hoạch vi phẫu trước khi cho phép thực thi.' },
          auditLogs: [
            { collectorName: 'CompatibilityLayer', dataSource: 'Registry/Filesystem', details: 'SKU: Office 2021 ProPlusRetail, Build: 16.0.17328' },
            { collectorName: 'OSPPCollector', dataSource: 'ospp.vbs', details: 'Status: LICENSED, Key: 37XMB' },
            { collectorName: 'OhookCollector', dataSource: 'Filesystem', details: 'Ohook DLL Found: true' }
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
            '--- Bước 1/2: Gỡ bỏ tệp sppcs.dll OHook giả mạo ---',
            '  [1/3 Backup] Tạo điểm sao lưu...',
            '  [2/3 Execute] Xóa file sppcs.dll...',
            '  [3/3 Verify] Xác minh tệp -> PASS ✓',
            '--- Bước 2/2: Xóa bẫy Registry IFEO Debugger ---',
            '  [1/3 Backup] Sao lưu Registry...',
            '  [2/3 Execute] Xóa khóa Debugger...',
            '  [3/3 Verify] Xác minh Registry -> PASS ✓',
            '[COMMIT TRANSACTION TX-98213] Giao dịch vi phẫu hoàn tất thành công!',
            '[RE-SCAN] Quét lại dữ liệu 100%...',
            '[HEALTH CHECK] Office Health Check -> PASS 100% ✓'
          ],
          postRestoreReport: {
            before: { confidence: 72, decision: 'WARN_ONLY' },
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
  const confidencePct = report?.confidenceResult?.confidencePercentage || 0;
  const confidenceLabel = report?.confidenceResult?.level?.label || 'Chưa chẩn đoán';

  const getDecisionBadge = () => {
    switch (decision) {
      case 'ALLOW_RESTORE':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Hệ Thống Chuẩn (ALLOW RESTORE)</span>;
      case 'WARN_ONLY':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs"><AlertTriangle className="w-4 h-4 text-amber-600" /> Cảnh Báo (WARN ONLY)</span>;
      case 'SCAN_ONLY':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300 shadow-2xs"><Search className="w-4 h-4 text-blue-600" /> Chỉ Cho Phép Quét (SCAN ONLY)</span>;
      case 'BLOCK_RESTORE':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300 shadow-2xs"><Lock className="w-4 h-4 text-red-600" /> CHẶN KHÔI PHỤC (BLOCK RESTORE)</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300"><HelpCircle className="w-4 h-4 text-slate-500" /> Chưa Chẩn Đoán</span>;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-slate-800 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 bg-blue-600 text-white rounded-2xl shadow-md shadow-blue-200">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              ENTERPRISE MS OFFICE DIAGNOSTIC &amp; RECOVERY ENGINE V3
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Bộ máy Phân tích Đa bằng chứng (Multi-Evidence) • Thước đo Độ tin cậy Toán học • Giao dịch Vi phẫu Atomic &amp; Rollback 100%.
            </p>
          </div>
        </div>
        <div className="flex flex-col items-start md:items-end gap-1">
          {getDecisionBadge()}
          <span className="text-[11px] font-mono text-slate-400 mt-1">
            {report ? `Thời gian: ${report.timestamp}` : 'Chưa chạy chẩn đoán'}
          </span>
        </div>
      </div>

      {/* SKU & Confidence Metrics Bar */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Phiên Bản Office (SKU)</div>
            <div className="text-sm font-bold text-slate-800">{report.skuInfo?.skuName || 'Office'}</div>
            <div className="text-[11px] text-slate-500 mt-1">
              Kênh: <span className="font-semibold text-slate-700">{report.skuInfo?.channel}</span> | Build: <span className="font-semibold text-slate-700">{report.skuInfo?.buildNumber}</span> ({report.skuInfo?.bitness})
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Thước Đo Độ Tin Cậy (% Confidence)</div>
            <div className="flex items-center gap-3">
              <div className={`text-2xl font-black ${confidencePct >= 95 ? 'text-emerald-600' : confidencePct >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                {confidencePct}%
              </div>
              <div className="text-xs font-bold px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 shadow-2xs">
                {confidenceLabel}
              </div>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${confidencePct >= 95 ? 'bg-emerald-500' : confidencePct >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${confidencePct}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tầng Ra Quyết Định (Decision Engine)</div>
            <div className="text-xs font-bold text-slate-800 leading-snug">{report.decisionResult?.reason}</div>
            <div className="text-[11px] text-blue-600 font-semibold mt-1">👉 {report.decisionResult?.recommendedNextStep}</div>
          </div>
        </div>
      )}

      {/* Activation Provenance Block */}
      {report && report.provenance && (
        <div className="bg-blue-50/70 p-4.5 rounded-xl border border-blue-200 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600" /> NGUỒN GỐC KÍCH HOẠT (ACTIVATION PROVENANCE ANALYZER)
            </div>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
              Độ tin cậy: {report.provenance.confidence}%
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
            <div className="bg-white p-2.5 rounded-lg border border-blue-100">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Phương Thức (Activation Method)</span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 block">{report.provenance.activationMethod}</span>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-blue-100">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Nguồn Cấp (Activation Source)</span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 block">{report.provenance.activationSource}</span>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-blue-100">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Khuyên Dùng (Recommendation)</span>
              <span className="font-bold text-blue-700 text-xs mt-0.5 block">{report.provenance.recommendation}</span>
            </div>
          </div>
          {report.provenance.kmsHostInfo && report.provenance.kmsHostInfo.host !== 'N/A' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] font-mono bg-white p-2.5 rounded-lg border border-blue-200 text-slate-700">
              <div><span className="text-slate-400">KMS Host:</span> <span className="font-bold text-slate-900">{report.provenance.kmsHostInfo.host}</span></div>
              <div><span className="text-slate-400">Port:</span> <span className="font-bold text-slate-900">{report.provenance.kmsHostInfo.port || 1688}</span></div>
              <div><span className="text-slate-400">Trạng thái:</span> <span className="font-bold text-emerald-700">{report.provenance.kmsHostInfo.reachability || 'UNKNOWN'}</span></div>
              <div><span className="text-slate-400">Phân loại:</span> <span className="font-bold text-blue-700">{report.provenance.kmsHostInfo.hostType || 'KMS Host'}</span></div>
            </div>
          )}
          {report.provenance.evidenceUsed && report.provenance.evidenceUsed.length > 0 && (
            <div className="text-[11px] text-slate-600 border-t border-blue-100 pt-2 flex items-center gap-1.5">
              <span className="font-bold text-blue-900">Bằng chứng đối soát:</span>
              <span>{report.provenance.evidenceUsed.join(' • ')}</span>
            </div>
          )}
        </div>
      )}

      {/* Action Control Buttons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <button
          onClick={handleRunScanV3}
          disabled={isScanning || isRestoring}
          className="w-full py-3.5 px-4 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50"
        >
          {isScanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {isScanning ? 'ĐANG CHẨN ĐOÁN ENTERPRISE V3...' : 'CHẨN ĐOÁN BẢN QUYỀN ENGINE V3'}
        </button>

        <button
          onClick={handleRestoreV3}
          disabled={isScanning || isRestoring || !report || decision === 'BLOCK_RESTORE' || (!report?.surgicalPlan?.targetActions || report.surgicalPlan.targetActions.length === 0)}
          className={`w-full py-3.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] cursor-pointer ${
            report && decision !== 'BLOCK_RESTORE' && report?.surgicalPlan?.targetActions?.length > 0 && !isRestoring
              ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-200 animate-pulse'
              : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
          }`}
        >
          {isRestoring ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
          {isRestoring ? 'ĐANG THỰC THI GIAO DỊCH VI PHẨU...' : 'KHÔI PHỤC VI PHẨU ENTERPRISE V3 (TRANSACTIONAL)'}
        </button>
      </div>

      {/* Restore Execution Logs Console */}
      {restoreResult && restoreResult.executionLogs && (
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-400 whitespace-pre-wrap shadow-inner space-y-2">
          <div className="font-bold text-emerald-300 border-b border-slate-800 pb-2 flex items-center justify-between">
            <span className="flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-400" /> NHẬT KÝ GIAO DỊCH VI PHẨU (TRANSACTION LOGS):</span>
            <span className="text-[10px] text-slate-400">Atomic Rollback Enabled ✓</span>
          </div>
          <div className="max-h-48 overflow-y-auto pr-2">
            {restoreResult.executionLogs.map((log: string, idx: number) => (
              <div key={idx} className={log.includes('FAIL') ? 'text-red-400 font-bold' : log.includes('COMMIT') ? 'text-emerald-300 font-bold' : ''}>
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Report Layer Tab Views */}
      {report && (
        <div className="space-y-4">
          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex flex-wrap gap-1 text-xs">
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${activeTab === 'matrix' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Ma Trận Bằng Chứng (Evidence Matrix)
            </button>
            <button
              onClick={() => setActiveTab('plan')}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${activeTab === 'plan' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Kế Hoạch Vi Phẫu (Surgical Plan)
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${activeTab === 'audit' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Nhật Ký Kiểm Toán (Audit Logs)
            </button>
            {restoreResult && restoreResult.postRestoreReport && (
              <button
                onClick={() => setActiveTab('postReport')}
                className={`px-4 py-2 rounded-lg font-bold transition-all ${activeTab === 'postReport' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'}`}
              >
                Báo Cáo Đối So Sánh (Before vs After)
              </button>
            )}
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-xs text-slate-700 min-h-[180px]">
            {/* Tab 1: Evidence Matrix */}
            {activeTab === 'matrix' && (
              <div className="space-y-3">
                <div className="font-bold text-blue-800 text-sm flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-blue-600" /> MA TRẬN CHẨN ĐOÁN ĐA BẰNG CHỨNG (EVIDENCE MATRIX):
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-bold text-[11px]">
                        <th className="py-2 px-3">Thành Phần Kiểm Tra</th>
                        <th className="py-2 px-3">Trạng Thái</th>
                        <th className="py-2 px-3">Nguồn Dữ Liệu</th>
                        <th className="py-2 px-3">Trọng Số (%)</th>
                        <th className="py-2 px-3">Chi Tiết Bằng Chứng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {report.matrix && report.matrix.map((item: any, i: number) => (
                        <tr key={i} className="hover:bg-white transition-colors">
                          <td className="py-2.5 px-3 font-bold text-slate-800">{item.componentName}</td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.status === 'PASS' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                              item.status === 'WARNING' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                              'bg-red-100 text-red-800 border border-red-200'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">{item.dataSource}</td>
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
                <div className="font-bold text-blue-800 text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-600" /> KẾ HOẠCH KHÔI PHỤC VI PHẨU (SURGICAL RECOVERY PLAN):
                </div>
                <div className="text-slate-700 bg-white p-3 rounded-lg border border-slate-200 font-bold">
                  {report.surgicalPlan?.summary}
                </div>
                {report.surgicalPlan?.targetActions && report.surgicalPlan.targetActions.length > 0 ? (
                  <div className="space-y-2">
                    <div className="font-bold text-slate-800">CÁC THAO TÁC CHỈ ĐỊNH AN TOÀN ({report.surgicalPlan.targetActions.length}):</div>
                    {report.surgicalPlan.targetActions.map((act: any, idx: number) => (
                      <div key={idx} className="p-3 bg-white rounded-lg border border-blue-200 flex flex-col gap-1 shadow-2xs">
                        <div className="flex justify-between items-center font-bold text-blue-900">
                          <span>Bước {idx + 1}: {act.type}</span>
                          <span className="text-[10px] text-slate-400 font-normal">Target: {act.target}</span>
                        </div>
                        <div className="text-[11px] text-slate-600">{act.description}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-emerald-700 font-bold p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    ✓ Hệ thống nguyên bản 100%. Không có bất kỳ hành động vi phẫu nào cần thực hiện.
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Audit Logs */}
            {activeTab === 'audit' && (
              <div className="space-y-2">
                <div className="font-bold text-blue-800 text-sm mb-2">NHẬT KÝ KIỂM TOÁN TỈ MỈ (EVIDENCE AUDIT LOGS):</div>
                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {report.auditLogs && report.auditLogs.map((log: any, idx: number) => (
                    <div key={idx} className="p-2 bg-white rounded border border-slate-200 text-[11px] font-mono text-slate-700 flex justify-between">
                      <span>[{log.collectorName}] ({log.dataSource}): {log.details}</span>
                      <span className="text-slate-400 shrink-0 ml-2">{log.timestamp ? log.timestamp.split('T')[1] : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 4: Post-Restore Report */}
            {activeTab === 'postReport' && restoreResult?.postRestoreReport && (
              <div className="space-y-3">
                <div className="font-bold text-emerald-800 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> BÁO CÁO ĐỐI SO SÁNH TRƯỚC VÀ SAU KHI KHÔI PHỤC:
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-red-50 rounded-xl border border-red-200">
                    <div className="font-bold text-red-800 mb-1">TRƯỚC KHÔI PHỤC (BEFORE)</div>
                    <div>Confidence: <span className="font-bold text-red-700">{restoreResult.postRestoreReport.before.confidence}%</span></div>
                    <div>Decision: <span className="font-bold text-red-700">{restoreResult.postRestoreReport.before.decision}</span></div>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <div className="font-bold text-emerald-800 mb-1">SAU KHÔI PHỤC (AFTER)</div>
                    <div>Confidence: <span className="font-bold text-emerald-700">{restoreResult.postRestoreReport.after.confidence}%</span></div>
                    <div>Decision: <span className="font-bold text-emerald-700">{restoreResult.postRestoreReport.after.decision}</span></div>
                  </div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200 text-slate-800 font-bold">
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
