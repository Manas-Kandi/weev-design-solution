import React, { useState } from "react";
import { CanvasNode } from "@/types";
import { Input } from "../ui/input";
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

  return (
    <div className="flex flex-col gap-4 p-4 bg-[#23272e] rounded-xl shadow-lg min-w-[320px] max-w-[400px]">
      <section>
        <h3 className="text-vscode-title font-semibold mb-2">Description</h3>
        <Input
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            handleFieldChange("description", e.target.value);
          }}
          placeholder="Test case description..."
          disabled={false}
        />
      </section>
      <section>
        <h3 className="text-vscode-title font-semibold mb-2">Input</h3>
        <textarea
          className="w-full min-h-[48px] bg-vscode-panel border border-vscode-border rounded p-2 text-vscode-text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            handleFieldChange("input", e.target.value);
          }}
          placeholder="Test input..."
          disabled={false}
        />
      </section>
      <section>
        <h3 className="text-vscode-title font-semibold mb-2">
          Expected Output
        </h3>
        <textarea
          className="w-full min-h-[48px] bg-vscode-panel border border-vscode-border rounded p-2 text-vscode-text"
          value={expectedOutput}
          onChange={(e) => {
            setExpectedOutput(e.target.value);
            handleFieldChange("expectedOutput", e.target.value);
          }}
          placeholder="Expected output..."
          disabled={false}
        />
      </section>
      <section>
        <h3 className="text-vscode-title font-semibold mb-2">Assert Type</h3>
        <Select
          value={assertType}
          onValueChange={(v) => {
            setAssertType(v);
            handleFieldChange("assertType", v);
          }}
        >
          <SelectTrigger className="w-full">
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
      </section>
      <section>
        <Button
          variant="default"
          onClick={() => {
            /* TODO: Trigger test logic here */
          }}
        >
          Run Test
        </Button>
      </section>
    </div>
  );
}
