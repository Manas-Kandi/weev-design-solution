// All UI rules for properties panels must come from propertiesPanelTheme.ts
import React, { useState } from "react";
import { propertiesPanelTheme as theme } from "./propertiesPanelTheme";
import { CanvasNode } from "@/types";
import PanelSection from "./PanelSection";

interface SimulatorPropertiesPanelProps {
  node: CanvasNode;
  onChange: (node: CanvasNode) => void;
}

export default function SimulatorPropertiesPanel({
  node,
  onChange,
}: SimulatorPropertiesPanelProps) {
  // Use type assertion to allow testInput/expectedOutput as optional fields
  const data = node.data as typeof node.data & {
    testInput?: string;
    expectedOutput?: string;
  };

  const [testInput, setTestInput] = useState<string>(
    () => data.testInput || ""
  );
  const [expectedOutput, setExpectedOutput] = useState<string>(
    () => data.expectedOutput || ""
  );

  const handleFieldChange = (field: string, value: unknown) => {
    onChange({ ...node, data: { ...node.data, [field]: value } });
  };

  // Compose panel style from theme
  const panelStyle: React.CSSProperties = {
    background: theme.colors.background,
    borderLeft: `1px solid ${theme.colors.border}`,
    padding: theme.spacing.sectionPadding,
    borderRadius: theme.borderRadius.section,
    minHeight: 0,
    height: "100%",
    width: 360,
    minWidth: 360,
    maxWidth: 360,
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing.fieldGap,
    boxSizing: "border-box",
    overflowY: "auto",
  };
  const textareaStyle: React.CSSProperties = {
    width: "100%",
    minHeight: 48,
    background: theme.colors.inputBackground,
    color: theme.colors.inputText,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.input,
    padding: theme.spacing.inputPadding,
    font: theme.font.input,
    resize: "vertical",
    marginBottom: theme.spacing.fieldGap,
  };
  const buttonStyle: React.CSSProperties = {
    background: theme.colors.accent,
    color: "#fff",
    padding: "8px 16px",
    borderRadius: theme.borderRadius.input,
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 15,
    transition: "background 0.2s",
  };

  return (
    <div style={panelStyle}>
      <PanelSection
        title="Test Input"
        description="Provide input data for simulation."
      >
        <textarea
          style={textareaStyle}
          value={testInput}
          onChange={(e) => {
            setTestInput(e.target.value);
            handleFieldChange("testInput", e.target.value);
          }}
          placeholder="Input for simulation..."
        />
      </PanelSection>
      <PanelSection
        title="Expected Output"
        description="Define the expected output for this test case."
      >
        <textarea
          style={textareaStyle}
          value={expectedOutput}
          onChange={(e) => {
            setExpectedOutput(e.target.value);
            handleFieldChange("expectedOutput", e.target.value);
          }}
          placeholder="Expected output..."
        />
      </PanelSection>
      <PanelSection
        title="Simulation Controls"
        description="Run or reset the simulation."
      >
        <button
          style={buttonStyle}
          type="button"
          onClick={() => {
            // Simulation logic here
          }}
        >
          Run Simulation
        </button>
      </PanelSection>
    </div>
  );
}
