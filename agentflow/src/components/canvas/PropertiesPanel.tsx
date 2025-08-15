"use client";
import React from "react";
import { MousePointerClick } from "lucide-react";
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
import { ToolPropertiesPanel } from "@/components/panels/ToolPropertiesPanel";
import { ThinkingPropertiesPanel } from "@/components/panels/ThinkingPropertiesPanel";
import { MessageFormatterPropertiesPanel } from "@/components/panels/MessageFormatterPropertiesPanel";
import { RouterPropertiesPanel } from "@/components/panels/RouterPropertiesPanel";
import { MemoryPropertiesPanel } from "@/components/panels/MemoryPropertiesPanel";
import RuleBoxPropertiesPanel from "@/components/panels/RuleBoxPropertiesPanel";
import ContextControlsSection from "@/components/primitives/ContextControlsSection";
import EnhancedPropertiesPanel from "@/components/panels/EnhancedPropertiesPanel";
import { CanvasNode, Connection } from "@/types";

interface PropertiesPanelProps {
  selectedNode: CanvasNode | null;
  onChange: (updatedNode: CanvasNode) => void;
  nodes: CanvasNode[];
  connections: Connection[];
  onConnectionsChange: (next: Connection[]) => void;
}

const panelStyle: React.CSSProperties = {
  width: 320,
  minWidth: 260,
  height: "100%",
  // Liquid Glass surface
  background: "rgba(18,18,20,0.55)",
  backdropFilter: "blur(16px) saturate(120%)",
  WebkitBackdropFilter: "blur(16px) saturate(120%)",
  fontFamily: theme.typography.fontFamily,
  fontSize: 15,
  color: theme.colors.textPrimary,
  display: "flex",
  flexDirection: "column",
  // Concentric radius + rings + elevation
  borderRadius: 20,
  boxShadow:
    "inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px rgba(255,255,255,0.05), 0 10px 30px rgba(0,0,0,0.35)",
  boxSizing: "border-box",
};

export default function PropertiesPanel({
  selectedNode,
  onChange,
  nodes,
  connections,
  onConnectionsChange,
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
  let panelTitle: string = "Properties";

  switch (nodeType) {
    case "agent":
      case "generic":
      case "human-handoff":
      panelTitle = "Agent Rules";
      content = (
        <RuleBoxPropertiesPanel
          node={selectedNode}
          onChange={onChange}
          title="Agent Rules"
          subtitle="Type natural-language rules for this agent."
        />
      );
      break;
    case "tool-agent":
      panelTitle = "Agent Properties";
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
    case "thinking":
      panelTitle = "Thinking";
      content = (
        <ThinkingPropertiesPanel
          node={selectedNode}
          onNodeUpdate={(nodeId, updates) => {
            onChange({ ...selectedNode, ...updates });
          }}
        />
      );
      break;
    case "chat":
      panelTitle = "Chat Interface";
      content = (
        <ChatInterfacePropertiesPanel node={selectedNode} onChange={onChange} />
      );
      break;
    case "conversation":
      panelTitle = "Conversation Rules";
      content = (
        <RuleBoxPropertiesPanel
          node={selectedNode}
          onChange={onChange}
          title="Conversation Rules"
          subtitle="Define dialogue behavior in plain language."
        />
      );
      break;
    case "dashboard":
      panelTitle = "Dashboard";
      content = (
        <DashboardPropertiesPanel node={selectedNode} onChange={onChange} />
      );
      break;
    case "decision-tree":
      panelTitle = "Decision Rules";
      content = (
        <RuleBoxPropertiesPanel
          node={selectedNode}
          onChange={onChange}
          title="Decision Rules"
          subtitle="Describe branching logic succinctly."
        />
      );
      break;
    case "if-else":
      panelTitle = "Condition Rules";
      content = (
        <RuleBoxPropertiesPanel
          node={selectedNode}
          onChange={onChange}
          title="Condition Rules"
          subtitle="Write the condition in NL; engine enforces determinism."
        />
      );
      break;
    case "knowledge-base":
      panelTitle = "Knowledge Base";
      content = (
        <KnowledgeBasePropertiesPanel node={selectedNode} onChange={onChange} />
      );
      break;
    case "message":
      panelTitle = "Message Rules";
      content = (
        <RuleBoxPropertiesPanel
          node={selectedNode}
          onChange={onChange}
          title="Message Rules"
          subtitle="Describe how to format and route messages."
        />
      );
      break;
    case "message-formatter":
      panelTitle = "Message Formatter";
      content = (
        <MessageFormatterPropertiesPanel
          node={selectedNode}
          onChange={onChange}
        />
      );
      break;
    case "router":
      panelTitle = "Router";
      content = (
        <RouterPropertiesPanel
          nodeData={selectedNode.data as any}
          onChange={(data) => onChange({ ...selectedNode, data: { ...selectedNode.data, ...data } })}
        />
      );
      break;
    case "memory":
      panelTitle = "Memory";
      content = (
        <MemoryPropertiesPanel
          nodeData={selectedNode.data as any}
          onChange={(data) => onChange({ ...selectedNode, data: { ...selectedNode.data, ...data } })}
        />
      );
      break;
    case "tool":
      panelTitle = "Tool Configuration";
      content = (
        <ToolPropertiesPanel
          nodeData={selectedNode.data as any}
          onChange={(data) => onChange({ ...selectedNode, data: { ...selectedNode.data, ...data } })}
        />
      );
      break;
    case "template":
      panelTitle = "Template Rules";
      content = (
        <RuleBoxPropertiesPanel
          node={selectedNode}
          onChange={onChange}
          title="Template Rules"
          subtitle="Define prompt behavior and variables in NL."
        />
      );
      break;
    case "simulator":
      panelTitle = "Simulator";
      content = (
        <SimulatorPropertiesPanel node={selectedNode} onChange={onChange} />
      );
      break;
    case "state-machine":
      panelTitle = "State Rules";
      content = (
        <RuleBoxPropertiesPanel
          node={selectedNode}
          onChange={onChange}
          title="State Rules"
          subtitle="Describe states and transitions in NL."
        />
      );
      break;
    case "test-case":
      panelTitle = "Test Rules";
      content = (
        <RuleBoxPropertiesPanel
          node={selectedNode}
          onChange={onChange}
          title="Test Rules"
          subtitle="Define expected behavior and assertions in NL."
        />
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

  return (
    <AnimatedPanel key={nodeType} title={panelTitle}>
      <div className="properties-content flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {content}
        <ContextControlsSection
          node={selectedNode as CanvasNode}
          nodes={nodes}
          connections={connections}
          onConnectionsChange={onConnectionsChange}
        />
      </div>
    </AnimatedPanel>
  );
}

function AnimatedPanel({ title, children }: { title: string; children: React.ReactNode }) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      style={panelStyle}
      className={`properties-shell transition-all duration-300 ${
        visible ? "translate-x-0 opacity-100" : "translate-x-2 opacity-0"
      }`}
    >
      <div
        className="properties-header sticky top-0 z-10 px-4 py-3"
        style={{
          background: "rgba(18,18,20,0.66)",
          WebkitBackdropFilter: "blur(16px) saturate(120%)",
          backdropFilter: "blur(16px) saturate(120%)",
          boxShadow: "0 1px 0 rgba(255,255,255,0.04) inset",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        }}
      >
        <div className="properties-title text-[16px] leading-5 font-semibold">{title}</div>
      </div>
      {children}
    </div>
  );
}
