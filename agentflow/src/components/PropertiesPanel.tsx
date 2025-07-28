"use client";

import React from "react";
import {
  AgentNodeData,
  ToolAgentNodeData,
  PromptTemplateNodeData,
  CanvasNode,
} from "@/types";

interface PropertiesPanelProps {
  selectedNode: CanvasNode | null;
  onChange: (updatedNode: CanvasNode) => void;
  isTesting?: boolean;
}

const TOOL_PRESETS = [
  { label: "Web Search", value: "web-search" },
  { label: "Calculator", value: "calculator" },
  { label: "Code Executor", value: "code-executor" },
];

const labelClass =
  "block text-xs font-semibold text-vscode-text mb-1 tracking-wide";
const inputClass =
  "w-full px-2 py-1 rounded bg-vscode-input border border-vscode-border text-vscode-text focus:outline-none focus:ring-2 focus:ring-vscode-focus transition disabled:opacity-60";
const sectionClass =
  "mb-6 pb-2 border-b border-vscode-border last:border-b-0 last:mb-0 last:pb-0";
const panelClass =
  "bg-[#23272e] p-6 rounded-xl shadow-lg text-vscode-text min-w-[320px] max-w-[400px] mx-auto mt-4 overflow-y-auto max-h-[90vh] border border-[#333]";
const headerClass =
  "text-lg font-bold mb-4 text-vscode-title tracking-wide";
const noNodeClass =
  "flex flex-col items-center justify-center h-full text-vscode-textSecondary text-base p-8";

export default function PropertiesPanel({ selectedNode, onChange, isTesting }: PropertiesPanelProps) {
  if (!selectedNode) {
    return (
      <div className={panelClass + " " + noNodeClass}>
        <div className="text-2xl mb-2">🛈</div>
        <div>No node selected</div>
        <div className="text-xs mt-2 text-vscode-textSecondary">Select a node to view and edit its properties.</div>
      </div>
    );
  }

  const handleFieldChange = (field: string, value: unknown) => {
    if (!selectedNode) return;
    onChange({ ...selectedNode, data: { ...selectedNode.data, [field]: value } });
  };

  // --- Tool Agent Node ---
  if (selectedNode.type === "agent" && selectedNode.subtype === "tool-agent") {
    const data = selectedNode.data as ToolAgentNodeData;
    const toolConfig = data.toolConfig ?? { toolType: "" };
    return (
      <div className={panelClass}>
        <div className={headerClass}>Tool Agent Properties</div>
        <div className={sectionClass}>
          <label className={labelClass}>Tool Preset</label>
          <select
            className={inputClass}
            disabled={isTesting}
            value={toolConfig.toolType || ""}
            onChange={e => handleFieldChange("toolConfig", { ...toolConfig, toolType: e.target.value })}
          >
            <option value="">Select Tool</option>
            {TOOL_PRESETS.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        {toolConfig.toolType === "custom-api" && (
          <div className={sectionClass}>
            <label className={labelClass}>API Endpoint</label>
            <input
              className={inputClass}
              disabled={isTesting}
              value={toolConfig.endpoint || ""}
              onChange={e => handleFieldChange("toolConfig", { ...toolConfig, endpoint: e.target.value })}
              placeholder="API Endpoint"
            />
          </div>
        )}
        <div className={sectionClass}>
          <label className={labelClass}>User Prompt</label>
          <input
            className={inputClass}
            disabled={isTesting}
            value={data.prompt || ""}
            onChange={e => handleFieldChange("prompt", e.target.value)}
            placeholder="User Prompt"
          />
        </div>
      </div>
    );
  }

  // --- Agent Node ---
  if (selectedNode.type === "agent" && selectedNode.subtype !== "tool-agent") {
    const data = selectedNode.data as AgentNodeData;
    return (
      <div className={panelClass}>
        <div className={headerClass}>Agent Properties</div>
        <div className={sectionClass}>
          <label className={labelClass}>Title</label>
          <input
            className={inputClass}
            disabled={isTesting}
            value={data.title || ""}
            onChange={e => handleFieldChange("title", e.target.value)}
            placeholder="Title"
          />
        </div>
        <div className={sectionClass}>
          <label className={labelClass}>Description</label>
          <textarea
            className={inputClass}
            disabled={isTesting}
            value={data.description || ""}
            onChange={e => handleFieldChange("description", e.target.value)}
            placeholder="Description"
            rows={2}
          />
        </div>
        <div className={sectionClass}>
          <label className={labelClass}>System Prompt</label>
          <input
            className={inputClass}
            disabled={isTesting}
            value={data.systemPrompt || ""}
            onChange={e => handleFieldChange("systemPrompt", e.target.value)}
            placeholder="System Prompt"
          />
        </div>
        <div className={sectionClass}>
          <label className={labelClass}>Personality</label>
          <input
            className={inputClass}
            disabled={isTesting}
            value={data.personality || ""}
            onChange={e => handleFieldChange("personality", e.target.value)}
            placeholder="Personality"
          />
        </div>
        <div className={sectionClass}>
          <label className={labelClass}>Escalation Logic</label>
          <input
            className={inputClass}
            disabled={isTesting}
            value={data.escalationLogic || ""}
            onChange={e => handleFieldChange("escalationLogic", e.target.value)}
            placeholder="Escalation Logic"
          />
        </div>
        <div className={sectionClass}>
          <label className={labelClass}>Confidence Threshold</label>
          <input
            className={inputClass}
            type="number"
            disabled={isTesting}
            value={data.confidenceThreshold ?? ""}
            onChange={e => handleFieldChange("confidenceThreshold", Number(e.target.value))}
            placeholder="Confidence Threshold"
          />
        </div>
        <div className={sectionClass}>
          <label className={labelClass}>User Prompt</label>
          <input
            className={inputClass}
            disabled={isTesting}
            value={data.prompt || ""}
            onChange={e => handleFieldChange("prompt", e.target.value)}
            placeholder="User Prompt"
          />
        </div>
        <div>
          <label className={labelClass}>Model</label>
          <input
            className={inputClass}
            disabled={isTesting}
            value={data.model || ""}
            onChange={e => handleFieldChange("model", e.target.value)}
            placeholder="Model (e.g. gemini-2.5-flash-lite)"
          />
        </div>
      </div>
    );
  }

  // --- Knowledge Base Node ---
  if (selectedNode.type === "logic" && selectedNode.subtype === "knowledge-base") {
    const data = selectedNode.data as { operation?: string };
    return (
      <div className={panelClass}>
        <div className={headerClass}>Knowledge Base Properties</div>
        <div>
          <label className={labelClass}>Operation</label>
          <select
            className={inputClass}
            disabled={isTesting}
            value={data.operation || "retrieve"}
            onChange={e => handleFieldChange("operation", e.target.value)}
          >
            <option value="store">Store</option>
            <option value="retrieve">Retrieve</option>
            <option value="search">Search</option>
          </select>
        </div>
      </div>
    );
  }

  // --- IfElse Logic Node ---
  if (selectedNode.type === "logic" && selectedNode.subtype === "if-else") {
    const data = selectedNode.data as { condition?: string };
    return (
      <div className={panelClass}>
        <div className={headerClass}>If/Else Properties</div>
        <div>
          <label className={labelClass}>Condition</label>
          <input
            className={inputClass}
            disabled={isTesting}
            value={data.condition || ""}
            onChange={e => handleFieldChange("condition", e.target.value)}
            placeholder="Condition (e.g. input == 'yes')"
          />
        </div>
      </div>
    );
  }

  // --- State Machine Node ---
  if (selectedNode.type === "logic" && selectedNode.subtype === "state-machine") {
    const data = selectedNode.data as { states?: string[]; initialState?: string };
    return (
      <div className={panelClass}>
        <div className={headerClass}>State Machine Properties</div>
        <div className={sectionClass}>
          <label className={labelClass}>Initial State</label>
          <input
            className={inputClass}
            disabled={isTesting}
            value={data.initialState || ""}
            onChange={e => handleFieldChange("initialState", e.target.value)}
            placeholder="Initial State"
          />
        </div>
        <div>
          <label className={labelClass}>States</label>
          <textarea
            className={inputClass}
            disabled={isTesting}
            value={data.states?.join(", ") || ""}
            onChange={e => handleFieldChange("states", e.target.value.split(",").map(s => s.trim()))}
            placeholder="States (comma separated)"
            rows={2}
          />
        </div>
      </div>
    );
  }

  // --- Decision Tree Node ---
  if (selectedNode.type === "logic" && selectedNode.subtype === "decision-tree") {
    const data = selectedNode.data as { rules?: { condition: string; outputPath: string }[] };
    return (
      <div className={panelClass}>
        <div className={headerClass}>Decision Tree Properties</div>
        {(data.rules || []).map((rule, i) => (
          <div key={i} className="flex gap-2 items-center mb-2">
            <input
              className={inputClass + " flex-1"}
              disabled={isTesting}
              value={rule.condition}
              onChange={e => {
                const newRules = [...(data.rules || [])];
                newRules[i] = { ...rule, condition: e.target.value };
                handleFieldChange("rules", newRules);
              }}
              placeholder="Condition"
            />
            <input
              className={inputClass + " flex-1"}
              disabled={isTesting}
              value={rule.outputPath}
              onChange={e => {
                const newRules = [...(data.rules || [])];
                newRules[i] = { ...rule, outputPath: e.target.value };
                handleFieldChange("rules", newRules);
              }}
              placeholder="Output Path"
            />
          </div>
        ))}
        <button
          className="mt-2 px-3 py-1 rounded bg-vscode-button text-vscode-buttonText hover:bg-vscode-buttonHover transition"
          disabled={isTesting}
          onClick={() => handleFieldChange("rules", [...(data.rules || []), { condition: "", outputPath: "" }])}
        >Add Rule</button>
      </div>
    );
  }

  // --- Prompt Template Node ---
  if (selectedNode.type === "conversation" && selectedNode.subtype === "template") {
    const data = selectedNode.data as PromptTemplateNodeData;
    return (
      <div className={panelClass}>
        <div className={headerClass}>Prompt Template Properties</div>
        <div className={sectionClass}>
          <label className={labelClass}>Template</label>
          <textarea
            className={inputClass}
            disabled={isTesting}
            value={data.template || ""}
            onChange={e => handleFieldChange("template", e.target.value)}
            placeholder="Template (use {{variable}} syntax)"
            rows={2}
          />
        </div>
        <div>
          <label className={labelClass}>Variables</label>
          <textarea
            className={inputClass}
            disabled={isTesting}
            value={Object.entries(data.variables || {}).map(([k, v]) => `${k}=${v}`).join("\n")}
            onChange={e => {
              const vars: Record<string, string> = {};
              e.target.value.split("\n").forEach(line => {
                const [k, ...rest] = line.split("=");
                if (k) vars[k.trim()] = rest.join("=").trim();
              });
              handleFieldChange("variables", vars);
            }}
            placeholder="Variables (one per line: key=value)"
            rows={2}
          />
        </div>
      </div>
    );
  }

  // --- Message Node ---
  if (selectedNode.type === "conversation" && selectedNode.subtype === "message") {
    const data = selectedNode.data as { content?: string; message?: string };
    return (
      <div className={panelClass}>
        <div className={headerClass}>Message Node Properties</div>
        <div>
          <label className={labelClass}>Message Content</label>
          <textarea
            className={inputClass}
            disabled={isTesting}
            value={data.content || data.message || ""}
            onChange={e => handleFieldChange("content", e.target.value)}
            placeholder="Message Content"
            rows={2}
          />
        </div>
      </div>
    );
  }

  // --- UI Node ---
  if (selectedNode.type === "ui" || selectedNode.subtype === "ui") {
    const data = selectedNode.data as { content?: string; message?: string; inputValue?: string };
    return (
      <div className={panelClass}>
        <div className={headerClass}>UI Node Properties</div>
        <div>
          <label className={labelClass}>User Input</label>
          <input
            className={inputClass}
            disabled={isTesting}
            value={data.content || data.message || data.inputValue || ""}
            onChange={e => handleFieldChange("content", e.target.value)}
            placeholder="User Input"
          />
        </div>
      </div>
    );
  }

  // --- Default ---
  return (
    <div className={panelClass + " flex flex-col items-center justify-center h-full text-vscode-textSecondary"}>
      <div className="text-2xl mb-2">🛈</div>
      <div>No properties available for this node type.</div>
    </div>
  );
}

// --- VS Code color variables (add to your global CSS or Tailwind config) ---
// .bg-vscode-panel { background: #1e1e1e; }
// .text-vscode-text { color: #d4d4d4; }
// .text-vscode-title { color: #569cd6; }
// .text-vscode-textSecondary { color: #808080; }
// .bg-vscode-input { background: #232323; }
// .border-vscode-border { border-color: #333333; }
// .focus\:ring-vscode-focus:focus { box-shadow: 0 0 0 2px #007acc; }
// .bg-vscode-button { background: #0e639c; }
// .text-vscode-buttonText { color: #fff; }
// .hover\:bg-vscode-buttonHover:hover { background: #1177bb; }
