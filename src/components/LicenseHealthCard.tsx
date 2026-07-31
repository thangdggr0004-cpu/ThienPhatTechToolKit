import React from 'react';
import { ShieldCheck, ShieldAlert, Shield, ShieldQuestion, ShieldX } from 'lucide-react';
import { FinalVerdict } from './ActivationScanner.js';

interface LicenseHealthCardProps {
    verdict: FinalVerdict;
}

export default function LicenseHealthCard({ verdict }: LicenseHealthCardProps) {
    const config = {
        Genuine: { text: 'Healthy', icon: <ShieldCheck className="h-6 w-6" />, bg: 'bg-green-50', text_color: 'text-green-700', border: 'border-green-200' },
        Warning: { text: 'Warning', icon: <ShieldAlert className="h-6 w-6" />, bg: 'bg-amber-50', text_color: 'text-amber-700', border: 'border-amber-200' },
        Mixed: { text: 'Mixed', icon: <ShieldAlert className="h-6 w-6" />, bg: 'bg-amber-50', text_color: 'text-amber-700', border: 'border-amber-200' },
        Tampered: { text: 'Tampered', icon: <ShieldX className="h-6 w-6" />, bg: 'bg-red-50', text_color: 'text-red-700', border: 'border-red-200' },
        KMS: { text: 'Tampered', icon: <ShieldX className="h-6 w-6" />, bg: 'bg-red-50', text_color: 'text-red-700', border: 'border-red-200' },
        Unknown: { text: 'Unknown', icon: <ShieldQuestion className="h-6 w-6" />, bg: 'bg-slate-50', text_color: 'text-slate-700', border: 'border-slate-200' },
        None: { text: 'Not Activated', icon: <Shield className="h-6 w-6" />, bg: 'bg-slate-50', text_color: 'text-slate-700', border: 'border-slate-200' },
        Pending: { text: 'Awaiting Scan', icon: <Shield className="h-6 w-6" />, bg: 'bg-slate-50', text_color: 'text-slate-700', border: 'border-slate-200' },
    };

    const current = config[verdict] || config.Pending;

    return (
        <div className={`p-4 rounded-xl border shadow-sm ${current.bg} ${current.border}`}>
            <h3 className="font-bold text-slate-800 text-sm mb-2">License Health</h3>
            <div className={`flex items-center gap-3 ${current.text_color}`}>
                {current.icon}
                <span className="text-lg font-bold">{current.text}</span>
            </div>
        </div>
    );
}