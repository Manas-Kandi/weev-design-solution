import React, { useState } from "react";
import { CanvasNode, PromptTemplateNodeData } from "@/types";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import PanelSection from "./PanelSection";

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

  return (
    <div className="flex flex-col gap-4">
      <PanelSection title="Prompt Template" description="Define the main prompt template for this node.">
        <Input
          value={safeData.template || ""}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleFieldChange("template", e.target.value)
          }
          placeholder="Enter prompt template..."
        />
      </PanelSection>
      <PanelSection title="Variables" description="Define and map prompt variables.">
        {Object.entries(variables).map(([key, value]) => (
          <div key={key} className="flex gap-2 mb-2">
            <Input
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
            <Input
              value={value}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleVariableChange(key, e.target.value)
              }
              placeholder="Value"
            />
            <Button onClick={() => handleRemoveVariable(key)}>-</Button>
          </div>
        ))}
        <Button onClick={handleAddVariable}>Add Variable</Button>
      </PanelSection>
      <PanelSection title="Advanced Options" description="Optional advanced settings.">
        <label className="text-sm flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!safeData.extractVariablesFromInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleFieldChange("extractVariablesFromInput", e.target.checked)
            }
          />
          Extract variables from input
        </label>
      </PanelSection>
    </div>
  );
}
// TODO: Add unit tests for this panel to ensure type safety and prevent regressions.
