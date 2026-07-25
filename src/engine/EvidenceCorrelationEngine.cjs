/**
 * ENTERPRISE EVIDENCE CORRELATION ENGINE V1.0 (PHASE 2.2)
 * Category: DIAGNOSTIC ENGINE | Module 2
 * Description: Reads EvidenceMatrix and builds a Correlated Evidence Graph with Nodes, Links, and Descriptive Relationship Types.
 * STRICTLY NO DECISION, NO CONFIDENCE, NO ASSESSMENT, NO RECOMMENDATION, NO EXPLANATION.
 * READ-ONLY INTERACTION WITH EVIDENCE MATRIX.
 */

const RelationshipTypeEnum = Object.freeze({
  MATCH: 'MATCH',                           // Technical parity between evidence items
  PARTIAL_MATCH: 'PARTIAL_MATCH',           // Partial key or sub-component match
  RELATED: 'RELATED',                       // Domain/functional relationship (e.g., SPP service to Token Store)
  CONFLICT: 'CONFLICT',                     // Discrepancy between evidence items (e.g., KMS host set while OEM key in BIOS)
  DEPENDENCY: 'DEPENDENCY',                 // Functional dependency (e.g., Authenticode trust depends on DLL file)
  MISSING_REFERENCE: 'MISSING_REFERENCE'    // Reference configured but target component absent
});

class CorrelatedEvidenceGraph {
  constructor(options = {}) {
    this.graphVersion = '1.0.0';
    this.nodes = new Map();              // Map<evidenceId, { evidenceId, evidenceItem }>()
    this.links = [];                     // Array<EvidenceLink>
    
    // Fast Traversal Adjacency Index Maps
    this.adjacencyMap = new Map();       // Map<evidenceId, EvidenceLink[]>()
    this.typeIndex = new Map();          // Map<relationshipType, EvidenceLink[]>()

    this.createdTime = new Date().toISOString();
  }

  /** Adds an Evidence Node (Read-Only Reference) */
  addNode(evidenceItem) {
    if (!evidenceItem || !evidenceItem.evidenceId) return;
    const id = evidenceItem.evidenceId;
    if (!this.nodes.has(id)) {
      this.nodes.set(id, Object.freeze({
        evidenceId: id,
        evidenceType: evidenceItem.evidenceType,
        evidenceSource: evidenceItem.evidenceSource,
        evidenceItem: Object.freeze(evidenceItem) // Read-only reference
      }));
      this.adjacencyMap.set(id, []);
    }
  }

  /**
   * Creates a descriptive directional link between two Evidence Nodes
   */
  addLink({ sourceEvidenceId, targetEvidenceId, relationshipType, relationshipReason, relationshipStrength = 1.0, relationshipMetadata = {} }) {
    if (!this.nodes.has(sourceEvidenceId) || !this.nodes.has(targetEvidenceId)) {
      return null;
    }

    const linkId = `LINK-${sourceEvidenceId}->${targetEvidenceId}-${relationshipType}`;
    
    // Duplicate Link Prevention
    const existing = this.adjacencyMap.get(sourceEvidenceId) || [];
    if (existing.some(l => l.linkId === linkId)) {
      return null;
    }

    const link = Object.freeze({
      linkId,
      sourceEvidenceId,
      targetEvidenceId,
      relationshipType,
      relationshipReason: relationshipReason || 'Technical correlation established',
      relationshipStrength: Math.min(Math.max(relationshipStrength, 0.0), 1.0),
      relationshipMetadata: Object.freeze({ ...relationshipMetadata }),
      timestamp: new Date().toISOString()
    });

    this.links.push(link);
    this.adjacencyMap.get(sourceEvidenceId).push(link);

    // Also index target for bidirectional neighbor lookup
    if (!this.adjacencyMap.has(targetEvidenceId)) {
      this.adjacencyMap.set(targetEvidenceId, []);
    }
    this.adjacencyMap.get(targetEvidenceId).push(link);

    // Index by Relationship Type
    if (!this.typeIndex.has(relationshipType)) {
      this.typeIndex.set(relationshipType, []);
    }
    this.typeIndex.get(relationshipType).push(link);

    return link;
  }

  /** Gets an Evidence Node by Evidence ID */
  getNode(evidenceId) {
    return this.nodes.get(evidenceId) || null;
  }

  /** Gets all links associated with an Evidence ID */
  getLinks(evidenceId) {
    return (this.adjacencyMap.get(evidenceId) || []).slice();
  }

  /** Gets all neighbor node IDs for a given Evidence ID */
  getNeighbors(evidenceId) {
    const links = this.getLinks(evidenceId);
    const neighborIds = new Set();
    for (const link of links) {
      if (link.sourceEvidenceId === evidenceId) neighborIds.add(link.targetEvidenceId);
      if (link.targetEvidenceId === evidenceId) neighborIds.add(link.sourceEvidenceId);
    }
    return Array.from(neighborIds).map(id => this.getNode(id)).filter(Boolean);
  }

  /** Finds direct links between source and target Evidence IDs */
  findRelationships(sourceId, targetId) {
    const links = this.getLinks(sourceId);
    return links.filter(l => (l.sourceEvidenceId === sourceId && l.targetEvidenceId === targetId) ||
                             (l.sourceEvidenceId === targetId && l.targetEvidenceId === sourceId));
  }

  /** Query links by Relationship Type */
  findByRelationshipType(relationshipType) {
    return (this.typeIndex.get(relationshipType) || []).slice();
  }

  /**
   * Enterprise Graph Health & Topology Report
   */
  getGraphHealth() {
    const orphanEvidence = [];
    for (const [id] of this.nodes.entries()) {
      const links = this.adjacencyMap.get(id) || [];
      if (links.length === 0) {
        orphanEvidence.push(id);
      }
    }

    const relationshipTypesCount = {};
    for (const [type, links] of this.typeIndex.entries()) {
      relationshipTypesCount[type] = links.length;
    }

    return {
      graphVersion: this.graphVersion,
      createdTime: this.createdTime,
      graphIntegrity: this.nodes.size > 0 ? 'HEALTHY' : 'EMPTY_GRAPH',
      nodeCount: this.nodes.size,
      linkCount: this.links.length,
      relationshipCount: this.links.length,
      orphanCount: orphanEvidence.length,
      orphanEvidence,
      relationshipTypesCount,
      indexStats: {
        adjacencyMapSize: this.adjacencyMap.size,
        typeIndexSize: this.typeIndex.size
      }
    };
  }

  getGraphStatistics() {
    return this.getGraphHealth();
  }
}

class EvidenceCorrelationEngine {
  constructor() {
    this.engineVersion = '1.0.0';
  }

  /**
   * Reads EvidenceMatrix and builds a CorrelatedEvidenceGraph
   * @param {EvidenceMatrix} evidenceMatrix - Phase 2.1 EvidenceMatrix instance
   */
  buildGraph(evidenceMatrix) {
    if (!evidenceMatrix || typeof evidenceMatrix.getAllEvidence !== 'function') {
      throw new TypeError('Invalid EvidenceMatrix instance provided to Correlation Engine.');
    }

    const graph = new CorrelatedEvidenceGraph();
    const allEvidence = evidenceMatrix.getAllEvidence();

    // Step 1: Add all EvidenceItems as Graph Nodes
    for (const item of allEvidence) {
      graph.addNode(item);
    }

    // Step 2: Establish Technical Correlations (Descriptive Only - NO INFERENCE / NO DECISION)
    const biosItems = evidenceMatrix.getEvidenceByCategory('FIRMWARE');
    const licenseItems = evidenceMatrix.getEvidenceByCategory('LICENSE');
    const authItems = evidenceMatrix.getEvidenceByCategory('SECURITY');
    const regItems = evidenceMatrix.getEvidenceByCategory('REGISTRY');
    const svcItems = evidenceMatrix.getEvidenceByCategory('SERVICE');
    const sppItems = evidenceMatrix.getEvidenceByCategory('ENVIRONMENT');

    // Correlation 1: BIOS OEM Key vs WMI License SKU / Channel
    for (const bios of biosItems) {
      for (const lic of licenseItems) {
        const biosVal = bios.evidenceValue || {};
        const licVal = lic.evidenceValue || {};

        if (biosVal.msdmPresent && licVal.productKeyChannel) {
          const isMatch = biosVal.editionMatch === 'MATCH' || licVal.productKeyChannel.includes('OEM');
          graph.addLink({
            sourceEvidenceId: bios.evidenceId,
            targetEvidenceId: lic.evidenceId,
            relationshipType: isMatch ? RelationshipTypeEnum.MATCH : RelationshipTypeEnum.CONFLICT,
            relationshipReason: isMatch
              ? 'ACPI MSDM OEM BIOS Key correlates with WMI License Channel'
              : 'ACPI MSDM OEM BIOS Key differs from active WMI License Channel',
            relationshipStrength: 0.9,
            relationshipMetadata: { biosChannel: biosVal.oemChannel, licChannel: licVal.productKeyChannel }
          });
        }
      }
    }

    // Correlation 2: System DLL Authenticode Trust vs Licensing Services
    for (const auth of authItems) {
      for (const svc of svcItems) {
        graph.addLink({
          sourceEvidenceId: auth.evidenceId,
          targetEvidenceId: svc.evidenceId,
          relationshipType: RelationshipTypeEnum.DEPENDENCY,
          relationshipReason: 'Licensing service binary integrity depends on System DLL Authenticode trust',
          relationshipStrength: 0.8,
          relationshipMetadata: { signatureStatus: auth.evidenceValue?.signatureStatus, serviceName: svc.evidenceName }
        });
      }
    }

    // Correlation 3: SPP Service State vs SPP Token Store File
    for (const spp of sppItems) {
      for (const reg of regItems) {
        graph.addLink({
          sourceEvidenceId: spp.evidenceId,
          targetEvidenceId: reg.evidenceId,
          relationshipType: RelationshipTypeEnum.RELATED,
          relationshipReason: 'Software Protection Platform token store relates to Registry KMS configurations',
          relationshipStrength: 0.75,
          relationshipMetadata: { tokenStorePath: spp.evidenceValue?.tokenStorePath }
        });
      }
    }

    return graph;
  }
}

module.exports = { EvidenceCorrelationEngine, CorrelatedEvidenceGraph, RelationshipTypeEnum };
