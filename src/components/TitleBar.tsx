import React, { useState, useEffect } from 'react';
import { Minus, Square, X, Cpu, MemoryStick } from 'lucide-react';

export default function TitleBar() {
  const [isHoverClose, setIsHoverClose] = useState(false);
  const [metrics, setMetrics] = useState<{ cpu: number; ram: number; ramTotal: number } | null>(null);

  useEffect(() => {
    const isElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined;
    if (!isElectron) return;

    // Get RAM total once
    (window as any).electronAPI.getHardwareInfo().then((info: any) => {
      if (info?.ramTotalSize) {
        setMetrics(prev => ({ cpu: prev?.cpu ?? 0, ram: prev?.ram ?? 0, ramTotal: info.ramTotalSize }));
      }
    }).catch(() => {});

    const timer = setInterval(async () => {
      try {
        const m = await (window as any).electronAPI.getRealtimeMetrics();
        setMetrics(prev => ({
          cpu: m.cpu ?? 0,
          ram: m.ram ?? 0,
          ramTotal: prev?.ramTotal ?? 0,
        }));
      } catch {}
    }, 5000);

    // Initial fetch
    (async () => {
      try {
        const m = await (window as any).electronAPI.getRealtimeMetrics();
        setMetrics(prev => ({ cpu: m.cpu ?? 0, ram: m.ram ?? 0, ramTotal: prev?.ramTotal ?? 0 }));
      } catch {}
    })();

    return () => clearInterval(timer);
  }, []);

  const handleMinimize = () => {
    const isElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined;
    if (isElectron) (window as any).electronAPI.windowMinimize();
  };

  const handleMaximize = () => {
    const isElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined;
    if (isElectron) (window as any).electronAPI.windowMaximize();
  };

  const handleClose = () => {
    const isElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined;
    if (isElectron) (window as any).electronAPI.windowClose();
  };

  const ramUsedGB = metrics ? ((metrics.ram / 100) * metrics.ramTotal).toFixed(1) : null;

  return (
    <div
      className="w-full h-[36px] bg-[#0f172a] flex items-center justify-between shrink-0 select-none z-50"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Left: Brand */}
      <div className="flex items-center gap-2.5 pl-4">
        <div className="w-4 h-4 bg-blue-500 rounded-sm flex items-center justify-center">
          <div className="w-2 h-2 border border-white rounded-[1px]" />
        </div>
        <span className="text-[11px] font-bold text-slate-200 tracking-wide">
          THIÊN PHÁT TECH TOOLKIT PRO
        </span>
      </div>

      {/* Center: Live Metrics */}
      {metrics && (
        <div
          className="flex items-center gap-4 text-[10px] font-mono"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          {/* CPU */}
          <div className="flex items-center gap-1.5 text-slate-400">
            <Cpu className="w-3 h-3 text-blue-400" />
            <span>CPU</span>
            <span
              className={`font-bold ${
                metrics.cpu > 80 ? 'text-red-400' : metrics.cpu > 50 ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {metrics.cpu}%
            </span>
            {/* mini bar */}
            <div className="w-14 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  metrics.cpu > 80 ? 'bg-red-500' : metrics.cpu > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${metrics.cpu}%` }}
              />
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-3 bg-slate-600" />

          {/* RAM */}
          <div className="flex items-center gap-1.5 text-slate-400">
            <MemoryStick className="w-3 h-3 text-sky-400" />
            <span>RAM</span>
            <span className="font-bold text-sky-400">
              {ramUsedGB}/{metrics.ramTotal}GB
            </span>
            <div className="w-14 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-500 rounded-full transition-all duration-1000"
                style={{ width: `${metrics.ram}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Right: Window Controls */}
      <div className="flex h-full" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <button
          onClick={handleMinimize}
          className="h-full px-4 hover:bg-white/10 text-slate-400 hover:text-white transition-colors flex items-center justify-center cursor-default"
        >
          <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />
        </button>
        <button
          onClick={handleMaximize}
          className="h-full px-4 hover:bg-white/10 text-slate-400 hover:text-white transition-colors flex items-center justify-center cursor-default"
        >
          <Square className="h-3 w-3" strokeWidth={2.5} />
        </button>
        <button
          onClick={handleClose}
          onMouseEnter={() => setIsHoverClose(true)}
          onMouseLeave={() => setIsHoverClose(false)}
          className="h-full px-4 hover:bg-red-500 text-slate-400 hover:text-white transition-colors flex items-center justify-center cursor-default"
        >
          <X className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
