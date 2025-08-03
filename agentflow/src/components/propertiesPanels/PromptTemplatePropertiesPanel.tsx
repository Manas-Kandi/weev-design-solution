// All UI rules for properties panels must come from propertiesPanelTheme.ts
import React, { useState } from "react";
import { figmaPropertiesTheme as theme } from "./propertiesPanelTheme";
import { CanvasNode, PromptTemplateNodeData } from "@/types";
import { PanelSection } from "./PanelSection";
import { VSCodeInput, VSCodeButton } from "./vsCodeFormComponents";

interface PromptTemplatePropertiesPanelProps {
  node: CanvasNode;
  onChange: (node: CanvasNode) => void;
}

function isPromptTemplateNodeData(
  data: unknown
): data is PromptTemplateNodeData {
  return (
    typeof data === "object" &&
    data !== null &&
    ("template" in data || "variables" in data)
  );
}

export default function PromptTemplatePropertiesPanel({
  node,
  onChange,
}: PromptTemplatePropertiesPanelProps) {
  const initialData: PromptTemplateNodeData = isPromptTemplateNodeData(node.data)
    ? (node.data as PromptTemplateNodeData)
    : {
        title: "",
        description: "",
        color: "",
        icon: "",
        template: "",
        variables: {},
        extractVariablesFromInput: false,
      };

  const [data, setData] = useState<PromptTemplateNodeData>(initialData);

  const handleFieldChange = (
    field: keyof PromptTemplateNodeData,
    value: unknown
  ) => {
    setData((prev) => {
      const updated = { ...prev, [field]: value };
      onChange({ ...node, data: { ...node.data, ...updated } });
      return updated;
    });
  };

  const handleVariableChange = (key: string, value: string) => {
    const next = { ...(data.variables || {}), [key]: value };
    handleFieldChange("variables", next);
  };

  const handleAddVariable = () => {
    const vars = data.variables || {};
    const newKey = `var${Object.keys(vars).length + 1}`;
    const next = { ...vars, [newKey]: "" };
    handleFieldChange("variables", next);
  };

  const handleRemoveVariable = (key: string) => {
    const vars = { ...(data.variables || {}) };
    delete vars[key];
    handleFieldChange("variables", vars);
  };

  const panelStyle: React.CSSProperties = {
    background: theme.colors.background,
    borderLeft: `1px solid ${theme.colors.border}`,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    minHeight: 0,
    height: "100%",
    width: "100%",
    minWidth: 0,
    maxWidth: "100%",
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing.lg,
    boxSizing: "border-box",
    overflowY: "auto",
    overflowX: "hidden",
  };

  return (
    <div style={panelStyle}>
      <PanelSection
        title="Prompt Template"
        description="Define the main prompt template for this node."
      >
        <VSCodeInput
          value={data.template || ""}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleFieldChange("template", e.target.value)
          }
          placeholder="Enter prompt template..."
        />
      </PanelSection>
      <PanelSection
        title="Variables"
        description="Define and map prompt variables."
      >
        {Object.entries(data.variables || {}).map(([key, value]) => (
          <div
            key={key}
            style={{
              display: "flex",
              gap: theme.spacing.xs,
              marginBottom: theme.spacing.xs,
            }}
          >
            <VSCodeInput
              value={key}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const newKey = e.target.value;
                const next = { ...(data.variables || {}) };
                next[newKey] = next[key];
                delete next[key];
                handleFieldChange("variables", next);
              }}
              placeholder="Variable name"
            />
            <VSCodeInput
              value={value}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleVariableChange(key, e.target.value)
              }
              placeholder="Value"
            />
            <VSCodeButton
              style={{ minWidth: 32 }}
              variant="danger"
              size="small"
              onClick={() => handleRemoveVariable(key)}
            >
              -
            </VSCodeButton>
          </div>
        ))}
        <VSCodeButton
          style={{ marginTop: theme.spacing.xs }}
          onClick={handleAddVariable}
        >
          Add Variable
        </VSCodeButton>
      </PanelSection>
      <PanelSection
        title="Advanced Options"
        description="Optional advanced settings."
      >
        <label
          style={{
            fontSize: theme.typography.fontSize.base,
            display: "flex",
            alignItems: "center",
            gap: theme.spacing.xs,
            fontFamily: theme.typography.fontFamily,
            color: theme.colors.textPrimary,
          }}
        >
          <input
            type="checkbox"
            checked={!!data.extractVariablesFromInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleFieldChange("extractVariablesFromInput", e.target.checked)
            }
            style={{
              accentColor: theme.colors.info,
              width: 16,
              height: 16,
              borderRadius: theme.borderRadius.md,
              border: `1px solid ${theme.colors.border}`,
            }}
          />
          Extract variables from input
        </label>
      </PanelSection>
    </div>
  );
}
// TODO: Add unit tests for this panel to ensure type safety and prevent regressions.
