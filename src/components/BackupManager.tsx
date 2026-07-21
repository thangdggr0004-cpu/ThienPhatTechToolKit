import React, { useState } from 'react';
import { Wifi, HardDrive, Download, Upload, RefreshCw, CheckCircle, AlertTriangle, Search, ShieldCheck } from 'lucide-react';

interface WifiProfile {
  name: string;
  password: string;
  auth: string;
}

interface Message {
  type: 'success' | 'error' | 'info';
  text: string;
}

export default function BackupManager() {
  const [wifiProfiles, setWifiProfiles] = useState<WifiProfile[]>([]);
  const [wifiScanned, setWifiScanned] = useState(false);
  const [wifiLoading, setWifiLoading] = useState(false);
  const [wifiExporting, setWifiExporting] = useState(false);
  const [wifiRestoring, setWifiRestoring] = useState(false);
  const [driverExporting, setDriverExporting] = useState(false);
  const [driverRestoring, setDriverRestoring] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  const isElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined;

  const showMessage = (type: Message['type'], text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 8000);
  };

  // WiFi: Scan saved profiles
  const handleScanWifi = async () => {
    if (!isElectron) return;
    setWifiLoading(true);
    setMessage(null);
    try {
      const profiles = await (window as any).electronAPI.listWifiProfiles();
      if (Array.isArray(profiles)) {
        setWifiProfiles(profiles);
        setWifiScanned(true);
        showMessage('info', `Tìm thấy ${profiles.length} mạng WiFi đã lưu.`);
      } else {
        showMessage('error', 'Không thể quét WiFi: ' + (profiles || 'Lỗi không xác định'));
      }
    } catch (err: any) {
      showMessage('error', 'Lỗi quét WiFi: ' + (err?.message || err));
    } finally {
      setWifiLoading(false);
    }
  };

  // WiFi: Export to folder
  const handleExportWifi = async () => {
    if (!isElectron) return;
    setWifiExporting(true);
    setMessage(null);
    try {
      const result = await (window as any).electronAPI.exportWifi();
      if (result && result.success) {
        showMessage('success', `Đã sao lưu WiFi thành công vào: ${result.path}`);
      } else {
        showMessage('error', result?.error || 'Không thể sao lưu WiFi');
      }
    } catch (err: any) {
      showMessage('error', 'Lỗi sao lưu WiFi: ' + (err?.message || err));
    } finally {
      setWifiExporting(false);
    }
  };

  // WiFi: Restore from folder
  const handleRestoreWifi = async () => {
    if (!isElectron) return;
    setWifiRestoring(true);
    setMessage(null);
    try {
      const result = await (window as any).electronAPI.restoreWifi();
      if (result && result.success) {
        showMessage('success', `Đã phục hồi ${result.count || ''} mạng WiFi thành công!`);
      } else {
        showMessage('error', result?.error || 'Không thể phục hồi WiFi');
      }
    } catch (err: any) {
      showMessage('error', 'Lỗi phục hồi WiFi: ' + (err?.message || err));
    } finally {
      setWifiRestoring(false);
    }
  };

  // Driver: Export
  const handleExportDrivers = async () => {
    if (!isElectron) return;
    setDriverExporting(true);
    setMessage(null);
    showMessage('info', 'Đang sao lưu driver, vui lòng chờ... (có thể mất vài phút)');
    try {
      const result = await (window as any).electronAPI.exportDrivers();
      if (result && result.success) {
        showMessage('success', `Đã sao lưu driver thành công vào: ${result.path}`);
      } else {
        showMessage('error', result?.error || 'Không thể sao lưu driver');
      }
    } catch (err: any) {
      showMessage('error', 'Lỗi sao lưu driver: ' + (err?.message || err));
    } finally {
      setDriverExporting(false);
    }
  };

  // Driver: Restore
  const handleRestoreDrivers = async () => {
    if (!isElectron) return;
    setDriverRestoring(true);
    setMessage(null);
    showMessage('info', 'Đang phục hồi driver (cần quyền Admin)...');
    try {
      const result = await (window as any).electronAPI.restoreDrivers();
      if (result && result.success) {
        showMessage('success', 'Đã phục hồi driver thành công! Khuyến nghị khởi động lại máy.');
      } else {
        showMessage('error', result?.error || 'Không thể phục hồi driver');
      }
    } catch (err: any) {
      showMessage('error', 'Lỗi phục hồi driver: ' + (err?.message || err));
    } finally {
      setDriverRestoring(false);
    }
  };

  const Spinner = () => (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );

  return (
    <div className="space-y-6" id="backup-container">
      {/* Header */}
      <div className="relative p-6 bg-gradient-to-br from-white to-slate-50 rounded-lg border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none"></div>
        <div className="relative z-10 space-y-2">
          <span className="text-[10px] font-bold text-cyan-600 bg-cyan-50 px-2.5 py-1 rounded border border-cyan-200 uppercase tracking-widest inline-block">
            Sao lưu & Phục hồi
          </span>
          <h2 className="text-xl font-extrabold text-slate-900">Sao Lưu WiFi & Driver</h2>
          <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
            Sao lưu lại các mạng WiFi đã lưu (kèm mật khẩu) và driver bên thứ 3 để phục hồi nhanh chóng sau khi cài lại Windows.
          </p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
          message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
          message.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
          'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          {message.type === 'success' ? <CheckCircle className="h-4 w-4 shrink-0" /> :
           message.type === 'error' ? <AlertTriangle className="h-4 w-4 shrink-0" /> :
           <RefreshCw className="h-4 w-4 shrink-0" />}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* WiFi Backup Section */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-200 shadow-sm">
              <Wifi className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-slate-900">Sao Lưu WiFi</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Xuất tất cả mạng WiFi đã lưu (kèm mật khẩu) thành file để phục hồi sau khi cài lại máy</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleScanWifi}
              disabled={wifiLoading}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200"
            >
              {wifiLoading ? <Spinner /> : <Search className="h-3.5 w-3.5" />}
              {wifiLoading ? 'Đang quét...' : 'Quét WiFi đã lưu'}
            </button>
            <button
              onClick={handleExportWifi}
              disabled={wifiExporting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {wifiExporting ? <Spinner /> : <Download className="h-3.5 w-3.5" />}
              {wifiExporting ? 'Đang sao lưu...' : 'Sao lưu WiFi'}
            </button>
            <button
              onClick={handleRestoreWifi}
              disabled={wifiRestoring}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {wifiRestoring ? <Spinner /> : <Upload className="h-3.5 w-3.5" />}
              {wifiRestoring ? 'Đang phục hồi...' : 'Phục hồi WiFi'}
            </button>
          </div>

          {/* WiFi Profiles Table */}
          {wifiScanned && (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-3 py-2 font-bold text-slate-600 w-10">STT</th>
                    <th className="text-left px-3 py-2 font-bold text-slate-600">Tên WiFi</th>
                    <th className="text-left px-3 py-2 font-bold text-slate-600">Mật khẩu</th>
                    <th className="text-left px-3 py-2 font-bold text-slate-600 w-28">Bảo mật</th>
                  </tr>
                </thead>
                <tbody>
                  {wifiProfiles.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-4 text-center text-slate-400">
                        Không tìm thấy mạng WiFi nào đã lưu.
                      </td>
                    </tr>
                  ) : (
                    wifiProfiles.map((p, idx) => (
                      <tr key={idx} className={`border-b border-slate-100 ${idx % 2 === 1 ? 'bg-slate-50/50' : ''} hover:bg-blue-50/30 transition-colors`}>
                        <td className="px-3 py-2 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="px-3 py-2 font-semibold text-slate-800">{p.name}</td>
                        <td className="px-3 py-2 font-mono text-slate-700">{p.password || <span className="text-slate-400 italic">Không có</span>}</td>
                        <td className="px-3 py-2">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            p.auth?.includes('WPA') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            p.auth?.includes('Open') ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {p.auth || 'N/A'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Driver Backup Section */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-fuchsia-50 text-fuchsia-600 rounded-lg border border-fuchsia-200 shadow-sm">
              <HardDrive className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-slate-900">Sao Lưu Driver</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Xuất tất cả driver bên thứ 3 để cài lại sau khi format máy. Hữu ích khi không có mạng.</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Warning */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Lưu ý:</span>
              <span>Quá trình sao lưu driver có thể mất vài phút và file backup có thể nặng vài trăm MB tùy số lượng driver đã cài. Windows 10/11 thường tự tải driver qua Windows Update — tính năng này hữu ích nhất khi máy không có mạng sau khi cài lại.</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleExportDrivers}
              disabled={driverExporting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {driverExporting ? <Spinner /> : <Download className="h-3.5 w-3.5" />}
              {driverExporting ? 'Đang sao lưu driver...' : 'Sao lưu Driver'}
            </button>
            <button
              onClick={handleRestoreDrivers}
              disabled={driverRestoring}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {driverRestoring ? <Spinner /> : <Upload className="h-3.5 w-3.5" />}
              {driverRestoring ? 'Đang phục hồi (Admin)...' : 'Phục hồi Driver (Admin)'}
            </button>
          </div>

          {/* Info about driver restore */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />
            <span>Phục hồi driver yêu cầu quyền <strong>Administrator</strong>. Sau khi phục hồi, khuyến nghị khởi động lại máy tính để driver hoạt động đầy đủ.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
