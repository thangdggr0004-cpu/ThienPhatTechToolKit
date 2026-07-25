/**
 * ENTERPRISE EVIDENCE MATRIX ENGINE V1.0 (PHASE 2.1)
 * Category: DIAGNOSTIC ENGINE | Module 1
 * Description: Stores, indexes, queries, filters, and generates statistics for raw EvidenceItems from CollectorResult[].
 * STRICTLY NO DECISION, NO CONFIDENCE, NO ASSESSMENT, NO RECOMMENDATION, NO EXPLANATION.
 * READ-ONLY INTERACTION WITH COLLECTOR RESULTS.
 */

class EvidenceMatrix {
  constructor() {
    this.evidenceList = [];
    this.collectorResults = [];
    
    // O(1) Index Maps
    this.idIndex = new Map();              // Map<evidenceId, EvidenceItem>
    this.collectorIndex = new Map();       // Map<collectorId, EvidenceItem[]>
    this.categoryIndex = new Map();        // Map<category, EvidenceItem[]>
    this.typeIndex = new Map();            // Map<evidenceType, EvidenceItem[]>
    this.sourceIndex = new Map();          // Map<evidenceSource, EvidenceItem[]>
    this.statusIndex = new Map();          // Map<evidenceStatus, EvidenceItem[]>

    this.duplicateIdsDetected = [];
  }

  /**
   * Adds a single CollectorResult and indexes all its EvidenceItems
   * @param {Object} collectorResult - Result object conforming to Phase 1 CollectorResult schema
   */
  addCollectorResult(collectorResult) {
    if (!collectorResult || typeof collectorResult !== 'object') {
      throw new TypeError('Invalid CollectorResult object provided.');
    }

    const collectorId = collectorResult.collectorId || collectorResult.rawOutput?.collectorName || 'UnknownCollector';
    const raw = collectorResult.rawOutput || collectorResult;
    const evidenceItems = raw.evidenceItems || collectorResult.evidenceItems || [];

    this.collectorResults.push(collectorResult);

    if (!this.collectorIndex.has(collectorId)) {
      this.collectorIndex.set(collectorId, []);
    }

    for (const item of evidenceItems) {
      if (!item || typeof item !== 'object') continue;

      // DO NOT MODIFY OR RE-NORMALIZE EVIDENCE ITEM
      const evidenceId = item.evidenceId || `EVD-AUTO-${this.evidenceList.length + 1}`;
      
      // Duplicate ID Detection
      if (this.idIndex.has(evidenceId)) {
        this.duplicateIdsDetected.push(evidenceId);
      } else {
        this.idIndex.set(evidenceId, item);
      }

      this.evidenceList.push(item);
      this.collectorIndex.get(collectorId).push(item);

      // Index by Category
      const cat = item.evidenceType || collectorResult.category || 'ENVIRONMENT';
      if (!this.categoryIndex.has(cat)) this.categoryIndex.set(cat, []);
      this.categoryIndex.get(cat).push(item);

      // Index by Evidence Type
      const type = item.evidenceType || 'GENERIC';
      if (!this.typeIndex.has(type)) this.typeIndex.set(type, []);
      this.typeIndex.get(type).push(item);

      // Index by Evidence Source
      const source = item.evidenceSource || 'UNKNOWN';
      if (!this.sourceIndex.has(source)) this.sourceIndex.set(source, []);
      this.sourceIndex.get(source).push(item);

      // Index by Evidence Status
      const status = item.evidenceStatus || 'DATA_PRESENT';
      if (!this.statusIndex.has(status)) this.statusIndex.set(status, []);
      this.statusIndex.get(status).push(item);
    }
  }

  /**
   * Adds multiple CollectorResults at once
   * @param {Array} collectorResultsArray 
   */
  addCollectorResults(collectorResultsArray) {
    if (!Array.isArray(collectorResultsArray)) {
      throw new TypeError('CollectorResults must be an array.');
    }
    for (const res of collectorResultsArray) {
      this.addCollectorResult(res);
    }
  }

  /** O(1) Lookup by Evidence ID */
  getEvidenceById(evidenceId) {
    return this.idIndex.get(evidenceId) || null;
  }

  /** Query by Category */
  getEvidenceByCategory(category) {
    return this.categoryIndex.get(category) || [];
  }

  /** Query by Collector ID */
  getEvidenceByCollector(collectorId) {
    return this.collectorIndex.get(collectorId) || [];
  }

  /** Query by Evidence Source */
  getEvidenceBySource(source) {
    return this.sourceIndex.get(source) || [];
  }

  /** Query by Evidence Type */
  getEvidenceByType(type) {
    return this.typeIndex.get(type) || [];
  }

  /** Get all stored EvidenceItems without mutation */
  getAllEvidence() {
    return [...this.evidenceList];
  }

  /**
   * Filters EvidenceItems by criteria
   * @param {Object} criteria - { category, collectorId, evidenceType, evidenceStatus }
   */
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
   * Generates comprehensive statistics on stored evidence
   */
  getStatistics() {
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

    return {
      totalEvidence: this.evidenceList.length,
      totalCollectors: this.collectorResults.length,
      duplicateIdsDetectedCount: this.duplicateIdsDetected.length,
      duplicateIds: [...this.duplicateIdsDetected],
      evidenceByCategory,
      evidenceByCollector,
      evidenceBySource,
      evidenceByStatus
    };
  }

  /**
   * Validates matrix schema and index integrity
   */
  validateIntegrity() {
    const stats = this.getStatistics();
    const isIntegrityValid = stats.totalEvidence === this.evidenceList.length;
    return {
      isValid: isIntegrityValid,
      totalEvidenceCount: stats.totalEvidence,
      indexedIdCount: this.idIndex.size,
      duplicateCount: stats.duplicateIdsDetectedCount,
      indexCounts: {
        categoryCount: this.categoryIndex.size,
        collectorCount: this.collectorIndex.size,
        typeCount: this.typeIndex.size,
        sourceCount: this.sourceIndex.size,
        statusCount: this.statusIndex.size
      }
    };
  }
}

module.exports = { EvidenceMatrix };
