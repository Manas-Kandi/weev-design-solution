// All UI rules for properties panels must come from propertiesPanelTheme.ts
"use client";
import React from "react";
import { Sparkles } from "lucide-react";
import { CanvasNode } from "@/types";
import { PanelSection } from "../primitives/PanelSection";
import {
  figmaPropertiesTheme as theme,
  getPanelContainerStyle,
} from "./propertiesPanelTheme";
import { VSCodeButton, VSCodeTextArea } from "../primitives/vsCodeFormComponents";

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

  const headerStyle: React.CSSProperties = {
    padding: theme.spacing.lg,
    borderBottom: `1px solid ${theme.colors.border}`,
    backgroundColor: theme.colors.backgroundSecondary,
    display: "flex",
    alignItems: "center",
    gap: theme.spacing.md,
  };

  const headerTitleStyle: React.CSSProperties = {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    margin: 0,
    lineHeight: theme.typography.lineHeight.tight,
    fontFamily: theme.typography.fontFamily,
  };

  const headerSubtitleStyle: React.CSSProperties = {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    margin: `${theme.spacing.xs} 0 0 0`,
    lineHeight: theme.typography.lineHeight.normal,
    fontFamily: theme.typography.fontFamily,
  };

  const contentStyle: React.CSSProperties = {
    padding: theme.spacing.lg,
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing.lg,
    flex: 1,
  };

  const labelStyle: React.CSSProperties = {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    marginBottom: theme.spacing.xs,
    fontFamily: theme.typography.fontFamily,
  };

  return (
    <div style={getPanelContainerStyle()}>
      <div style={headerStyle}>
        <div
          style={{
            backgroundColor: theme.colors.buttonPrimary,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.md,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Sparkles size={20} color="white" />
        </div>
        <div>
          <h2 style={headerTitleStyle}>{title}</h2>
          <p style={headerSubtitleStyle}>{subtitle}</p>
        </div>
      </div>

      <div style={contentStyle}>
        <PanelSection
          title="Behavior Rule"
          description="Type natural-language rules. We'll compile and apply them."
          icon={<Sparkles size={16} />}
        >
          <label style={labelStyle}>Rule</label>
          <VSCodeTextArea
            placeholder="e.g., Summarize inputs succinctly, ask clarifying questions if missing context, return JSON with keys: answer, citations"
            value={text}
            onChange={(e) => {
              const v = (e.target as HTMLTextAreaElement).value;
              setText(v);
              save({ nl: v });
            }}
            rows={8}
          />
          <div style={{ display: "flex", alignItems: "center", gap: theme.spacing.md }}>
            <VSCodeButton
              variant="secondary"
              size="small"
              onClick={() => {
                const summary = text.trim().slice(0, 120) || "(empty)";
                save({ compiled: { ...(rules.compiled || {}), summary } });
              }}
            >
              Compile Rules
            </VSCodeButton>
            {rules && rules.compiled && rules.compiled.summary && (
              <span style={{ fontSize: theme.typography.fontSize.xs, color: theme.colors.textMuted }}>
                {rules.compiled.summary}
              </span>
            )}
          </div>
        </PanelSection>
      </div>
    </div>
  );
}
