import React from 'react';
import { Microscope } from 'lucide-react';
import { Finding } from './FindingsReport.js';

interface EvidenceExplorerProps {
    findings: Finding[];
}

export default function EvidenceExplorer({ findings }: EvidenceExplorerProps) {
  return (
    <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
      <h3 className="font-bold text-slate-800 flex items-center gap-2">
        <Microscope size={16} className="text-slate-500" />
        Evidence Explorer
      </h3>
       {findings.length > 0 ? (
        <div className="mt-2 text-xs text-slate-600 space-y-1">
            <p>The current engine provides high-level findings, not raw evidence objects. This view shows the available findings as a proxy.</p>
            <table className="w-full mt-2 border-collapse">
                <thead>
                    <tr className="border-b border-slate-200">
                        <th className="text-left p-1 font-semibold">Category</th>
                        <th className="text-left p-1 font-semibold">Severity</th>
                        <th className="text-left p-1 font-semibold">Description</th>
                    </tr>
                </thead>
                <tbody>
                {findings.map((finding, index) => (
                    <tr key={index} className="border-b border-slate-100">
                        <td className="p-1">{finding.category}</td>
                        <td className="p-1">{finding.severity}</td>
                        <td className="p-1">{finding.description}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
      ) : (
        <p className="text-xs text-slate-500 mt-2">No evidence collected yet. Run a scan to begin.</p>
      )}
    </div>
  );
}