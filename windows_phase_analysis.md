Current Windows Runtime:

Button (`Bắt đầu Quét 8 Bước Windows` in `ActivationScanner.tsx` or similar)
↓
React Component (`ActivationScanner.tsx`)
↓
`onClick` handler (`startWinScan`)
↓
IPC Call (`window.electronAPI.scanActivation({ type: 'windows' })`)
↓
`preload.cjs` (Context Bridge)
↓
`electron.cjs` (`ipcMain.handle('scan-activation', ...)` handler)
↓
Backend (`runPowerShellScript` helper function in `electron.cjs`)
↓
PowerShell Engine (In-memory script execution via `child_process`)
↓
Final Engine (Result returned to UI component for processing)

--------------------------------------------------

| Component | Exists | Referenced | Executed | Production | Dead Code |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Collector | Yes | Yes | Yes | Yes | No |
| Decision | Yes | Yes | Yes | Yes | No |
| `diagnosticPipeline` | Yes | No | No | No | Yes |
| `Confidence` | Yes | No | No | No | Yes |
| `Assessment` | Yes | No | No | No | Yes |
| `Recommendation` | Yes | No | No | No | Yes |

--------------------------------------------------

FINAL CONCLUSION

Current Windows Phase:

Phase: 1.0 (PowerShell Monolith with UI-based Decision Logic)

Reason (max 3 lines):

- The entire data collection process is a single, large PowerShell script executed from `electron.cjs`.
- Decision-making logic (risk scoring, status determination) is implemented directly within the frontend React component (`ActivationScanner.tsx`).
- The JavaScript-based `diagnosticPipeline` and its associated engines (Confidence, Assessment, Recommendation) are not referenced or executed in this flow.
