import React from 'react';
import { ShieldCheck, Cpu, Trash2, Wifi, AlignLeft, Zap, CheckCircle, ArrowRight, Server, Flame, Coffee, User, Phone, Facebook, Laptop, Settings, Printer, Archive, Lock, Pointer } from 'lucide-react';

interface DashboardProps {
  onNavigate: (section: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [defenderEnabled, setDefenderEnabled] = React.useState<boolean | null>(null);
  const [togglingDefender, setTogglingDefender] = React.useState<boolean>(false);

  React.useEffect(() => {
    const isElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined;
    if (isElectron && (window as any).electronAPI.getDefenderStatus) {
      (window as any).electronAPI.getDefenderStatus().then((res: any) => {
        if (res && typeof res.enabled === 'boolean') {
          setDefenderEnabled(res.enabled);
        }
      }).catch(() => {
        setDefenderEnabled(true);
      });
    } else {
      setDefenderEnabled(true);
    }
  }, []);

  const handleToggleDefender = async () => {
    const isElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined;
    const targetState = !defenderEnabled;
    
    if (defenderEnabled === true) {
      const confirm = window.confirm("Bạn có chắc chắn muốn TẮT Windows Defender?");
      if (!confirm) return;
    }

    setTogglingDefender(true);
    if (isElectron && (window as any).electronAPI.toggleDefenderStatus) {
      try {
        const res = await (window as any).electronAPI.toggleDefenderStatus(targetState);
        if (res && res.success) {
          // Re-fetch live status
          const check = await (window as any).electronAPI.getDefenderStatus();
          if (check && typeof check.enabled === 'boolean') {
            setDefenderEnabled(check.enabled);
          } else {
            setDefenderEnabled(targetState);
          }
        } else {
          alert("Không thể thay đổi trạng thái Windows Defender: " + (res?.error || "Lỗi không xác định"));
        }
      } catch (err: any) {
        alert("Lỗi khi điều khiển Windows Defender: " + err.message);
      } finally {
        setTogglingDefender(false);
      }
    } else {
      setDefenderEnabled(targetState);
      setTogglingDefender(false);
    }
  };

  return (
    <div className="space-y-6" id="dashboard-container">
      {/* Banner */}
      <div className="relative p-6 md:p-8 bg-gradient-to-br from-white to-slate-50 rounded-lg border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none animate-pulse"></div>

        <div className="relative z-10 max-w-2xl space-y-3">
          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded border border-blue-200 uppercase tracking-widest inline-block">
            Trình quản lý &amp; Chẩn đoán cao cấp
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight">
            Tối ưu hóa &amp; Làm sạch toàn diện máy tính của bạn
          </h2>
          <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
            Hỗ trợ chẩn đoán bản quyền sâu, tối ưu cấu hình RAM, dọn rác tệp tin tạm thời, chuẩn hóa văn bản theo quy định nhà nước và điều khiển sơ đồ điện năng tối đa FPS cho game thủ.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('cleaner')}
              className="py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow"
            >
              Dọn dẹp rác ngay
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => onNavigate('activation')}
              className="py-2 px-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded text-xs font-semibold transition cursor-pointer shadow-sm"
            >
              Kiểm tra bản quyền
            </button>
            <button
              onClick={handleToggleDefender}
              disabled={togglingDefender}
              className={`py-2 px-4 rounded text-xs font-semibold transition cursor-pointer shadow-sm flex items-center gap-1.5 border ${
                defenderEnabled === false
                  ? 'bg-rose-50 hover:bg-rose-100 border-rose-300 text-rose-700'
                  : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-700'
              }`}
              title="Bật/Tắt nhanh Windows Defender Real-time Protection"
            >
              {togglingDefender ? (
                <>
                  <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Đang xử lý...
                </>
              ) : defenderEnabled === false ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  🛡️ Bật Windows Defender
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  🛡️ Tắt Windows Defender
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Grid of quick cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Activation */}
        <div
          onClick={() => onNavigate('activation')}
          className="bg-white hover:bg-gradient-to-br hover:from-slate-50 hover:to-slate-100/80 p-5 rounded-xl border border-slate-200/80 hover:border-blue-400/40 hover:shadow-md shadow-sm transition-all duration-200 cursor-pointer group space-y-4 hover:-translate-y-0.5"
        >
          <div className="flex justify-between items-start">
            <div className="p-2 bg-amber-50 text-amber-600 rounded border border-amber-200 group-hover:scale-105 transition-transform shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Kiểm tra lậu</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Quét Windows / Office active</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">Phát hiện bản quyền KMS lậu, hỗ trợ xoá key chuyên sâu dứt điểm.</p>
          </div>
          <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1 group-hover:text-blue-600 transition-colors">
            Chi tiết quét bản quyền <ArrowRight className="h-3 w-3" />
          </div>
        </div>

        {/* Card 2: Hardware Info */}
        <div
          onClick={() => onNavigate('hardware')}
          className="bg-white hover:bg-gradient-to-br hover:from-slate-50 hover:to-slate-100/80 p-5 rounded-xl border border-slate-200/80 hover:border-blue-400/40 hover:shadow-md shadow-sm transition-all duration-200 cursor-pointer group space-y-4 hover:-translate-y-0.5"
        >
          <div className="flex justify-between items-start">
            <div className="p-2 bg-blue-50 text-blue-600 rounded border border-blue-200 group-hover:scale-105 transition-transform shadow-sm">
              <Cpu className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded border border-blue-200">Chi tiết 100%</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Cấu hình phần cứng chi tiết</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">Xem chi tiết bus RAM, khe cắm trống, ổ cứng SSD/HDD và CPU Turbo.</p>
          </div>
          <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1 group-hover:text-blue-600 transition-colors">
            Chẩn đoán phần cứng <ArrowRight className="h-3 w-3" />
          </div>
        </div>

        {/* Card 3: Cleaner */}
        <div
          onClick={() => onNavigate('cleaner')}
          className="bg-white hover:bg-gradient-to-br hover:from-slate-50 hover:to-slate-100/80 p-5 rounded-xl border border-slate-200/80 hover:border-blue-400/40 hover:shadow-md shadow-sm transition-all duration-200 cursor-pointer group space-y-4 hover:-translate-y-0.5"
        >
          <div className="flex justify-between items-start">
            <div className="p-2 bg-rose-50 text-rose-600 rounded border border-rose-200 group-hover:scale-105 transition-transform shadow-sm">
              <Trash2 className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider bg-rose-50 px-2 py-0.5 rounded border border-rose-200">Dọn dẹp nhanh</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Dọn dẹp rác chuyên sâu</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">Xóa tệp tạm thời Temp, Prefetch, Log lỗi giải phóng hàng GB dung lượng.</p>
          </div>
          <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1 group-hover:text-blue-600 transition-colors">
            Quét dọn rác <ArrowRight className="h-3 w-3" />
          </div>
        </div>

        {/* Card 4: Laptop Tester */}
        <div
          onClick={() => onNavigate('laptop-tester')}
          className="bg-white hover:bg-gradient-to-br hover:from-slate-50 hover:to-slate-100/80 p-5 rounded-xl border border-slate-200/80 hover:border-blue-400/40 hover:shadow-md shadow-sm transition-all duration-200 cursor-pointer group space-y-4 hover:-translate-y-0.5"
        >
          <div className="flex justify-between items-start">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded border border-indigo-200 group-hover:scale-105 transition-transform shadow-sm">
              <Laptop className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">All in One</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Kiểm Tra Laptop Toàn Diện</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">Test 8 trong 1: Màn hình, Bàn phím, Webcam, Mic, Cảm ứng, Pin, S.M.A.R.T, VGA.</p>
          </div>
          <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1 group-hover:text-blue-600 transition-colors">
            Công cụ chuẩn đoán <ArrowRight className="h-3 w-3" />
          </div>
        </div>

        {/* Card 5: Windows Settings */}
        <div
          onClick={() => onNavigate('windows-settings')}
          className="bg-white hover:bg-gradient-to-br hover:from-slate-50 hover:to-slate-100/80 p-5 rounded-xl border border-slate-200/80 hover:border-blue-400/40 hover:shadow-md shadow-sm transition-all duration-200 cursor-pointer group space-y-4 hover:-translate-y-0.5"
        >
          <div className="flex justify-between items-start">
            <div className="p-2 bg-fuchsia-50 text-fuchsia-600 rounded border border-fuchsia-200 group-hover:scale-105 transition-transform shadow-sm">
              <Settings className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold text-fuchsia-700 uppercase tracking-wider bg-fuchsia-50 px-2 py-0.5 rounded border border-fuchsia-200">Tối ưu Win</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Thiết lập Windows</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">Tinh chỉnh hệ thống, bật/tắt Ultimate Performance, chặn Windows Update, tối ưu SSD.</p>
          </div>
          <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1 group-hover:text-blue-600 transition-colors">
            Cấu hình hệ thống <ArrowRight className="h-3 w-3" />
          </div>
        </div>

        {/* Card 6: Network & DNS */}
        <div
          onClick={() => onNavigate('network')}
          className="bg-white hover:bg-gradient-to-br hover:from-slate-50 hover:to-slate-100/80 p-5 rounded-xl border border-slate-200/80 hover:border-blue-400/40 hover:shadow-md shadow-sm transition-all duration-200 cursor-pointer group space-y-4 hover:-translate-y-0.5"
        >
          <div className="flex justify-between items-start">
            <div className="p-2 bg-purple-50 text-purple-600 rounded border border-purple-200 group-hover:scale-105 transition-transform shadow-sm">
              <Wifi className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider bg-purple-50 px-2 py-0.5 rounded border border-purple-200">DNS Changer</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Kiểm tra Mạng &amp; Đổi DNS</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">Đổi nhanh DNS quốc tế/trong nước thông dụng khắc phục ping lag, chặn lọc.</p>
          </div>
          <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1 group-hover:text-blue-600 transition-colors">
            Cấu hình mạng <ArrowRight className="h-3 w-3" />
          </div>
        </div>

        {/* Card 7: Printer Utils */}
        <div
          onClick={() => onNavigate('printer')}
          className="bg-white hover:bg-gradient-to-br hover:from-slate-50 hover:to-slate-100/80 p-5 rounded-xl border border-slate-200/80 hover:border-blue-400/40 hover:shadow-md shadow-sm transition-all duration-200 cursor-pointer group space-y-4 hover:-translate-y-0.5"
        >
          <div className="flex justify-between items-start">
            <div className="p-2 bg-cyan-50 text-cyan-600 rounded border border-cyan-200 group-hover:scale-105 transition-transform shadow-sm">
              <Printer className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-wider bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">Spooler Fix</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Tiện Ích Máy In</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">Khắc phục kẹt lệnh in, chia sẻ máy in qua mạng LAN, khởi động lại Spooler.</p>
          </div>
          <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1 group-hover:text-blue-600 transition-colors">
            Khắc phục lỗi in <ArrowRight className="h-3 w-3" />
          </div>
        </div>

        {/* Card 8: Standardizer */}
        <div
          onClick={() => onNavigate('standardizer')}
          className="bg-white hover:bg-gradient-to-br hover:from-slate-50 hover:to-slate-100/80 p-5 rounded-xl border border-slate-200/80 hover:border-blue-400/40 hover:shadow-md shadow-sm transition-all duration-200 cursor-pointer group space-y-4 hover:-translate-y-0.5"
        >
          <div className="flex justify-between items-start">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded border border-emerald-200 group-hover:scale-105 transition-transform shadow-sm">
              <AlignLeft className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Nghị định 30</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Tiện Ích Office</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">Căn lề, font chữ chuẩn Word của Nhà Nước phục vụ văn phòng công sở.</p>
          </div>
          <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1 group-hover:text-blue-600 transition-colors">
            Bố cục văn bản <ArrowRight className="h-3 w-3" />
          </div>
        </div>

        {/* Card 9: Backup */}
        <div
          onClick={() => onNavigate('backup')}
          className="bg-white hover:bg-gradient-to-br hover:from-slate-50 hover:to-slate-100/80 p-5 rounded-xl border border-slate-200/80 hover:border-blue-400/40 hover:shadow-md shadow-sm transition-all duration-200 cursor-pointer group space-y-4 hover:-translate-y-0.5"
        >
          <div className="flex justify-between items-start">
            <div className="p-2 bg-teal-50 text-teal-600 rounded border border-teal-200 group-hover:scale-105 transition-transform shadow-sm">
              <Archive className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider bg-teal-50 px-2 py-0.5 rounded border border-teal-200">Safe Backup</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Sao Lưu Chuyên Sâu</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">Sao lưu phục hồi nhanh toàn bộ Mật khẩu WiFi và Driver phần cứng trước khi cài Win.</p>
          </div>
          <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1 group-hover:text-blue-600 transition-colors">
            Quản lý Backup <ArrowRight className="h-3 w-3" />
          </div>
        </div>

        {/* Card 10: Bitlocker */}
        <div
          onClick={() => onNavigate('bitlocker')}
          className="bg-white hover:bg-gradient-to-br hover:from-slate-50 hover:to-slate-100/80 p-5 rounded-xl border border-slate-200/80 hover:border-blue-400/40 hover:shadow-md shadow-sm transition-all duration-200 cursor-pointer group space-y-4 hover:-translate-y-0.5"
        >
          <div className="flex justify-between items-start">
            <div className="p-2 bg-slate-100 text-slate-600 rounded border border-slate-300 group-hover:scale-105 transition-transform shadow-sm">
              <Lock className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded border border-slate-300">Unlock Drive</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Tắt BitLocker</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">Quét tự động và giải mã nhanh toàn bộ các phân vùng ổ cứng đang bị khóa BitLocker.</p>
          </div>
          <div className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1 group-hover:text-blue-600 transition-colors">
            Quản lý mã hóa <ArrowRight className="h-3 w-3" />
          </div>
        </div>

      </div>

      {/* Author and Donation Banner */}
      <div className="bg-slate-100/60 p-4 rounded-lg border border-slate-200/80 shadow-sm flex flex-col gap-3">
        <div className="flex gap-3 items-start">
          <div className="p-2 bg-orange-100 text-orange-600 rounded-full shrink-0">
            <Coffee className="h-5 w-5" />
          </div>
          <div className="text-xs leading-relaxed text-slate-700">
            <span className="font-bold text-slate-800 block mb-0.5 text-sm">Nếu thấy hay mời tác giả ly cafe ☕</span>
            Donate qua số tài khoản Techcombank: <span className="font-mono font-bold text-blue-700 text-sm">386677889999</span>. Xin cảm ơn!
          </div>
        </div>

        <div className="h-px bg-slate-200 w-full my-1"></div>

        <div className="flex flex-col gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-slate-400" />
            <span className="font-semibold text-slate-700">Người phát triển tool:</span>
            <span className="font-bold text-blue-700">ThắngĐG</span>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-1.5">
              <Phone className="h-4 w-4 text-emerald-600" />
              <span className="font-medium">SĐT: <span className="font-bold text-slate-800">0787 567 870</span></span>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 bg-blue-500 text-white rounded text-[9px] flex items-center justify-center font-bold">Z</div>
              <span className="font-medium">Zalo: <span className="font-bold text-slate-800">0787567870</span></span>
            </div>

            <button
              onClick={() => {
                const isElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined;
                if (isElectron) {
                  (window as any).electronAPI.runPowerShell('Start-Process "https://www.facebook.com/ThangDG/"');
                } else {
                  window.open('https://www.facebook.com/ThangDG/', '_blank');
                }
              }}
              className="flex items-center gap-1.5 hover:bg-blue-50 px-2 py-1 -ml-2 rounded transition-colors cursor-pointer group"
            >
              <Facebook className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Facebook: <span className="font-bold text-blue-700 group-hover:underline">ThắngĐG</span></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
