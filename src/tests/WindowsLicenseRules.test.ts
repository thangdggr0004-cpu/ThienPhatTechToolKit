import { WindowsNotActivatedRule, WindowsKMSCrackRule } from '../core/engine/rules/WindowsLicenseRules.js';
import fs from 'fs';
import path from 'path';

export function testWindowsLicenseRules() {
  console.log('--- Testing WindowsLicenseRules ---');
  
  // Test 1: Retail Genuine should NOT trigger crack rule
  const retailPath = path.join(process.cwd(), 'src', 'tests', 'datasets', 'Retail_Genuine.json');
  const retailData = JSON.parse(fs.readFileSync(retailPath, 'utf8'));
  
  const retailContext: any = {
    snapshot: {
      windowsLicense: {
        status: retailData.Windows.LicenseStatus,
        productKeyChannel: retailData.Windows.Channel,
        hasOA3Key: retailData.Windows.HasOA3Key,
        piratedFiles: retailData.System.Files,
        suspiciousTasks: retailData.System.Tasks,
        hostsRedirects: retailData.System.Hosts
      },
      structuredEvidences: retailData.structuredEvidences || []
    }
  };

  const isCrackEvaluated = WindowsKMSCrackRule.evaluate(retailContext);
  if (isCrackEvaluated) {
    throw new Error('Retail_Genuine incorrectly triggered WindowsKMSCrackRule!');
  }
  console.log('[PASS] Retail_Genuine correctly bypassed WindowsKMSCrackRule.');

  // Test 2: KMS Activated SHOULD trigger crack rule
  const kmsPath = path.join(process.cwd(), 'src', 'tests', 'datasets', 'KMS_Activated.json');
  const kmsData = JSON.parse(fs.readFileSync(kmsPath, 'utf8'));
  
  const kmsContext: any = {
    snapshot: {
      windowsLicense: {
        status: kmsData.Windows.LicenseStatus,
        productKeyChannel: kmsData.Windows.Channel,
        hasOA3Key: kmsData.Windows.HasOA3Key,
        piratedFiles: kmsData.System.Files,
        suspiciousTasks: kmsData.System.Tasks,
        hostsRedirects: kmsData.System.Hosts
      },
      structuredEvidences: kmsData.structuredEvidences || []
    }
  };

  const isKmsEvaluated = WindowsKMSCrackRule.evaluate(kmsContext);
  if (!isKmsEvaluated) {
    throw new Error('KMS_Activated failed to trigger WindowsKMSCrackRule!');
  }
  console.log('[PASS] KMS_Activated correctly triggered WindowsKMSCrackRule.');
  return true;
}
