import React, { useState } from 'react';
import { KeyRound, ShieldCheck, RefreshCw, Terminal, CheckCircle2, AlertTriangle, Play, Trash2, Cpu } from 'lucide-react';

export default function AdvancedActivation() {
  const [logs, setLogs] = useState<string[]>([]);
  const [running, setRunning] = useState<boolean>(false);
  const [lastStatus, setLastStatus] = useState<string | null>(null);

  const handleAction = async (mode: string, title: string) => {
    const isElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined;
    
    if (running) return;

    const confirm = window.confirm(`Bạn có chắc chắn muốn thực hiện: "${title}"?`);
    if (!confirm) return;

    setRunning(true);
    setLastStatus(null);
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Bắt đầu thực thi: ${title}...`]);

    if (isElectron && (window as any).electronAPI.runMasAction) {
      try {
        const res = await (window as any).electronAPI.runMasAction(mode);
        if (res && res.success) {
          setLogs(prev => [
            ...prev,
            `[${new Date().toLocaleTimeString()}] ${res.output || 'Đã hoàn tất lệnh thành công!'}`
          ]);
          setLastStatus('THÀNH CÔNG');
        } else {
          setLogs(prev => [
            ...prev,
            `[${new Date().toLocaleTimeString()}] LỖI: ${res?.error || 'Không thể thực thi lệnh.'}`
          ]);
          setLastStatus('LỖI');
        }
      } catch (err: any) {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] LỖI: ${err.message}`]);
        setLastStatus('LỖI');
      } finally {
        setRunning(false);
      }
    } else {
      setTimeout(() => {
        setLogs(prev => [...prev, `[MÔ PHỎNG] ${title} thành công!`]);
        setLastStatus('THÀNH CÔNG (MÔ PHỎNG)');
        setRunning(false);
      }, 1500);
    }
  };

  return (
    <div className="space-y-6" id="advanced-activation-container">
      {/* Header Banner */}
      <div className="relative p-6 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent rounded-xl border border-amber-500/20 overflow-hidden shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 shrink-0">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 border border-amber-500/30">
                🔒 TÍNH NĂNG ẨN - MỞ KHÓA BẰNG PIN 1111
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 mt-1">
              Tiện Ích Nâng Cao &amp; Kích Hoạt Hệ Thống (MAS Engine)
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Tích hợp công cụ MAS chính chủ được Việt hóa, hỗ trợ bản quyền HWID vĩnh viễn cho Windows &amp; Ohook cho Office.
            </p>
          </div>
        </div>
      </div>

      {/* Grid Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Windows HWID */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 hover:border-amber-400 hover:shadow-md transition-all space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">VĨNH VIỄN</span>
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">🪟 Windows HWID Activation</h3>
            <p className="text-xs text-slate-500">
              Kích hoạt bản quyền kỹ thuật số vĩnh viễn gắn liền với Mainboard máy tính (Windows 10/11). Cài lại Win tự động nhận lại bản quyền.
            </p>
          </div>
          <button
            onClick={() => handleAction('hwid', 'Kích hoạt Windows HWID Vĩnh viễn')}
            disabled={running}
            className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            {running ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            Kích Hoạt Windows HWID
          </button>
        </div>

        {/* Card 2: Office Ohook */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 hover:border-amber-400 hover:shadow-md transition-all space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">OHOOK VĨNH VIỄN</span>
              <ShieldCheck className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">🏢 Office Ohook Activation</h3>
            <p className="text-xs text-slate-500">
              Kích hoạt bản quyền Office vĩnh viễn (Office 2016/2019/2021/2024 &amp; Microsoft 365). Không lo hết hạn hay bị nhả key.
            </p>
          </div>
          <button
            onClick={() => handleAction('ohook', 'Kích hoạt Office Ohook Vĩnh viễn')}
            disabled={running}
            className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            {running ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            Kích Hoạt Office Ohook
          </button>
        </div>

        {/* Card 3: Windows Server / KMS38 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 hover:border-amber-400 hover:shadow-md transition-all space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">ĐẾN NĂM 2038</span>
              <Cpu className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">⚡ Windows KMS38 (Server/Enterprise)</h3>
            <p className="text-xs text-slate-500">
              Kích hoạt bản quyền cho các bản Windows Server, Enterprise LTSC/LTSB kéo dài tới năm 2038 không cần máy chủ ngầm.
            </p>
          </div>
          <button
            onClick={() => handleAction('kms38', 'Kích hoạt Windows KMS38')}
            disabled={running}
            className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            {running ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            Kích Hoạt KMS38
          </button>
        </div>

        {/* Card 4: Full MAS AIO Menu */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 hover:border-amber-400 hover:shadow-md transition-all space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">MENU ĐẦY ĐỦ</span>
              <Terminal className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">💻 Menu MAS AIO Gốc (CMD)</h3>
            <p className="text-xs text-slate-500">
              Khởi chạy giao diện Menu MAS AIO gốc trong cửa sổ Command Prompt để tùy chọn đầy đủ các tính năng nâng cao khác.
            </p>
          </div>
          <button
            onClick={() => handleAction('aio_menu', 'Mở Menu MAS AIO Gốc')}
            disabled={running}
            className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            {running ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            Mở Menu MAS AIO Gốc
          </button>
        </div>

        {/* Card 5: Clear Activation */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 hover:border-amber-400 hover:shadow-md transition-all space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">DỌN DẸP</span>
              <Trash2 className="w-5 h-5 text-rose-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">🧹 Gỡ Bỏ Bản Quyền &amp; Reset Gốc</h3>
            <p className="text-xs text-slate-500">
              Gỡ sạch key KMS lậu, trả lại trạng thái gốc của Microsoft Windows &amp; Office để chuẩn bị kích hoạt mới.
            </p>
          </div>
          <button
            onClick={() => handleAction('clean', 'Gỡ bỏ bản quyền KMS lậu & Reset')}
            disabled={running}
            className="w-full py-2 px-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            {running ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            Gỡ Bỏ Key &amp; Reset
          </button>
        </div>
      </div>

      {/* Real-time Output Log Terminal */}
      <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 space-y-3 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-slate-200 font-mono">Nhật ký thực thi (Terminal Output)</span>
          </div>
          {lastStatus && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${lastStatus.includes('THÀNH CÔNG') ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'}`}>
              Trạng thái: {lastStatus}
            </span>
          )}
        </div>

        <div className="h-48 overflow-y-auto font-mono text-[11px] space-y-1 text-slate-300 select-text p-2 bg-slate-900/50 rounded">
          {logs.length === 0 ? (
            <span className="text-slate-600 italic">Chọn một tính năng kích hoạt ở trên để bắt đầu thực thi...</span>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className={log.includes('LỖI') ? 'text-rose-400 font-bold' : log.includes('THÀNH CÔNG') ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
