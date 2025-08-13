// Simplified Tool Agent Properties Panel matching Agent panel style
import React, { useEffect, useState } from "react";
import { figmaPropertiesTheme as theme } from "./propertiesPanelTheme";
import { CanvasNode, ToolAgentNodeData } from "@/types";

interface ToolAgentPropertiesPanelProps {
  node: CanvasNode & { data: ToolAgentNodeData };
  onChange: (node: CanvasNode & { data: ToolAgentNodeData }) => void;
}

export default function ToolAgentPropertiesPanel({
  node,
  onChange,
}: ToolAgentPropertiesPanelProps) {
  const data = node.data;
  
  // Initialize behavior from existing data
  const [behavior, setBehavior] = useState<string>(
    data.rules?.nl || ""
  );
  
  // Update node data when behavior changes
  useEffect(() => {
    if (behavior !== data.rules?.nl) {
      const updatedData: ToolAgentNodeData = {
        ...data,
        rules: {
          nl: behavior,
          compiled: data.rules?.compiled,
        },
        // Preserve existing simulation settings
        simulation: data.simulation || {
          mode: "simulate",
          providerId: "calendar",
          operation: "findEvents",
          scenarioId: "busy-week",
          params: {},
          latencyMs: 120,
          injectError: null,
        },
      };
      onChange({ ...node, data: updatedData });
    }
  }, [behavior]);
  
  // Update local state if node changes externally
  useEffect(() => {
    if (data.rules?.nl !== behavior) {
      setBehavior(data.rules?.nl || "");
    }
  }, [node.id]);

  // Styles matching Agent panel exactly
  const containerStyle: React.CSSProperties = {
    padding: theme.spacing.lg,
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing.md,
    height: "100%",
  };
  
  const titleStyle: React.CSSProperties = {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    margin: 0,
    fontFamily: theme.typography.fontFamily,
  };
  
  const subtitleStyle: React.CSSProperties = {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
    margin: 0,
    fontFamily: theme.typography.fontFamily,
  };
  
  const textAreaStyle: React.CSSProperties = {
    width: "100%",
    minHeight: "120px",
    maxHeight: "250px",
    padding: theme.spacing.md,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.md,
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily,
    lineHeight: theme.typography.lineHeight.relaxed,
    resize: "vertical",
    outline: "none",
    transition: "border-color 0.2s, background-color 0.2s",
  };

  return (
    <div style={containerStyle}>
      {/* Title */}
      <h3 style={titleStyle}>Tool Behavior</h3>
      
      {/* Subtitle */}
      <p style={subtitleStyle}>
        Describe what you want this tool to do
      </p>
      
      {/* Main Behavior Text Area - Matching Agent Panel Style */}
      <textarea
        value={behavior}
        onChange={(e) => setBehavior(e.target.value)}
        placeholder="e.g., Search for recent emails about project updates, summarize the key points, and respond with actionable next steps."
        style={textAreaStyle}
        onFocus={(e) => {
          e.target.style.borderColor = theme.colors.buttonPrimary;
          e.target.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = theme.colors.border;
          e.target.style.backgroundColor = "rgba(255, 255, 255, 0.03)";
        }}
      />
    </div>
  );
}
