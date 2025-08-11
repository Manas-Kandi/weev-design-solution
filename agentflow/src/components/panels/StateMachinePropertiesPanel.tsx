// All UI rules for properties panels must come from propertiesPanelTheme.ts
import React, { useState } from "react";
import { figmaPropertiesTheme as theme } from "./propertiesPanelTheme";
import { CanvasNode } from "@/types";
import { PanelSection } from "../primitives/PanelSection";
import { VSCodeInput, VSCodeButton } from "../primitives/vsCodeFormComponents";

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

  // Field-specific handlers to ensure correct setter types
  const handleStringFieldChange = (
    field: string,
    value: string,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    setter(value);
    onChange({ ...node, data: { ...node.data, [field]: value } });
  };

  const handleBooleanFieldChange = (
    field: string,
    value: boolean,
    setter: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    setter(value);
    onChange({ ...node, data: { ...node.data, [field]: value } });
  };

  const handleStringArrayFieldChange = (
    field: string,
    value: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter(value);
    onChange({ ...node, data: { ...node.data, [field]: value } });
  };

  const handleTransitionArrayFieldChange = (
    field: string,
    value: { from: string; to: string; condition: string }[],
    setter: React.Dispatch<
      React.SetStateAction<{ from: string; to: string; condition: string }[]>
    >
  ) => {
    setter(value);
    onChange({ ...node, data: { ...node.data, [field]: value } });
  };

  // Container style from theme helpers
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
            gap: theme.spacing.lg,
          }}
        >
          {states.map((state, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: theme.spacing.lg,
              }}
            >
              <VSCodeInput
                value={state}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const next = [...states];
                  next[idx] = e.target.value;
                  handleStringArrayFieldChange("states", next, setStates);
                }}
                style={{ maxWidth: 160 }}
              />
              <VSCodeButton
                variant="danger"
                size="small"
                onClick={() => {
                  const next = states.filter((_, i) => i !== idx);
                  handleStringArrayFieldChange("states", next, setStates);
                }}
              >
                Remove
              </VSCodeButton>
            </div>
          ))}
          <VSCodeButton
            size="small"
            onClick={() =>
              handleStringArrayFieldChange(
                "states",
                [...states, "newState"],
                setStates
              )
            }
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
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleStringFieldChange(
              "initialState",
              e.target.value,
              setInitialState
            )
          }
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
            gap: theme.spacing.lg,
          }}
        >
          {transitions.map((tr, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: theme.spacing.lg,
              }}
            >
              <VSCodeInput
                value={tr.from || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const next = [...transitions];
                  next[idx] = { ...next[idx], from: e.target.value };
                  handleTransitionArrayFieldChange(
                    "transitions",
                    next,
                    setTransitions
                  );
                }}
                style={{ maxWidth: 100 }}
                placeholder="From"
              />
              <VSCodeInput
                value={tr.to || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const next = [...transitions];
                  next[idx] = { ...next[idx], to: e.target.value };
                  handleTransitionArrayFieldChange(
                    "transitions",
                    next,
                    setTransitions
                  );
                }}
                style={{ maxWidth: 100 }}
                placeholder="To"
              />
              <VSCodeInput
                value={tr.condition || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const next = [...transitions];
                  next[idx] = { ...next[idx], condition: e.target.value };
                  handleTransitionArrayFieldChange(
                    "transitions",
                    next,
                    setTransitions
                  );
                }}
                style={{ maxWidth: 160 }}
                placeholder="Condition"
              />
              <VSCodeButton
                variant="danger"
                size="small"
                onClick={() => {
                  const next = transitions.filter((_, i) => i !== idx);
                  handleTransitionArrayFieldChange(
                    "transitions",
                    next,
                    setTransitions
                  );
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
              handleTransitionArrayFieldChange(
                "transitions",
                next,
                setTransitions
              );
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
            gap: theme.spacing.xs,
            color: theme.colors.textMuted,
            margin: `${theme.spacing.xs} 0`,
            fontFamily: theme.typography.fontFamily,
            fontSize: theme.typography.fontSize.base,
          }}
        >
          <input
            type="checkbox"
            checked={persistState}
            style={{
              width: 18,
              height: 18,
              accentColor: theme.colors.info,
              borderRadius: theme.borderRadius.md,
              border: `1px solid ${theme.colors.border}`,
            }}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setPersistState(e.target.checked);
              handleBooleanFieldChange(
                "persistState",
                e.target.checked,
                setPersistState
              );
            }}
          />
          <span>Persist State</span>
        </label>
      </PanelSection>
      {/* TODO: Add unit tests for this panel to ensure type safety and prevent regressions. */}
    </div>
  );
}
