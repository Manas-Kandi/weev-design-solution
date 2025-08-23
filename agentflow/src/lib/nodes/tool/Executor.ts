/**
 * Tool node executor - simplified working version
 */

import { BaseNode, NodeContext } from '../base/BaseNode';
import { CanvasNode, NodeOutput } from '@/types';
import { ToolNodeData } from './types';
import { toolSimulator } from '@/features/testing/lib/toolSimulator';
import type { ToolError, ToolSimulatorInput } from '@/features/testing/types/toolSimulator';
// LLM logic removed
import { getToolSchema } from './catalog';

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
    return this.nodeData.mode || 'live';
  }

  async execute(context: NodeContext): Promise<NodeOutput> {
    try {
      // Get inputs using BaseNode method
      const inputValues = this.getInputValues(context);
      
      // Build arguments from node data and inputs
      const args: Record<string, unknown> = { ...this.nodeData.args };
      
      // Add input content if available
      if (inputValues.length > 0) {
        args.input = inputValues.join('\n');
      }

      // Execute based on mode
      if (this.mode === 'mock') {
        // Build simulator input
        const simInput: ToolSimulatorInput = {
          name: this.toolName,
          op: this.operation ?? '',
          args,
          seed: this.generateSeed(this.toolName, this.operation || '', args),
          latencyMs: this.nodeData.latencyMs,
          errorMode: this.mapErrorMode(this.nodeData.errorMode)
        };

        const result = await toolSimulator.invoke(simInput);

        if (result.ok) {
          const payload = result.data;
          return typeof payload === 'string' ? payload : JSON.stringify(payload ?? null);
        }
        return result.error?.message ?? 'Tool execution failed';
      } else {
        return 'Live tool mode is disabled (LLM removed)';
      }
    } catch (error) {
      return error instanceof Error ? error.message : 'Unknown error';
    }
  }

  /**
   * Generate deterministic seed for consistent mock results
   */
  private generateSeed(toolName: string, operation: string, args: Record<string, unknown>): string {
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
  private normalizeArgsForSeed(args: Record<string, unknown>): Record<string, unknown> {
    const normalized: Record<string, unknown> = {};
    
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

  /** Map legacy error mode values to new ToolError kinds */
  private mapErrorMode(mode: string | undefined): ToolError['kind'] | 'none' | undefined {
    if (!mode || mode === 'none') return 'none';
    switch (mode) {
      case 'timeout':
        return 'timeout';
      case 'not_found':
        return 'notFound';
      case 'rate_limit':
        return 'rateLimit';
      case 'server_error':
        return 'server';
      case 'auth_error':
        return 'validation';
      default:
        return 'none';
    }
  }
}
