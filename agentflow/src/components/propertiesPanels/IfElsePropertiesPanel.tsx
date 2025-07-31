import React from "react";
import { CanvasNode } from "@/types";
// Define NodeData inline according to the project spec
import { Input } from "../ui/input";

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

  return (
    <div className="flex flex-col gap-4">
      <section>
        <h3 className="text-accent font-semibold mb-2">Condition Expression</h3>
        <Input
          value={
            isIfElseNodeData(node.data)
              ? node.data.condition || ""
              : ""
          }
          onChange={(e) => handleFieldChange("condition", e.target.value)}
          placeholder="e.g. input == 'yes'"
        />
      </section>
      {/* Output path selection can be enhanced with dropdowns if connection info is available */}
    </div>
  );
}
// TODO: Add unit tests for IfElse node property panel to ensure type safety and prevent regressions.
