import React, { useState } from "react";
import { CanvasNode } from "@/types";
import { Input } from "@/components/ui/input";

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
      <section>
        <h3 className="text-accent font-semibold mb-2">Basic Configuration</h3>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted">Agent Name</span>
          <Input
            value={node.data?.name || ""}
            onChange={(e) => handleFieldChange("name", e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted">Role</span>
          <Input
            value={node.data?.role || ""}
            onChange={(e) => handleFieldChange("role", e.target.value)}
          />
        </label>
      </section>
      {/* Agent Behavior */}
      <section>
        <h3 className="text-accent font-semibold mb-2">Agent Behavior</h3>
        <div className="flex flex-wrap gap-2 mb-2">
          {personalityTags.map((tag, idx) => (
            <span
              key={idx}
              className="bg-accent/20 text-accent px-2 py-1 rounded text-xs flex items-center"
            >
              {tag}
              <button
                className="ml-1 text-error hover:underline"
                onClick={() => {
                  const next = personalityTags.filter((t, i) => i !== idx);
                  setPersonalityTags(next);
                  handleFieldChange("personality", next.join(", "));
                }}
                aria-label="Remove tag"
              >
                ×
              </button>
            </span>
          ))}
          <Input
            placeholder="Add tag"
            value={""}
            onChange={(e) => {
              const val = e.target.value.trim();
              if (val && !personalityTags.includes(val)) {
                const next = [...personalityTags, val];
                setPersonalityTags(next);
                handleFieldChange("personality", next.join(", "));
              }
            }}
            className="w-24"
          />
        </div>
      </section>
      {/* System Instructions */}
      <section>
        <h3 className="text-accent font-semibold mb-2">System Instructions</h3>
        <textarea
          className="w-full min-h-[64px] bg-panel border border-border rounded p-2 text-text"
          value={node.data?.systemPrompt || ""}
          onChange={(e) => handleFieldChange("systemPrompt", e.target.value)}
          placeholder="System prompt for this agent..."
        />
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted">Escalation Threshold</span>
          <Input
            type="number"
            value={node.data?.escalationThreshold || 0}
            onChange={(e) =>
              handleFieldChange("escalationThreshold", Number(e.target.value))
            }
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted">Model</span>
          <Input
            value={node.data?.model || "gemini-2.5-flash-lite"}
            onChange={(e) => handleFieldChange("model", e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
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
      </section>
    </div>
  );
}
