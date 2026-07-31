const fs = require('fs');
const path = require('path');
function walk(d) {
  let r = [];
  fs.readdirSync(d).forEach(f => {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) r = r.concat(walk(p));
    else if (p.endsWith('.ts')) r.push(p);
  });
  return r;
}
const files = walk('src/core');
files.forEach(f => {
  let c = fs.readFileSync(f, 'utf-8');
  c = c.replace(/from\s+['"](\.[^'"]+)['"]/g, (m, p1) => `from '${p1}.js'`);
  c = c.replace(/export\s+\*\s+from\s+['"](\.[^'"]+)['"]/g, (m, p1) => `export * from '${p1}.js'`);
  fs.writeFileSync(f, c);
});
console.log('Fixed imports in ' + files.length + ' files');
