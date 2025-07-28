import React from "react";

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
  model?: string; // Added model property for agent nodes
  condition?: string; // Optional: conditional logic for agent nodes
  systemPrompt?: string; // Guardrail/system prompt for agent nodes
  personality?: string; // Agent personality traits
  escalationLogic?: string; // Escalation logic instructions
  confidenceThreshold?: number; // Confidence threshold for escalation
  preset?: string; // Agent preset selection
  temperature?: number; // Temperature for model sampling
  personalityTraits?: PersonalityTrait[];
  behaviorRules?: BehaviorRule[];
  knowledge?: string;
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
}

export interface ChatNodeData {
  title: string;
  description: string;
  color: string;
  icon: string;
  messages: { sender: "user" | "agent"; text: string }[];
  inputValue?: string; // <-- Add this line
}

export interface PromptTemplateNodeData {
  title: string;
  description: string;
  color: string;
  icon: string;
  template: string;
  variables: Record<string, string>; // e.g. { topic: "inflation" }
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

export interface CanvasNode {
  id: string;
  type: "agent" | "gui" | "logic" | "conversation" | "testing" | "ui";
  subtype: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  data:
    | AgentNodeData
    | ChatNodeData
    | PromptTemplateNodeData
    | ComplexIfElseNodeData;
  inputs: { id: string; label: string; type?: string }[];
  outputs: { id: string; label: string; type?: string }[];
  output?: NodeOutput; // Add output property for workflow results
  context?: Record<string, unknown>; // Add context property for workflow results
}

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
  nodes?: CanvasNode[];
  connections?: Connection[];
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
  type: "agent" | "conversation" | "logic" | "testing" | "ui";
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

export type NodeOutput =
  | string
  | {
      previousState?: string;
      currentState?: string;
      event?: string;
      transition?: string;
      output?: string;
      message?: string;
      gemini?: unknown;
      error?: string;
    };
