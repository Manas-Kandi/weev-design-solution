"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Skeleton } from "@/components/primitives/skeleton";
import { figmaPropertiesTheme as theme } from "@/components/panels/propertiesPanelTheme";
import AgentPropertiesPanel from "@/components/panels/AgentPropertiesPanel";
import ChatInterfacePropertiesPanel from "@/components/panels/ChatInterfacePropertiesPanel";
import ConversationFlowPropertiesPanel from "@/components/panels/ConversationFlowPropertiesPanel";
import DashboardPropertiesPanel from "@/components/panels/DashboardPropertiesPanel";
import DecisionTreePropertiesPanel from "@/components/panels/DecisionTreePropertiesPanel";
import IfElsePropertiesPanel from "@/components/panels/IfElsePropertiesPanel";
import KnowledgeBasePropertiesPanel from "@/components/panels/KnowledgeBasePropertiesPanel";
import MessagePropertiesPanel from "@/components/panels/MessagePropertiesPanel";
import PromptTemplatePropertiesPanel from "@/components/panels/PromptTemplatePropertiesPanel";
import SimulatorPropertiesPanel from "@/components/panels/SimulatorPropertiesPanel";
import StateMachinePropertiesPanel from "@/components/panels/StateMachinePropertiesPanel";
import TestCasePropertiesPanel from "@/components/panels/TestCasePropertiesPanel";
import ToolAgentPropertiesPanel from "@/components/panels/ToolAgentPropertiesPanel";
import RuleBoxPropertiesPanel from "@/components/panels/RuleBoxPropertiesPanel";
import ContextControlsSection from "@/components/primitives/ContextControlsSection";
import EnhancedPropertiesPanel from "@/components/panels/EnhancedPropertiesPanel";
import { CanvasNode, Connection } from "@/types";

interface FloatingPropertiesPanelProps {
  selectedNode: CanvasNode | null;
  onNodeChange: (updatedNode: CanvasNode) => void;
  onConnectionsChange: (next: Connection[]) => void;
  onClose: () => void;
  isTestingPanelVisible?: boolean;
  compactMode?: boolean;
  isVerticalSplit?: boolean;
}

const getFloatingPanelStyle = (compactMode: boolean, isVerticalSplit: boolean = false): React.CSSProperties => ({
  position: isVerticalSplit ? "relative" : "fixed",
  right: isVerticalSplit ? undefined : 20,
  top: isVerticalSplit ? undefined : 20,
  bottom: compactMode && !isVerticalSplit ? undefined : isVerticalSplit ? undefined : 20,
  height: isVerticalSplit ? "100%" : compactMode ? "calc(50vh - 30px)" : undefined,
  width: isVerticalSplit ? "100%" : 360,
  background: "rgba(30, 30, 30, 0.65)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  borderRadius: 12,
  border: "1px solid rgba(255, 255, 255, 0.08)",
  fontFamily: theme.typography.fontFamily,
  fontSize: 15,
  color: theme.colors.textPrimary,
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
  zIndex: 1001,
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
});

export default function FloatingPropertiesPanel({
  selectedNode,
  onNodeChange,
  onConnectionsChange,
  onClose,
  isTestingPanelVisible = false,
  compactMode = false,
  isVerticalSplit = false,
}: FloatingPropertiesPanelProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (selectedNode) {
      setIsLoading(true);
      const t = setTimeout(() => setIsLoading(false), 300);
      return () => clearTimeout(t);
    }
  }, [selectedNode?.id]);

  // Don't render anything if no node is selected
  if (!selectedNode) {
    return null;
  }

  const nodeType = selectedNode.subtype || selectedNode.type;

  let content: React.ReactNode = null;

  if (isLoading) {
    content = (
      <div className="space-y-4 p-4">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  } else {
    switch (nodeType) {
      case "agent":
      case "generic":
      case "human-handoff":
        content = (
          <AgentPropertiesPanel
            node={selectedNode as any}
            onChange={onNodeChange}
          />
        );
        break;
      case "tool-agent":
        content = (
          <ToolAgentPropertiesPanel
            node={selectedNode as any}
            onChange={onNodeChange}
          />
        );
        break;
      case "message":
        content = (
          <MessagePropertiesPanel
            node={selectedNode}
            onChange={onNodeChange}
          />
        );
        break;
      case "template":
        content = (
          <PromptTemplatePropertiesPanel
            node={selectedNode}
            onChange={onNodeChange}
          />
        );
        break;
      case "if-else":
      case "complex-if-else":
        content = (
          <IfElsePropertiesPanel
            node={selectedNode}
            onChange={onNodeChange}
          />
        );
        break;
      case "knowledge-base":
        content = (
          <KnowledgeBasePropertiesPanel
            node={selectedNode}
            onChange={onNodeChange}
          />
        );
        break;
      case "decision-tree":
        content = (
          <DecisionTreePropertiesPanel
            node={selectedNode}
            onChange={onNodeChange}
          />
        );
        break;
      case "state-machine":
        content = (
          <StateMachinePropertiesPanel
            node={selectedNode}
            onChange={onNodeChange}
          />
        );
        break;
      case "simulator":
        content = (
          <SimulatorPropertiesPanel
            node={selectedNode}
            onChange={onNodeChange}
          />
        );
        break;
      case "test-case":
        content = (
          <TestCasePropertiesPanel
            node={selectedNode}
            onChange={onNodeChange}
          />
        );
        break;
      case "chat-interface":
        content = (
          <ChatInterfacePropertiesPanel
            node={selectedNode}
            onChange={onNodeChange}
          />
        );
        break;
      case "dashboard":
        content = (
          <DashboardPropertiesPanel
            node={selectedNode}
            onChange={onNodeChange}
          />
        );
        break;
      case "conversation-flow":
        content = (
          <ConversationFlowPropertiesPanel
            node={selectedNode as any}
            onChange={onNodeChange}
          />
        );
        break;
      case "rule-box":
        content = (
          <RuleBoxPropertiesPanel
            node={selectedNode}
            onChange={onNodeChange}
          />
        );
        break;
      default:
        content = (
          <EnhancedPropertiesPanel
            selectedNode={selectedNode}
            onChange={onNodeChange}
          />
        );
    }
  }

  return (
    <AnimatePresence>
      {selectedNode && (
        <motion.div
          style={getFloatingPanelStyle(compactMode)}
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 40, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {/* Header with close button */}
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h3
              style={{
                fontSize: 14,
                fontWeight: 600,
                margin: 0,
                color: theme.colors.textPrimary,
              }}
            >
              Properties
            </h3>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                padding: 4,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 4,
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "none";
              }}
            >
              <X size={16} color={theme.colors.textMuted} />
            </button>
          </div>

          {/* Content area with scroll */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              overflowX: "hidden",
            }}
          >
            {content}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
