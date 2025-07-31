import React from "react";
import { CanvasNode } from "@/types";
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
    return typeof data === "object" && data !== null && "condition" in data;
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

  // FIX: Correct ternary assignment for ifElseData
  const ifElseData: IfElseNodeData = isIfElseNodeData(node.data)
    ? node.data
    : {
        condition: "",
        message: "",
        context: {
          flowId: "",
          nodeId: "",
          timestamp: Date.now(),
          metadata: {},
        },
        history: [],
        state: {},
      };

  return (
    <div
      className="agentflow-properties-panel"
      style={{
        width: 360,
        minWidth: 360,
        maxWidth: 360,
        height: "calc(100vh - 0px)", // adjust if header/footer present
        background: "#23272e",
        padding: 16,
        boxSizing: "border-box",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        borderLeft: "1px solid #252525",
        position: "relative",
      }}
    >
      {/* Custom Scrollbar Styles */}
      <style>{`
        .agentflow-properties-panel::-webkit-scrollbar {
          width: 8px;
          background: #1a1a1a;
        }
        .agentflow-properties-panel::-webkit-scrollbar-thumb {
          background: #404040;
          border-radius: 4px;
          transition: background 0.2s;
        }
        .agentflow-properties-panel:hover::-webkit-scrollbar-thumb {
          background: #4a4a4a;
        }
        .agentflow-properties-panel::-webkit-scrollbar-corner {
          background: #23272e;
        }
      `}</style>
      <PanelSection
        title="Condition"
        description="Expression to evaluate for routing"
      >
        <label className="block mb-1 text-[13px] font-semibold text-[#cccccc]">
          Condition
        </label>
        <input
          className="rounded-[4px] bg-[#23272e] border border-[#252525] px-3 py-2 text-[#cccccc] focus:ring-2 focus:ring-[#00c4ff] transition-all duration-200 w-full"
          value={ifElseData.condition || ""}
          onChange={(e) => handleFieldChange("condition", e.target.value)}
          placeholder="e.g. input == 'yes'"
        />
        <div className="mt-1 text-[12px] text-[#858585]">
          Boolean/JS-like expression. Example:{" "}
          <code>input == &#39;yes&#39;</code>
        </div>
      </PanelSection>
      <PanelSection
        title="Message"
        description="Optional message to emit if condition is met."
      >
        <label className="block mb-1 text-[13px] font-semibold text-[#cccccc]">
          Message
        </label>
        <input
          className="rounded-[4px] bg-[#23272e] border border-[#252525] px-3 py-2 text-[#cccccc] focus:ring-2 focus:ring-[#00c4ff] transition-all duration-200 w-full"
          value={ifElseData.message || ""}
          onChange={(e) => handleFieldChange("message", e.target.value)}
          placeholder="e.g. Branch taken!"
        />
        <div className="mt-1 text-[12px] text-[#858585]">
          This message will be sent if the condition is true.
        </div>
      </PanelSection>
      <PanelSection
        title="Context"
        description="Context and metadata (edit as JSON)"
      >
        <label className="block mb-1 text-[13px] font-semibold text-[#cccccc]">
          Context
        </label>
        <textarea
          className="w-full min-h-[48px] rounded-[4px] bg-[#23272e] border border-[#252525] px-3 py-2 text-[#cccccc] font-mono focus:ring-2 focus:ring-[#00c4ff] transition-all duration-200 resize-vertical"
          value={JSON.stringify(ifElseData.context ?? {}, null, 2)}
          onChange={(e) => {
            try {
              handleFieldChange("context", JSON.parse(e.target.value));
            } catch {}
          }}
          placeholder='{"flowId": "...", "metadata": {}}'
        />
        <div className="mt-1 text-[12px] text-[#858585]">
          Edit the node context as JSON.
        </div>
      </PanelSection>
      <PanelSection title="History" description="Execution history (read-only)">
        <label className="block mb-1 text-[13px] font-semibold text-[#cccccc]">
          History
        </label>
        <textarea
          className="w-full min-h-[48px] rounded-[4px] bg-[#23272e] border border-[#252525] px-3 py-2 text-[#cccccc] font-mono focus:ring-2 focus:ring-[#00c4ff] transition-all duration-200 resize-vertical"
          value={JSON.stringify(ifElseData.history ?? [], null, 2)}
          readOnly
        />
        <div className="mt-1 text-[12px] text-[#858585]">
          Read-only execution history for this node.
        </div>
      </PanelSection>
      <PanelSection title="State" description="Node state (edit as JSON)">
        <label className="block mb-1 text-[13px] font-semibold text-[#cccccc]">
          State
        </label>
        <textarea
          className="w-full min-h-[48px] rounded-[4px] bg-[#23272e] border border-[#252525] px-3 py-2 text-[#cccccc] font-mono focus:ring-2 focus:ring-[#00c4ff] transition-all duration-200 resize-vertical"
          value={JSON.stringify(ifElseData.state ?? {}, null, 2)}
          onChange={(e) => {
            try {
              handleFieldChange("state", JSON.parse(e.target.value));
            } catch {}
          }}
          placeholder={`{
  "key": "value"
}`}
        />
        <div className="mt-1 text-[12px] text-[#858585]">
          Edit the node state as JSON.
        </div>
      </PanelSection>
    </div>
  );
}
// TODO: Add unit tests for IfElse node property panel to ensure type safety and prevent regressions.
