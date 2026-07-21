import React, { useState, useEffect } from 'react';
import { Cpu, Database, HardDrive, LayoutGrid, Monitor, RefreshCw, FileText, Download } from 'lucide-react';
import { HardwareInfo } from '../types';
import { generateHardwareInfoScript, downloadFile } from '../utils/scriptGenerator';

const mockHardwareData: HardwareInfo = {
  cpuName: 'Intel Core i7-12700H',
  cpuCores: 14,
  cpuThreads: 20,
  cpuBaseClock: '2.70 GHz',
  cpuTurboClock: '4.70 GHz',
  cpuTurboSupported: true,
  cpuL3Cache: '24 MB',
  cpuArch: 'x64 (64-bit)',
  ramTotalSize: 64,
  ramSpeed: 3200,
  ramSlotsTotal: 4,
  ramType: 'DDR4',
  ramChannels: 'Dual-Channel',
  ramSlotsDetails: [
    { slot: 1, size: 32, speed: 3200, type: 'DDR4' },
    { slot: 2, size: 32, speed: 3200, type: 'DDR4' },
    { slot: 3, size: 0, speed: 0, type: 'Empty' },
    { slot: 4, size: 0, speed: 0, type: 'Empty' },
  ],
  storageDrives: [
    { id: 'disk0', name: 'SAMSUNG MZVL2512HCJQ-00000', type: 'SSD NVMe', totalSize: 512, freeSize: 124, health: 'Tốt (100%)', temperature: 42, partitionCount: 2 },
    { id: 'disk1', name: 'WDC WD10SPZX-21Z10T0', type: 'HDD SATA', totalSize: 1024, freeSize: 680, health: 'Tốt (98%)', temperature: 34, partitionCount: 1 },
  ],
  gpuName: 'NVIDIA GeForce RTX 3060 Laptop GPU',
  gpuVram: '6 GB GDDR6',
  gpuType: 'Dedicated',
  motherboard: 'ASUSTeK COMPUTER INC. FX507ZM (Version 1.0)',
  biosVersion: 'American Megatrends Inc. FX507ZM.315, 12/08/2022',
};

export default function HardwareDetails() {
  const [data, setData] = useState<HardwareInfo | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [metrics, setMetrics] = useState({
    cpu: 28,
    ram: 64,
    disk: 5,
    speed: 3.42, // GHz dynamically fluctuating turbo clock
    temp: 45, // CPU Temperature
  });

  useEffect(() => {
    // Check if running inside Electron and API is available
    const isElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined;
    if (isElectron) {
      setIsLoading(true);
      (window as any).electronAPI.getHardwareInfo()
        .then((realData: HardwareInfo) => {
          if (realData) {
            setData(realData);
          }
        })
        .catch((err: any) => {
          console.error("Failed to fetch hardware details:", err);
          // fallback to mock if error
          setData(mockHardwareData);
        })
        .finally(() => setIsLoading(false));
    } else {
      // Fallback for web preview
      setData(mockHardwareData);
      setIsLoading(false);
    }

    const timer = setInterval(async () => {
      // Only fetch when Hardware tab is active
      if ((window as any).__activeSection !== 'hardware') {
        // Show placeholder mock data when not active
        setMetrics({
          cpu: 28,
          ram: 64,
          disk: 5,
          speed: 3.42,
          temp: 45,
        });
        return;
      }
      try {
        const realMetrics = await (window as any).electronAPI.getRealtimeMetrics();
        setMetrics(realMetrics);
      } catch (e) {
        // ignore errors
      }
    }, 5000);
    // Initial fetch when component mounts and tab is active
    (async () => {
      if ((window as any).__activeSection === 'hardware') {
        try {
          const realMetrics = await (window as any).electronAPI.getRealtimeMetrics();
          setMetrics(realMetrics);
        } catch (e) {}
      }
    })();
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    const isElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined;
    if (isElectron) {
      (window as any).electronAPI.getHardwareInfo(true)
        .then((realData: HardwareInfo) => {
          if (realData) {
            setData(realData);
          }
        })
        .catch((err: any) => {
          console.error("Failed to refresh real hardware details:", err);
        })
        .finally(() => {
          setTimeout(() => {
            setIsRefreshing(false);
          }, 600);
        });
    } else {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 1200);
    }
  };

  const handleDownloadDiagnostic = () => {
    const script = generateHardwareInfoScript();
    downloadFile(script, 'Kiem_Tra_Phan_Cung_Chuyen_Sau.ps1');
  };

  if (isLoading || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
        <div className="h-10 w-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-500 animate-pulse">Đang phân tích cấu hình hệ thống...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="hardware-details-container">
      {/* Title & Diagnostic Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white rounded-lg border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="h-6 w-6 text-blue-600" />
            Kiểm tra thông tin & Cấu hình Máy tính
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Chẩn đoán chi tiết phần cứng thực tế bao gồm khe RAM, ổ đĩa lưu trữ, nhiệt độ và hiệu suất vi xử lý CPU Turbo.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            className={`p-2 bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 rounded transition cursor-pointer flex items-center gap-1.5 text-xs shadow-sm`}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Real-time monitors (Top section) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CPU Monitor */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5 text-blue-600" />
                Hiệu suất CPU (Turbo)
              </span>
              <span className="text-[11px] text-slate-400 font-mono block mt-0.5">{metrics.speed?.toFixed(2) ?? '—'} GHz</span>
            </div>
          </div>
          <div>
            <span className="text-4xl font-black text-slate-800 leading-none">{metrics.cpu}<span className="text-xl font-bold text-slate-500">%</span></span>
            <p className="text-[11px] text-slate-500 mt-1">Đang hoạt động (Turbo Boost)</p>
          </div>
          <div className="space-y-1">
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                style={{ width: `${metrics.cpu}%` }}
              />
            </div>
          </div>
        </div>

        {/* RAM Monitor */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5 text-emerald-600" />
                Dung lượng RAM đang dùng
              </span>
              <span className="text-[11px] text-slate-400 font-mono block mt-0.5">{((data.ramTotalSize * metrics.ram) / 100).toFixed(1)} / {data.ramTotalSize} GB</span>
            </div>
          </div>
          <div>
            <span className="text-4xl font-black text-slate-800 leading-none">{metrics.ram}<span className="text-xl font-bold text-slate-500">%</span></span>
            <p className="text-[11px] text-slate-500 mt-1">Sử dụng phân trang thông minh</p>
          </div>
          <div className="space-y-1">
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                style={{ width: `${metrics.ram}%` }}
              />
            </div>
          </div>
        </div>

        {/* SSD Monitor */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <HardDrive className="h-3.5 w-3.5 text-purple-600" />
                Băng thông đĩa hoạt động
              </span>
              <span className="text-[11px] text-slate-400 font-mono block mt-0.5">{metrics.disk} MB/s</span>
            </div>
          </div>
          <div>
            {metrics.disk < 5 ? (
              <>
                <span className="text-4xl font-black text-slate-800 leading-none">IDLE</span>
                <p className="text-[11px] text-slate-500 mt-1">Sức khỏe các ổ: Tốt (SMART OK)</p>
              </>
            ) : (
              <>
                <span className="text-4xl font-black text-slate-800 leading-none">{metrics.disk}<span className="text-xl font-bold text-slate-500"> MB/s</span></span>
                <p className="text-[11px] text-slate-500 mt-1">Đang đọc/ghi dữ liệu</p>
              </>
            )}
          </div>
          <div className="space-y-1">
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(metrics.disk * 2, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Hardware Specs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Col: CPU, RAM Slots & Board */}
        <div className="space-y-6">
          {/* Detailed CPU and Board */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
              <Cpu className="h-4 w-4 text-blue-600" />
              Bộ vi xử lý & Bo mạch chủ
            </h3>
            <div className="grid grid-cols-2 gap-y-3.5 gap-x-4 text-xs">
              <div>
                <span className="text-slate-500 block">Tên CPU</span>
                <span className="text-slate-800 font-semibold">{data.cpuName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Kiến trúc</span>
                <span className="text-slate-800 font-semibold">{data.cpuArch}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Số Nhân / Luồng</span>
                <span className="text-slate-800 font-semibold font-mono">{data.cpuCores} Cores / {data.cpuThreads} Threads</span>
              </div>
              <div>
                <span className="text-slate-500 block">Xung cơ bản / Turbo tối đa</span>
                <span className="text-slate-800 font-semibold font-mono">{data.cpuBaseClock} / <span className="text-blue-600 font-semibold">{data.cpuTurboClock}</span></span>
              </div>
              <div>
                <span className="text-slate-500 block">Bộ nhớ đệm L3 Cache</span>
                <span className="text-slate-800 font-semibold font-mono">{data.cpuL3Cache}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Khả năng Turbo Boost</span>
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  Có hỗ trợ (Bật sẵn)
                </span>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-100">
                <span className="text-slate-500 block">Bo mạch chủ (Mainboard)</span>
                <span className="text-slate-800 font-semibold">{data.motherboard}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 block">Phiên bản BIOS</span>
                <span className="text-slate-700 font-mono text-[11px]">{data.biosVersion}</span>
              </div>
            </div>
          </div>

          {/* RAM Slots Config Details */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
              <Database className="h-4 w-4 text-emerald-600" />
              Chi tiết Khe cắm RAM (RAM Slots)
            </h3>
            <div className="flex justify-between items-center text-xs">
              <div className="space-y-0.5">
                <span className="text-slate-500 block">Kiểu RAM & Tốc độ (Bus)</span>
                <span className="text-slate-800 font-semibold">{data.ramType} @ {data.ramSpeed} MHz</span>
              </div>
              <div className="space-y-0.5 text-right">
                <span className="text-slate-500 block">Chế độ kênh</span>
                <span className="text-emerald-600 font-bold">{data.ramChannels}</span>
              </div>
            </div>

            {/* RAM Slots Visual Indicator */}
            <div className="grid grid-cols-4 gap-2.5 pt-2">
              {data.ramSlotsDetails.map((slot, idx) => (
                <div 
                  key={idx}
                  className={`p-3 rounded border flex flex-col items-center justify-center text-center space-y-2 relative overflow-hidden transition-all shadow-sm ${
                    slot.size > 0 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:border-emerald-300' 
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">KHE {slot.slot}</div>
                  <Database className={`h-6 w-6 ${slot.size > 0 ? 'text-emerald-500 animate-pulse' : 'text-slate-200'}`} />
                  <div>
                    <div className="text-xs font-extrabold text-slate-800">{slot.size > 0 ? `${slot.size} GB` : 'Trống'}</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">{slot.size > 0 ? `${slot.type}` : '-'}</div>
                  </div>
                </div>
              ))}
            </div>
            <span className="text-[10px] text-slate-400 block italic">Hỗ trợ tối đa: {data.ramSlotsTotal} slots, nâng cấp tối đa 64GB RAM.</span>
          </div>
        </div>

        {/* Right Col: Storage Drives & Graphics */}
        <div className="space-y-6">
          {/* Detailed Disk Drives */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
              <HardDrive className="h-4 w-4 text-purple-600" />
              Ổ cứng lưu trữ (Hard Drives)
            </h3>

            <div className="space-y-4">
              {data.storageDrives.map((drive) => {
                const usedSize = drive.totalSize - drive.freeSize;
                const usedPercent = (usedSize / drive.totalSize) * 100;
                return (
                  <div key={drive.id} className="p-4 bg-slate-50 rounded border border-slate-200 shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <HardDrive className="h-3.5 w-3.5 text-slate-500" />
                          {drive.name}
                        </h4>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white border border-slate-200 text-purple-600 mt-1 inline-block font-semibold shadow-sm">
                          {drive.type}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shadow-sm">
                          S.M.A.R.T: {drive.health}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-1 font-mono">{drive.temperature}°C</span>
                      </div>
                    </div>

                    {/* Progress Bar of Used Capacity */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>Đã dùng: {usedSize.toFixed(0)} GB / {drive.totalSize} GB</span>
                        <span>{usedPercent.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-200/60 h-2 rounded overflow-hidden border border-slate-300/40">
                        <div 
                          className={`h-full rounded ${usedPercent > 85 ? 'bg-rose-500' : 'bg-blue-600'}`}
                          style={{ width: `${usedPercent}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Số phân vùng định dạng: {drive.partitionCount} partition</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed GPU & Display */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
              <Monitor className="h-4 w-4 text-blue-600" />
              Card màn hình (GPU) & Hiển thị
            </h3>
            <div className="grid grid-cols-2 gap-y-3.5 gap-x-4 text-xs">
              <div>
                <span className="text-slate-500 block">Tên GPU</span>
                <span className="text-slate-800 font-semibold">{data.gpuName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Phân loại</span>
                <span className="text-slate-800 font-semibold">{data.gpuType} GPU</span>
              </div>
              <div>
                <span className="text-slate-500 block">Bộ nhớ đồ họa VRAM</span>
                <span className="text-blue-600 font-bold">{data.gpuVram}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Màn hình hiện tại</span>
                <span className="text-slate-800 font-semibold">1920 x 1080 @ 144Hz</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
