// Enhanced Properties Panel Container with VS Code styling
import React, { useCallback } from "react";
import { FileQuestion, Settings } from "lucide-react";
import { CanvasNode } from "@/types";
import { figmaPropertiesTheme as theme } from "./propertiesPanelTheme";
import EnhancedAgentPropertiesPanel from "./AgentPropertiesPanel";
import { AgentNodeData } from "@/types";
import DecisionTreePropertiesPanel from "./DecisionTreePropertiesPanel";
import ToolAgentPropertiesPanel from "./ToolAgentPropertiesPanel";
import { ToolPropertiesPanel } from "./ToolPropertiesPanel";
import MessagePropertiesPanel from "./MessagePropertiesPanel";
import PromptTemplatePropertiesPanel from "./PromptTemplatePropertiesPanel";
import IfElsePropertiesPanel from "./IfElsePropertiesPanel";
import StateMachinePropertiesPanel from "./StateMachinePropertiesPanel";
import KnowledgeBasePropertiesPanel from "./KnowledgeBasePropertiesPanel";
import ConversationFlowPropertiesPanel from "./ConversationFlowPropertiesPanel";
import SimulatorPropertiesPanel from "./SimulatorPropertiesPanel";
import TestCasePropertiesPanel from "./TestCasePropertiesPanel";
import DashboardPropertiesPanel from "./DashboardPropertiesPanel";
import ChatInterfacePropertiesPanel from "./ChatInterfacePropertiesPanel";
import { MemoryPropertiesPanel } from "./MemoryPropertiesPanel";
import { RouterPropertiesPanel } from "./RouterPropertiesPanel";
import { MessageFormatterPropertiesPanel } from "./MessageFormatterPropertiesPanel";
import RuleBoxPropertiesPanel from "./RuleBoxPropertiesPanel";
import { ThinkingPropertiesPanel } from "./ThinkingPropertiesPanel";

interface PropertiesPanelProps {
  selectedNode: CanvasNode | null;
  onChange: (updatedNode: CanvasNode) => void;
}

const EnhancedPropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedNode,
  onChange,
}) => {
  // Panel container style
  const panelStyle: React.CSSProperties = {
    width: "340px", // fallback width
    minWidth: "260px",
    maxWidth: "420px",
    height: "100%",
    backgroundColor: theme.colors.background,
    borderLeft: `1px solid ${theme.colors.border}`,
    display: "flex",
    flexDirection: "column",
    fontFamily: "Inter, sans-serif",
    fontSize: "15px",
    color: "#f3f3f3",
  };

  // Empty state when no node is selected
  if (!selectedNode) {
    return (
      <div style={panelStyle}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            padding: "40px",
            textAlign: "center",
            gap: "24px",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              backgroundColor: theme.colors.backgroundSecondary,
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "12px",
            }}
          >
            <Settings size={32} color="#888" />
          </div>

          <div>
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
                color: "#b0b0b0",
                margin: 0,
                lineHeight: 1.6,
                maxWidth: "200px",
              }}
            >
              Select a node on the canvas to view and edit its properties.
            </p>
          </div>

          <div
            style={{
              marginTop: "32px",
              padding: "16px",
              backgroundColor: theme.colors.backgroundSecondary,
              borderRadius: "6px",
              border: `1px solid ${theme.colors.border}`,
              maxWidth: "240px",
            }}
          >
            <h4
              style={{
                fontSize: "14px",
                fontWeight: 500,
                color: "#f3f3f3",
                margin: 0,
                marginBottom: "8px",
              }}
            >
              💡 Quick Tip
            </h4>
            <p
              style={{
                fontSize: "12px",
                color: "#b0b0b0",
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              Right-click on any node to access quick actions like setting it as
              the start node or deleting it.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Unknown node type fallback
  const renderUnknownNodePanel = () => (
    <div style={panelStyle}>
      <div
        style={{
          padding: "20px",
          borderBottom: `1px solid ${theme.colors.border}`,
          backgroundColor: theme.colors.backgroundSecondary,
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <div
          style={{
            backgroundColor: "#eab308", // yellow-400
            borderRadius: "8px",
            padding: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <FileQuestion size={20} color="white" />
        </div>
        <div>
          <h2
            style={{
              fontSize: "18px",
              fontWeight: 600,
              color: "#f3f3f3",
              margin: 0,
            }}
          >
            Unknown Node Type
          </h2>
          <p
            style={{
              fontSize: "14px",
              color: "#b0b0b0",
              margin: 0,
            }}
          >
            {selectedNode.type || "Unknown"} •{" "}
            {selectedNode.subtype || "No subtype"}
          </p>
        </div>
      </div>

      <div
        style={{
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <div
          style={{
            backgroundColor: theme.colors.backgroundSecondary,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: "6px",
            padding: "16px",
          }}
        >
          <h3
            style={{
              fontSize: "15px",
              fontWeight: 500,
              color: "#f3f3f3",
              margin: 0,
              marginBottom: "8px",
            }}
          >
            Node Information
          </h3>
          <div
            style={{
              fontFamily: "Menlo, monospace",
              fontSize: "13px",
              color: "#b0b0b0",
              lineHeight: 1.6,
            }}
          >
            <div>
              ID: <span style={{ color: "#38bdf8" }}>{selectedNode.id}</span>
            </div>
            <div>
              Type:{" "}
              <span style={{ color: "#38bdf8" }}>
                {selectedNode.type || "Unknown"}
              </span>
            </div>
            <div>
              Subtype:{" "}
              <span style={{ color: "#38bdf8" }}>
                {selectedNode.subtype || "None"}
              </span>
            </div>
            <div>
              Position:{" "}
              <span style={{ color: "#38bdf8" }}>
                ({selectedNode.position?.x || 0},{" "}
                {selectedNode.position?.y || 0})
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: theme.colors.backgroundSecondary,
            border: `1px solid #eab308`,
            borderRadius: "6px",
            padding: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "8px",
            }}
          >
            <FileQuestion size={16} color="#eab308" />
            <h4
              style={{
                fontSize: "14px",
                fontWeight: 500,
                color: "#eab308",
                margin: 0,
              }}
            >
              Properties Panel Not Available
            </h4>
          </div>
          <p
            style={{
              fontSize: "12px",
              color: "#b0b0b0",
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            No properties panel has been implemented for this node type yet. The
            node will still function in workflows, but configuration options are
            limited.
          </p>
        </div>
      </div>
    </div>
  );

  // Route to appropriate panel based on node type/subtype
  const renderNodePanel = () => {
    const nodeType = selectedNode.subtype || selectedNode.type;

    // Type guard for AgentNodeData (matches actual AgentNodeData interface)
    function isAgentNodeData(data: unknown): data is AgentNodeData {
      return (
        typeof data === "object" &&
        data !== null &&
        typeof (data as AgentNodeData).title === "string" &&
        typeof (data as AgentNodeData).model === "string"
      );
    }

    switch (nodeType) {
      case "agent":
      case "generic":
        if (isAgentNodeData(selectedNode.data)) {
          return (
            <EnhancedAgentPropertiesPanel
              node={{ ...selectedNode, data: selectedNode.data }}
              onChange={onChange}
            />
          );
        }
        return renderUnknownNodePanel();

      case "tool-agent":
        return (
          <ToolAgentPropertiesPanel
            node={selectedNode as CanvasNode}
            onChange={onChange}
          />
        );

      case "tool":
        return (
          <ToolPropertiesPanel
            nodeData={selectedNode.data as any}
            onChange={useCallback((data) => onChange({ ...selectedNode, data: { ...selectedNode.data, ...data } }), [selectedNode, onChange])}
          />
        );

      case "message":
        return (
          <MessagePropertiesPanel
            node={selectedNode as CanvasNode}
            onChange={onChange}
          />
        );

      case "prompt-template":
      case "template":
        return (
          <PromptTemplatePropertiesPanel
            node={selectedNode as CanvasNode}
            onChange={onChange}
          />
        );

      case "if-else":
        return (
          <IfElsePropertiesPanel
            node={selectedNode as CanvasNode}
            onChange={onChange}
          />
        );

      case "decision-tree":
        return (
          <DecisionTreePropertiesPanel
            node={selectedNode as CanvasNode}
            onChange={onChange}
          />
        );

      case "state-machine":
        return (
          <StateMachinePropertiesPanel
            node={selectedNode as CanvasNode}
            onChange={onChange}
          />
        );

      case "knowledge-base":
        return (
          <KnowledgeBasePropertiesPanel
            node={selectedNode as CanvasNode}
            onChange={onChange}
          />
        );

      case "conversation-flow":
        return (
          <ConversationFlowPropertiesPanel
            node={selectedNode as CanvasNode}
            onChange={onChange}
          />
        );

      case "simulator":
        return (
          <SimulatorPropertiesPanel
            node={selectedNode as CanvasNode}
            onChange={onChange}
          />
        );

      case "test-case":
        return (
          <TestCasePropertiesPanel
            node={selectedNode as CanvasNode}
            onChange={onChange}
          />
        );

      case "dashboard":
        return (
          <DashboardPropertiesPanel
            node={selectedNode as CanvasNode}
            onChange={onChange}
          />
        );

      case "chat":
      case "ui":
        return (
          <ChatInterfacePropertiesPanel
            node={selectedNode as CanvasNode}
            onChange={onChange}
          />
        );

      case "memory":
        return (
          <MemoryPropertiesPanel
            nodeData={selectedNode.data as any}
            onChange={(data) => onChange({ ...selectedNode, data: { ...selectedNode.data, ...data } })}
          />
        );

      case "router":
        return (
          <RouterPropertiesPanel
            nodeData={selectedNode.data as any}
            onChange={(data) => onChange({ ...selectedNode, data: { ...selectedNode.data, ...data } })}
          />
        );

      case "message-formatter":
        return (
          <MessageFormatterPropertiesPanel
            nodeData={selectedNode.data as any}
            onChange={(data) => onChange({ ...selectedNode, data: { ...selectedNode.data, ...data } })}
          />
        );

      case "rule-box":
        return (
          <RuleBoxPropertiesPanel
            node={selectedNode as CanvasNode}
            onChange={onChange}
          />
        );

      case "thinking":
        return (
          <ThinkingPropertiesPanel
            nodeData={selectedNode.data as any}
            onChange={(data) => onChange({ ...selectedNode, data: { ...selectedNode.data, ...data } })}
          />
        );

      default:
        return renderUnknownNodePanel();
    }
  };

  return renderNodePanel();
};

export default EnhancedPropertiesPanel;
