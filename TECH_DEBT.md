# Technical Debt Register

_Last reviewed: 2026-07-30_

## Prioritization Scale

- **P0**: Critical security/compliance risk
- **P1**: High operational or maintainability risk
- **P2**: Medium productivity/performance risk
- **P3**: Low polish/documentation debt

## Debt Items

### P0-01: Hardcoded certificate password in repository
- **Evidence**: `package.json` contains `build.win.certificatePassword` plaintext.
- **Risk**: Credential leakage, signing-key abuse, supply-chain compromise.
- **Fix**: Move password to secure CI secret / env var; rotate exposed cert/password.

### P0-02: Security hardening disabled in Electron window
- **Evidence**: `electron.cjs` sets `no-sandbox`, `disable-gpu-sandbox`, and `webSecurity: false`.
- **Risk**: Increased exploitability and cross-context attack surface.
- **Fix**: Re-enable secure defaults; gate exceptions per explicit trusted workflow.

### P1-01: Monolithic Electron main process
- **Evidence**: very large `electron.cjs` with many `ipcMain.handle(...)` handlers and system command flows.
- **Risk**: difficult testing, regression-prone changes, weak ownership boundaries.
- **Fix**: extract domain handler modules and shared command service.

### P1-02: Broad privileged command execution surface
- **Evidence**: multiple `exec(...)` patterns with generated command strings and elevated PowerShell (`ExecutionPolicy Bypass`).
- **Risk**: command injection and privilege-abuse potential if inputs are not tightly constrained.
- **Fix**: replace string command assembly with argument-safe wrappers, strict payload validation, allowlisted operations.

### P1-03: Dual architecture overlap (TS core vs JS root pipeline)
- **Evidence**: root-level engines (`assessmentEngine.js`, etc.) parallel to `src/core/**` modules.
- **Risk**: duplicated logic, split ownership, drift.
- **Fix**: declare canonical modules and retire legacy path.

### P2-01: Synchronous filesystem operations in main process
- **Evidence**: `readFileSync`, `writeFileSync`, `readdirSync`, `statSync` in runtime path.
- **Risk**: event-loop blocking, slow UX under load.
- **Fix**: switch to async FS APIs and worker/background orchestration where needed.

### P2-02: Duplicate/placeholder implementations
- **Evidence**:
  - `src/components/ExecutiveSummary.tsx` vs `src/components/windows-diagnostic-workspace/ExecutiveSummary.tsx`
  - `src/core/executor/ExecutionSession.ts` vs `src/core/domain/ExecutionSession.ts` (concept overlap)
  - triplicated `configValidator.js` patterns
- **Risk**: confusion, dead code, inconsistent behavior.
- **Fix**: merge or explicitly mark deprecated/experimental paths.

### P2-03: Mixed test strategy and unclear coverage boundaries
- **Evidence**: both `src/tests` (TS runner) and `test` (CJS runners).
- **Risk**: fragmented quality gates and uneven confidence.
- **Fix**: standardize one test entry strategy and map tests to module ownership.

### P3-01: Empty canonical docs
- **Evidence**: empty `README.md`, `AI_WORKFLOW.md`, `GEMINI.md`.
- **Risk**: onboarding friction and implicit tribal knowledge.
- **Fix**: add minimal onboarding, architecture summary, run/test instructions.

## Duplicated Code / Logic Summary

- Duplicated naming and partial overlap is present in collectors, execution-session models, and executive summary UI.
- Validator logic appears repeated across:
  - `assessment-engine/configValidator.js`
  - `confidence-engine/configValidator.js`
  - `configValidator.js` (empty placeholder currently)
- Collector families indicate probable evolutionary duplication (generic vs `Win*` variants).

## Security Issue Summary

1. Hardcoded secret in `package.json` (**critical**)
2. Disabled sandbox/web security in Electron main window (**high**)
3. Large privileged IPC and command execution surface (**high**)

## Performance Issue Summary

1. Sync I/O in main process (**medium/high**)
2. Heavy orchestration centralized in one process (**medium/high**)
3. Potential expensive clone/graph traversals in diagnostic engines on large evidence sets (**medium**)

## Suggested 30/60/90-Day Debt Paydown

- **30 days**: remove exposed secrets, restore security defaults where possible, add IPC payload validation.
- **60 days**: modularize `electron.cjs`, consolidate duplicate UI/domain artifacts.
- **90 days**: complete architecture convergence (single canonical engine path), unify tests and documentation baseline.
