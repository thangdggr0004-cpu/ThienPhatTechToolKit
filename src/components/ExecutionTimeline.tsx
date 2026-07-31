import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface TimelineEvent {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'system';
}

interface ExecutionTimelineProps {
  events: TimelineEvent[];
}

const typeConfig = {
    info: { color: 'text-blue-400' },
    success: { color: 'text-emerald-400' },
    warning: { color: 'text-amber-400' },
    error: { color: 'text-red-400' },
    system: { color: 'text-slate-400' },
};

const ExecutionTimeline: React.FC<ExecutionTimelineProps> = ({ events }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  return (
    <div className="h-full flex flex-col bg-slate-950 rounded-xl border border-slate-800 shadow-lg p-4">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex-shrink-0 border-b border-slate-800 pb-3">Nhật ký Thực thi</h4>
        <div ref={scrollRef} className="flex-1 overflow-y-auto font-mono text-xs pr-2">
            <AnimatePresence>
                {events.length === 0 ? (
                    <div className="text-slate-600 italic h-full flex items-center justify-center">Chờ quét...</div>
                ) : (
                    events.map((event, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: i * 0.05 }}
                            className="flex gap-3 items-start mb-2"
                        >
                            <span className="text-slate-600">{event.timestamp}</span>
                            <span className={`flex-1 ${typeConfig[event.type].color}`}>{event.message}</span>
                        </motion.div>
                    ))
                )}
            </AnimatePresence>
        </div>
    </div>
  );
};

export default ExecutionTimeline;
