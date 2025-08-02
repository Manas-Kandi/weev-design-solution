// All UI rules for properties panels must come from propertiesPanelTheme.ts
import React, { useState } from "react";
import { vsCodePropertiesTheme as theme } from "./propertiesPanelTheme";
import { CanvasNode } from "@/types";
import PanelSection from "./PanelSection";
import {
  VSCodeInput,
  VSCodeSelect,
  VSCodeButton,
} from "./vsCodeFormComponents";

interface TestCasePropertiesPanelProps {
  node: CanvasNode;
  onChange: (node: CanvasNode) => void;
}

const assertTypes = [
  { value: "equals", label: "Equals" },
  { value: "contains", label: "Contains" },
  { value: "regex", label: "Regex" },
];

// Type guard for test case node data
export type TestCaseNodeData = {
  input?: string;
  expectedOutput?: string;
  description?: string;
  assertType?: string;
  [key: string]: string | undefined;
};
function isTestCaseNodeData(data: unknown): data is TestCaseNodeData {
  return (
    typeof data === "object" &&
    data !== null &&
    ("input" in data || "expectedOutput" in data)
  );
}

export default function TestCasePropertiesPanel({
  node,
  onChange,
}: TestCasePropertiesPanelProps) {
  const testCaseData: TestCaseNodeData = isTestCaseNodeData(node.data)
    ? (node.data as TestCaseNodeData)
    : {};

  const [input, setInput] = useState<string>(() => testCaseData.input || "");
  const [expectedOutput, setExpectedOutput] = useState<string>(
    () => testCaseData.expectedOutput || ""
  );
  const [description, setDescription] = useState<string>(
    () => testCaseData.description || ""
  );
  const [assertType, setAssertType] = useState<string>(
    () => testCaseData.assertType || assertTypes[0].value
  );

  function handleFieldChange(field: keyof TestCaseNodeData, value: string) {
    const updatedData: TestCaseNodeData = {
      ...testCaseData,
      [field]: value,
    };
    onChange({ ...node, data: updatedData });
  }

  // Theme-based container style
  const containerStyle: React.CSSProperties = {
    width: "360px",
    minWidth: "360px",
    maxWidth: "360px",
    height: "100%",
    background: theme.colors.background,
    color: theme.colors.textPrimary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.sectionPadding,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing.fieldGap,
    boxSizing: "border-box",
  };

  // Theme-based textarea style
  const textareaStyle: React.CSSProperties = {
    width: "100%",
    minHeight: 48,
    background: theme.colors.backgroundTertiary,
    color: theme.colors.textPrimary,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.inputPadding,
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.fontSize.base,
    resize: "vertical",
    boxSizing: "border-box",
  };

  return (
    <div style={containerStyle}>
      <PanelSection
        title="Description"
        description="Describe what this test case should validate."
      >
        <VSCodeInput
          value={description}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setDescription(e.target.value);
            handleFieldChange("description", e.target.value);
          }}
          placeholder="Test case description..."
          style={{ width: "100%" }}
        />
      </PanelSection>
      <PanelSection title="Input" description="Input data for the test case.">
        <textarea
          style={textareaStyle}
          value={input}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
            setInput(e.target.value);
            handleFieldChange("input", e.target.value);
          }}
          placeholder="Test input..."
        />
      </PanelSection>
      <PanelSection
        title="Expected Output"
        description="Expected output for the test case."
      >
        <textarea
          style={textareaStyle}
          value={expectedOutput}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
            setExpectedOutput(e.target.value);
            handleFieldChange("expectedOutput", e.target.value);
          }}
          placeholder="Expected output..."
        />
      </PanelSection>
      <PanelSection
        title="Assert Type"
        description="How should the output be validated?"
      >
        <VSCodeSelect
          value={assertType}
          onValueChange={(v: string) => {
            setAssertType(v);
            handleFieldChange("assertType", v);
          }}
          options={assertTypes}
          placeholder="Choose assertion type"
          style={{ width: "100%" }}
        />
      </PanelSection>
      <PanelSection title="Run Test" description="Execute this test case.">
        <VSCodeButton
          variant="primary"
          size="medium"
          onClick={() => {
            /* TODO: Trigger test logic here */
          }}
        >
          Run Test
        </VSCodeButton>
      </PanelSection>
    </div>
  );
}
