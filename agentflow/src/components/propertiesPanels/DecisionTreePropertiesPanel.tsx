// All UI rules for properties panels must come from propertiesPanelTheme.ts
import React, { useState } from "react";
import { vsCodePropertiesTheme as theme } from "./propertiesPanelTheme";
import { CanvasNode } from "@/types";
import PanelSection from "./PanelSection";
import {
  VSCodeInput,
  VSCodeSelect,
  VSCodeButton,
} from "./vsCodeFormComponents";

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
    if (field === "rules")
      setRules(value as { condition: string; outputPath: string }[]);
    if (field === "defaultPath") setDefaultPath(value as string);
    if (field === "evaluationMode") setEvaluationMode(value as string);
    if (field === "title") setTitle(value as string);
    if (field === "description") setDescription(value as string);
    if (field === "color") setColor(value as string);
    if (field === "icon") setIcon(value as string);

    const updated: DecisionTreeNodeData = {
      title: field === "title" ? (value as string) : title,
      description: field === "description" ? (value as string) : description,
      color: field === "color" ? (value as string) : color,
      icon: field === "icon" ? (value as string) : icon,
      id: data.id,
      type: data.type,
      position: data.position,
      inputs: data.inputs,
      outputs: data.outputs,
      rules:
        field === "rules"
          ? (value as { condition: string; outputPath: string }[])
          : rules,
      defaultPath: field === "defaultPath" ? (value as string) : defaultPath,
      evaluationMode:
        field === "evaluationMode" ? (value as string) : evaluationMode,
    };
    onChange({ ...node, data: updated });
  };

  // Compose panel style from theme
  const panelStyle: React.CSSProperties = {
    background: theme.colors.background,
    borderLeft: `1px solid ${theme.colors.border}`,
    padding: theme.spacing.sectionPadding,
    borderRadius: theme.borderRadius.lg,
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

  // Only render the panel if the node is a decision-tree node
  if (!isDecisionTreeNodeData(node.data)) {
    return (
      <div style={panelStyle}>
        <div style={{ color: theme.colors.textPrimary }}>
          This properties panel is only for decision tree nodes.
        </div>
      </div>
    );
  }

  return (
    <div style={panelStyle}>
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
            gap: theme.spacing.xs,
          }}
        >
          {rules.map((rule, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: theme.spacing.xs,
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
