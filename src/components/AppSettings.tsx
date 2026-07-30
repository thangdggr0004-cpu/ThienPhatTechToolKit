import React, { useState, useEffect } from 'react';
import { 
  Palette, Cpu, ShieldCheck, RefreshCw, Sliders, Monitor, Zap, 
  Volume2, Bell, Sparkles, Moon, Sun, Download, Upload, RotateCcw, Check, AlertTriangle, Layers
} from 'lucide-react';
import packageJson from '../../package.json' with { type: 'json' };

interface AppConfig {
  theme: 'dark' | 'light' | 'system';
  animations: boolean;
  closeToTray: boolean;
  fontSize: 'small' | 'medium' | 'large';
  refreshInterval: number; // in seconds
  autoRamClean: boolean;
  cpuTempAlert: boolean;
  cpuTempThreshold: number; // in °C
  autoStart: boolean;
  scheduledScan: 'disabled' | 'weekly' | 'monthly';
  ecoOnBattery: boolean;
  updateChannel: 'stable' | 'beta';
  autoDownloadUpdates: boolean;
}

const defaultConfig: AppConfig = {
  theme: 'dark',
  animations: true,
  closeToTray: true,
  fontSize: 'medium',
  refreshInterval: 3,
  autoRamClean: false,
  cpuTempAlert: true,
  cpuTempThreshold: 85,
  autoStart: false,
  scheduledScan: 'weekly',
  ecoOnBattery: true,
  updateChannel: 'stable',
  autoDownloadUpdates: true,
};

export default function AppSettings() {
  const [activeTab, setActiveTab] = useState<'ui' | 'perf' | 'auto' | 'update' | 'advanced'>('ui');
  const [config, setConfig] = useState<AppConfig>(() => {
    const saved = localStorage.getItem('thienphat_app_config');
    if (saved) {
      try {
        return { ...defaultConfig, ...JSON.parse(saved) };
      } catch (e) {
        return defaultConfig;
      }
    }
    return defaultConfig;
  });

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [checkingUpdate, setCheckingUpdate] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('thienphat_app_config', JSON.stringify(config));
    // Apply theme
    if (config.theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
    
    // Apply animations globally
    if (config.animations) {
      document.body.classList.remove('no-animations');
    } else {
      document.body.classList.add('no-animations');
    }
  }, [config]);

  useEffect(() => {
    // Initial sync with backend
    const isElectron = typeof window !== 'undefined' && window.electronAPI !== undefined;
    if (isElectron) {
      window.electronAPI.setAutoStart(config.autoStart);
      window.electronAPI.setCloseToTray(config.closeToTray);
    }
  }, []);

  const updateConfig = (key: keyof AppConfig, value: any) => {
    setConfig(prev => {
      const nextConfig = { ...prev, [key]: value };
      
      const isElectron = typeof window !== 'undefined' && window.electronAPI !== undefined;
      if (isElectron) {
        if (key === 'autoStart') {
          (window as any).electronAPI.setAutoStart(value);
        }
        if (key === 'closeToTray') {
          (window as any).electronAPI.setCloseToTray(value);
        }
        if (key === 'autoRamClean' && value === true) {
          window.electronAPI.cleanRamNow().then((res) => {
            if (res && res.success) console.log(res.message);
          });
        }
      }
      
      // Notify other components (like App.tsx) about the change
      window.dispatchEvent(new CustomEvent('app-config-changed', { detail: nextConfig }));

      return nextConfig;
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleResetDefault = () => {
    if (window.confirm('Bạn có chắc chắn muốn đặt lại tất cả cài đặt về mặc định ban đầu không?')) {
      setConfig(defaultConfig);
      localStorage.removeItem('thienphat_app_config');
      alert('Đã khôi phục cài đặt mặc định thành công!');
    }
  };

  const handleExportConfig = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `thienphat_toolkit_config_v${packageJson.version}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (event.target.files && event.target.files[0]) {
      fileReader.readAsText(event.target.files[0], "UTF-8");
      fileReader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target?.result as string);
          setConfig({ ...defaultConfig, ...parsed });
          alert('Đã nhập tệp cấu hình thành công!');
        } catch (error) {
          alert('Tệp cấu hình không hợp lệ!');
        }
      };
    }
  };

  const handleCheckUpdateManual = async () => {
    setCheckingUpdate(true);
    try {
      const isElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined;
      if (isElectron) {
        const res = await window.electronAPI.checkForUpdates();
        if (res && res.hasUpdate === false) {
          await (window as any).electronAPI.showInfoDialog({
            title: 'Thông Tin Cập Nhật',
            message: `Bạn đang ở phiên bản mới nhất (v${packageJson.version}). Không có bản cập nhật nào mới hơn trên GitHub.`
          });
        }
      } else {
        alert(`Bạn đang dùng bản Web v${packageJson.version}!`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCheckingUpdate(false);
    }
  };

  return (
    <div className="p-1 space-y-6">
      <header className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Sliders className="h-6 w-6 text-blue-600" />
            Cấu Hình & Thiết Lập Ứng Dụng
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tùy biến giao diện, hiệu năng giám sát, chế độ tự động hóa và quản lý cập nhật hệ thống.
          </p>
        </div>
        {savedSuccess && (
          <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg animate-fade-in">
            <Check className="w-4 h-4 text-emerald-500" /> Đã lưu tự động!
          </span>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Left Sidebar */}
        <div className="bg-white rounded-xl border border-slate-200 p-2 space-y-1 shadow-sm h-fit">
          <button
            onClick={() => setActiveTab('ui')}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-xs font-bold transition-all text-left ${
              activeTab === 'ui' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>1. Giao Diện & UI/UX</span>
          </button>
          
          <button
            onClick={() => setActiveTab('perf')}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-xs font-bold transition-all text-left ${
              activeTab === 'perf' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>2. Hiệu Năng & Giám Sát</span>
          </button>

          <button
            onClick={() => setActiveTab('auto')}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-xs font-bold transition-all text-left ${
              activeTab === 'auto' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>3. Tự Động Hóa & Boot</span>
          </button>

          <button
            onClick={() => setActiveTab('update')}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-xs font-bold transition-all text-left ${
              activeTab === 'update' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>4. Cập Nhật & Thông Tin</span>
          </button>

          <button
            onClick={() => setActiveTab('advanced')}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-xs font-bold transition-all text-left ${
              activeTab === 'advanced' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>5. Nâng Cao & Sao Lưu</span>
          </button>
        </div>

        {/* Content Right Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* TAB 1: UI / UX */}
          {activeTab === 'ui' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Palette className="w-5 h-5 text-blue-600" /> TÙY CHỈNH GIAO DIỆN & TRẢI NGHIỆM
              </h2>

              {/* Theme option */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Chế độ giao diện (Theme):</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => updateConfig('theme', 'dark')}
                    className={`p-3 rounded-lg border flex flex-col items-center gap-2 text-xs font-bold transition-all ${
                      config.theme === 'dark' ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Moon className="w-5 h-5 text-slate-800" /> Slate Dark (Mặc định)
                  </button>
                  <button
                    onClick={() => updateConfig('theme', 'light')}
                    className={`p-3 rounded-lg border flex flex-col items-center gap-2 text-xs font-bold transition-all ${
                      config.theme === 'light' ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Sun className="w-5 h-5 text-amber-500" /> Light Mode (Sáng)
                  </button>
                  <button
                    onClick={() => updateConfig('theme', 'system')}
                    className={`p-3 rounded-lg border flex flex-col items-center gap-2 text-xs font-bold transition-all ${
                      config.theme === 'system' ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Monitor className="w-5 h-5 text-blue-500" /> Theo Hệ Thống
                  </button>
                </div>
              </div>

              {/* Page Animations */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                <div>
                  <h3 className="text-xs font-bold text-slate-800">Hiệu ứng mượt (Page Animations)</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Bật/Tắt hiệu ứng chuyển trang. Tắt đi sẽ giúp các máy cấu hình yếu chạy mượt hơn.</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.animations}
                  onChange={(e) => updateConfig('animations', e.target.checked)}
                  className="w-5 h-5 accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Close to Tray */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                <div>
                  <h3 className="text-xs font-bold text-slate-800">Thu nhỏ về khay hệ thống (System Tray)</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Khi bấm nút đóng [X], ứng dụng sẽ thu nhỏ xuống góc màn hình để duy trì tính năng ngầm.</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.closeToTray}
                  onChange={(e) => updateConfig('closeToTray', e.target.checked)}
                  className="w-5 h-5 accent-blue-600 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* TAB 2: PERFORMANCE & MONITORING */}
          {activeTab === 'perf' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Zap className="w-5 h-5 text-amber-500" /> GIÁM SÁT HIỆU NĂNG & CẢNH BÁO
              </h2>

              {/* Refresh rate */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Tần số cập nhật thông số CPU/RAM ở thanh Footer:</label>
                <select
                  value={config.refreshInterval}
                  onChange={(e) => updateConfig('refreshInterval', Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value={1}>1 Giây (Mượt nhất - Cập nhật liên tục)</option>
                  <option value={2}>2 Giây (Khuyến nghị)</option>
                  <option value={3}>3 Giây (Mặc định tiêu chuẩn)</option>
                  <option value={5}>5 Giây (Tiết kiệm tài nguyên)</option>
                  <option value={0}>Tắt làm mới tự động</option>
                </select>
              </div>

              {/* Auto RAM Clean */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                <div>
                  <h3 className="text-xs font-bold text-slate-800">Tự động giải phóng bộ nhớ RAM ngầm</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Tự động xả bộ nhớ đệm Cache khi RAM máy tính vượt quá 85% để tránh giật lag.</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.autoRamClean}
                  onChange={(e) => updateConfig('autoRamClean', e.target.checked)}
                  className="w-5 h-5 accent-blue-600 cursor-pointer"
                />
              </div>

              {/* CPU Temp Alert */}
              <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-500" /> Cảnh báo khi nhiệt độ CPU quá cao
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Phát thông báo Toast khi nhiệt độ vượt ngưỡng an toàn.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.cpuTempAlert}
                    onChange={(e) => updateConfig('cpuTempAlert', e.target.checked)}
                    className="w-5 h-5 accent-blue-600 cursor-pointer"
                  />
                </div>

                {config.cpuTempAlert && (
                  <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between gap-4">
                    <span className="text-xs font-bold text-slate-700">Ngưỡng nhiệt độ cảnh báo:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={75}
                        max={95}
                        value={config.cpuTempThreshold}
                        onChange={(e) => updateConfig('cpuTempThreshold', Number(e.target.value))}
                        className="w-32 accent-blue-600 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded font-mono">
                        {config.cpuTempThreshold}°C
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: AUTOMATION & BOOT */}
          {activeTab === 'auto' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600" /> TỰ ĐỘNG HÓA & KHỞI ĐỘNG HỆ THỐNG
              </h2>

              {/* Auto Start */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                <div>
                  <h3 className="text-xs font-bold text-slate-800">Tự động khởi chạy cùng Windows</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Tự động bật chạy ngầm ngay khi máy tính khởi động để giám sát hệ thống.</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.autoStart}
                  onChange={(e) => updateConfig('autoStart', e.target.checked)}
                  className="w-5 h-5 accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Scheduled Scan */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Lịch trình quét chẩn đoán bản quyền ngầm:</label>
                <select
                  value={config.scheduledScan}
                  onChange={(e) => updateConfig('scheduledScan', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="weekly">Hàng Tuần (Khuyến nghị)</option>
                  <option value="monthly">Hàng Tháng</option>
                  <option value="disabled">Tắt quét tự động</option>
                </select>
              </div>

              {/* Eco on Battery */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                <div>
                  <h3 className="text-xs font-bold text-slate-800">Chế độ Eco Mode tự động khi dùng PIN</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Tự động chuyển sang Eco Mode giảm tần số quét khi Laptop rút dây sạc.</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.ecoOnBattery}
                  onChange={(e) => updateConfig('ecoOnBattery', e.target.checked)}
                  className="w-5 h-5 accent-blue-600 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* TAB 4: UPDATE & INFO */}
          {activeTab === 'update' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                <RefreshCw className="w-5 h-5 text-blue-600" /> CẬP NHẬT PHẦN MỀM & THÔNG TIN
              </h2>

              {/* Channel */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Kênh nhận bản cập nhật (Update Channel):</label>
                <select
                  value={config.updateChannel}
                  onChange={(e) => updateConfig('updateChannel', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="stable">Bản Chính Thức (Stable - An toàn nhất)</option>
                  <option value="beta">Bản Thử Nghiệm (Beta - Trải nghiệm tính năng mới sớm)</option>
                </select>
              </div>

              {/* Auto Download */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                <div>
                  <h3 className="text-xs font-bold text-slate-800">Tự động tải bản vá lỗi ở nền ngầm</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Tự động tải bản `.exe` mới về máy mà không làm gián đoạn công việc của bạn.</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.autoDownloadUpdates}
                  onChange={(e) => updateConfig('autoDownloadUpdates', e.target.checked)}
                  className="w-5 h-5 accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Manual Check button & Info Card */}
              <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-blue-900">Thiên Phát Tech Toolkit Pro</h4>
                  <p className="text-xs text-blue-700 mt-0.5">Phiên bản hiện tại: <span className="font-bold font-mono">v{packageJson.version}</span></p>
                </div>
                <button
                  onClick={handleCheckUpdateManual}
                  disabled={checkingUpdate}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-4 rounded-lg shadow-sm transition-colors flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${checkingUpdate ? 'animate-spin' : ''}`} />
                  {checkingUpdate ? 'Đang Kiểm Tra...' : 'Kiểm Tra Bản Mới Ngay'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: ADVANCED & BACKUP */}
          {activeTab === 'advanced' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Sliders className="w-5 h-5 text-violet-600" /> QUẢN LÝ CẤU HÌNH NÂNG CAO
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={handleExportConfig}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-colors flex items-start gap-3 group"
                >
                  <div className="p-2.5 bg-blue-100 rounded-lg text-blue-600 group-hover:scale-105 transition-transform">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">Xuất File Cấu Hình (.JSON)</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Lưu lại toàn bộ tùy chỉnh ra file riêng để sao lưu hoặc chuyển sang máy khác.</p>
                  </div>
                </button>

                <label className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-colors flex items-start gap-3 cursor-pointer group">
                  <div className="p-2.5 bg-emerald-100 rounded-lg text-emerald-600 group-hover:scale-105 transition-transform">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">Nhập File Cấu Hình (.JSON)</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Nạp lại tùy chỉnh từ file cấu hình `.json` đã lưu trước đó.</p>
                  </div>
                  <input type="file" accept=".json" onChange={handleImportConfig} className="hidden" />
                </label>
              </div>

              {/* Reset App Section */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-red-600 flex items-center gap-1.5">
                    <RotateCcw className="w-4 h-4" /> Đặt lại tất cả cài đặt Tool
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Xóa bộ nhớ đệm và khôi phục cài đặt về trạng thái ban đầu.</p>
                </div>
                <button
                  onClick={handleResetDefault}
                  className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold text-xs py-2 px-3 rounded-lg transition-colors"
                >
                  Đặt Lại Mặc Định
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
