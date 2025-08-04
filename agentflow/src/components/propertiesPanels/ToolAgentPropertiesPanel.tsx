// All UI rules for properties panels must come from propertiesPanelTheme.ts
import React from "react";
import { Wrench } from "lucide-react";
import { CanvasNode, ToolAgentNodeData } from "@/types";
import {
  figmaPropertiesTheme as theme,
  getPanelContainerStyle,
} from "./propertiesPanelTheme";
import { PanelSection } from "./PanelSection";
import { VSCodeInput, VSCodeSelect } from "./vsCodeFormComponents";

interface ToolAgentPropertiesPanelProps {
  node: CanvasNode & { data: ToolAgentNodeData };
  onChange: (node: CanvasNode & { data: ToolAgentNodeData }) => void;
}

export default function ToolAgentPropertiesPanel({
  node,
  onChange,
}: ToolAgentPropertiesPanelProps) {
  const data = node.data;
  const toolConfig = data.toolConfig || {};

  const handleConfigChange = (
    field: keyof NonNullable<ToolAgentNodeData["toolConfig"]>,
    value: unknown
  ) => {
    const updatedData: ToolAgentNodeData = {
      ...data,
      toolConfig: { ...toolConfig, [field]: value },
    };
    onChange({ ...node, data: updatedData });
  };

  const toolTypeOptions = [
    { value: "web-search", label: "Web Search" },
    { value: "calculator", label: "Calculator" },
    { value: "code-executor", label: "Code Executor" },
    { value: "file-operations", label: "File Operations" },
    { value: "database-query", label: "Database Query" },
    { value: "custom-api", label: "Custom API" },
  ];

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
          <Wrench size={20} color="white" />
        </div>
        <div>
          <h2 style={headerTitleStyle}>Tool Agent Configuration</h2>
          <p style={headerSubtitleStyle}>
            {toolConfig.toolType || "No tool selected"}
          </p>
        </div>
      </div>

      <div style={contentStyle}>
        <PanelSection
          title="Tool Settings"
          description="Configure tool integration"
          icon={<Wrench size={16} />}
        >
          <label style={labelStyle}>Tool Type</label>
          <VSCodeSelect
            value={toolConfig.toolType || "web-search"}
            options={toolTypeOptions}
            onValueChange={(value: string) =>
              handleConfigChange("toolType", value)
            }
          />

          <label style={labelStyle}>Endpoint</label>
          <VSCodeInput
            value={toolConfig.endpoint || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleConfigChange("endpoint", e.target.value)
            }
            placeholder="https://api.example.com"
          />

          <label style={labelStyle}>API Key</label>
          <VSCodeInput
            value={toolConfig.apiKey || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleConfigChange("apiKey", e.target.value)
            }
            placeholder="sk-..."
          />

          <label style={labelStyle}>Parameters (JSON)</label>
          <VSCodeInput
            value={
              toolConfig.parameters
                ? JSON.stringify(toolConfig.parameters)
                : ""
            }
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              try {
                const parsed = e.target.value
                  ? JSON.parse(e.target.value)
                  : {};
                handleConfigChange("parameters", parsed);
              } catch {
                handleConfigChange("parameters", {});
              }
            }}
            placeholder='{"key":"value"}'
          />
        </PanelSection>
      </div>
    </div>
  );
}

