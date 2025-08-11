// All UI rules for properties panels must come from propertiesPanelTheme.ts
import React, { useState } from "react";
import { figmaPropertiesTheme as theme } from "./propertiesPanelTheme";
import { CanvasNode } from "@/types";
import { PanelSection } from "../primitives/PanelSection";
import { VSCodeInput } from "../primitives/vsCodeFormComponents";

interface ChatInterfacePropertiesPanelProps {
  node: CanvasNode;
  onChange: (node: CanvasNode) => void;
}

export default function ChatInterfacePropertiesPanel({
  node,
  onChange,
}: ChatInterfacePropertiesPanelProps) {
  interface ChatNodeData {
    title?: string;
    placeholder?: string;
    enableFileUpload?: boolean;
    showHistory?: boolean;
    [key: string]: unknown;
  }

  const data = node.data as ChatNodeData | undefined;

  const [title, setTitle] = useState<string>(() =>
    data && typeof data.title === "string" ? data.title : ""
  );
  const [placeholder, setPlaceholder] = useState<string>(() =>
    data && typeof data.placeholder === "string" ? data.placeholder : ""
  );
  const [enableFileUpload, setEnableFileUpload] = useState<boolean>(() =>
    data && typeof data.enableFileUpload === "boolean"
      ? data.enableFileUpload
      : false
  );
  const [showHistory, setShowHistory] = useState<boolean>(() =>
    data && typeof data.showHistory === "boolean" ? data.showHistory : false
  );

  // Only update known fields, preserve extra fields
  // Setter helpers to ensure correct type for useState
  const handleStringFieldChange = (
    field: keyof ChatNodeData,
    value: string,
    setter: (value: string) => void
  ) => {
    setter(value ?? "");
    const updatedData = {
      ...node.data,
      [field]: value ?? "",
    };
    onChange({ ...node, data: updatedData });
  };

  const handleBooleanFieldChange = (
    field: keyof ChatNodeData,
    value: boolean,
    setter: (value: boolean) => void
  ) => {
    setter(!!value);
    const updatedData = {
      ...node.data,
      [field]: !!value,
    };
    onChange({ ...node, data: updatedData });
  };

  // Compose styles from theme
  const panelStyle: React.CSSProperties = {
    background: theme.colors.background,
    borderLeft: `1px solid ${theme.colors.border}`,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    minHeight: 0,
    height: "100%",
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing.lg,
  };
  const labelStyle: React.CSSProperties = {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily,
    marginBottom: theme.spacing.xs,
  };
  const inputStyle: React.CSSProperties = {
    background: theme.colors.backgroundTertiary,
    color: theme.colors.textPrimary,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.inputPadding,
    width: "100%",
    marginBottom: theme.spacing.md,
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.fontSize.base,
  };

  return (
    <div style={panelStyle}>
      <PanelSection
        title="Chat Interface Settings"
        description="Configure chat interface properties."
      >
        <label style={labelStyle}>Title</label>
        <VSCodeInput
          style={inputStyle}
          value={title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleStringFieldChange("title", e.target.value, setTitle)
          }
          placeholder="Chat title"
        />
        <label style={labelStyle}>Placeholder</label>
        <VSCodeInput
          style={inputStyle}
          value={placeholder}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleStringFieldChange(
              "placeholder",
              e.target.value,
              setPlaceholder
            )
          }
          placeholder="Type your message..."
        />
        <div style={{ marginTop: theme.spacing.md }}>
          <label style={labelStyle}>
            <input
              type="checkbox"
              checked={enableFileUpload}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleBooleanFieldChange(
                  "enableFileUpload",
                  e.target.checked,
                  setEnableFileUpload
                )
              }
              style={{ marginRight: theme.spacing.sm }}
            />
            Enable File Upload
          </label>
        </div>
        <div style={{ marginTop: theme.spacing.sm }}>
          <label style={labelStyle}>
            <input
              type="checkbox"
              checked={showHistory}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleBooleanFieldChange(
                  "showHistory",
                  e.target.checked,
                  setShowHistory
                )
              }
              style={{ marginRight: theme.spacing.sm }}
            />
            Show History
          </label>
        </div>
      </PanelSection>
    </div>
  );
}
