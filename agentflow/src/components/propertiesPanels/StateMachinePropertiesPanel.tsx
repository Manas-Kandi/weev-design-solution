import React, { useState } from "react";
import { CanvasNode } from "@/types";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import PanelSection from "./PanelSection";

interface StateMachinePropertiesPanelProps {
  node: CanvasNode;
  onChange: (node: CanvasNode) => void;
}

// Define StateMachineNodeData interface
interface StateMachineNodeData {
  initialState: string;
  states: string[];
  transitions: { from: string; to: string; condition: string }[];
  persistState?: boolean;
}

// Type guard for StateMachineNodeData
function isStateMachineNodeData(data: unknown): data is StateMachineNodeData {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof (data as StateMachineNodeData).initialState === "string" &&
    Array.isArray((data as StateMachineNodeData).states) &&
    Array.isArray((data as StateMachineNodeData).transitions)
  );
}

export default function StateMachinePropertiesPanel({
  node,
  onChange,
}: StateMachinePropertiesPanelProps) {
  const [states, setStates] = useState<string[]>(() =>
    isStateMachineNodeData(node.data) ? node.data.states : []
  );
  const [initialState, setInitialState] = useState<string>(() =>
    isStateMachineNodeData(node.data) ? node.data.initialState : ""
  );
  const [persistState, setPersistState] = useState<boolean>(() =>
    isStateMachineNodeData(node.data) ? node.data.persistState ?? false : false
  );
  const [transitions, setTransitions] = useState<
    { from: string; to: string; condition: string }[]
  >(() => (isStateMachineNodeData(node.data) ? node.data.transitions : []));

  const handleFieldChange = (field: string, value: unknown) => {
    onChange({ ...node, data: { ...node.data, [field]: value } });
  };

  return (
    <div className="flex flex-col gap-4">
      <PanelSection title="States" description="Define all possible states for this state machine.">
        <div className="flex flex-col gap-1">
          {states.map((state, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Input
                value={state}
                onChange={(e) => {
                  const next = [...states];
                  next[idx] = e.target.value;
                  setStates(next);
                  handleFieldChange("states", next);
                }}
                className="w-32"
              />
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  const next = states.filter((_, i) => i !== idx);
                  setStates(next);
                  handleFieldChange("states", next);
                }}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            size="sm"
            onClick={() => {
              const next = [...states, "newState"];
              setStates(next);
              handleFieldChange("states", next);
            }}
          >
            Add State
          </Button>
        </div>
      </PanelSection>
      <PanelSection title="Initial State" description="Set the starting state for this machine.">
        <Input
          value={initialState}
          onChange={(e) => {
            setInitialState(e.target.value);
            handleFieldChange("initialState", e.target.value);
          }}
          className="w-32"
        />
      </PanelSection>
      <PanelSection title="Transitions" description="Define allowed transitions between states and their conditions.">
        <div className="flex flex-col gap-1">
          {transitions.map((tr, idx) => (
            <div key={idx} className="flex items-center gap-2">
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
          ))}
          <Button
            size="sm"
            variant="destructive"
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
