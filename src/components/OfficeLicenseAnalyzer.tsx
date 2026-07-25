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

  const evalState = report?.layers.l8_evidenceEvaluation;
  const verdict = evalState?.verdict || 'InsufficientData';

  const getVerdictBadge = () => {
    switch (verdict) {
      case 'Genuine':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"><CheckCircle2 className="w-4 h-4" /> Nguyên Bản (Genuine)</span>;
      case 'Tampered':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40"><XCircle className="w-4 h-4" /> Đã Bị Can Thiệp (Tampered)</span>;
      case 'KMS_Intercepted':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40"><AlertTriangle className="w-4 h-4" /> Nghi Vấn KMS Host</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-500/20 text-slate-300 border border-slate-500/40"><HelpCircle className="w-4 h-4" /> Chưa Đủ Dữ Liệu Để Kết Luận</span>;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl text-white space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              HỆ THỐNG CHẨN ĐOÁN DỰA TRÊN ĐA BẰNG CHỨNG (10-LAYER ENGINE)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Phân tích toàn diện Authenticode, WinVerifyTrust, Module Injection &amp; Registry Hooks. Tuyệt đối không kết luận cảm tính.
            </p>
          </div>
        </div>
        <div>
          {getVerdictBadge()}
        </div>
      </div>

      {/* Action Scan Button */}
      <div className="flex justify-between items-center bg-slate-950 p-4 rounded-xl border border-slate-800">
        <div className="text-xs text-slate-400">
          Trạng thái chẩn đoán: <span className="font-mono text-slate-200">{report ? `Hoàn tất lúc ${report.timestamp}` : 'Chưa quét'}</span>
        </div>
        <button
          onClick={handleRunScanV2}
          disabled={isScanning}
          className="py-2.5 px-5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2 shadow-lg transition-all active:scale-98 cursor-pointer disabled:opacity-50"
        >
          {isScanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {isScanning ? 'ĐANG PHÂN TÍCH 10 TẦNG...' : 'BẮT ĐẦU CHẨN ĐOÁN ĐA BẰNG CHỨNG V2'}
        </button>
      </div>

      {/* Report Layer Views */}
      {report && (
        <div className="space-y-4">
          {/* Navigation Tabs for Layers */}
          <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2 text-xs">
            <button 
              onClick={() => setActiveLayerTab(8)}
              className={`px-3 py-1.5 rounded-md font-bold transition-colors ${activeLayerTab === 8 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              Tầng 8: Tổng Hợp Bằng Chứng
            </button>
            <button 
              onClick={() => setActiveLayerTab(3)}
              className={`px-3 py-1.5 rounded-md font-bold transition-colors ${activeLayerTab === 3 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              Tầng 3 &amp; 4: DLL &amp; Chữ Ký Số
            </button>
            <button 
              onClick={() => setActiveLayerTab(6)}
              className={`px-3 py-1.5 rounded-md font-bold transition-colors ${activeLayerTab === 6 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              Tầng 6: Registry Hooks (IFEO)
            </button>
            <button 
              onClick={() => setActiveLayerTab(5)}
              className={`px-3 py-1.5 rounded-md font-bold transition-colors ${activeLayerTab === 5 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              Tầng 5: Process Injection
            </button>
            <button 
              onClick={() => setActiveLayerTab(2)}
              className={`px-3 py-1.5 rounded-md font-bold transition-colors ${activeLayerTab === 2 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              Tầng 2: Cấp Phép &amp; KMS
            </button>
          </div>

          {/* Layer Content Render */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 min-h-[160px]">
            {activeLayerTab === 8 && (
              <div className="space-y-3">
                <div className="font-bold text-blue-400 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> KẾT LUẬN CUỐI CÙNG: {report.summary}
                </div>
                <div className="text-slate-400">
                  Mức độ tin cậy: <span className="text-amber-300 font-bold">{evalState?.confidenceLevel}</span> | Risk Score: <span className="text-rose-400 font-bold">{evalState?.riskScore}</span>
                </div>
                <div className="border-t border-slate-800 pt-2">
                  <div className="font-bold text-slate-200 mb-1">CÁC BẰNG CHỨNG THU THẬP ĐƯỢC ({evalState?.evidences.length || 0}):</div>
                  {evalState?.evidences.length === 0 ? (
                    <div className="text-emerald-400">✓ Không tìm thấy bất kỳ bằng chứng can thiệp lậu nào.</div>
                  ) : (
                    evalState?.evidences.map((ev, i) => (
                      <div key={i} className="text-rose-400 pl-3">🔴 {ev}</div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeLayerTab === 3 && (
              <div className="space-y-2">
                <div className="font-bold text-blue-400">DANH SÁCH FILE DLL HỆ THỐNG &amp; CHỮ KÝ AUTHENTICODE:</div>
                {report.layers.l3_dllIntegrity.map((f, i) => (
                  <div key={i} className="p-2 bg-slate-900 rounded border border-slate-800 flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-200">{f.path}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] ${f.isAuthentic ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                        {f.isAuthentic ? 'Authentic Microsoft ✓' : 'Tampered / Unsigned ⚠️'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">Authenticode Status: {f.authenticodeStatus} | Signer: {f.signerSubject}</div>
                    {f.sha256 && <div className="text-[10px] text-slate-500">SHA256: {f.sha256}</div>}
                  </div>
                ))}
              </div>
            )}

            {activeLayerTab === 6 && (
              <div className="space-y-2">
                <div className="font-bold text-blue-400">REGISTRY HOOKS &amp; INTERCEPTIONS (IFEO / APPINIT):</div>
                {report.layers.l6_registryDetection.length === 0 ? (
                  <div className="text-emerald-400">✓ Không có Registry Hook nào bẫy sppsvc.exe / osppsvc.exe.</div>
                ) : (
                  report.layers.l6_registryDetection.map((r, i) => (
                    <div key={i} className="p-2 bg-slate-900 rounded border border-rose-900/50 text-rose-300">
                      <div>⚠️ Target: {r.targetPath}</div>
                      <div>Property: {r.propertyName} -&gt; Value: {r.value}</div>
                      <div className="text-[10px] text-slate-400">{r.description}</div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeLayerTab === 5 && (
              <div className="space-y-2">
                <div className="font-bold text-blue-400">PROCESS INJECTION &amp; UNTRUSTED MODULES:</div>
                {report.layers.l5_injectionDetection.length === 0 ? (
                  <div className="text-emerald-400">✓ Các tiến trình Office &amp; sppsvc đang chạy sạch sẽ, không có DLL tiêm ngầm.</div>
                ) : (
                  report.layers.l5_injectionDetection.map((m, i) => (
                    <div key={i} className="p-2 bg-slate-900 rounded border border-rose-900/50 text-rose-300">
                      <div>🔴 Tiến trình: {m.processName} (PID: {m.pid})</div>
                      <div>Module: {m.moduleName} ({m.modulePath})</div>
                      <div>Hãng phát hành: {m.company || 'Unknown'}</div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeLayerTab === 2 && (
              <div className="space-y-2">
                <div className="font-bold text-blue-400">TRẠNG THÁI CẤP PHÉP (LICENSING STATE):</div>
                <div>Kênh cấp phép: <span className="text-slate-200">{report.layers.l2_licenseDetection.channel}</span></div>
                <div>Mô tả: <span className="text-slate-200">{report.layers.l2_licenseDetection.description}</span></div>
                <div>Trạng thái: <span className="text-slate-200">{report.layers.l2_licenseDetection.licenseStatusText}</span></div>
                <div>Product Key 5 số cuối: <span className="text-slate-200">{report.layers.l2_licenseDetection.partialKey}</span></div>
                {report.layers.l2_licenseDetection.kmsHost && (
                  <div className="text-amber-400">KMS Machine Name: {report.layers.l2_licenseDetection.kmsHost}</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
