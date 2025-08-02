// All UI rules for properties panels must come from propertiesPanelTheme.ts
import React, { useState } from "react";
import { figmaPropertiesTheme as theme } from "./propertiesPanelTheme";
import { CanvasNode } from "@/types";
import PanelSection from "./PanelSection";
import { VSCodeInput } from "./vsCodeFormComponents";

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
    padding: 20,
    borderRadius: 12,
    minHeight: 0,
    height: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  };
  const labelStyle: React.CSSProperties = {
    color: '#b3b3b3',
    fontSize: 14,
    fontFamily: 'Inter, sans-serif',
    marginBottom: 4,
  };
  const inputStyle: React.CSSProperties = {
    background: theme.colors.backgroundTertiary,
    color: '#fff',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 8,
    padding: 10,
    width: "100%",
    marginBottom: 16,
    fontFamily: 'Inter, sans-serif',
    fontSize: 15,
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
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setTitle(e.target.value);
            handleFieldChange("title", e.target.value);
          }}
          placeholder="Chat title"
        />
        <label style={labelStyle}>Placeholder</label>
        <VSCodeInput
          style={inputStyle}
          value={placeholder}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
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
