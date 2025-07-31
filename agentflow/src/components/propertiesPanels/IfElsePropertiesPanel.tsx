import React from "react";
import { CanvasNode } from "@/types";
import { Input } from "../ui/input";
import PanelSection from "./PanelSection";

interface Message {
  // Define minimal Message structure if needed
  content: string;
  sender: string;
  timestamp: number;
}

// Define IfElseNodeData for strict type safety
export interface IfElseNodeData {
  condition?: string;
  message?: string;
  context?: {
    flowId: string;
    nodeId: string;
    timestamp: number;
    metadata: Record<string, string>;
  };
  history?: Message[];
  state?: Record<string, unknown>;
}

interface IfElsePropertiesPanelProps {
  node: CanvasNode;
  onChange: (node: CanvasNode) => void;
}

export default function IfElsePropertiesPanel({
  node,
  onChange,
}: IfElsePropertiesPanelProps) {
  // Type guard for NodeData with condition
  function isIfElseNodeData(data: unknown): data is IfElseNodeData {
    return (
      typeof data === "object" &&
      data !== null &&
      ("condition" in data)
    );
  }

  const handleFieldChange = (field: keyof IfElseNodeData, value: unknown) => {
    if (isIfElseNodeData(node.data)) {
      const updatedData: IfElseNodeData = {
        ...node.data,
        [field]: value,
      };
      onChange({ ...node, data: updatedData });
    }
  };

  const ifElseData = isIfElseNodeData(node.data)
    ? node.data
    : { condition: "", message: "", context: { flowId: "", nodeId: "", timestamp: Date.now(), metadata: {} }, history: [], state: {} };

  return (
    <div className="flex flex-col gap-4">
      <PanelSection title="Condition" description="Expression to evaluate for routing">
        <Input
          value={ifElseData.condition || ""}
          onChange={(e) => handleFieldChange("condition", e.target.value)}
          placeholder="e.g. input == 'yes'"
        />
      </PanelSection>
      <PanelSection title="Message" description="Optional message to emit if condition is met.">
        <Input
          value={ifElseData.message || ""}
          onChange={(e) => handleFieldChange("message", e.target.value)}
          placeholder="e.g. Branch taken!"
        />
      </PanelSection>
      <PanelSection title="Context" description="Context and metadata (edit as JSON)">
        <textarea
          className="w-full min-h-[48px] bg-vscode-panel border border-vscode-border rounded p-2 text-vscode-text font-mono"
          value={JSON.stringify(ifElseData.context ?? {}, null, 2)}
          onChange={e => {
            try {
              handleFieldChange("context", JSON.parse(e.target.value));
            } catch {}
          }}
          placeholder='{"flowId": "...", "metadata": {}}'
        />
      </PanelSection>
      <PanelSection title="History" description="Execution history (read-only)">
        <textarea
          className="w-full min-h-[48px] bg-vscode-panel border border-vscode-border rounded p-2 text-vscode-text font-mono"
          value={JSON.stringify(ifElseData.history ?? [], null, 2)}
          readOnly
        />
      </PanelSection>
      <PanelSection title="State" description="Node state (edit as JSON)">
        <textarea
          className="w-full min-h-[48px] bg-vscode-panel border border-vscode-border rounded p-2 text-vscode-text font-mono"
          value={JSON.stringify(ifElseData.state ?? {}, null, 2)}
          onChange={e => {
            try {
              handleFieldChange("state", JSON.parse(e.target.value));
            } catch {}
          }}
          placeholder={`{
  "key": "value"
}`}
        />
      </PanelSection>
    </div>
  );
}
// TODO: Add unit tests for IfElse node property panel to ensure type safety and prevent regressions.
