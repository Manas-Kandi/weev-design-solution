// All UI rules for properties panels must come from propertiesPanelTheme.ts
import React, { useState } from "react";
import { figmaPropertiesTheme as theme } from "./propertiesPanelTheme";
import { CanvasNode } from "@/types";
import { PanelSection } from "../primitives/PanelSection";
import {
  VSCodeInput,
  VSCodeSelect,
  VSCodeButton,
} from "../primitives/vsCodeFormComponents";

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

  function handleFieldChange(
    field: keyof TestCaseNodeData,
    value: string,
    setter: (value: string) => void
  ) {
    setter(value);
    // Only copy keys if node.data is TestCaseNodeData, else start fresh
    let updatedData: TestCaseNodeData = {};
    if (isTestCaseNodeData(node.data)) {
      updatedData = { ...node.data };
    }
    updatedData[field] = value;
    onChange({ ...node, data: updatedData });
  }

  // Theme-based container style
  const containerStyle: React.CSSProperties = {
    width: 360,
    minWidth: 360,
    maxWidth: 360,
    height: "100%",
    background: theme.colors.background,
    color: theme.colors.textPrimary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing.lg,
    boxSizing: "border-box",
  };

  // Theme-based textarea style
  const textareaStyle: React.CSSProperties = {
    width: "100%",
    minHeight: 48,
    background: theme.colors.backgroundTertiary,
    color: theme.colors.textPrimary,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.inputPadding,
    fontFamily: theme.typography.fontMono,
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
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleFieldChange("description", e.target.value, setDescription)
          }
          placeholder="Test case description..."
          style={{
            width: "100%",
            fontFamily: theme.typography.fontFamily,
            fontSize: theme.typography.fontSize.base,
            background: theme.colors.backgroundTertiary,
            color: theme.colors.textPrimary,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.borderRadius.sm,
            padding: theme.spacing.inputPadding,
            boxSizing: "border-box",
          }}
        />
      </PanelSection>
      <PanelSection title="Input" description="Input data for the test case.">
        <textarea
          style={textareaStyle}
          value={input}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            handleFieldChange("input", e.target.value, setInput)
          }
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
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
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
        title="Assert Type"
        description="How should the output be validated?"
      >
        <VSCodeSelect
          value={assertType}
          onValueChange={(v: string) =>
            handleFieldChange("assertType", v, setAssertType)
          }
          options={assertTypes}
          placeholder="Choose assertion type"
          style={{
            width: "100%",
            fontFamily: theme.typography.fontFamily,
            fontSize: theme.typography.fontSize.base,
            background: theme.colors.backgroundTertiary,
            color: theme.colors.textPrimary,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.borderRadius.sm,
            padding: theme.spacing.inputPadding,
            boxSizing: "border-box",
          }}
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
