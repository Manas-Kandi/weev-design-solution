/**
 * FlowSpecValidator - Validates flow specifications and node contracts
 */

import { CanvasNode, Connection } from '@/types';

export interface FlowSpec {
  nodes: CanvasNode[];
  edges: Connection[];
  meta?: {
    name?: string;
    description?: string;
    version?: string;
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class FlowSpecValidator {
  /**
   * Validate a complete flow specification
   */
  static validateFlow(spec: FlowSpec): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate nodes
    for (const node of spec.nodes) {
      const nodeResult = this.validateNode(node);
      errors.push(...nodeResult.errors);
      warnings.push(...nodeResult.warnings);
    }

    // Validate edges
    for (const edge of spec.edges) {
      const edgeResult = this.validateEdge(edge, spec.nodes);
      errors.push(...edgeResult.errors);
      warnings.push(...edgeResult.warnings);
    }

    // Validate connectivity
    const connectivityResult = this.validateConnectivity(spec);
    errors.push(...connectivityResult.errors);
    warnings.push(...connectivityResult.warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate individual node contracts
   */
  static validateNode(node: CanvasNode): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Every node must declare ≥1 input
    if (!node.inputs || node.inputs.length === 0) {
      errors.push(`Node ${node.id} must declare at least one input`);
    }

    // Router nodes must have exactly two named outputs: true, false
    if (node.subtype === 'router') {
      if (!node.outputs || node.outputs.length !== 2) {
        errors.push(`Router node ${node.id} must have exactly two outputs`);
      } else {
        const outputLabels = node.outputs.map(o => o.label.toLowerCase());
        if (!outputLabels.includes('true') || !outputLabels.includes('false')) {
          errors.push(`Router node ${node.id} must have outputs labeled 'true' and 'false'`);
        }
      }
    }

    // Validate node data based on type
    if (!node.data) {
      errors.push(`Node ${node.id} missing required data`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate edge connections
   */
  static validateEdge(edge: Connection, nodes: CanvasNode[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const sourceNode = nodes.find(n => n.id === edge.sourceNode);
    const targetNode = nodes.find(n => n.id === edge.targetNode);

    if (!sourceNode) {
      errors.push(`Edge ${edge.id} references non-existent source node ${edge.sourceNode}`);
    }

    if (!targetNode) {
      errors.push(`Edge ${edge.id} references non-existent target node ${edge.targetNode}`);
    }

    if (sourceNode && !sourceNode.outputs?.find(o => o.id === edge.sourceOutput)) {
      errors.push(`Edge ${edge.id} references non-existent output ${edge.sourceOutput} on node ${edge.sourceNode}`);
    }

    if (targetNode && !targetNode.inputs?.find(i => i.id === edge.targetInput)) {
      errors.push(`Edge ${edge.id} references non-existent input ${edge.targetInput} on node ${edge.targetNode}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate flow connectivity and detect cycles
   */
  static validateConnectivity(spec: FlowSpec): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Build adjacency list
    const adjacencyList = new Map<string, string[]>();
    for (const node of spec.nodes) {
      adjacencyList.set(node.id, []);
    }

    for (const edge of spec.edges) {
      const neighbors = adjacencyList.get(edge.sourceNode) || [];
      neighbors.push(edge.targetNode);
      adjacencyList.set(edge.sourceNode, neighbors);
    }

    // Check for cycles (optional warning, not error)
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) return true;
      if (visited.has(nodeId)) return false;

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const neighbors = adjacencyList.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (hasCycle(neighbor)) return true;
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const nodeId of adjacencyList.keys()) {
      if (!visited.has(nodeId) && hasCycle(nodeId)) {
        warnings.push(`Cycle detected in flow starting from node ${nodeId}`);
        break;
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate that a flow supports unbounded chaining (e.g., 24 routers)
   */
  static validateChaining(spec: FlowSpec, maxDepth: number = 100): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Find the longest path in the graph
    const longestPath = this.findLongestPath(spec);
    
    if (longestPath > maxDepth) {
      warnings.push(`Flow has a very long chain (${longestPath} nodes), which may impact performance`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Find the longest path in the flow graph
   */
  private static findLongestPath(spec: FlowSpec): number {
    const adjacencyList = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    // Initialize
    for (const node of spec.nodes) {
      adjacencyList.set(node.id, []);
      inDegree.set(node.id, 0);
    }

    // Build graph
    for (const edge of spec.edges) {
      const neighbors = adjacencyList.get(edge.sourceNode) || [];
      neighbors.push(edge.targetNode);
      adjacencyList.set(edge.sourceNode, neighbors);
      
      inDegree.set(edge.targetNode, (inDegree.get(edge.targetNode) || 0) + 1);
    }

    // Topological sort with distance tracking
    const queue: string[] = [];
    const distance = new Map<string, number>();

    for (const [nodeId, degree] of inDegree.entries()) {
      if (degree === 0) {
        queue.push(nodeId);
        distance.set(nodeId, 1);
      }
    }

    let maxDistance = 0;

    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentDistance = distance.get(current) || 0;
      maxDistance = Math.max(maxDistance, currentDistance);

      const neighbors = adjacencyList.get(current) || [];
      for (const neighbor of neighbors) {
        const newDegree = (inDegree.get(neighbor) || 0) - 1;
        inDegree.set(neighbor, newDegree);
        
        const newDistance = currentDistance + 1;
        distance.set(neighbor, Math.max(distance.get(neighbor) || 0, newDistance));

        if (newDegree === 0) {
          queue.push(neighbor);
        }
      }
    }

    return maxDistance;
  }
}
