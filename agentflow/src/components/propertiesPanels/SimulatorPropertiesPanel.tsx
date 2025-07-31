import React, { useState } from "react";
import { CanvasNode } from "@/types";
import { Button } from "@/components/ui/button"; // <-- changed casing to 'button'

// Extend node.data for simulation panel
type SimulatorNodeData = CanvasNode["data"] & {
  testInput?: string;
  expectedOutput?: string;
};

interface SimulatorPropertiesPanelProps {
  node: CanvasNode;
  onChange: (node: CanvasNode) => void;
}

export default function SimulatorPropertiesPanel({
  node,
  onChange,
}: SimulatorPropertiesPanelProps) {
  // Use type assertion to access simulation fields safely
  const simData = node.data as SimulatorNodeData;

  const [testInput, setTestInput] = useState<string>(
    () => simData.testInput || ""
  );
  const [expectedOutput, setExpectedOutput] = useState<string>(
    () => simData.expectedOutput || ""
  );

  const handleFieldChange = (
    field: keyof SimulatorNodeData,
    value: unknown
  ) => {
    onChange({ ...node, data: { ...node.data, [field]: value } });
  };

  return (
    <div className="flex flex-col gap-4">
      <section>
        <h3 className="text-accent font-semibold mb-2">Test Input</h3>
        <textarea
          className="w-full min-h-[48px] bg-panel border border-border rounded p-2 text-text"
          value={testInput}
          onChange={(e) => {
            setTestInput(e.target.value);
            handleFieldChange("testInput", e.target.value);
          }}
          placeholder="Input for simulation..."
        />
      </section>
      <section>
        <h3 className="text-accent font-semibold mb-2">Expected Output</h3>
        <textarea
          className="w-full min-h-[48px] bg-panel border border-border rounded p-2 text-text"
          value={expectedOutput}
          onChange={(e) => {
            setExpectedOutput(e.target.value);
            handleFieldChange("expectedOutput", e.target.value);
          }}
          placeholder="Expected output..."
        />
      </section>
      <section>
        <Button
          variant="default"
          onClick={() => {
            /* Trigger simulation logic here */
          }}
        >
          Run Test
        </Button>
      </section>
      {/* TODO: Add unit tests for this panel to ensure type safety and prevent regressions. */}
    </div>
  );
}
