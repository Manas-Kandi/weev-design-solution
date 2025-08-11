// Simplified node definitions for minimal Components panel
import { NodeCategory, NodeType } from "@/types";
import {
  User,
  Wrench,
  GitBranch,
  Database,
  FileText,
  MessageSquare,
} from "lucide-react";
import { theme } from "@/data/theme";

export const colors = theme;

// Map old node types to new simplified types for backward compatibility
export const nodeTypeMapping: Record<string, string> = {
  // Agent mappings
  'agent': 'agent',
  'human-handoff': 'agent',
  
  // Tool mappings
  'tool-agent': 'tool',
  
  // Router mappings
  'if-else': 'router',
  'decision-tree': 'router',
  'state-machine': 'router',
  'conversation-flow': 'router',
  
  // Memory mappings
  'knowledge-base': 'memory',
  
  // Template mappings
  'prompt-template': 'template',
  
  // Message mappings
  'message': 'message',
  
  // Hidden nodes (testing and UI)
  'simulator': 'hidden',
  'test-case': 'hidden',
  'dashboard': 'hidden',
  'chat-interface': 'hidden',
};

export const simplifiedNodeCategories: NodeCategory[] = [
  {
    id: "core",
    name: "Core",
    type: "core",
    nodes: [
      {
        id: "agent",
        name: "Agent",
        icon: User,
        color: "#00c4ff",
        description: "AI agent with reasoning capabilities",
        type: "agent",
        subtype: "generic",
        systemPrompt: "You are an autonomous agent operating in a workflow. You will receive further instructions and context.",
        personality: "Friendly, helpful, concise",
        escalationLogic: "If confidence < 0.7, escalate to human-handoff node.",
        confidenceThreshold: 0.7,
        defaultInputs: [
          { id: "prompt", label: "Prompt", type: "text" },
          { id: "input-1", label: "Input", type: "text" },
          { id: "context", label: "Context", type: "data" },
        ],
        defaultOutputs: [
          { id: "output-1", label: "Response", type: "text" },
          { id: "metadata", label: "Metadata", type: "data" },
        ],
      },
      {
        id: "tool",
        name: "Tool",
        icon: Wrench,
        color: "#ff9f0a",
        description: "Execute tools and APIs",
        type: "agent",
        subtype: "tool-agent",
        defaultInputs: [
          { id: "context", label: "Context", type: "text" },
          { id: "parameters", label: "Parameters", type: "data" },
        ],
        defaultOutputs: [
          { id: "result", label: "Result", type: "data" },
          { id: "error", label: "Error", type: "text" },
        ],
      },
      {
        id: "router",
        name: "Router",
        icon: GitBranch,
        color: "#ff3b30",
        description: "Route flow based on conditions",
        type: "logic",
        subtype: "if-else",
        systemPrompt: "You are a logic node. Evaluate conditions and route data accordingly.",
        defaultInputs: [
          { id: "condition", label: "Condition", type: "boolean" },
          { id: "data", label: "Data", type: "data" },
        ],
        defaultOutputs: [
          { id: "true-path", label: "True", type: "data" },
          { id: "false-path", label: "False", type: "data" },
        ],
      },
    ],
  },
  {
    id: "data",
    name: "Data",
    type: "data",
    nodes: [
      {
        id: "memory",
        name: "Memory",
        icon: Database,
        color: "#ff2d92",
        description: "Store and retrieve information",
        type: "conversation",
        subtype: "knowledge-base",
        systemPrompt: "You are a knowledge base node. Provide relevant information and context to agents.",
        defaultInputs: [
          { id: "query", label: "Query", type: "text" },
          { id: "filters", label: "Filters", type: "data" },
        ],
        defaultOutputs: [
          { id: "results", label: "Results", type: "data" },
          { id: "relevance-score", label: "Relevance Score", type: "number" },
        ],
      },
      {
        id: "template",
        name: "Template",
        icon: FileText,
        color: "#6d28d9",
        description: "Format text with variables",
        type: "conversation",
        subtype: "template",
        defaultInputs: [],
        defaultOutputs: [{ id: "result", label: "Generated Prompt" }],
      },
    ],
  },
  {
    id: "message",
    name: "Message",
    type: "message",
    nodes: [
      {
        id: "message",
        name: "Message",
        icon: MessageSquare,
        color: "#34c759",
        description: "Handle dialogue exchange",
        type: "conversation",
        subtype: "message",
        systemPrompt: "You are a message handler. Format and route dialogue between agents and users.",
        defaultInputs: [
          { id: "user-input", label: "User Input", type: "text" },
          { id: "agent-response", label: "Agent Response", type: "text" },
        ],
        defaultOutputs: [
          { id: "formatted-message", label: "Formatted Message", type: "text" },
          { id: "conversation-state", label: "Conversation State", type: "data" },
        ],
      },
    ],
  },
];

// Function to get simplified node type from original type
export function getSimplifiedNodeType(originalType: string): NodeType | null {
  const mappedType = nodeTypeMapping[originalType];
  if (!mappedType || mappedType === 'hidden') {
    return null;
  }
  
  for (const category of simplifiedNodeCategories) {
    for (const node of category.nodes) {
      if (node.id === mappedType) {
        return node;
      }
    }
  }
  return null;
}

// Function to check if a node type should be visible
export function isNodeTypeVisible(nodeId: string): boolean {
  return nodeTypeMapping[nodeId] !== 'hidden';
}
