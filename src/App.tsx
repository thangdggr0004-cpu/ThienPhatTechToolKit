import React, { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import packageJson from '../package.json' with { type: 'json' };
import TitleBar from './components/TitleBar.js';
import Sidebar from './components/Sidebar.js';
// Helper for safe lazy loading with retry on Vite HMR chunk load failures
function safeLazy<T extends React.ComponentType<any>>(importFn: () => Promise<{ default: T }>) {
  return lazy(async () => {
    try {
      return await importFn();
    } catch (error) {
      console.warn('[Vite HMR] Dynamic import failed, retrying module load...', error);
      try {
        return await new Promise<{ default: T }>((resolve, reject) => {
          setTimeout(() => {
            importFn().then(resolve).catch(reject);
          }, 300);
        });
      } catch (retryErr) {
        window.location.reload();
        return new Promise<{ default: T }>(() => {});
      }
    }
  });
}

// Lazy‑loaded components
const Dashboard = safeLazy(() => import('./components/Dashboard.js'));
const LicenseManager = safeLazy(() => import('./components/LicenseManager.js'));
const HardwareDetails = safeLazy(() => import('./components/HardwareDetails.js'));
const JunkCleaner = safeLazy(() => import('./components/JunkCleaner.js'));
const NetworkConfig = safeLazy(() => import('./components/NetworkConfig.js'));
const BitLockerManager = safeLazy(() => import('./components/BitLockerManager.js'));
const OfficeStandardizer = safeLazy(() => import('./components/OfficeStandardizer.js'));
const WindowsSettings = safeLazy(() => import('./components/WindowsSettings.js'));
const BackupManager = safeLazy(() => import('./components/BackupManager.js'));
const PrinterUtils = safeLazy(() => import('./components/PrinterUtils.js'));
const LaptopTester = safeLazy(() => import('./components/LaptopTester.js'));
const TouchScreenTester = safeLazy(() => import('./components/TouchScreenTester.js'));
const AdvancedActivation = safeLazy(() => import('./components/AdvancedActivation.js'));
const JobReportViewer = safeLazy(() => import('./components/JobReportViewer.js'));

import { RefreshCw } from 'lucide-react';
import AutoUpdater from './components/AutoUpdater.js';
import { TaskManagerProvider } from './context/TaskManagerContext.js';
import GlobalTaskBar from './components/GlobalTaskBar.js';
import { CoreProvider } from './context/CoreContext.js';

// Skeleton fallback shown while lazy component loads
function PageSkeleton() {

  return (
    <div className="space-y-4 animate-pulse">
      <div className="skeleton h-10 w-2/3 rounded-lg" />
      <div className="grid grid-cols-3 gap-4">
        <div className="skeleton h-28 rounded-xl" />
        <div className="skeleton h-28 rounded-xl" />
        <div className="skeleton h-28 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="skeleton h-48 rounded-xl" />
        <div className="skeleton h-48 rounded-xl" />
      </div>
      <div className="skeleton h-32 rounded-xl" />
    </div>
  );
}

// Wrap page content with enter animation
function PageWrapper({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}

export default function App() {
  type SectionId =
    | 'dashboard'
    | 'activation'
    | 'hardware'
    | 'cleaner'
    | 'network'
    | 'bitlocker'
    | 'standardizer'
    | 'windows-settings'
    | 'backup'
    | 'printer'
    | 'laptop-tester'
    | 'touch-tester'
    | 'advanced-activation'
    | 'ktv-report';

  const [activeSection, setActiveSection] = useState<SectionId>('dashboard');
  const [mountedSections, setMountedSections] = useState<Set<SectionId>>(() => new Set<SectionId>(['dashboard']));
  // Sync active section to a global variable for IPC components
  useEffect(() => {
    (window as any).__activeSection = activeSection;
  }, [activeSection]);


  useEffect(() => {
    setMountedSections(prev => {
      if (prev.has(activeSection)) return prev;
      const next = new Set(prev);
      next.add(activeSection);
      return next;
    });
  }, [activeSection]);
  
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);

  // Secret shortcut "1111" listener to unlock Advanced Activation tab
  useEffect(() => {
    let buffer = '';
    let timer: any = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === '1') {
        buffer += '1';
        clearTimeout(timer);
        timer = setTimeout(() => { buffer = ''; }, 2000);

        if (buffer === '1111') {
          buffer = '';
          setIsUnlocked(true);
          setActiveSection('advanced-activation');
          alert("🔓 Chúc mừng! Bạn đã mở khóa thành công Tiện Ích Nâng Cao (MAS Engine)!");
        }
      } else {
        buffer = '';
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, []);
  
  const [footerMetrics, setFooterMetrics] = useState<{
    temp: number | null;
    ram: number | null;
    ramTotal: number | null;
    netUp: number | null;
    netDown: number | null;
    loaded: boolean;
  }>({
    temp: null,
    ram: null,
    ramTotal: null,
    netUp: null,
    netDown: null,
    loaded: false
  });
  
  const [ecoMode, setEcoMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('ecoMode');
    if (saved !== null) return saved === 'true';
    return false; // Default OFF to avoid unwanted Eco mode on 4-core/32GB PCs
  });

  const [showEcoHint, setShowEcoHint] = useState<boolean>(() => {
    return localStorage.getItem('ecoHintShown') !== 'true';
  });

  const [appConfig, setAppConfig] = useState<any>(() => {
    const saved = localStorage.getItem('thienphat_app_config');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return { refreshInterval: 3, cpuTempAlert: true, cpuTempThreshold: 85, ecoOnBattery: true, autoRamClean: false };
  });

  useEffect(() => {
    const handleConfigChange = (e: any) => {
      if (e.detail) setAppConfig(e.detail);
    };
    window.addEventListener('app-config-changed', handleConfigChange);
    return () => window.removeEventListener('app-config-changed', handleConfigChange);
  }, []);

  // Track if we auto-enabled it so the hint can reflect that
  const isAutoDetected = localStorage.getItem('ecoHintAutoDetected') === 'true';


  useEffect(() => {
    if (ecoMode) {
      document.body.classList.add('eco-mode');
      localStorage.setItem('ecoMode', 'true');
      (window as any).__ecoMode = true;
    } else {
      document.body.classList.remove('eco-mode');
      localStorage.setItem('ecoMode', 'false');
      (window as any).__ecoMode = false;
    }
  }, [ecoMode]);

  useEffect(() => {
    const isElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined;
    if (!isElectron) return;
    
    // Initial fetch for RAM total from hardware info
    (window as any).electronAPI.getHardwareInfo().then((info: any) => {
      if (info && info.ramTotalSize) {
        setFooterMetrics(prev => ({ ...prev, ramTotal: info.ramTotalSize }));
      }
      
      // Smart Auto-Eco Mode for weak CPUs (Celeron, Pentium, Atom, Athlon)
      if (info && info.cpuName) {
        const cpuModel = info.cpuName.toLowerCase();
        const isWeakCpu = cpuModel.includes('celeron') || 
                          cpuModel.includes('pentium') || 
                          cpuModel.includes('atom') || 
                          cpuModel.includes('athlon') ||
                          (info.ramTotalSize && info.ramTotalSize <= 3);
        
        const autoDetected = localStorage.getItem('ecoHintAutoDetected') === 'true';
        
        if (autoDetected && !isWeakCpu) {
          // Reset false auto-detection from previous versions on strong machines
          setEcoMode(false);
          localStorage.removeItem('ecoHintAutoDetected');
          localStorage.setItem('ecoMode', 'false');
        } else if (localStorage.getItem('ecoMode') === null && isWeakCpu) {
          setEcoMode(true);
          localStorage.setItem('ecoHintAutoDetected', 'true');
        }
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    let intervalSeconds = appConfig.refreshInterval ?? 3;
    if (intervalSeconds === 0) return; // Paused

    const timer = setInterval(async () => {
      if ((window as any).__ecoMode) return; // Skip polling in eco mode
      if (typeof document !== 'undefined' && document.hidden) return; // Skip polling when app is minimized/hidden
      try {
        const m = await (window as any).electronAPI.getRealtimeMetrics();
        setFooterMetrics(prev => ({
          ...prev,
          loaded: true,
          temp: m.temp || 0,
          ram: prev.ramTotal ? (m.ram / 100) * prev.ramTotal : 0,
          netUp: m.netUp || 0,
          netDown: m.netDown || 0
        }));

        // Check Battery for eco mode
        if (appConfig.ecoOnBattery && (navigator as any).getBattery) {
          const battery = await (navigator as any).getBattery();
          if (!battery.charging && localStorage.getItem('ecoMode') !== 'true') {
            setEcoMode(true);
            console.log('[Auto] Eco Mode enabled due to battery power.');
          }
        }
      } catch (e) {
        // ignore
      }
    }, intervalSeconds * 1000);

    return () => clearInterval(timer);
  }, [appConfig.refreshInterval, appConfig.ecoOnBattery]);

  useEffect(() => {
    // Also do initial fetch immediately
    (async () => {
      try {
        const m = await (window as any).electronAPI.getRealtimeMetrics();
        setFooterMetrics(prev => ({
          ...prev,
          loaded: true,
          temp: m.temp || 0,
          ram: prev.ramTotal ? (m.ram / 100) * prev.ramTotal : 0,
          netUp: m.netUp || 0,
          netDown: m.netDown || 0
        }));
      } catch (e) {}
    })();
  }, []);



  useEffect(() => {
    const payload = {
      footerMetrics,
      activeSection,
      ts: Date.now(),
    };
    window.dispatchEvent(new CustomEvent('tp-live-metrics', { detail: payload }));
    (window as any).__tpLiveMetrics = payload;
  }, [footerMetrics, activeSection]);

  const renderSection = useCallback((id: SectionId, node: React.ReactNode) => {
    if (!mountedSections.has(id)) return null;
    return (
      <div style={{ display: activeSection === id ? 'block' : 'none' }}>
        <Suspense fallback={<PageSkeleton />}>
          <PageWrapper>{node}</PageWrapper>
        </Suspense>
      </div>
    );
  }, [activeSection, mountedSections]);

  return (
    <CoreProvider>
    <TaskManagerProvider>
      <div className="h-screen w-screen bg-white text-slate-800 font-sans flex flex-col overflow-hidden select-none">
      <TitleBar />
      {/* Outer Windows Exe Application Container Frame */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Inner Content Area: Sidebar + Active Window Content */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* Left Navigation Sidebar */}
          <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} isUnlocked={isUnlocked} />

          {/* Right Main Panel Content */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#fafafa] relative">
            {renderSection('dashboard', <Dashboard onNavigate={setActiveSection} />)}
            {renderSection('activation', <LicenseManager />)}
            {renderSection('hardware', <HardwareDetails />)}
            {renderSection('cleaner', <JunkCleaner />)}
            {renderSection('network', <NetworkConfig />)}
            {renderSection('bitlocker', <BitLockerManager />)}
            {renderSection('standardizer', <OfficeStandardizer />)}
            {renderSection('windows-settings', <WindowsSettings />)}
            {renderSection('backup', <BackupManager />)}
            {renderSection('printer', <PrinterUtils />)}
            {renderSection('laptop-tester', <LaptopTester />)}
            {renderSection('touch-tester', <TouchScreenTester />)}
            {renderSection('advanced-activation', <AdvancedActivation />)}
            {renderSection('ktv-report', <JobReportViewer />)}
          </main>
        </div>

        {/* App Status Footer */}
        <div className="bg-[#f1f5f9] px-6 py-2.5 border-t border-slate-200 text-[10px] font-mono text-slate-600 flex justify-between items-center shrink-0">
          <div className="flex gap-6">
            <span>TEMP: <span className={`font-bold ${(appConfig.cpuTempAlert && footerMetrics.temp && footerMetrics.temp >= appConfig.cpuTempThreshold) ? 'text-red-600 animate-pulse text-[11px]' : 'text-orange-600'}`}>{footerMetrics.loaded ? `${footerMetrics.temp}°C` : '...'}</span></span>
            <span>RAM: <span className="text-blue-600 font-bold">{footerMetrics.loaded && footerMetrics.ram != null && footerMetrics.ramTotal != null ? `${footerMetrics.ram.toFixed(1)}/${footerMetrics.ramTotal.toFixed(1)} GB` : '...'}</span></span>
            <span>NET: <span className="text-emerald-600 font-bold">{footerMetrics.loaded ? `↑ ${footerMetrics.netUp}Kb/s ↓ ${((footerMetrics.netDown || 0) / 1024).toFixed(1)}Mb/s` : '...'}</span></span>
          </div>
          <div className="flex items-center gap-4 relative">
            
            {/* Eco Mode Hint Popover */}
            {showEcoHint && (
              <div className="absolute bottom-10 right-20 w-64 bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-2xl animate-fade-in-up z-50">
                <div className="text-white text-[11px] font-sans leading-relaxed">
                  <span className="font-bold text-emerald-400 block mb-1">Mẹo tối ưu hiệu năng:</span>
                  {isAutoDetected 
                    ? <span>Phát hiện máy cấu hình thấp (RAM &lt;= 4GB hoặc CPU yếu), Tool đã <span className="font-bold text-emerald-300">tự động bật Eco Mode</span> để giảm lag. Nếu bạn muốn trải nghiệm giao diện đồ hoạ đẹp, hãy tắt nút Eco ở bên dưới!</span>
                    : <span>Nếu máy tính quá yếu (như Surface Go, Celeron), hãy <span className="font-bold text-emerald-300 cursor-pointer" onClick={() => setEcoMode(true)}>Bật tính năng Eco Mode</span> để tắt các hiệu ứng đồ họa, giúp phần mềm chạy siêu nhẹ nhé!</span>
                  }
                </div>
                <div className="mt-2 flex justify-end">
                  <button 
                    onClick={() => {
                      setShowEcoHint(false);
                      localStorage.setItem('ecoHintShown', 'true');
                    }}
                    className="text-[10px] font-bold uppercase text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded transition-colors"
                  >
                    Đã hiểu
                  </button>
                </div>
                {/* Arrow pointing down */}
                <div className="absolute -bottom-2 right-12 w-4 h-4 bg-slate-800 border-b border-r border-slate-700 transform rotate-45"></div>
              </div>
            )}

            <button 
              onClick={() => {
                setEcoMode(!ecoMode);
                setShowEcoHint(false);
                localStorage.setItem('ecoHintShown', 'true');
              }}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-colors relative z-10 ${ecoMode ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}
              title="Chế độ tiết kiệm (Giảm lag cho máy yếu)"
            >
              <span className="font-sans font-bold uppercase tracking-wider">{ecoMode ? '🌿 Eco: BẬT' : '🌿 Eco: TẮT'}</span>
            </button>
            <button 
              onClick={async () => {
                const icon = document.getElementById('update-spinner');
                if (icon) icon.classList.add('animate-spin');
                try {
                  const res = await (window as any).electronAPI.checkForUpdates();
                  if (res && res.hasUpdate === false) {
                    await (window as any).electronAPI.showInfoDialog({
                      title: 'Thông Tin Cập Nhật',
                      message: `Bạn đang ở phiên bản mới nhất (v${packageJson.version}). Không có bản cập nhật nào mới hơn trên GitHub.`
                    });
                  }
                } catch (e) {
                  console.error('Update check manual error:', e);
                } finally {
                  if (icon) icon.classList.remove('animate-spin');
                }
              }}
              className="text-blue-600 font-bold z-10 hover:text-blue-500 transition-colors flex items-center gap-1.5 cursor-pointer bg-blue-100/50 hover:bg-blue-100 px-2 py-0.5 rounded"
              title="Nhấp để kiểm tra bản cập nhật mới nhất"
            >
              <RefreshCw id="update-spinner" className="w-3 h-3" />
              v{packageJson.version} - Active
            </button>
        </div>
      </div>
    </div>
    <AutoUpdater />
    <GlobalTaskBar onNavigateTab={(tab) => setActiveSection(tab)} />
    </div>
    </TaskManagerProvider>
    </CoreProvider>
  );
}
