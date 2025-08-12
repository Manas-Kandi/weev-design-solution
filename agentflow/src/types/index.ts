import React from "react";
import { ToolAgentRules, ToolAgentSimulationConfig } from "./simulation";
import type { FlowContextBag, FlowMode } from "./flow-io";
import type { RunExecutionOptions } from "./run";

// Shared I/O envelope used by all nodes
export type FlowIO = {
  type: 'text' | 'json' | 'binary';
  content: string | Record<string, unknown>;
  meta?: Record<string, unknown>; // timestamps, nodeId, model, tool traces, etc.
};

// Node data types shared across the application for type safety
export interface DashboardNodeData {
  widgets: string[];
  title: string;
  layout: string;
}

export interface MessageNodeData {
  title?: string;
  content?: string;
  passThrough?: boolean;
}

export interface TestCaseNodeData {
  input?: string;
  expectedOutput?: string;
  description?: string;
  assertType?: string;
}

export interface ConversationFlowNodeData {
  states: string[];
  initialState: string;
  persistState: boolean;
  transitions: { from: string; to: string; condition: string }[];
}

export interface ChatNodeData {
  title: string;
  description: string;
  color: string;
  icon: string;
  messages: { sender: "user" | "agent"; text: string }[];
  inputValue?: string;
}

export interface PromptTemplateNodeData {
  title: string;
  description: string;
  color: string;
  icon: string;
  template: string;
  variables: Record<string, string>;
  extractVariablesFromInput?: boolean;
}

export interface KnowledgeBaseNodeData {
  operation: "store" | "retrieve" | "search";
  documents: string[];
  metadata: Record<string, unknown>;
}

export interface DecisionTreeNodeData {
  rules: Array<{ condition: string; outputPath: string }>;
  defaultPath: string;
  evaluationMode: string;
  [key: string]: unknown;
}

export interface StateMachineNodeData {
  states: string[];
  initialState: string;
  persistState: boolean;
  transitions: { from: string; to: string; condition: string }[];
}

export interface SimulatorNodeData {
  testInput?: string;
  expectedOutput?: string;
}

export interface ConditionGroup {
  id: string;
  operator: "AND" | "OR";
  conditions: Condition[];
}
export interface Condition {
  id: string;
  field: string;
  operator:
    | "equals"
    | "not_equals"
    | "contains"
    | "not_contains"
    | "greater_than"
    | "less_than"
    | "greater_equal"
    | "less_equal"
    | "exists"
    | "not_exists"
    | "matches_regex"
    | "in_array"
    | "llm_evaluate";
  value: string | number | boolean | string[];
  dataType: "string" | "number" | "boolean" | "array" | "object" | "auto";
  llmPrompt?: string;
}
export interface ComplexIfElseNodeData {
  title: string;
  description: string;
  color: string;
  icon: string;
  conditionGroups: ConditionGroup[];
  globalOperator: "AND" | "OR";
  truePath: { label: string; description: string };
  falsePath: { label: string; description: string };
  testData?: Record<string, unknown>;
  evaluationMode: "strict" | "fuzzy" | "llm_assisted";
  llmModel: "gemini-pro" | "gemini-2.5-flash-lite";
}

export interface IfElseNodeData {
  condition?: string;
  message?: string;
  context?: {
    flowId: string;
    nodeId: string;
    timestamp: number;
    metadata: Record<string, string>;
  };
  history?: Message[];
  state?: Record<string, unknown>;
}

export interface Message {
  content: string;
  sender: string;
  timestamp: number;
}

export interface PersonalityTrait {
  id: string;
  name: string;
  icon?: React.ElementType;
  value: number;
  color?: string;
  description?: string;
}

export interface BehaviorRule {
  id: string;
  trigger: string;
  action: string;
  enabled: boolean;
}

export interface AgentNodeData {
  title: string;
  description: string;
  color: string;
  icon: string;
  content?: string;
  config?: Record<string, unknown>;
  prompt?: string;
  model?: string;
  provider?: "nvidia" | "gemini";
  condition?: string;
  systemPrompt?: string;
  behavior?: string;  // User-defined behavior from UI text box
  personality?: string;
  escalationLogic?: string;
  confidenceThreshold?: number;
  preset?: string;
  temperature?: number;
  personalityTraits?: PersonalityTrait[];
  behaviorRules?: BehaviorRule[];
  knowledge?: string;
  expression?: string;
  mode?: 'expression' | 'llm';
  llmRule?: string;
  [key: string]: unknown;
}

export interface ToolAgentNodeData extends AgentNodeData {
  toolConfig?: {
    toolType:
      | "web-search"
      | "calculator"
      | "code-executor"
      | "file-operations"
      | "database-query"
      | "custom-api";
    endpoint?: string;
    apiKey?: string;
    parameters?: Record<string, unknown>;
  };
  // New rule-first configuration
  rules?: ToolAgentRules;
  simulation?: ToolAgentSimulationConfig;
}

export interface ThinkingNodeData {
  title: string;
  description: string;
  color: string;
  icon: string;
  systemPrompt?: string;
  style: "balanced" | "fast" | "deep";
  schemaHint?: string; // Optional JSON schema string for expected output shape
  allowToolCalls: boolean;
  [key: string]: unknown;
}

export interface MessageFormatterNodeData {
  title: string;
  description: string;
  color: string;
  icon: string;
  preset: "email" | "chat" | "report" | "custom";
  tone: "neutral" | "friendly" | "formal";
  audience?: string; // Optional audience description
  formatHint: "markdown" | "plain" | "html";
  customTemplate?: string; // Only used when preset=custom
  [key: string]: unknown;
}

export interface ToolNodeData {
  title: string;
  description: string;
  color: string;
  icon: string;
  toolName: string; // Tool name from catalog or "custom"
  operation?: string; // For multi-operation tools (e.g., search, createEvent)
  args: Record<string, unknown>; // Key/value arguments with types
  mode: "mock" | "live"; // Execution mode, default mock
  mockPreset?: string; // Selected mock preset for testing
  latencyMs?: number; // Simulated latency for mock mode
  errorMode?: string; // Error simulation mode
  [key: string]: unknown;
}

export interface CanvasNode {
  id: string;
  type: "agent" | "logic" | "conversation" | "testing" | "ui";
  subtype: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  data:
    | AgentNodeData
    | ToolAgentNodeData
    | ToolNodeData
    | ThinkingNodeData
    | MessageFormatterNodeData
    | ChatNodeData
    | PromptTemplateNodeData
    | ComplexIfElseNodeData
    | KnowledgeBaseNodeData
    | DecisionTreeNodeData
    | DashboardNodeData
    | TestCaseNodeData
    | ConversationFlowNodeData
    | IfElseNodeData;
  inputs: { id: string; label: string; type?: string }[];
  outputs: { id: string; label: string; type?: string }[];
  output?: NodeOutput; // Add output property for workflow results
  context?: Record<string, unknown>; // Add context property for workflow results
}

// TODO: Add unit tests for IfElse node type to ensure type safety and prevent regressions.

export interface Connection {
  id: string;
  sourceNode: string;
  sourceOutput: string;
  targetNode: string;
  targetInput: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  lastModified: Date;
  nodeCount: number;
  status: "draft" | "testing" | "deployed";
  startNodeId?: string | null;
  nodes?: CanvasNode[];
  connections?: Connection[];
  created_at: string;
  user_id: string;
}

export interface ProjectFile {
  id: string;
  project_id: string;
  name: string;
  file_path: string;
  file_type: string;
  size_bytes: number;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface Tool {
  id: string;
  name: string;
  icon: string;
  shortcut: string;
}

export interface NodeCategory {
  id: string;
  name: string;
  type: "agent" | "conversation" | "logic" | "testing" | "ui" | "core" | "data" | "message";
  nodes: NodeType[];
}

export interface NodeType {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  description: string;
  type: "agent" | "conversation" | "logic" | "testing" | "ui";
  subtype?: string;
  defaultInputs?: { id: string; label: string; type?: string }[];
  defaultOutputs?: { id: string; label: string; type?: string }[];
  systemPrompt?: string; // Guardrail/system prompt for agent nodes
  personality?: string; // Agent personality traits
  escalationLogic?: string; // Escalation logic instructions
  confidenceThreshold?: number; // Confidence threshold for escalation
  // Thinking node specific properties
  style?: "balanced" | "fast" | "deep"; // Reasoning style for thinking nodes
  allowToolCalls?: boolean; // Whether thinking nodes can propose tool calls
  // Message formatter node specific properties
  preset?: "email" | "chat" | "report" | "custom"; // Message format preset
  tone?: "neutral" | "friendly" | "formal"; // Message tone
  formatHint?: "markdown" | "plain" | "html"; // Output format hint
  // Router node specific properties
  mode?: "expression" | "llm"; // Router decision mode
  expression?: string; // JavaScript expression for expression mode
  llmRule?: string; // LLM rule for llm mode
  // Memory node specific properties
  indexName?: string; // Memory index name
  ingestMode?: "full" | "summary-only"; // Document ingest mode
  chunkSize?: number; // Text chunk size for processing
  chunkOverlap?: number; // Overlap between chunks
  retrievalTopK?: number; // Number of results to retrieve
}

export interface ViewportTransform {
  x: number;
  y: number;
  scale: number;
}

export interface Colors {
  background: string;
  sidebar: string;
  panel: string;
  border: string;
  text: string;
  textSecondary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  purple: string;
  orange: string;
  blue: string;
  green: string;
}

export interface LLMOutput {
  choices?: { message?: { content?: string } }[];
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

export interface GeminiOutput {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

export type NodeOutputObject = {
  output?: string;
  message?: string;
  content?: string;
  llm?: LLMOutput;
  gemini?: GeminiOutput;
  provider?: GeminiOutput;
};

export type NodeOutput = string | NodeOutputObject;

// --- MCP Schema Exports (v0.1) ---
export {
  MCP_SCHEMA_VERSION,
  validateMcpExport,
  adaptCanvasToMcpFlow,
} from "./mcp.types";
export type {
  McpNodeKind,
  McpNodeConfig,
  McpNodeSpec,
  McpEdgeSpec,
  McpFlowMeta,
  McpFlowSpec,
  McpToolSchema,
  McpToolDefinition,
  McpErrorInjection,
  McpEnvironmentConfig,
  McpExport,
  McpRunManifest,
  McpValidationResult,
} from "./mcp.types";

export interface NodeContext {
  nodes: CanvasNode[];
  connections: Connection[];
  nodeOutputs: Record<string, NodeOutput>;
  currentNode: CanvasNode;
  inputs?: Record<string, NodeOutput>;
  config?: Record<string, unknown>;
  flowContext?: FlowContextBag;
  mode?: FlowMode;
  runOptions?: RunExecutionOptions;
}
