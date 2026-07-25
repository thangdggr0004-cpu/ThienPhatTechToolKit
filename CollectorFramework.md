# Enterprise Collector Framework V1 Documentation

## Overview
The **Enterprise Collector Framework V1** is a high-performance, modular evidence collection architecture for the `ThienPhatTechToolkit` Diagnostic Engine. Designed with **Clean Architecture**, **SOLID principles**, and the **Open/Closed Principle**, it decouples evidence collection from diagnostic reasoning.

Adding new collectors in the future requires zero edits to the core Diagnostic Engine.

---

## Key Architectural Components

```
+-----------------------------------------------------------------------------------+
|                            COLLECTOR PIPELINE V1                                  |
+-----------------------------------------------------------------------------------+
|  1. Initialize (Context & System Discovery)                                       |
|  2. Registry Query (Active Collectors sorted by Priority & Environment)            |
|  3. Compatibility Check (Skip unsupported collectors silently)                     |
|  4. Isolated Execution (Try-Catch sandbox per Collector; record health metrics)    |
|  5. Evidence Normalization (Standardize raw states -> Normal Enums)               |
|  6. Matrix Builder & Audit Log Insertion                                          |
+-----------------------------------------------------------------------------------+
```

### 1. `ICollector` Interface (`BaseCollector`)
All collectors inherit from `BaseCollector` and implement the abstract `collect(context)` method:
```javascript
const { BaseCollector, COLLECTOR_CATEGORIES, COLLECTOR_PRIORITIES } = require('./EnterpriseCollectorFramework.cjs');

class CustomRegistryCollector extends BaseCollector {
  constructor() {
    super({
      collectorId: 'CustomRegistryCollector',
      collectorName: 'Custom Registry Hook Inspection',
      category: COLLECTOR_CATEGORIES.REGISTRY,
      priority: COLLECTOR_PRIORITIES.HIGH,
      confidenceWeight: 20,
      version: '1.0.0'
    });
  }

  async collect(context) {
    // Gather raw data ONLY (Never draw diagnostic conclusions or modify state)
    return {
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

### 2. Collector Categories (`COLLECTOR_CATEGORIES`)
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

### 3. Collector Priorities (`COLLECTOR_PRIORITIES`)
1. `CRITICAL` (1): Critical environment & licensing checks.
2. `HIGH` (2): Security DLL & Registry integrity checks.
3. `MEDIUM` (3): Service health & runtime checks.
4. `LOW` (4): Secondary telemetry & diagnostic information.

### 4. Collector Pipeline Execution & Sandboxing
The `CollectorPipeline` executes registered collectors in priority order:
- **Sandbox Isolation**: If a collector throws an unhandled error, the pipeline catches it, logs a warning to the Audit Log, records health metrics, and continues to the next collector.
- **Environment Compatibility**: If `isSupported(context)` returns false, the collector is skipped silently without raising error flags.

---

## Coding Rules & Best Practices

1. **Non-Destructive**: Collectors must NEVER alter files, Registry keys, or system services.
2. **Pure Data Gathering**: Collectors MUST NOT draw final repair/recovery decisions. They only supply objective evidence items.
3. **Graceful Degradation**: Always handle internal exceptions inside `collect(context)` and return structured result objects with warnings if data is partially available.
4. **Normalized Output**: Use `EvidenceNormalizer.normalizeActivationState()` to sanitize activation status values.
