| File | Category | Production | Safe to Commit | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Modified Files** | | | | |
| `GEMINI.md` | Documentation | No | Yes | Instructions for the Gemini CLI agent. |
| `MAS_AIO.cmd` | Experimental / Phase 2.x | No | No | A deleted batch script, likely related to activation. |
| `README.md` | Documentation | No | Yes | Standard project README file. |
| `main.js` | Production code | Yes | Yes | Main process file for the Electron application. Handles backend logic and IPC. |
| `package-lock.json`| Temporary / generated | No | Yes | Records exact dependency versions. Managed by npm/yarn. |
| `preload.cjs` | Production code | Yes | Yes | Redundant preload script. `preload.js` is used instead. |
| `preload.js` | Production code | Yes | Yes | Electron preload script, exposing backend functions to the frontend. |
| `src/App.tsx` | Production code | Yes | Yes | Main React component, the root of the UI. |
| `src/components/ActivationScanner.tsx` | Production code | Yes | Yes | UI component for scanning Windows/Office activation. Potentially being replaced by `LicenseManager.tsx`. |
| `src/components/AppSettings.tsx`| Production code | Yes | Yes | UI for application settings. |
| `src/components/GlobalTaskBar.tsx`| Production code | Yes | Yes | UI for displaying background task progress. |
| `src/components/HardwareDetails.tsx`| Production code | Yes | Yes | UI for displaying detailed system hardware information. |
| `src/components/LicenseManager.tsx`| Production code | Yes | Yes | Main UI for license management, likely the successor to `ActivationScanner.tsx`. |
| `src/components/OfficeLicenseAnalyzer.tsx`| Production code | Yes | Yes | Detailed UI for analyzing MS Office licenses, used by `LicenseManager.tsx`. |
| `src/main.tsx` | Production code | Yes | Yes | Entry point for the React application, includes error handling. |
| `tsconfig.json` | Production code | Yes | Yes | TypeScript compiler configuration. |
| **Untracked Files** | | | | |
| `.vscode/extensions.json` | Documentation | No | Yes | Recommends VS Code extensions for developers. |
| `AGENT_START.md` | Documentation | No | Yes | Standard operating procedure for the AI agent. |
| `AI_WORKFLOW.md` | Documentation | No | Yes | Describes the workflow for AI-assisted development. |
| `ARCHITECTURE.md` | Documentation | No | Yes | Core document outlining the system architecture. |
| `CODING_STANDARD.md`| Documentation | No | Yes | Defines coding standards for the project. |
| `DEVELOPER_WORKFLOW.md`| Documentation | No | Yes | Outlines the development workflow for human developers. |
| `PHASE_STATUS.md` | Documentation | No | Yes | Tracks the status of project development phases. |
| `PROJECT_CONSTITUTION.md`| Documentation | No | Yes | The highest-authority document defining project rules and principles. |
| `PROJECT_STATE.md` | Documentation | No | Yes | A snapshot of the current project state. |
| `QUALITY_GATE.md` | Documentation | No | Yes | Defines the quality standards for the project. |
| `ROADMAP.md` | Documentation | No | Yes | Outlines the project's development roadmap. |
| `assessment-engine/configValidator.js`| Production code | Yes | Yes | Validates the configuration for the Assessment Engine. |
| `assessment.config.json` | Production code | Yes | Yes | Configuration "Rule Pack" for the Assessment Engine. |
| `assessmentEngine.js`| Production code | Yes | Yes | Core logic for the Assessment Engine (Phase 2.5). |
| `confidence-engine/configValidator.js`| Production code | Yes | Yes | Validates the configuration for the Confidence Engine. |
| `confidence.config.json`| Production code | Yes | Yes | Configuration "Rule Pack" for the Confidence Engine. |
| `confidenceCalculator.js`| Production code | Yes | Yes | Core calculation logic for the Confidence Engine. |
| `confidenceEngine.js`| Production code | Yes | Yes | Orchestrates the Confidence Engine (Phase 2.4). |
| `confidenceExplanation.js`| Production code | Yes | Yes | Generates human-readable explanations for confidence scores. |
| `confidenceFactors.js`| Experimental / Phase 2.x | No | No | Empty file, likely a placeholder or obsolete. |
| `confidenceLevel.js`| Experimental / Phase 2.x | No | No | Empty file, likely a placeholder or obsolete. |
| `configValidator.js`| Experimental / Phase 2.x | No | No | Empty file, likely redundant. |
| `configurationProvider.js`| Production code | Yes | Yes | Loads and validates all engine configurations. |
| `diagnosticPipeline.js`| Production code | Yes | Yes | Main orchestrator for the entire diagnostic engine pipeline. |
| `executionContext.js`| Experimental / Phase 2.x | No | No | Empty file, likely a placeholder or obsolete. |
| `index.js` | Experimental / Phase 2.x | No | No | Empty file, redundant in the current project structure. |
| `recommendation.config.json`| Production code | Yes | Yes | Configuration "Rule Pack" for the Recommendation Engine. |
| `recommendationEngine.js`| Production code | Yes | Yes | Core logic for the Recommendation Engine (Phase 2.6). |
| `ruleEvaluator.js` | Experimental / Phase 2.x | No | No | Empty file, likely obsolete. |
| `ruleRegistryLoader.js`| Production code | Yes | Yes | Loads and interprets JSON rule packs for the Decision Engine. |
| `sample.pack.json` | Experimental / Phase 2.x | No | Yes | An example "Rule Pack" for testing or demonstration. |
| `src/vite-env.d.ts`| Temporary / generated | No | Yes | Standard Vite type definition file. |
| `types.js` | Documentation | No | Yes | JSDoc type definitions for the diagnostic pipeline's data structures. |
| `windows-activation.pack.json` | Experimental / Phase 2.x | No | No | Empty file, likely a placeholder for a future rule pack. |
