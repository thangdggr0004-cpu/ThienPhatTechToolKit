import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';

export interface Finding {
    category: 'File System' | 'Registry' | 'Scheduled Tasks' | 'Services' | 'KMS' | 'System';
    severity: 'clean' | 'warning' | 'danger';
    description: string;
    data?: any;
}

interface FindingsReportProps {
  findings: Finding[];
}

const severityConfig = {
    clean: { Icon: CheckCircle2, color: 'text-emerald-500', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
    warning: { Icon: AlertTriangle, color: 'text-amber-500', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
    danger: { Icon: ShieldAlert, color: 'text-red-500', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
};

const FindingCategory: React.FC<{title: string; items: Finding[]}> = ({ title, items }) => {
    const [isOpen, setIsOpen] = useState(true);
    
    if (items.length === 0) {
        return (
             <div className="border-b border-slate-200 last:border-b-0">
                <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        <span className="font-semibold text-sm text-slate-800">{title}</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Sạch</span>
                </div>
            </div>
        );
    }

    const worstSeverity = items.reduce((worst, item) => {
        if (worst === 'danger' || item.severity === 'danger') return 'danger';
        if (worst === 'warning' || item.severity === 'warning') return 'warning';
        return 'clean';
    }, 'clean');
    
    const config = severityConfig[worstSeverity];

    return (
        <div className="border-b border-slate-200 last:border-b-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <config.Icon className={`w-5 h-5 ${config.color}`} />
                    <span className="font-semibold text-sm text-slate-800">{title}</span>
                </div>
                <div className="flex items-center gap-3">
                     <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${config.bgColor} ${config.color.replace('text-', 'text-')}`}>{items.length} mục</span>
                    <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>
            <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                >
                    <div className="p-4 pt-0">
                        <div className={`space-y-2 border-l-2 ${config.borderColor} ml-2.5 pl-5 py-2`}>
                            {items.map((item, index) => (
                                <div key={index}>
                                    <p className="text-xs font-medium text-slate-700">{item.description}</p>
                                    {item.data && (
                                        <pre className="mt-1 text-[10px] bg-slate-100 p-2 rounded font-mono text-slate-600 break-all">{JSON.stringify(item.data, null, 2)}</pre>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}
            </AnimatePresence>
        </div>
    );
};


const FindingsReport: React.FC<FindingsReportProps> = ({ findings }) => {
    
    const categorizedFindings = {
        'File System': findings.filter(f => f.category === 'File System'),
        'Registry': findings.filter(f => f.category === 'Registry'),
        'Scheduled Tasks': findings.filter(f => f.category === 'Scheduled Tasks'),
        'Services': findings.filter(f => f.category === 'Services'),
        'KMS': findings.filter(f => f.category === 'KMS'),
        'System': findings.filter(f => f.category === 'System'),
    };
    
    if (findings.length === 0) {
        return (
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-center min-h-[200px]">
                <p className="text-slate-500 italic">Chưa có kết quả chẩn đoán.</p>
            </div>
        );
    }
    
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <FindingCategory title="Tệp tin & Thư mục" items={categorizedFindings['File System']} />
            <FindingCategory title="Tác vụ & Dịch vụ" items={[...categorizedFindings['Services'], ...categorizedFindings['Scheduled Tasks']]} />
            <FindingCategory title="KMS & Máy chủ" items={categorizedFindings['KMS']} />
            <FindingCategory title="Registry & Cấu hình Hệ thống" items={[...categorizedFindings['Registry'], ...categorizedFindings['System']]} />
        </div>
    );
};

export default FindingsReport;
