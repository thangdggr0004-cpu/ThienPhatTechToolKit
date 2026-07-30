import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scan, Download, ShieldCheck, HardDrive, Server, FileText, Activity, AlertTriangle, GanttChartSquare, Microscope, Stethoscope, Info } from 'lucide-react';
import { generateWinActivationScript } from '../utils/scriptGenerator.js';

// Import new components
import RiskScoreGauge from './RiskScoreGauge.tsx';
import SystemSummary from './SystemSummary.tsx';
import DiagnosticStatusBar from './DiagnosticStatusBar.tsx';
import ExecutionTimeline, {
    TimelineEvent
} from './ExecutionTimeline.tsx';
import FindingsReport, { Finding } from './FindingsReport.tsx';

import { useCore } from '../context/CoreContext.js';
import { ExecutionEventType } from '../core/executor/ExecutionEvents.js';

// Helper to trigger file download
export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain') {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// --- NEW STATE AND TYPE DEFINITIONS ---

type ScanStatus = 'Pending' | 'Scanning' | 'Completed' | 'Error';
export type FinalVerdict = 'Genuine' | 'Warning' | 'KMS' | 'None' | 'Pending' | 'Tampered' | 'Mixed' | 'Unknown';

interface SystemInfo {
    cpuName?: string;
    ramTotalSize?: number;
    gpuName?: string;
    licenseStatus?: number;
    licenseChannel?: string;
    hasOA3Key?: boolean;
}

// This will be the main object passed to the new components
export interface IWindowsDiagnosticData {
    status: ScanStatus;
    verdict: FinalVerdict;
    systemInfo: SystemInfo | null;
    findings: Finding[];
}

interface DiagnosticState {
    status: ScanStatus;
    verdict: FinalVerdict;
    progress: number;
    statusText: string;
    riskScore: number;
    systemInfo: SystemInfo | null;
    timeline: TimelineEvent[];
    scanStartTime: number | null;
    findings: Finding[];
}

const initialState: DiagnosticState = {
    status: 'Pending',
    verdict: 'Pending',
    progress: 0,
    statusText: 'Sẵn sàng quét',
    riskScore: 0,
    systemInfo: null,
    scanStartTime: null,
    timeline: [],
    findings: [],
};

// Utility to add events to the timeline
const addTimelineEvent = (
    setter: React.Dispatch<React.SetStateAction<DiagnosticState>>,
    message: string,
    type: TimelineEvent['type'] = 'info'
) => {
    const timestamp = new Date().toLocaleTimeString('en-GB');
    setter(prev => ({
        ...prev,
        timeline: [...prev.timeline, { timestamp, message, type }],
    }));
};

// --- MAIN COMPONENT ---

export default function ActivationScanner() {
    const { registry, engine, executor, eventBus, historyManager } = useCore();
    const [winState, setWinState] = useState<DiagnosticState>(initialState);
    // The office state and logic can be removed or kept separate if needed
    // For this task, we focus only on the Windows UI
    const [activeTab, setActiveTab] = useState<'windows' | 'office'>('windows');

    // Helper to sleep for a given time
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const startWinScan = async () => {
        if (winState.status === 'Scanning') return;
        setWinState(initialState); // Reset state before scan
        await sleep(100);

        setWinState(prev => ({ ...prev, status: 'Scanning', progress: 5, statusText: 'Khởi tạo quét...', scanStartTime: Date.now() }));
        addTimelineEvent(setWinState, 'Bắt đầu quy trình chẩn đoán Windows bằng Architecture V3.', 'system');

        try {
            const action = registry.getById('WINDOWS_LICENSE_SCAN');
            if (!action) throw new Error('Action WINDOWS_LICENSE_SCAN không tồn tại trong Registry.');

            // Mock snapshot for initialization
            const mockSnapshot: any = {
                timestamp: Date.now(),
                os: { name: 'Windows 10', version: '10.0', buildNumber: '19045', architecture: 'x64' },
                windowsLicense: { status: 0, description: '', hasOA3Key: false, productKeyChannel: '', kmsPort: 0, gracePeriodRemaining: 0 },
                services: { sppsvc: 'unknown' },
                network: { isOnline: true, hostsFileModified: false },
                rawEvidence: []
            };

            let unsubscribe = () => {};
            let result;
            try {
                unsubscribe = eventBus.subscribe({
                    onEvent: (event) => {
                        if (event.type === ExecutionEventType.STATE_CHANGED && event.actionId === 'WINDOWS_LICENSE_SCAN') {
                            addTimelineEvent(setWinState, `Executor State: ${event.state}`, 'info');
                        }
                    }
                });

                setWinState(prev => ({ ...prev, progress: 30, statusText: 'Thực thi PowerShell backend qua IPC...' }));
                result = await executor.execute(action, mockSnapshot, eventBus);
            } finally {
                unsubscribe();
            }

            if (!result.success || !result.data) {
                throw new Error(result.error || 'Lỗi không xác định từ IPC Backend');
            }

            if (result.data.Success === false) {
                throw new Error(result.data.Error || 'Lỗi từ PowerShell script');
            }

            const winData = result.data.Data;
            if (!winData) {
                throw new Error('Dữ liệu trả về bị rỗng (Null/Empty).');
            }
            setWinState(prev => ({ ...prev, progress: 60, statusText: 'Phân tích dữ liệu WMI trả về...' }));
            await sleep(300);

            // Xây dựng các Evidence Objects V2 chuẩn định dạng
            const structuredEvidences: import('../core/domain/EvidenceModel.js').StructuredEvidence[] = [
                {
                    source: 'license',
                    confidence: 100,
                    timestamp: Date.now(),
                    rawData: winData,
                    productName: winData.description || 'Windows',
                    status: winData.status ?? 0,
                    channel: winData.productKeyChannel || 'Unknown',
                    kmsHost: winData.kmsHost || '',
                    kmsPort: winData.kmsPort ?? 0,
                    hasOA3Key: !!winData.hasOA3Key,
                    isGenericKey: false
                },
                ...(winData.piratedFiles || []).map((f: string) => ({
                    source: 'filesystem' as const,
                    confidence: 90,
                    timestamp: Date.now(),
                    rawData: f,
                    path: f,
                    exists: true
                })),
                ...(winData.suspiciousTasks || []).map((t: string) => ({
                    source: 'task' as const,
                    confidence: 85,
                    timestamp: Date.now(),
                    rawData: t,
                    name: t,
                    path: t,
                    action: 'execute',
                    suspicious: true
                })),
                ...(winData.hostsRedirects || []).map((h: string) => ({
                    source: 'hosts' as const,
                    confidence: 80,
                    timestamp: Date.now(),
                    rawData: h,
                    ip: '127.0.0.1',
                    hostname: h,
                    lineNumber: 1,
                    suspicious: true
                }))
            ];

            // Cập nhật Snapshot thực tế với dữ liệu Forensic đầy đủ
            const realSnapshot = {
                ...mockSnapshot,
                windowsLicense: {
                    status: winData.status ?? 0,
                    description: winData.description || 'Unknown',
                    hasOA3Key: !!winData.hasOA3Key,
                    productKeyChannel: winData.productKeyChannel || 'Unknown',
                    kmsPort: winData.kmsPort ?? 0,
                    kmsHost: winData.kmsHost || '',
                    gracePeriodRemaining: winData.gracePeriodRemaining ?? 0,
                    piratedFiles: winData.piratedFiles || [],
                    suspiciousTasks: winData.suspiciousTasks || [],
                    suspiciousServices: winData.suspiciousServices || [],
                    hostsRedirects: winData.hostsRedirects || []
                },
                structuredEvidences
            };

            setWinState(prev => ({ ...prev, progress: 80, statusText: 'Engine nội suy Recommendation Rules...' }));
            const engineCtx: any = { snapshot: realSnapshot, history: historyManager.getActiveSession().history, isOffline: false };
            const recommendations = engine.evaluateAll(engineCtx, () => true);

            let riskScore = 0;
            let verdict: FinalVerdict = 'Genuine';
            const newFindings: Finding[] = [];

            if (recommendations.length > 0) {
                recommendations.forEach(r => {
                    if (r.id === 'REC_WIN_REMOVE_CRACK') {
                        verdict = 'Tampered';
                        riskScore += 80;
                        newFindings.push({ category: 'KMS', severity: 'danger', description: r.reason });
                        addTimelineEvent(setWinState, `[ENGINE ALERT] ${r.title}`, 'error');
                    } else if (r.id === 'REC_WIN_ACTIVATE') {
                        if (verdict !== 'Tampered') verdict = 'Warning';
                        riskScore += 20;
                        newFindings.push({ category: 'System', severity: 'warning', description: r.reason });
                        addTimelineEvent(setWinState, `[ENGINE ALERT] ${r.title}`, 'warning');
                    }
                });
            } else {
                newFindings.push({ category: 'System', severity: 'clean', description: 'Hệ thống bản quyền an toàn, không có lỗi.' });
                addTimelineEvent(setWinState, 'Hệ thống bản quyền an toàn, không có Đề xuất nào.', 'success');
            }

            setWinState(prev => ({
                ...prev,
                status: 'Completed',
                verdict: verdict,
                progress: 100,
                riskScore: Math.min(100, riskScore),
                findings: newFindings,
                statusText: 'Hoàn tất chẩn đoán!',
                systemInfo: { ...prev.systemInfo, licenseStatus: winData.status, licenseChannel: winData.productKeyChannel, hasOA3Key: winData.hasOA3Key },
            }));

            // Record to History
            await historyManager.recordAction({ actionId: 'WINDOWS_LICENSE_SCAN', startTime: Date.now(), parameters: {}, isRollback: false, token: null as any, attempt: 1 }, result);
            addTimelineEvent(setWinState, `Đã ghi nhận Action History: Thành công.`, 'system');

        } catch (err: any) {
            const errorMessage = err.message || 'Lỗi không xác định.';
            setWinState(prev => ({ ...prev, status: 'Error', statusText: errorMessage }));
            addTimelineEvent(setWinState, `Quá trình quét thất bại: ${errorMessage}`, 'error');
        }
    };

    const handleGenerateResetScript = () => {
        // This function remains as it is not part of the core UI redesign
        const scriptContent = generateWinActivationScript('delete');
        downloadFile(scriptContent, 'Reset_Windows_License.bat', 'application/bat');
    };

    const isScanning = winState.status === 'Scanning';
    const isScanCompleted = winState.status === 'Completed' || winState.status === 'Error';

    const diagnosticData: IWindowsDiagnosticData = {
        status: winState.status,
        verdict: winState.verdict,
        systemInfo: winState.systemInfo,
        findings: winState.findings,
    };

    return (
        <div className="space-y-4" id="activation-scanner-container">
            {/* Header and Tab Switch */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="h-6 w-6 text-indigo-600" />
                      Enterprise Windows Diagnostics
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">Giao diện chẩn đoán và phân tích bản quyền chuyên sâu.</p>
                </div>
                 <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0">
                    <button onClick={() => setActiveTab('windows')} className={`px-4 py-2 rounded-md text-xs font-semibold ${activeTab === 'windows' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600'}`}>🪟 Windows</button>
                    <button onClick={() => setActiveTab('office')} className={`px-4 py-2 rounded-md text-xs font-semibold ${activeTab === 'office' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600'}`}>📄 Office</button>
                </div>
            </div>

            {/* Main Content Area */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'windows' ? (
                        <div className="grid grid-cols-12 gap-4 items-start">
                            {/* Left Panel */}
                            <div className="col-span-12 xl:col-span-3 space-y-4">
                                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                                    <button onClick={startWinScan} disabled={isScanning} className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-lg font-bold transition hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">
                                        {isScanning ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Scan size={18} />}
                                        {isScanning ? 'Đang Chẩn Đoán...' : 'Bắt Đầu Chẩn Đoán'}
                                    </button>
                                </div>

                                 {isScanCompleted && (
                                     <>
                                     <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm mb-4">
                                         <h4 className="font-bold text-slate-800">License Health</h4>
                                         <p className="text-sm text-slate-600">Verdict: {winState.verdict}</p>
                                     </div>
                                     <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                                         <button onClick={handleGenerateResetScript} className="w-full flex items-center justify-center gap-2 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold transition hover:bg-slate-700">
                                            <Download size={14} />
                                            Tạo Script Đặt Lại Bản Quyền
                                        </button>
                                    </div>
                                    </>
                                )}

                                {!isScanCompleted && !isScanning && (
                                     <div className="p-6 text-center bg-white rounded-xl border border-slate-200 shadow-sm text-sm text-slate-500">
                                        <Info className="mx-auto h-8 w-8 text-indigo-400 mb-2" />
                                        <p className="font-semibold text-slate-700">Sẵn sàng để quét</p>
                                        <p>Nhấn "Bắt Đầu Chẩn Đoán" để bắt đầu phân tích hệ thống của bạn.</p>
                                    </div>
                                )}

                                {isScanning && (
                                    <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                                        <h4 className="font-bold text-sm text-slate-800 mb-2">Đang thực hiện...</h4>
                                        <ExecutionTimeline events={winState.timeline} />
                                    </div>
                                )}

                            </div>

                            {/* Center and Right Panels */}
                            <div className="col-span-12 xl:col-span-9 space-y-4">
                               {isScanning && <DiagnosticStatusBar status={winState.statusText} progress={winState.progress} />}

                               {isScanCompleted ? (
                                     <>
                                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-4">
                                            <h3 className="text-lg font-bold">Executive Summary</h3>
                                            <p className="text-sm">Risk Score: {winState.riskScore}</p>
                                        </div>
                                     </>
                               ) : (
                                <div className="p-10 text-center bg-white rounded-xl border border-slate-200 shadow-sm h-full flex flex-col justify-center items-center">
                                    <GanttChartSquare className="h-12 w-12 text-slate-300 mb-4" />
                                    <h3 className="font-bold text-slate-700">Vùng Chờ Kết Quả Chẩn Đoán</h3>
                                    <p className="text-sm text-slate-500 mt-1">Kết quả phân tích chi tiết sẽ được hiển thị ở đây sau khi quá trình quét hoàn tất.</p>
                                </div>
                               )}
                            </div>
                        </div>
                    ) : (
                        <div className="p-10 text-center bg-white rounded-xl border border-slate-200 shadow-sm h-full">
                            <h3 className="font-bold text-slate-700">Giao diện chẩn đoán Office</h3>
                            <p className="text-sm text-slate-500">Khu vực này sẽ được thiết kế trong tương lai.</p>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
