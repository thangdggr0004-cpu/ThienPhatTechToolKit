import React, { useState, useEffect } from 'react';
import { Lock, Unlock, ShieldAlert, RefreshCw, Shield, AlertTriangle } from 'lucide-react';

interface BitLockerVolume {
  MountPoint: string;
  VolumeStatus: string;
  ProtectionStatus: string;
  EncryptionPercentage: number;
}

export default function BitLockerManager() {
  const [volumes, setVolumes] = useState<BitLockerVolume[]>([]);
  const [loading, setLoading] = useState(false);
  const [noModule, setNoModule] = useState(false);
  const [processingDrives, setProcessingDrives] = useState<Record<string, boolean>>({});
  
  const isElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined;

  const loadStatus = async () => {
    if (!isElectron) return;
    setLoading(true);
    try {
      const res = await (window as any).electronAPI.getBitlockerStatus();
      if (res.success) {
        if (res.data === 'NO_MODULE') {
          setNoModule(true);
        } else {
          setNoModule(false);
          const parsed = JSON.parse(res.data);
          // PowerShell might return a single object or an array
          const arr = Array.isArray(parsed) ? parsed : [parsed];
          setVolumes(arr.filter(v => v.MountPoint));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, [isElectron]);

  const handleDisable = async (mountPoint: string) => {
    if (!isElectron) return;
    const confirm = window.confirm(`Bạn có chắc chắn muốn TẮT mã hóa BitLocker cho ổ đĩa ${mountPoint} không?\n\nQuá trình giải mã sẽ diễn ra ngầm và tốn khá nhiều thời gian tùy theo dung lượng ổ đĩa.`);
    if (!confirm) return;

    setProcessingDrives(prev => ({ ...prev, [mountPoint]: true }));
    try {
      const res = await (window as any).electronAPI.disableBitlocker(mountPoint);
      if (res.success) {
        alert(`Đã gửi lệnh giải mã cho ổ đĩa ${mountPoint}. Vui lòng chờ phần trăm giải mã chạy ngầm.`);
        loadStatus();
      } else {
        alert("Có lỗi xảy ra: " + res.error);
      }
    } catch (e: any) {
      alert("Lỗi Exception: " + e.message);
    } finally {
      setProcessingDrives(prev => ({ ...prev, [mountPoint]: false }));
    }
  };

  const handleDisableAll = async () => {
    const encryptedVols = volumes.filter(v => v.ProtectionStatus === 'On' || v.VolumeStatus === 'FullyEncrypted');
    if (encryptedVols.length === 0) {
      alert("Không có ổ đĩa nào đang bị khóa!");
      return;
    }
    
    const confirm = window.confirm(`Bạn có chắc chắn muốn TẮT BitLocker cho TOÀN BỘ ổ đĩa đang bị khóa không?`);
    if (!confirm) return;

    for (const vol of encryptedVols) {
      setProcessingDrives(prev => ({ ...prev, [vol.MountPoint]: true }));
      try {
        await (window as any).electronAPI.disableBitlocker(vol.MountPoint);
      } catch (e) {
        console.error("Lỗi khi tắt", vol.MountPoint, e);
      } finally {
        setProcessingDrives(prev => ({ ...prev, [vol.MountPoint]: false }));
      }
    }
    alert("Đã gửi lệnh tắt toàn bộ. Hệ thống đang tiến hành giải mã.");
    loadStatus();
  };

  const renderStatus = (vol: BitLockerVolume) => {
    if (vol.VolumeStatus === 'FullyDecrypted') {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-500 rounded text-xs font-bold w-fit border border-slate-200">
          <Unlock className="w-3 h-3" />
          Đã tắt (Off)
        </span>
      );
    }
    if (vol.VolumeStatus === 'FullyEncrypted') {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-100 text-rose-700 rounded text-xs font-bold w-fit">
          <Lock className="w-3 h-3" />
          Đang bị khóa
        </span>
      );
    }
    if (vol.VolumeStatus === 'DecryptionInProgress') {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-700 rounded text-xs font-bold animate-pulse w-fit">
          <RefreshCw className="w-3 h-3 animate-spin" />
          Đang giải mã... ({vol.EncryptionPercentage}%)
        </span>
      );
    }
    if (vol.VolumeStatus === 'EncryptionInProgress') {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-bold animate-pulse w-fit">
          <RefreshCw className="w-3 h-3 animate-spin" />
          Đang mã hóa... ({vol.EncryptionPercentage}%)
        </span>
      );
    }
    return <span className="text-slate-500 text-xs">{vol.VolumeStatus}</span>;
  };

  return (
    <div className="space-y-6 pb-10 animate-fade-in">
      {/* HEADER */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-rose-500" />
            Quản lý BitLocker
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Xem trạng thái và giải mã ổ đĩa cứng bị khóa
          </p>
        </div>
        <button 
          onClick={loadStatus}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {noModule && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 text-amber-800">
          <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold">Cảnh báo Phiên bản Windows</h3>
            <p className="text-sm mt-1">
              Hệ thống phát hiện có thể bạn đang dùng bản Windows Home hoặc tính năng mã hóa không tương thích. Lệnh BitLocker đầy đủ sẽ không khả dụng, phần mềm đang chuyển sang dùng phương thức quét cơ bản.
            </p>
          </div>
        </div>
      )}

      {/* DRIVES LIST */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-600" />
            Danh sách ổ đĩa
          </h3>
          <button
            onClick={handleDisableAll}
            className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded text-sm font-semibold transition-colors"
          >
            <Shield className="w-4 h-4" />
            Tắt toàn bộ BitLocker
          </button>
        </div>
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                <th className="p-4 font-semibold w-24">Ổ đĩa</th>
                <th className="p-4 font-semibold w-48">Trạng thái</th>
                <th className="p-4 font-semibold">Tỷ lệ mã hóa</th>
                <th className="p-4 font-semibold text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {volumes.map((vol, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-slate-800 text-lg">{vol.MountPoint} {vol.FileSystemLabel ? `(${vol.FileSystemLabel})` : ''}</div>
                    <div className="text-xs text-slate-500">Fixed Drive</div>
                  </td>
                  <td className="p-4">
                    {renderStatus(vol)}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-semibold w-8">{vol.EncryptionPercentage}%</span>
                      <div className="w-full max-w-[150px] bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${vol.VolumeStatus === 'FullyDecrypted' ? 'bg-emerald-500' : (vol.VolumeStatus === 'DecryptionInProgress' ? 'bg-amber-500' : 'bg-rose-500')}`} 
                          style={{ width: `${vol.EncryptionPercentage}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDisable(vol.MountPoint)}
                      disabled={vol.ProtectionStatus === 'Off' || vol.VolumeStatus === 'FullyDecrypted' || processingDrives[vol.MountPoint]}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      {processingDrives[vol.MountPoint] ? 'Đang gửi...' : 'Tắt BitLocker'}
                    </button>
                  </td>
                </tr>
              ))}
              {volumes.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    Không tìm thấy ổ đĩa nào có thể kiểm tra BitLocker.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
