// All UI rules for properties panels must come from propertiesPanelTheme.ts
import React, { useState } from "react";
import { figmaPropertiesTheme as theme } from "./propertiesPanelTheme";
import { CanvasNode } from "@/types";
import { PanelSection } from "../primitives/PanelSection";
import { VSCodeInput, VSCodeSelect } from "../primitives/vsCodeFormComponents";

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
  const initialData: MessageNodeData = isMessageNodeData(node.data)
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

  const [data, setData] = useState<MessageNodeData>(initialData);

  // Validation state
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  const handleFieldChange = (field: keyof MessageNodeData, value: unknown) => {
    setData((prev) => {
      const updated = { ...prev, [field]: value };
      onChange({ ...node, data: { ...node.data, ...updated } });
      return updated;
    });
  };

  // Validation logic
  const errors: { [key: string]: string } = {};
  if (!data.title || data.title.trim().length === 0) {
    errors.title = "Title is required.";
  } else if (data.title.length > TITLE_MAX) {
    errors.title = `Title must be under ${TITLE_MAX} characters.`;
  }
  if (!data.content || data.content.trim().length === 0) {
    errors.content = "Message content is required.";
  }

  // Compose panel style from theme
  const panelStyle: React.CSSProperties = {
    background: theme.colors.background,
    borderLeft: `1px solid ${theme.colors.border}`,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    minHeight: 0,
    height: "100%",
    width: 360,
    minWidth: 360,
    maxWidth: 360,
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing.lg,
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
            marginBottom: theme.spacing.xs,
            color: theme.colors.textPrimary,
            fontWeight: theme.typography.fontWeight.medium,
            fontSize: theme.typography.fontSize.base,
            fontFamily: theme.typography.fontFamily,
          }}
        >
          Title <span style={{ color: theme.colors.error }}>*</span>
        </label>
        <VSCodeInput
          value={data.title}
          maxLength={TITLE_MAX}
          placeholder="Message"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleFieldChange("title", e.target.value)
          }
          onBlur={() => setTouched((t) => ({ ...t, title: true }))}
        />
        <span
          style={{
            color: theme.colors.textMuted,
            fontSize: theme.typography.fontSize.xs,
          }}
        >
          Max {TITLE_MAX} characters
        </span>
        {touched.title && errors.title && (
          <div
            style={{
              color: theme.colors.error,
              fontSize: theme.typography.fontSize.xs,
              marginTop: theme.spacing.xs,
            }}
          >
            {errors.title}
          </div>
        )}

        <label
          style={{
            display: "block",
            marginBottom: theme.spacing.xs,
            color: theme.colors.textPrimary,
            fontWeight: theme.typography.fontWeight.medium,
            fontSize: theme.typography.fontSize.base,
            fontFamily: theme.typography.fontFamily,
          }}
        >
          Message Content <span style={{ color: theme.colors.error }}>*</span>
        </label>
        <textarea
          style={{
            width: "100%",
            minHeight: 64,
            borderRadius: theme.borderRadius.md,
            background: theme.colors.backgroundSecondary,
            color: theme.colors.textPrimary,
            border: `1px solid ${theme.colors.border}`,
            padding: theme.spacing.inputPadding,
            marginBottom: theme.spacing.lg,
            transition: theme.animation.medium,
            fontFamily: theme.typography.fontMono,
            fontSize: theme.typography.fontSize.base,
            resize: "vertical",
            boxSizing: "border-box",
          }}
          value={data.content}
          maxLength={500}
          placeholder="Message to send..."
          onChange={(e) => handleFieldChange("content", e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, content: true }))}
        />
        <span
          style={{
            color: theme.colors.textMuted,
            fontSize: theme.typography.fontSize.xs,
          }}
        >
          Required. This will be sent as the message.
        </span>
        {touched.content && errors.content && (
          <div
            style={{
              color: theme.colors.error,
              fontSize: theme.typography.fontSize.xs,
              marginTop: theme.spacing.xs,
            }}
          >
            {errors.content}
          </div>
        )}

        <label
          style={{
            display: "block",
            marginBottom: theme.spacing.xs,
            color: theme.colors.textPrimary,
            fontWeight: theme.typography.fontWeight.medium,
            fontSize: theme.typography.fontSize.base,
            fontFamily: theme.typography.fontFamily,
          }}
        >
          Message Type
        </label>
        <VSCodeSelect
          value={data.messageType || "User"}
          onValueChange={(v: string) =>
            handleFieldChange("messageType", v as MessageNodeData["messageType"])
          }
          options={[
            { value: "System", label: "System" },
            { value: "User", label: "User" },
            { value: "Assistant", label: "Assistant" },
          ]}
          placeholder="Message Type"
        />
        <span
          style={{
            color: theme.colors.textMuted,
            fontSize: theme.typography.fontSize.xs,
          }}
        >
          Choose the role for this message.
        </span>
      </PanelSection>
      <PanelSection title="Advanced" description="Optional: pass input through">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: theme.spacing.xs,
            marginTop: theme.spacing.xs,
          }}
        >
          <input
            type="checkbox"
            checked={!!data.passThrough}
            onChange={(e) => handleFieldChange("passThrough", e.target.checked)}
            id="passThrough"
            style={{
              accentColor: theme.colors.info,
              width: 16,
              height: 16,
              borderRadius: theme.borderRadius.md,
              border: `1px solid ${theme.colors.border}`,
            }}
          />
          <label
            htmlFor="passThrough"
            style={{
              color: theme.colors.textPrimary,
              fontWeight: theme.typography.fontWeight.medium,
              fontSize: theme.typography.fontSize.base,
              fontFamily: theme.typography.fontFamily,
            }}
          >
            Pass Through Mode
            <span
              style={{
                display: "block",
                color: theme.colors.textMuted,
                fontSize: theme.typography.fontSize.xs,
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
