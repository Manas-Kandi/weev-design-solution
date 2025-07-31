import React from "react";
import { CanvasNode } from "@/types";
import { Input } from "../ui/input";

interface MessagePropertiesPanelProps {
  node: CanvasNode;
  onChange: (node: CanvasNode) => void;
}

interface MessageNodeData {
  content?: string;
  message?: string;
  passThrough?: boolean;
}

function isMessageNodeData(data: unknown): data is MessageNodeData {
  return (
    typeof data === "object" &&
    data !== null &&
    ("content" in data || "message" in data)
  );
}

export default function MessagePropertiesPanel({
  node,
  onChange,
}: MessagePropertiesPanelProps) {
  const handleFieldChange = (field: keyof MessageNodeData, value: unknown) => {
    if (isMessageNodeData(node.data)) {
      onChange({ ...node, data: { ...node.data, [field]: value } });
    }
  };

  const safeData: MessageNodeData = isMessageNodeData(node.data)
    ? (node.data as MessageNodeData)
    : { content: "", message: "", passThrough: false };

  return (
    <div className="flex flex-col gap-4">
      <section>
        <h3 className="text-accent font-semibold mb-2">Message Content</h3>
        <textarea
          className="w-full min-h-[64px] bg-panel border border-border rounded p-2 text-text"
          value={safeData.content || safeData.message || ""}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            handleFieldChange("content", e.target.value)
          }
          placeholder="Message to send..."
        />
      </section>
      <section>
        <label className="text-sm">
          <input
            type="checkbox"
            checked={!!safeData.passThrough}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleFieldChange("passThrough", e.target.checked)
            }
          />
          Pass through input
        </label>
      </section>
    </div>
  );
}
// TODO: Add unit tests for this panel to ensure type safety and prevent regressions.
