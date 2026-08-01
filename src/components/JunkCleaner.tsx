import React, { useState } from 'react';
import { Trash2, CheckCircle, Settings, Database, History, RefreshCw, FileWarning, List } from 'lucide-react';
import { JunkCategory } from '../types.js';
import { useTaskManager } from '../context/TaskManagerContext.js';
import { updateSessionReport, getSessionReport } from '../utils/SessionAuditStore.js';

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
  {
    id: 'bsod_dumps',
    name: 'File Dump Màn Hình Xanh (Minidump)',
    description: 'Báo cáo sự cố rác MEMORY.DMP chiếm từ vài trăm MB đến vài GB.',
    sizeMB: 0,
    checked: true,
    filesList: [],
  },
  {
    id: 'chrome_cache',
    name: 'Cache Trình Duyệt Google Chrome',
    description: 'Bộ nhớ đệm hình ảnh/web rác tích tụ của Chrome.',
    sizeMB: 0,
    checked: true,
    filesList: [],
  },
  {
    id: 'edge_cache',
    name: 'Cache Trình Duyệt MS Edge',
    description: 'Bộ nhớ đệm web rác của Microsoft Edge.',
    sizeMB: 0,
    checked: true,
    filesList: [],
  },
  {
    id: 'coccoc_cache',
    name: 'Cache Trình Duyệt Cốc Cốc',
    description: 'Bộ nhớ đệm rác từ trình duyệt Cốc Cốc.',
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

  // Modal to show files list for a category
  const [filesModalOpen, setFilesModalOpen] = React.useState(false);
  const [filesModalTitle, setFilesModalTitle] = React.useState('');
  const [filesModalList, setFilesModalList] = React.useState<string[]>([]);

  const openFilesModal = (catId: string) => {
    const cat = categories.find(c => c.id === catId);
    if (!cat) return;
    setFilesModalTitle(cat.name);
    setFilesModalList(Array.isArray(cat.filesList) ? cat.filesList : []);
    setFilesModalOpen(true);
  };

  const closeFilesModal = () => {
    setFilesModalOpen(false);
    setFilesModalList([]);
    setFilesModalTitle('');
  };

  const copyFilesToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(filesModalList.join('\n'));
      alert('Đã sao chép danh sách file vào clipboard');
    } catch (e) {
      alert('Không thể sao chép — trình duyệt không cho phép');
    }
  };

  const exportFilesList = () => {
    const blob = new Blob([filesModalList.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filesModalTitle.replace(/\s+/g,'_')}_files.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };


  const handleScan = async () => {
    setScanning(true);
    setScanned(false);
    setCleaned(false);

    const isElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined;
    if (isElectron) {
      try {
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

  const { startTask, updateTask, completeTask, failTask } = useTaskManager();

  const handleClean = async () => {
    setCleaning(true);
    setCleanProgress(0);
    startTask('junk-cleaner', 'Dọn Dẹp Rác Hệ Thống', 'Dọn Rác', 'Đang quét và giải phóng bộ nhớ tạm...', 'cleaner', 'from-emerald-500 to-teal-600');
    
    // Simulate Progress UI for Cleaning
    let currentP = 0;
    const pInterval = setInterval(() => {
      currentP += Math.floor(Math.random() * 15) + 5;
      if (currentP > 90) currentP = 90;
      setCleanProgress(currentP);
      updateTask('junk-cleaner', currentP, `Đang giải phóng bộ nhớ đệm: ${currentP}%`, `[+] Tiến trình dọn rác đạt ${currentP}%`);
    }, 300);

    const isElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined;
    const checkedMB = categories.filter(cat => cat.checked).reduce((acc, cat) => acc + cat.sizeMB, 0);

    const finalize = (mb: number) => {
      clearInterval(pInterval);
      setCleanProgress(100);
      setTotalReclaimed(mb);
      completeTask('junk-cleaner', `Đã dọn dẹp thành công ${mb} MB rác hệ thống!`);
      const current = getSessionReport();
      const prevMB = current.junkCleanedMB || 0;
      const catNames = categories.filter(c => c.checked).map(c => c.name);
      updateSessionReport({
        junkCleanedMB: prevMB + mb,
        junkCleanedCategories: Array.from(new Set([...(current.junkCleanedCategories || []), ...catNames]))
      });
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
        failTask('junk-cleaner', "Lỗi dọn rác: " + err.message);
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

  const formatSizeReadable = (mb: number) => {
    if (!mb || mb <= 0) return '0 MB';
    if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
    return `${Math.round(mb)} MB`;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* HEADER & OVERVIEW STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-2 bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-xl border border-slate-700 shadow-md flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
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
              className={`p-3 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all cursor-pointer disabled:opacity-50 ${scanning ? 'animate-pulse' : ''}`}
            >
              <RefreshCw className={`h-5 w-5 ${scanning ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>

          {/* EMBEDDED PROGRESS BAR IN TOP HEADER */}
          {(scanning || cleaning) && (
            <div className="pt-2 border-t border-slate-700/80 space-y-1.5 animate-fade-in">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                  {scanning ? "Đang phân tích bộ nhớ đệm..." : `Đang dọn dẹp rác hệ thống (${cleanProgress}%)...`}
                </span>
                <span className="font-mono text-amber-400 font-bold">{scanning ? "65%" : `${cleanProgress}%`}</span>
              </div>
              <div className="w-full bg-slate-950/80 rounded-full h-2 overflow-hidden border border-slate-700/60 p-0.5">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${scanning ? 'bg-gradient-to-r from-amber-500 to-rose-500 w-[65%]' : 'bg-gradient-to-r from-rose-500 to-emerald-400'}`}
                  style={cleaning ? { width: `${cleanProgress}%` } : undefined}
                />
              </div>
            </div>
          )}
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
            const filesCount = (cat.filesList && Array.isArray(cat.filesList)) ? cat.filesList.length : 0;
            return (
              <div 
                key={cat.id}
                onClick={() => { if (!scanning && !cleaning) handleToggle(cat.id) }}
                className={`group relative p-4 rounded-xl border transition-shadow duration-200 cursor-pointer overflow-hidden ${
                  cat.checked 
                    ? 'bg-blue-50 border-blue-300 shadow' 
                    : 'bg-white border-slate-200 hover:shadow-sm'
                }`}>

                {/* compact checkbox top-right */}
                <div className={`absolute top-3 right-3 w-4 h-4 rounded-sm border-2 flex items-center justify-center transition-colors ${
                  cat.checked ? 'bg-blue-600 border-blue-600' : 'border-slate-300 group-hover:border-blue-400'
                }`}>
                  {cat.checked && <CheckCircle className="w-3 h-3 text-white" />}
                </div>

                <div className={`w-10 h-10 rounded-md flex items-center justify-center mb-3 ${
                  cat.checked ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
                }`}>
                  {getCategoryIcon(cat.id)}
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-slate-800 line-clamp-1">{cat.name}</h4>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{cat.description}</p>
                  </div>

                  {/* small view details button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); openFilesModal(cat.id); }}
                    title="Xem chi tiết danh sách file"
                    className="ml-2 p-1 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-600"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100/50 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 uppercase font-semibold">Dung lượng</span>
                    <span className={`font-mono font-bold ${cat.sizeMB > 0 ? (isHeavy ? 'text-rose-600' : 'text-blue-600') : 'text-emerald-500'}`}>
                      {cat.sizeMB > 0 ? formatSizeReadable(cat.sizeMB) : 'Sạch'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500">
                    {filesCount > 0 ? `${filesCount} tệp` : '—'}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Files Modal */}
        {filesModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={closeFilesModal} />
            <div className="relative bg-white w-[min(900px,95%)] max-h-[80vh] overflow-auto rounded-lg shadow-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">{filesModalTitle}</h3>
                  <p className="text-sm text-slate-500">Danh sách tệp được phát hiện ({filesModalList.length})</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={copyFilesToClipboard} className="px-3 py-1 rounded bg-slate-50 hover:bg-slate-100 border">Sao chép</button>
                  <button onClick={exportFilesList} className="px-3 py-1 rounded bg-slate-50 hover:bg-slate-100 border">Xuất .txt</button>
                  <button onClick={closeFilesModal} className="px-3 py-1 rounded bg-blue-600 text-white">Đóng</button>
                </div>
              </div>

              <div className="mt-3">
                {filesModalList.length === 0 ? (
                  <div className="p-6 text-center text-slate-500">Không có tệp nào để hiển thị.</div>
                ) : (
                  <ul className="text-xs font-mono text-slate-700 space-y-1">
                    {filesModalList.map((f, idx) => (
                      <li key={idx} className="py-1 px-2 rounded hover:bg-slate-50">{f}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

      {/* ACTION BAR */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs text-slate-500 block mb-1">Dung lượng sẽ giải phóng</span>
          <span className="text-2xl font-black text-blue-600 font-mono">{(totalSelectedSize / 1024).toFixed(2)} <span className="text-sm font-bold text-slate-500">GB</span></span>
        </div>
        
        <div className="w-full md:w-[320px]">
          {cleaned ? (
            <div className="flex items-center justify-center gap-2 p-3 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-200 shadow-xs">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-bold">Đã dọn {(totalReclaimed / 1024).toFixed(2)} GB!</span>
            </div>
          ) : (
            <button
              onClick={handleClean}
              disabled={scanning || cleaning || totalSelectedSize === 0}
              className="w-full p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {cleaning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> ĐANG DỌN DẸP...
                </>
              ) : scanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> ĐANG PHÂN TÍCH...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" /> DỌN DẸP NGAY
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
