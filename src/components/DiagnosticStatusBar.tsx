import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DiagnosticStatusBarProps {
  status: string;
  progress: number;
  isScanning: boolean;
}

const DiagnosticStatusBar: React.FC<DiagnosticStatusBarProps> = ({ status, progress, isScanning }) => {
  if (!isScanning) return null;

  return (
    <div className="w-full bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-3 flex items-center gap-4 shadow-lg">
      <div className="w-8 h-8 flex-shrink-0 rounded-full border-2 border-slate-500/50 border-t-blue-400 animate-spin" />
      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={status}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="text-sm font-semibold text-slate-100"
          >
            {status}
          </motion.div>
        </AnimatePresence>
        <div className="relative w-full h-1.5 bg-slate-700 rounded-full mt-1.5 overflow-hidden">
            <motion.div 
                className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
        </div>
      </div>
    </div>
  );
};

export default DiagnosticStatusBar;
