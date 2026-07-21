import React, { useState } from 'react';
import { Trash2, AlertCircle, CheckCircle, Download, List, Shield, Settings, Play, Database, History, RefreshCw, FileWarning } from 'lucide-react';
import { JunkCategory } from '../types';
import { generateJunkCleanerScript, downloadFile } from '../utils/scriptGenerator';

const initialJunkCategories: JunkCategory[] = [
  {
    id: 'system_temp',
    name: 'Tạm Hệ Thống (System Temp)',
    description: 'Các tệp tin ghi tạm do Windows sinh ra.',
    sizeMB: 0,
    checked: true,
    filesList: [],
  },
  {
    id: 'user_temp',
    name: 'Tạm Người Dùng (%TEMP%)',
    description: 'Rác lưu đệm từ các phần mềm (Office, Chrome...).',
    sizeMB: 0,
    checked: true,
    filesList: [],
  },
  {
    id: 'prefetch',
    name: 'Tệp đệm Khởi động (Prefetch)',
    description: 'Tệp hỗ trợ khởi động nhanh, lâu ngày tích tụ gây nặng.',
    sizeMB: 0,
    checked: true,
    filesList: [],
  },
  {
    id: 'win_update',
    name: 'Bộ nhớ tạm Windows Update',
    description: 'Các tệp tin cập nhật Windows tải về đã cài đặt xong.',
    sizeMB: 0,
    checked: true,
    filesList: [],
  },
  {
    id: 'system_logs',
    name: 'Nhật ký Hệ thống (*.log)',
    description: 'Nhật ký chẩn đoán lỗi của Windows phình to.',
    sizeMB: 0,
    checked: true,
    filesList: [],
  },
  {
    id: 'recycle_bin',
    name: 'Thùng rác (Recycle Bin)',
    description: 'Xóa vĩnh viễn tất cả tệp tin đã xóa tạm.',
    sizeMB: 0,
    checked: false,
    filesList: [],
  },
  {
    id: 'registry',
    name: 'Rác Registry & Lịch sử',
    description: 'Lịch sử hộp thoại Run, TypedURLs (Rất an toàn).',
    sizeMB: 0,
    checked: true,
    filesList: [],
  },
];

export default function JunkCleaner() {
  const [categories, setCategories] = useState<JunkCategory[]>(initialJunkCategories);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [cleaned, setCleaned] = useState(false);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [totalReclaimed, setTotalReclaimed] = useState(0);

  // Simulated progress state
  const [cleanProgress, setCleanProgress] = useState(0);

  React.useEffect(() => {
    handleScan();
  }, []);

  const handleToggle = (id: string) => {
    setCategories(prev =>
      prev.map(cat => (cat.id === id ? { ...cat, checked: !cat.checked } : cat))
    );
  };

  const handleSelectAll = (check: boolean) => {
    setCategories(prev => prev.map(cat => ({ ...cat, checked: check })));
  };

  const handleScan = async () => {
    setScanning(true);
    setScanned(false);
    setCleaned(false);
    setScanLogs([]);

    const isElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined;
    if (isElectron) {
      try {
        setScanLogs(['[*] Đang quét bộ đệm hệ thống...']);
        const data = await (window as any).electronAPI.scanJunk();
        
        setCategories(prev =>
          prev.map(cat => {
            const scanData = data[cat.id];
            if (scanData) {
              return {
                ...cat,
                sizeMB: scanData.sizeMB,
                filesList: scanData.filesList || []
              };
            }
            return cat;
          })
        );
        setScanning(false);
        setScanned(true);
      } catch (err: any) {
        setScanning(false);
        setScanned(true);
      }
    } else {
      setTimeout(() => {
        setCategories(prev => prev.map(cat => ({ ...cat, sizeMB: Math.floor(Math.random() * 500) + 50 })));
        setScanning(false);
        setScanned(true);
      }, 1500);
    }
  };

  const handleClean = async () => {
    setCleaning(true);
    setCleanProgress(0);
    
    // Simulate Progress UI for Cleaning
    let currentP = 0;
    const pInterval = setInterval(() => {
      currentP += Math.floor(Math.random() * 20) + 5;
      if (currentP > 90) currentP = 90;
      setCleanProgress(currentP);
    }, 300);

    const isElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined;
    const checkedMB = categories.filter(cat => cat.checked).reduce((acc, cat) => acc + cat.sizeMB, 0);

    const finalize = (mb: number) => {
      clearInterval(pInterval);
      setCleanProgress(100);
      setTotalReclaimed(mb);
      setTimeout(() => {
        setCleaning(false);
        setCleaned(true);
        setCategories(prev => prev.map(cat => (cat.checked ? { ...cat, sizeMB: 0, checked: false } : cat)));
      }, 800);
    };

    if (isElectron) {
      try {
        const activeCategories = categories.filter(cat => cat.checked).map(cat => cat.id);
        const result = await (window as any).electronAPI.cleanJunk(activeCategories);
        finalize(result.clearedMB);
      } catch (err: any) {
        clearInterval(pInterval);
        setCleaning(false);
        alert("Lỗi dọn rác: " + err.message);
      }
    } else {
      setTimeout(() => finalize(checkedMB), 2500);
    }
  };

  const totalSelectedSize = categories.filter(cat => cat.checked).reduce((acc, cat) => acc + cat.sizeMB, 0);
  const totalDurableSize = categories.reduce((acc, cat) => acc + cat.sizeMB, 0);

  const getCategoryIcon = (id: string) => {
    if (id.includes('temp')) return <Database className="w-5 h-5" />;
    if (id === 'recycle_bin') return <Trash2 className="w-5 h-5" />;
    if (id === 'registry') return <Settings className="w-5 h-5" />;
    if (id === 'prefetch' || id === 'system_logs') return <History className="w-5 h-5" />;
    return <FileWarning className="w-5 h-5" />;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* HEADER & OVERVIEW STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-2 bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-xl border border-slate-700 shadow-md flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Trash2 className="h-6 w-6 text-rose-400" />
              Dọn Dẹp Rác Hệ Thống
            </h2>
            <p className="text-sm text-slate-300 mt-1">
              Phân tích và giải phóng không gian lưu trữ bị chiếm dụng vô ích.
            </p>
          </div>
          <button 
            onClick={handleScan}
            disabled={scanning || cleaning}
            className={`p-3 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all ${scanning ? 'animate-pulse' : ''}`}
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center items-center">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Rác Phát Hiện</span>
          <span className="text-3xl font-black text-rose-600 font-mono">{(totalDurableSize / 1024).toFixed(2)} <span className="text-sm text-slate-500 font-bold">GB</span></span>
        </div>
      </div>

      {/* CATEGORY GRID */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Danh mục cần dọn</h3>
          <div className="flex gap-4 text-xs font-semibold">
            <button onClick={() => handleSelectAll(true)} className="text-blue-600 hover:text-blue-700 transition">Chọn tất cả</button>
            <button onClick={() => handleSelectAll(false)} className="text-slate-500 hover:text-slate-700 transition">Bỏ chọn hết</button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((cat) => {
            const isHeavy = cat.sizeMB > 500;
            return (
              <div 
                key={cat.id}
                onClick={() => { if (!scanning && !cleaning) handleToggle(cat.id) }}
                className={`group relative p-4 rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden ${
                  cat.checked 
                    ? 'bg-blue-50/50 border-blue-400 shadow-md -translate-y-1' 
                    : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm'
                }`}
              >
                {/* Custom Checkbox UI in top right */}
                <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  cat.checked ? 'bg-blue-600 border-blue-600' : 'border-slate-300 group-hover:border-blue-400'
                }`}>
                  {cat.checked && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                </div>

                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-transform duration-300 group-hover:rotate-6 ${
                  cat.checked ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
                }`}>
                  {getCategoryIcon(cat.id)}
                </div>
                
                <h4 className="text-[13px] font-bold text-slate-800 pr-6 line-clamp-1">{cat.name}</h4>
                <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 h-[30px]">{cat.description}</p>
                
                <div className="mt-3 pt-3 border-t border-slate-100/50 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">Dung lượng</span>
                  <span className={`text-xs font-black font-mono ${cat.sizeMB > 0 ? (isHeavy ? 'text-rose-600' : 'text-blue-600') : 'text-emerald-500'}`}>
                    {cat.sizeMB > 0 ? `${(cat.sizeMB / 1024).toFixed(2)} GB` : 'Sạch sẽ'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ACTION BAR */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs text-slate-500 block mb-1">Dung lượng sẽ giải phóng</span>
          <span className="text-2xl font-black text-blue-600 font-mono">{(totalSelectedSize / 1024).toFixed(2)} <span className="text-sm font-bold text-slate-500">GB</span></span>
        </div>
        
        <div className="w-full md:w-[300px]">
          {cleaning ? (
            <div className="space-y-2">
              <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase">
                <span>Đang dọn dẹp...</span>
                <span>{cleanProgress}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${cleanProgress}%` }} />
              </div>
            </div>
          ) : cleaned ? (
            <div className="flex items-center justify-center gap-2 p-3 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-200">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-bold">Đã dọn {(totalReclaimed / 1024).toFixed(2)} GB!</span>
            </div>
          ) : (
            <button
              onClick={handleClean}
              disabled={scanning || totalSelectedSize === 0}
              className="w-full p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> DỌN DẸP NGAY
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
