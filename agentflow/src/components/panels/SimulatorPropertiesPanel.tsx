// All UI rules for properties panels must come from propertiesPanelTheme.ts
import React, { useState } from "react";
import { figmaPropertiesTheme as theme } from "./propertiesPanelTheme";
import { VSCodeButton } from "../primitives/vsCodeFormComponents";
import { CanvasNode } from "@/types";
import { PanelSection } from "../primitives/PanelSection";

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

  const handleFieldChange = (
    field: string,
    value: string,
    setter: (value: string) => void
  ) => {
    setter(value);
    onChange({ ...node, data: { ...node.data, [field]: value } });
  };

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
  const textareaStyle: React.CSSProperties = {
    width: "100%",
    minHeight: 48,
    background: theme.colors.backgroundSecondary,
    color: theme.colors.textPrimary,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.inputPadding,
    fontFamily: theme.typography.fontMono,
    fontSize: theme.typography.fontSize.base,
    resize: "vertical",
    marginBottom: theme.spacing.lg,
    boxSizing: "border-box",
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
          onChange={(e) =>
            handleFieldChange("testInput", e.target.value, setTestInput)
          }
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
          onChange={(e) =>
            handleFieldChange(
              "expectedOutput",
              e.target.value,
              setExpectedOutput
            )
          }
          placeholder="Expected output..."
        />
      </PanelSection>
      <PanelSection
        title="Simulation Controls"
        description="Run or reset the simulation."
      >
        <VSCodeButton
          type="button"
          style={{
            minWidth: 120,
            fontSize: theme.typography.fontSize.base,
            fontFamily: theme.typography.fontFamily,
            padding: theme.spacing.inputPadding,
          }}
          onClick={() => {
            // Simulation logic here
          }}
        >
          Run Simulation
        </VSCodeButton>
      </PanelSection>
    </div>
  );
}
