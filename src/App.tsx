import React, { useState, useEffect, lazy, Suspense } from 'react';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
// Lazy‑loaded components
const Dashboard = lazy(() => import('./components/Dashboard'));
const ActivationScanner = lazy(() => import('./components/ActivationScanner'));
const HardwareDetails = lazy(() => import('./components/HardwareDetails'));
const JunkCleaner = lazy(() => import('./components/JunkCleaner'));
const NetworkConfig = lazy(() => import('./components/NetworkConfig'));
const BitLockerManager = lazy(() => import('./components/BitLockerManager'));
const OfficeStandardizer = lazy(() => import('./components/OfficeStandardizer'));
const WindowsSettings = lazy(() => import('./components/WindowsSettings'));
const BackupManager = lazy(() => import('./components/BackupManager'));
const PrinterUtils = lazy(() => import('./components/PrinterUtils'));
const LaptopTester = lazy(() => import('./components/LaptopTester'));
const TouchScreenTester = lazy(() => import('./components/TouchScreenTester'));

import { Monitor, RefreshCw, Terminal, Cpu, MemoryStick, Activity } from 'lucide-react';
import AutoUpdater from './components/AutoUpdater';

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
  const [activeSection, setActiveSection] = useState<string>('dashboard');
  // Sync active section to a global variable for IPC components
  useEffect(() => {
    (window as any).__activeSection = activeSection;
  }, [activeSection]);
  
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
    return localStorage.getItem('ecoMode') === 'true';
  });

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
    }).catch(() => {});

    const timer = setInterval(async () => {
      if ((window as any).__ecoMode) return; // Skip polling in eco mode
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
      } catch (e) {
        // ignore
      }
    }, 15000);

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

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-screen w-screen bg-white text-slate-800 font-sans flex flex-col overflow-hidden select-none">
      <TitleBar />
      {/* Outer Windows Exe Application Container Frame */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Inner Content Area: Sidebar + Active Window Content */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* Left Navigation Sidebar */}
          <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />

          {/* Right Main Panel Content */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#fafafa] space-y-6" key={activeSection}>
            {activeSection === 'dashboard' && (
              <Suspense fallback={<PageSkeleton />}>
                <PageWrapper><Dashboard onNavigate={setActiveSection} /></PageWrapper>
              </Suspense>
            )}
            {activeSection === 'activation' && (
              <Suspense fallback={<PageSkeleton />}>
                <PageWrapper><ActivationScanner /></PageWrapper>
              </Suspense>
            )}
            {activeSection === 'hardware' && (
              <Suspense fallback={<PageSkeleton />}>
                <PageWrapper><HardwareDetails /></PageWrapper>
              </Suspense>
            )}
            {activeSection === 'cleaner' && (
              <Suspense fallback={<PageSkeleton />}>
                <PageWrapper><JunkCleaner /></PageWrapper>
              </Suspense>
            )}
            {activeSection === 'network' && (
              <Suspense fallback={<PageSkeleton />}>
                <PageWrapper><NetworkConfig /></PageWrapper>
              </Suspense>
            )}
            {activeSection === 'standardizer' && (
              <Suspense fallback={<PageSkeleton />}>
                <PageWrapper><OfficeStandardizer /></PageWrapper>
              </Suspense>
            )}
            {activeSection === 'windows-settings' && (
              <Suspense fallback={<PageSkeleton />}>
                <PageWrapper><WindowsSettings /></PageWrapper>
              </Suspense>
            )}
            {activeSection === 'backup' && (
              <Suspense fallback={<PageSkeleton />}>
                <PageWrapper><BackupManager /></PageWrapper>
              </Suspense>
            )}
            {activeSection === 'printer' && (
              <Suspense fallback={<PageSkeleton />}>
                <PageWrapper><PrinterUtils /></PageWrapper>
              </Suspense>
            )}
            {activeSection === 'bitlocker' && (
              <Suspense fallback={<PageSkeleton />}>
                <PageWrapper><BitLockerManager /></PageWrapper>
              </Suspense>
            )}
            {activeSection === 'laptop-tester' && (
              <Suspense fallback={<PageSkeleton />}>
                <PageWrapper><LaptopTester /></PageWrapper>
              </Suspense>
            )}
            {activeSection === 'touch' && (
              <Suspense fallback={<PageSkeleton />}>
                <TouchScreenTester onBack={() => setActiveSection('dashboard')} />
              </Suspense>
            )}
          </main>
        </div>

        {/* App Status Footer */}
        <div className="bg-[#f1f5f9] px-6 py-2.5 border-t border-slate-200 text-[10px] font-mono text-slate-600 flex justify-between items-center shrink-0">
          <div className="flex gap-6">
            <span>TEMP: <span className="text-orange-600 font-bold">{footerMetrics.loaded ? `${footerMetrics.temp}°C` : '...'}</span></span>
            <span>RAM: <span className="text-blue-600 font-bold">{footerMetrics.loaded && footerMetrics.ram != null && footerMetrics.ramTotal != null ? `${footerMetrics.ram.toFixed(1)}/${footerMetrics.ramTotal.toFixed(1)} GB` : '...'}</span></span>
            <span>NET: <span className="text-emerald-600 font-bold">{footerMetrics.loaded ? `↑ ${footerMetrics.netUp}Kb/s ↓ ${((footerMetrics.netDown || 0) / 1024).toFixed(1)}Mb/s` : '...'}</span></span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setEcoMode(!ecoMode)}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-colors ${ecoMode ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}
              title="Chế độ tiết kiệm (Giảm lag cho máy yếu)"
            >
              <span className="font-sans font-bold uppercase tracking-wider">{ecoMode ? '🌿 Eco: BẬT' : '🌿 Eco: TẮT'}</span>
            </button>
            <span className="text-blue-600 font-bold">v1.2.0 - Active</span>
          </div>
        </div>
      </div>
      <AutoUpdater />
    </div>
  );
}
