// Compact Properties Panel Component - Fixed width, no horizontal scroll, theme-driven
"use client";

import React from "react";
import { Settings } from "lucide-react";
import { CanvasNode } from "@/types";
import {
  isMessageNodeData,
  isPromptTemplateNodeData,
  isKnowledgeBaseNodeData,
  isIfElseNodeData,
  isDecisionTreeNodeData,
  isStateMachineNodeData,
  isConversationFlowNodeData,
  isSimulatorNodeData,
  isDashboardNodeData,
  isChatNodeData,
} from "@/utils/typeGuards";
import {
  figmaPropertiesTheme as theme,
  getPanelContainerStyle,
} from "./propertiesPanels/propertiesPanelTheme";
// Import your existing panels
import AgentPropertiesPanel from "./propertiesPanels/AgentPropertiesPanel";
import MessagePropertiesPanel from "./propertiesPanels/MessagePropertiesPanel";
import PromptTemplatePropertiesPanel from "./propertiesPanels/PromptTemplatePropertiesPanel";
import KnowledgeBasePropertiesPanel from "./propertiesPanels/KnowledgeBasePropertiesPanel";
import IfElsePropertiesPanel from "./propertiesPanels/IfElsePropertiesPanel";
import DecisionTreePropertiesPanel from "./propertiesPanels/DecisionTreePropertiesPanel";
import StateMachinePropertiesPanel from "./propertiesPanels/StateMachinePropertiesPanel";
import ConversationFlowPropertiesPanel from "./propertiesPanels/ConversationFlowPropertiesPanel";
import SimulatorPropertiesPanel from "./propertiesPanels/SimulatorPropertiesPanel";
import DashboardPropertiesPanel from "./propertiesPanels/DashboardPropertiesPanel";
import ChatInterfacePropertiesPanel from "./propertiesPanels/ChatInterfacePropertiesPanel";
import ToolAgentPropertiesPanel from "./propertiesPanels/ToolAgentPropertiesPanel";

interface PropertiesPanelProps {
  selectedNode: CanvasNode | null;
  onChange: (updatedNode: CanvasNode) => void;
}

export default function CompactPropertiesPanel({
  selectedNode,
  onChange,
}: PropertiesPanelProps) {
  // Consistent panel container style from theme
  const panelStyle = getPanelContainerStyle();

  // Empty state when no node is selected
  if (!selectedNode) {
    return (
      <div style={panelStyle} className="figma-scrollbar">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            padding: theme.spacing.xxl,
            textAlign: "center",
            gap: theme.spacing.lg,
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              backgroundColor: theme.colors.backgroundSecondary,
              borderRadius: theme.borderRadius.lg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: theme.spacing.md,
            }}
          >
            <Settings size={24} color={theme.colors.textMuted} />
          </div>
          <div>
            <h3
              style={{
                fontSize: theme.typography.fontSize.md,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.textPrimary,
                margin: `0 0 ${theme.spacing.sm} 0`,
              }}
            >
              No Selection
            </h3>
            <p
              style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.textSecondary,
                margin: 0,
                lineHeight: theme.typography.lineHeight.relaxed,
              }}
            >
              Select a node to view and edit its properties
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Unknown node type fallback with compact, theme-driven styling
  const renderUnknownNodePanel = () => (
    <div style={panelStyle} className="figma-scrollbar">
      {/* Header */}
      <div
        style={{
          padding: `${theme.spacing.lg} ${theme.spacing.xxl}`,
          borderBottom: `1px solid ${theme.colors.border}`,
          backgroundColor: theme.colors.backgroundSecondary,
          display: "flex",
          alignItems: "center",
          gap: theme.spacing.md,
          minHeight: theme.components.section.headerHeight,
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            backgroundColor: theme.colors.backgroundTertiary,
            borderRadius: theme.borderRadius.sm,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <Settings size={16} color={theme.colors.textSecondary} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2
            style={{
              fontSize: theme.typography.fontSize.base,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.textPrimary,
              margin: 0,
              lineHeight: theme.typography.lineHeight.tight,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            Unknown Node
          </h2>
          <p
            style={{
              fontSize: theme.typography.fontSize.xs,
              color: theme.colors.textSecondary,
              margin: `${theme.spacing.xs} 0 0 0`,
              lineHeight: theme.typography.lineHeight.normal,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {selectedNode.type || "Unknown"} •{" "}
            {selectedNode.subtype || "No subtype"}
          </p>
        </div>
      </div>
      {/* Content */}
      <div
        style={{
          padding: theme.spacing.xxl,
          display: "flex",
          flexDirection: "column",
          gap: theme.spacing.lg,
          flex: 1,
        }}
      >
        <div
          style={{
            backgroundColor: theme.colors.backgroundTertiary,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.borderRadius.sm,
            padding: theme.spacing.lg,
          }}
        >
          <h3
            style={{
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
              color: theme.colors.textPrimary,
              margin: 0,
              marginBottom: theme.spacing.sm,
            }}
          >
            Node Information
          </h3>
          <div
            style={{
              fontFamily: theme.typography.fontMono,
              fontSize: theme.typography.fontSize.xs,
              color: theme.colors.textAccent,
              lineHeight: theme.typography.lineHeight.normal,
            }}
          >
            <div>
              ID:{" "}
              <span style={{ color: theme.colors.textAccent }}>
                {selectedNode.id.slice(0, 8)}...
              </span>
            </div>
            <div>
              Type:{" "}
              <span style={{ color: theme.colors.textAccent }}>
                {selectedNode.type || "Unknown"}
              </span>
            </div>
            <div>
              Subtype:{" "}
              <span style={{ color: theme.colors.textAccent }}>
                {selectedNode.subtype || "None"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Route to appropriate panel based on node type/subtype
  const renderNodePanel = () => {
    const nodeType = selectedNode.subtype || selectedNode.type;
    // Wrap existing panels with compact styling
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wrapPanel = (PanelComponent: React.ComponentType<any>) => (
      <div style={panelStyle} className="figma-scrollbar">
        {/* Ensure PanelComponent is rendered as a React component */}
        <PanelComponent node={selectedNode} onChange={onChange} />
      </div>
    );
    switch (nodeType) {
      case "agent":
      case "generic":
        return wrapPanel(AgentPropertiesPanel);
      case "tool-agent":
        return wrapPanel(ToolAgentPropertiesPanel);
      case "message":
        if (isMessageNodeData(selectedNode.data)) {
          return wrapPanel(MessagePropertiesPanel);
        }
        return renderUnknownNodePanel();
      case "prompt-template":
      case "template":
        if (isPromptTemplateNodeData(selectedNode.data)) {
          return wrapPanel(PromptTemplatePropertiesPanel);
        }
        return renderUnknownNodePanel();
      case "if-else":
        if (isIfElseNodeData(selectedNode.data)) {
          // Ensure IfElsePropertiesPanel is a React component that returns JSX
          return wrapPanel(IfElsePropertiesPanel);
        }
        return renderUnknownNodePanel();
      case "decision-tree":
        if (isDecisionTreeNodeData(selectedNode.data)) {
          return wrapPanel(DecisionTreePropertiesPanel);
        }
        return renderUnknownNodePanel();
      case "state-machine":
        if (isStateMachineNodeData(selectedNode.data)) {
          return wrapPanel(StateMachinePropertiesPanel);
        }
        return renderUnknownNodePanel();
      case "knowledge-base":
        if (isKnowledgeBaseNodeData(selectedNode.data)) {
          return wrapPanel(KnowledgeBasePropertiesPanel);
        }
        return renderUnknownNodePanel();
      case "conversation-flow":
        if (isConversationFlowNodeData(selectedNode.data)) {
          return wrapPanel(ConversationFlowPropertiesPanel);
        }
        return renderUnknownNodePanel();
      case "simulator":
        if (isSimulatorNodeData(selectedNode.data)) {
          return wrapPanel(SimulatorPropertiesPanel);
        }
        return renderUnknownNodePanel();
      case "dashboard":
        if (isDashboardNodeData(selectedNode.data)) {
          return wrapPanel(DashboardPropertiesPanel);
        }
        return renderUnknownNodePanel();
      case "chat":
      case "ui":
        if (isChatNodeData(selectedNode.data)) {
          return wrapPanel(ChatInterfacePropertiesPanel);
        }
        return renderUnknownNodePanel();
      default:
        return renderUnknownNodePanel();
    }
  };
  return renderNodePanel();
}
