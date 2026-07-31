import { RecommendationEngine } from '../core/engine/RecommendationEngine.js';
import { WindowsNotActivatedRule, WindowsKMSCrackRule } from '../core/engine/rules/WindowsLicenseRules.js';
import fs from 'fs';
import path from 'path';

export function testRecommendationEngine() {
  console.log('--- Testing RecommendationEngine ---');
  const engine = new RecommendationEngine();
  engine.registerRule(WindowsNotActivatedRule);
  engine.registerRule(WindowsKMSCrackRule);

  const datasetPath = path.join(process.cwd(), 'src', 'tests', 'datasets', 'KMS_Activated.json');
  const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

  const snapshot: any = {
    systemInfo: { os: 'Windows 11' },
    windowsLicense: {
      status: dataset.Windows.LicenseStatus,
      description: dataset.Windows.Description,
      hasOA3Key: dataset.Windows.HasOA3Key,
      productKeyChannel: dataset.Windows.Channel,
      kmsPort: 1688,
      kmsHost: 'kms.msguides.com',
      piratedFiles: dataset.System.Files,
      suspiciousTasks: dataset.System.Tasks,
      suspiciousServices: dataset.System.Services,
      hostsRedirects: dataset.System.Hosts
    },
    structuredEvidences: dataset.structuredEvidences || []
  };

  const context: any = { snapshot, history: [], isOffline: false };
  const recommendations = engine.evaluateAll(context, () => true);

  console.log(`[PASS] KMS_Activated evaluated ${recommendations.length} recommendation(s).`);
  return true;
}
