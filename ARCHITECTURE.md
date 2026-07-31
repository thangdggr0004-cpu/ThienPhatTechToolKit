# ThienPhatTechToolKit Architecture Review

_Last reviewed: 2026-07-30_

## 1) System Overview

ThienPhatTechToolKit is a Windows-focused Electron desktop application with:

- **UI layer**: React + TypeScript (Vite) in `src/`
- **Desktop/runtime layer**: Electron main process in `electron.cjs`, preload bridge in `preload.cjs`
- **Diagnostic/decision layer**: evidence collection + correlation + decision engines in `src/engine/*.cjs`
- **Domain/core layer**: TypeScript domain and orchestration modules in `src/core/**`
- **OS integration layer**: PowerShell, WMI, registry, service and system tooling commands run from Electron main process

Primary flow:
1. Renderer requests actions via IPC.
2. Main process executes Windows diagnostics/remediation scripts.
3. Results are normalized into evidence and passed through engines.
4. Final reports/recommendations are returned to UI.

## 2) High-Level Component Map

### Runtime shells
- `electron.cjs` — main process bootstrap, IPC handlers, script execution, updater/admin flows.
- `preload.cjs` — context bridge exposure for renderer-safe IPC access.
- `src/main.tsx` + `src/App.tsx` — React application mount and feature routing/state.

### Core business modules
- `assessmentEngine.js`, `confidenceEngine.js`, `recommendationEngine.js` — scoring/recommendation orchestration.
- `diagnosticPipeline.js` — pipeline composition across confidence/assessment/recommendation.
- `ruleRegistryLoader.js` — declarative rule loading and safe condition interpreter.

### Evidence/diagnostic engines
- `src/engine/EvidenceMatrixEngine.cjs`
- `src/engine/EvidenceCorrelationEngine.cjs`
- `src/engine/DiagnosticDecisionEngine.cjs`

### Collectors
- Legacy/generic collectors (`AuthenticodeCollector.cjs`, `LicenseCollector.cjs`, etc.)
- Windows-prefixed collectors (`WinAuthenticodeCollector.cjs`, `WinLicenseCollector.cjs`, etc.)

### Infrastructure
- IPC abstractions in `src/infrastructure/ipc/**`
- Context/state helpers in `src/context/**`

## 3) Architectural Strengths

- Clear intention toward layered design (UI, IPC, domain/core, engines).
- Rule-engine direction avoids direct `eval` (safe interpreter pattern in `ruleRegistryLoader.js`).
- Defensive browser settings partially enabled (`nodeIntegration: false`, `contextIsolation: true`).
- Test suite exists for core decision logic (`src/tests/**`, `test/**`).

## 4) Architectural Weaknesses

- **God-object main process**: `electron.cjs` centralizes many unrelated responsibilities and numerous IPC handlers.
- **Mixed paradigms**: TypeScript modular architecture coexists with large CJS scripts and root-level JS utilities.
- **Boundary leakage**: OS command execution, policy logic, and orchestration are tightly coupled in main process.
- **Parallel implementations**: duplicated concept sets across collectors, execution-session models, and executive-summary UI.
- **Sparse canonical docs**: several important root docs are empty (`README.md`, `AI_WORKFLOW.md`, `GEMINI.md`).

## 5) Security Architecture Findings

### Critical
- Hardcoded signing secret in config:
  - `package.json` includes `build.win.certificatePassword` in plaintext.

### High
- Sandbox weakening in Electron:
  - `electron.cjs` enables `no-sandbox` and `disable-gpu-sandbox`.
  - `BrowserWindow.webPreferences.webSecurity` is disabled.
- Unconstrained command execution surface:
  - Main process exposes many privileged actions via IPC handlers.
  - Multiple `exec(...)` calls build command strings and run elevated PowerShell with `ExecutionPolicy Bypass`.

### Medium
- External update/activation command flows include remote script launch patterns and shell invocation, increasing supply-chain/abuse blast radius.
- Broad admin-level application model (`requestedExecutionLevel: requireAdministrator`) expands impact of any exploit.

## 6) Performance Architecture Findings

- Large synchronous FS operations are used in hot paths (`readFileSync`, `writeFileSync`, `readdirSync`, `statSync` in `electron.cjs`).
- Main process remains a latency bottleneck because script execution, JSON parsing, and orchestration stay centralized.
- Potential expensive deep clone pattern in evidence engine (`JSON.parse(JSON.stringify(...))`).
- Many features compete on one process thread; risk of UI stalls during diagnostic/remediation runs.

## 7) Recommended Target Architecture (Incremental)

1. Split `electron.cjs` into feature modules:
   - `ipc/system`, `ipc/network`, `ipc/license`, `ipc/office`, `ipc/printer`, `ipc/updater`.
2. Introduce strict IPC contract validation (schema-based allowlist per channel).
3. Move command execution behind a typed `CommandRunner` with sanitized argument APIs (avoid command-string concat).
4. Enable secure defaults:
   - remove `no-sandbox`, enable `webSecurity`, isolate any exceptions to explicit per-window policy.
5. Consolidate duplicate model/component families and migrate CJS engine modules to unified TS interfaces.

## 8) Risk Summary

- **Security risk: High/Critical** (hardcoded certificate password + weakened sandbox + broad privileged IPC).
- **Maintainability risk: High** (very large main process and duplicated domain models).
- **Performance risk: Medium/High** (sync I/O and heavy main-thread orchestration).
