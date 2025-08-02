// All UI rules for properties panels must come from propertiesPanelTheme.ts
import React, { useState } from "react";
import { propertiesPanelTheme as theme } from "./propertiesPanelTheme";
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

  // Theme-based container style
  const containerStyle: React.CSSProperties = {
    width: "360px",
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

  // Theme-based label style for checkbox
  const labelStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing.fieldGap,
    font: theme.font.label,
    color: theme.colors.label,
    margin: theme.spacing.labelMargin,
  };

  // Theme-based input style for checkbox
  const checkboxStyle: React.CSSProperties = {
    accentColor: theme.colors.accent,
    width: 18,
    height: 18,
  };

  // Theme-based input style for Input fields
  const inputStyle: React.CSSProperties = {
    background: theme.colors.inputBackground,
    color: theme.colors.inputText,
    borderRadius: theme.borderRadius.input,
    padding: theme.spacing.inputPadding,
    font: theme.font.input,
    border: `1px solid ${theme.colors.border}`,
    width: "100%",
    boxSizing: "border-box",
  };

  // Button style for destructive and primary
  const buttonDestructive: React.CSSProperties = {
    background: theme.colors.error,
    color: "#fff",
    borderRadius: theme.borderRadius.input,
    font: theme.font.input,
    padding: theme.spacing.inputPadding,
    border: "none",
    cursor: "pointer",
  };
  const buttonPrimary: React.CSSProperties = {
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
              <Input
                value={state}
                onChange={(e) => {
                  const next = [...states];
                  next[idx] = e.target.value;
                  setStates(next);
                  handleFieldChange("states", next);
                }}
                style={{ ...inputStyle, maxWidth: 160 }}
              />
              <Button
                size="sm"
                variant="destructive"
                style={buttonDestructive}
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
            style={buttonPrimary}
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
      <PanelSection
        title="Initial State"
        description="Set the starting state for this machine."
      >
        <Input
          value={initialState}
          onChange={(e) => {
            setInitialState(e.target.value);
            handleFieldChange("initialState", e.target.value);
          }}
          style={{ ...inputStyle, maxWidth: 160 }}
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
              <Input
                value={tr.from || ""}
                onChange={(e) => {
                  const next = [...transitions];
                  next[idx] = { ...next[idx], from: e.target.value };
                  setTransitions(next);
                  handleFieldChange("transitions", next);
                }}
                style={{ ...inputStyle, maxWidth: 100 }}
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
                style={{ ...inputStyle, maxWidth: 100 }}
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
                style={{ ...inputStyle, maxWidth: 160 }}
                placeholder="Condition"
              />
              <Button
                size="sm"
                variant="destructive"
                style={buttonDestructive}
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
            style={buttonPrimary}
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
      <PanelSection
        title="Persistence"
        description="Optionally persist the state across executions."
      >
        <label style={labelStyle}>
          <input
            type="checkbox"
            checked={persistState}
            style={checkboxStyle}
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
