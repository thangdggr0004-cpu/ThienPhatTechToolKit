| File | Imported By | Executed By | Reachable From Electron | Production | Dead Code |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `main.js` | (none) | (none) | No | No | Yes |
| `electron.cjs` | (none) | `electron` (via `package.json`) | Yes | Yes | No |
| `preload.js` | `main.js` | (none) | No | No | Yes |
| `preload.cjs` | (none) | `electron.cjs` (as preload script) | Yes | Yes | No |
| `diagnosticPipeline.js` | `main.js` | (none) | No | No | Yes |
| `confidenceEngine.js` | `diagnosticPipeline.js` | `diagnosticPipeline.js` | No | No | Yes |
| `assessmentEngine.js` | `diagnosticPipeline.js` | `diagnosticPipeline.js` | No | No | Yes |
| `recommendationEngine.js`| `diagnosticPipeline.js` | `diagnosticPipeline.js` | No | No | Yes |
