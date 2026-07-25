/**
 * ENTERPRISE EVIDENCE CORRELATION ENGINE V1.1 (PHASE 2.2.1 HARDENING)
 * Category: DIAGNOSTIC ENGINE | Module 2 Hardened
 * Description: Production-ready Evidence Correlation Engine with Relationship Registry and Correlation Trace Path Traversal.
 * STRICTLY NO DECISION, NO CONFIDENCE, NO ASSESSMENT, NO RECOMMENDATION, NO EXPLANATION.
 */

const RelationshipTypeEnum = Object.freeze({
  MATCH: 'MATCH',                           // Technical parity between evidence items
  PARTIAL_MATCH: 'PARTIAL_MATCH',           // Partial key or sub-component match
  RELATED: 'RELATED',                       // Domain/functional relationship
  CONFLICT: 'CONFLICT',                     // Discrepancy between evidence items
  DEPENDENCY: 'DEPENDENCY',                 // Functional dependency
  MISSING_REFERENCE: 'MISSING_REFERENCE'    // Reference configured but target component absent
});

class RelationshipRegistry {
  constructor() {
    this.registryVersion = '1.0.0';
    this.definitions = new Map();
    this._initializeDefaultDefinitions();
  }

  _initializeDefaultDefinitions() {
    const defaultDefs = [
      {
        relationshipId: RelationshipTypeEnum.MATCH,
        version: '1.0.0',
        description: 'Technical parity between two evidence items',
        allowedSourceTypes: ['FIRMWARE', 'LICENSE', 'SECURITY', 'REGISTRY', 'SERVICE', 'ENVIRONMENT', '*'],
        allowedTargetTypes: ['FIRMWARE', 'LICENSE', 'SECURITY', 'REGISTRY', 'SERVICE', 'ENVIRONMENT', '*'],
        direction: 'SYMMETRIC',
        metadataSchema: { required: [], optional: ['biosChannel', 'licChannel'] }
      },
      {
        relationshipId: RelationshipTypeEnum.PARTIAL_MATCH,
        version: '1.0.0',
        description: 'Partial key or component match between evidence items',
        allowedSourceTypes: ['*'],
        allowedTargetTypes: ['*'],
        direction: 'SYMMETRIC',
        metadataSchema: { required: [], optional: ['matchedKeyFragment'] }
      },
      {
        relationshipId: RelationshipTypeEnum.RELATED,
        version: '1.0.0',
        description: 'Functional domain relationship between evidence items',
        allowedSourceTypes: ['*'],
        allowedTargetTypes: ['*'],
        direction: 'DIRECTIONAL',
        metadataSchema: { required: [], optional: ['tokenStorePath'] }
      },
      {
        relationshipId: RelationshipTypeEnum.CONFLICT,
        version: '1.0.0',
        description: 'Discrepancy between evidence items',
        allowedSourceTypes: ['*'],
        allowedTargetTypes: ['*'],
        direction: 'SYMMETRIC',
        metadataSchema: { required: [], optional: ['conflictReason'] }
      },
      {
        relationshipId: RelationshipTypeEnum.DEPENDENCY,
        version: '1.0.0',
        description: 'Functional dependency of one evidence item on another',
        allowedSourceTypes: ['*'],
        allowedTargetTypes: ['*'],
        direction: 'DIRECTIONAL',
        metadataSchema: { required: [], optional: ['signatureStatus', 'serviceName'] }
      },
      {
        relationshipId: RelationshipTypeEnum.MISSING_REFERENCE,
        version: '1.0.0',
        description: 'Reference configured but target component absent',
        allowedSourceTypes: ['*'],
        allowedTargetTypes: ['*'],
        direction: 'DIRECTIONAL',
        metadataSchema: { required: [], optional: ['missingTarget'] }
      }
    ];

    defaultDefs.forEach(def => this.registerDefinition(def));
  }

  registerDefinition(def) {
    if (!def || !def.relationshipId) {
      throw new TypeError('Invalid Relationship Definition.');
    }
    const validated = Object.freeze({
      relationshipId: def.relationshipId,
      version: def.version || '1.0.0',
      description: def.description || 'Standard Relationship',
      allowedSourceTypes: Array.isArray(def.allowedSourceTypes) ? [...def.allowedSourceTypes] : ['*'],
      allowedTargetTypes: Array.isArray(def.allowedTargetTypes) ? [...def.allowedTargetTypes] : ['*'],
      direction: def.direction === 'SYMMETRIC' ? 'SYMMETRIC' : 'DIRECTIONAL',
      metadataSchema: Object.freeze(def.metadataSchema || { required: [], optional: [] })
    });
    this.definitions.set(def.relationshipId, validated);
  }

  getDefinition(relationshipId) {
    return this.definitions.get(relationshipId) || null;
  }

  validateLink(sourceNode, targetNode, relationshipType) {
    const def = this.getDefinition(relationshipType);
    if (!def) return { valid: false, reason: `Unregistered RelationshipType [${relationshipType}]` };

    const srcType = sourceNode.evidenceType || 'GENERIC';
    const tgtType = targetNode.evidenceType || 'GENERIC';

    const srcAllowed = def.allowedSourceTypes.includes('*') || def.allowedSourceTypes.includes(srcType);
    const tgtAllowed = def.allowedTargetTypes.includes('*') || def.allowedTargetTypes.includes(tgtType);

    if (!srcAllowed || !tgtAllowed) {
      return { valid: false, reason: `Type mismatch for relationship ${relationshipType}` };
    }

    return { valid: true, definition: def };
  }
}

class CorrelatedEvidenceGraph {
  constructor(options = {}) {
    this.graphVersion = '1.1.0';
    this.nodes = new Map();              // Map<evidenceId, { evidenceId, evidenceItem }>()
    this.links = [];                     // Array<EvidenceLink>
    
    // Fast Traversal Adjacency Index Maps
    this.adjacencyMap = new Map();       // Map<evidenceId, EvidenceLink[]>()
    this.typeIndex = new Map();          // Map<relationshipType, EvidenceLink[]>()

    this.registry = options.registry || new RelationshipRegistry();
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
        evidenceItem: Object.freeze(evidenceItem)
      }));
      this.adjacencyMap.set(id, []);
    }
  }

  /**
   * Creates a descriptive directional/symmetric link between two Evidence Nodes with Registry Validation
   */
  addLink({ sourceEvidenceId, targetEvidenceId, relationshipType, relationshipReason, relationshipStrength = 1.0, relationshipMetadata = {} }) {
    const srcNode = this.nodes.get(sourceEvidenceId);
    const tgtNode = this.nodes.get(targetEvidenceId);

    if (!srcNode || !tgtNode) return null;

    // Registry Validation
    const validation = this.registry.validateLink(srcNode, tgtNode, relationshipType);
    if (!validation.valid) {
      throw new Error(`Link validation failed: ${validation.reason}`);
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
      direction: validation.definition.direction,
      timestamp: new Date().toISOString()
    });

    this.links.push(link);
    this.adjacencyMap.get(sourceEvidenceId).push(link);

    // If Symmetric or for bidirectional traversal lookup, index target node
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
   * Traces graph path between startEvidenceId and targetEvidenceId (BFS Traversal Trace)
   * STRICTLY NO INFERENCE / NO DECISION - Path recording only!
   */
  tracePath(startEvidenceId, targetEvidenceId, maxHops = 5) {
    const startTime = Date.now();

    if (!this.nodes.has(startEvidenceId) || !this.nodes.has(targetEvidenceId)) {
      return {
        traversalPath: [],
        hopCount: 0,
        visitedNodes: [],
        linksTraversed: [],
        traceMetadata: { reachedTarget: false, reason: 'Start or target node missing', executionTimeMs: Date.now() - startTime }
      };
    }

    if (startEvidenceId === targetEvidenceId) {
      return {
        traversalPath: [startEvidenceId],
        hopCount: 0,
        visitedNodes: [this.getNode(startEvidenceId)],
        linksTraversed: [],
        traceMetadata: { reachedTarget: true, reason: 'Start equals target', executionTimeMs: Date.now() - startTime }
      };
    }

    // BFS Traversal
    const queue = [{ node: startEvidenceId, path: [startEvidenceId], links: [] }];
    const visited = new Set([startEvidenceId]);

    while (queue.length > 0) {
      const { node, path, links } = queue.shift();

      if (path.length - 1 >= maxHops) continue;

      const neighborLinks = this.getLinks(node);
      for (const link of neighborLinks) {
        const nextNode = link.sourceEvidenceId === node ? link.targetEvidenceId : link.sourceEvidenceId;

        if (nextNode === targetEvidenceId) {
          const finalPath = [...path, nextNode];
          const finalLinks = [...links, link];
          const visitedNodes = finalPath.map(id => this.getNode(id));

          return {
            traversalPath: finalPath,
            hopCount: finalLinks.length,
            visitedNodes,
            linksTraversed: finalLinks,
            traceMetadata: {
              reachedTarget: true,
              maxHops,
              executionTimeMs: Date.now() - startTime
            }
          };
        }

        if (!visited.has(nextNode)) {
          visited.add(nextNode);
          queue.push({
            node: nextNode,
            path: [...path, nextNode],
            links: [...links, link]
          });
        }
      }
    }

    return {
      traversalPath: [],
      hopCount: 0,
      visitedNodes: Array.from(visited).map(id => this.getNode(id)),
      linksTraversed: [],
      traceMetadata: { reachedTarget: false, maxHops, reason: 'No path found within maxHops', executionTimeMs: Date.now() - startTime }
    };
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
      registryVersion: this.registry.registryVersion,
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
  constructor(options = {}) {
    this.engineVersion = '1.1.0';
    this.registry = options.registry || new RelationshipRegistry();
  }

  /**
   * Reads EvidenceMatrix and builds a CorrelatedEvidenceGraph using RelationshipRegistry
   * @param {EvidenceMatrix} evidenceMatrix - Phase 2.1 EvidenceMatrix instance
   */
  buildGraph(evidenceMatrix) {
    if (!evidenceMatrix || typeof evidenceMatrix.getAllEvidence !== 'function') {
      throw new TypeError('Invalid EvidenceMatrix instance provided to Correlation Engine.');
    }

    const graph = new CorrelatedEvidenceGraph({ registry: this.registry });
    const allEvidence = evidenceMatrix.getAllEvidence();

    // Step 1: Add all EvidenceItems as Graph Nodes
    for (const item of allEvidence) {
      graph.addNode(item);
    }

    // Step 2: Establish Technical Correlations using Registry Definitions (Descriptive Only - NO DECISION)
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

module.exports = { EvidenceCorrelationEngine, CorrelatedEvidenceGraph, RelationshipRegistry, RelationshipTypeEnum };
