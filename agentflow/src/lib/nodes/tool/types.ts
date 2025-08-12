/**
 * Tool node types and contracts
 */

export interface ToolNodeData {
  toolName: string; // Tool name from catalog or "custom"
  operation?: string; // For multi-operation tools (e.g., search, createEvent)
  args: Record<string, any>; // Key/value arguments with types
  mode: "mock" | "live"; // Execution mode, default mock
  mockPreset?: string; // Selected mock preset for testing
  latencyMs?: number; // Simulated latency for mock mode
  errorMode?: string; // Error simulation mode
}

export interface ToolNodeOutput {
  type: 'json';
  content: {
    result: any; // Tool execution result
  };
  meta: {
    nodeType: 'tool';
    toolName: string;
    op?: string; // Operation name
    mode: 'mock' | 'live';
    usedPreset?: string; // Mock preset used (if any)
    latencyMs: number; // Actual execution time
    error?: string; // Error message if execution failed
  };
  [key: string]: unknown; // Index signature for compatibility
}

export interface ToolIntent {
  name: string; // Tool name
  args: Record<string, any>; // Arguments for the tool
  operation?: string; // Optional operation
}

export interface ToolSchema {
  name: string;
  description: string;
  operations?: {
    [key: string]: {
      description: string;
      parameters: ToolParameter[];
      returns: string;
    };
  };
  parameters: ToolParameter[]; // For single-operation tools
  returns: string;
  mockPresets: ToolMockPreset[];
}

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  default?: any;
  enum?: string[]; // For enumerated values
}

export interface ToolMockPreset {
  name: string;
  description: string;
  args?: Record<string, any>; // Example arguments
  result?: any; // Mock result (optional if error is provided)
  latencyMs?: number; // Simulated latency
  error?: string; // Error to simulate
}

export interface ToolInvocationRequest {
  toolName: string;
  operation?: string;
  args: Record<string, any>;
  mode: 'mock' | 'live';
  seed?: string; // For deterministic mock results
  latencyMs?: number;
  errorMode?: string;
  mockPreset?: string;
}

export interface ToolInvocationResult {
  success: boolean;
  result?: any;
  error?: string;
  latencyMs: number;
  usedPreset?: string;
}

// Built-in tool names
export const BUILTIN_TOOLS = [
  'web_search',
  'http_request',
  'calendar',
  'gmail',
  'sheets',
  'image_gen',
  'db_query'
] as const;

export type BuiltinToolName = typeof BUILTIN_TOOLS[number];

// Tool execution modes
export const TOOL_MODES = ['mock', 'live'] as const;
export type ToolMode = typeof TOOL_MODES[number];

// Mock error modes
export const MOCK_ERROR_MODES = [
  'none',
  'timeout',
  'not_found',
  'rate_limit',
  'auth_error',
  'server_error'
] as const;
export type MockErrorMode = typeof MOCK_ERROR_MODES[number];
