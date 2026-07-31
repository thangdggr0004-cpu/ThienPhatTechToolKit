# Diagnostic Utilities — Licensing Evidence Proof

## Purpose
`proof_diagnostic.ps1` is a standalone, read-only PowerShell diagnostic utility designed for developers and IT technicians to inspect raw Windows licensing evidence (WMI attributes, Registry entries, Hosts file redirects, and Event Log entries) without running the full Electron UI application.

---

## How to Run

Open PowerShell (Elevated / Administrator recommended) and execute:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/diagnostics/proof_diagnostic.ps1
```

---

## Example Output

```json
{
  "Windows": {
    "LicenseStatus": 1,
    "PartialProductKey": "3V66T",
    "KeyManagementServiceMachine": null,
    "KeyManagementServicePort": null,
    "GracePeriodRemaining": 0,
    "OA3Key": "XXXXX-XXXXX-XXXXX-XXXXX-XXXXX",
    "HasOA3Key": true,
    "Xpr": "Windows(R), Professional edition: The machine is permanently activated."
  },
  "System": {
    "IsFakeKMS": false,
    "IsKMS38": false,
    "MasHistory": false,
    "NoGenTicket": false,
    "KMSEvents": [],
    "HostsRedirects": [],
    "IsKMS38_Reason": ""
  }
}
```

---

## When Technicians Should Use It
- **Root Cause Analysis:** Verify raw evidence when investigation requires inspecting raw system values outside the graphical interface.
- **False Positive Verification:** Prove whether a specific system flag (`IsKMS38`, `MasHistory`, `NoGenTicket`) triggers under native OS conditions.
- **Offline Technical Audit:** Generate compact JSON evidence reports for offline review.
