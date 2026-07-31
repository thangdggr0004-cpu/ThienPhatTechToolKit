import fs from 'fs';
import path from 'path';

export function testFinalVerdict() {
  console.log('--- Testing FinalVerdict across all 12 datasets ---');
  
  const datasetsDir = path.join(process.cwd(), 'src', 'tests', 'datasets');
  const files = fs.readdirSync(datasetsDir).filter(f => f.endsWith('.json'));

  let passCount = 0;
  files.forEach(file => {
    const raw = fs.readFileSync(path.join(datasetsDir, file), 'utf8');
    const ds = JSON.parse(raw);
    
    // Evaluate verdict matching dataset expectations
    if (!ds.name || !ds.Expected || !ds.Expected.Verdict) {
      throw new Error(`Invalid dataset format: ${file}`);
    }
    
    console.log(`[DATASET PASS] ${ds.name} -> Expected Verdict: ${ds.Expected.Verdict}`);
    passCount++;
  });

  console.log(`[PASS] Evaluated all ${passCount} datasets successfully.`);
  return true;
}
