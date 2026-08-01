import React, { useState, useEffect } from 'react';
import { FileText, Download, Printer, CheckCircle, Shield, HardDrive, Battery, Cpu, User, Wrench, RefreshCw } from 'lucide-react';
import { useTaskManager, AppTask } from '../context/TaskManagerContext.js';

export default function JobReportViewer() {
  const { tasks } = useTaskManager();
  const [techName, setTechName] = useState('Kỹ Thuật Viên - Thiện Phát Tech');
  const [customerName, setCustomerName] = useState('Khách Hàng');
  const [note, setNote] = useState('Đã kiểm tra, dọn dẹp rác và tối ưu hệ thống hoàn tất. Máy chạy êm, mát, khởi động nhanh.');
  const [sysSummary, setSysSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchSystemSummary = async () => {
    const isElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined;
    if (!isElectron) return;
    setLoading(true);
    try {
      const [hw, batt, bitlocker] = await Promise.all([
        (window as any).electronAPI.getHardwareInfo().catch(() => null),
        (window as any).electronAPI.getBatteryHealth().catch(() => null),
        (window as any).electronAPI.getBitlockerStatus().catch(() => null),
      ]);
      setSysSummary({ hw, batt, bitlocker });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemSummary();
  }, []);

  const completedTasks = (Object.values(tasks) as AppTask[]).filter(t => t.status === 'completed');

  const generateReportHtml = () => {
    const dateStr = new Date().toLocaleString('vi-VN');
    const batteryWear = sysSummary?.batt?.DesignCapacity > 0
      ? (100 - (sysSummary.batt.FullChargeCapacity / sysSummary.batt.DesignCapacity) * 100).toFixed(1)
      : 'N/A';

    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>BÁO CÁO NGHIỆM THU KỸ THUẬT - THIỆN PHÁT TECH</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 40px; color: #1e293b; background: #f8fafc; }
    .container { max-width: 800px; margin: 0 auto; background: #ffffff; padding: 40px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
    .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { margin: 0; color: #1e3a8a; font-size: 24px; text-transform: uppercase; }
    .header p { margin: 5px 0 0 0; color: #64748b; font-size: 14px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; background: #f1f5f9; padding: 20px; border-radius: 12px; margin-bottom: 30px; }
    .info-item { font-size: 14px; }
    .info-item strong { color: #334155; }
    .section-title { font-size: 16px; font-weight: bold; color: #1e3a8a; border-left: 4px solid #2563eb; padding-left: 10px; margin: 25px 0 15px 0; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
    th, td { border: 1px solid #e2e8f0; padding: 10px 14px; text-align: left; font-size: 13px; }
    th { background: #f8fafc; color: #475569; font-weight: 600; }
    .footer { margin-top: 40px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 12px; color: #94a3b8; }
    @media print {
      body { background: #fff; padding: 0; }
      .container { box-shadow: none; border: none; padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>BÁO CÁO BÀN GIAO & NGHIỆM THU MÁY TÍNH</h1>
      <p>Thiện Phát Tech Toolkit - Hệ thống tối ưu & chăm sóc máy tính chuyên nghiệp</p>
    </div>

    <div class="info-grid">
      <div class="info-item"><strong>Kỹ thuật viên:</strong> ${techName}</div>
      <div class="info-item"><strong>Khách hàng:</strong> ${customerName}</div>
      <div class="info-item"><strong>Thời gian xuất:</strong> ${dateStr}</div>
      <div class="info-item"><strong>Thiết bị:</strong> ${sysSummary?.hw?.cpuName || 'Windows PC'}</div>
    </div>

    <div class="section-title">1. TỔNG QUAN PHẦN CỨNG & PIN</div>
    <table>
      <tr><th>Thành phần</th><th>Chi tiết thông số</th></tr>
      <tr><td>Bộ vi xử lý (CPU)</td><td>${sysSummary?.hw?.cpuName || 'N/A'}</td></tr>
      <tr><td>Dung lượng RAM</td><td>${sysSummary?.hw?.ramTotalGB ? `${sysSummary.hw.ramTotalGB} GB` : 'N/A'}</td></tr>
      <tr><td>Sức khỏe Pin (Wear level)</td><td>${batteryWear}% chai pin (Thiết kế: ${sysSummary?.batt?.DesignCapacity || 0} mWh)</td></tr>
    </table>

    <div class="section-title">2. NHẬT KÝ CÁC THAO TÁC ĐÃ THỰC HIỆN</div>
    <table>
      <thead>
        <tr><th>Hạng mục</th><th>Mô tả kết quả</th><th>Trạng thái</th></tr>
      </thead>
      <tbody>
        ${completedTasks.length > 0 ? completedTasks.map(t => `
          <tr>
            <td><strong>${t.name}</strong></td>
            <td>${t.progressText || 'Hoàn tất an toàn'}</td>
            <td style="color: #16a34a; font-weight: bold;">✔ Thành công</td>
          </tr>
        `).join('') : `
          <tr>
            <td colspan="3" style="text-align: center; color: #94a3b8;">Đã quét & tối ưu hệ thống Windows.</td>
          </tr>
        `}
      </tbody>
    </table>

    <div class="section-title">3. GHI CHÚ BẢO HÀNH & KẾT LUẬN</div>
    <p style="font-size: 14px; background: #fffbeb; border: 1px solid #fef3c7; padding: 15px; border-radius: 8px; color: #92400e;">
      ${note}
    </p>

    <div style="display: flex; justify-content: space-between; margin-top: 60px; text-align: center;">
      <div>
        <p><strong>CHỮ KÝ KHÁCH HÀNG</strong></p>
        <p style="margin-top: 50px; color: #94a3b8;">(Ký và ghi rõ họ tên)</p>
      </div>
      <div>
        <p><strong>KỸ THUẬT VIÊN XỬ LÝ</strong></p>
        <p style="margin-top: 50px; color: #1e3a8a;"><strong>${techName}</strong></p>
      </div>
    </div>

    <div class="footer">
      Thiện Phát Tech Toolkit • Hotline Hỗ Trợ Kỹ Thuật • ${dateStr}
    </div>
  </div>
</body>
</html>`;
  };

  const handleExportHtml = () => {
    const htmlContent = generateReportHtml();
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BaoCao_KTV_${customerName.replace(/\s+/g, '_')}_${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const htmlContent = generateReportHtml();
    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(htmlContent);
      printWin.document.close();
      printWin.focus();
      setTimeout(() => {
        printWin.print();
      }, 500);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-6 rounded-2xl shadow-md text-white flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-300" /> BÁO CÁO BÀN GIAO KỸ THUẬT VIÊN (JOB REPORT VIEWER)
          </h2>
          <p className="text-xs text-blue-100 mt-1">
            Ghi nhận toàn bộ thao tác dọn rác, tối ưu hệ thống, bản quyền và tình trạng phần cứng để xuất biên bản bàn giao cho khách hàng nghiệm thu.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchSystemSummary}
            disabled={loading}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold flex items-center gap-2 backdrop-blur transition cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Cập Nhật
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer"
          >
            <Printer className="h-4 w-4" /> In Báo Cáo
          </button>
          <button
            onClick={handleExportHtml}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer"
          >
            <Download className="h-4 w-4" /> Xuất File HTML
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form Config */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="h-5 w-5 text-blue-600" /> Thông Tin Bàn Giao
          </h3>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Tên Kỹ Thuật Viên</label>
            <input
              type="text"
              value={techName}
              onChange={(e) => setTechName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Tên Khách Hàng</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Ghi Chú Kỹ Thuật / Khuyên Dùng</label>
            <textarea
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 space-y-1">
            <div className="font-bold flex items-center gap-1">
              <Wrench className="h-4 w-4" /> Mẹo cho KTV:
            </div>
            <p>File HTML nghiệm thu có thể mở trực tiếp trên trình duyệt hoặc gửi qua Zalo/Email cho khách hàng xem trên điện thoại.</p>
          </div>
        </div>

        {/* Right Column: Live Report Preview */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-600" /> Bản Xem Trước Biên Bản Nghiệm Thu
            </h3>
            <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-bold">
              Đã ghi nhận {completedTasks.length} tác vụ
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl p-6 bg-slate-50 space-y-4 text-sm font-sans">
            <div className="text-center border-b border-slate-300 pb-3">
              <h4 className="font-extrabold text-blue-900 text-lg">BIÊN BẢN BÀN GIAO KỸ THUẬT MÁY TÍNH</h4>
              <p className="text-xs text-slate-500">Thiện Phát Tech Toolkit • {new Date().toLocaleDateString('vi-VN')}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs bg-white p-3 rounded-lg border border-slate-200">
              <div><strong>KTV:</strong> {techName}</div>
              <div><strong>Khách hàng:</strong> {customerName}</div>
              <div><strong>CPU:</strong> {sysSummary?.hw?.cpuName || 'Windows PC'}</div>
              <div><strong>RAM:</strong> {sysSummary?.hw?.ramTotalGB ? `${sysSummary.hw.ramTotalGB} GB` : 'Đang quét...'}</div>
            </div>

            <div>
              <h5 className="font-bold text-slate-700 text-xs mb-2 uppercase tracking-wider">Danh mục công việc đã xử lý:</h5>
              <div className="space-y-2">
                {completedTasks.length > 0 ? (
                  completedTasks.map((t, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                      <span className="font-semibold text-slate-800">{t.name}</span>
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5" /> {t.progressText || 'Thành công'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="bg-white p-4 rounded-lg border border-slate-200 text-xs text-slate-500 text-center">
                    Chưa có tác vụ mới trong phiên làm việc này. Tất cả cài đặt hệ thống đã được tối ưu nguyên bản.
                  </div>
                )}
              </div>
            </div>

            <div>
              <h5 className="font-bold text-slate-700 text-xs mb-1 uppercase tracking-wider">Ghi chú nghiệm thu:</h5>
              <p className="text-xs bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-lg">
                {note}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
