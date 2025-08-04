// --- CLEAN REBUILD ---
import React, { useState } from "react";
import { GitBranch } from "lucide-react";
import { CanvasNode } from "@/types";
import { PanelSection } from "./PanelSection";
import { figmaPropertiesTheme as theme } from "./propertiesPanelTheme";

interface Message {
  content: string;
  sender: string;
  timestamp: number;
}

export interface IfElseNodeData {
  condition?: string;
  message?: string;
  context?: {
    flowId: string;
    nodeId: string;
    timestamp: number;
    metadata: Record<string, string>; // FIX: enforce string values
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

  const panelContainerStyle: React.CSSProperties = {
    background: '#0D0D0D',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    width: 360,
    minWidth: 360,
    maxWidth: 360,
    height: '100%',
    color: theme.colors.textPrimary,
    overflowY: 'auto',
    overflowX: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.lg,
    boxSizing: 'border-box',
  };
  function isIfElseNodeData(data: unknown): data is IfElseNodeData {
    return typeof data === "object" && data !== null && "condition" in data;
  }

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
      let updatedValue = value;
      // If updating context, ensure metadata is Record<string, string>
      if (
        field === "context" &&
        value &&
        typeof value === "object" &&
        "metadata" in value
      ) {
        const ctx = value as IfElseNodeData["context"];
        if (ctx && ctx.metadata && typeof ctx.metadata === "object") {
          // Coerce all metadata values to strings
          ctx.metadata = Object.fromEntries(
            Object.entries(ctx.metadata).map(([k, v]) => [k, String(v)])
          );
        }
        updatedValue = ctx;
      }
      const updatedData = { ...prev, [field]: updatedValue };
      onChange({ ...node, data: { ...node.data, ...updatedData } });
      return updatedData;
    });
  };

  return (
    <div style={panelContainerStyle}>
      {/* Condition */}
      <PanelSection
        title="Condition"
        description="Boolean expression to evaluate"
        icon={<GitBranch size={16} />}
      >
        <label
          style={{
            fontSize: "11px",
            fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
            fontWeight: 500,
            color: "#e7e7e7ff",
            marginBottom: "4px",
            display: "block",
          }}
        >
          Condition Expression
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
            fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
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
            e.target.style.border = "1px solid #303030ff";
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
            fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
            fontWeight: 500,
            color: "#ffffffff",
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
            fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
            borderRadius: "4px",
            border: "1px solid #5c5c5cff",
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
            fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
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
            overflowX: "hidden",
            wordBreak: "break-word",
            whiteSpace: "pre-wrap",
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
            fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
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
            backgroundColor: "#111010ff",
            color: "#6b7280",
            outline: "none",
            resize: "vertical",
            minHeight: "60px",
            boxSizing: "border-box",
            lineHeight: 1.4,
            overflowX: "hidden",
            wordBreak: "break-word",
            whiteSpace: "pre-wrap",
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
          Read-only view of execution history.
        </div>
      </PanelSection>
    </div>
  );
}
