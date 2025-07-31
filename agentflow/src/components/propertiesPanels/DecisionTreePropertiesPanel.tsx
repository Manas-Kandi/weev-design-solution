import React, { useState } from "react";
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

  // Only render the panel if the node is a decision-tree node
  if (!isDecisionTreeNodeData(node.data)) {
    return (
      <div className="p-4 text-vscode-textSecondary">
        This properties panel is only for decision tree nodes.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 bg-[#23272e] rounded-xl shadow-lg min-w-[320px] max-w-[400px]">
      <div className="flex flex-col gap-2">
        <label className="font-semibold text-vscode-title">Title</label>
        <Input
          value={title}
          onChange={(e) => handleFieldChange("title", e.target.value)}
          className="w-full"
          placeholder="Node Title"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="font-semibold text-vscode-title">Description</label>
        <Input
          value={description}
          onChange={(e) => handleFieldChange("description", e.target.value)}
          className="w-full"
          placeholder="Node Description"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="font-semibold text-vscode-title">Color</label>
        <Input
          value={color}
          onChange={(e) => handleFieldChange("color", e.target.value)}
          className="w-32"
          placeholder="#4B5563"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="font-semibold text-vscode-title">Icon</label>
        <Input
          value={icon}
          onChange={(e) => handleFieldChange("icon", e.target.value)}
          className="w-32"
          placeholder="decision-tree"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="font-semibold text-vscode-title">Rules</label>
        <div className="flex flex-col gap-1">
          {rules.map((rule, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Input
                value={rule.condition || ""}
                onChange={(e) => {
                  const next = [...rules];
                  next[idx] = { ...next[idx], condition: e.target.value };
                  handleFieldChange("rules", next);
                }}
                className="w-40"
                placeholder="Condition"
              />
              <Input
                value={rule.outputPath || ""}
                onChange={(e) => {
                  const next = [...rules];
                  next[idx] = { ...next[idx], outputPath: e.target.value };
                  handleFieldChange("rules", next);
                }}
                className="w-32"
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
      <div className="flex flex-col gap-2">
        <label className="font-semibold text-vscode-title">Default Path</label>
        <Input
          value={defaultPath}
          onChange={(e) => handleFieldChange("defaultPath", e.target.value)}
          className="w-32"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="font-semibold text-vscode-title">
          Evaluation Mode
        </label>
        <Select
          value={evaluationMode}
          onValueChange={(v) => handleFieldChange("evaluationMode", v)}
        >
          <SelectTrigger className="w-full">
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
