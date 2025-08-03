"use client";
import React from "react";
import { figmaPropertiesTheme as theme } from "./propertiesPanels/propertiesPanelTheme";
import AgentPropertiesPanel from "./propertiesPanels/AgentPropertiesPanel";
import ChatInterfacePropertiesPanel from "./propertiesPanels/ChatInterfacePropertiesPanel";
import ConversationFlowPropertiesPanel from "./propertiesPanels/ConversationFlowPropertiesPanel";
import DashboardPropertiesPanel from "./propertiesPanels/DashboardPropertiesPanel";
import DecisionTreePropertiesPanel from "./propertiesPanels/DecisionTreePropertiesPanel";
import IfElsePropertiesPanel from "./propertiesPanels/IfElsePropertiesPanel";
import KnowledgeBasePropertiesPanel from "./propertiesPanels/KnowledgeBasePropertiesPanel";
import MessagePropertiesPanel from "./propertiesPanels/MessagePropertiesPanel";
import PromptTemplatePropertiesPanel from "./propertiesPanels/PromptTemplatePropertiesPanel";
import SimulatorPropertiesPanel from "./propertiesPanels/SimulatorPropertiesPanel";
import StateMachinePropertiesPanel from "./propertiesPanels/StateMachinePropertiesPanel";
import TestCasePropertiesPanel from "./propertiesPanels/TestCasePropertiesPanel";
import { CanvasNode } from "@/types";

interface PropertiesPanelProps {
  selectedNode: CanvasNode | null;
  onChange: (updatedNode: CanvasNode) => void;
}

const panelStyle: React.CSSProperties = {
  width: 320,
  minWidth: 260,
  height: "100%",
  background: "rgba(30,34,44,0.55)",
  backdropFilter: "blur(12px)",
  fontFamily: theme.typography.fontFamily,
  fontSize: 15,
  color: theme.colors.textPrimary,
  display: "flex",
  flexDirection: "column",
  overflowY: "auto",
  boxSizing: "border-box",
};

export default function PropertiesPanel({
  selectedNode,
  onChange,
}: PropertiesPanelProps) {
  if (!selectedNode) {
    return (
      <div style={panelStyle}>
        <div style={{ padding: "32px", textAlign: "center", color: "#aaa" }}>
          <span style={{ fontWeight: 500, fontSize: 18 }}>
            No node selected
          </span>
          <div style={{ marginTop: 8, fontSize: 14 }}>
            Select a node to edit its properties.
          </div>
        </div>
      </div>
    );
  }
  const nodeType = selectedNode.subtype || selectedNode.type;
  switch (nodeType) {
    case "agent":
    case "generic":
    case "human-handoff":
    case "tool-agent":
      return (
        <div style={panelStyle}>
          <AgentPropertiesPanel
            node={
              selectedNode as CanvasNode & {
                data: import("@/types").AgentNodeData;
              }
            }
            onChange={onChange}
          />
        </div>
      );
    case "chat":
      return (
        <div style={panelStyle}>
          <ChatInterfacePropertiesPanel
            node={selectedNode}
            onChange={onChange}
          />
        </div>
      );
    case "conversation":
      return (
        <div style={panelStyle}>
          <ConversationFlowPropertiesPanel
            node={
              selectedNode as CanvasNode & {
                data: import("@/types").ConversationFlowNodeData;
              }
            }
            onChange={onChange}
          />
        </div>
      );
    case "dashboard":
      return (
        <div style={panelStyle}>
          <DashboardPropertiesPanel node={selectedNode} onChange={onChange} />
        </div>
      );
    case "decision-tree":
      return (
        <div style={panelStyle}>
          <DecisionTreePropertiesPanel
            node={selectedNode}
            onChange={onChange}
          />
        </div>
      );
    case "if-else":
      return (
        <div style={panelStyle}>
          <IfElsePropertiesPanel node={selectedNode} onChange={onChange} />
        </div>
      );
    case "knowledge-base":
      return (
        <div style={panelStyle}>
          <KnowledgeBasePropertiesPanel
            node={selectedNode}
            onChange={onChange}
          />
        </div>
      );
    case "message":
      return (
        <div style={panelStyle}>
          <MessagePropertiesPanel node={selectedNode} onChange={onChange} />
        </div>
      );
    case "template":
      return (
        <div style={panelStyle}>
          <PromptTemplatePropertiesPanel
            node={selectedNode}
            onChange={onChange}
          />
        </div>
      );
    case "simulator":
      return (
        <div style={panelStyle}>
          <SimulatorPropertiesPanel node={selectedNode} onChange={onChange} />
        </div>
      );
    case "state-machine":
      return (
        <div style={panelStyle}>
          <StateMachinePropertiesPanel
            node={selectedNode}
            onChange={onChange}
          />
        </div>
      );
    case "test-case":
      return (
        <div style={panelStyle}>
          <TestCasePropertiesPanel node={selectedNode} onChange={onChange} />
        </div>
      );
    default:
      return (
        <div style={panelStyle}>
          <div style={{ padding: "32px", textAlign: "center", color: "#aaa" }}>
            <span style={{ fontWeight: 500, fontSize: 18 }}>
              Unknown node type
            </span>
            <div style={{ marginTop: 8, fontSize: 14 }}>
              This node type is not yet supported.
            </div>
          </div>
        </div>
      );
  }
}
