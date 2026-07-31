import { SystemAction } from '../RegistryTypes.js';

export const WINDOWS_LICENSE_SCAN: SystemAction = {
  id: 'WINDOWS_LICENSE_SCAN',
  name: 'Quét bản quyền Windows',
  category: 'UTILITY',
  purpose: 'Truy vấn WMI để lấy trạng thái bản quyền Windows hiện tại.',
  
  // Luôn hiển thị và luôn có thể chạy
  visibilityCondition: () => true,
  executionCondition: () => true,
  
  requireAdmin: false,
  requireConfirm: false,
  canUndo: false,
  requireBackup: false,
  
  autoRescan: false, // Đây chính là hàm scan nên không gọi auto scan đệ quy
  generateNext: true, // Chạy xong thì ném snapshot vào Engine để lấy Đề xuất
  
  riskLevel: 'NONE',
  estimatedTime: '2-5 giây',
  successMessage: 'Đã hoàn tất quét bản quyền.',
  errorMessage: 'Không thể lấy thông tin bản quyền.',
  
  tags: ['windows', 'license', 'scan', 'wmi']
};
