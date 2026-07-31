import React from 'react';
import { HardDrive, Cpu, MemoryStick, KeyRound, Shield, CheckCircle2, AlertTriangle } from 'lucide-react';

// Define a more specific type for the summary data
interface SystemSummaryData {
    cpuName?: string;
    ramTotalSize?: number;
    gpuName?: string;
    licenseStatus?: number; // 1 for licensed, others for not
    licenseChannel?: string;
    hasOA3Key?: boolean;
}

interface SystemSummaryProps {
  summary: SystemSummaryData | null;
  isScanning: boolean;
}

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode;}> = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="text-slate-400 mt-0.5">{icon}</div>
    <div className="flex-1">
      <div className="text-[11px] font-medium text-slate-500">{label}</div>
      <div className="text-xs font-semibold text-slate-800 break-words">{value}</div>
    </div>
  </div>
);

const SystemSummary: React.FC<SystemSummaryProps> = ({ summary, isScanning }) => {
  const renderContent = () => {
    if (isScanning) {
      return Array(4).fill(0).map((_, i) => (
        <div key={i} className="flex items-start gap-3 animate-pulse">
          <div className="bg-slate-200 rounded w-4 h-4 mt-0.5"></div>
          <div className="flex-1">
            <div className="bg-slate-200 rounded w-1/3 h-3 mb-1.5"></div>
            <div className="bg-slate-200 rounded w-2/3 h-4"></div>
          </div>
        </div>
      ));
    }

    if (!summary) {
      return <div className="text-center text-xs text-slate-400 italic">Chưa có dữ liệu hệ thống. Bắt đầu quét để xem thông tin.</div>;
    }

    const licenseText = summary.licenseStatus === 1 ? 'Đã kích hoạt' : 'Chưa kích hoạt';
    const licenseIcon = summary.licenseStatus === 1 
        ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> 
        : <AlertTriangle className="h-4 w-4 text-amber-500" />;

    return (
      <>
        <InfoRow icon={<Cpu size={16} />} label="Vi xử lý (CPU)" value={summary.cpuName || 'N/A'} />
        <InfoRow icon={<MemoryStick size={16} />} label="Bộ nhớ (RAM)" value={`${summary.ramTotalSize || 'N/A'} GB`} />
        <InfoRow icon={<HardDrive size={16} />} label="Card đồ họa (GPU)" value={summary.gpuName || 'N/A'} />
        <hr className="border-slate-200 my-3" />
        <InfoRow icon={<Shield size={16} />} label="Trạng thái bản quyền" value={
            <span className={`flex items-center gap-1.5 font-bold ${summary.licenseStatus === 1 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {licenseIcon} {licenseText}
            </span>
        } />
        <InfoRow icon={<KeyRound size={16} />} label="Kênh bản quyền" value={summary.licenseChannel || 'N/A'} />
        <InfoRow 
            icon={summary.hasOA3Key ? <CheckCircle2 size={16} className="text-emerald-500" /> : <AlertTriangle size={16} className="text-amber-500" />}
            label="Key nhúng trong BIOS" 
            value={summary.hasOA3Key ? 'Có' : 'Không'} 
        />
      </>
    );
  };

  return (
    <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">Thông tin Hệ thống</h4>
      <div className="space-y-3.5">
        {renderContent()}
      </div>
    </div>
  );
};

export default SystemSummary;
