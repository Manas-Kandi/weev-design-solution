// All UI rules for properties panels must come from propertiesPanelTheme.ts
import React, { useState } from "react";
import { figmaPropertiesTheme as theme } from "./propertiesPanelTheme";
import { CanvasNode } from "@/types";
import { PanelSection } from "../primitives/PanelSection";
import {
  VSCodeInput,
  VSCodeSelect,
  VSCodeButton,
} from "../primitives/vsCodeFormComponents";

interface DecisionTreeNodeData {
  title: string;
  description: string;
  color: string;
  icon: string;
  id: string;
  type: string;
  position: { x: number; y: number };
  inputs: string[];
  outputs: string[];
  rules: { condition: string; outputPath: string }[];
  defaultPath: string;
  evaluationMode: string;
}

interface DecisionTreePropertiesPanelProps {
  node: CanvasNode;
  onChange: (node: CanvasNode) => void;
}

const evalModes = [
  { value: "sequential", label: "Sequential" },
  { value: "priority", label: "Priority" },
  { value: "llm", label: "LLM" },
];

function isDecisionTreeNodeData(data: unknown): data is DecisionTreeNodeData {
  return (
    typeof data === "object" &&
    data !== null &&
    Array.isArray((data as DecisionTreeNodeData).rules) &&
    typeof (data as DecisionTreeNodeData).defaultPath === "string" &&
    typeof (data as DecisionTreeNodeData).evaluationMode === "string"
  );
}

export default function DecisionTreePropertiesPanel({
  node,
  onChange,
}: DecisionTreePropertiesPanelProps) {
  // Always call hooks at the top level
  const data = isDecisionTreeNodeData(node.data)
    ? (node.data as DecisionTreeNodeData)
    : {
        title: "Decision Tree",
        description: "",
        color: "#4B5563",
        icon: "decision-tree",
        id: node.id,
        type: node.type,
        position: node.position,
        inputs: [],
        outputs: [],
        rules: [],
        defaultPath: "default",
        evaluationMode: "sequential",
      };

  const [title, setTitle] = useState<string>(data.title);
  const [description, setDescription] = useState<string>(data.description);
  const [color, setColor] = useState<string>(data.color);
  const [icon, setIcon] = useState<string>(data.icon);
  const [rules, setRules] = useState<
    { condition: string; outputPath: string }[]
  >(data.rules);
  const [defaultPath, setDefaultPath] = useState<string>(data.defaultPath);
  const [evaluationMode, setEvaluationMode] = useState<string>(
    data.evaluationMode
  );

  const handleFieldChange = (
    field: keyof DecisionTreeNodeData,
    value: unknown
  ) => {
    const updated: DecisionTreeNodeData = {
      ...node.data,
      title,
      description,
      color,
      icon,
      id: data.id,
      type: data.type,
      position: data.position,
      inputs: data.inputs,
      outputs: data.outputs,
      rules,
      defaultPath,
      evaluationMode,
    };

    if (field === "rules") {
      setRules(value as { condition: string; outputPath: string }[]);
      updated.rules = value as { condition: string; outputPath: string }[];
    }
    if (field === "defaultPath") {
      setDefaultPath(value as string);
      updated.defaultPath = value as string;
    }
    if (field === "evaluationMode") {
      setEvaluationMode(value as string);
      updated.evaluationMode = value as string;
    }
    if (field === "title") {
      setTitle(value as string);
      updated.title = value as string;
    }
    if (field === "description") {
      setDescription(value as string);
      updated.description = value as string;
    }
    if (field === "color") {
      setColor(value as string);
      updated.color = value as string;
    }
    if (field === "icon") {
      setIcon(value as string);
      updated.icon = value as string;
    }

    onChange({ ...node, data: updated });
  };

  // No custom panelStyle: rely on theme and section/content styles only

  // Only render the panel if the node is a decision-tree node
  if (!isDecisionTreeNodeData(node.data)) {
    return (
      <div
        style={{
          padding: theme.spacing.lg,
          background: theme.colors.background,
          color: theme.colors.error,
          fontFamily: theme.typography.fontFamily,
        }}
      >
        This properties panel is only for decision tree nodes.
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 0,
        margin: 0,
        background: theme.colors.background,
        height: "100%",
        overflowY: "auto",
      }}
    >
      <PanelSection
        title="Title"
        description="Set a title for this decision tree node."
      >
        <VSCodeInput
          value={title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleFieldChange("title", e.target.value)
          }
          placeholder="Node Title"
        />
      </PanelSection>
      <PanelSection
        title="Description"
        description="Describe the purpose of this node."
      >
        <VSCodeInput
          value={description}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleFieldChange("description", e.target.value)
          }
          placeholder="Node Description"
        />
      </PanelSection>
      <PanelSection title="Color" description="Set a color for this node.">
        <VSCodeInput
          value={color}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleFieldChange("color", e.target.value)
          }
          placeholder="#4B5563"
        />
      </PanelSection>
      <PanelSection title="Icon" description="Set an icon for this node.">
        <VSCodeInput
          value={icon}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleFieldChange("icon", e.target.value)
          }
          placeholder="decision-tree"
        />
      </PanelSection>
      <PanelSection
        title="Rules"
        description="Define the rules for this decision tree."
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {rules.map((rule, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <VSCodeInput
                value={rule.condition || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const next = [...rules];
                  next[idx] = { ...next[idx], condition: e.target.value };
                  handleFieldChange("rules", next);
                }}
                placeholder="Condition"
              />
              <VSCodeInput
                value={rule.outputPath || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const next = [...rules];
                  next[idx] = { ...next[idx], outputPath: e.target.value };
                  handleFieldChange("rules", next);
                }}
                placeholder="Output Path"
              />
              <VSCodeButton
                variant="danger"
                size="small"
                onClick={() => {
                  const next = rules.filter((_, i) => i !== idx);
                  handleFieldChange("rules", next);
                }}
              >
                Remove
              </VSCodeButton>
            </div>
          ))}
          <VSCodeButton
            variant="primary"
            size="small"
            onClick={() => {
              const next = [...rules, { condition: "", outputPath: "" }];
              handleFieldChange("rules", next);
            }}
          >
            Add Rule
          </VSCodeButton>
        </div>
      </PanelSection>
      <PanelSection
        title="Default Path"
        description="Set the default output path."
      >
        <VSCodeInput
          value={defaultPath}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleFieldChange("defaultPath", e.target.value)
          }
        />
      </PanelSection>
      <PanelSection
        title="Evaluation Mode"
        description="Choose how rules are evaluated."
      >
        <VSCodeSelect
          value={evaluationMode}
          onValueChange={(v: string) => handleFieldChange("evaluationMode", v)}
          options={evalModes}
          placeholder="Choose evaluation mode"
        />
      </PanelSection>
    </div>
  );
}
