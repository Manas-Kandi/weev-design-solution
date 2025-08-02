// Enhanced Properties Panel Container with VS Code styling
import React from "react";
import { FileQuestion, Settings } from "lucide-react";
import { CanvasNode } from "@/types";
import { figmaPropertiesTheme as theme } from "./propertiesPanelTheme";
import EnhancedAgentPropertiesPanel from "./AgentPropertiesPanel";
import { AgentNodeData } from "@/types";
import DecisionTreePropertiesPanel from "./DecisionTreePropertiesPanel";
// Import other enhanced panels as they're created
// import EnhancedMessagePropertiesPanel from "./EnhancedMessagePropertiesPanel";
// import EnhancedPromptTemplatePropertiesPanel from "./EnhancedPromptTemplatePropertiesPanel";
// etc.

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
    width: theme.components.panel.width,
    minWidth: theme.components.panel.minWidth,
    maxWidth: theme.components.panel.maxWidth,
    height: "100%",
    backgroundColor: theme.colors.background,
    borderLeft: `1px solid ${theme.colors.border}`,
    display: "flex",
    flexDirection: "column",
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textPrimary,
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
            padding: theme.spacing.xxl,
            textAlign: "center",
            gap: theme.spacing.lg,
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              backgroundColor: theme.colors.backgroundSecondary,
              borderRadius: theme.borderRadius.lg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: theme.spacing.md,
            }}
          >
            <Settings size={32} color={theme.colors.textMuted} />
          </div>

          <div>
            <h3
              style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.textPrimary,
                margin: 0,
                marginBottom: theme.spacing.sm,
              }}
            >
              No Node Selected
            </h3>
            <p
              style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.textSecondary,
                margin: 0,
                lineHeight: theme.typography.lineHeight.relaxed,
                maxWidth: "200px",
              }}
            >
              Select a node on the canvas to view and edit its properties.
            </p>
          </div>

          <div
            style={{
              marginTop: theme.spacing.xl,
              padding: theme.spacing.md,
              backgroundColor: theme.colors.backgroundSecondary,
              borderRadius: theme.borderRadius.sm,
              border: `1px solid ${theme.colors.border}`,
              maxWidth: "240px",
            }}
          >
            <h4
              style={{
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.textPrimary,
                margin: 0,
                marginBottom: theme.spacing.sm,
              }}
            >
              💡 Quick Tip
            </h4>
            <p
              style={{
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.textSecondary,
                margin: 0,
                lineHeight: theme.typography.lineHeight.normal,
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
          padding: theme.spacing.lg,
          borderBottom: `1px solid ${theme.colors.border}`,
          backgroundColor: theme.colors.backgroundSecondary,
          display: "flex",
          alignItems: "center",
          gap: theme.spacing.md,
        }}
      >
        <div
          style={{
            backgroundColor: theme.colors.warning,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.sm,
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
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.textPrimary,
              margin: 0,
            }}
          >
            Unknown Node Type
          </h2>
          <p
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.textSecondary,
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
          padding: theme.spacing.lg,
          display: "flex",
          flexDirection: "column",
          gap: theme.spacing.md,
        }}
      >
        <div
          style={{
            backgroundColor: theme.colors.backgroundSecondary,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.borderRadius.sm,
            padding: theme.spacing.md,
          }}
        >
          <h3
            style={{
              fontSize: theme.typography.fontSize.base,
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
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.textSecondary,
              lineHeight: theme.typography.lineHeight.relaxed,
            }}
          >
            <div>
              ID:{" "}
              <span style={{ color: theme.colors.textAccent }}>
                {selectedNode.id}
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
            <div>
              Position:{" "}
              <span style={{ color: theme.colors.textAccent }}>
                ({selectedNode.position?.x || 0},{" "}
                {selectedNode.position?.y || 0})
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: theme.colors.backgroundSecondary,
            border: `1px solid ${theme.colors.warning}`,
            borderRadius: theme.borderRadius.sm,
            padding: theme.spacing.md,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: theme.spacing.sm,
              marginBottom: theme.spacing.sm,
            }}
          >
            <FileQuestion size={16} color={theme.colors.warning} />
            <h4
              style={{
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.warning,
                margin: 0,
              }}
            >
              Properties Panel Not Available
            </h4>
          </div>
          <p
            style={{
              fontSize: theme.typography.fontSize.xs,
              color: theme.colors.textSecondary,
              margin: 0,
              lineHeight: theme.typography.lineHeight.normal,
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
        typeof (data as AgentNodeData).model === "string" &&
        typeof (data as AgentNodeData).description === "string" &&
        typeof (data as AgentNodeData).color === "string" &&
        typeof (data as AgentNodeData).icon === "string"
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
        // TODO: Implement EnhancedToolAgentPropertiesPanel
        return renderUnknownNodePanel();

      case "message":
        // TODO: Implement EnhancedMessagePropertiesPanel
        return renderUnknownNodePanel();

      case "prompt-template":
      case "template":
        // TODO: Implement EnhancedPromptTemplatePropertiesPanel
        return renderUnknownNodePanel();

      case "if-else":
        // TODO: Implement EnhancedIfElsePropertiesPanel
        return renderUnknownNodePanel();

      case "decision-tree":
        return (
          <DecisionTreePropertiesPanel
            node={selectedNode as CanvasNode}
            onChange={onChange}
          />
        );

      case "state-machine":
        // TODO: Implement EnhancedStateMachinePropertiesPanel
        return renderUnknownNodePanel();

      case "knowledge-base":
        // TODO: Implement EnhancedKnowledgeBasePropertiesPanel
        return renderUnknownNodePanel();

      case "conversation-flow":
        // TODO: Implement EnhancedConversationFlowPropertiesPanel
        return renderUnknownNodePanel();

      case "simulator":
        // TODO: Implement EnhancedSimulatorPropertiesPanel
        return renderUnknownNodePanel();

      case "test-case":
        // TODO: Implement EnhancedTestCasePropertiesPanel
        return renderUnknownNodePanel();

      case "dashboard":
        // TODO: Implement EnhancedDashboardPropertiesPanel
        return renderUnknownNodePanel();

      case "chat":
      case "ui":
        // TODO: Implement EnhancedChatInterfacePropertiesPanel
        return renderUnknownNodePanel();

      default:
        return renderUnknownNodePanel();
    }
  };

  return renderNodePanel();
};

export default EnhancedPropertiesPanel;
