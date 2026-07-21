import React, { useState, useEffect } from 'react';
import { Download, Info, X, RefreshCw } from 'lucide-react';

export default function AutoUpdater() {
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [dismissed, setDismissed] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    const isElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined;
    if (isElectron) {
      // Listen to events from autoUpdater
      (window as any).electronAPI.onUpdaterEvent((eventData: any) => {
        if (eventData.type === 'update-available') {
          // info is inside eventData.info
          setUpdateInfo({
            currentVersion: eventData.info.version || '?',
            latestVersion: eventData.info.version || 'Mới',
            releaseNotes: eventData.info.releaseNotes
          });
        } else if (eventData.type === 'download-progress') {
          setDownloading(true);
          setProgress(Math.round(eventData.progress.percent));
        } else if (eventData.type === 'update-downloaded') {
          setDownloading(false);
          setDownloaded(true);
          setProgress(100);
        }
      });

      // Trigger check
      setTimeout(() => {
        (window as any).electronAPI.checkForUpdates();
      }, 3000);
    }
  }, []);

  if (!updateInfo || dismissed) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[999] animate-fade-in-up">
      <div className="bg-white rounded-lg shadow-xl border border-blue-200 p-4 max-w-sm relative flex gap-3 overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
        <div className="mt-0.5">
          <div className="bg-blue-100 p-2 rounded-full">
            <Download className={`w-5 h-5 text-blue-600 ${downloading ? 'animate-bounce' : ''}`} />
          </div>
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-slate-800 text-sm flex items-center justify-between">
            Bản cập nhật mới có sẵn!
            <button onClick={() => setDismissed(true)} className="text-slate-400 hover:text-slate-700">
              <X className="w-4 h-4" />
            </button>
          </h4>
          <p className="text-xs text-slate-600 mt-1 mb-2">
            Phiên bản <strong>v{updateInfo.latestVersion}</strong> đã được phát hành.
          </p>
          
          {downloading && (
            <div className="mb-3">
              <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                <span>Đang tải ngầm...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5">
                <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {!downloading && !downloaded && (
              <button 
                onClick={() => {
                  setDownloading(true);
                  setProgress(0);
                  (window as any).electronAPI.downloadUpdate();
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold py-1.5 px-3 rounded transition-colors"
              >
                Tải xuống ngầm
              </button>
            )}
            
            {downloaded && (
              <button 
                onClick={() => {
                  (window as any).electronAPI.installUpdate();
                }}
                className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold py-1.5 px-3 rounded transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> Cài đặt & Khởi động lại
              </button>
            )}

            {!downloading && !downloaded && (
              <button 
                onClick={() => setDismissed(true)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium py-1.5 px-3 rounded transition-colors"
              >
                Để sau
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
