/**
 * ENTERPRISE COLLECTOR FRAMEWORK V1
 * Architecture: Clean Architecture / SOLID / Open-Closed Principle / Architecture Freeze
 * Description: Standardized, decoupled evidence collection framework for Office Diagnostic Engine V3.
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// 1. ENUMS & CONSTANTS
// ============================================================================

const COLLECTOR_CATEGORIES = Object.freeze({
  LICENSE: 'License',
  FILESYSTEM: 'Filesystem',
  REGISTRY: 'Registry',
  RUNTIME: 'Runtime',
  SERVICE: 'Service',
  SECURITY: 'Security',
  OFFICE: 'Office',
  WINDOWS: 'Windows',
  NETWORK: 'Network',
  ENVIRONMENT: 'Environment',
  CONFIGURATION: 'Configuration',
  COMPATIBILITY: 'Compatibility'
});

const COLLECTOR_PRIORITIES = Object.freeze({
  CRITICAL: 1,
  HIGH: 2,
  MEDIUM: 3,
  LOW: 4
});

const NORMALIZED_STATES = Object.freeze({
  LICENSED: 'LICENSED',
  UNLICENSED: 'UNLICENSED',
  GRACE: 'GRACE',
  EXPIRED: 'EXPIRED',
  UNKNOWN: 'UNKNOWN'
});

const CAPABILITY_DECISION = Object.freeze({
  RUN: 'RUN',
  SKIP: 'SKIP',
  UNSUPPORTED: 'UNSUPPORTED'
});

// ============================================================================
// 2. EVIDENCE NORMALIZER
// ============================================================================

class EvidenceNormalizer {
  static normalizeActivationState(input) {
    if (input === true || input === 1) return NORMALIZED_STATES.LICENSED;
    if (input === false || input === 0) return NORMALIZED_STATES.UNLICENSED;
    
    if (typeof input === 'string') {
      const u = input.toUpperCase().trim();
      if (u.includes('LICENSED') && !u.includes('UNLICENSED')) return NORMALIZED_STATES.LICENSED;
      if (u.includes('UNLICENSED') || u.includes('NOT ACTIVATED')) return NORMALIZED_STATES.UNLICENSED;
      if (u.includes('GRACE') || u.includes('TRIAL') || u.includes('EVALUATION')) return NORMALIZED_STATES.GRACE;
      if (u.includes('EXPIRED') || u.includes('OUT_OF_TOLERANCE')) return NORMALIZED_STATES.EXPIRED;
    }

    return NORMALIZED_STATES.UNKNOWN;
  }
}

// ============================================================================
// 3. COLLECTOR CAPABILITY MANAGER
// ============================================================================

class CollectorCapabilityManager {
  static detectCapabilities(context = {}) {
    return {
      osName: context.osName || process.platform,
      adminRights: context.isAdmin !== undefined ? context.isAdmin : true,
      powershellAvailable: context.hasPowerShell !== undefined ? context.hasPowerShell : true,
      wmiAvailable: context.hasWmi !== undefined ? context.hasWmi : true,
      winVerifyTrustAvailable: context.hasAuthenticode !== undefined ? context.hasAuthenticode : true,
      officeInstalled: context.officeInstalled !== undefined ? context.officeInstalled : true,
      installType: context.installType || 'ClickToRun',
      networkConnected: context.hasNetwork !== undefined ? context.hasNetwork : true
    };
  }

  static evaluateCapability(collector, context = {}) {
    if (!collector || !collector.enabled) return CAPABILITY_DECISION.SKIP;

    const capabilities = this.detectCapabilities(context);

    // Admin requirement check
    if (collector.requiresAdmin && !capabilities.adminRights) {
      return CAPABILITY_DECISION.SKIP;
    }

    // System requirements check
    if (collector.requires) {
      if (collector.requires.powershell && !capabilities.powershellAvailable) return CAPABILITY_DECISION.UNSUPPORTED;
      if (collector.requires.wmi && !capabilities.wmiAvailable) return CAPABILITY_DECISION.UNSUPPORTED;
      if (collector.requires.winVerifyTrust && !capabilities.winVerifyTrustAvailable) return CAPABILITY_DECISION.UNSUPPORTED;
      if (collector.requires.network && !capabilities.networkConnected) return CAPABILITY_DECISION.SKIP;
    }

    // Supported environment check
    if (collector.supportedEnvironment) {
      if (collector.supportedEnvironment.installType && collector.supportedEnvironment.installType !== '*' && collector.supportedEnvironment.installType !== capabilities.installType) {
        return CAPABILITY_DECISION.UNSUPPORTED;
      }
    }

    return CAPABILITY_DECISION.RUN;
  }
}

// ============================================================================
// 4. BASE COLLECTOR (ICOLLECTOR INTERFACE WITH METADATA)
// ============================================================================

class BaseCollector {
  constructor(options = {}) {
    if (new.target === BaseCollector) {
      throw new TypeError('Cannot construct BaseCollector abstract instances directly.');
    }
    
    // Core Identity
    this.collectorId = options.collectorId || this.constructor.name;
    this.collectorName = options.collectorName || 'Unnamed Collector';
    this.version = options.version || '1.0.0';
    this.author = options.author || 'Enterprise Engineering Team';
    this.description = options.description || 'Standard Enterprise Collector';

    // Classification & Weight
    this.category = options.category || COLLECTOR_CATEGORIES.ENVIRONMENT;
    this.priority = options.priority || COLLECTOR_PRIORITIES.MEDIUM;
    this.confidenceWeight = options.confidenceWeight || 10;

    // Performance & Execution Controls
    this.estimatedExecutionTimeMs = options.estimatedExecutionTimeMs || 100;
    this.timeoutMs = options.timeoutMs || 5000;
    this.requiresAdmin = options.requiresAdmin || false;
    this.canRunParallel = options.canRunParallel !== undefined ? options.canRunParallel : false;

    // Compatibility & Flags
    this.requires = options.requires || { powershell: false, wmi: false, winVerifyTrust: false, network: false };
    this.supportedEnvironment = options.supportedEnvironment || { os: 'Windows', office: '*', installType: '*' };
    this.enabled = options.enabled !== undefined ? options.enabled : true;
    this.deprecated = options.deprecated || false;
    this.experimental = options.experimental || false;
  }

  isSupported(context = {}) {
    const decision = CollectorCapabilityManager.evaluateCapability(this, context);
    return decision === CAPABILITY_DECISION.RUN;
  }

  /**
   * Abstract collect method to gather raw evidence
   * Must be implemented by concrete collectors
   */
  async collect(context = {}) {
    throw new Error(`Collector [${this.collectorId}] must implement collect(context) method.`);
  }
}

// ============================================================================
// 5. COLLECTOR RESULT & HEALTH MONITOR
// ============================================================================

class CollectorResult {
  constructor(data = {}) {
    this.collectorId = data.collectorId || 'Unknown';
    this.collectorName = data.collectorName || 'Unknown';
    this.category = data.category || COLLECTOR_CATEGORIES.ENVIRONMENT;
    this.success = data.success !== undefined ? data.success : true;
    this.confidenceWeight = data.confidenceWeight || 10;
    this.executionTimeMs = data.executionTimeMs || 0;
    this.evidence = data.evidence || [];
    this.rawOutput = data.rawOutput || null;
    this.normalizedOutput = data.normalizedOutput || null;
    this.warnings = data.warnings || [];
    this.errors = data.errors || [];
    this.timestamp = new Date().toISOString();
  }
}

class CollectorHealthMonitor {
  constructor() {
    this.metrics = new Map();
  }

  recordExecution(collectorId, success, executionTimeMs, error = null) {
    if (!this.metrics.has(collectorId)) {
      this.metrics.set(collectorId, {
        totalExecutions: 0,
        successes: 0,
        failures: 0,
        totalTimeMs: 0,
        avgTimeMs: 0,
        lastError: null,
        lastSuccessTimestamp: null
      });
    }

    const m = this.metrics.get(collectorId);
    m.totalExecutions += 1;
    m.totalTimeMs += executionTimeMs;
    m.avgTimeMs = Math.round(m.totalTimeMs / m.totalExecutions);

    if (success) {
      m.successes += 1;
      m.lastSuccessTimestamp = new Date().toISOString();
    } else {
      m.failures += 1;
      m.lastError = error ? (typeof error === 'string' ? error : error.message) : 'Unknown error';
    }
  }

  getMetrics(collectorId) {
    return this.metrics.get(collectorId) || null;
  }

  getAllMetrics() {
    const result = {};
    for (const [id, metric] of this.metrics.entries()) {
      result[id] = {
        ...metric,
        successRatePercentage: metric.totalExecutions > 0 ? Math.round((metric.successes / metric.totalExecutions) * 100) : 0
      };
    }
    return result;
  }
}

// ============================================================================
// 6. COLLECTOR REGISTRY
// ============================================================================

class CollectorRegistry {
  constructor() {
    this.collectors = new Map();
  }

  register(collector) {
    if (!(collector instanceof BaseCollector)) {
      throw new TypeError('Collector must inherit from BaseCollector.');
    }
    this.collectors.set(collector.collectorId, collector);
  }

  unregister(collectorId) {
    return this.collectors.delete(collectorId);
  }

  getCollector(collectorId) {
    return this.collectors.get(collectorId) || null;
  }

  enableCollector(collectorId) {
    const c = this.collectors.get(collectorId);
    if (c) c.enabled = true;
  }

  disableCollector(collectorId) {
    const c = this.collectors.get(collectorId);
    if (c) c.enabled = false;
  }

  getCollectors({ category = null, maxPriority = 999, context = {} } = {}) {
    const list = Array.from(this.collectors.values()).filter(c => {
      const decision = CollectorCapabilityManager.evaluateCapability(c, context);
      if (decision !== CAPABILITY_DECISION.RUN) return false;
      if (category && c.category !== category) return false;
      if (c.priority > maxPriority) return false;
      return true;
    });

    // Sort by priority (CRITICAL = 1 first)
    return list.sort((a, b) => a.priority - b.priority);
  }
}

// ============================================================================
// 7. COLLECTOR PIPELINE WITH SANDBOX & TIMEOUT ENFORCEMENT
// ============================================================================

class CollectorPipeline {
  constructor(registry, healthMonitor) {
    this.registry = registry;
    this.healthMonitor = healthMonitor || new CollectorHealthMonitor();
  }

  async executePipeline(context = {}, matrixBuilder = null, auditLog = null) {
    const collectors = this.registry.getCollectors({ context });
    const results = [];

    for (const collector of collectors) {
      const startTime = Date.now();
      let success = false;
      let result = null;

      try {
        // Enforce Timeout via Promise.race
        const timeoutMs = collector.timeoutMs || 5000;
        const collectPromise = collector.collect(context);
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`Collector [${collector.collectorId}] timed out after ${timeoutMs}ms`)), timeoutMs);
        });

        const rawOutput = await Promise.race([collectPromise, timeoutPromise]);
        const executionTimeMs = Date.now() - startTime;
        success = true;

        result = new CollectorResult({
          collectorId: collector.collectorId,
          collectorName: collector.collectorName,
          category: collector.category,
          success: true,
          confidenceWeight: collector.confidenceWeight,
          executionTimeMs,
          rawOutput,
          normalizedOutput: rawOutput?.normalizedState || null,
          evidence: rawOutput?.evidence || [],
          warnings: rawOutput?.warnings || [],
          errors: []
        });

        // Push Evidence to MatrixBuilder & AuditLog if provided
        if (matrixBuilder && rawOutput && rawOutput.evidenceItems) {
          for (const item of rawOutput.evidenceItems) {
            matrixBuilder.addEvidence(
              item.componentName || collector.collectorName,
              item.status || 'PASS',
              item.dataSource || collector.category,
              item.confidenceWeight !== undefined ? item.confidenceWeight : collector.confidenceWeight,
              item.details || 'Collected'
            );
          }
        }

        if (auditLog) {
          auditLog.log(
            collector.collectorId,
            collector.category,
            rawOutput,
            collector.confidenceWeight,
            `Successfully executed ${collector.collectorName} in ${executionTimeMs}ms`
          );
        }

      } catch (err) {
        const executionTimeMs = Date.now() - startTime;
        success = false;

        result = new CollectorResult({
          collectorId: collector.collectorId,
          collectorName: collector.collectorName,
          category: collector.category,
          success: false,
          confidenceWeight: collector.confidenceWeight,
          executionTimeMs,
          errors: [err.message]
        });

        if (auditLog) {
          auditLog.log(
            collector.collectorId,
            collector.category,
            null,
            0,
            `WARNING: Collector ${collector.collectorName} failed: ${err.message}`
          );
        }
      }

      this.healthMonitor.recordExecution(collector.collectorId, success, result.executionTimeMs, result.errors[0]);
      results.push(result);
    }

    return {
      results,
      healthMetrics: this.healthMonitor.getAllMetrics(),
      timestamp: new Date().toISOString()
    };
  }
}

// Export Framework Components
module.exports = {
  COLLECTOR_CATEGORIES,
  COLLECTOR_PRIORITIES,
  NORMALIZED_STATES,
  CAPABILITY_DECISION,
  EvidenceNormalizer,
  CollectorCapabilityManager,
  BaseCollector,
  CollectorResult,
  CollectorHealthMonitor,
  CollectorRegistry,
  CollectorPipeline
};
