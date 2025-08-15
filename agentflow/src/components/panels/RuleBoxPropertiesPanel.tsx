// All UI rules for properties panels must come from propertiesPanelTheme.ts
"use client";
import React from "react";
import { Sparkles } from "lucide-react";
import { CanvasNode } from "@/types";
import { 
  PanelContainer, 
  PanelSection, 
  FormField, 
  TextArea 
} from "./shared/PropertiesPanelPrimitives";

interface RuleBoxPropertiesPanelProps {
  node: CanvasNode;
  onChange: (node: CanvasNode) => void;
  title?: string;
  subtitle?: string;
}

// Minimal structure we will read/write without using `any`
type RulesShape = {
  nl?: string;
  compiled?: { summary?: string; [k: string]: unknown } | undefined;
};

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

export default function RuleBoxPropertiesPanel({
  node,
  onChange,
  title = "Node Rules",
  subtitle = "Describe behavior in natural language. The engine compiles and applies these as configuration.",
}: RuleBoxPropertiesPanelProps) {
  const dataObj: Record<string, unknown> = isObject(node.data) ? (node.data as Record<string, unknown>) : {};
  const rules = (isObject(dataObj.rules) ? (dataObj.rules as RulesShape) : {}) as RulesShape;
  const [text, setText] = React.useState<string>(rules.nl ?? "");

  React.useEffect(() => {
    const latest = isObject(node.data) && isObject((node.data as Record<string, unknown>).rules)
      ? ((node.data as Record<string, unknown>).rules as RulesShape).nl ?? ""
      : "";
    setText(latest);
  }, [node.id]);

  const save = (next: Partial<RulesShape>) => {
    const prev: Record<string, unknown> = dataObj;
    const prevRules: RulesShape = (isObject(prev.rules) ? (prev.rules as RulesShape) : {}) as RulesShape;
    const newData: Record<string, unknown> = { ...prev, rules: { ...prevRules, ...next } };
    onChange({ ...node, data: newData } as CanvasNode);
  };

  return (
    <PanelContainer>
      <PanelSection 
        title={title}
        subtitle={subtitle}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <div
            style={{
              backgroundColor: "#5AA7FF",
              borderRadius: "12px",
              padding: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Sparkles size={16} color="white" />
          </div>
          <div style={{ fontSize: "13px", color: "#aaa" }}>
            Natural language rules are compiled into executable logic
          </div>
        </div>

        <FormField label="Rule">
          <TextArea
            placeholder="e.g., Summarize inputs succinctly, ask clarifying questions if missing context, return JSON with keys: answer, citations"
            value={text}
            onChange={(value) => {
              setText(value);
              save({ nl: value });
            }}
            rows={8}
          />
        </FormField>

        {rules && rules.compiled && rules.compiled.summary && (
          <div style={{ 
            fontSize: "11px", 
            color: "#888", 
            marginTop: "8px",
            padding: "8px 12px",
            backgroundColor: "rgba(255,255,255,0.03)",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.06)"
          }}>
            <strong>Compiled:</strong> {rules.compiled.summary}
          </div>
        )}
      </PanelSection>
    </PanelContainer>
  );
}
