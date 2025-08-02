// Compact Properties Panel Component - Fixed width, no horizontal scroll
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

// Define a type for property panel components
type PropertyPanelComponent = React.ComponentType<{
  node: CanvasNode;
  onChange: (updatedNode: CanvasNode) => void;
}>;

export default function CompactPropertiesPanel({
  selectedNode,
  onChange,
}: PropertiesPanelProps) {
  // Panel container style - fixed width, no horizontal scroll
  const panelStyle: React.CSSProperties = {
    width: "280px",
    minWidth: "260px",
    maxWidth: "300px",
    // Offset the panel from the top toolbar and account for its height
    height: "calc(100% - var(--toolbar-height))",
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    background: "#23272e",
    borderLeft: "1px solid #252525",
    padding: 0,
    overflowY: "auto",
    overflowX: "hidden", // Prevent horizontal scroll
    fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
    fontSize: "13px",
    color: "#cccccc",
    position: "fixed", // Make it feel truly fixed
    right: 0,
    top: "var(--toolbar-height)",
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
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              backgroundColor: "#2d2d30",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "8px",
            }}
          >
            <Settings size={24} color="#6b7280" />
          </div>

          <div style={{ textAlign: "center" }}>
            <h3
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "#cccccc",
                margin: 0,
                marginBottom: "6px",
              }}
            >
              No Node Selected
            </h3>
            <p
              style={{
                fontSize: "11px",
                color: "#858585",
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
              padding: "12px",
              backgroundColor: "#2d2d30",
              borderRadius: "4px",
              border: "1px solid #3e3e42",
              maxWidth: "200px",
              width: "100%",
            }}
          >
            <h4
              style={{
                fontSize: "11px",
                fontWeight: 500,
                color: "#cccccc",
                margin: 0,
                marginBottom: "4px",
              }}
            >
              💡 Quick Tip
            </h4>
            <p
              style={{
                fontSize: "10px",
                color: "#858585",
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

  // Unknown node type fallback with compact styling
  const renderUnknownNodePanel = () => (
    <div style={panelStyle} className="figma-scrollbar">
      {/* Header */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #252525",
          backgroundColor: "#2d2d30",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          minHeight: "48px",
        }}
      >
        <div
          style={{
            backgroundColor: "#f59e0b",
            borderRadius: "4px",
            padding: "6px",
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
              fontSize: "13px",
              fontWeight: 600,
              color: "#cccccc",
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
              fontSize: "11px",
              color: "#858585",
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
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          flex: 1,
        }}
      >
        <div
          style={{
            backgroundColor: "#2d2d30",
            border: "1px solid #3e3e42",
            borderRadius: "4px",
            padding: "12px",
          }}
        >
          <h3
            style={{
              fontSize: "12px",
              fontWeight: 500,
              color: "#cccccc",
              margin: 0,
              marginBottom: "8px",
            }}
          >
            Node Information
          </h3>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "10px",
              color: "#858585",
              lineHeight: 1.5,
            }}
          >
            <div>
              ID:{" "}
              <span style={{ color: "#00c4ff" }}>
                {selectedNode.id.slice(0, 8)}...
              </span>
            </div>
            <div>
              Type:{" "}
              <span style={{ color: "#00c4ff" }}>
                {selectedNode.type || "Unknown"}
              </span>
            </div>
            <div>
              Subtype:{" "}
              <span style={{ color: "#00c4ff" }}>
                {selectedNode.subtype || "None"}
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#2d2d30",
            border: "1px solid #f59e0b",
            borderRadius: "4px",
            padding: "12px",
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
            <Settings size={12} color="#f59e0b" />
            <h4
              style={{
                fontSize: "11px",
                fontWeight: 500,
                color: "#f59e0b",
                margin: 0,
              }}
            >
              Panel Not Available
            </h4>
          </div>
          <p
            style={{
              fontSize: "10px",
              color: "#858585",
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            Properties panel for this node type hasn&apos;t been implemented
            yet. The node will still work in workflows.
          </p>
        </div>
      </div>
    </div>
  );

  // Route to appropriate panel based on node type/subtype
  const renderNodePanel = () => {
    const nodeType = selectedNode.subtype || selectedNode.type;

    // Wrap existing panels with compact styling
    const wrapPanel = (PanelComponent: PropertyPanelComponent, nodeOverride?: CanvasNode) => (
      <div style={panelStyle} className="figma-scrollbar">
        <PanelComponent node={nodeOverride ?? selectedNode} onChange={onChange} />
      </div>
    );

    switch (nodeType) {
      case "agent":
      case "generic":
        return wrapPanel(
          AgentPropertiesPanel as unknown as PropertyPanelComponent,
          selectedNode as typeof selectedNode & { data: import("@/types").AgentNodeData }
        );

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
          return wrapPanel(
            ConversationFlowPropertiesPanel as unknown as PropertyPanelComponent,
            selectedNode as typeof selectedNode & { data: import("@/types").ConversationFlowNodeData }
          );
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
