import React, { useState, useEffect } from 'react';
import { Shield, Zap, Battery, Play, Download, CheckCircle, Info, Activity, Settings, RefreshCw, AlertTriangle, Monitor, HardDrive, Cpu, Terminal, Wrench, X } from 'lucide-react';

type PowerModeType = 'battery' | 'balanced' | 'gaming' | 'performance' | 'ultimate';

interface PowerModeOption {
  id: PowerModeType;
  name: string;
  subName: string;
  description: string;
  cpuLimit: string;
  fanSpeed: string;
  drainIndex: number;
  responsiveness: number;
  colorClass: string;
  bgGlowClass: string;
}

const powerOptions: PowerModeOption[] = [
  {
    id: 'battery',
    name: 'Tiết kiệm pin (Power Saver)',
    subName: 'Tối ưu thời gian sử dụng',
    description: 'Giới hạn hiệu năng CPU ở mức 60%-80%, tắt các hiệu ứng đồ họa Windows và dịch vụ ngầm để tăng thời lượng pin tối đa.',
    cpuLimit: 'Giới hạn tối đa 70%',
    fanSpeed: 'Thấp / Yên tĩnh (Quiet)',
    drainIndex: 2,
    responsiveness: 4,
    colorClass: 'text-emerald-600 border-emerald-500/30 hover:border-emerald-500/50',
    bgGlowClass: 'bg-emerald-50/50',
  },
  {
    id: 'balanced',
    name: 'Cân bằng (Balanced - Default)',
    subName: 'Tự động điều chỉnh hiệu năng',
    description: 'Chế độ cân bằng mặc định của Windows. Tự động tăng xung nhịp khi chạy tác vụ nặng và hạ xung khi máy nghỉ để tiết kiệm điện.',
    cpuLimit: 'Tự động điều chỉnh 5%-100%',
    fanSpeed: 'Tự động (Smart fan)',
    drainIndex: 5,
    responsiveness: 7,
    colorClass: 'text-sky-600 border-sky-500/30 hover:border-sky-500/50',
    bgGlowClass: 'bg-sky-50/50',
  },
  {
    id: 'gaming',
    name: 'Chế độ Gaming (Gaming Mode)',
    subName: 'Tập trung tối đa FPS',
    description: 'Ưu tiên chu kỳ xử lý đồ họa của GPU, dọn dẹp RAM nền và kích hoạt cài đặt Game Mode để duy trì tốc độ khung hình ổn định nhất.',
    cpuLimit: 'Cố định tối thiểu 90% clock',
    fanSpeed: 'Cao (High Performance)',
    drainIndex: 8,
    responsiveness: 9,
    colorClass: 'text-amber-600 border-amber-500/30 hover:border-amber-500/50',
    bgGlowClass: 'bg-amber-50/50',
  },
  {
    id: 'performance',
    name: 'Hiệu năng cao (High Performance)',
    subName: 'Phản hồi phần cứng tức thì',
    description: 'Thiết lập CPU hoạt động hết công suất, tắt chế độ ngủ đông ổ đĩa SATA/NVMe và duy trì điện áp cao giúp ứng dụng khởi chạy lập tức.',
    cpuLimit: 'Mở khóa 100% công suất',
    fanSpeed: 'Tối đa (Max Speed)',
    drainIndex: 9,
    responsiveness: 9.5,
    colorClass: 'text-rose-600 border-rose-500/30 hover:border-rose-500/50',
    bgGlowClass: 'bg-rose-50/50',
  },
  {
    id: 'ultimate',
    name: 'Ultimate Performance (Đỉnh cao)',
    subName: 'Bật gói hiệu năng ẩn Microsoft',
    description: 'Kích hoạt cấu hình ẩn cao cấp nhất của Windows 10/11, triệt tiêu hoàn toàn độ trễ dòng điện vi mạch, mang lại tốc độ tuyệt đối cho Workstation.',
    cpuLimit: 'Mở khóa cực hạn 100% Core Clock',
    fanSpeed: 'Tối đa liên tục (Turbo)',
    drainIndex: 10,
    responsiveness: 10,
    colorClass: 'text-fuchsia-600 border-fuchsia-500/30 hover:border-fuchsia-500/50',
    bgGlowClass: 'bg-fuchsia-50/50',
  },
];

export default function WindowsSettings() {
  const [activeMode, setActiveMode] = useState<PowerModeOption>(powerOptions[1]);
  const [applyingPower, setApplyingPower] = useState(false);
  const [appliedPowerSuccess, setAppliedPowerSuccess] = useState(false);
  
  const [loadingState, setLoadingState] = useState(false);
  const [fixingAction, setFixingAction] = useState<string | null>(null);
  const [isApplyingSettings, setIsApplyingSettings] = useState(false);

  // Advanced Optimization Modal State
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [applyingAdvanced, setApplyingAdvanced] = useState(false);
  const [advancedResult, setAdvancedResult] = useState<string | null>(null);

  const [advancedOpts, setAdvancedOpts] = useState({
    createRestorePoint: true,
    disableHpet: true,
    disableNetworkThrottling: true,
    purgeStandbyRam: true,
    disableBackgroundApps: true,
    disableDeliveryOptimization: true,
    enableGameMode: true,
    disableStartupDelay: true
  });

  const handleApplyAdvanced = async () => {
    setApplyingAdvanced(true);
    setAdvancedResult(null);
    try {
      const isElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined;
      if (isElectron) {
        const res = await (window as any).electronAPI.applyAdvancedOptimization(advancedOpts);
        if (res && res.success) {
          setAdvancedResult("Đã áp dụng toàn bộ các cấu hình tối ưu nâng cao thành công!");
        } else {
          setAdvancedResult("Lỗi khi áp dụng: " + (res?.error || "Không xác định"));
        }
      } else {
        alert("Tính năng này chỉ chạy trên ứng dụng Desktop.");
      }
    } catch (e: any) {
      setAdvancedResult("Lỗi: " + e.message);
    } finally {
      setApplyingAdvanced(false);
    }
  };

  const handleRestoreAdvanced = async () => {
    if (!confirm("Bạn có chắc chắn muốn khôi phục toàn bộ các cấu hình tối ưu nâng cao về mặc định của Windows?")) return;
    setApplyingAdvanced(true);
    setAdvancedResult(null);
    try {
      const isElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined;
      if (isElectron) {
        const res = await (window as any).electronAPI.restoreAdvancedOptimization();
        if (res && res.success) {
          setAdvancedResult("Đã khôi phục toàn bộ cài đặt nâng cao về mặc định của Windows thành công!");
        } else {
          setAdvancedResult("Lỗi khi khôi phục: " + (res?.error || "Không xác định"));
        }
      } else {
        alert("Tính năng này chỉ chạy trên ứng dụng Desktop.");
      }
    } catch (e: any) {
      setAdvancedResult("Lỗi: " + e.message);
    } finally {
      setApplyingAdvanced(false);
    }
  };
  
  // Settings State
  const [state, setState] = useState({
    // System Settings
    thisPc: false,
    classicMenu: false,
    photoViewer: false,
    hideTaskbarIcons: false,
    disableAutoBrightness: false,
    removeLangs: false,
    
    // Taskbar Settings
    hideSearch: false,
    hideTaskView: false,
    hideWidgets: false,
    hideChat: false,
    hideCopilot: false,
    hideNews: false,
    taskbarLeft: false, // false = Center, true = Left
    
    // Optimization
    hibernate: true,
    fastStartup: true,
    prefetch: true,
    sysMain: true,
    remoteDesktop: false,
    errorReporting: true,
    searchIndexing: true,
    printSpooler: true,
    defender: true,
    telemetry: true,
    xboxServices: true,
    oneDrive: true
  });

  const isElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined;

  useEffect(() => {
    if (isElectron) {
      loadSettings();
    }
  }, [isElectron]);

  const loadSettings = async () => {
    setLoadingState(true);
    try {
      const res = await (window as any).electronAPI.readWindowsSettings();
      if (res.success && res.data) {
        setState(prev => ({ ...prev, ...res.data }));
        
        // Match active power plan
        if (res.data.activePowerPlan) {
          const guid = res.data.activePowerPlan.toLowerCase();
          if (guid === '381b4222-f694-41f0-9685-ff5bb260df2e') setActiveMode(powerOptions.find(p => p.id === 'balanced') || powerOptions[0]);
          else if (guid === '8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c') setActiveMode(powerOptions.find(p => p.id === 'performance') || powerOptions[1]);
          else if (guid === 'e9a42b02-d5df-448d-aa00-03f14749eb61') setActiveMode(powerOptions.find(p => p.id === 'ultimate') || powerOptions[2]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingState(false);
    }
  };

  const handleChange = (key: keyof typeof state, value: boolean) => {
    if (key === 'defender' && value === false) {
      const confirm = window.confirm("CẢNH BÁO: Tắt Windows Defender trên các phiên bản Windows mới thường yêu cầu tắt Tamper Protection bằng tay trước. Nếu bạn tắt, máy tính có thể gặp rủi ro bảo mật. Bạn có chắc chắn muốn tắt?");
      if (!confirm) return;
    }
    setState(prev => ({ ...prev, [key]: value }));
  };

  const handleFixWindows = async (action: string) => {
    if (!isElectron) {
      alert("Chỉ hoạt động trên ứng dụng thật.");
      return;
    }
    setFixingAction(action);
    try {
      let success = false;
      if (action === 'sfc') {
        success = await (window as any).electronAPI.runWindowsFixer();
      } else if (action === 'update') {
        success = await (window as any).electronAPI.resetWindowsUpdate();
      } else if (action === 'icon') {
        success = await (window as any).electronAPI.rebuildIconCache();
      }
      if (success) {
        alert("Đã chạy thành công lệnh sửa lỗi!");
      } else {
        alert("Có lỗi xảy ra khi chạy lệnh.");
      }
    } catch (e: any) {
      alert("Lỗi: " + e.message);
    } finally {
      setFixingAction(null);
    }
  };

  const handleApplyPowerMode = async (mode: PowerModeOption) => {
    setApplyingPower(true);
    setAppliedPowerSuccess(false);
    setActiveMode(mode);

    if (isElectron) {
      try {
        await (window as any).electronAPI.applyPowerPlan({ mode: mode.id });
        setApplyingPower(false);
        setAppliedPowerSuccess(true);
      } catch (err: any) {
        window.alert("Lỗi áp dụng chế độ nguồn điện: " + err.message);
        setApplyingPower(false);
      }
    } else {
      setTimeout(() => {
        setApplyingPower(false);
        setAppliedPowerSuccess(true);
      }, 1000);
    }
  };

  const applySettings = async (type: 'system' | 'taskbar' | 'optimization') => {
    if (!isElectron) {
      alert("Chỉ hoạt động trên ứng dụng thật.");
      return;
    }
    setIsApplyingSettings(true);
    try {
      let res;
      if (type === 'system') {
        res = await (window as any).electronAPI.applyWindowsSettings(state);
      } else if (type === 'taskbar') {
        res = await (window as any).electronAPI.applyTaskbarSettings(state);
      } else if (type === 'optimization') {
        res = await (window as any).electronAPI.applySystemOptimization(state);
      }
      
      if (res.success) {
        alert("Áp dụng thiết lập thành công!");
      } else {
        alert("Lỗi: " + res.error);
      }
    } catch (e: any) {
      alert("Lỗi Exception: " + e.message);
    } finally {
      setIsApplyingSettings(false);
    }
  };

  const toggleCheckbox = (label: string, id: keyof typeof state) => (
    <label className="flex items-center gap-2 cursor-pointer group">
      <div className="relative flex items-center justify-center">
        <input 
          type="checkbox" 
          checked={state[id]}
          onChange={(e) => handleChange(id, e.target.checked)}
          className="appearance-none w-4 h-4 border border-slate-300 rounded-sm bg-white checked:bg-blue-600 checked:border-blue-600 transition-colors focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
        />
        <svg className={`absolute w-3 h-3 text-white pointer-events-none transition-opacity ${state[id] ? 'opacity-100' : 'opacity-0'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <span className="text-sm text-slate-700 select-none group-hover:text-blue-700 transition-colors">{label}</span>
    </label>
  );

  return (
    <div className="space-y-6 pb-10 animate-fade-in" id="windows-settings-container">
      {/* HEADER */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Settings className="w-7 h-7 text-blue-600" />
            Thiết Lập Windows
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Giao diện tùy chỉnh, hiệu năng và quản lý nguồn điện cho Windows 10/11
          </p>
        </div>
        <button 
          onClick={loadSettings}
          disabled={loadingState}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loadingState ? 'animate-spin' : ''}`} />
          Tải lại trạng thái
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* CARD 0: WINDOWS FIXER */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden border-t-4 border-t-rose-500">
          <div className="bg-slate-50 border-b border-slate-100 p-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-rose-600" />
              Sửa Lỗi Windows Chuyên Sâu (1-Click)
            </h3>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                onClick={() => handleFixWindows('sfc')}
                disabled={fixingAction !== null}
                className="flex flex-col items-center justify-center gap-2 p-4 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:scale-105 border border-rose-200 rounded-lg transition-all shadow-sm disabled:opacity-50 disabled:hover:scale-100"
              >
                {fixingAction === 'sfc' ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Shield className="w-6 h-6" />}
                <span className="font-bold text-sm">{fixingAction === 'sfc' ? "Đang xử lý (10-15p)..." : "Phục Hồi Hệ Thống"}</span>
                <span className="text-xs text-rose-600/80 text-center">Chạy SFC & DISM sửa lỗi màn xanh, file hỏng</span>
              </button>
              
              <button 
                onClick={() => handleFixWindows('update')}
                disabled={fixingAction !== null}
                className="flex flex-col items-center justify-center gap-2 p-4 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:scale-105 border border-sky-200 rounded-lg transition-all shadow-sm disabled:opacity-50 disabled:hover:scale-100"
              >
                {fixingAction === 'update' ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Download className="w-6 h-6" />}
                <span className="font-bold text-sm">{fixingAction === 'update' ? "Đang xử lý..." : "Sửa Kẹt Update"}</span>
                <span className="text-xs text-sky-600/80 text-center">Reset Windows Update, xóa SoftwareDistribution</span>
              </button>
              
              <button 
                onClick={() => handleFixWindows('icon')}
                disabled={fixingAction !== null}
                className="flex flex-col items-center justify-center gap-2 p-4 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:scale-105 border border-amber-200 rounded-lg transition-all shadow-sm disabled:opacity-50 disabled:hover:scale-100"
              >
                {fixingAction === 'icon' ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Monitor className="w-6 h-6" />}
                <span className="font-bold text-sm">{fixingAction === 'icon' ? "Đang xử lý..." : "Fix Lỗi Icon"}</span>
                <span className="text-xs text-amber-600/80 text-center">Rebuild Icon/Thumbnail Cache bị trắng đen</span>
              </button>
            </div>
          </div>
        </div>

        {/* CARD 1: CÀI ĐẶT HỆ THỐNG */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-100 p-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Monitor className="w-5 h-5 text-indigo-600" />
              Cài đặt hệ thống
            </h3>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {toggleCheckbox("Explorer mở This PC thay vì Quick Access", "thisPc")}
              {toggleCheckbox("Sử dụng Context Menu cổ điển (Win11 to Win10)", "classicMenu")}
              {toggleCheckbox("Kích hoạt Windows Photo Viewer", "photoViewer")}
              {toggleCheckbox("Ẩn icon trên Taskbar (Giữ lại mạng, loa, pin)", "hideTaskbarIcons")}
              {toggleCheckbox("Tắt tự động điều chỉnh độ sáng", "disableAutoBrightness")}
              {toggleCheckbox("Xóa bàn phím ngôn ngữ khác (giữ US)", "removeLangs")}
            </div>
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => applySettings('system')}
                disabled={isApplyingSettings}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-600 hover:text-white rounded-lg font-semibold transition-all shadow-sm"
              >
                <Shield className="w-4 h-4" />
                Áp dụng Cài đặt hệ thống
              </button>
            </div>
          </div>
        </div>

        {/* CARD 2: TASKBAR */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-100 p-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600" />
              Taskbar - System Tray (Win10/11)
            </h3>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {toggleCheckbox("Ẩn Search", "hideSearch")}
              {toggleCheckbox("Ẩn Task View", "hideTaskView")}
              {toggleCheckbox("Ẩn Widgets", "hideWidgets")}
              {toggleCheckbox("Ẩn Chat/Teams", "hideChat")}
              {toggleCheckbox("Ẩn Copilot", "hideCopilot")}
              {toggleCheckbox("Ẩn News/Weather", "hideNews")}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-700">Vị trí Taskbar:</span>
                <select 
                  className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 outline-none min-w-[120px]"
                  value={state.taskbarLeft ? 'left' : 'center'}
                  onChange={(e) => handleChange('taskbarLeft', e.target.value === 'left')}
                >
                  <option value="left">Căn trái</option>
                  <option value="center">Ở giữa (Center)</option>
                </select>
              </div>
              <button 
                onClick={() => applySettings('taskbar')}
                disabled={isApplyingSettings}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#8fdcc5] hover:bg-[#7bc8b1] text-slate-800 border border-[#68bda3] rounded-lg font-bold transition-all shadow-sm"
              >
                <Shield className="w-4 h-4" />
                Áp dụng Taskbar
              </button>
            </div>
          </div>
        </div>

        {/* CARD 3: TỐI ƯU HỆ THỐNG */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-100 p-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-600" />
              Tối ưu hệ thống (Bật/Tắt Services)
            </h3>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
              {toggleCheckbox("Hibernate (Ngủ đông)", "hibernate")}
              {toggleCheckbox("Remote Desktop", "remoteDesktop")}
              {toggleCheckbox("Windows Defender", "defender")}
              
              {toggleCheckbox("Fast Startup (Khởi động nhanh)", "fastStartup")}
              {toggleCheckbox("Error Reporting (Báo lỗi)", "errorReporting")}
              {toggleCheckbox("Telemetry (Thu thập dữ liệu)", "telemetry")}
              
              {toggleCheckbox("Prefetch (Tải trước ứng dụng)", "prefetch")}
              {toggleCheckbox("Windows Search Indexing", "searchIndexing")}
              {toggleCheckbox("Xbox Services", "xboxServices")}
              
              {toggleCheckbox("Superfetch/SysMain", "sysMain")}
              {toggleCheckbox("Print Spooler (Máy in)", "printSpooler")}
              {toggleCheckbox("OneDrive tự khởi động", "oneDrive")}
            </div>
            
            <p className="text-xs text-slate-400 mt-4 italic">💡 Tắt các dịch vụ không cần thiết giúp tăng hiệu năng và tiết kiệm RAM</p>
            
            <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3 border-t border-slate-100 pt-5">
              <button 
                onClick={() => applySettings('optimization')}
                disabled={isApplyingSettings}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold transition-all shadow-sm"
              >
                <Shield className="w-4 h-4" />
                Áp dụng tối ưu
              </button>
              
              <button 
                onClick={() => setShowAdvancedModal(true)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg font-bold transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                Tối ưu nâng cao
              </button>
            </div>
          </div>
        </div>

        {/* CARD 4: POWER CONTROL */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-100 p-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Kiểm soát & Tối ưu nguồn điện (Power Plan)
            </h3>
          </div>

          <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Col: Mode List selectors */}
            <div className="lg:col-span-7 space-y-3">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-2">Lựa chọn cấu hình nguồn điện</span>
              {powerOptions.map((mode) => {
                const isSelected = activeMode.id === mode.id;
                return (
                  <button
                    key={mode.id}
                    onClick={() => handleApplyPowerMode(mode)}
                    disabled={applyingPower}
                    className={`w-full p-4 rounded-lg text-left border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                      isSelected
                        ? `${mode.bgGlowClass} border-blue-300 shadow-sm`
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {mode.id === 'battery' && <Battery className="h-4 w-4 text-emerald-600" />}
                        {mode.id === 'balanced' && <Zap className="h-4 w-4 text-sky-600" />}
                        {mode.id === 'gaming' && <Zap className="h-4 w-4 text-amber-500 animate-pulse" />}
                        {mode.id === 'performance' && <Zap className="h-4 w-4 text-rose-600" />}
                        {mode.id === 'ultimate' && <Zap className="h-4 w-4 text-fuchsia-600 animate-bounce" />}
                        <span className="text-sm font-bold text-slate-800">{mode.name}</span>
                      </div>
                      <span className="text-xs text-slate-500 font-medium block">{mode.subName}</span>
                      <p className="text-xs text-slate-500 leading-relaxed max-w-lg mt-1">{mode.description}</p>
                    </div>

                    <span className={`text-xs font-semibold shrink-0 flex flex-col items-end gap-1 ${isSelected ? mode.colorClass : 'text-slate-400'}`}>
                      {isSelected ? 'Đang kích hoạt' : 'Bấm để chọn'}
                      {applyingPower && isSelected && <RefreshCw className="w-3 h-3 animate-spin" />}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right Col: Performance Gauge Indicators */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 space-y-5">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-200 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-amber-500" />
                  Chỉ số kỹ thuật dự kiến
                </h3>

                <div className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-slate-600">
                      <span>Khả năng đáp ứng của CPU</span>
                      <span className="text-slate-800 font-semibold font-mono">{activeMode.cpuLimit}</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-sky-500 h-full transition-all duration-700"
                        style={{ width: `${activeMode.responsiveness * 10}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-slate-600">
                      <span>Tốc độ quạt tản nhiệt</span>
                      <span className="text-slate-800 font-semibold font-mono">{activeMode.fanSpeed}</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-400 to-emerald-400 h-full transition-all duration-700"
                        style={{ width: `${(activeMode.drainIndex + activeMode.responsiveness) * 5}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-slate-600">
                      <span>Mức độ tiêu hao pin</span>
                      <span className="text-slate-800 font-semibold font-mono">{activeMode.drainIndex}/10</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 h-full transition-all duration-700"
                        style={{ width: `${activeMode.drainIndex * 10}%` }}
                      />
                    </div>
                  </div>
                </div>

                {appliedPowerSuccess && (
                  <div className="p-3.5 bg-emerald-50 rounded border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-800">
                    <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                    <div>
                      <strong className="block font-bold">KÍCH HOẠT THÀNH CÔNG</strong>
                      Chế độ <span className="font-bold">{activeMode.name}</span> đã được áp dụng.
                    </div>
                  </div>
                )}

                {activeMode.id === 'ultimate' && (
                  <div className="p-3.5 bg-fuchsia-50 rounded border border-fuchsia-200 text-[10.5px] text-fuchsia-800 leading-relaxed flex items-start gap-2 mt-4">
                    <Info className="h-4 w-4 shrink-0 mt-0.5 text-fuchsia-600" />
                    <div>
                      <strong className="block mb-0.5">Sơ đồ ẩn Ultimate Performance:</strong>
                      Kịch bản sẽ tự động mở khóa (unhide) sơ đồ này trên máy thật bằng GUID gốc của Microsoft.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ADVANCED OPTIMIZATION MODAL */}
      {showAdvancedModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 text-amber-600 rounded-xl">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800">Tối Ưu Hệ Thống Nâng Cao (Extreme Performance)</h3>
                  <p className="text-xs text-slate-500">Minh bạch 100% từng tùy chọn can thiệp sâu dành cho Kỹ thuật viên & Game thủ</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAdvancedModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 overflow-y-auto flex-1 pr-1">
              {/* Tùy chọn Restore Point */}
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-amber-400/50 hover:bg-amber-50/30 transition-all cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={advancedOpts.createRestorePoint} 
                  onChange={e => setAdvancedOpts(prev => ({ ...prev, createRestorePoint: e.target.checked }))}
                  className="mt-1 w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-400"
                />
                <div>
                  <span className="font-bold text-slate-800 text-sm block">Tự động tạo điểm khôi phục (System Restore Point)</span>
                  <span className="text-xs text-slate-500">Khuyên dùng. Giúp dễ dàng hoàn tác (Undo) 100% nếu muốn quay lại ban đầu.</span>
                </div>
              </label>

              {/* Tùy chọn HPET */}
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-amber-400/50 hover:bg-amber-50/30 transition-all cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={advancedOpts.disableHpet} 
                  onChange={e => setAdvancedOpts(prev => ({ ...prev, disableHpet: e.target.checked }))}
                  className="mt-1 w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-400"
                />
                <div>
                  <span className="font-bold text-slate-800 text-sm block">Tắt HPET & Dynamic Tick (Giảm độ trễ CPU cho Game)</span>
                  <span className="text-xs text-slate-500">Giảm khựng/khung hình rác (FPS drop/stuttering) khi chơi các tựa game bắn súng/đối kháng.</span>
                </div>
              </label>

              {/* Tùy chọn Network Throttling */}
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-amber-400/50 hover:bg-amber-50/30 transition-all cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={advancedOpts.disableNetworkThrottling} 
                  onChange={e => setAdvancedOpts(prev => ({ ...prev, disableNetworkThrottling: e.target.checked }))}
                  className="mt-1 w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-400"
                />
                <div>
                  <span className="font-bold text-slate-800 text-sm block">Tắt Network Throttling (Mở khóa 100% băng thông mạng)</span>
                  <span className="text-xs text-slate-500">Loại bỏ chế độ giới hạn mạng Multimedia của Windows, giúp giảm ping và tối ưu gói tin Game/Zoom/Meet.</span>
                </div>
              </label>

              {/* Tùy chọn Purge RAM */}
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-amber-400/50 hover:bg-amber-50/30 transition-all cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={advancedOpts.purgeStandbyRam} 
                  onChange={e => setAdvancedOpts(prev => ({ ...prev, purgeStandbyRam: e.target.checked }))}
                  className="mt-1 w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-400"
                />
                <div>
                  <span className="font-bold text-slate-800 text-sm block">Dọn dẹp Standby RAM Cache (Nhả bộ nhớ RAM thừa tức thì)</span>
                  <span className="text-xs text-slate-500">Thu hồi RAM bị các app đã đóng giữ chân, giải phóng từ 500MB đến 3GB RAM thực tế mà không cần rs máy.</span>
                </div>
              </label>

              {/* Tùy chọn Background Apps */}
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-amber-400/50 hover:bg-amber-50/30 transition-all cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={advancedOpts.disableBackgroundApps} 
                  onChange={e => setAdvancedOpts(prev => ({ ...prev, disableBackgroundApps: e.target.checked }))}
                  className="mt-1 w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-400"
                />
                <div>
                  <span className="font-bold text-slate-800 text-sm block">Chặn Ứng Dụng UWP Chạy Ngầm (Disable Background Apps)</span>
                  <span className="text-xs text-slate-500">Ngăn các ứng dụng Store rác tự chạy ngầm ngốn tài nguyên. Không ảnh hưởng đến phần mềm văn phòng.</span>
                </div>
              </label>

              {/* Tùy chọn Delivery Optimization */}
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-amber-400/50 hover:bg-amber-50/30 transition-all cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={advancedOpts.disableDeliveryOptimization} 
                  onChange={e => setAdvancedOpts(prev => ({ ...prev, disableDeliveryOptimization: e.target.checked }))}
                  className="mt-1 w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-400"
                />
                <div>
                  <span className="font-bold text-slate-800 text-sm block">Tắt Delivery Optimization (Chặn upload Win Update ngầm)</span>
                  <span className="text-xs text-slate-500">Chặn Windows chia sẻ băng thông mạng của máy bạn sang máy khác trên Internet.</span>
                </div>
              </label>

              {/* Tùy chọn Game Mode */}
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-amber-400/50 hover:bg-amber-50/30 transition-all cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={advancedOpts.enableGameMode} 
                  onChange={e => setAdvancedOpts(prev => ({ ...prev, enableGameMode: e.target.checked }))}
                  className="mt-1 w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-400"
                />
                <div>
                  <span className="font-bold text-slate-800 text-sm block">Kích hoạt Windows Game Mode (Ưu tiên phần cứng)</span>
                  <span className="text-xs text-slate-500">Tự động ưu tiên xung nhịp CPU và tài nguyên GPU cho cửa sổ ứng dụng/game đang mở.</span>
                </div>
              </label>

              {/* Tùy chọn Startup Delay */}
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-amber-400/50 hover:bg-amber-50/30 transition-all cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={advancedOpts.disableStartupDelay} 
                  onChange={e => setAdvancedOpts(prev => ({ ...prev, disableStartupDelay: e.target.checked }))}
                  className="mt-1 w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-400"
                />
                <div>
                  <span className="font-bold text-slate-800 text-sm block">Bỏ thời gian chờ khởi động ứng dụng (Disable Startup Delay)</span>
                  <span className="text-xs text-slate-500">Giúp các phần mềm tự chạy cùng Windows xuất hiện lập tức khi vừa vào Desktop.</span>
                </div>
              </label>

              {advancedResult && (
                <div className={`p-3 rounded-xl text-sm font-bold flex items-center gap-2 ${advancedResult.includes('thành công') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                  {advancedResult.includes('thành công') ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                  {advancedResult}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-wrap justify-between items-center gap-3">
              <div className="flex gap-4 items-center">
                <button 
                  onClick={() => setAdvancedOpts({
                    createRestorePoint: true,
                    disableHpet: true,
                    disableNetworkThrottling: true,
                    purgeStandbyRam: true,
                    disableBackgroundApps: true,
                    disableDeliveryOptimization: true,
                    enableGameMode: true,
                    disableStartupDelay: true
                  })}
                  className="text-xs text-slate-500 hover:text-amber-600 font-bold cursor-pointer"
                >
                  ☑️ Tích chọn tất cả (Khuyên dùng)
                </button>
                <button 
                  onClick={handleRestoreAdvanced}
                  disabled={applyingAdvanced}
                  className="text-xs text-rose-500 hover:text-rose-700 font-bold cursor-pointer underline"
                >
                  🔄 Trả về mặc định Windows (Undo)
                </button>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => setShowAdvancedModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                <button 
                  onClick={handleApplyAdvanced}
                  disabled={applyingAdvanced}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-lg text-sm transition-all shadow flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {applyingAdvanced ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Đang tối ưu...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Áp dụng Tối Ưu Nâng Cao
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
