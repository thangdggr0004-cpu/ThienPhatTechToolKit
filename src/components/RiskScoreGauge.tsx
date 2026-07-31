import React from 'react';
import { motion } from 'framer-motion';

interface RiskScoreGaugeProps {
  score: number; // 0-100
  status: 'Genuine' | 'Warning' | 'KMS' | 'None' | 'Pending';
}

const RiskScoreGauge: React.FC<RiskScoreGaugeProps> = ({ score, status }) => {
  const normalizedScore = Math.max(0, Math.min(100, score));
  const circumference = 2 * Math.PI * 52; // r = 52
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  const colorConfig = {
    Genuine: {
      stroke: 'rgb(22 163 74)', // green-600
      trail: 'rgb(220 252 231)', // green-100
      text: 'rgb(21 128 61)', // green-700
      label: 'An toàn'
    },
    Warning: {
      stroke: 'rgb(202 138 4)', // yellow-600
      trail: 'rgb(254 249 195)', // yellow-100
      text: 'rgb(161 98 7)', // yellow-700
      label: 'Cảnh báo'
    },
    KMS: {
      stroke: 'rgb(220 38 38)', // red-600
      trail: 'rgb(254 226 226)', // red-100
      text: 'rgb(185 28 28)', // red-700
      label: 'Rủi ro cao'
    },
     None: {
      stroke: 'rgb(100 116 139)', // slate-500
      trail: 'rgb(226 232 240)', // slate-200
      text: 'rgb(51 65 85)', // slate-700
      label: 'Chưa kích hoạt'
    },
    Pending: {
      stroke: 'rgb(148 163 184)', // slate-400
      trail: 'rgb(226 232 240)', // slate-200
      text: 'rgb(71 85 105)', // slate-600
      label: 'Chưa quét'
    }
  };

  const config = colorConfig[status];

  return (
    <div className="relative flex flex-col items-center justify-center gap-2 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider absolute top-4">Điểm Rủi Ro Hệ Thống</h4>
        <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 120 120">
            {/* Trail */}
            <circle
                cx="60" cy="60" r="52"
                fill="none"
                stroke={config.trail}
                strokeWidth="12"
            />
            {/* Progress */}
            <motion.circle
                cx="60" cy="60" r="52"
                fill="none"
                stroke={config.stroke}
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeLinecap="round"
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.5, ease: "easeOut" }}
            />
        </svg>
        <div className="absolute flex flex-col items-center">
            <span className="text-4xl font-black" style={{ color: config.text }}>
                {status === 'Pending' ? '?' : normalizedScore}
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: config.trail, color: config.text }}>
                {config.label}
            </span>
        </div>
    </div>
  );
};

export default RiskScoreGauge;
