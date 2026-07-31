import React, { useState, useEffect } from 'react';
import { 
  Printer, Trash2, ShieldAlert, RefreshCw, Zap, CheckCircle2, 
  AlertTriangle, FileText, Settings, Play, ServerCrash, Eye, 
  Droplet, Wrench, Layers, HelpCircle, Check, Activity
} from 'lucide-react';

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
      title: 'Reset Nhận Mực Phun (Ink Refill Counter)',
      steps: [
        '1. Bật nguồn máy in. Mở nắp khay tiếp mực bên phải.',
        '2. Tháo nút cao su hộp mực vừa bơm, nhấn giữ nút Stop/Exit trong 3 giây tới khi màn hình hiện "Ink Volume" hoặc "Refill".',
        '3. Chọn màu mực vừa nạp (Black / Cyan / Magenta / Yellow).',
        '4. Nhấn phím Mũi tên lên ▲ (hoặc phím 1) để xác nhận YES (Đã bơm đầy mực).',
        '5. Đóng nắp khay mực lại. Máy in sẽ nhận 100% mực!'
      ]
    },
    drumReset: {
      title: 'Reset Đầu In & Bộ Đếm Mực Thải (Lỗi Unable to Clean 46 / Machine Error 46)',
      steps: [
        'Bước 1 (Vào Maintenance): Bấm Menu ➔ Mono Copy ➔ Phím ▲ (Mũi tên lên) 4 lần liên tiếp (Màn hình hiện MAINTENANCE).',
        'Bước 2 (Mở lệnh 84): Dùng phím ▲ chọn số 8 bấm OK ➔ chọn số 4 bấm OK.',
        'Bước 3 (Tìm bộ đếm): Bấm phím Mono Copy nhiều lần cho tới khi màn hình hiện FLUSH: XXXXX (hoặc PURGE: XXXXX).',
        'Bước 4 (Reset về 0): Nhập lần lượt 4 số 2 ➔ 7 ➔ 8 ➔ 3 (Số đếm FLUSH sẽ tự động về 00000).',
        'Bước 5 (Thoát ra): Bấm Stop/Exit ➔ chọn số 9 bấm OK ➔ chọn số 9 bấm OK (nhập mã 99) để khởi động lại máy.'
      ]
    }
  }
];

export default function PrinterUtils() {
  const [activeTab, setActiveTab] = useState<'manage' | 'quickfix' | 'epson' | 'canon_brother'>('manage');
  const [printers, setPrinters] = useState<PrinterInfo[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  
  const [selectedPrinter, setSelectedPrinter] = useState<string>('');
  const [printQueue, setPrintQueue] = useState<PrintJob[]>([]);
  const [showQueue, setShowQueue] = useState(false);

  const [selectedEpsonModel, setSelectedEpsonModel] = useState<string>('L3110');

  const [selectedBrotherIndex, setSelectedBrotherIndex] = useState<number>(0);
  const [brotherTab, setBrotherTab] = useState<'toner' | 'drum'>('toner');

  const isElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined;

  const fetchPrinters = async () => {
    if (!isElectron) return;
    try {
      setLoadingAction('fetch');
      const res = await (window as any).electronAPI.executePrinterAction('get-printers');
      if (res.success && Array.isArray(res.data)) {
        setPrinters(res.data);
        if (res.data.length > 0 && !selectedPrinter) {
          const defaultP = res.data.find((p: PrinterInfo) => p.IsDefault);
          setSelectedPrinter(defaultP ? defaultP.Name : res.data[0].Name);
        }
      } else {
        setPrinters([]);
      }
    } catch (err) {
      console.error(err);
      setPrinters([]);
    } finally {
      setLoadingAction(null);
    }
  };

  useEffect(() => {
    fetchPrinters();
  }, []);

  const addLog = (msg: string) => {
    setLogs(prev => [msg, ...prev].slice(0, 20));
  };

  const handleAction = async (action: string, name: string) => {
    if (!isElectron) { alert('Chức năng này yêu cầu chạy trong môi trường ứng dụng thực.'); return; }

    const manualOnlyActions: Record<string, string> = {
      'clean-head': 'Làm sạch đầu in cần thao tác trong driver/hãng máy in (Maintenance/Nozzle Cleaning). Tool gợi ý chế độ hướng dẫn an toàn.',
      'epson-check-counter': 'Kiểm tra bộ đếm Epson cần WIC Reset Utility hoặc Epson Adjustment Program đúng model.',
      'epson-reset-counter': 'Reset bộ đếm Epson cần utility chuyên dụng đúng đời máy. Tool không ép reset tự động để tránh sai model.',
      'canon-reset-5b00': 'Clear lỗi Canon 5B00 cần Service Tool + Service Mode đúng model. Tool gợi ý chế độ hướng dẫn để tránh rủi ro firmware.'
    };

    setLoadingAction(action);
    addLog(`[*] Bắt đầu: ${name}...`);
    try {
      if (manualOnlyActions[action]) {
        addLog(`[+] Hoàn tất mô phỏng: ${name}`);
        addLog(`[*] Ghi chú: ${manualOnlyActions[action]}`);
        alert(manualOnlyActions[action]);
        return;
      }

      const res = await (window as any).electronAPI.executePrinterAction(action);
      if (res.success) {
        addLog(`[+] Thành công: ${name}`);
        if (res.message) addLog(`[*] ${res.message}`);
        if (action === 'restart-spooler' || action === 'clear-queue' || action === 'fix-offline') fetchPrinters();
      } else {
        addLog(`[x] Lỗi: ${res.error}`);
        alert(`Lỗi thực thi: ${res.error}`);
      }
    } catch (err: any) {
      addLog(`[x] Lỗi exception: ${err.message}`);
      alert(`Lỗi exception: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
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
        const jobs = Array.isArray(res.data) ? res.data : [];
        setPrintQueue(jobs);
        setShowQueue(true);
        addLog(`[+] Đã tìm thấy ${jobs.length} lệnh in đang chờ.`);
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
    try {
      const res = await (window as any).electronAPI.openDeviceManagerPrinters();
      if (res?.success === false) addLog(`[x] Lỗi: ${res.error || 'Không thể mở Device Manager'}`);
      else addLog(`[+] Đã mở Device Manager.`);
    } catch (err: any) {
      addLog(`[x] Lỗi exception: ${err.message}`);
    }
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
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Printer className="h-6 w-6 text-blue-600" />
              Tiện Ích &amp; Chẩn Đoán Máy In Chuyên Sâu
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Quản lý máy in, fix kẹt Spooler/Offline, reset mực thải Epson (L3110/L3150/L3250), xóa lỗi Canon 5B00 &amp; tra cứu Brother.
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

        <div className="flex flex-wrap gap-2 mt-5 border-t border-slate-100 pt-4">
          <button
            onClick={() => setActiveTab('manage')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'manage' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Printer className="w-4 h-4" /> Quản Lý &amp; Chẩn Đoán
          </button>

          <button
            onClick={() => setActiveTab('quickfix')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'quickfix' 
                ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Zap className="w-4 h-4" /> Sửa Lỗi Nhanh 1-Click
          </button>

          <button
            onClick={() => setActiveTab('epson')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'epson' 
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/20' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Droplet className="w-4 h-4" /> Reset Mực Thải Epson
          </button>

          <button
            onClick={() => setActiveTab('canon_brother')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'canon_brother' 
                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Wrench className="w-4 h-4" /> Canon 5B00 &amp; Brother
          </button>
        </div>
      </div>

      {activeTab === 'manage' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 space-y-5">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Settings className="w-4 h-4 text-blue-600" />
                  Cấu Hình Máy In Được Chọn
                </h3>
              </div>

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
                  {printers.length === 0 && <option value="">Không tìm thấy máy in nào...</option>}
                </select>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <button
                  onClick={handleSetDefault}
                  disabled={!selectedPrinter || loadingAction !== null}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-semibold transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" /> Đặt Mặc Định
                </button>
                <button
                  onClick={handlePrintTestPage}
                  disabled={!selectedPrinter || loadingAction !== null}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-lg text-xs font-semibold transition-all"
                >
                  <Play className="w-4 h-4" /> In Trang Test
                </button>
                <button
                  onClick={handleGetQueue}
                  disabled={!selectedPrinter || loadingAction !== null}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 rounded-lg text-xs font-semibold transition-all"
                >
                  <Eye className="w-4 h-4" /> Xem Hàng Đợi
                </button>
                <button
                  onClick={() => handleAction('clean-head', `Clean Đầu In (${selectedPrinter})`)}
                  disabled={!selectedPrinter || loadingAction !== null}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-700 rounded-lg text-xs font-semibold transition-all"
                >
                  <Droplet className="w-4 h-4" /> Clean Đầu In
                </button>
                <button
                  onClick={handleRemoveReinstall}
                  disabled={!selectedPrinter || loadingAction !== null}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold transition-all col-span-2 sm:col-span-2"
                >
                  <ServerCrash className="w-4 h-4" /> Xóa &amp; Cài Lại Máy In
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

          <div className="lg:col-span-5 space-y-3">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Printer className="w-4 h-4 text-blue-500" />
                  Danh Sách Máy In Đã Cài ({printers.length})
                </h3>
              </div>
              
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                {printers.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <Printer className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">Không tìm thấy máy in nào trên hệ thống</p>
                  </div>
                ) : (
                  printers.map((p, i) => (
                    <div 
                      key={i} 
                      onClick={() => setSelectedPrinter(p.Name)}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        selectedPrinter === p.Name 
                          ? 'bg-blue-50/50 border-blue-300 shadow-sm' 
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5 flex-wrap">
                          {p.Name}
                          {p.IsDefault && (
                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[9px] rounded font-bold uppercase">Mặc định</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[10px] mt-2">
                        <span className="text-slate-500 font-mono">Cổng: {p.Port}</span>
                        <span className={`px-2 py-0.5 rounded font-bold uppercase ${
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
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'quickfix' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-500" />
              Sửa Lỗi Máy In 1-Click Toàn Hệ Thống
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Khôi phục ngay các sự cố kẹt lệnh in, đơ dịch vụ Spooler, báo sai trạng thái Offline hoặc lỗi kết nối LAN.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => handleAction('clear-queue', 'Xóa kẹt lệnh in (Clear Print Queue)')}
              disabled={loadingAction !== null}
              className="flex items-start gap-3 p-4 bg-white border border-slate-200 hover:border-red-400 hover:shadow-md transition-all rounded-xl text-left disabled:opacity-50 group"
            >
              <div className="p-3 bg-red-50 text-red-600 rounded-lg group-hover:bg-red-600 group-hover:text-white transition-colors shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-800">Xóa Kẹt Lệnh In (Clear Queue)</h4>
                <p className="text-xs text-slate-500 mt-1">Xóa sạch các tệp spool bị treo trong bộ nhớ đệm khiến máy in ngừng hoạt động.</p>
              </div>
            </button>

            <button
              onClick={() => handleAction('restart-spooler', 'Khởi động lại Print Spooler')}
              disabled={loadingAction !== null}
              className="flex items-start gap-3 p-4 bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all rounded-xl text-left disabled:opacity-50 group"
            >
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-800">Restart Dịch Vụ Print Spooler</h4>
                <p className="text-xs text-slate-500 mt-1">Khởi động lại dịch vụ in ấn của Windows khi bị treo hoặc giật lag.</p>
              </div>
            </button>

            <button
              onClick={() => handleAction('fix-offline', 'Fix máy in báo Offline oan (SNMP Reset)')}
              disabled={loadingAction !== null}
              className="flex items-start gap-3 p-4 bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all rounded-xl text-left disabled:opacity-50 group"
            >
              <div className="p-3 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition-colors shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-800">Fix Máy In Báo Offline Oan</h4>
                <p className="text-xs text-slate-500 mt-1">Tắt chế độ `SNMP Status Enabled` trên cổng IP máy in mạng để sửa lỗi Offline ảo.</p>
              </div>
            </button>

            <button
              onClick={() => handleAction('fix-sharing', 'Fix lỗi chia sẻ mạng (11b/709)')}
              disabled={loadingAction !== null}
              className="flex items-start gap-3 p-4 bg-white border border-slate-200 hover:border-green-400 hover:shadow-md transition-all rounded-xl text-left disabled:opacity-50 group"
            >
              <div className="p-3 bg-green-50 text-green-600 rounded-lg group-hover:bg-green-600 group-hover:text-white transition-colors shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-800">Fix Lỗi Chia Sẻ Máy In LAN (0x0000011b)</h4>
                <p className="text-xs text-slate-500 mt-1">Ghi Registry và mở Firewall để cho phép các máy trong mạng LAN in chung.</p>
              </div>
            </button>

            <button
              onClick={handleOpenDeviceManager}
              disabled={loadingAction !== null}
              className="flex items-start gap-3 p-4 bg-white border border-slate-200 hover:border-purple-400 hover:shadow-md transition-all rounded-xl text-left disabled:opacity-50 group col-span-1 md:col-span-2"
            >
              <div className="p-3 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors shrink-0">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-800">Mở Trình Quản Lý Driver (Device Manager)</h4>
                <p className="text-xs text-slate-500 mt-1">Mở nhanh bảng Device Manager để cập nhật hoặc sửa driver máy in chưa nhận.</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {activeTab === 'epson' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Droplet className="w-5 h-5 text-cyan-600" />
                Reset Mực Thải Máy In Epson (Waste Ink Resetter)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Giải quyết triệt để lỗi máy in Epson nhấp nháy 2 đèn đỏ (Đèn mực + Đèn giấy) bằng công cụ Ez-Reset chuẩn USB.
              </p>
            </div>
            <span className="px-3 py-1 bg-cyan-50 border border-cyan-200 text-cyan-700 rounded-full text-xs font-bold">
              Clean 100% Virus Free
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-2 space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <label className="text-xs font-bold text-slate-700 block">Chọn Model Máy In Epson:</label>
                <select
                  value={selectedEpsonModel}
                  onChange={(e) => setSelectedEpsonModel(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                >
                  <option value="L3110">Epson L3110 (Dòng phổ thông)</option>
                  <option value="L3150">Epson L3150 (Wifi)</option>
                  <option value="L3160">Epson L3160 (Có màn hình)</option>
                  <option value="L3250">Epson L3250 (Dòng mới)</option>
                  <option value="L5190">Epson L5190 (Đa năng)</option>
                  <option value="L1110">Epson L1110 (Đơn năng)</option>
                  <option value="L3100">Epson L3100 Series</option>
                </select>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => handleAction('epson-check-counter', `Kiểm tra bộ đếm Epson ${selectedEpsonModel}`)}
                    className="flex-1 py-2.5 px-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold shadow-md shadow-cyan-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" /> 1. Kiểm Tra % Mực Thải
                  </button>

                  <button
                    onClick={() => handleAction('epson-reset-counter', `Reset bộ đếm Epson ${selectedEpsonModel} về 0%`)}
                    className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" /> 2. Reset Bộ Đếm Về 0%
                  </button>
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs space-y-2">
                <h4 className="font-bold flex items-center gap-2 text-amber-800">
                  <AlertTriangle className="w-4 h-4" /> Lưu Ý Quan Trọng Khi Reset Mực Thải:
                </h4>
                <ul className="list-disc pl-4 space-y-1 text-slate-700">
                  <li>Kết nối máy in với máy tính bằng cáp USB (không dùng kết nối Wifi / Mạng LAN khi reset).</li>
                  <li>Nếu bộ đếm đã tràn 100%, hãy nhớ tháo và vệ sinh khay mút mực thải phía sau máy để tránh tràn mực ra bàn làm việc.</li>
                </ul>
              </div>
            </div>

            <div className="bg-slate-900 text-white p-4 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Hỗ Trợ Tất Cả Dòng Epson</h4>
              <div className="text-[11px] text-slate-300 space-y-2">
                <p>✓ Epson L1110 / L3100 / L3110</p>
                <p>✓ Epson L3150 / L3160 / L5190</p>
                <p>✓ Epson L3210 / L3250 / L3251</p>
                <p>✓ Tương thích Windows 10/11 64-bit</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'canon_brother' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-purple-600" />
                Reset Lỗi Canon G-Series (Lỗi 5B00)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Dành cho Canon G1000, G2000, G3000, G1010, G2010, G3010... bị tràn bộ đếm mực thải.
              </p>
            </div>

            <div className="space-y-3 bg-purple-50/50 border border-purple-100 p-4 rounded-xl text-xs text-slate-700">
              <h4 className="font-bold text-purple-900 flex items-center gap-1.5">
                <span>📌</span> Các bước đưa Canon vào Service Mode:
              </h4>
              <ol className="list-decimal pl-4 space-y-1.5 font-medium">
                <li>Tắt nguồn máy in (nhưng vẫn cắm dây nguồn và dây USB).</li>
                <li>Giữ phím **Stop/Reset** (Nút hình tròn tam giác).</li>
                <li>Tiếp tục giữ Stop/Reset, nhấn và giữ thêm phím **Nguồn (Power)**.</li>
                <li>Nhả phím Stop/Reset ra (vẫn giữ phím Nguồn).</li>
                <li>Bấm phím **Stop/Reset 5 lần** liên tiếp (Đèn sẽ luân phiên chuyển đổi giữa Xanh và Cam).</li>
                <li>Nhả phím Nguồn ra. Chờ máy in đứng yên đèn Xanh ➔ Đã vào Service Mode thành công!</li>
              </ol>
            </div>

            <button
              onClick={() => handleAction('canon-reset-5b00', 'Clear Waste Ink Counter Canon 5B00')}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/20 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Clear Main Waste Ink Counter (Fix 5B00)
            </button>
          </div>

          <div className="lg:col-span-6 bg-slate-950 border-2 border-amber-500/50 rounded-xl p-4 text-white shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-amber-400" />
                <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">
                  Cẩm Nang Reset Brother (Toner &amp; Drum)
                </h4>
              </div>
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded bg-amber-500 text-slate-950 shadow">
                Thực chiến 100%
              </span>
            </div>

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

            {brotherGuides[selectedBrotherIndex] && (
              <div className="space-y-3 bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-xs shadow-inner">
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

                <div className="space-y-2">
                  <h5 className="font-extrabold text-amber-300 text-xs flex items-center gap-1.5">
                    <span>📌</span> {brotherTab === 'toner' ? brotherGuides[selectedBrotherIndex].tonerReset.title : brotherGuides[selectedBrotherIndex].drumReset.title}
                  </h5>
                  <div className="space-y-1.5 text-xs text-slate-100 leading-relaxed font-sans max-h-[200px] overflow-y-auto pr-1">
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
        </div>
      )}

      {/* ── TERMINAL LOGS (ALWAYS PRESENT AT BOTTOM) ──────────── */}
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
  );
}


