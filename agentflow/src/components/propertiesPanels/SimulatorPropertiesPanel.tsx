import React, { useState } from "react";
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

  return (
    <div className="flex flex-col gap-4">
      <PanelSection
        title="Test Input"
        description="Provide input data for simulation."
      >
        <textarea
          className="w-full min-h-[48px] bg-panel border border-border rounded p-2 text-text"
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
          className="w-full min-h-[48px] bg-panel border border-border rounded p-2 text-text"
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
          className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition"
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
