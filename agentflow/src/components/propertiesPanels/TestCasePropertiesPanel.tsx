// All UI rules for properties panels must come from propertiesPanelTheme.ts
import React, { useState } from "react";
import { propertiesPanelTheme as theme } from "./propertiesPanelTheme";
import { CanvasNode } from "@/types";
import { Input } from "../ui/input";
import PanelSection from "./PanelSection";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";

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
    color: theme.colors.inputText,
    borderRadius: theme.borderRadius.section,
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
    background: theme.colors.inputBackground,
    color: theme.colors.inputText,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.input,
    padding: theme.spacing.inputPadding,
    font: theme.font.input,
    resize: "vertical",
    boxSizing: "border-box",
  };

  // Theme-based button style
  const buttonStyle: React.CSSProperties = {
    background: theme.colors.accent,
    color: "#fff",
    borderRadius: theme.borderRadius.input,
    font: theme.font.input,
    padding: theme.spacing.inputPadding,
    border: "none",
    cursor: "pointer",
  };

  return (
    <div style={containerStyle}>
      <PanelSection
        title="Description"
        description="Describe what this test case should validate."
      >
        <Input
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            handleFieldChange("description", e.target.value);
          }}
          placeholder="Test case description..."
          disabled={false}
          style={{ width: "100%" }}
        />
      </PanelSection>
      <PanelSection title="Input" description="Input data for the test case.">
        <textarea
          style={textareaStyle}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            handleFieldChange("input", e.target.value);
          }}
          placeholder="Test input..."
          disabled={false}
        />
      </PanelSection>
      <PanelSection
        title="Expected Output"
        description="Expected output for the test case."
      >
        <textarea
          style={textareaStyle}
          value={expectedOutput}
          onChange={(e) => {
            setExpectedOutput(e.target.value);
            handleFieldChange("expectedOutput", e.target.value);
          }}
          placeholder="Expected output..."
          disabled={false}
        />
      </PanelSection>
      <PanelSection
        title="Assert Type"
        description="How should the output be validated?"
      >
        <Select
          value={assertType}
          onValueChange={(v) => {
            setAssertType(v);
            handleFieldChange("assertType", v);
          }}
        >
          <SelectTrigger style={{ width: "100%" }}>
            <SelectValue placeholder="Choose assertion type" />
          </SelectTrigger>
          <SelectContent>
            {assertTypes.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PanelSection>
      <PanelSection title="Run Test" description="Execute this test case.">
        <Button
          variant="default"
          style={buttonStyle}
          onClick={() => {
            /* TODO: Trigger test logic here */
          }}
        >
          Run Test
        </Button>
      </PanelSection>
    </div>
  );
}
