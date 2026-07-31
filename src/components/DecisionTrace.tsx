import React from 'react';
import { GitCommitVertical } from 'lucide-react';

export default function DecisionTrace() {
  return (
    <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
      <h3 className="font-bold text-slate-800 flex items-center gap-2">
        <GitCommitVertical size={16} className="text-slate-500" />
        Decision Trace
      </h3>
      <p className="text-xs text-slate-500 mt-2">Decision tracing is not available in the current engine (Phase 1.0).</p>
      <p className="text-xs text-slate-500 mt-1">This component will visualize how evidence leads to a final verdict.</p>
    </div>
  );
}