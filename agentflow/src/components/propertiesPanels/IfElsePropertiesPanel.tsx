// If/Else Properties Panel with hardcoded minimal design
import React, { useState } from "react";
import { GitBranch } from "lucide-react";
import { CanvasNode } from "@/types";
import { PanelSection } from "./PanelSection";

interface Message {
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

  // FIX: Correct ternary assignment for initialData
  const initialData: IfElseNodeData = isIfElseNodeData(node.data)
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

  const [data, setData] = useState<IfElseNodeData>(() => initialData);

  const handleFieldChange = (field: keyof IfElseNodeData, value: unknown) => {
    setData((prev) => {
      const updatedData = { ...prev, [field]: value };
      onChange({ ...node, data: { ...node.data, ...updatedData } });
      return updatedData;
    });
  };

  return (
    <div
      style={{
        width: "280px",
        height: "100vh",
        position: "fixed",
        right: "0",
        top: "0",
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#0a0a0a",
        borderLeft: "1px solid #2a2a2a",
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
        fontSize: "13px",
        color: "#ffffff",
        overflow: "hidden",
      }}
    >
      {/* Panel Header */}
      <div
        style={{
          padding: "16px",
          borderBottom: "1px solid #2a2a2a",
          backgroundColor: "#1a1a1a",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          height: "40px",
        }}
      >
        <div
          style={{
            backgroundColor: "#0969da",
            borderRadius: "4px",
            padding: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "32px",
            height: "32px",
          }}
        >
          <GitBranch size={16} color="white" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2
            style={{
              fontSize: "12px",
              fontWeight: 500,
              color: "#ffffff",
              margin: 0,
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            If/Else Logic
          </h2>
          <p
            style={{
              fontSize: "11px",
              color: "#d1d5db",
              margin: "2px 0 0 0",
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            Conditional routing logic
          </p>
        </div>
      </div>

      {/* Panel Content */}
      <div
        style={{
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          flex: 1,
          overflowY: "auto",
        }}
      >
        {/* Condition */}
        <PanelSection
          title="Condition"
          description="Expression to evaluate for routing"
          icon={<GitBranch size={16} />}
        >
          <label
            style={{
              fontSize: "11px",
              fontFamily:
                "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
              fontWeight: 500,
              color: "#d1d5db",
              marginBottom: "4px",
              display: "block",
            }}
          >
            Boolean Expression
          </label>
          <input
            value={data.condition || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleFieldChange("condition", e.target.value)
            }
            placeholder="e.g. input == 'yes'"
            style={{
              width: "100%",
              height: "32px",
              padding: "0 12px",
              fontSize: "12px",
              fontFamily: "SF Mono, Monaco, Consolas, monospace",
              borderRadius: "4px",
              border: "1px solid #2a2a2a",
              backgroundColor: "#2a2a2a",
              color: "#ffffff",
              outline: "none",
              transition: "0.15s ease",
              boxSizing: "border-box",
            }}
            onFocus={(e) => {
              e.target.style.border = "1px solid #0969da";
            }}
            onBlur={(e) => {
              e.target.style.border = "1px solid #2a2a2a";
            }}
          />
          <div
            style={{
              fontSize: "10px",
              color: "#6b7280",
              marginTop: "4px",
              lineHeight: 1.4,
            }}
          >
            Boolean/JS-like expression. Example:{" "}
            <code style={{ color: "#38bdf8" }}>input == &quot;yes&quot;</code>
          </div>
        </PanelSection>

        {/* Message */}
        <PanelSection
          title="Message"
          description="Optional message to emit if condition is met"
          icon={<GitBranch size={16} />}
        >
          <label
            style={{
              fontSize: "11px",
              fontFamily:
                "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
              fontWeight: 500,
              color: "#d1d5db",
              marginBottom: "4px",
              display: "block",
            }}
          >
            Condition Message
          </label>
          <input
            value={data.message || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleFieldChange("message", e.target.value)
            }
            placeholder="e.g. Branch taken!"
            style={{
              width: "100%",
              height: "32px",
              padding: "0 12px",
              fontSize: "12px",
              fontFamily:
                "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
              borderRadius: "4px",
              border: "1px solid #2a2a2a",
              backgroundColor: "#2a2a2a",
              color: "#ffffff",
              outline: "none",
              transition: "0.15s ease",
              boxSizing: "border-box",
            }}
            onFocus={(e) => {
              e.target.style.border = "1px solid #0969da";
            }}
            onBlur={(e) => {
              e.target.style.border = "1px solid #2a2a2a";
            }}
          />
          <div
            style={{
              fontSize: "10px",
              color: "#6b7280",
              marginTop: "4px",
              lineHeight: 1.4,
            }}
          >
            This message will be sent if the condition is true.
          </div>
        </PanelSection>

        {/* Context */}
        <PanelSection
          title="Context"
          description="Context and metadata (edit as JSON)"
          icon={<GitBranch size={16} />}
        >
          <label
            style={{
              fontSize: "11px",
              fontFamily:
                "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
              fontWeight: 500,
              color: "#d1d5db",
              marginBottom: "4px",
              display: "block",
            }}
          >
            Context Data
          </label>
          <textarea
            value={JSON.stringify(data.context ?? {}, null, 2)}
            onChange={(e) => {
              try {
                handleFieldChange("context", JSON.parse(e.target.value));
              } catch {}
            }}
            placeholder='{"flowId": "...", "metadata": {}}'
            rows={4}
            style={{
              width: "100%",
              padding: "8px 12px",
              fontSize: "11px",
              fontFamily: "SF Mono, Monaco, Consolas, monospace",
              borderRadius: "4px",
              border: "1px solid #2a2a2a",
              backgroundColor: "#2a2a2a",
              color: "#ffffff",
              outline: "none",
              transition: "0.15s ease",
              resize: "vertical",
              minHeight: "80px",
              boxSizing: "border-box",
              lineHeight: 1.4,
            }}
            onFocus={(e) => {
              e.target.style.border = "1px solid #0969da";
            }}
            onBlur={(e) => {
              e.target.style.border = "1px solid #2a2a2a";
            }}
          />
          <div
            style={{
              fontSize: "10px",
              color: "#6b7280",
              marginTop: "4px",
              lineHeight: 1.4,
            }}
          >
            Edit the node context as JSON.
          </div>
        </PanelSection>

        {/* History */}
        <PanelSection
          title="History"
          description="Execution history (read-only)"
          icon={<GitBranch size={16} />}
        >
          <label
            style={{
              fontSize: "11px",
              fontFamily:
                "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
              fontWeight: 500,
              color: "#d1d5db",
              marginBottom: "4px",
              display: "block",
            }}
          >
            Execution History
          </label>
          <textarea
            value={JSON.stringify(data.history ?? [], null, 2)}
            readOnly
            rows={3}
            style={{
              width: "100%",
              padding: "8px 12px",
              fontSize: "11px",
              fontFamily: "SF Mono, Monaco, Consolas, monospace",
              borderRadius: "4px",
              border: "1px solid #2a2a2a",
              backgroundColor: "#1a1a1a",
              color: "#6b7280",
              outline: "none",
              resize: "vertical",
              minHeight: "60px",
              boxSizing: "border-box",
              lineHeight: 1.4,
              cursor: "not-allowed",
            }}
          />
          <div
            style={{
              fontSize: "10px",
              color: "#6b7280",
              marginTop: "4px",
              lineHeight: 1.4,
            }}
          >
            Read-only execution history for this node.
          </div>
        </PanelSection>

        {/* State */}
        <PanelSection
          title="State"
          description="Node state (edit as JSON)"
          icon={<GitBranch size={16} />}
        >
          <label
            style={{
              fontSize: "11px",
              fontFamily:
                "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
              fontWeight: 500,
              color: "#d1d5db",
              marginBottom: "4px",
              display: "block",
            }}
          >
            Node State
          </label>
          <textarea
            value={JSON.stringify(data.state ?? {}, null, 2)}
            onChange={(e) => {
              try {
                handleFieldChange("state", JSON.parse(e.target.value));
              } catch {}
            }}
            placeholder={`{
  "key": "value"
}`}
            rows={3}
            style={{
              width: "100%",
              padding: "8px 12px",
              fontSize: "11px",
              fontFamily: "SF Mono, Monaco, Consolas, monospace",
              borderRadius: "4px",
              border: "1px solid #2a2a2a",
              backgroundColor: "#2a2a2a",
              color: "#ffffff",
              outline: "none",
              transition: "0.15s ease",
              resize: "vertical",
              minHeight: "60px",
              boxSizing: "border-box",
              lineHeight: 1.4,
            }}
            onFocus={(e) => {
              e.target.style.border = "1px solid #0969da";
            }}
            onBlur={(e) => {
              e.target.style.border = "1px solid #2a2a2a";
            }}
          />
          <div
            style={{
              fontSize: "10px",
              color: "#6b7280",
              marginTop: "4px",
              lineHeight: 1.4,
            }}
          >
            Edit the node state as JSON.
          </div>
        </PanelSection>

        {/* Logic Preview */}
        <div
          style={{
            backgroundColor: "#1a1a1a",
            border: "1px solid #2a2a2a",
            borderRadius: "4px",
            padding: "12px",
            marginTop: "8px",
          }}
        >
          <h3
            style={{
              fontSize: "11px",
              fontFamily:
                "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
              fontWeight: 500,
              color: "#d1d5db",
              margin: "0 0 8px 0",
            }}
          >
            Logic Preview
          </h3>
          <div
            style={{
              fontSize: "11px",
              fontFamily: "SF Mono, Monaco, Consolas, monospace",
              color: "#6b7280",
              lineHeight: 1.4,
            }}
          >
            <div>
              <span style={{ color: "#f97316" }}>if</span> ({" "}
              <span style={{ color: "#38bdf8" }}>
                {data.condition || "condition"}
              </span>{" "}
              ) {"{"}
              <br />
              &nbsp;&nbsp;
              <span style={{ color: "#22c55e" }}>{"// True path"}</span>
              <br />
              {"}"} <span style={{ color: "#f97316" }}>else</span> {"{"}
              <br />
              &nbsp;&nbsp;
              <span style={{ color: "#22c55e" }}>{"// False path"}</span>
              <br />
              {"}"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
