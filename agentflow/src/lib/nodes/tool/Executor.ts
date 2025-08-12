/**
 * Tool node executor - simplified working version
 */

import { BaseNode, NodeContext } from '../base/BaseNode';
import { CanvasNode } from '@/types';
import { ToolNodeData, ToolNodeOutput, ToolInvocationRequest } from './types';
import { ToolSimulator } from '@/services/toolsim/ToolSimulator';

export class ToolNode extends BaseNode {
  constructor(node: CanvasNode) {
    super(node);
  }

  // Getter methods for node properties
  private get nodeData(): ToolNodeData {
    return this.node.data as ToolNodeData;
  }

  private get toolName(): string {
    return this.nodeData.toolName || 'web_search';
  }

  private get operation(): string | undefined {
    return this.nodeData.operation;
  }

  private get mode(): 'mock' | 'live' {
    return this.nodeData.mode || 'mock';
  }

  async execute(context: NodeContext): Promise<ToolNodeOutput> {
    const startTime = Date.now();
    
    try {
      // Get inputs using BaseNode method
      const inputValues = this.getInputValues(context);
      
      // Build arguments from node data and inputs
      const args = { ...this.nodeData.args };
      
      // Add input content if available
      if (inputValues.length > 0) {
        args.input = inputValues.join('\n');
      }

      // Create invocation request
      const request: ToolInvocationRequest = {
        toolName: this.toolName,
        operation: this.operation,
        args,
        mode: this.mode,
        seed: this.generateSeed(this.toolName, this.operation || '', args),
        latencyMs: this.nodeData.latencyMs,
        errorMode: this.nodeData.errorMode,
        mockPreset: this.nodeData.mockPreset
      };

      // Execute based on mode
      let result;
      if (this.mode === 'mock') {
        result = await ToolSimulator.invoke(request);
      } else {
        // Live mode scaffold
        result = {
          success: false,
          error: 'Live mode not yet implemented',
          result: null,
          latencyMs: 0
        };
      }

      return {
        type: 'json',
        content: { result: result.result },
        meta: {
          nodeType: 'tool',
          toolName: this.toolName,
          op: this.operation,
          mode: this.mode,
          usedPreset: result.usedPreset,
          latencyMs: result.latencyMs || (Date.now() - startTime),
          error: result.success ? undefined : result.error
        }
      };
    } catch (error) {
      return {
        type: 'json',
        content: { result: null },
        meta: {
          nodeType: 'tool',
          toolName: this.toolName,
          op: this.operation,
          mode: this.mode,
          latencyMs: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Generate deterministic seed for consistent mock results
   */
  private generateSeed(toolName: string, operation: string, args: Record<string, any>): string {
    const seedData = {
      tool: toolName,
      op: operation,
      args: this.normalizeArgsForSeed(args)
    };
    
    return JSON.stringify(seedData);
  }

  /**
   * Normalize args for seed generation (remove non-deterministic values)
   */
  private normalizeArgsForSeed(args: Record<string, any>): Record<string, any> {
    const normalized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(args)) {
      if (value !== undefined && value !== null) {
        if (typeof value === 'object') {
          normalized[key] = JSON.stringify(value);
        } else {
          normalized[key] = value;
        }
      }
    }
    
    return normalized;
  }
}
