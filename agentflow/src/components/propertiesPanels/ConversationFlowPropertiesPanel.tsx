import React, { useState } from "react";
import { CanvasNode } from "@/types";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import PanelSection from "./PanelSection";

interface ConversationFlowNodeData {
  states: string[];
  initialState: string;
  persistState: boolean;
  transitions: { from: string; to: string; condition: string }[];
}

interface ConversationFlowPropertiesPanelProps {
  node: CanvasNode & { data: ConversationFlowNodeData };
  onChange: (node: CanvasNode & { data: ConversationFlowNodeData }) => void;
}

interface TransitionInputProps {
  tr: { from: string; to: string; condition: string };
  idx: number;
  transitions: { from: string; to: string; condition: string }[];
  setTransitions: React.Dispatch<
    React.SetStateAction<{ from: string; to: string; condition: string }[]>
  >;
  handleFieldChange: (field: string, value: unknown) => void;
}

const TransitionInput: React.FC<TransitionInputProps> = ({
  tr,
  idx,
  transitions,
  setTransitions,
  handleFieldChange,
}) => (
  <div className="flex items-center gap-2 mb-2">
    <Input
      value={tr.from || ""}
      onChange={(e) => {
        const next = [...transitions];
        next[idx] = { ...next[idx], from: e.target.value };
        setTransitions(next);
        handleFieldChange("transitions", next);
      }}
      className="w-24"
      placeholder="From"
    />
    <Input
      value={tr.to || ""}
      onChange={(e) => {
        const next = [...transitions];
        next[idx] = { ...next[idx], to: e.target.value };
        setTransitions(next);
        handleFieldChange("transitions", next);
      }}
      className="w-24"
      placeholder="To"
    />
    <Input
      value={tr.condition || ""}
      onChange={(e) => {
        const next = [...transitions];
        next[idx] = { ...next[idx], condition: e.target.value };
        setTransitions(next);
        handleFieldChange("transitions", next);
      }}
      className="w-32"
      placeholder="Condition"
    />
    <Button
      size="sm"
      variant="destructive"
      onClick={() => {
        const next = transitions.filter((_, i) => i !== idx);
        setTransitions(next);
        handleFieldChange("transitions", next);
      }}
    >
      Remove
    </Button>
  </div>
);

export default function ConversationFlowPropertiesPanel({
  node,
  onChange,
}: ConversationFlowPropertiesPanelProps) {
  const [states, setStates] = useState<string[]>(() => node.data?.states || []);
  const [initialState, setInitialState] = useState<string>(
    () => node.data?.initialState || ""
  );
  const [persistState, setPersistState] = useState<boolean>(
    () => node.data?.persistState || false
  );
  const [transitions, setTransitions] = useState<
    { from: string; to: string; condition: string }[]
  >(() => node.data?.transitions || []);

  const handleFieldChange = (field: string, value: unknown) => {
    onChange({ ...node, data: { ...node.data, [field]: value } });
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-[#23272e] rounded-xl shadow-lg min-w-[320px] max-w-[400px]">
      <PanelSection title="States" description="Comma-separated list of all possible states.">
        <Input
          value={states.join(", ")}
          onChange={(e) => {
            const arr = e.target.value
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
            setStates(arr);
            handleFieldChange("states", arr);
          }}
          placeholder="Comma separated states"
        />
      </PanelSection>
      <PanelSection title="Initial State" description="The starting state for the conversation flow.">
        <Input
          value={initialState}
          onChange={(e) => {
            setInitialState(e.target.value);
            handleFieldChange("initialState", e.target.value);
          }}
          placeholder="Initial state"
        />
      </PanelSection>
      <PanelSection title="Transitions" description="Define transitions between states and their conditions.">
        <div className="flex flex-col gap-1">
          {transitions.map((tr, idx) => (
            <TransitionInput
              key={idx}
              tr={tr}
              idx={idx}
              transitions={transitions}
              setTransitions={setTransitions}
              handleFieldChange={handleFieldChange}
            />
          ))}
          <Button
            size="sm"
            onClick={() => {
              const next = [
                ...transitions,
                { from: "", to: "", condition: "" },
              ];
              setTransitions(next);
              handleFieldChange("transitions", next);
            }}
          >
            Add Transition
          </Button>
        </div>
      </PanelSection>
      <PanelSection title="Persistence" description="Optionally persist the state across executions.">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={persistState}
            onChange={(e) => {
              setPersistState(e.target.checked);
              handleFieldChange("persistState", e.target.checked);
            }}
          />
          <span>Persist State</span>
        </label>
      </PanelSection>
      {/* TODO: Add unit tests for this panel to ensure type safety and prevent regressions. */}
    </div>
  );
}
