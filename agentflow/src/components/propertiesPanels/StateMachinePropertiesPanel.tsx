// All UI rules for properties panels must come from propertiesPanelTheme.ts
import React, { useState } from "react";
import { figmaPropertiesTheme as theme } from "./propertiesPanelTheme";
import { CanvasNode } from "@/types";
import PanelSection from "./PanelSection";
import { VSCodeInput, VSCodeButton } from "./vsCodeFormComponents";

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

  // Container style from theme helpers
  const containerStyle: React.CSSProperties = {
    width: "360px",
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

  return (
    <div style={containerStyle}>
      <PanelSection
        title="States"
        description="Define all possible states for this state machine."
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing.fieldGap,
          }}
        >
          {states.map((state, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: theme.spacing.fieldGap,
              }}
            >
              <VSCodeInput
                value={state}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const next = [...states];
                  next[idx] = e.target.value;
                  setStates(next);
                  handleFieldChange("states", next);
                }}
                style={{ maxWidth: 160 }}
              />
              <VSCodeButton
                variant="danger"
                size="small"
                onClick={() => {
                  const next = states.filter((_, i) => i !== idx);
                  setStates(next);
                  handleFieldChange("states", next);
                }}
              >
                Remove
              </VSCodeButton>
            </div>
          ))}
          <VSCodeButton
            size="small"
            onClick={() => {
              const next = [...states, "newState"];
              setStates(next);
              handleFieldChange("states", next);
            }}
          >
            Add State
          </VSCodeButton>
        </div>
      </PanelSection>
      <PanelSection
        title="Initial State"
        description="Set the starting state for this machine."
      >
        <VSCodeInput
          value={initialState}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setInitialState(e.target.value);
            handleFieldChange("initialState", e.target.value);
          }}
          style={{ maxWidth: 160 }}
        />
      </PanelSection>
      <PanelSection
        title="Transitions"
        description="Define allowed transitions between states and their conditions."
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing.fieldGap,
          }}
        >
          {transitions.map((tr, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: theme.spacing.fieldGap,
              }}
            >
              <VSCodeInput
                value={tr.from || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const next = [...transitions];
                  next[idx] = { ...next[idx], from: e.target.value };
                  setTransitions(next);
                  handleFieldChange("transitions", next);
                }}
                style={{ maxWidth: 100 }}
                placeholder="From"
              />
              <VSCodeInput
                value={tr.to || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const next = [...transitions];
                  next[idx] = { ...next[idx], to: e.target.value };
                  setTransitions(next);
                  handleFieldChange("transitions", next);
                }}
                style={{ maxWidth: 100 }}
                placeholder="To"
              />
              <VSCodeInput
                value={tr.condition || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const next = [...transitions];
                  next[idx] = { ...next[idx], condition: e.target.value };
                  setTransitions(next);
                  handleFieldChange("transitions", next);
                }}
                style={{ maxWidth: 160 }}
                placeholder="Condition"
              />
              <VSCodeButton
                variant="danger"
                size="small"
                onClick={() => {
                  const next = transitions.filter((_, i) => i !== idx);
                  setTransitions(next);
                  handleFieldChange("transitions", next);
                }}
              >
                Remove
              </VSCodeButton>
            </div>
          ))}
          <VSCodeButton
            size="small"
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
          </VSCodeButton>
        </div>
      </PanelSection>
      <PanelSection
        title="Persistence"
        description="Optionally persist the state across executions."
      >
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: theme.spacing.fieldGap,
            color: theme.colors.textSecondary,
            margin: theme.spacing.labelMargin,
          }}
        >
          <input
            type="checkbox"
            checked={persistState}
            style={{ width: 18, height: 18 }}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
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
