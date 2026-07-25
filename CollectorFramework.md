# Enterprise Collector Framework V1 Documentation

## Overview
The **Enterprise Collector Framework V1** is a high-performance, modular evidence collection architecture for the `ThienPhatTechToolkit` Diagnostic Engine. Designed with **Clean Architecture**, **SOLID principles**, and the **Open/Closed Principle**, it decouples evidence collection from diagnostic reasoning.

Adding new collectors in the future requires zero edits to the core Diagnostic Engine.

---

## Complete Collector Lifecycle Sequence

```
+---------------------------------------------------------------------------------------------------+
|                              ENTERPRISE COLLECTOR LIFECYCLE V1                                    |
+---------------------------------------------------------------------------------------------------+
|  1. Register (CollectorRegistry.register)                                                         |
|     - Register collector instance inheriting from BaseCollector                                   |
|                                                                                                   |
|  2. Capability Check (CollectorCapabilityManager.evaluateCapability)                              |
|     - Evaluate OS, Office SKU, WMI, Crypt32, Admin Rights                                        |
|     - Decision: RUN | SKIP | UNSUPPORTED                                                          |
|                                                                                                   |
|  3. Initialize & Context Injection                                                                |
|     - Read Metadata (timeoutMs, requiresAdmin, priority, category)                                |
|                                                                                                   |
|  4. Sandboxed Execution (CollectorPipeline.executePipeline)                                       |
|     - Priority Order (CRITICAL -> HIGH -> MEDIUM -> LOW)                                          |
|     - Enforce timeout via Promise.race                                                            |
|     - Try-Catch isolation (Failing collector logs warning & continues)                             |
|                                                                                                   |
|  5. Evidence Normalization (EvidenceNormalizer)                                                   |
|     - Normalize status -> NORMALIZED_STATES (LICENSED, UNLICENSED, GRACE, EXPIRED, UNKNOWN)       |
|                                                                                                   |
|  6. Audit Log & Matrix Population                                                                 |
|     - Push structured evidence items to EvidenceMatrixBuilder & Audit Log                         |
|                                                                                                   |
|  7. Health Metric Update (CollectorHealthMonitor)                                                 |
|     - Record execution time, error count, success rate %                                          |
|                                                                                                   |
|  8. CollectorResult Generation                                                                    |
|     - Return standardized CollectorResult object to Engine                                        |
+---------------------------------------------------------------------------------------------------+
```

---

## Key Architectural Components

### 1. Collector Capability Manager (`CollectorCapabilityManager`)
Centralized capability detector that evaluates system capabilities before collector execution:
- **Capabilities Tracked**: OS Name, Admin Rights, PowerShell, WMI, WinVerifyTrust/Crypt32, Office SKU/Build, C2R vs MSI, Network state.
- **Evaluation Output**:
  - `RUN`: Collector environment requirements met.
  - `SKIP`: Insufficient privileges or optional capability missing.
  - `UNSUPPORTED`: System environment incompatible (skipped silently without raising error flags).

### 2. Standardized Collector Metadata Schema
All collectors inherit from `BaseCollector` and specify structured metadata:
```javascript
const { BaseCollector, COLLECTOR_CATEGORIES, COLLECTOR_PRIORITIES } = require('./EnterpriseCollectorFramework.cjs');

class CustomRegistryCollector extends BaseCollector {
  constructor() {
    super({
      // Metadata Identity
      collectorId: 'CustomRegistryCollector',
      collectorName: 'Custom Registry Hook Inspection',
      version: '1.0.0',
      author: 'Enterprise Security Team',
      description: 'Inspects HKLM IFEO Debugger hooks for process hijacking',

      // Classification & Weight
      category: COLLECTOR_CATEGORIES.REGISTRY,
      priority: COLLECTOR_PRIORITIES.HIGH,
      confidenceWeight: 20,

      // Performance & Execution Controls
      estimatedExecutionTimeMs: 50,
      timeoutMs: 5000,
      requiresAdmin: false,
      canRunParallel: false, // Flag ready for future parallel execution pipeline

      // Compatibility Declaration
      requires: { powershell: true, wmi: false, winVerifyTrust: false, network: false },
      supportedEnvironment: { os: 'Windows', office: '*', installType: '*' }
    });
  }

  async collect(context) {
    // Gather raw data ONLY (Never draw diagnostic conclusions or modify state)
    return {
      normalizedState: 'LICENSED',
      evidenceItems: [
        {
          componentName: 'Registry Hooks (IFEO Debugger)',
          status: 'PASS',
          dataSource: 'Registry',
          confidenceWeight: 20,
          details: 'No hooks detected'
        }
      ]
    };
  }
}
```

### 3. Collector Categories (`COLLECTOR_CATEGORIES`)
- `LICENSE`: Office & Windows licensing state, keys, OSPP.
- `FILESYSTEM`: System32 DLL signatures, VFS integrity.
- `REGISTRY`: IFEO debugger hooks, AppInit_DLLs.
- `RUNTIME`: Process RAM inspection, loaded modules.
- `SERVICE`: ClickToRun service, sppsvc.
- `SECURITY`: Authenticode signature verification.
- `OFFICE`: ClickToRun configuration, Office build SKU.
- `WINDOWS`: OS version & kernel architecture.
- `NETWORK`: KMS Host DNS resolution & TCP 1688 connectivity.
- `ENVIRONMENT`: User privileges, Admin rights, execution context.
- `CONFIGURATION`: Policy settings, GPO policies.
- `COMPATIBILITY`: Architecture bitness (x86/x64).

### 4. Collector Priorities (`COLLECTOR_PRIORITIES`)
1. `CRITICAL` (1): Critical environment & licensing checks.
2. `HIGH` (2): Security DLL & Registry integrity checks.
3. `MEDIUM` (3): Service health & runtime checks.
4. `LOW` (4): Secondary telemetry & diagnostic information.

---

## Framework Verification & Testing

The framework includes a standalone test suite runner:
```bash
node test/framework/CollectorFrameworkRunner.cjs
```
Verifies 24 guarantees using synthetic mock collectors:
1. `CollectorRegistry` Query & Priority Sorting.
2. `EvidenceNormalizer` state mappings.
3. `CollectorCapabilityManager` evaluation decisions.
4. `CollectorPipeline` sandboxing & crash isolation.
5. Timeout enforcement (`timeoutMs`).
6. `CollectorHealthMonitor` tracking & metrics.
7. `CollectorResult` schema integrity.
