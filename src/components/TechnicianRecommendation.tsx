import React from 'react';
import { Activity, CheckCircle, AlertTriangle } from 'lucide-react';
import { FinalVerdict } from './ActivationScanner.js';

interface TechnicianRecommendationProps {
    verdict: FinalVerdict;
}

export default function TechnicianRecommendation({ verdict }: TechnicianRecommendationProps) {
    const recommendations = {
        Genuine: { text: 'No action required. System license is valid.', icon: <CheckCircle size={16} className="text-green-500" />, risk: 'Low' },
        Warning: { text: 'Review weak evidence. System may have non-standard configuration.', icon: <AlertTriangle size={16} className="text-amber-500" />, risk: 'Medium' },
        Tampered: { text: 'System is compromised. Recommend running cleanup script and installing a genuine license.', icon: <AlertTriangle size={16} className="text-red-500" />, risk: 'Critical' },
        KMS: { text: 'System is compromised. Recommend running cleanup script and installing a genuine license.', icon: <AlertTriangle size={16} className="text-red-500" />, risk: 'Critical' },
        default: { text: 'Run a scan to determine system status.', icon: <Activity size={16} className="text-slate-500" />, risk: 'Unknown' }
    };

    const rec = recommendations[verdict] || recommendations.default;

    return (
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 text-sm mb-2">Technician Recommendation</h3>
            <div className="flex items-start gap-3">
                <div className="mt-1">{rec.icon}</div>
                <div className="text-xs text-slate-600">
                    <p>{rec.text}</p>
                    <p className="mt-1"><strong>Risk Level:</strong> {rec.risk}</p>
                </div>
            </div>
        </div>
    );
}