import React, { useState, useEffect } from 'react';
import { Printer, Trash2, ShieldAlert, RefreshCw, Zap, CheckCircle2, AlertTriangle, FileText, Settings, Play, ServerCrash, Eye } from 'lucide-react';

interface PrinterInfo {
  Name: string;
  Port: string;
  Status: string;
  IsDefault: boolean;
}

interface PrintJob {
  Id: number;
  DocumentName: string;
  JobStatus: string;
  Size: number;
  PagesPrinted: number;
  TotalPages: number;
}

interface BrotherGuide {
  modelGroup: string;
  models: string;
  hasScreen: boolean;
  tonerReset: {
    title: string;
    steps: string[];
  };
  drumReset: {
    title: string;
    steps: string[];
  };
}

const brotherGuides: BrotherGuide[] = [
  {
    modelGroup: 'Brother HL-L2321D / HL-2361DN / HL-2365DW',
    models: 'HL-L2321D, HL-2361DN, HL-2365DW (Máy in đơn năng - Không màn hình)',
    hasScreen: false,
    tonerReset: {
      title: 'Reset Mực (Toner Reset - Lỗi Replace Toner / Toner Low)',
      steps: [
        '1. Tắt công tắc nguồn máy in (hoặc giữ nút Nguồn).',
        '2. Mở nắp trước máy in (Nắp hộp mực).',
        '3. Giữ chặt nút GO, đồng thời bật công tắc Nguồn.',
        '4. Giữ nút GO khoảng 5 giây cho tới khi các đèn Toner, Drum, Paper sáng (trừ đèn Ready). Nhả nút GO.',
        '5. Nhấn nút GO 2 lần liên tiếp. Chờ các đèn sáng trở lại.',
        '6. Nhấn nút GO 5 lần liên tiếp (Đèn Toner sẽ tắt hoặc nháy).',
        '7. Đóng nắp trước máy in lại. Máy in sẽ khởi động lại và nhận full 100% mực!'
      ]
    },
    drumReset: {
      title: 'Reset Trống (Drum Reset - Lỗi Replace Drum / Drum End)',
      steps: [
        '1. Bật nguồn máy in.',
        '2. Mở nắp trước máy in (Nắp hộp mực).',
        '3. Nhấn và giữ nút GO khoảng 4 giây cho tới khi tất cả 4 đèn LED đều sáng.',
        '4. Nhả nút GO ra và đóng nắp trước máy in lại. Đèn Drum sẽ tắt!'
      ]
    }
  },
  {
    modelGroup: 'Brother DCP-L2520D / L2540DW / MFC-L2701DW / L2715DW',
    models: 'DCP-L2520D, L2540DW, MFC-L2701DW, L2715DW (Máy in đa năng - Có màn hình LCD)',
    hasScreen: true,
    tonerReset: {
      title: 'Reset Mực (Toner Reset trên màn hình LCD)',
      steps: [
        '1. Bật nguồn máy in.',
        '2. Mở nắp trước máy in.',
        '3. Nhấn và giữ nút Clear/Back (hoặc nút OK tùy dòng) khoảng 5 giây cho tới khi màn hình LCD hiện: "Replace Toner?" hoặc "Front Cover Open".',
        '4. Nhấn nút Phím Mũi Tên Lên ▲ (hoặc phím số 1) để chọn YES.',
        '5. Màn hình hiện "Accepted" hoặc "OK". Đóng nắp trước lại là hoàn tất!'
      ]
    },
    drumReset: {
      title: 'Reset Trống (Drum Reset trên màn hình LCD)',
      steps: [
        '1. Bật nguồn máy in.',
        '2. Mở nắp trước máy in.',
        '3. Nhấn và giữ nút OK (hoặc Clear/Back) trong 3-5 giây.',
        '4. Màn hình hiện: "Replace Drum? 1. Yes 2. No" (hoặc ▲ Reset).',
        '5. Nhấn số 1 (hoặc nút ▲ Mũi tên lên) để đồng ý Reset.',
        '6. Đóng nắp trước lại. Máy in báo OK!'
      ]
    }
  },
  {
    modelGroup: 'Brother HL-1111 / HL-1211W / HL-1201 (Dòng Mini)',
    models: 'HL-1111, HL-1211W, HL-1201 (Dòng máy in gia đình)',
    hasScreen: false,
    tonerReset: {
      title: 'Reset Mực & Trống (HL-1111 / 1211W)',
      steps: [
        '1. Bật nguồn máy in.',
        '2. Nhấn nút Nguồn (Power button) 4 lần liên tiếp thật nhanh.',
        '3. Đèn trạng thái sẽ nháy và máy in sẽ tự động reset lại bộ đếm mực!'
      ]
    },
    drumReset: {
      title: 'Reset Trống (HL-1111 / 1211W)',
      steps: [
        '1. Mở nắp trên máy in.',
        '2. Nhấn nút Nguồn 4 lần liên tiếp.',
        '3. Đóng nắp máy in lại.'
      ]
    }
  },
  {
    modelGroup: 'Brother Tank phun màu (MFC-T4500DW / T910DW / T510W)',
    models: 'DCP-T310, T510W, T710W, MFC-T810W, T910DW, T4500DW',
    hasScreen: true,
    tonerReset: {
      title: 'Reset Đếm Mực Phun (Ink Counter Reset - Maintenance Mode)',
      steps: [
        '1. Nhấn nút Menu ➔ Mono Copy ➔ Nhấn phím Mũi tên lên ▲ 4 lần để vào chế độ Maintenance.',
        '2. Nhập mã 84 (chọn số 8 bấm OK, chọn số 4 bấm OK).',
        '3. Nhấn nút Mono Copy nhiều lần tìm mục "PURGE: XXXXX" (hoặc FLUSH).',
        '4. Nhập mã 2783 để reset số PURGE về 00000.',
        '5. Bấm nút Stop/Exit và nhập 99 để thoát chế độ Maintenance.'
      ]
    },
    drumReset: {
      title: 'Reset Đầu In (Printhead Counter)',
      steps: [
        'Thực hiện theo các bước Maintenance 84 ➔ chọn FLUSH counter ➔ nhập 2783.'
      ]
    }
  }
];

export default function PrinterUtils() {
  const [printers, setPrinters] = useState<PrinterInfo[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  
  const [selectedPrinter, setSelectedPrinter] = useState<string>('');
  const [printQueue, setPrintQueue] = useState<PrintJob[]>([]);
  const [showQueue, setShowQueue] = useState(false);

  const [selectedBrotherIndex, setSelectedBrotherIndex] = useState<number>(0);
  const [brotherTab, setBrotherTab] = useState<'toner' | 'drum'>('toner');

  const isElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined;

  const fetchPrinters = async () => {
    if (!isElectron) return;
    try {
      setLoadingAction('fetch');
      const res = await (window as any).electronAPI.executePrinterAction('get-printers');
      if (res.success && res.data) {
        setPrinters(res.data);
        if (res.data.length > 0 && !selectedPrinter) {
          const defaultP = res.data.find((p: PrinterInfo) => p.IsDefault);
          setSelectedPrinter(defaultP ? defaultP.Name : res.data[0].Name);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(null);
    }
  };

  useEffect(() => {
    fetchPrinters();
  }, []);

  const addLog = (msg: string) => {
    setLogs(prev => [msg, ...prev].slice(0, 15));
  };

  const handleAction = async (action: string, name: string) => {
    if (!isElectron) { alert('Chức năng này yêu cầu chạy trong môi trường ứng dụng thực.'); return; }
    
    setLoadingAction(action);
    addLog(`[*] Bắt đầu: ${name}...`);
    try {
      const res = await (window as any).electronAPI.executePrinterAction(action);
      if (res.success) {
        addLog(`[+] Thành công: ${name}`);
        if (action === 'restart-spooler' || action === 'clear-queue') fetchPrinters();
      } else {
        addLog(`[x] Lỗi: ${res.error}`);
        alert(`Lỗi thực thi: ${res.error}`);
      }
    } catch (err: any) { addLog(`[x] Lỗi exception: ${err.message}`); } 
    finally { setLoadingAction(null); }
  };

  const handleSetDefault = async () => {
    if (!selectedPrinter || !isElectron) return;
    setLoadingAction('set-default');
    addLog(`[*] Đang đặt ${selectedPrinter} làm mặc định...`);
    try {
      const res = await (window as any).electronAPI.setDefaultPrinter(selectedPrinter);
      if (res.success) {
        addLog(`[+] Thành công đặt mặc định: ${selectedPrinter}`);
        fetchPrinters();
      } else addLog(`[x] Lỗi: ${res.error}`);
    } catch (err: any) { addLog(`[x] Lỗi exception: ${err.message}`); } 
    finally { setLoadingAction(null); }
  };

  const handleGetQueue = async () => {
    if (!selectedPrinter || !isElectron) return;
    setLoadingAction('get-queue');
    addLog(`[*] Đang lấy danh sách lệnh in của ${selectedPrinter}...`);
    try {
      const res = await (window as any).electronAPI.getPrintQueue(selectedPrinter);
      if (res.success) {
        setPrintQueue(res.data);
        setShowQueue(true);
        addLog(`[+] Đã tìm thấy ${res.data.length} lệnh in đang chờ.`);
      } else addLog(`[x] Lỗi: ${res.error}`);
    } catch (err: any) { addLog(`[x] Lỗi exception: ${err.message}`); } 
    finally { setLoadingAction(null); }
  };

  const handlePrintTestPage = async () => {
    if (!selectedPrinter || !isElectron) return;
    setLoadingAction('print-test');
    addLog(`[*] Đang ra lệnh in Test Page cho ${selectedPrinter}...`);
    try {
      const res = await (window as any).electronAPI.printTestPage(selectedPrinter);
      if (res.success) addLog(`[+] Đã gửi lệnh in trang test.`);
      else addLog(`[x] Lỗi: ${res.error}`);
    } catch (err: any) { addLog(`[x] Lỗi exception: ${err.message}`); } 
    finally { setLoadingAction(null); }
  };

  const handleOpenDeviceManager = async () => {
    if (!isElectron) return;
    addLog(`[*] Đang mở Device Manager...`);
    await (window as any).electronAPI.openDeviceManagerPrinters();
  };

  const handleRemoveReinstall = async () => {
    if (!selectedPrinter || !isElectron) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa máy in "${selectedPrinter}" và cài lại không?`)) return;
    setLoadingAction('remove-reinstall');
    addLog(`[*] Đang xóa và mở trình cài lại cho ${selectedPrinter}...`);
    try {
      const res = await (window as any).electronAPI.removeReinstallPrinter(selectedPrinter);
      if (res.success) {
        addLog(`[+] Đã xóa máy in. Vui lòng làm theo hướng dẫn trên màn hình để cài lại.`);
        fetchPrinters();
      } else addLog(`[x] Lỗi: ${res.error}`);
    } catch (err: any) { addLog(`[x] Lỗi exception: ${err.message}`); } 
    finally { setLoadingAction(null); }
  };

  return (
    <div className="space-y-5" id="printer-utils-container">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Printer className="h-6 w-6 text-blue-600" />
              Tiện Ích &amp; Cấu Hình Máy In
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Bộ công cụ chẩn đoán nhanh, quản lý danh sách, fix lỗi kẹt lệnh in và sửa lỗi chia sẻ mạng.
            </p>
          </div>
          <button 
            onClick={fetchPrinters}
            disabled={loadingAction === 'fetch'}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-all shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingAction === 'fetch' ? 'animate-spin' : ''}`} />
            Làm Mới Danh Sách
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Col: Management */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          
          {/* Section: Quản lý máy in cụ thể */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <Settings className="w-4 h-4 text-slate-500" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Cấu Hình Cụ Thể</h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">Chọn máy in để thao tác:</label>
                <select 
                  className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={selectedPrinter}
                  onChange={(e) => setSelectedPrinter(e.target.value)}
                >
                  {printers.map(p => (
                    <option key={p.Name} value={p.Name}>{p.Name} {p.IsDefault ? '(Mặc định)' : ''}</option>
                  ))}
                  {printers.length === 0 && <option value="">Không tìm thấy máy in...</option>}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleSetDefault}
                  disabled={!selectedPrinter || loadingAction !== null}
                  className="flex items-center justify-center gap-2 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-semibold transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" /> Đặt Mặc Định
                </button>
                <button
                  onClick={handlePrintTestPage}
                  disabled={!selectedPrinter || loadingAction !== null}
                  className="flex items-center justify-center gap-2 py-2 px-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-lg text-xs font-semibold transition-all"
                >
                  <Play className="w-4 h-4" /> In Trang Test
                </button>
                <button
                  onClick={handleGetQueue}
                  disabled={!selectedPrinter || loadingAction !== null}
                  className="flex items-center justify-center gap-2 py-2 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 rounded-lg text-xs font-semibold transition-all"
                >
                  <Eye className="w-4 h-4" /> Xem Hàng Đợi
                </button>
                <button
                  onClick={handleRemoveReinstall}
                  disabled={!selectedPrinter || loadingAction !== null}
                  className="flex items-center justify-center gap-2 py-2 px-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold transition-all"
                >
                  <ServerCrash className="w-4 h-4" /> Xóa &amp; Cài Lại
                </button>
              </div>

              {showQueue && (
                <div className="mt-2 bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-[10px] font-bold text-slate-600 uppercase">Hàng Đợi Lệnh In ({printQueue.length})</h4>
                    <button onClick={() => setShowQueue(false)} className="text-slate-400 hover:text-slate-700 text-xs">Đóng</button>
                  </div>
                  {printQueue.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">Không có lệnh in nào đang chờ.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-[150px] overflow-y-auto">
                      {printQueue.map(q => (
                        <div key={q.Id} className="text-[10px] bg-white p-2 rounded border border-slate-100 flex justify-between">
                          <span className="font-semibold text-slate-700 truncate max-w-[150px]">{q.DocumentName || 'Unknown Document'}</span>
                          <span className="text-slate-500">{q.JobStatus} | {Math.round(q.Size/1024)}KB</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section: Sửa lỗi nhanh chung */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-500" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Fix Lỗi Toàn Hệ Thống</h3>
              </div>
            </div>
            
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => handleAction('clear-queue', 'Xóa kẹt lệnh in (Clear Print Queue)')}
                disabled={loadingAction !== null}
                className="flex items-center gap-3 p-3 bg-white border border-slate-200 hover:border-red-300 hover:shadow-md transition-all rounded-lg text-left disabled:opacity-50 group"
              >
                <div className="p-2 bg-red-50 text-red-600 rounded group-hover:bg-red-600 group-hover:text-white transition-colors">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-medium text-xs text-slate-800">Xóa Kẹt Lệnh In</h4>
                  <p className="text-[9px] text-slate-500 mt-0.5">Xóa sạch hàng đợi bị kẹt cứng</p>
                </div>
              </button>

              <button
                onClick={() => handleAction('restart-spooler', 'Khởi động lại Print Spooler')}
                disabled={loadingAction !== null}
                className="flex items-center gap-3 p-3 bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all rounded-lg text-left disabled:opacity-50 group"
              >
                <div className="p-2 bg-blue-50 text-blue-600 rounded group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-medium text-xs text-slate-800">Restart Spooler</h4>
                  <p className="text-[9px] text-slate-500 mt-0.5">Sửa lỗi đơ cứng máy in</p>
                </div>
              </button>

              <button
                onClick={() => handleAction('fix-sharing', 'Fix lỗi chia sẻ mạng (11b/709)')}
                disabled={loadingAction !== null}
                className="flex items-center gap-3 p-3 bg-white border border-slate-200 hover:border-green-300 hover:shadow-md transition-all rounded-lg text-left disabled:opacity-50 group"
              >
                <div className="p-2 bg-green-50 text-green-600 rounded group-hover:bg-green-600 group-hover:text-white transition-colors">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-medium text-xs text-slate-800">Fix Share 11b</h4>
                  <p className="text-[9px] text-slate-500 mt-0.5">Lỗi kết nối máy in LAN</p>
                </div>
              </button>
              
              <button
                onClick={handleOpenDeviceManager}
                disabled={loadingAction !== null}
                className="flex items-center gap-3 p-3 bg-white border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all rounded-lg text-left disabled:opacity-50 group"
              >
                <div className="p-2 bg-purple-50 text-purple-600 rounded group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-medium text-xs text-slate-800">Cài Driver Bằng Tay</h4>
                  <p className="text-[9px] text-slate-500 mt-0.5">Mở Device Manager nhanh</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: List & Logs */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Printer List */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col max-h-[400px]">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Printer className="w-4 h-4 text-blue-500" />
                Danh Sách Máy In
              </h3>
              <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">{printers.length} máy</span>
            </div>
            
            <div className="p-3 flex-1 overflow-y-auto bg-slate-50/50">
              {printers.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <Printer className="w-10 h-10 mb-2 opacity-20" />
                  <p className="text-xs">Không tìm thấy máy in nào</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {printers.map((p, i) => (
                    <div key={i} className="flex flex-col p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all">
                      <div className="flex items-start justify-between mb-1">
                        <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5 flex-wrap">
                          {p.Name}
                          {p.IsDefault && (
                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[9px] rounded font-bold uppercase">Mặc định</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-500 font-mono">Port: {p.Port}</span>
                        <span className={`px-1.5 py-0.5 rounded font-bold uppercase ${
                          p.Status === 'Idle' || p.Status === 'Printing' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : p.Status === 'Unknown/Offline' || p.Status === 'Error'
                          ? 'bg-rose-100 text-rose-700' 
                          : 'bg-amber-100 text-amber-700'
                        }`}>
                          {p.Status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Brother Printer Reset Guide */}
          <div className="bg-slate-950 border-2 border-amber-500/50 rounded-xl p-4 text-white shadow-2xl space-y-3 shrink-0">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-lg">🖨️</span>
                <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">
                  Cẩm Nang Tra Cứu Reset Mực &amp; Drum Brother
                </h4>
              </div>
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded bg-amber-500 text-slate-950 shadow">
                Thực chiến 100%
              </span>
            </div>

            {/* Select Brother Model */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 block">Chọn dòng máy in Brother:</label>
              <select
                value={selectedBrotherIndex}
                onChange={(e) => setSelectedBrotherIndex(Number(e.target.value))}
                className="w-full bg-slate-900 border-2 border-amber-500/60 rounded-lg px-3 py-2 text-xs text-amber-300 font-extrabold focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                {brotherGuides.map((g, idx) => (
                  <option key={idx} value={idx}>{g.modelGroup}</option>
                ))}
              </select>
            </div>

            {/* Active Guide Steps */}
            {brotherGuides[selectedBrotherIndex] && (
              <div className="space-y-3 bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-xs shadow-inner">
                {/* Mode Selector Tab */}
                <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 gap-1">
                  <button
                    onClick={() => setBrotherTab('toner')}
                    className={`flex-1 py-1.5 text-xs font-black rounded-md cursor-pointer transition ${brotherTab === 'toner' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}
                  >
                    💧 Reset Mực (Toner)
                  </button>
                  <button
                    onClick={() => setBrotherTab('drum')}
                    className={`flex-1 py-1.5 text-xs font-black rounded-md cursor-pointer transition ${brotherTab === 'drum' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}
                  >
                    🥁 Reset Trống (Drum)
                  </button>
                </div>

                {/* Steps Details */}
                <div className="space-y-2">
                  <h5 className="font-extrabold text-amber-300 text-xs flex items-center gap-1.5">
                    <span>📌</span> {brotherTab === 'toner' ? brotherGuides[selectedBrotherIndex].tonerReset.title : brotherGuides[selectedBrotherIndex].drumReset.title}
                  </h5>
                  <div className="space-y-1.5 text-xs text-slate-100 leading-relaxed font-sans">
                    {(brotherTab === 'toner' ? brotherGuides[selectedBrotherIndex].tonerReset.steps : brotherGuides[selectedBrotherIndex].drumReset.steps).map((step, sIdx) => (
                      <div key={sIdx} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-100 font-medium">
                        {step}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Terminal Logs */}
          <div className="bg-slate-950 rounded-xl p-4 shadow-lg border border-slate-800 h-36 flex flex-col shrink-0">
            <h4 className="text-[10px] font-mono text-blue-400 mb-2 flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <FileText className="w-3.5 h-3.5" /> Terminal Logs
            </h4>
            <div className="flex-1 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
              {logs.length === 0 ? (
                <p className="text-slate-600 text-xs font-mono italic">Chưa có hành động nào.</p>
              ) : (
                logs.map((log, i) => (
                  <p key={i} className={`text-[10px] font-mono ${log.includes('[+]') ? 'text-emerald-400' : log.includes('[x]') ? 'text-rose-400' : log.includes('[*]') ? 'text-blue-300' : 'text-slate-300'}`}>
                    {log}
                  </p>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
