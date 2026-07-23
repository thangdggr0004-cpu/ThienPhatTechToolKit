import React, { useState, useEffect } from 'react';
import {
  Cpu, ShieldAlert, Trash2, Wifi, AlignLeft, Monitor,
  CheckCircle, Archive, Printer, Settings, Lock, Laptop, Activity, KeyRound
} from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  isUnlocked?: boolean;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string; // pastel CSS class
}

const activationItems: MenuItem[] = [
  { id: 'activation', name: 'Quét Bản Quyền', description: 'Kiểm tra Windows & Office', icon: ShieldAlert, iconClass: 'icon-pastel-violet' },
];

const systemItems: MenuItem[] = [
  { id: 'dashboard',        name: 'Bảng Điều Khiển', description: 'Trạng thái tổng quan',       icon: Monitor,   iconClass: 'icon-pastel-blue'    },
  { id: 'hardware',         name: 'Cấu Hình Chi Tiết', description: 'CPU, RAM, Ổ cứng',          icon: Cpu,       iconClass: 'icon-pastel-sky'     },
  { id: 'cleaner',          name: 'Dọn Dẹp Rác',      description: 'Giải phóng bộ nhớ đệm',     icon: Trash2,    iconClass: 'icon-pastel-rose'    },
  { id: 'windows-settings', name: 'Thiết Lập Windows', description: 'Tối ưu & Tùy biến',        icon: Settings,  iconClass: 'icon-pastel-slate'   },
];

const baseUtilityItems: MenuItem[] = [
  { id: 'network',       name: 'Mạng & DNS',        description: 'Đổi DNS, Chẩn đoán',      icon: Wifi,      iconClass: 'icon-pastel-emerald' },
  { id: 'printer',       name: 'Tiện Ích Máy In',   description: 'Sửa lỗi in, Xóa hàng đợi', icon: Printer,  iconClass: 'icon-pastel-amber'   },
  { id: 'standardizer',  name: 'Tiện Ích Office',   description: 'Chuẩn hóa căn lề, Fix lỗi', icon: AlignLeft, iconClass: 'icon-pastel-blue'   },
  { id: 'backup',        name: 'Sao Lưu',           description: 'WiFi & Driver backup',      icon: Archive,   iconClass: 'icon-pastel-sky'     },
  { id: 'bitlocker',     name: 'Tắt BitLocker',     description: 'Giải mã ổ cứng tự động',    icon: Lock,      iconClass: 'icon-pastel-rose'    },
  { id: 'laptop-tester', name: 'Kiểm Tra Laptop',   description: 'Test Màn, Phím, Mic, Cam', icon: Laptop,    iconClass: 'icon-pastel-violet'  },
];

export default function Sidebar({ activeSection, setActiveSection, isUnlocked }: SidebarProps) {
  const utilityItems = isUnlocked 
    ? [...baseUtilityItems, { id: 'advanced-activation', name: 'Tiện Ích Nâng Cao', description: 'MAS AIO Activator 🔓', icon: KeyRound, iconClass: 'icon-pastel-amber' }]
    : baseUtilityItems;
  const [sysInfo, setSysInfo] = useState<{ uptime: string; usedRam: string; totalRam: string } | null>(null);

  useEffect(() => {
    const isElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined;
    if (!isElectron) return;

    const fetchInfo = () => {
      (window as any).electronAPI.getHardwareInfo()
        .then((info: any) => {
          if (info) {
            setSysInfo({
              uptime: info.uptime || '--',
              usedRam: info.usedRamGB != null ? info.usedRamGB.toFixed(1) : '--',
              totalRam: info.totalRamGB != null ? info.totalRamGB.toFixed(1) : '--',
            });
          }
        })
        .catch(() => {});
    };

    fetchInfo();
    const timer = setInterval(fetchInfo, 30000);
    return () => clearInterval(timer);
  }, []);

  const renderItem = (item: MenuItem) => {
    const isActive = activeSection === item.id;
    const Icon = item.icon;
    return (
      <button
        key={item.id}
        onClick={() => setActiveSection(item.id)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 cursor-pointer relative group ${
          isActive
            ? 'bg-blue-50 text-blue-700'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
        }`}
      >
        {/* Active left accent bar */}
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-blue-600 rounded-r-full" />
        )}

        {/* Icon with pastel background */}
        <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 ${
          isActive ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30' : item.iconClass
        }`}>
          <Icon className="h-3.5 w-3.5" />
        </span>

        <div className="flex-1 min-w-0">
          <span className={`text-xs font-semibold block truncate ${isActive ? 'text-blue-700' : ''}`}>
            {item.name}
          </span>
          <span className={`text-[9px] block truncate ${isActive ? 'text-blue-500' : 'text-slate-400'}`}>
            {item.description}
          </span>
        </div>
      </button>
    );
  };

  return (
    <aside className="w-full lg:w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 h-auto lg:h-full" id="sidebar-container">
      {/* Brand Header */}
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-blue-500/25">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-slate-900 tracking-tight leading-none">
              THIÊN PHÁT <span className="text-blue-600">TECH</span>
            </h1>
            <span className="text-[9px] text-blue-500 font-bold tracking-widest uppercase block mt-0.5">
              TOOLKIT PRO
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
        {/* Kích Hoạt */}
        <div>
          <div className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1.5 px-2">
            Kích Hoạt
          </div>
          <div className="space-y-0.5">
            {activationItems.map(renderItem)}
          </div>
        </div>

        {/* Hệ Thống */}
        <div>
          <div className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1.5 px-2">
            Hệ Thống
          </div>
          <div className="space-y-0.5">
            {systemItems.map(renderItem)}
          </div>
        </div>

        {/* Tiện Ích */}
        <div>
          <div className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1.5 px-2">
            Tiện Ích
          </div>
          <div className="space-y-0.5">
            {utilityItems.map(renderItem)}
          </div>
        </div>
      </nav>

      {/* Footer System Status */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full shrink-0 ${sysInfo ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
          <span className="text-[10px] font-semibold text-slate-700">
            {sysInfo ? 'Hệ thống ổn định' : 'Đang tải...'}
          </span>
        </div>
        {sysInfo && (
          <div className="mt-1.5 grid grid-cols-2 gap-1 text-[9px] text-slate-500">
            <span>Uptime: <span className="text-slate-700 font-mono font-semibold">{sysInfo.uptime}</span></span>
            <span>RAM: <span className="text-slate-700 font-mono font-semibold">{sysInfo.usedRam}/{sysInfo.totalRam}GB</span></span>
          </div>
        )}
      </div>
    </aside>
  );
}
