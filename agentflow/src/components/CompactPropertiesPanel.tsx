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
    width: "340px",
    minWidth: "260px",
    maxWidth: "420px",
    height: "100%",
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    background: theme.colors.background,
    borderLeft: `1px solid ${theme.colors.border}`,
    padding: 0,
    overflowY: "auto",
    overflowX: "hidden",
    fontFamily: 'Inter, sans-serif',
    fontSize: "15px",
    color: "#f3f3f3",
    position: "fixed",
    right: 0,
    top: 0,
    zIndex: 100,
    boxSizing: "border-box",
  };

  // Empty state when no node is selected
  if (!selectedNode) {
    return (
      <div style={panelStyle} className="figma-scrollbar">
        <div
          style={{
            padding: "24px 16px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            gap: "20px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              backgroundColor: theme.colors.backgroundTertiary,
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "12px",
            }}
          >
            <Settings size={24} color="#888" />
          </div>
          <div style={{ textAlign: "center" }}>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: 600,
                color: "#f3f3f3",
                margin: 0,
                marginBottom: "8px",
              }}
            >
              No Node Selected
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: "#888",
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
              marginTop: "16px",
              padding: "16px",
              backgroundColor: theme.colors.backgroundTertiary,
              borderRadius: "8px",
              border: `1px solid ${theme.colors.border}`,
              maxWidth: "200px",
              width: "100%",
            }}
          >
            <h4
              style={{
                fontSize: "14px",
                fontWeight: 500,
                color: "#f3f3f3",
                margin: 0,
                marginBottom: "6px",
              }}
            >
              💡 Quick Tip
            </h4>
            <p
              style={{
                fontSize: "12px",
                color: "#888",
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
    <div style={panelStyle} className="figma-scrollbar">
      {/* Header */}
      <div
        style={{
          padding: "16px 24px",
          borderBottom: `1px solid ${theme.colors.border}`,
          backgroundColor: theme.colors.backgroundTertiary,
          display: "flex",
          alignItems: "center",
          gap: "12px",
          minHeight: "48px",
        }}
      >
        <div
          style={{
            backgroundColor: "#a97c1a",
            borderRadius: "8px",
            padding: "6px 10px",
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
              fontSize: "15px",
              fontWeight: 600,
              color: "#f3f3f3",
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
              fontSize: "14px",
              color: "#888",
              margin: 0,
              lineHeight: 1.2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {selectedNode.type || "Unknown"} • {selectedNode.subtype || "No subtype"}
          </p>
        </div>
      </div>
      {/* Content */}
      <div
        style={{
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          flex: 1,
        }}
      >
        <div
          style={{
            backgroundColor: theme.colors.backgroundTertiary,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: "8px",
            padding: "16px",
          }}
        >
          <h3
            style={{
              fontSize: "14px",
              fontWeight: 500,
              color: "#f3f3f3",
              margin: 0,
              marginBottom: "10px",
            }}
          >
            Node Information
          </h3>
          <div
            style={{
              fontFamily: 'Menlo, monospace',
              fontSize: "12px",
              color: "#888",
              lineHeight: 1.5,
            }}
          >
            <div>
              ID: <span style={{ color: "#6cb6ff" }}>{selectedNode.id.slice(0, 8)}...</span>
            </div>
            <div>
              Type: <span style={{ color: "#6cb6ff" }}>{selectedNode.type || "Unknown"}</span>
            </div>
            <div>
              Subtype: <span style={{ color: "#6cb6ff" }}>{selectedNode.subtype || "None"}</span>
            </div>
          </div>
        </div>
        <div
          style={{
            backgroundColor: theme.colors.backgroundTertiary,
            border: "1px solid #a97c1a",
            borderRadius: "8px",
            padding: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "6px",
            }}
          >
            <Settings size={12} color="#a97c1a" />
            <h4
              style={{
                fontSize: "14px",
                fontWeight: 500,
                color: "#a97c1a",
                margin: 0,
              }}
            >
              Panel Not Available
            </h4>
          </div>
          <p
            style={{
              fontSize: "12px",
              color: "#888",
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            Properties panel for this node type hasn&apos;t been implemented yet. The node will still work in workflows.
          </p>
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
