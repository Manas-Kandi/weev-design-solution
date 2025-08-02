// src/utils/typeGuards.ts
import type {
  MessageNodeData,
  TestCaseNodeData,
  PromptTemplateNodeData,
  KnowledgeBaseNodeData,
  IfElseNodeData,
  DecisionTreeNodeData,
  StateMachineNodeData,
  ConversationFlowNodeData,
  SimulatorNodeData,
  DashboardNodeData,
  ChatNodeData
} from "@/types";

export function isMessageNodeData(data: unknown): data is MessageNodeData {
  return (
    typeof data === "object" &&
    data !== null &&
    ("content" in data || "title" in data)
  );
}

export function isTestCaseNodeData(data: unknown): data is TestCaseNodeData {
  return (
    typeof data === "object" &&
    data !== null &&
    ("input" in data || "expectedOutput" in data)
  );
}

export function isPromptTemplateNodeData(data: unknown): data is PromptTemplateNodeData {
  return (
    typeof data === "object" &&
    data !== null &&
    ("template" in data || "variables" in data)
  );
}

export function isKnowledgeBaseNodeData(data: unknown): data is KnowledgeBaseNodeData {
  return (
    typeof data === "object" &&
    data !== null &&
    ["store", "retrieve", "search"].includes((data as Record<string, unknown>).operation as string || "retrieve")
  );
}

export function isIfElseNodeData(data: unknown): data is IfElseNodeData {
  return (
    typeof data === "object" &&
    data !== null &&
    ("condition" in data)
  );
}

export function isDecisionTreeNodeData(data: unknown): data is DecisionTreeNodeData {
  return (
    typeof data === "object" &&
    data !== null &&
    ("rules" in data)
  );
}

export function isStateMachineNodeData(data: unknown): data is StateMachineNodeData {
  return (
    typeof data === "object" &&
    data !== null &&
    ("states" in data && "transitions" in data && Array.isArray((data as Record<string, unknown>).states))
  );
}

export function isConversationFlowNodeData(data: unknown): data is ConversationFlowNodeData {
  return (
    typeof data === "object" &&
    data !== null &&
    ("states" in data && "transitions" in data && Array.isArray((data as Record<string, unknown>).states))
  );
}

// Best-practice node type guard for ConversationFlowNode
import type { CanvasNode } from "@/types";
export function isConversationFlowNode(node: CanvasNode): node is CanvasNode & { data: ConversationFlowNodeData } {
  // Check both node.subtype and data shape for extra safety
  return (
    node.subtype === "ConversationFlowNode" &&
    isConversationFlowNodeData(node.data)
  );
}

export function isSimulatorNodeData(data: unknown): data is SimulatorNodeData {
  return (
    typeof data === "object" &&
    data !== null &&
    ("testInput" in data || "expectedOutput" in data)
  );
}

export function isDashboardNodeData(data: unknown): data is DashboardNodeData {
  return (
    typeof data === "object" &&
    data !== null &&
    Array.isArray((data as Record<string, unknown>).widgets)
  );
}

export function isChatNodeData(data: unknown): data is ChatNodeData {
  return (
    typeof data === "object" &&
    data !== null &&
    ("messages" in data && Array.isArray((data as Record<string, unknown>).messages))
  );
}
