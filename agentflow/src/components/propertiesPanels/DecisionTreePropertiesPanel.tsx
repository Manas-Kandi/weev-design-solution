// All UI rules for properties panels must come from propertiesPanelTheme.ts
import React, { useState } from "react";
import { propertiesPanelTheme as theme } from "./propertiesPanelTheme";
import { CanvasNode } from "@/types";
import { Input } from "../ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import PanelSection from "./PanelSection";

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

  // Only render the panel if the node is a decision-tree node
  if (!isDecisionTreeNodeData(node.data)) {
    return (
      <div style={panelStyle}>
        <div style={{ color: theme.colors.inputText }}>
          This properties panel is only for decision tree nodes.
        </div>
      </div>
    );
  }

  return (
    <div style={panelStyle}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label style={{ fontWeight: 600, color: theme.colors.label }}>Title</label>
        <Input
          value={title}
          onChange={(e) => handleFieldChange("title", e.target.value)}
          placeholder="Node Title"
        />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label style={{ fontWeight: 600, color: theme.colors.label }}>
          Description
        </label>
        <Input
          value={description}
          onChange={(e) => handleFieldChange("description", e.target.value)}
          placeholder="Node Description"
        />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label style={{ fontWeight: 600, color: theme.colors.label }}>Color</label>
        <Input
          value={color}
          onChange={(e) => handleFieldChange("color", e.target.value)}
          placeholder="#4B5563"
        />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label style={{ fontWeight: 600, color: theme.colors.label }}>Icon</label>
        <Input
          value={icon}
          onChange={(e) => handleFieldChange("icon", e.target.value)}
          placeholder="decision-tree"
        />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label style={{ fontWeight: 600, color: theme.colors.label }}>Rules</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {rules.map((rule, idx) => (
            <div
              key={idx}
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <Input
                value={rule.condition || ""}
                onChange={(e) => {
                  const next = [...rules];
                  next[idx] = { ...next[idx], condition: e.target.value };
                  handleFieldChange("rules", next);
                }}
                placeholder="Condition"
              />
              <Input
                value={rule.outputPath || ""}
                onChange={(e) => {
                  const next = [...rules];
                  next[idx] = { ...next[idx], outputPath: e.target.value };
                  handleFieldChange("rules", next);
                }}
                placeholder="Output Path"
              />
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  const next = rules.filter((_, i) => i !== idx);
                  handleFieldChange("rules", next);
                }}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            size="sm"
            variant="default"
            onClick={() => {
              const next = [...rules, { condition: "", outputPath: "" }];
              handleFieldChange("rules", next);
            }}
          >
            Add Rule
          </Button>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label style={{ fontWeight: 600, color: theme.colors.label }}>
          Default Path
        </label>
        <Input
          value={defaultPath}
          onChange={(e) => handleFieldChange("defaultPath", e.target.value)}
        />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label style={{ fontWeight: 600, color: theme.colors.label }}>
          Evaluation Mode
        </label>
        <Select
          value={evaluationMode}
          onValueChange={(v) => handleFieldChange("evaluationMode", v)}
        >
          <SelectTrigger style={{ width: "100%" }}>
            <SelectValue placeholder="Choose evaluation mode" />
          </SelectTrigger>
          <SelectContent>
            {evalModes.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
