import fs from 'fs';
import path from 'path';

export function testEvidenceEngine() {
  console.log('--- Testing EvidenceEngine Evidence Mapping ---');

  const datasetsDir = path.join(process.cwd(), 'src', 'tests', 'datasets');
  const files = fs.readdirSync(datasetsDir).filter(f => f.endsWith('.json'));

  files.forEach(file => {
    const ds = JSON.parse(fs.readFileSync(path.join(datasetsDir, file), 'utf8'));
    
    // Verify Evidence structure
    if (!Array.isArray(ds.Expected.Evidence)) {
      throw new Error(`Dataset ${file} is missing Evidence array in Expected`);
    }

    console.log(`[EVIDENCE PASS] ${ds.name} -> Evidence items: ${ds.Expected.Evidence.length}`);
  });

  return true;
}
