/**
 * ENTERPRISE EVIDENCE MATRIX ENGINE V1.1 (PHASE 2.1.1 HARDENING)
 * Category: DIAGNOSTIC ENGINE | Module 1 Hardened
 * Description: Production-ready Evidence Matrix featuring Explicit Duplicate Policy, Immutable Evidence Protection, and Comprehensive Matrix Health Metrics.
 * STRICTLY NO DECISION, NO CONFIDENCE, NO ASSESSMENT, NO RECOMMENDATION, NO EXPLANATION.
 */

const DuplicatePolicyEnum = Object.freeze({
  KEEP_FIRST: 'KEEP_FIRST',          // Retains original evidence, audits duplicates
  KEEP_LATEST: 'KEEP_LATEST',        // Overwrites with latest evidence, audits replacement
  STRICT_REJECT: 'STRICT_REJECT',    // Throws exception on duplicate Evidence ID
  AUDIT_ONLY: 'AUDIT_ONLY'           // Keeps duplicate in list, audits conflict
});

class EvidenceMatrix {
  constructor(options = {}) {
    this.matrixVersion = '1.1.0';
    this.duplicatePolicy = options.duplicatePolicy || DuplicatePolicyEnum.KEEP_FIRST;

    this.evidenceList = [];
    this.collectorResults = [];
    
    // O(1) Index Maps
    this.idIndex = new Map();              // Map<evidenceId, EvidenceItem>
    this.collectorIndex = new Map();       // Map<collectorId, EvidenceItem[]>
    this.categoryIndex = new Map();        // Map<category, EvidenceItem[]>
    this.typeIndex = new Map();            // Map<evidenceType, EvidenceItem[]>
    this.sourceIndex = new Map();          // Map<evidenceSource, EvidenceItem[]>
    this.statusIndex = new Map();          // Map<evidenceStatus, EvidenceItem[]>

    this.duplicateAuditLog = [];
    this.lastBuildTime = new Date().toISOString();
  }

  /** Deep clone and freeze helper to guarantee Immutability */
  static _deepFreeze(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    const cloned = JSON.parse(JSON.stringify(obj));
    const freezeDeep = (o) => {
      Object.freeze(o);
      Object.keys(o).forEach(key => {
        if (typeof o[key] === 'object' && o[key] !== null && !Object.isFrozen(o[key])) {
          freezeDeep(o[key]);
        }
      });
      return o;
    };
    return freezeDeep(cloned);
  }

  /**
   * Adds a single CollectorResult and indexes all its EvidenceItems with Duplicate Policy & Immutability Enforcement
   * @param {Object} collectorResult - Result object conforming to Phase 1 CollectorResult schema
   */
  addCollectorResult(collectorResult) {
    if (!collectorResult || typeof collectorResult !== 'object') {
      throw new TypeError('Invalid CollectorResult object provided.');
    }

    const collectorId = collectorResult.collectorId || collectorResult.rawOutput?.collectorName || 'UnknownCollector';
    const raw = collectorResult.rawOutput || collectorResult;
    const evidenceItems = raw.evidenceItems || collectorResult.evidenceItems || [];

    // Defensive copy of collectorResult metadata
    this.collectorResults.push(EvidenceMatrix._deepFreeze(collectorResult));

    if (!this.collectorIndex.has(collectorId)) {
      this.collectorIndex.set(collectorId, []);
    }

    for (const item of evidenceItems) {
      if (!item || typeof item !== 'object') continue;

      const evidenceId = item.evidenceId || `EVD-AUTO-${this.evidenceList.length + 1}`;
      const frozenItem = EvidenceMatrix._deepFreeze(item);

      // Handle Duplicate Policy
      if (this.idIndex.has(evidenceId)) {
        this.duplicateAuditLog.push({
          evidenceId,
          collectorId,
          policyApplied: this.duplicatePolicy,
          timestamp: new Date().toISOString()
        });

        if (this.duplicatePolicy === DuplicatePolicyEnum.STRICT_REJECT) {
          throw new Error(`Duplicate evidenceId detected under STRICT_REJECT policy: [${evidenceId}]`);
        } else if (this.duplicatePolicy === DuplicatePolicyEnum.KEEP_FIRST) {
          continue; // Skip inserting duplicate into primary ID index and list
        } else if (this.duplicatePolicy === DuplicatePolicyEnum.KEEP_LATEST) {
          // Replace existing item in ID index
          this.idIndex.set(evidenceId, frozenItem);
        }
      } else {
        this.idIndex.set(evidenceId, frozenItem);
      }

      this.evidenceList.push(frozenItem);
      this.collectorIndex.get(collectorId).push(frozenItem);

      // Index by Category
      const cat = item.evidenceType || collectorResult.category || 'ENVIRONMENT';
      if (!this.categoryIndex.has(cat)) this.categoryIndex.set(cat, []);
      this.categoryIndex.get(cat).push(frozenItem);

      // Index by Evidence Type
      const type = item.evidenceType || 'GENERIC';
      if (!this.typeIndex.has(type)) this.typeIndex.set(type, []);
      this.typeIndex.get(type).push(frozenItem);

      // Index by Evidence Source
      const source = item.evidenceSource || 'UNKNOWN';
      if (!this.sourceIndex.has(source)) this.sourceIndex.set(source, []);
      this.sourceIndex.get(source).push(frozenItem);

      // Index by Evidence Status
      const status = item.evidenceStatus || 'DATA_PRESENT';
      if (!this.statusIndex.has(status)) this.statusIndex.set(status, []);
      this.statusIndex.get(status).push(frozenItem);
    }

    this.lastBuildTime = new Date().toISOString();
  }

  /** Adds multiple CollectorResults */
  addCollectorResults(collectorResultsArray) {
    if (!Array.isArray(collectorResultsArray)) {
      throw new TypeError('CollectorResults must be an array.');
    }
    for (const res of collectorResultsArray) {
      this.addCollectorResult(res);
    }
  }

  /** O(1) Lookup by Evidence ID (Returns Immutable Object) */
  getEvidenceById(evidenceId) {
    return this.idIndex.get(evidenceId) || null;
  }

  /** Query by Category */
  getEvidenceByCategory(category) {
    return (this.categoryIndex.get(category) || []).slice();
  }

  /** Query by Collector ID */
  getEvidenceByCollector(collectorId) {
    return (this.collectorIndex.get(collectorId) || []).slice();
  }

  /** Query by Evidence Source */
  getEvidenceBySource(source) {
    return (this.sourceIndex.get(source) || []).slice();
  }

  /** Query by Evidence Type */
  getEvidenceByType(type) {
    return (this.typeIndex.get(type) || []).slice();
  }

  /** Get all stored EvidenceItems without mutation risk */
  getAllEvidence() {
    return [...this.evidenceList];
  }

  /** Filters EvidenceItems by criteria */
  filterEvidence({ category, collectorId, evidenceType, evidenceStatus } = {}) {
    return this.evidenceList.filter(item => {
      if (category && item.evidenceType !== category && item.category !== category) return false;
      if (collectorId && !this.getEvidenceByCollector(collectorId).includes(item)) return false;
      if (evidenceType && item.evidenceType !== evidenceType) return false;
      if (evidenceStatus && item.evidenceStatus !== evidenceStatus) return false;
      return true;
    });
  }

  /**
   * Enterprise Matrix Health Metrics Reporting
   */
  getMatrixHealth() {
    const evidenceByCategory = {};
    for (const [cat, items] of this.categoryIndex.entries()) {
      evidenceByCategory[cat] = items.length;
    }

    const evidenceByCollector = {};
    for (const [cid, items] of this.collectorIndex.entries()) {
      evidenceByCollector[cid] = items.length;
    }

    const evidenceBySource = {};
    for (const [src, items] of this.sourceIndex.entries()) {
      evidenceBySource[src] = items.length;
    }

    const evidenceByStatus = {};
    for (const [st, items] of this.statusIndex.entries()) {
      evidenceByStatus[st] = items.length;
    }

    const duplicateCount = this.duplicateAuditLog.length;
    const isHealthy = this.idIndex.size > 0 && duplicateCount === 0;

    return {
      matrixVersion: this.matrixVersion,
      lastBuildTime: this.lastBuildTime,
      duplicatePolicyApplied: this.duplicatePolicy,
      integrityStatus: isHealthy ? 'HEALTHY' : (duplicateCount > 0 ? 'DUPLICATES_AUDITED' : 'EMPTY_MATRIX'),
      totalEvidence: this.evidenceList.length,
      collectorCount: this.collectorResults.length,
      categoryCount: this.categoryIndex.size,
      sourceCount: this.sourceIndex.size,
      typeCount: this.typeIndex.size,
      statusCount: this.statusIndex.size,
      duplicateCount,
      duplicateAuditLog: [...this.duplicateAuditLog],
      indexCount: {
        idIndexSize: this.idIndex.size,
        collectorIndexSize: this.collectorIndex.size,
        categoryIndexSize: this.categoryIndex.size,
        typeIndexSize: this.typeIndex.size,
        sourceIndexSize: this.sourceIndex.size,
        statusIndexSize: this.statusIndex.size
      },
      collectorCoverage: {
        activeCollectors: Object.keys(evidenceByCollector),
        registeredCount: this.collectorResults.length
      },
      breakdown: {
        evidenceByCategory,
        evidenceByCollector,
        evidenceBySource,
        evidenceByStatus
      }
    };
  }

  /** Legacy statistics method mapping to getMatrixHealth */
  getStatistics() {
    return this.getMatrixHealth();
  }

  /** Validates matrix schema and index integrity */
  validateIntegrity() {
    const health = this.getMatrixHealth();
    const isIntegrityValid = health.totalEvidence === this.evidenceList.length;
    return {
      isValid: isIntegrityValid,
      totalEvidenceCount: health.totalEvidence,
      indexedIdCount: health.indexCount.idIndexSize,
      duplicateCount: health.duplicateCount,
      integrityStatus: health.integrityStatus,
      health
    };
  }
}

module.exports = { EvidenceMatrix, DuplicatePolicyEnum };
