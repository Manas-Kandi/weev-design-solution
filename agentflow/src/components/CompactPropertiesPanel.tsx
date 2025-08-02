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
import { figmaPropertiesTheme as theme } from "./propertiesPanels/propertiesPanelTheme"; // Import theme
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
import TestCasePropertiesPanel from "./propertiesPanels/TestCasePropertiesPanel";

interface PropertiesPanelProps {
  selectedNode: CanvasNode | null;
  onChange: (updatedNode: CanvasNode) => void;
}

export default function CompactPropertiesPanel({
  selectedNode,
  onChange,
}: PropertiesPanelProps) {
  // Panel container style - fixed width, no horizontal scroll, theme-driven
  const panelStyle: React.CSSProperties = {
    width: theme.components.panel.width,
    minWidth: theme.components.panel.minWidth,
    maxWidth: theme.components.panel.maxWidth,
    height: "100%",
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    background: theme.colors.background,
    borderLeft: `1px solid ${theme.colors.border}`,
    padding: 0,
    overflowY: "auto",
    overflowX: "hidden",
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textPrimary,
    position: "fixed",
    right: 0,
    top: 0,
    zIndex: 100,
    boxSizing: "border-box",
  };

  // Empty state when no node is selected
  if (!selectedNode) {
    return (
      <div style={panelStyle}>
        <div
          style={{
            padding: "24px 16px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            gap: theme.spacing.fieldGap,
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              backgroundColor: theme.colors.backgroundTertiary,
              borderRadius: theme.borderRadius.lg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: theme.spacing.sm,
            }}
          >
            <Settings size={24} color={theme.colors.textMuted} />
          </div>
          <div style={{ textAlign: "center" }}>
            <h3
              style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.textPrimary,
                margin: 0,
                marginBottom: theme.spacing.xs,
              }}
            >
              No Node Selected
            </h3>
            <p
              style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.textMuted,
                margin: 0,
                lineHeight: 1.4,
                maxWidth: "180px",
              }}
            >
              Select a node on the canvas to view and edit its properties.
            </p>
          </div>
          <div
            style={{
              marginTop: theme.spacing.md,
              padding: theme.spacing.md,
              backgroundColor: theme.colors.backgroundTertiary,
              borderRadius: theme.borderRadius.md,
              border: `1px solid ${theme.colors.border}`,
              maxWidth: "200px",
              width: "100%",
            }}
          >
            <h4
              style={{
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.textPrimary,
                margin: 0,
                marginBottom: theme.spacing.xs,
              }}
            >
              💡 Quick Tip
            </h4>
            <p
              style={{
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.textMuted,
                margin: 0,
                lineHeight: 1.3,
              }}
            >
              Right-click any node for quick actions like setting as start node.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Unknown node type fallback with compact, theme-driven styling
  const renderUnknownNodePanel = () => (
    <div style={panelStyle}>
      {/* Header */}
      <div
        style={{
          padding: `${theme.spacing.md} ${theme.spacing.lg}`,
          borderBottom: `1px solid ${theme.colors.border}`,
          backgroundColor: theme.colors.backgroundTertiary,
          display: "flex",
          alignItems: "center",
          gap: theme.spacing.sm,
          minHeight: "48px",
        }}
      >
        <div
          style={{
            backgroundColor: theme.colors.warning,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.xs,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Settings size={16} color="white" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2
            style={{
              fontSize: theme.typography.fontSize.base,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.textPrimary,
              margin: 0,
              lineHeight: 1.2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            Unknown Node
          </h2>
          <p
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.textMuted,
              margin: 0,
              lineHeight: 1.2,
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
          padding: theme.spacing.lg,
          display: "flex",
          flexDirection: "column",
          gap: theme.spacing.md,
          flex: 1,
        }}
      >
        <div
          style={{
            backgroundColor: theme.colors.backgroundTertiary,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.md,
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
              color: theme.colors.textMuted,
              lineHeight: 1.5,
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
        <div
          style={{
            backgroundColor: theme.colors.backgroundTertiary,
            border: `1px solid ${theme.colors.warning}`,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.md,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: theme.spacing.xs,
              marginBottom: theme.spacing.xs,
            }}
          >
            <Settings size={12} color={theme.colors.warning} />
            <h4
              style={{
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.warning,
                margin: 0,
              }}
            >
              Panel Not Available
            </h4>
          </div>
          <p
            style={{
              fontSize: theme.typography.fontSize.xs,
              color: theme.colors.textMuted,
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            Properties panel for this node type hasn't been implemented yet. The
            node will still work in workflows.
          </p>
        </div>
      </div>
    </div>
  );

  // Route to appropriate panel based on node type/subtype
  const renderNodePanel = () => {
    const nodeType = selectedNode.subtype || selectedNode.type;
    // Wrap existing panels with compact styling
    const wrapPanel = (PanelComponent: React.ComponentType<any>) => (
      <div style={panelStyle}>
        <PanelComponent node={selectedNode} onChange={onChange} />
      </div>
    );
    switch (nodeType) {
      case "agent":
      case "generic":
        return wrapPanel(AgentPropertiesPanel);
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
