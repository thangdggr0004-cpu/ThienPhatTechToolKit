import { testRecommendationEngine } from './RecommendationEngine.test.js';
import { testWindowsLicenseRules } from './WindowsLicenseRules.test.js';
import { testFinalVerdict } from './FinalVerdict.test.js';
import { testEvidenceEngine } from './EvidenceEngine.test.js';
import { testActivationEngine } from './ActivationEngine.test.js';

console.log('======================================================');
console.log(' RUNNING REGRESSION TEST SUITE (EVIDENCE ENGINE V3) ');
console.log('======================================================');

async function main() {
  try {
    testRecommendationEngine();
    testWindowsLicenseRules();
    testFinalVerdict();
    testEvidenceEngine();
    await testActivationEngine();

    console.log('======================================================');
    console.log(' ALL 12 DATASETS & UNIT TESTS PASSED (100% SUCCESS) ');
    console.log('======================================================');
    process.exit(0);
  } catch (err: any) {
    console.error('TEST SUITE FAILED:', err.message);
    process.exit(1);
  }
}

main();
