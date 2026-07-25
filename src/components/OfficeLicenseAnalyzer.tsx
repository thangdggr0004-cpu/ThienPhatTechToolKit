import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Search, 
  RefreshCw, 
  FileCode2, 
  Cpu, 
  Layers, 
  CheckCircle2, 
  XCircle, 
  HelpCircle,
  Activity,
  Server
} from 'lucide-react';
import { OfficeDiagnosticReport } from '../services/OfficeLicensingEngine';

export default function OfficeLicenseAnalyzer() {
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [report, setReport] = useState<OfficeDiagnosticReport | null>(null);
  const [activeLayerTab, setActiveLayerTab] = useState<number>(8);

  const handleRunScanV2 = async () => {
    setIsScanning(true);
    const isElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined;
    if (isElectron) {
      try {
        const res = await (window as any).electronAPI.scanOfficeDeepV2();
        setReport(res);
      } catch (err: any) {
        setReport({
          timestamp: new Date().toLocaleString(),
          layers: {
            l1_infoCollection: { status: 'fail', details: 'Lỗi: ' + err.message },
            l2_licenseDetection: { isLicensed: false, channel: 'N/A', description: 'N/A', partialKey: 'N/A', licenseStatusText: 'N/A' },
            l3_dllIntegrity: [],
            l4_digitalSignature: { isAllValid: false, details: 'Không kiểm tra được' },
            l5_injectionDetection: [],
            l6_registryDetection: [],
            l7_servicesDetection: [],
            l8_evidenceEvaluation: {
              hasTampering: false,
              confidenceLevel: 'InsufficientData',
              riskScore: 0,
              verdict: 'InsufficientData',
              evidences: ['Chưa đủ dữ liệu để kết luận do lỗi thực thi quét: ' + err.message]
            }
          },
          hasIssues: true,
          summary: 'Chưa đủ dữ liệu để kết luận do lỗi hệ thống.'
        });
      }
    } else {
      // Mock Data for Dev Preview
      setTimeout(() => {
        setReport({
          timestamp: new Date().toLocaleString(),
          layers: {
            l1_infoCollection: { status: 'pass', details: 'Phát hiện Office 2021 C2R 64-bit tại C:\\Program Files\\Microsoft Office\\root\\Office16' },
            l2_licenseDetection: { isLicensed: true, channel: 'ProPlus2021Volume', description: 'Office 2021 ProPlus', partialKey: '37XMB', licenseStatusText: 'LICENSED', kmsHost: 'kms8.msguides.com' },
            l3_dllIntegrity: [
              { path: 'C:\\Windows\\System32\\sppc.dll', exists: true, sha256: '8F3A...11B9', authenticodeStatus: 'Valid', signerSubject: 'CN=Microsoft Corporation', publisher: 'Microsoft', isAuthentic: true },
              { path: 'C:\\Program Files\\Microsoft Office\\root\\vfs\\System\\sppcs.dll', exists: true, sha256: '99A2...FF10', authenticodeStatus: 'NotSigned', signerSubject: 'N/A', publisher: 'N/A', isAuthentic: false }
            ],
            l4_digitalSignature: { isAllValid: false, details: 'Phát hiện 1 tệp DLL mất chữ ký chuẩn Microsoft' },
            l5_injectionDetection: [],
            l6_registryDetection: [
              { targetPath: 'HKLM:\\SOFTWARE\\...\\sppsvc.exe', type: 'IFEO', propertyName: 'Debugger', value: 'KMSAuto.exe', isSuspicious: true, description: 'Phát hiện Hook IFEO' }
            ],
            l7_servicesDetection: [
              { name: 'ClickToRunSvc', displayName: 'Microsoft Office Click-to-Run Service', status: 'Running', startType: 'Automatic' },
              { name: 'sppsvc', displayName: 'Software Protection', status: 'Running', startType: 'Automatic' }
            ],
            l8_evidenceEvaluation: {
              hasTampering: true,
              confidenceLevel: 'High',
              riskScore: 85,
              verdict: 'Tampered',
              evidences: [
                'Phát hiện file DLL Ohook (sppcs.dll) trong thư mục Office',
                'Phát hiện Hook IFEO trên Registry (sppsvc.exe -> Debugger: KMSAuto.exe)'
              ]
            }
          },
          hasIssues: true,
          summary: 'PHÁT HIỆN CAN THIỆP BẢN QUYỀN LẬU CHẮC CHẮN! (Risk Score: 85)'
        });
      }, 1000);
    }
    setIsScanning(false);
  };

  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [restoreLog, setRestoreLog] = useState<string>('');

  const handleRestoreV2 = async () => {
    if (!window.confirm("HỆ THỐNG SẼ THỰC HIỆN PHỤC HỒI VI MÔ AN TOÀN 3 LỚP:\n\n1. Tạo điểm backupRegistry & DLL vào C:\\ProgramData\\ThienPhatToolkit\\Backup\\\n2. Ép dừng các dịch vụ Office để giải phóng bộ nhớ.\n3. Chỉ gỡ IFEO/AppInit hoặc SFC DLL hỏng (DLL zin chính hãng KHÔNG ĐỘNG ĐẾN).\n4. Khởi động lại dịch vụ & TỰ ĐỘNG QUÉT LẠI NHIỆM THU SAU SỬA.\n\nBạn có muốn thực hiện không?")) return;

    setIsRestoring(true);
    setRestoreLog('');
    const isElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined;
    if (isElectron) {
      try {
        const res = await (window as any).electronAPI.restoreOfficeDeepV2();
        setRestoreLog(res.log || '');
        if (res.success) {
          window.alert("NGHIỆM THU THÀNH CÔNG:\n\n" + res.message);
        } else {
          window.alert("CẢNH BÁO NGHIỆM THU:\n\n" + res.message);
        }
        // Auto re-scan to update evidence tree
        await handleRunScanV2();
      } catch (err: any) {
        window.alert("Lỗi thực thi phục hồi V2: " + err.message);
      }
    } else {
      setTimeout(() => {
        setRestoreLog("[1/6] Backup System32\\sppc.dll -> Successful\n[2/6] Stop Office Services -> Successful\n[3/6] Micro Repair -> Removed IFEO Debugger Hook\n[4/6] Start Services -> sppsvc Running\n[5/6] Auto Re-Scan -> Verified!\n[6/6] Result: Đã khôi phục Office về trạng thái gốc thành công.");
        alert("Demo: Đã khôi phục Office về trạng thái gốc thành công.");
        handleRunScanV2();
      }, 1500);
    }
    setIsRestoring(false);
  };

  const evalState = report?.layers?.l8_evidenceEvaluation;
  const verdict = evalState?.verdict || 'InsufficientData';

  const getVerdictBadge = () => {
    switch (verdict) {
      case 'Genuine':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Nguyên Bản (Genuine)</span>;
      case 'Tampered':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200"><XCircle className="w-4 h-4 text-red-600" /> Đã Bị Can Thiệp (Tampered)</span>;
      case 'KMS_Intercepted':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200"><AlertTriangle className="w-4 h-4 text-amber-600" /> Nghi Vấn KMS Host</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200"><HelpCircle className="w-4 h-4 text-slate-500" /> Chưa Đủ Dữ Liệu Để Kết Luận</span>;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm text-slate-800 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shadow-2xs">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              HỆ THỐNG CHẨN ĐOÁN DỰA TRÊN ĐA BẰNG CHỨNG (10-LAYER ENGINE)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Phân tích toàn diện Authenticode, WinVerifyTrust, Module Injection &amp; Registry Hooks. Tuyệt đối không kết luận cảm tính.
            </p>
          </div>
        </div>
        <div className="flex flex-col items-start md:items-end gap-1">
          {getVerdictBadge()}
          <span className="text-[11px] font-mono text-slate-400 mt-1">
            {report ? `Cập nhật: ${report.timestamp}` : 'Chưa chạy chẩn đoán'}
          </span>
        </div>
      </div>

      {/* Action Control Buttons Grid - Strictly Bounded */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <button
          onClick={handleRunScanV2}
          disabled={isScanning || isRestoring}
          className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50"
        >
          {isScanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {isScanning ? 'ĐANG PHÂN TÍCH 10 TẦNG...' : 'CHẨN ĐOÁN BẢN QUYỀN V2'}
        </button>

        <button
          onClick={handleRestoreV2}
          disabled={isScanning || isRestoring || (verdict !== 'Tampered' && verdict !== 'KMS_Intercepted')}
          className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] cursor-pointer ${
            (verdict === 'Tampered' || verdict === 'KMS_Intercepted') && !isRestoring
              ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-200 animate-pulse'
              : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
          }`}
        >
          {isRestoring ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
          {isRestoring ? 'ĐANG PHỤC HỒI HỆ THỐNG...' : 'PHỤC HỒI AN TOÀN V2 (3 LỚP)'}
        </button>
      </div>

      {restoreLog && (
        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-400 whitespace-pre-wrap shadow-inner">
          <div className="font-bold text-emerald-300 mb-1.5 border-b border-slate-700 pb-1.5 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-emerald-400" /> NHẬT KÝ QUY TRÌNH PHỤC HỒI AN TOÀN V2 &amp; TỰ ĐỘNG NGHIỆM THU:
          </div>
          {restoreLog}
        </div>
      )}

      {/* Report Layer Views */}
      {report && (
        <div className="space-y-4">
          {/* Navigation Tabs for Layers */}
          <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 flex flex-wrap gap-1 text-xs">
            <button 
              onClick={() => setActiveLayerTab(8)}
              className={`px-3 py-1.5 rounded-md font-bold transition-all ${activeLayerTab === 8 ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Tầng 8: Tổng Hợp Bằng Chứng
            </button>
            <button 
              onClick={() => setActiveLayerTab(3)}
              className={`px-3 py-1.5 rounded-md font-bold transition-all ${activeLayerTab === 3 ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Tầng 3 &amp; 4: DLL &amp; Chữ Ký Số
            </button>
            <button 
              onClick={() => setActiveLayerTab(6)}
              className={`px-3 py-1.5 rounded-md font-bold transition-all ${activeLayerTab === 6 ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Tầng 6: Registry Hooks (IFEO)
            </button>
            <button 
              onClick={() => setActiveLayerTab(5)}
              className={`px-3 py-1.5 rounded-md font-bold transition-all ${activeLayerTab === 5 ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Tầng 5: Process Injection
            </button>
            <button 
              onClick={() => setActiveLayerTab(2)}
              className={`px-3 py-1.5 rounded-md font-bold transition-all ${activeLayerTab === 2 ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Tầng 2: Cấp Phép &amp; KMS
            </button>
          </div>

          {/* Layer Content Render */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-xs text-slate-700 min-h-[160px]">
            {activeLayerTab === 8 && (
              <div className="space-y-3">
                <div className="font-bold text-blue-700 flex items-center gap-2 text-sm leading-relaxed">
                  <Activity className="w-4 h-4 text-blue-600 shrink-0" /> KẾT LUẬN CUỐI CÙNG: {report?.summary}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                  <div>Mức độ tin cậy: <span className="text-amber-700 font-bold">{evalState?.confidenceLevel || 'InsufficientData'}</span></div>
                  <div>|</div>
                  <div>Risk Score: <span className="text-red-600 font-bold">{evalState?.riskScore || 0}</span></div>
                  <div>|</div>
                  <div>Trạng thái bản quyền: <span className={`font-bold ${report?.layers?.l2_licenseDetection?.licenseStatusText?.includes('LICENSED') && !report?.layers?.l2_licenseDetection?.licenseStatusText?.includes('UNLICENSED') ? 'text-emerald-700' : 'text-amber-700'}`}>{report?.layers?.l2_licenseDetection?.licenseStatusText || 'N/A'}</span></div>
                </div>
                <div className="border-t border-slate-200 pt-2">
                  <div className="font-bold text-slate-800 mb-1">CÁC BẰNG CHỨNG THU THẬP ĐƯỢC ({evalState?.evidences?.length || 0}):</div>
                  {!evalState?.evidences || evalState.evidences.length === 0 ? (
                    <div className="text-emerald-600 font-semibold">✓ Không tìm thấy bất kỳ bằng chứng can thiệp lậu nào.</div>
                  ) : (
                    evalState.evidences.map((ev, i) => (
                      <div key={i} className="text-red-600 font-semibold pl-3">🔴 {ev}</div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeLayerTab === 3 && (
              <div className="space-y-2">
                <div className="font-bold text-blue-700 mb-2">DANH SÁCH FILE DLL HỆ THỐNG &amp; CHỮ KÝ AUTHENTICODE:</div>
                {report?.layers?.l3_dllIntegrity ? (
                  report.layers.l3_dllIntegrity.map((f, i) => (
                    <div key={i} className="p-2.5 bg-white rounded-lg border border-slate-200 flex flex-col gap-1 shadow-2xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800">{f.path}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${f.isAuthentic ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                          {f.isAuthentic ? 'Authentic Microsoft ✓' : 'Tampered / Unsigned ⚠️'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600">Authenticode Status: {f.authenticodeStatus} | Signer: {f.signerSubject}</div>
                      {f.sha256 && <div className="text-[10px] text-slate-400">SHA256: {f.sha256}</div>}
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500">Không có dữ liệu Layer 3.</div>
                )}
              </div>
            )}

            {activeLayerTab === 6 && (
              <div className="space-y-2">
                <div className="font-bold text-blue-700 mb-2">REGISTRY HOOKS &amp; INTERCEPTIONS (IFEO / APPINIT):</div>
                {!report?.layers?.l6_registryDetection || report.layers.l6_registryDetection.length === 0 ? (
                  <div className="text-emerald-600 font-semibold">✓ Không có Registry Hook nào bẫy sppsvc.exe / osppsvc.exe.</div>
                ) : (
                  report.layers.l6_registryDetection.map((r, i) => (
                    <div key={i} className="p-2.5 bg-red-50 rounded-lg border border-red-200 text-red-800">
                      <div className="font-bold">⚠️ Target: {r.targetPath}</div>
                      <div>Property: {r.propertyName} -&gt; Value: {r.value}</div>
                      <div className="text-[10px] text-red-600 mt-1">{r.description}</div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeLayerTab === 5 && (
              <div className="space-y-2">
                <div className="font-bold text-blue-700 mb-2">PROCESS INJECTION &amp; UNTRUSTED MODULES:</div>
                {!report?.layers?.l5_injectionDetection || report.layers.l5_injectionDetection.length === 0 ? (
                  <div className="text-emerald-600 font-semibold">✓ Các tiến trình Office &amp; sppsvc đang chạy sạch sẽ, không có DLL tiêm ngầm.</div>
                ) : (
                  report.layers.l5_injectionDetection.map((m, i) => (
                    <div key={i} className="p-2.5 bg-red-50 rounded-lg border border-red-200 text-red-800">
                      <div className="font-bold">🔴 Tiến trình: {m.processName} (PID: {m.pid})</div>
                      <div>Module: {m.moduleName} ({m.modulePath})</div>
                      <div className="text-[10px] text-slate-600">Hãng phát hành: {m.company || 'Unknown'}</div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeLayerTab === 2 && report?.layers?.l2_licenseDetection && (
              <div className="space-y-2 text-slate-700">
                <div className="font-bold text-blue-700 mb-2">TRẠNG THÁI CẤP PHÉP (LICENSING STATE):</div>
                <div>Kênh cấp phép: <span className="font-bold text-slate-900">{report.layers.l2_licenseDetection.channel}</span></div>
                <div>Mô tả: <span className="font-bold text-slate-900">{report.layers.l2_licenseDetection.description}</span></div>
                <div>Trạng thái: <span className="font-bold text-slate-900">{report.layers.l2_licenseDetection.licenseStatusText}</span></div>
                <div>Product Key 5 số cuối: <span className="font-bold text-slate-900">{report.layers.l2_licenseDetection.partialKey}</span></div>
                {report.layers.l2_licenseDetection.kmsHost && (
                  <div className="text-amber-700 font-bold mt-1">KMS Machine Name: {report.layers.l2_licenseDetection.kmsHost}</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
