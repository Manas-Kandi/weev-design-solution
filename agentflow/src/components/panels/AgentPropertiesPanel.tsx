// Simplified Agent Properties Panel with single behavior text box
import React, { useEffect, useState } from "react";
import { CanvasNode } from "@/types";
import { figmaPropertiesTheme as theme } from "./propertiesPanelTheme";

interface AgentNodeData {
  // User-defined behavior that gets appended to system prompt
  behavior?: string;
  
  // Backend system prompt (hidden from UI)
  systemPrompt?: string;
  
  // Legacy fields for backward compatibility (hidden from UI)
  name?: string;
  role?: string;
  personality?: string;
  escalationThreshold?: number;
  escalationMessage?: string;
  model?: string;
  provider?: "nvidia" | "gemini";
  temperature?: number;
  maxTokens?: number;
  responseFormat?: string;
  personalityTags?: string[];
  enableFunctionCalling?: boolean;
  confidenceThreshold?: number;
  contextWindow?: number;
  [key: string]: unknown;
}

interface AgentPropertiesPanelProps {
  node: CanvasNode & { data: AgentNodeData };
  onChange: (node: CanvasNode & { data: AgentNodeData }) => void;
}

// Default system prompt for all agents (backend only, not shown to user)
const DEFAULT_SYSTEM_PROMPT = `You are an intelligent reasoning agent in an agentic workflow system. Your role is to:
1. Analyze incoming information and context carefully
2. Perform deep reasoning about the task at hand
3. Decide what resources or tools you need to access (knowledge base, web search, calendar, etc.)
4. Formulate clear, logical responses based on your analysis
5. Route information to the appropriate next step in the workflow

You will receive context from connected nodes and should use that information to make informed decisions.
Always explain your reasoning process when making decisions.`;

// Helper function to ensure system prompt exists
function ensureSystemPrompt(data: AgentNodeData): string {
  // If there's a legacy personality or role, build a system prompt from it
  if (!data.systemPrompt && (data.personality || data.role)) {
    const parts: string[] = [];
    if (data.personality) {
      parts.push(`Personality: ${data.personality}`);
    }
    if (data.role) {
      parts.push(`Role: ${data.role}`);
    }
    return parts.join('\n\n') + '\n\n' + DEFAULT_SYSTEM_PROMPT;
  }
  
  // Return existing system prompt or default
  return data.systemPrompt || DEFAULT_SYSTEM_PROMPT;
}

export default function AgentPropertiesPanel({
  node,
  onChange,
}: AgentPropertiesPanelProps) {
  const data = node.data;
  
  // Initialize behavior from existing data (user's custom behavior only)
  const [behavior, setBehavior] = useState<string>(data.behavior || '');
  
  // Update node data when behavior changes
  useEffect(() => {
    if (behavior !== data.behavior) {
      // Ensure system prompt exists (backend only)
      const systemPrompt = ensureSystemPrompt(data);
      const updatedData = { ...data, behavior, systemPrompt };
      onChange({ ...node, data: updatedData });
    }
  }, [behavior]);
  
  // Update local state if node changes externally
  useEffect(() => {
    if (data.behavior !== behavior) {
      setBehavior(data.behavior || '');
    }
  }, [node.id]);

  // Styles
  const containerStyle: React.CSSProperties = {
    padding: theme.spacing.lg,
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing.md,
    height: "100%",
  };
  
  const titleStyle: React.CSSProperties = {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    margin: 0,
    fontFamily: theme.typography.fontFamily,
  };
  
  const subtitleStyle: React.CSSProperties = {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
    margin: 0,
    fontFamily: theme.typography.fontFamily,
  };
  
  const textAreaStyle: React.CSSProperties = {
    width: "100%",
    minHeight: "200px",
    maxHeight: "400px",
    padding: theme.spacing.md,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.md,
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily,
    lineHeight: theme.typography.lineHeight.relaxed,
    resize: "vertical",
    outline: "none",
    transition: "border-color 0.2s, background-color 0.2s",
  };
  
  const textAreaFocusStyle: React.CSSProperties = {
    borderColor: theme.colors.buttonPrimary,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  };

  return (
    <div style={containerStyle}>
      {/* Title */}
      <h3 style={titleStyle}>Agent Behavior</h3>
      
      {/* Subtitle */}
      <p style={subtitleStyle}>
        Describe what you want this agent to do
      </p>
      
      {/* Behavior Text Area */}
      <textarea
        value={behavior}
        onChange={(e) => setBehavior(e.target.value)}
        placeholder="e.g., Summarize customer queries, search the web if needed, and respond in a friendly tone."
        style={textAreaStyle}
        onFocus={(e) => {
          Object.assign(e.target.style, textAreaFocusStyle);
        }}
        onBlur={(e) => {
          e.target.style.borderColor = theme.colors.border;
          e.target.style.backgroundColor = "rgba(255, 255, 255, 0.03)";
        }}
      />
    </div>
  );
}
