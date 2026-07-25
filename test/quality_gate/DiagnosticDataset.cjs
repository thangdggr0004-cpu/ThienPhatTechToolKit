/**
 * ENTERPRISE QUALITY GATE DIAGNOSTIC DATASET V3
 * 22 Standardized Environment Scenarios & Expected Decision Matrix
 */

const DATASET_SCENARIOS = [
  {
    testId: 'TC-01',
    name: 'Office Retail - Activated',
    description: 'Bản quyền Office Retail chính hãng đã kích hoạt hợp lệ.',
    inputData: {
      sku: { skuName: 'Office 2021 HomeStudentRetail', channel: 'Retail', bitness: 'x64', installType: 'ClickToRun', buildNumber: '16.0.17000' },
      licenseStatus: 'LICENSED',
      sysSppcAuthenticode: 'Valid',
      sysSppcSigner: 'CN=Microsoft Corporation',
      ohookDllFound: false,
      ifeoHooks: [],
      appInitDlls: '',
      services: [{ name: 'ClickToRunSvc', status: 'Running' }]
    },
    expected: {
      evidenceStatus: { license: 'PASS', authenticode: 'PASS', ohook: 'PASS', registry: 'PASS' },
      confidenceMin: 95,
      confidenceMax: 100,
      decision: 'ALLOW_RESTORE', // System Clean
      hasTampering: false,
      recoveryAction: 'NONE'
    }
  },
  {
    testId: 'TC-02',
    name: 'Office Retail - Not Activated',
    description: 'Office chưa kích hoạt (UNLICENSED/GRACE). Không phải bẻ khóa lậu!',
    inputData: {
      sku: { skuName: 'Office 2021 ProPlusRetail', channel: 'Retail', bitness: 'x64', installType: 'ClickToRun', buildNumber: '16.0.17000' },
      licenseStatus: 'UNLICENSED',
      sysSppcAuthenticode: 'Valid',
      sysSppcSigner: 'CN=Microsoft Corporation',
      ohookDllFound: false,
      ifeoHooks: [],
      appInitDlls: '',
      services: [{ name: 'ClickToRunSvc', status: 'Running' }]
    },
    expected: {
      evidenceStatus: { license: 'WARNING', authenticode: 'PASS', ohook: 'PASS', registry: 'PASS' },
      confidenceMin: 85,
      confidenceMax: 95,
      decision: 'ALLOW_RESTORE', // Clean system, just unlicensed
      hasTampering: false,
      recoveryAction: 'NONE' // MUST NOT BE TREATED AS MALWARE OR CRACK!
    }
  },
  {
    testId: 'TC-03',
    name: 'Office LTSC 2021',
    description: 'Bản quyền doanh nghiệp Office LTSC 2021 chuẩn Volume.',
    inputData: {
      sku: { skuName: 'Office 2021 ProPlus2021VL', channel: 'PerpetualVL', bitness: 'x64', installType: 'ClickToRun', buildNumber: '16.0.14332' },
      licenseStatus: 'LICENSED',
      sysSppcAuthenticode: 'Valid',
      sysSppcSigner: 'CN=Microsoft Corporation',
      ohookDllFound: false,
      ifeoHooks: [],
      appInitDlls: '',
      services: [{ name: 'ClickToRunSvc', status: 'Running' }]
    },
    expected: {
      evidenceStatus: { license: 'PASS', authenticode: 'PASS', ohook: 'PASS', registry: 'PASS' },
      confidenceMin: 95,
      confidenceMax: 100,
      decision: 'ALLOW_RESTORE',
      hasTampering: false,
      recoveryAction: 'NONE'
    }
  },
  {
    testId: 'TC-04',
    name: 'Office LTSC 2024',
    description: 'Bản quyền thế hệ mới Office LTSC 2024 chuẩn Volume.',
    inputData: {
      sku: { skuName: 'Office 2024 ProPlus2024VL', channel: 'PerpetualVL2024', bitness: 'x64', installType: 'ClickToRun', buildNumber: '16.0.17500' },
      licenseStatus: 'LICENSED',
      sysSppcAuthenticode: 'Valid',
      sysSppcSigner: 'CN=Microsoft Corporation',
      ohookDllFound: false,
      ifeoHooks: [],
      appInitDlls: '',
      services: [{ name: 'ClickToRunSvc', status: 'Running' }]
    },
    expected: {
      evidenceStatus: { license: 'PASS', authenticode: 'PASS', ohook: 'PASS', registry: 'PASS' },
      confidenceMin: 95,
      confidenceMax: 100,
      decision: 'ALLOW_RESTORE',
      hasTampering: false,
      recoveryAction: 'NONE'
    }
  },
  {
    testId: 'TC-05',
    name: 'Microsoft 365',
    description: 'Bản quyền thuê bao Microsoft 365 Apps for Enterprise.',
    inputData: {
      sku: { skuName: 'O365ProPlusRetail', channel: 'Current', bitness: 'x64', installType: 'ClickToRun', buildNumber: '16.0.17328' },
      licenseStatus: 'LICENSED',
      sysSppcAuthenticode: 'Valid',
      sysSppcSigner: 'CN=Microsoft Corporation',
      ohookDllFound: false,
      ifeoHooks: [],
      appInitDlls: '',
      services: [{ name: 'ClickToRunSvc', status: 'Running' }]
    },
    expected: {
      evidenceStatus: { license: 'PASS', authenticode: 'PASS', ohook: 'PASS', registry: 'PASS' },
      confidenceMin: 95,
      confidenceMax: 100,
      decision: 'ALLOW_RESTORE',
      hasTampering: false,
      recoveryAction: 'NONE'
    }
  },
  {
    testId: 'TC-06',
    name: 'Office MSI',
    description: 'Phiên bản Office 2016 MSI truyền thống.',
    inputData: {
      sku: { skuName: 'Office16.PROPLUS', channel: 'MSI', bitness: 'x86', installType: 'MSI', buildNumber: '16.0.4266' },
      licenseStatus: 'LICENSED',
      sysSppcAuthenticode: 'Valid',
      sysSppcSigner: 'CN=Microsoft Corporation',
      ohookDllFound: false,
      ifeoHooks: [],
      appInitDlls: '',
      services: [{ name: 'osppsvc', status: 'Running' }]
    },
    expected: {
      evidenceStatus: { license: 'PASS', authenticode: 'PASS', ohook: 'PASS', registry: 'PASS' },
      confidenceMin: 95,
      confidenceMax: 100,
      decision: 'ALLOW_RESTORE',
      hasTampering: false,
      recoveryAction: 'NONE'
    }
  },
  {
    testId: 'TC-07',
    name: 'Office ClickToRun',
    description: 'Bộ cài Click-to-Run chuẩn của Microsoft.',
    inputData: {
      sku: { skuName: 'HomeBusinessRetail', channel: 'MonthlyEnterprise', bitness: 'x64', installType: 'ClickToRun', buildNumber: '16.0.16924' },
      licenseStatus: 'LICENSED',
      sysSppcAuthenticode: 'Valid',
      sysSppcSigner: 'CN=Microsoft Corporation',
      ohookDllFound: false,
      ifeoHooks: [],
      appInitDlls: '',
      services: [{ name: 'ClickToRunSvc', status: 'Running' }]
    },
    expected: {
      evidenceStatus: { license: 'PASS', authenticode: 'PASS', ohook: 'PASS', registry: 'PASS' },
      confidenceMin: 95,
      confidenceMax: 100,
      decision: 'ALLOW_RESTORE',
      hasTampering: false,
      recoveryAction: 'NONE'
    }
  },
  {
    testId: 'TC-08',
    name: 'Office Mondo',
    description: 'Bản quyền thử nghiệm Office Mondo 2016.',
    inputData: {
      sku: { skuName: 'MondoVolume', channel: 'Mondo', bitness: 'x64', installType: 'ClickToRun', buildNumber: '16.0.10000' },
      licenseStatus: 'LICENSED',
      sysSppcAuthenticode: 'Valid',
      sysSppcSigner: 'CN=Microsoft Corporation',
      ohookDllFound: false,
      ifeoHooks: [],
      appInitDlls: '',
      services: [{ name: 'ClickToRunSvc', status: 'Running' }]
    },
    expected: {
      evidenceStatus: { license: 'PASS', authenticode: 'PASS', ohook: 'PASS', registry: 'PASS' },
      confidenceMin: 90,
      confidenceMax: 100,
      decision: 'ALLOW_RESTORE',
      hasTampering: false,
      recoveryAction: 'NONE'
    }
  },
  {
    testId: 'TC-09',
    name: 'Office Insider',
    description: 'Phiên bản Office Insider / Beta Channel.',
    inputData: {
      sku: { skuName: 'O365ProPlusRetail', channel: 'BetaChannel', bitness: 'x64', installType: 'ClickToRun', buildNumber: '16.0.17601' },
      licenseStatus: 'LICENSED',
      sysSppcAuthenticode: 'Valid',
      sysSppcSigner: 'CN=Microsoft Corporation',
      ohookDllFound: false,
      ifeoHooks: [],
      appInitDlls: '',
      services: [{ name: 'ClickToRunSvc', status: 'Running' }]
    },
    expected: {
      evidenceStatus: { license: 'PASS', authenticode: 'PASS', ohook: 'PASS', registry: 'PASS' },
      confidenceMin: 90,
      confidenceMax: 100,
      decision: 'ALLOW_RESTORE',
      hasTampering: false,
      recoveryAction: 'NONE'
    }
  },
  {
    testId: 'TC-10',
    name: 'Volume License (Genuine KMS)',
    description: 'Bản quyền Volume License doanh nghiệp kích hoạt máy chủ KMS nội bộ hợp lệ.',
    inputData: {
      sku: { skuName: 'ProPlus2021Volume', channel: 'Volume', bitness: 'x64', installType: 'ClickToRun', buildNumber: '16.0.14332' },
      licenseStatus: 'LICENSED',
      sysSppcAuthenticode: 'Valid',
      sysSppcSigner: 'CN=Microsoft Corporation',
      ohookDllFound: false,
      ifeoHooks: [],
      appInitDlls: '',
      services: [{ name: 'ClickToRunSvc', status: 'Running' }]
    },
    expected: {
      evidenceStatus: { license: 'PASS', authenticode: 'PASS', ohook: 'PASS', registry: 'PASS' },
      confidenceMin: 95,
      confidenceMax: 100,
      decision: 'ALLOW_RESTORE',
      hasTampering: false,
      recoveryAction: 'NONE'
    }
  },
  {
    testId: 'TC-11',
    name: 'Fake KMS Server / Intercepted KMS',
    description: 'KMS giả lập can thiệp bẫy địa chỉ KMS Host.',
    inputData: {
      sku: { skuName: 'ProPlusRetail', channel: 'KMS', bitness: 'x64', installType: 'ClickToRun', buildNumber: '16.0.14332' },
      licenseStatus: 'LICENSED',
      kmsHost: '127.0.0.2:1688',
      sysSppcAuthenticode: 'Valid',
      sysSppcSigner: 'CN=Microsoft Corporation',
      ohookDllFound: false,
      ifeoHooks: ['HKLM:\\...\\sppsvc.exe -> KMSAuto.exe'],
      appInitDlls: '',
      services: [{ name: 'ClickToRunSvc', status: 'Running' }]
    },
    expected: {
      evidenceStatus: { license: 'PASS', authenticode: 'PASS', ohook: 'PASS', registry: 'FAIL' },
      confidenceMin: 70,
      confidenceMax: 85,
      decision: 'WARN_ONLY',
      hasTampering: true,
      recoveryAction: 'REPAIR_REGISTRY_ONLY'
    }
  },
  {
    testId: 'TC-12',
    name: 'OHook Injection',
    description: 'Phát hiện tệp sppcs.dll OHook giả mạo trong thư mục Office VFS.',
    inputData: {
      sku: { skuName: 'ProPlus2021Retail', channel: 'Retail', bitness: 'x64', installType: 'ClickToRun', buildNumber: '16.0.14332' },
      licenseStatus: 'LICENSED',
      sysSppcAuthenticode: 'Valid',
      sysSppcSigner: 'CN=Microsoft Corporation',
      ohookDllFound: true, // OHook DLL present
      ifeoHooks: [],
      appInitDlls: '',
      services: [{ name: 'ClickToRunSvc', status: 'Running' }]
    },
    expected: {
      evidenceStatus: { license: 'PASS', authenticode: 'PASS', ohook: 'FAIL', registry: 'PASS' },
      confidenceMin: 70,
      confidenceMax: 85,
      decision: 'WARN_ONLY',
      hasTampering: true,
      recoveryAction: 'SURGICAL_REMOVE_OHOOK_DLL'
    }
  },
  {
    testId: 'TC-13',
    name: 'Registry Hook (IFEO Debugger)',
    description: 'Phát hiện Bẫy chuyển hướng Debugger IFEO trên Registry.',
    inputData: {
      sku: { skuName: 'ProPlusRetail', channel: 'Retail', bitness: 'x64', installType: 'ClickToRun', buildNumber: '16.0.14332' },
      licenseStatus: 'UNLICENSED',
      sysSppcAuthenticode: 'Valid',
      sysSppcSigner: 'CN=Microsoft Corporation',
      ohookDllFound: false,
      ifeoHooks: ['HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Image File Execution Options\\sppsvc.exe -> Debugger=KMSTools.exe'],
      appInitDlls: '',
      services: [{ name: 'ClickToRunSvc', status: 'Running' }]
    },
    expected: {
      evidenceStatus: { license: 'WARNING', authenticode: 'PASS', ohook: 'PASS', registry: 'FAIL' },
      confidenceMin: 60,
      confidenceMax: 75,
      decision: 'WARN_ONLY',
      hasTampering: true,
      recoveryAction: 'SURGICAL_REMOVE_IFEO_KEY'
    }
  },
  {
    testId: 'TC-14',
    name: 'DLL Modified (System32 sppc.dll Tampered)',
    description: 'File sppc.dll trong System32 bị tráo đổi mất chữ ký Microsoft.',
    inputData: {
      sku: { skuName: 'ProPlusRetail', channel: 'Retail', bitness: 'x64', installType: 'ClickToRun', buildNumber: '16.0.14332' },
      licenseStatus: 'UNLICENSED',
      sysSppcAuthenticode: 'NotSigned',
      sysSppcSigner: 'Unsigned/Unknown',
      ohookDllFound: false,
      ifeoHooks: [],
      appInitDlls: '',
      services: [{ name: 'ClickToRunSvc', status: 'Running' }]
    },
    expected: {
      evidenceStatus: { license: 'WARNING', authenticode: 'FAIL', ohook: 'PASS', registry: 'PASS' },
      confidenceMin: 60,
      confidenceMax: 75,
      decision: 'WARN_ONLY',
      hasTampering: true,
      recoveryAction: 'REPAIR_DLL_VIA_SFC_WINSXS'
    }
  },
  {
    testId: 'TC-15',
    name: 'DLL Original (Authenticode Valid)',
    description: 'File sppc.dll chuẩn nguyên bản chữ ký Microsoft.',
    inputData: {
      sku: { skuName: 'ProPlusRetail', channel: 'Retail', bitness: 'x64', installType: 'ClickToRun', buildNumber: '16.0.14332' },
      licenseStatus: 'LICENSED',
      sysSppcAuthenticode: 'Valid',
      sysSppcSigner: 'CN=Microsoft Corporation',
      ohookDllFound: false,
      ifeoHooks: [],
      appInitDlls: '',
      services: [{ name: 'ClickToRunSvc', status: 'Running' }]
    },
    expected: {
      evidenceStatus: { license: 'PASS', authenticode: 'PASS', ohook: 'PASS', registry: 'PASS' },
      confidenceMin: 95,
      confidenceMax: 100,
      decision: 'ALLOW_RESTORE',
      hasTampering: false,
      recoveryAction: 'NONE' // MUST NOT BE TOUCHED!
    }
  },
  {
    testId: 'TC-16',
    name: 'Services Disabled',
    description: 'Dịch vụ ClickToRunSvc bị người dùng tắt. Không phải Malware!',
    inputData: {
      sku: { skuName: 'ProPlusRetail', channel: 'Retail', bitness: 'x64', installType: 'ClickToRun', buildNumber: '16.0.14332' },
      licenseStatus: 'LICENSED',
      sysSppcAuthenticode: 'Valid',
      sysSppcSigner: 'CN=Microsoft Corporation',
      ohookDllFound: false,
      ifeoHooks: [],
      appInitDlls: '',
      services: [{ name: 'ClickToRunSvc', status: 'Stopped' }]
    },
    expected: {
      evidenceStatus: { license: 'PASS', authenticode: 'PASS', ohook: 'PASS', registry: 'PASS' },
      confidenceMin: 95,
      confidenceMax: 100,
      decision: 'ALLOW_RESTORE',
      hasTampering: false,
      recoveryAction: 'SURGICAL_ENABLE_SERVICE'
    }
  },
  {
    testId: 'TC-17',
    name: 'ClickToRun Error',
    description: 'Lỗi dịch vụ ClickToRun không phản hồi.',
    inputData: {
      sku: { skuName: 'ProPlusRetail', channel: 'Retail', bitness: 'x64', installType: 'ClickToRun', buildNumber: '16.0.14332' },
      licenseStatus: 'UNLICENSED',
      sysSppcAuthenticode: 'Valid',
      sysSppcSigner: 'CN=Microsoft Corporation',
      ohookDllFound: false,
      ifeoHooks: [],
      appInitDlls: '',
      services: []
    },
    expected: {
      evidenceStatus: { license: 'WARNING', authenticode: 'PASS', ohook: 'PASS', registry: 'PASS' },
      confidenceMin: 80,
      confidenceMax: 95,
      decision: 'ALLOW_RESTORE',
      hasTampering: false,
      recoveryAction: 'REPAIR_SERVICE_C2R'
    }
  },
  {
    testId: 'TC-18',
    name: 'License Cache Corrupted',
    description: 'Bộ nhớ đệm cấp phát OSPP bị lỗi hỏng.',
    inputData: {
      sku: { skuName: 'ProPlusRetail', channel: 'Retail', bitness: 'x64', installType: 'ClickToRun', buildNumber: '16.0.14332' },
      licenseStatus: 'UNLICENSED',
      sysSppcAuthenticode: 'Valid',
      sysSppcSigner: 'CN=Microsoft Corporation',
      ohookDllFound: false,
      ifeoHooks: [],
      appInitDlls: '',
      services: [{ name: 'ClickToRunSvc', status: 'Running' }]
    },
    expected: {
      evidenceStatus: { license: 'WARNING', authenticode: 'PASS', ohook: 'PASS', registry: 'PASS' },
      confidenceMin: 80,
      confidenceMax: 95,
      decision: 'ALLOW_RESTORE',
      hasTampering: false,
      recoveryAction: 'RESET_LICENSING_CACHE'
    }
  },
  {
    testId: 'TC-19',
    name: 'Mixed Evidence',
    description: 'Tệp DLL sạch nhưng lại dính Registry IFEO Hook.',
    inputData: {
      sku: { skuName: 'ProPlusRetail', channel: 'Retail', bitness: 'x64', installType: 'ClickToRun', buildNumber: '16.0.14332' },
      licenseStatus: 'UNLICENSED',
      sysSppcAuthenticode: 'Valid',
      sysSppcSigner: 'CN=Microsoft Corporation',
      ohookDllFound: false,
      ifeoHooks: ['HKLM:\\...\\sppsvc.exe -> Debugger=KMSAuto.exe'],
      appInitDlls: '',
      services: [{ name: 'ClickToRunSvc', status: 'Running' }]
    },
    expected: {
      evidenceStatus: { license: 'WARNING', authenticode: 'PASS', ohook: 'PASS', registry: 'FAIL' },
      confidenceMin: 60,
      confidenceMax: 75,
      decision: 'WARN_ONLY',
      hasTampering: true,
      recoveryAction: 'SURGICAL_REMOVE_IFEO_KEY' // DO NOT TOUCH DLL!
    }
  },
  {
    testId: 'TC-20',
    name: 'Unknown Environment',
    description: 'Môi trường lạ không xác định được SKU.',
    inputData: {
      sku: { skuName: 'UnknownSKU', channel: 'Unknown', bitness: 'x64', installType: 'Unknown', buildNumber: '0.0' },
      licenseStatus: 'UNKNOWN',
      sysSppcAuthenticode: 'NotSigned',
      sysSppcSigner: '',
      ohookDllFound: true,
      ifeoHooks: ['Hook1', 'Hook2'],
      appInitDlls: 'HookDll',
      services: []
    },
    expected: {
      evidenceStatus: { license: 'WARNING', authenticode: 'FAIL', ohook: 'FAIL', registry: 'FAIL' },
      confidenceMin: 0,
      confidenceMax: 39,
      decision: 'BLOCK_RESTORE', // Confidence < 40% -> BLOCK RESTORE!
      hasTampering: true,
      recoveryAction: 'NONE'
    }
  },
  {
    testId: 'TC-21',
    name: 'Office Update Broken',
    description: 'Cập nhật Office bị khóa qua Group Policy.',
    inputData: {
      sku: { skuName: 'ProPlusRetail', channel: 'Retail', bitness: 'x64', installType: 'ClickToRun', buildNumber: '16.0.14332' },
      licenseStatus: 'LICENSED',
      sysSppcAuthenticode: 'Valid',
      sysSppcSigner: 'CN=Microsoft Corporation',
      ohookDllFound: false,
      ifeoHooks: [],
      appInitDlls: '',
      services: [{ name: 'ClickToRunSvc', status: 'Running' }]
    },
    expected: {
      evidenceStatus: { license: 'PASS', authenticode: 'PASS', ohook: 'PASS', registry: 'PASS' },
      confidenceMin: 90,
      confidenceMax: 100,
      decision: 'ALLOW_RESTORE',
      hasTampering: false,
      recoveryAction: 'UNBLOCK_OFFICE_UPDATE'
    }
  },
  {
    testId: 'TC-22',
    name: 'Corrupted Installation',
    description: 'Bộ cài Office bị mất file ospp.vbs cốt lõi.',
    inputData: {
      sku: { skuName: 'ProPlusRetail', channel: 'Retail', bitness: 'x64', installType: 'ClickToRun', buildNumber: '16.0.14332', officePath: '' },
      licenseStatus: 'UNLICENSED',
      sysSppcAuthenticode: 'Valid',
      sysSppcSigner: 'CN=Microsoft Corporation',
      ohookDllFound: false,
      ifeoHooks: [],
      appInitDlls: '',
      services: [{ name: 'ClickToRunSvc', status: 'Running' }]
    },
    expected: {
      evidenceStatus: { license: 'WARNING', authenticode: 'PASS', ohook: 'PASS', registry: 'PASS' },
      confidenceMin: 80,
      confidenceMax: 95,
      decision: 'ALLOW_RESTORE',
      hasTampering: false,
      recoveryAction: 'RECOMMEND_OFFICE_QUICK_REPAIR'
    }
  }
];

module.exports = { DATASET_SCENARIOS };
