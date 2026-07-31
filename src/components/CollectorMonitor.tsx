import React from 'react';
import { HardDrive, CheckCircle, AlertTriangle, XCircle, SkipForward, Clock } from 'lucide-react';

export default function CollectorMonitor() {
  return (
    <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
      <h3 className="font-bold text-slate-800 flex items-center gap-2">
        <HardDrive size={16} className="text-slate-500" />
        Collector Status
      </h3>
      <p className="text-xs text-slate-500 mt-2">No collector data available from the current engine (Phase 1.0).</p>
      <p className="text-xs text-slate-500 mt-1">This component will show the status (Success, Fail, Skip) and execution time for each data collector.</p>
    </div>
  );
}