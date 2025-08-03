// All UI rules for properties panels must come from propertiesPanelTheme.ts
import React from "react";
import { figmaPropertiesTheme as theme } from "./propertiesPanelTheme";
import { VSCodeInput } from "./vsCodeFormComponents";
import { CanvasNode } from "@/types";
import { PanelSection } from "./PanelSection";

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
      style={{
        width: "100%",
        minWidth: 0,
        maxWidth: "100%",
        height: "100%",
        background: "rgba(20, 22, 28, 0.72)", // glassy dark
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        padding: "20px 18px 18px 18px",
        boxSizing: "border-box",
        overflowY: "auto",
        overflowX: "hidden",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        border: "none",
        boxShadow: "none",
        position: "relative",
      }}
    >
      <PanelSection
        title="Condition"
        description="Expression to evaluate for routing"
      >
        <VSCodeInput
          value={ifElseData.condition || ""}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleFieldChange("condition", e.target.value)
          }
          placeholder="e.g. input == 'yes'"
        />
        <div
          style={{
            fontSize: "13px",
            color: "#b0b0b0",
            marginTop: "6px",
          }}
        >
          Boolean/JS-like expression. Example:{" "}
          <code>input == &#39;yes&#39;</code>
        </div>
      </PanelSection>
      <PanelSection
        title="Message"
        description="Optional message to emit if condition is met."
      >
        <VSCodeInput
          value={ifElseData.message || ""}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleFieldChange("message", e.target.value)
          }
          placeholder="e.g. Branch taken!"
        />
        <div
          style={{
            fontSize: "13px",
            color: "#b0b0b0",
            marginTop: "6px",
          }}
        >
          This message will be sent if the condition is true.
        </div>
      </PanelSection>
      <PanelSection
        title="Context"
        description="Context and metadata (edit as JSON)"
      >
        <label
          style={{
            display: "block",
            marginBottom: theme.spacing.xs,
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.medium,
            color: theme.colors.textPrimary,
            fontFamily: theme.typography.fontFamily,
          }}
        >
          Context
        </label>
        <textarea
          style={{
            width: "100%",
            minHeight: 48,
            borderRadius: theme.borderRadius.sm,
            background: theme.colors.backgroundTertiary,
            border: `1px solid ${theme.colors.border}`,
            padding: theme.spacing.inputPadding,
            color: theme.colors.textPrimary,
            fontFamily: theme.typography.fontMono,
            fontSize: theme.typography.fontSize.base,
            resize: "vertical",
            boxSizing: "border-box",
            transition: "box-shadow 0.2s",
          }}
          value={JSON.stringify(ifElseData.context ?? {}, null, 2)}
          onChange={(e) => {
            try {
              handleFieldChange("context", JSON.parse(e.target.value));
            } catch {}
          }}
          placeholder='{"flowId": "...", "metadata": {}}'
        />
        <div
          style={{
            marginTop: theme.spacing.xs,
            fontSize: theme.typography.fontSize.xs,
            color: theme.colors.textMuted,
            fontFamily: theme.typography.fontFamily,
          }}
        >
          Edit the node context as JSON.
        </div>
      </PanelSection>
      <PanelSection title="History" description="Execution history (read-only)">
        <label
          style={{
            display: "block",
            marginBottom: theme.spacing.xs,
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.medium,
            color: theme.colors.textPrimary,
            fontFamily: theme.typography.fontFamily,
          }}
        >
          History
        </label>
        <textarea
          style={{
            width: "100%",
            minHeight: 48,
            borderRadius: theme.borderRadius.sm,
            background: theme.colors.backgroundTertiary,
            border: `1px solid ${theme.colors.border}`,
            padding: theme.spacing.inputPadding,
            color: theme.colors.textPrimary,
            fontFamily: theme.typography.fontMono,
            fontSize: theme.typography.fontSize.base,
            resize: "vertical",
            boxSizing: "border-box",
            transition: "box-shadow 0.2s",
          }}
          value={JSON.stringify(ifElseData.history ?? [], null, 2)}
          readOnly
        />
        <div
          style={{
            marginTop: theme.spacing.xs,
            fontSize: theme.typography.fontSize.xs,
            color: theme.colors.textMuted,
            fontFamily: theme.typography.fontFamily,
          }}
        >
          Read-only execution history for this node.
        </div>
      </PanelSection>
      <PanelSection title="State" description="Node state (edit as JSON)">
        <label
          style={{
            display: "block",
            marginBottom: theme.spacing.xs,
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.medium,
            color: theme.colors.textPrimary,
            fontFamily: theme.typography.fontFamily,
          }}
        >
          State
        </label>
        <textarea
          style={{
            width: "100%",
            minHeight: 48,
            borderRadius: theme.borderRadius.sm,
            background: theme.colors.backgroundTertiary,
            border: `1px solid ${theme.colors.border}`,
            padding: theme.spacing.inputPadding,
            color: theme.colors.textPrimary,
            fontFamily: theme.typography.fontMono,
            fontSize: theme.typography.fontSize.base,
            resize: "vertical",
            boxSizing: "border-box",
            transition: "box-shadow 0.2s",
          }}
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
        <div
          style={{
            marginTop: theme.spacing.xs,
            fontSize: theme.typography.fontSize.xs,
            color: theme.colors.textMuted,
            fontFamily: theme.typography.fontFamily,
          }}
        >
          Edit the node state as JSON.
        </div>
      </PanelSection>
    </div>
  );
}
// TODO: Add unit tests for IfElse node property panel to ensure type safety and prevent regressions.
