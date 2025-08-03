// All UI rules for properties panels must come from propertiesPanelTheme.ts
// Enhanced Agent Properties Panel with VS Code styling
import React from "react";
import {
  Bot,
  Settings,
  Zap,
  Brain,
  AlertTriangle,
  Info,
  MessageSquare,
} from "lucide-react";
import { CanvasNode } from "@/types";
import { figmaPropertiesTheme as theme, getPanelContainerStyle } from "./propertiesPanelTheme";
import { PanelSection } from "./PanelSection";
import {
  VSCodeInput,
  VSCodeSelect,
  VSCodeButton,
} from "./vsCodeFormComponents";

interface AgentNodeData {
  name?: string;
  role?: string;
  personality?: string;
  systemPrompt?: string;
  escalationThreshold?: number;
  escalationMessage?: string;
  model?: string;
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

export default function AgentPropertiesPanel({
  node,
  onChange,
}: AgentPropertiesPanelProps) {
  const data = node.data;

  // Model options with descriptions
  const modelOptions = [
    { value: "gemini-pro", label: "Gemini Pro" },
    { value: "gemini-pro-vision", label: "Gemini Pro Vision" },
    { value: "gemini-ultra", label: "Gemini Ultra" },
  ];

  const responseFormatOptions = [
    { value: "text", label: "Text" },
    { value: "json", label: "JSON" },
    { value: "markdown", label: "Markdown" },
  ];

  const handleFieldChange = (field: keyof AgentNodeData, value: unknown) => {
    const updatedData = { ...data, [field]: value };
    onChange({ ...node, data: updatedData });
  };

  // Use theme-driven panel container style
  // Header and content styles (theme-driven, no container)
  const headerStyle: React.CSSProperties = {
    padding: theme.spacing.lg,
    borderBottom: `1px solid ${theme.colors.border}`,
    backgroundColor: theme.colors.backgroundSecondary,
    display: "flex",
    alignItems: "center",
    gap: theme.spacing.md,
  };
  const headerTitleStyle: React.CSSProperties = {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    margin: 0,
    lineHeight: theme.typography.lineHeight.tight,
    fontFamily: theme.typography.fontFamily,
  };
  const headerSubtitleStyle: React.CSSProperties = {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    margin: `${theme.spacing.xs} 0 0 0`,
    lineHeight: theme.typography.lineHeight.normal,
    fontFamily: theme.typography.fontFamily,
  };
  const contentStyle: React.CSSProperties = {
    padding: theme.spacing.lg,
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing.lg,
    flex: 1,
  };
  return (
    <div style={getPanelContainerStyle()}>
      {/* Panel Header */}
      <div style={headerStyle}>
        <div
          style={{
            backgroundColor: theme.colors.buttonPrimary,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.md,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Bot size={20} color="white" />
        </div>
        <div>
          <h2 style={headerTitleStyle}>Agent Configuration</h2>
          <p style={headerSubtitleStyle}>
            {data.name || "Unnamed Agent"} • {data.model || "No model selected"}
          </p>
        </div>
      </div>

      {/* Panel Content */}
      <div style={contentStyle}>
        {/* Basic Configuration */}
        <PanelSection
          title="Basic Configuration"
          description="Agent name and role"
          icon={<Settings size={16} />}
        >
          <label
            style={{
              color: "#b3b3b3",
              fontSize: 14,
              marginBottom: 4,
            }}
          >
            Agent Name
          </label>
          <VSCodeInput
            placeholder="e.g., Customer Support Agent"
            value={data.name || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleFieldChange("name", e.target.value)
            }
          />
          <label
            style={{
              color: "#b3b3b3",
              fontSize: 14,
              marginTop: 8,
              marginBottom: 4,
            }}
          >
            Role
          </label>
          <VSCodeInput
            placeholder="e.g., Help customers with product inquiries"
            value={data.role || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleFieldChange("role", e.target.value)
            }
          />
        </PanelSection>

        {/* Model Configuration */}
        <PanelSection
          title="Model Configuration"
          description="AI model and performance settings"
          icon={<Brain size={16} />}
        >
          <label
            style={{
              color: "#b3b3b3",
              fontSize: 14,
              marginTop: 8,
              marginBottom: 4,
            }}
          >
            Model
          </label>
          <VSCodeSelect
            value={data.model || "gemini-pro"}
            options={modelOptions}
            onValueChange={(value: string) => handleFieldChange("model", value)}
          />

          {/* TODO: VSCodeSlider not implemented. Insert slider for Temperature here. */}

          {/* TODO: VSCodeSlider not implemented. Insert slider for Max Tokens here. */}

          <label
            style={{
              color: "#b3b3b3",
              fontSize: 14,
              marginTop: 8,
              marginBottom: 4,
            }}
          >
            Response Format
          </label>
          <VSCodeSelect
            value={data.responseFormat || "text"}
            options={responseFormatOptions}
            onValueChange={(value: string) =>
              handleFieldChange("responseFormat", value)
            }
          />
        </PanelSection>

        {/* Agent Behavior */}
        <PanelSection
          title="Agent Behavior"
          description="Personality and behavioral settings"
          icon={<MessageSquare size={16} />}
        >
          <label
            style={{
              color: "#b3b3b3",
              fontSize: 14,
              marginTop: 8,
              marginBottom: 4,
            }}
          >
            Personality Tags
          </label>
          {/* TODO: VSCodeTagInput not implemented. Insert tag input for Personality Tags here. */}

          <label
            style={{
              color: "#b3b3b3",
              fontSize: 14,
              marginTop: 8,
              marginBottom: 4,
            }}
          >
            System Prompt
          </label>
          <VSCodeInput
            placeholder="You are a helpful assistant that..."
            value={data.systemPrompt || ""}
            onChange={(
              e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
            ) => handleFieldChange("systemPrompt", e.target.value)}
            type="textarea"
          />
        </PanelSection>

        {/* Advanced Settings */}
        <PanelSection
          title="Advanced Settings"
          description="Fine-tune agent capabilities"
          icon={<Zap size={16} />}
          defaultCollapsed={true}
        >
          {/* TODO: VSCodeSlider not implemented. Insert slider for Confidence Threshold here. */}
          {/* TODO: VSCodeToggle not implemented. Insert toggle for Function Calling here. */}
          {/* TODO: VSCodeSlider not implemented. Insert slider for Context Window here. */}
          <div />
        </PanelSection>

        {/* Escalation Logic */}
        <PanelSection
          title="Escalation Logic"
          description="When and how to escalate to humans"
          icon={<AlertTriangle size={16} />}
          defaultCollapsed={true}
        >
          {/* TODO: VSCodeSlider not implemented. Insert slider for Escalation Threshold here. */}

          <label
            style={{
              color: "#b3b3b3",
              fontSize: 14,
              marginTop: 8,
              marginBottom: 4,
            }}
          >
            Escalation Message
          </label>
          <VSCodeInput
            placeholder="Let me connect you with a human specialist..."
            value={data.escalationMessage || ""}
            onChange={(
              e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
            ) => handleFieldChange("escalationMessage", e.target.value)}
            type="textarea"
          />
        </PanelSection>

        {/* Testing & Preview */}
        <PanelSection
          title="Testing & Preview"
          description="Test your agent configuration"
          icon={<Info size={16} />}
          actions={
            <VSCodeButton
              variant="primary"
              size="small"
              onClick={() => {
                // Trigger agent test
                console.log("Testing agent with current configuration...");
              }}
            >
              Test Agent
            </VSCodeButton>
          }
        >
          <div
            style={{
              backgroundColor: "#18181b",
              border: `1px solid ${theme.colors.border}`,
              borderRadius: 6,
              padding: 16,
              fontFamily: "Menlo, monospace",
              fontSize: 14,
              color: "#b3b3b3",
              lineHeight: 1.6,
            }}
          >
            <div
              style={{
                color: "#22c55e",
                marginBottom: 8,
              }}
            >
              ✓ Agent Configuration Preview
            </div>
            <div>
              Model:{" "}
              <span style={{ color: "#0ea5e9" }}>
                {data.model || "gemini-pro"}
              </span>
            </div>
            <div>
              Temperature:{" "}
              <span style={{ color: "#0ea5e9" }}>
                {data.temperature || 0.7}
              </span>
            </div>
            <div>
              Max Tokens:{" "}
              <span style={{ color: "#0ea5e9" }}>{data.maxTokens || 1000}</span>
            </div>
            <div>
              Personality:{" "}
              <span style={{ color: "#0ea5e9" }}>
                {(data.personalityTags || []).join(", ") || "None set"}
              </span>
            </div>
          </div>

          <VSCodeButton
            variant="primary"
            style={{ width: "100%" }}
            onClick={() => {
              // Open chat preview
              console.log("Opening chat preview...");
            }}
          >
            <MessageSquare
              size={16}
              style={{ marginRight: 8, verticalAlign: "middle" }}
            />
            Preview Chat Interface
          </VSCodeButton>
        </PanelSection>
      </div>
    </div>
  );
}
