// All UI rules for properties panels must come from propertiesPanelTheme.ts
import React, { useState } from "react";
import { propertiesPanelTheme as theme } from "./propertiesPanelTheme";
import { CanvasNode } from "@/types";
import { Input } from "../ui/input";
import PanelSection from "./PanelSection";

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
  const handleFieldChange = (field: keyof ChatNodeData, value: unknown) => {
    const updatedData = {
      ...node.data,
      [field]: value,
    };
    onChange({ ...node, data: updatedData });
  };

  // Compose styles from theme
  const panelStyle: React.CSSProperties = {
    background: theme.colors.background,
    borderLeft: `1px solid ${theme.colors.border}`,
    padding: theme.spacing.sectionPadding,
    borderRadius: theme.borderRadius.section,
    minHeight: 0,
    height: "100%",
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing.fieldGap,
  };
  const labelStyle: React.CSSProperties = {
    color: theme.colors.label,
    font: theme.font.label,
    marginBottom: theme.spacing.labelMargin,
  };
  const inputStyle: React.CSSProperties = {
    background: theme.colors.inputBackground,
    color: theme.colors.inputText,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.input,
    padding: theme.spacing.inputPadding,
    width: "100%",
    marginBottom: theme.spacing.fieldGap,
  };

  return (
    <div style={panelStyle}>
      <PanelSection
        title="Chat Interface Settings"
        description="Configure chat interface properties."
      >
        <label style={labelStyle}>Title</label>
        <Input
          style={inputStyle}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            handleFieldChange("title", e.target.value);
          }}
          placeholder="Chat title"
        />
        <label style={labelStyle}>Placeholder</label>
        <Input
          style={inputStyle}
          value={placeholder}
          onChange={(e) => {
            setPlaceholder(e.target.value);
            handleFieldChange("placeholder", e.target.value);
          }}
          placeholder="Type your message..."
        />
        <div style={{ marginTop: 16 }}>
          <label style={labelStyle}>
            <input
              type="checkbox"
              checked={enableFileUpload}
              onChange={(e) => {
                setEnableFileUpload(e.target.checked);
                handleFieldChange("enableFileUpload", e.target.checked);
              }}
              style={{ marginRight: 8 }}
            />
            Enable File Upload
          </label>
        </div>
        <div style={{ marginTop: 8 }}>
          <label style={labelStyle}>
            <input
              type="checkbox"
              checked={showHistory}
              onChange={(e) => {
                setShowHistory(e.target.checked);
                handleFieldChange("showHistory", e.target.checked);
              }}
              style={{ marginRight: 8 }}
            />
            Show History
          </label>
        </div>
      </PanelSection>
    </div>
  );
}
