import React, { useState } from "react";
import { figmaPropertiesTheme as theme } from "./propertiesPanelTheme";
import { CanvasNode } from "@/types";
import { PanelSection } from "../primitives/PanelSection";
import { VSCodeInput, VSCodeButton } from "../primitives/vsCodeFormComponents";

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
  handleFieldChange: (
    field: string,
    value: unknown,
    setter: React.Dispatch<
      React.SetStateAction<{ from: string; to: string; condition: string }[]>
    >
  ) => void;
}

const TransitionInput: React.FC<TransitionInputProps> = ({
  tr,
  idx,
  transitions,
  setTransitions,
  handleFieldChange,
}) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: theme.spacing.xs,
        marginBottom: theme.spacing.xs,
      }}
    >
      <VSCodeInput
        value={tr.from || ""}
        onChange={(e) => {
          const next = [...transitions];
          next[idx] = { ...next[idx], from: e.target.value };
          handleFieldChange("transitions", next, setTransitions);
        }}
        placeholder="From"
        style={{ width: 90 }}
      />
      <VSCodeInput
        value={tr.to || ""}
        onChange={(e) => {
          const next = [...transitions];
          next[idx] = { ...next[idx], to: e.target.value };
          handleFieldChange("transitions", next, setTransitions);
        }}
        placeholder="To"
        style={{ width: 90 }}
      />
      <VSCodeInput
        value={tr.condition || ""}
        onChange={(e) => {
          const next = [...transitions];
          next[idx] = { ...next[idx], condition: e.target.value };
          handleFieldChange("transitions", next, setTransitions);
        }}
        placeholder="Condition"
        style={{ width: 120 }}
      />
      <VSCodeButton
        variant="danger"
        size="small"
        onClick={() => {
          const next = transitions.filter((_, i) => i !== idx);
          handleFieldChange("transitions", next, setTransitions);
        }}
        style={{ marginLeft: theme.spacing.xs }}
      >
        Remove
      </VSCodeButton>
    </div>
  );
};

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

  // Field-specific handlers to ensure correct setter types
  const handleStringFieldChange = (
    field: keyof ConversationFlowNodeData,
    value: string,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    setter(value);
    onChange({ ...node, data: { ...node.data, [field]: value } });
  };

  const handleBooleanFieldChange = (
    field: keyof ConversationFlowNodeData,
    value: boolean,
    setter: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    setter(value);
    onChange({ ...node, data: { ...node.data, [field]: value } });
  };

  const handleStringArrayFieldChange = (
    field: keyof ConversationFlowNodeData,
    value: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter(value);
    onChange({ ...node, data: { ...node.data, [field]: value } });
  };

  // No custom panelStyle: rely on theme and section/content styles only

  // Wrapper for transitions to match TransitionInput's expected signature
  const handleTransitionFieldChange = (
    field: string,
    value: unknown,
    setter: React.Dispatch<
      React.SetStateAction<{ from: string; to: string; condition: string }[]>
    >
  ) => {
    if (field === "transitions" && Array.isArray(value)) {
      // Only call the setter if the value is the correct type
      setter(value);
      onChange({ ...node, data: { ...node.data, [field]: value } });
    }
  };

  return (
    <div
      style={{
        padding: 0,
        margin: 0,
        background: theme.colors.background,
        height: "100%",
        overflowY: "auto",
      }}
    >
      <PanelSection
        title="States"
        description="Comma-separated list of all possible states."
      >
        <VSCodeInput
          value={states.join(", ")}
          onChange={(e) => {
            const arr = e.target.value
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
            handleStringArrayFieldChange("states", arr, setStates);
          }}
          placeholder="Comma separated states"
        />
      </PanelSection>
      <PanelSection
        title="Initial State"
        description="The starting state for the conversation flow."
      >
        <VSCodeInput
          value={initialState}
          onChange={(e) =>
            handleStringFieldChange(
              "initialState",
              e.target.value,
              setInitialState
            )
          }
          placeholder="Initial state"
        />
      </PanelSection>
      <PanelSection
        title="Transitions"
        description="Define transitions between states and their conditions."
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing.xs,
          }}
        >
          {transitions.map((tr, idx) => (
            <TransitionInput
              key={idx}
              tr={tr}
              idx={idx}
              transitions={transitions}
              setTransitions={setTransitions}
              handleFieldChange={handleTransitionFieldChange}
            />
          ))}
          <VSCodeButton
            variant="primary"
            size="small"
            onClick={() =>
              handleTransitionFieldChange(
                "transitions",
                [...transitions, { from: "", to: "", condition: "" }],
                setTransitions
              )
            }
            style={{ marginTop: theme.spacing.xs }}
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
          }}
        >
          <input
            type="checkbox"
            checked={persistState}
            onChange={(e) =>
              handleBooleanFieldChange(
                "persistState",
                e.target.checked,
                setPersistState
              )
            }
            style={{ accentColor: theme.colors.textAccent }}
          />
          <span>Persist State</span>
        </label>
      </PanelSection>
      {/* TODO: Add unit tests for this panel to ensure type safety and prevent regressions. */}
    </div>
  );
}
