import React from 'react';
import { Stethoscope } from 'lucide-react';

export default function Diagnostics() {
  return (
    <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
      <h3 className="font-bold text-slate-800 flex items-center gap-2">
        <Stethoscope size={16} className="text-slate-500" />
        Diagnostics & Collector Issues
      </h3>
      <p className="text-xs text-slate-500 mt-2">No diagnostic data available from the current engine (Phase 1.0).</p>
      <p className="text-xs text-slate-500 mt-1">This area will report runtime errors, permission issues, and skipped collectors.</p>
    </div>
  );
}