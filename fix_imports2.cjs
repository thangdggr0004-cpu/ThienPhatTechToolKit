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
  
  // First, strip all .js and .js.js extensions from imports to clean up
  c = c.replace(/(from\s+['"]\.[^'"]+?)(?:\.js)+(['"])/g, '$1$2');
  c = c.replace(/(export\s+\*\s+from\s+['"]\.[^'"]+?)(?:\.js)+(['"])/g, '$1$2');

  // Next, map directory imports to explicit index.js
  c = c.replace(/from\s+['"]\.\.\/domain['"]/g, "from '../domain/index.js'");
  c = c.replace(/from\s+['"]\.\.\/registry['"]/g, "from '../registry/index.js'");
  c = c.replace(/from\s+['"]\.\.\/engine['"]/g, "from '../engine/index.js'");
  
  c = c.replace(/export\s+\*\s+from\s+['"]\.\.\/domain['"]/g, "export * from '../domain/index.js'");
  c = c.replace(/export\s+\*\s+from\s+['"]\.\.\/registry['"]/g, "export * from '../registry/index.js'");
  c = c.replace(/export\s+\*\s+from\s+['"]\.\.\/engine['"]/g, "export * from '../engine/index.js'");

  // Finally, append .js to all other relative imports
  c = c.replace(/from\s+['"](\.[^'"]+)['"]/g, (match, p1) => {
    if (p1.endsWith('.js')) return match;
    return `from '${p1}.js'`;
  });
  c = c.replace(/export\s+\*\s+from\s+['"](\.[^'"]+)['"]/g, (match, p1) => {
    if (p1.endsWith('.js')) return match;
    return `export * from '${p1}.js'`;
  });

  fs.writeFileSync(f, c);
});
console.log('Fixed imports in ' + files.length + ' files');
