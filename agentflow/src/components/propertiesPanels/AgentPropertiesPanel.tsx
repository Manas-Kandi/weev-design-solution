import React, { useState } from "react";
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

  // ... (Add more handlers as needed)

  return (
    <div className="flex flex-col gap-4">
      {/* Basic Configuration */}
      <PanelSection
        title="Basic Configuration"
        description="Agent name and role"
      >
        <label className="block mb-1 text-[var(--af-label-size)] font-semibold text-[var(--af-text-secondary)]">
          Agent Name
        </label>
        <input
          className="w-full rounded-[var(--af-border-radius)] bg-[var(--af-panel-bg)] border border-[var(--af-border)] px-3 py-2 text-[var(--af-text-secondary)] focus:ring-2 focus:ring-[var(--af-accent)] transition-all duration-200"
          value={node.data?.name || ""}
          onChange={(e) => handleFieldChange("name", e.target.value)}
        />
        <label className="block mb-1 mt-3 text-[var(--af-label-size)] font-semibold text-[var(--af-text-secondary)]">
          Role
        </label>
        <input
          className="w-full rounded-[var(--af-border-radius)] bg-[var(--af-panel-bg)] border border-[var(--af-border)] px-3 py-2 text-[var(--af-text-secondary)] focus:ring-2 focus:ring-[var(--af-accent)] transition-all duration-200"
          value={node.data?.role || ""}
          onChange={(e) => handleFieldChange("role", e.target.value)}
        />
      </PanelSection>
      {/* Agent Behavior */}
      <PanelSection title="Agent Behavior" description="Personality and style">
        <label className="block mb-1 text-[var(--af-label-size)] font-semibold text-[var(--af-text-secondary)]">
          Personality Tags
        </label>
        <input
          className="w-full rounded-[var(--af-border-radius)] bg-[var(--af-panel-bg)] border border-[var(--af-border)] px-3 py-2 text-[var(--af-text-secondary)] focus:ring-2 focus:ring-[var(--af-accent)] transition-all duration-200"
          value={personalityTags.join(", ")}
          onChange={(e) => {
            setPersonalityTags(e.target.value.split(",").map((t) => t.trim()));
            handleFieldChange("personality", e.target.value);
          }}
          placeholder="e.g. friendly, concise, expert"
        />
        <div className="mt-1 text-[var(--af-helper-size)] text-[var(--af-text-helper)]">
          Comma-separated. E.g. <code>friendly, concise, expert</code>
        </div>
      </PanelSection>
      {/* Now PanelSection blocks follow */}
      <PanelSection
        title="System Prompt"
        description="Instructions for the agent's behavior"
      >
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted">System Prompt</span>
          <Input
            value={node.data?.systemPrompt || ""}
            onChange={(e) => handleFieldChange("systemPrompt", e.target.value)}
            placeholder="You are a helpful assistant..."
          />
        </label>
      </PanelSection>
      <PanelSection
        title="Escalation"
        description="Configure escalation threshold (0-10)"
      >
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted">Escalation Threshold</span>
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
        </label>
      </PanelSection>
      <PanelSection
        title="LLM Settings"
        description="Model and temperature for agent reasoning"
      >
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted">Model</span>
          <Input
            value={node.data?.model || "gemini-2.5-flash-lite"}
            onChange={(e) => handleFieldChange("model", e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 mt-2">
          <span className="text-xs text-muted">Temperature</span>
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
        </label>
      </PanelSection>
    </div>
  );
}
