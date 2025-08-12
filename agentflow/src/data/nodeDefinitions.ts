// Node definitions and color palette for AgentFlow
import { NodeCategory, NodeType } from "@/types";
import {
  User,
  UserCheck,
  MessageSquare,
  FileText,
  Database,
  Settings,
  GitBranch,
  Workflow,
  TestTube,
  CheckSquare,
  LayoutDashboard,
  MessageCircle,
  Wrench,
  Brain,
  Mail,
  HardDrive,
} from "lucide-react";
import { theme } from "@/data/theme";

export const colors = theme;

export const nodeCategories: NodeCategory[] = [
  {
    id: "agents",
    name: "Agents",
    type: "agent",
    nodes: [
      {
        id: "agent",
        name: "Agent",
        icon: User,
        color: "#00c4ff",
        description: "Generic configurable AI agent",
        type: "agent",
        subtype: "generic",
        systemPrompt:
          "You are an autonomous agent operating in a workflow. You will receive further instructions and context.",
        personality: "Friendly, helpful, concise",
        escalationLogic: "If confidence < 0.7, escalate to human-handoff node.",
        confidenceThreshold: 0.7,
        defaultInputs: [
          { id: "prompt", label: "Prompt", type: "text" }, // <-- Add prompt input
          { id: "input-1", label: "Input", type: "text" },
          { id: "context", label: "Context", type: "data" },
        ],
        defaultOutputs: [
          { id: "output-1", label: "Response", type: "text" },
          { id: "metadata", label: "Metadata", type: "data" },
        ],
      },
      {
        id: "human-handoff",
        name: "Human Handoff",
        icon: UserCheck,
        color: "#ff9500",
        description: "Escalate to human operator when needed",
        type: "agent",
        subtype: "human-handoff",
        systemPrompt:
          "You are a human handoff agent. Escalate to a human operator when required.",
        personality: "Empathetic, patient",
        escalationLogic: "Always respond to escalations from agents.",
        confidenceThreshold: 1.0,
        defaultInputs: [
          { id: "trigger", label: "Trigger", type: "boolean" },
          { id: "context", label: "Context", type: "data" },
        ],
        defaultOutputs: [
          {
            id: "handoff-initiated",
            label: "Handoff Initiated",
            type: "boolean",
          },
          { id: "human-response", label: "Human Response", type: "text" },
        ],
      },
      {
        id: "tool-agent",
        name: "Tool Agent",
        icon: Wrench,
        color: "#ff9f0a",
        description: "Execute tools and APIs (web search, calculator, etc.)",
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
        id: "thinking",
        name: "Thinking",
        icon: Brain,
        color: "#8b5cf6",
        description: "Structured chain-of-thought reasoning with optional tool calls",
        type: "agent",
        subtype: "thinking",
        systemPrompt: "You are a careful, stepwise thinker. Break down problems methodically and provide clear reasoning for your conclusions.",
        style: "balanced",
        allowToolCalls: true,
        defaultInputs: [
          { id: "context", label: "Context", type: "text" },
          { id: "data", label: "Data", type: "json" },
        ],
        defaultOutputs: [
          { id: "result", label: "Result", type: "json" },
          { id: "reasoning", label: "Reasoning", type: "text" },
        ],
      },
      {
        id: "tool",
        name: "Tool",
        icon: Wrench,
        color: "#10b981",
        description: "Execute callable functions with mock/live modes",
        type: "agent",
        subtype: "tool",
        toolName: "web_search",
        mode: "mock",
        args: {},
        defaultInputs: [
          { id: "input", label: "Input", type: "text" },
          { id: "context", label: "Context", type: "json" },
        ],
        defaultOutputs: [
          { id: "result", label: "Result", type: "json" },
        ],
      },
    ],
  },
  {
    id: "conversation",
    name: "Conversation",
    type: "conversation",
    nodes: [
      {
        id: "message",
        name: "Message",
        icon: MessageSquare,
        color: "#34c759",
        description: "Handle agent/user dialogue exchange",
        type: "conversation",
        subtype: "message",
        systemPrompt:
          "You are a message handler. Format and route dialogue between agents and users.",
        defaultInputs: [
          { id: "user-input", label: "User Input", type: "text" },
          { id: "agent-response", label: "Agent Response", type: "text" },
        ],
        defaultOutputs: [
          { id: "formatted-message", label: "Formatted Message", type: "text" },
          {
            id: "conversation-state",
            label: "Conversation State",
            type: "data",
          },
        ],
      },
      {
        id: "message-formatter",
        name: "Message Formatter",
        icon: Mail,
        color: "#ff6b35",
        description: "Transform upstream data into human-facing messages with presets",
        type: "conversation",
        subtype: "message-formatter",
        preset: "chat",
        tone: "friendly",
        formatHint: "markdown",
        defaultInputs: [
          { id: "context", label: "Context", type: "text" },
          { id: "data", label: "Data", type: "json" },
        ],
        defaultOutputs: [
          { id: "message", label: "Formatted Message", type: "text" },
        ],
      },
      {
        id: "router",
        name: "Router",
        icon: GitBranch,
        color: "#f59e0b",
        description: "Route flow based on expression or LLM decision",
        type: "logic",
        subtype: "router",
        defaultInputs: [
          { id: "input", label: "Input", type: "any" },
        ],
        defaultOutputs: [
          { id: "true", label: "True", type: "any" },
          { id: "false", label: "False", type: "any" },
        ],
      },
      {
        id: "prompt-template",
        name: "Prompt Template",
        icon: FileText,
        color: "#6d28d9",
        description: "Inject variables into a text template",
        type: "conversation",
        subtype: "template",
        defaultInputs: [],
        defaultOutputs: [{ id: "result", label: "Generated Prompt" }],
      },
      {
        id: "memory",
        name: "Memory",
        icon: Database,
        color: "#8b5cf6",
        description: "Document ingestion and semantic retrieval",
        type: "conversation",
        subtype: "memory",
        defaultInputs: [
          { id: "query", label: "Query", type: "any" },
        ],
        defaultOutputs: [
          { id: "context", label: "Retrieved Context", type: "json" },
        ],
        defaultData: {
          indexName: "",
          ingestMode: "full",
          chunkSize: 800,
          chunkOverlap: 120,
          retrievalTopK: 5,
        },
      },
      {
        id: "knowledge-base",
        name: "Knowledge Base",
        icon: Database,
        color: "#ff2d92",
        description: "Provide contextual information and data",
        type: "conversation",
        subtype: "knowledge-base",
        systemPrompt:
          "You are a knowledge base node. Provide relevant information and context to agents.",
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
        id: "conversation-flow",
        name: "Conversation Flow",
        icon: MessageSquare,
        color: "#6366f1",
        description: "Design branching conversation flows with visual preview",
        type: "conversation",
        subtype: "conversation-flow",
        defaultInputs: [
          { id: "context", label: "Context", type: "data" },
          { id: "user-input", label: "User Input", type: "text" },
        ],
        defaultOutputs: [
          { id: "default", label: "Default", type: "text" },
          // Dynamic outputs will be added based on branches
        ],
      },
    ],
  },
  {
    id: "logic",
    name: "Logic",
    type: "logic",
    nodes: [
      {
        id: "if-else",
        name: "If/Else",
        icon: Settings,
        color: "#ff3b30",
        description: "Simple conditional branching logic",
        type: "logic",
        subtype: "if-else",
        systemPrompt:
          "You are a logic node. Evaluate conditions and route data accordingly.",
        defaultInputs: [
          { id: "condition", label: "Condition", type: "boolean" },
          { id: "data", label: "Data", type: "data" },
        ],
        defaultOutputs: [
          { id: "true-path", label: "True", type: "data" },
          { id: "false-path", label: "False", type: "data" },
        ],
      },
      {
        id: "decision-tree",
        name: "Decision Tree",
        icon: GitBranch,
        color: "#af52de",
        description: "Complex multi-branch decision making",
        type: "logic",
        subtype: "decision-tree",
        systemPrompt:
          "You are a decision tree node. Make multi-branch decisions based on input and rules.",
        defaultInputs: [
          { id: "input-data", label: "Input Data", type: "data" },
          { id: "rules", label: "Rules", type: "data" },
        ],
        defaultOutputs: [
          { id: "branch-a", label: "Branch A", type: "data" },
          { id: "branch-b", label: "Branch B", type: "data" },
          { id: "branch-c", label: "Branch C", type: "data" },
          { id: "default", label: "Default", type: "data" },
        ],
      },
      {
        id: "state-machine",
        name: "State Machine",
        icon: Workflow,
        color: "#007aff",
        description: "Track and manage conversation state",
        type: "logic",
        subtype: "state-machine",
        systemPrompt:
          "You are a state machine node. Track and manage the state of the workflow.",
        defaultInputs: [
          { id: "current-state", label: "Current State", type: "text" },
          { id: "event", label: "Event", type: "text" },
          { id: "data", label: "Data", type: "data" },
        ],
        defaultOutputs: [
          { id: "next-state", label: "Next State", type: "text" },
          { id: "actions", label: "Actions", type: "data" },
          { id: "state-data", label: "State Data", type: "data" },
        ],
      },
    ],
  },
  {
    id: "testing",
    name: "Testing",
    type: "testing",
    nodes: [
      {
        id: "simulator",
        name: "Simulator",
        icon: TestTube,
        color: "#30d158",
        description: "Test with real AI responses and scenarios",
        type: "testing",
        subtype: "simulator",
        systemPrompt:
          "You are a simulator node. Test agent responses and scenarios in the workflow.",
        defaultInputs: [
          { id: "test-input", label: "Test Input", type: "text" },
          { id: "config", label: "Config", type: "data" },
        ],
        defaultOutputs: [
          { id: "simulation-result", label: "Simulation Result", type: "data" },
          {
            id: "performance-metrics",
            label: "Performance Metrics",
            type: "data",
          },
        ],
      },
      {
        id: "test-case",
        name: "Test Case",
        icon: CheckSquare,
        color: "#ff9f0a",
        description: "Define specific testing scenarios and assertions",
        type: "testing",
        subtype: "test-case",
        systemPrompt:
          "You are a test case node. Define and validate specific scenarios and assertions.",
        defaultInputs: [
          { id: "input-scenario", label: "Input Scenario", type: "text" },
          { id: "expected-output", label: "Expected Output", type: "text" },
        ],
        defaultOutputs: [
          { id: "test-result", label: "Test Result", type: "boolean" },
          { id: "assertion-details", label: "Assertion Details", type: "data" },
        ],
      },
    ],
  },
  {
    id: "ui",
    name: "UI",
    type: "ui",
    nodes: [
      {
        id: "dashboard",
        name: "Dashboard",
        icon: LayoutDashboard,
        color: "#64d2ff",
        description: "Monitor and control agent system",
        type: "ui",
        subtype: "dashboard",
        systemPrompt:
          "You are a dashboard node. Monitor and control the agent system, displaying metrics and status.",
        defaultInputs: [
          { id: "metrics", label: "Metrics", type: "data" },
          { id: "status", label: "Status", type: "data" },
        ],
        defaultOutputs: [
          { id: "user-actions", label: "User Actions", type: "data" },
          { id: "display-data", label: "Display Data", type: "data" },
        ],
      },
      {
        id: "chat-interface",
        name: "Chat Interface",
        icon: MessageCircle,
        color: "#6c63ff",
        description: "User input chatbox for end-user interaction",
        type: "ui",
        subtype: "chat",
        defaultInputs: [],
        defaultOutputs: [
          { id: "user-message", label: "User Message", type: "text" },
        ],
      },
    ],
  },
];
