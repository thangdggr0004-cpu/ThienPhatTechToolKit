# Project Structure Report

_Last reviewed: 2026-07-30_

## 1) Repository Snapshot

- Primary stack: Electron + React + TypeScript + Vite.
- Source-heavy directories:
  - `src` (~179 files)
  - `test` (8 files)
- Main process entry: `electron.cjs`
- Renderer entry: `src/main.tsx`
- Preload bridge: `preload.cjs`

## 2) High-Level Tree (Focused)

```text
.
├─ src/
│  ├─ components/                # UI features/screens
│  ├─ context/                   # React contexts
│  ├─ core/                      # Domain, executor, registry, orchestration
│  ├─ infrastructure/ipc/        # IPC abstractions/adapters
│  ├─ collectors/                # System evidence collectors
│  ├─ engine/                    # Evidence matrix/correlation/decision engines
│  ├─ services/                  # Service-level orchestration
│  ├─ scripts/                   # PowerShell helper scripts
│  ├─ tests/                     # TS-level tests
│  └─ utils/
├─ test/                         # Additional CJS test runners
├─ docs/                         # Extra process docs
├─ public/                       # Static assets
├─ electron.cjs                  # Electron main process
├─ preload.cjs                   # Context bridge
├─ main.js                       # Legacy/parallel runtime script
├─ assessmentEngine.js           # Root-level scoring logic
├─ confidenceEngine.js           # Root-level confidence logic
├─ recommendationEngine.js       # Root-level recommendation logic
├─ diagnosticPipeline.js         # Root-level pipeline composition
└─ *.config.json                 # Behavior/config packs
```

## 3) Folder-by-Folder Observations

- `src/components` (37 files): feature-rich UI, some very large components and duplicated placeholders.
- `src/core` (80 files): strongest modular structure; contains domain/executor abstractions but overlaps with root-level JS orchestration.
- `src/infrastructure/ipc` (14 files): good separation intent for IPC contracts.
- `src/collectors` (16 files): appears to include both legacy and Windows-specific collector variants.
- `src/engine` (3 files): compact but central to diagnostic logic.
- `src/tests` (18 files) + `test` (8 files): mixed test style (TS + CJS runners).

## 4) Structural Inconsistencies

1. **Dual architecture roots**
   - Modular TS tree in `src/core/**` vs root-level JS/CJS pipeline files.

2. **Duplicate concept namespaces**
   - Execution session in:
     - `src/core/executor/ExecutionSession.ts` (class)
     - `src/core/domain/ExecutionSession.ts` (interface)
   - Executive summary in:
     - `src/components/ExecutiveSummary.tsx` (real implementation)
     - `src/components/windows-diagnostic-workspace/ExecutiveSummary.tsx` (placeholder)

3. **Collector overlap**
   - Pairs like `LicenseCollector.cjs` and `WinLicenseCollector.cjs`, etc. suggest migration in progress without consolidation.

4. **Root artifacts not production-critical**
   - Multiple scripts/audit notes and empty markdown files in root reduce discoverability of canonical docs.

## 5) Code Quality Assessment (Structure-Oriented)

### Positive
- Good intent toward domain-driven separation in `src/core`.
- Dedicated IPC abstractions instead of direct renderer coupling.
- Presence of test datasets and runner files.

### Weak points
- Oversized `electron.cjs` creates maintenance/ownership bottleneck.
- Inconsistent module systems (`.ts/.tsx` + `.js` + `.cjs`) in active runtime paths.
- Documentation entry points are incomplete (e.g. empty `README.md`).

## 6) Suggested Structure Cleanup Plan

1. Define one canonical architecture path (`src/core` + feature modules) and deprecate parallel root JS runtime utilities.
2. Split `electron.cjs` into foldered handlers by domain.
3. Consolidate duplicate collector families into one normalized interface.
4. Collapse placeholder duplicates or move placeholders to explicit `draft/` or `experimental/` scope.
5. Move operational/audit scratch files into `docs/archive/` and keep root focused.
