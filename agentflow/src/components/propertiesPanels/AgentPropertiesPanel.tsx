// All UI rules for properties panels must come from propertiesPanelTheme.ts
import React, { useState } from "react";
import { propertiesPanelTheme as theme } from "./propertiesPanelTheme";
import { CanvasNode } from "@/types";
import { Input } from "@/components/ui/input";
import PanelSection from "./PanelSection";

// TODO: Add unit tests for this panel to ensure type safety and prevent regressions.

interface AgentNodeData {
  name?: string;
  role?: string;
  personality?: string;
  systemPrompt?: string;
  escalationThreshold?: number;
  model?: string;
  temperature?: number;
  // Example: extract and manage personality tags
}

interface AgentPropertiesPanelProps {
  node: CanvasNode & { data: AgentNodeData };
  onChange: (node: CanvasNode & { data: AgentNodeData }) => void;
}

export default function AgentPropertiesPanel({
  node,
  onChange,
}: AgentPropertiesPanelProps) {
  // Example: extract and manage personality tags
  const [personalityTags, setPersonalityTags] = useState<string[]>(() => {
    if ((node.data as AgentNodeData)?.personality) {
      return (node.data as AgentNodeData)
        .personality!.split(",")
        .map((t: string) => t.trim())
        .filter(Boolean);
    }
    return [];
  });

  const handleFieldChange = (field: string, value: unknown) => {
    onChange({ ...node, data: { ...node.data, [field]: value } });
  };

  // Compose panel style from theme
  const panelStyle: React.CSSProperties = {
    background: theme.colors.background,
    borderLeft: `1px solid ${theme.colors.border}`,
    padding: theme.spacing.sectionPadding,
    borderRadius: theme.borderRadius.section,
    minHeight: 0,
    height: "100%",
    width: 360,
    minWidth: 360,
    maxWidth: 360,
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing.fieldGap,
    boxSizing: "border-box",
    overflowY: "auto",
  };

  return (
    <div style={panelStyle}>
      {/* Basic Configuration */}
      <PanelSection
        title="Basic Configuration"
        description="Agent name and role"
      >
        <label
          style={{
            display: "block",
            marginBottom: 4,
            color: theme.colors.label,
            font: theme.font.label,
          }}
        >
          Agent Name
        </label>
        <Input
          value={node.data?.name || ""}
          onChange={(e) => handleFieldChange("name", e.target.value)}
          placeholder="Agent name"
        />
        <label
          style={{
            display: "block",
            marginBottom: 4,
            marginTop: 12,
            color: theme.colors.label,
            font: theme.font.label,
          }}
        >
          Role
        </label>
        <Input
          value={node.data?.role || ""}
          onChange={(e) => handleFieldChange("role", e.target.value)}
          placeholder="Agent role"
        />
      </PanelSection>
      {/* Agent Behavior */}
      <PanelSection title="Agent Behavior" description="Personality and style">
        <label
          style={{
            display: "block",
            marginBottom: 4,
            color: theme.colors.label,
            font: theme.font.label,
          }}
        >
          Personality Tags
        </label>
        <Input
          value={personalityTags.join(", ")}
          onChange={(e) => {
            setPersonalityTags(e.target.value.split(",").map((t) => t.trim()));
            handleFieldChange("personality", e.target.value);
          }}
          placeholder="e.g. friendly, concise, expert"
        />
        <div
          style={{ marginTop: 4, color: theme.colors.inputText, fontSize: 12 }}
        >
          Comma-separated. E.g. <code>friendly, concise, expert</code>
        </div>
      </PanelSection>
      {/* Now PanelSection blocks follow */}
      <PanelSection
        title="System Prompt"
        description="Instructions for the agent's behavior"
      >
        <label
          style={{
            display: "block",
            marginBottom: 4,
            color: theme.colors.label,
            font: theme.font.label,
          }}
        >
          System Prompt
        </label>
        <Input
          value={node.data?.systemPrompt || ""}
          onChange={(e) => handleFieldChange("systemPrompt", e.target.value)}
          placeholder="You are a helpful assistant..."
        />
      </PanelSection>
      <PanelSection
        title="Escalation"
        description="Configure escalation threshold (0-10)"
      >
        <label
          style={{
            display: "block",
            marginBottom: 4,
            color: theme.colors.label,
            font: theme.font.label,
          }}
        >
          Escalation Threshold
        </label>
        <Input
          type="number"
          value={node.data?.escalationThreshold ?? 0}
          min={0}
          max={10}
          step={1}
          onChange={(e) =>
            handleFieldChange("escalationThreshold", Number(e.target.value))
          }
        />
      </PanelSection>
      <PanelSection
        title="LLM Settings"
        description="Model and temperature for agent reasoning"
      >
        <label
          style={{
            display: "block",
            marginBottom: 4,
            color: theme.colors.label,
            font: theme.font.label,
          }}
        >
          Model
        </label>
        <Input
          value={node.data?.model || "gemini-2.5-flash-lite"}
          onChange={(e) => handleFieldChange("model", e.target.value)}
        />
        <label
          style={{
            display: "block",
            marginBottom: 4,
            marginTop: 8,
            color: theme.colors.label,
            font: theme.font.label,
          }}
        >
          Temperature
        </label>
        <Input
          type="number"
          value={node.data?.temperature ?? 0.7}
          min={0}
          max={1}
          step={0.01}
          onChange={(e) =>
            handleFieldChange("temperature", Number(e.target.value))
          }
        />
      </PanelSection>
    </div>
  );
}
