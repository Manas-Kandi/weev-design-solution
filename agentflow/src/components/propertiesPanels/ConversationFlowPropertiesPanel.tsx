import React, { useState } from "react";
import { vsCodePropertiesTheme as theme } from "./propertiesPanelTheme";
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
}) => {
  const inputStyle: React.CSSProperties = {
    width: 90,
    background: theme.colors.backgroundTertiary,
    color: theme.colors.textPrimary,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.inputPadding,
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.fontSize.base,
    marginRight: theme.spacing.sm,
  };
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.sm,
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
        style={inputStyle}
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
        style={inputStyle}
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
        style={{ ...inputStyle, width: 120 }}
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

  const handleFieldChange = (field: string, value: unknown) => {
    onChange({ ...node, data: { ...node.data, [field]: value } });
  };

  // Compose panel style from theme
  const panelStyle: React.CSSProperties = {
    background: theme.colors.background,
    borderLeft: `1px solid ${theme.colors.border}`,
    padding: theme.spacing.sectionPadding,
    borderRadius: theme.borderRadius.lg,
    minHeight: 0,
    height: "100%",
    width: 360,
    minWidth: 360,
    maxWidth: 360,
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing.fieldGap,
    boxSizing: "border-box",
    overflowY: "auto",
  };

  return (
    <div style={panelStyle}>
      <PanelSection
        title="States"
        description="Comma-separated list of all possible states."
      >
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
      <PanelSection
        title="Initial State"
        description="The starting state for the conversation flow."
      >
        <Input
          value={initialState}
          onChange={(e) => {
            setInitialState(e.target.value);
            handleFieldChange("initialState", e.target.value);
          }}
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
      <PanelSection
        title="Persistence"
        description="Optionally persist the state across executions."
      >
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
