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
  const safeData: PromptTemplateNodeData = isPromptTemplateNodeData(node.data)
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

  const [variables, setVariables] = useState<Record<string, string>>(
    () => safeData.variables || {}
  );

  const handleFieldChange = (
    field: keyof PromptTemplateNodeData,
    value: unknown
  ) => {
    if (isPromptTemplateNodeData(node.data)) {
      const updatedData: PromptTemplateNodeData = {
        ...node.data,
        [field]: value,
        title: node.data.title,
        description: node.data.description,
        color: node.data.color,
        icon: node.data.icon,
      };
      onChange({ ...node, data: updatedData });
    } else {
      // Do not update if not correct type
      return;
    }
  };

  const handleVariableChange = (key: string, value: string) => {
    const next = { ...variables, [key]: value };
    setVariables(next);
    handleFieldChange("variables", next);
  };

  const handleAddVariable = () => {
    const newKey = `var${Object.keys(variables).length + 1}`;
    const next = { ...variables, [newKey]: "" };
    setVariables(next);
  };

  const handleRemoveVariable = (key: string) => {
    const next = { ...variables };
    delete next[key];
    setVariables(next);
    handleFieldChange("variables", next);
  };

  const panelStyle: React.CSSProperties = {
    background: theme.colors.background,
    borderLeft: `1px solid ${theme.colors.border}`,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    minHeight: 0,
    height: "100%",
    width: '100%',
    minWidth: 0,
    maxWidth: '100%',
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
          value={safeData.template || ""}
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
        {Object.entries(variables).map(([key, value]) => (
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
                const next = { ...variables };
                next[newKey] = next[key];
                delete next[key];
                setVariables(next);
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
        <VSCodeButton style={{ marginTop: theme.spacing.xs }} onClick={handleAddVariable}>
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
            checked={!!safeData.extractVariablesFromInput}
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
