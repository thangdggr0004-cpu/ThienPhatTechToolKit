/**
 * WIN BIOS COLLECTOR V1.2 (ENTERPRISE DATA MODEL)
 * Category: WINDOWS | Priority: CRITICAL (1)
 * Description: Reads OEM OA3 product key & ACPI MSDM Firmware Table metadata without scoring or judgements.
 */

const path = require('path');
const frameworkPath = path.resolve(__dirname, '../../EnterpriseCollectorFramework.cjs');
const { BaseCollector, COLLECTOR_CATEGORIES, COLLECTOR_PRIORITIES } = require(frameworkPath);

class WinBIOSCollector extends BaseCollector {
  constructor() {
    super({
      collectorId: 'WinBIOSCollector',
      collectorName: 'Windows OA3 BIOS Key Collector',
      version: '1.2.0',
      category: COLLECTOR_CATEGORIES.WINDOWS,
      priority: COLLECTOR_PRIORITIES.CRITICAL,
      timeoutMs: 5000,
      requires: { wmi: true }
    });

    this.metadata = {
      collectorName: 'Windows OA3 BIOS Key Collector',
      collectorVersion: '1.2.0',
      author: 'Enterprise Windows Diagnostic Engineering',
      description: 'Gathers ACPI MSDM firmware table information and OA3 OEM product key evidence',
      category: COLLECTOR_CATEGORIES.WINDOWS,
      priority: COLLECTOR_PRIORITIES.CRITICAL,
      readOnly: true,
      executionMode: 'READ_ONLY',
      dependencies: [],
      supportedWindowsVersions: ['Windows 10', 'Windows 11', 'Windows Server 2016+'],
      capability: { powershell: true, wmi: true, winVerifyTrust: false }
    };
  }

  async collect(context = {}) {
    const collectedTime = new Date().toISOString();
    const rawData = context.rawData || {};
    const winData = rawData.Windows || {};
    const biosData = rawData.BIOS || {};

    const msdmPresent = winData.HasOA3Key === true || !!winData.OA3Key || !!biosData.msdmPresent;
    const oa3Key = winData.OA3Key || biosData.oa3Key || '';
    const oa3PartialKey = oa3Key ? (oa3Key.length >= 5 ? oa3Key.slice(-5) : oa3Key) : (biosData.oa3PartialKey || 'NONE');
    
    const firmwareVendor = biosData.vendor || winData.BiosVendor || 'UNKNOWN';
    const firmwareManufacturer = biosData.manufacturer || winData.BiosManufacturer || 'UNKNOWN';
    const firmwareVersion = biosData.version || winData.BiosVersion || 'UNKNOWN';
    const firmwareDate = biosData.date || winData.BiosDate || 'UNKNOWN';
    const firmwareType = biosData.firmwareType || (msdmPresent ? 'UEFI_ACPI' : 'BIOS_LEGACY');

    const oemChannel = winData.OA3Channel || (msdmPresent ? 'OEM:DM' : 'UNKNOWN');
    const oemEdition = biosData.oemEdition || winData.OA3Edition || 'UNKNOWN'; // NO SPECULATION - UNKNOWN IF UNDETECTABLE
    const currentEdition = winData.Edition || winData.Description || 'UNKNOWN';

    let editionMatch = 'UNKNOWN';
    if (oemEdition !== 'UNKNOWN' && currentEdition !== 'UNKNOWN') {
      editionMatch = currentEdition.toLowerCase().includes(oemEdition.toLowerCase()) ? 'MATCH' : 'MISMATCH';
    }

    const applicationId = '55c92734-d682-4d71-983e-d6ec3f16059f';
    const rawFirmwareData = biosData.rawAcpi || winData.RawACPI || null;

    const rawEvidence = {
      firmwareVendor,
      firmwareManufacturer,
      firmwareVersion,
      firmwareDate,
      firmwareType,
      msdmPresent,
      oa3OriginalProductKey: oa3Key || 'NONE',
      oa3PartialKey,
      oemChannel,
      oemEdition,
      currentWindowsEdition: currentEdition,
      editionMatch,
      applicationId,
      rawFirmwareData
    };

    const evidenceItems = [
      {
        evidenceId: 'EVD-WIN-BIOS-001',
        evidenceName: 'Firmware BIOS / UEFI Metadata',
        evidenceType: 'FIRMWARE',
        evidenceSource: 'WMI (Win32_BIOS)',
        evidenceValue: { firmwareVendor, firmwareManufacturer, firmwareVersion, firmwareDate, firmwareType },
        evidenceFormat: 'OBJECT',
        evidenceStatus: 'DATA_PRESENT',
        collectedTime,
        collectorVersion: this.version,
        rawValue: { firmwareVendor, firmwareManufacturer, firmwareVersion, firmwareDate },
        normalizedValue: `${firmwareVendor} | ${firmwareManufacturer} | ${firmwareVersion}`
      },
      {
        evidenceId: 'EVD-WIN-BIOS-002',
        evidenceName: 'ACPI MSDM OEM OA3 License Key Table',
        evidenceType: 'FIRMWARE',
        evidenceSource: 'WMI (SoftwareLicensingService.OA3xOriginalProductKey / ACPI MSDM)',
        evidenceValue: { msdmPresent, oa3PartialKey, oemChannel, oemEdition, currentEdition, editionMatch, applicationId },
        evidenceFormat: 'OBJECT',
        evidenceStatus: msdmPresent ? 'DATA_PRESENT' : 'DATA_ABSENT',
        collectedTime,
        collectorVersion: this.version,
        rawValue: { msdmPresent, oa3Key: oa3Key || 'NONE', oemChannel, oemEdition },
        normalizedValue: msdmPresent ? `MSDM_PRESENT (Key: ...${oa3PartialKey}, Channel: ${oemChannel})` : 'MSDM_ABSENT'
      }
    ];

    return {
      collectorName: this.collectorName,
      collectorVersion: this.version,
      collectorCategory: this.category,
      priority: this.priority,
      executionStatus: 'SUCCESS',
      readOnly: true,
      rawEvidence,
      evidenceItems,
      evidenceCount: evidenceItems.length,
      warnings: msdmPresent ? [] : ['MSDM Table not found in System Firmware'],
      warningCount: msdmPresent ? 0 : 1,
      errors: [],
      errorCount: 0,
      metadata: this.metadata
    };
  }
}

module.exports = WinBIOSCollector;
