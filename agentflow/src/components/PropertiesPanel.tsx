"use client";
import React from "react";
import { MousePointerClick } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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
import ToolAgentPropertiesPanel from "./propertiesPanels/ToolAgentPropertiesPanel";
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
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (selectedNode) {
      setIsLoading(true);
      const t = setTimeout(() => setIsLoading(false), 300);
      return () => clearTimeout(t);
    }
  }, [selectedNode?.id]);

  if (!selectedNode) {
    return (
      <div
        style={panelStyle}
        className="flex h-full items-center justify-center"
      >
        <div className="flex flex-col items-center text-center text-[#aaa]">
          <MousePointerClick className="mb-4 h-12 w-12 text-[#666]" />
          <span className="text-lg font-medium">No node selected</span>
          <div className="mt-2 text-sm">
            Select a node on the canvas to edit its properties.
          </div>
          <div className="mt-1 text-xs">Use the toolbar to add new nodes.</div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={panelStyle} className="space-y-4 p-4">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  const nodeType = selectedNode.subtype || selectedNode.type;

  let content: React.ReactNode = null;

  switch (nodeType) {
    case "agent":
    case "generic":
    case "human-handoff":
      content = (
        <AgentPropertiesPanel
          node={
            selectedNode as CanvasNode & {
              data: import("@/types").AgentNodeData;
            }
          }
          onChange={onChange}
        />
      );
      break;
    case "tool-agent":
      content = (
        <ToolAgentPropertiesPanel
          node={
            selectedNode as CanvasNode & {
              data: import("@/types").ToolAgentNodeData;
            }
          }
          onChange={onChange}
        />
      );
      break;
    case "chat":
      content = (
        <ChatInterfacePropertiesPanel node={selectedNode} onChange={onChange} />
      );
      break;
    case "conversation":
      content = (
        <ConversationFlowPropertiesPanel
          node={
            selectedNode as CanvasNode & {
              data: import("@/types").ConversationFlowNodeData;
            }
          }
          onChange={onChange}
        />
      );
      break;
    case "dashboard":
      content = (
        <DashboardPropertiesPanel node={selectedNode} onChange={onChange} />
      );
      break;
    case "decision-tree":
      content = (
        <DecisionTreePropertiesPanel node={selectedNode} onChange={onChange} />
      );
      break;
    case "if-else":
      content = (
        <IfElsePropertiesPanel node={selectedNode} onChange={onChange} />
      );
      break;
    case "knowledge-base":
      content = (
        <KnowledgeBasePropertiesPanel node={selectedNode} onChange={onChange} />
      );
      break;
    case "message":
      content = (
        <MessagePropertiesPanel node={selectedNode} onChange={onChange} />
      );
      break;
    case "template":
      content = (
        <PromptTemplatePropertiesPanel
          node={selectedNode}
          onChange={onChange}
        />
      );
      break;
    case "simulator":
      content = (
        <SimulatorPropertiesPanel node={selectedNode} onChange={onChange} />
      );
      break;
    case "state-machine":
      content = (
        <StateMachinePropertiesPanel node={selectedNode} onChange={onChange} />
      );
      break;
    case "test-case":
      content = (
        <TestCasePropertiesPanel node={selectedNode} onChange={onChange} />
      );
      break;
    default:
      content = (
        <div style={{ padding: "32px", textAlign: "center", color: "#aaa" }}>
          <span style={{ fontWeight: 500, fontSize: 18 }}>
            Unknown node type
          </span>
          <div style={{ marginTop: 8, fontSize: 14 }}>
            This node type is not yet supported.
          </div>
        </div>
      );
  }

  return <AnimatedPanel key={nodeType}>{content}</AnimatedPanel>;
}

function AnimatedPanel({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      style={panelStyle}
      className={`transition-all duration-300 ${
        visible ? "translate-x-0 opacity-100" : "translate-x-2 opacity-0"
      }`}
    >
      {children}
    </div>
  );
}
