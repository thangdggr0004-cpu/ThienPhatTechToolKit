import React from 'react';
import { IWindowsDiagnosticData } from './ActivationScanner.js';

interface ExecutiveSummaryProps {
    data: IWindowsDiagnosticData;
    scanTime: number;
}

const SummaryItem = ({ label, value, className = '' }) => (
    <div className="flex flex-col">
        <span className="text-xs text-slate-500">{label}</span>
        <span className={`font-bold text-sm text-slate-800 ${className}`}>{value || 'N/A'}</span>
    </div>
);

export default function ExecutiveSummary({ data, scanTime }: ExecutiveSummaryProps) {
    const { verdict, systemInfo } = data;

    const getVerdictColor = () => {
        switch (verdict) {
            case 'Genuine': return 'text-green-600';
            case 'Warning': return 'text-amber-600';
            case 'Tampered':
            case 'KMS': return 'text-red-600';
            default: return 'text-slate-600';
        }
    }

    return (
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-3">Executive Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <SummaryItem label="Windows Edition" value={systemInfo?.licenseChannel} />
                <SummaryItem 
                    label="Activation Status" 
                    value={systemInfo?.licenseStatus === 1 ? 'Activated' : 'Not Activated'} 
                    className={systemInfo?.licenseStatus === 1 ? 'text-green-600' : 'text-red-600'}
                />
                <SummaryItem label="License Channel" value={systemInfo?.licenseChannel} />
                <SummaryItem label="Final Verdict" value={verdict} className={getVerdictColor()} />
                <SummaryItem label="Confidence" value="N/A" />
                <SummaryItem label="Scan Time" value={scanTime > 0 ? `${(scanTime / 1000).toFixed(2)}s` : 'N/A'} />
            </div>
        </div>
    );
}