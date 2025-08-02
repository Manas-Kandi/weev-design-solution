// All UI rules for properties panels must come from propertiesPanelTheme.ts
import React, { useState } from "react";
import { figmaPropertiesTheme as theme } from "./propertiesPanelTheme";
import { CanvasNode } from "@/types";
import PanelSection from "./PanelSection";
import { VSCodeInput, VSCodeSelect } from "./vsCodeFormComponents";

interface MessagePropertiesPanelProps {
  node: CanvasNode;
  onChange: (node: CanvasNode) => void;
}

interface MessageNodeData {
  title?: string;
  content?: string;
  messageType?: "System" | "User" | "Assistant";
  passThrough?: boolean;
}

import { isMessageNodeData } from "@/utils/typeGuards";

const TITLE_MAX = 50;

export default function MessagePropertiesPanel({
  node,
  onChange,
}: MessagePropertiesPanelProps) {
  // Extract and normalize data
  const safeData: MessageNodeData = isMessageNodeData(node.data)
    ? {
        title:
          "title" in node.data && typeof node.data.title === "string"
            ? node.data.title
            : "Message",
        content:
          "content" in node.data && typeof node.data.content === "string"
            ? node.data.content
            : "message" in node.data &&
              typeof (node.data as { message?: string }).message === "string"
            ? (node.data as { message: string }).message
            : "",
        messageType:
          "messageType" in node.data &&
          typeof node.data.messageType === "string"
            ? (node.data.messageType as MessageNodeData["messageType"])
            : "User",
        passThrough:
          "passThrough" in node.data
            ? Boolean(
                typeof (node.data as { passThrough?: unknown }).passThrough ===
                  "boolean"
                  ? (node.data as { passThrough: boolean }).passThrough
                  : false
              )
            : false,
      }
    : {
        title: "Message",
        content: "",
        messageType: "User",
        passThrough: false,
      };

  // Validation state
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  const handleFieldChange = (field: keyof MessageNodeData, value: unknown) => {
    // Always spread the original node.data to preserve union fields
    onChange({ ...node, data: { ...node.data, [field]: value } });
  };

  // Validation logic
  const errors: { [key: string]: string } = {};
  if (!safeData.title || safeData.title.trim().length === 0) {
    errors.title = "Title is required.";
  } else if (safeData.title.length > TITLE_MAX) {
    errors.title = `Title must be under ${TITLE_MAX} characters.`;
  }
  if (!safeData.content || safeData.content.trim().length === 0) {
    errors.content = "Message content is required.";
  }

  // Compose panel style from theme
  const panelStyle: React.CSSProperties = {
    background: theme.colors.background,
    borderLeft: `1px solid ${theme.colors.border}`,
    padding: "24px",
    borderRadius: "12px",
    minHeight: 0,
    height: "100%",
    width: 360,
    minWidth: 360,
    maxWidth: 360,
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    boxSizing: "border-box",
    overflowY: "auto",
  };

  // UI
  return (
    <div style={panelStyle}>
      {/* Required Fields */}
      <PanelSection title="Required" description="">
        <label
          style={{
            display: "block",
            marginBottom: 4,
            color: "#f3f3f3",
            fontWeight: 500,
            fontSize: "15px",
          }}
        >
          Title <span style={{ color: "#ef4444" }}>*</span>
        </label>
        <VSCodeInput
          value={safeData.title}
          maxLength={TITLE_MAX}
          placeholder="Message"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleFieldChange("title", e.target.value)
          }
          onBlur={() => setTouched((t) => ({ ...t, title: true }))}
        />
        <span style={{ color: "#b0b0b0", fontSize: 12 }}>
          Max {TITLE_MAX} characters
        </span>
        {touched.title && errors.title && (
          <div
            style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}
          >
            {errors.title}
          </div>
        )}

        <label
          style={{
            display: "block",
            marginBottom: 4,
            color: "#f3f3f3",
            fontWeight: 500,
            fontSize: "15px",
          }}
        >
          Message Content <span style={{ color: "#ef4444" }}>*</span>
        </label>
        <textarea
          style={{
            width: "100%",
            minHeight: 64,
            borderRadius: "6px",
            background: theme.colors.backgroundSecondary,
            color: "#f3f3f3",
            border: `1px solid ${theme.colors.border}`,
            padding: "12px",
            marginBottom: "20px",
            transition: "all 0.15s",
            fontFamily: 'Menlo, monospace',
            fontSize: "15px",
            resize: "vertical",
          }}
          value={safeData.content}
          maxLength={500}
          placeholder="Message to send..."
          onChange={(e) => handleFieldChange("content", e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, content: true }))}
        />
        <span style={{ color: "#b0b0b0", fontSize: 12 }}>
          Required. This will be sent as the message.
        </span>
        {touched.content && errors.content && (
          <div
            style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}
          >
            {errors.content}
          </div>
        )}

        <label
          style={{
            display: "block",
            marginBottom: 4,
            color: "#f3f3f3",
            fontWeight: 500,
            fontSize: "15px",
          }}
        >
          Message Type
        </label>
        <VSCodeSelect
          value={safeData.messageType || "User"}
          onValueChange={(v: string) =>
            handleFieldChange(
              "messageType",
              v as MessageNodeData["messageType"]
            )
          }
          options={[
            { value: "System", label: "System" },
            { value: "User", label: "User" },
            { value: "Assistant", label: "Assistant" },
          ]}
          placeholder="Message Type"
        />
        <span style={{ color: "#b0b0b0", fontSize: 12 }}>
          Choose the role for this message.
        </span>
      </PanelSection>
      <PanelSection title="Advanced" description="Optional: pass input through">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 8,
          }}
        >
          <input
            type="checkbox"
            checked={!!safeData.passThrough}
            onChange={(e) => handleFieldChange("passThrough", e.target.checked)}
            id="passThrough"
            style={{
              accentColor: "#38bdf8",
              width: 16,
              height: 16,
              borderRadius: "6px",
              border: `1px solid ${theme.colors.border}`,
            }}
          />
          <label
            htmlFor="passThrough"
            style={{
              color: "#f3f3f3",
              fontWeight: 500,
              fontSize: "15px",
            }}
          >
            Pass Through Mode
            <span
              style={{
                display: "block",
                color: "#b0b0b0",
                fontSize: 12,
              }}
            >
              If enabled, this node will pass its input through instead of using
              the message content.
            </span>
          </label>
        </div>
      </PanelSection>
    </div>
  );
}
// TODO: Add unit tests for this panel to ensure type safety and prevent regressions.
