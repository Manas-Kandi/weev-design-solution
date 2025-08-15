/**
 * Tool Simulator for mock tool execution
 */

import { ToolInvocationRequest, ToolInvocationResult, MockErrorMode } from '@/lib/nodes/tool/types';
import { getToolSchema, getMockPreset } from '@/lib/nodes/tool/catalog';

export class ToolSimulator {
  /**
   * Invoke a tool in mock mode
   */
  static async invoke(request: ToolInvocationRequest): Promise<ToolInvocationResult> {
    const startTime = Date.now();
    
    try {
      // Get tool schema
      const schema = getToolSchema(request.toolName);
      if (!schema) {
        return {
          success: false,
          error: `Unknown tool: ${request.toolName}`,
          latencyMs: 0
        };
      }

      // Handle error simulation
      if (request.errorMode && request.errorMode !== 'none') {
        return this.simulateError(request.errorMode, startTime);
      }

      // Use specific mock preset if provided
      if (request.mockPreset) {
        const preset = getMockPreset(request.toolName, request.mockPreset);
        if (preset) {
          return this.executePreset(preset, request, startTime);
        }
      }

      // Find matching preset based on args or use default
      const matchingPreset = this.findMatchingPreset(schema.mockPresets, request.args);
      if (matchingPreset) {
        return this.executePreset(matchingPreset, request, startTime);
      }

      // Default success response
      return {
        success: true,
        result: this.generateDefaultResult(request),
        latencyMs: Date.now() - startTime
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        latencyMs: Date.now() - startTime
      };
    }
  }

  /**
   * Execute a mock preset
   */
  private static async executePreset(
    preset: any,
    request: ToolInvocationRequest,
    startTime: number
  ): Promise<ToolInvocationResult> {
    // Simulate latency
    const latency = request.latencyMs || preset.latencyMs || 100;
    if (latency > 0) {
      await this.delay(latency);
    }

    if (preset.error) {
      return {
        success: false,
        error: preset.error,
        latencyMs: Date.now() - startTime,
        usedPreset: preset.name
      };
    }

    return {
      success: true,
      result: this.processPresetResult(preset.result, request),
      latencyMs: Date.now() - startTime,
      usedPreset: preset.name
    };
  }

  /**
   * Find matching preset based on arguments
   */
  private static findMatchingPreset(presets: any[], args: Record<string, any>) {
    // Look for preset with matching args
    for (const preset of presets) {
      if (preset.args && this.argsMatch(preset.args, args)) {
        return preset;
      }
    }

    // Return first success preset as default
    return presets.find(p => p.name === 'success' || !p.error) || presets[0];
  }

  /**
   * Check if args match preset args
   */
  private static argsMatch(presetArgs: Record<string, any>, requestArgs: Record<string, any>): boolean {
    for (const [key, value] of Object.entries(presetArgs)) {
      if (requestArgs[key] !== value) {
        return false;
      }
    }
    return true;
  }

  /**
   * Process preset result with request context
   */
  private static processPresetResult(result: any, request: ToolInvocationRequest): any {
    if (typeof result === 'object' && result !== null) {
      // Add deterministic elements based on seed
      const processed = { ...result };
      
      if (request.seed) {
        // Add seed-based deterministic fields
        processed._seed = request.seed;
        processed._timestamp = this.generateDeterministicTimestamp(request.seed);
      }

      return processed;
    }

    return result;
  }

  /**
   * Generate default result for unknown scenarios
   */
  private static generateDefaultResult(request: ToolInvocationRequest): any {
    const baseResult = {
      toolName: request.toolName,
      operation: request.operation,
      args: request.args,
      success: true,
      timestamp: new Date().toISOString()
    };

    // Tool-specific default results
    switch (request.toolName) {
      case 'web_search':
        return { results: [], total: 0 };
      case 'http_request':
        return { status: 200, data: { message: 'Mock response' } };
      case 'calendar':
        return request.operation === 'list_events' ? { events: [] } : { created: true };
      case 'gmail':
        return request.operation === 'list_emails' ? { emails: [] } : { sent: true };
      case 'sheets':
        return request.operation === 'read_range' ? { values: [] } : { updated: true };
      case 'image_gen':
        return { url: 'https://example.com/mock-image.jpg', size: '1024x1024' };
      case 'db_query':
        return { rows: [], rowCount: 0 };
      default:
        return baseResult;
    }
  }

  /**
   * Simulate different error modes
   */
  private static async simulateError(errorMode: string, startTime: number): Promise<ToolInvocationResult> {
    const errorMap: Record<string, { message: string; latency: number }> = {
      timeout: { message: 'Request timed out', latency: 5000 },
      not_found: { message: 'Resource not found', latency: 200 },
      rate_limit: { message: 'Rate limit exceeded', latency: 100 },
      auth_error: { message: 'Authentication failed', latency: 150 },
      server_error: { message: 'Internal server error', latency: 1000 }
    };

    const error = errorMap[errorMode] || { message: 'Unknown error', latency: 100 };
    
    // Simulate latency
    await this.delay(error.latency);

    return {
      success: false,
      error: error.message,
      latencyMs: Date.now() - startTime
    };
  }

  /**
   * Generate deterministic timestamp from seed
   */
  private static generateDeterministicTimestamp(seed: string): string {
    // Simple hash-based deterministic timestamp
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Generate timestamp based on hash
    const baseTime = new Date('2024-01-01T00:00:00Z').getTime();
    const offset = Math.abs(hash) % (24 * 60 * 60 * 1000); // Within 24 hours
    
    return new Date(baseTime + offset).toISOString();
  }

  /**
   * Delay execution
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate tool arguments against schema
   */
  static validateArgs(toolName: string, operation: string | undefined, args: Record<string, any>): string[] {
    const schema = getToolSchema(toolName);
    if (!schema) {
      return [`Unknown tool: ${toolName}`];
    }

    const errors: string[] = [];
    let parameters = schema.parameters;

    // For multi-operation tools, get operation-specific parameters
    if (schema.operations && operation) {
      const op = schema.operations[operation];
      if (!op) {
        return [`Unknown operation '${operation}' for tool '${toolName}'`];
      }
      parameters = op.parameters;
    }

    // Validate required parameters
    for (const param of parameters) {
      if (param.required && !(param.name in args)) {
        errors.push(`Missing required parameter: ${param.name}`);
      }

      if (param.name in args) {
        const value = args[param.name];
        
        // Type validation
        if (!this.validateParameterType(value, param.type)) {
          errors.push(`Parameter '${param.name}' must be of type ${param.type}`);
        }

        // Enum validation
        if (param.enum && !param.enum.includes(value)) {
          errors.push(`Parameter '${param.name}' must be one of: ${param.enum.join(', ')}`);
        }
      }
    }

    return errors;
  }

  /**
   * Validate parameter type
   */
  private static validateParameterType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'array':
        return Array.isArray(value);
      default:
        return true;
    }
  }
}

// Export singleton instance
export const toolSimulator = new ToolSimulator();
