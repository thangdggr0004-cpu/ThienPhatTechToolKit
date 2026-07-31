import React from 'react';
import { CheckCircle, AlertTriangle, HelpCircle, XCircle } from 'lucide-react';
import { Finding } from './FindingsReport.js';

interface EvidenceSummaryProps {
    findings: Finding[];
}

const SummaryItem = ({ icon, label, count, colorClass }) => (
    <div className="flex items-center justify-between text-xs p-2 rounded-md bg-slate-50">
        <div className={`flex items-center gap-2 font-medium ${colorClass}`}>
            {icon}
            <span>{label}</span>
        </div>
        <span className={`font-bold text-sm ${colorClass}`}>{count}</span>
    </div>
);

export default function EvidenceSummary({ findings }: EvidenceSummaryProps) {
    const positiveCount = findings.filter(f => f.severity === 'clean').length;
    const negativeCount = findings.filter(f => f.severity === 'danger').length;
    const weakCount = findings.filter(f => f.severity === 'warning').length;

    return (
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800">Evidence Summary</h3>
            <div className="space-y-2 mt-2">
                <SummaryItem icon={<CheckCircle size={14} />} label="Positive Evidence" count={positiveCount} colorClass="text-green-600" />
                <SummaryItem icon={<AlertTriangle size={14} />} label="Negative Evidence" count={negativeCount} colorClass="text-red-600" />
                <SummaryItem icon={<HelpCircle size={14} />} label="Weak Evidence" count={weakCount} colorClass="text-amber-600" />
                <div className="flex items-center justify-between text-xs p-2 rounded-md bg-slate-100">
                    <div className="flex items-center gap-2 font-medium text-slate-500">
                        <XCircle size={14} />
                        <span>Collector Failures</span>
                    </div>
                    <span className="font-bold text-sm text-slate-500">N/A</span>
                </div>
            </div>
        </div>
    );
}