"use client";

import React from "react";
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
  isChatNodeData
} from "@/utils/typeGuards";
import {
  CanvasNode,
  ConversationFlowNodeData
} from "@/types";
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

const panelClass = `
    h-full bg-vscode-sidebar border-l border-vscode-border 
    overflow-y-auto scrollbar-thin scrollbar-thumb-vscode-scrollbarThumb 
    scrollbar-track-transparent hover:scrollbar-thumb-vscode-scrollbarThumbHover
  `;

export default function PropertiesPanel({
  selectedNode,
  onChange,
}: PropertiesPanelProps) {
  if (!selectedNode) {
    return (
      <div className={panelClass + " flex flex-col items-center justify-center h-full text-[#7f7f7f] text-base p-10 font-sans"}>
        <div className="text-2xl mb-2">🛈</div>
        <div>No node selected</div>
        <div className="text-xs mt-2 text-vscode-textSecondary">
          Select a node to view and edit its properties.
        </div>
      </div>
    );
  }

  // === PRIMARY CHECK: Use node.type and node.subtype first ===
  // --- AGENT NODES ---
  if (selectedNode.type === "agent") {
    if (selectedNode.subtype === "tool-agent") {
      return (
        <div className={panelClass}>
          <AgentPropertiesPanel node={selectedNode} onChange={onChange} />
          {/* TODO: Create ToolAgentPropertiesPanel */}
        </div>
      );
    }
    return (
      <div className={panelClass}>
        <AgentPropertiesPanel node={selectedNode} onChange={onChange} />
      </div>
    );
  }

  // --- CONVERSATION NODES ---
  if (selectedNode.type === "conversation") {
    if (selectedNode.subtype === "message") {
      return (
        <div className={panelClass}>
          <MessagePropertiesPanel node={selectedNode} onChange={onChange} />
        </div>
      );
    }
    if (selectedNode.subtype === "prompt-template" || selectedNode.subtype === "template") {
      return (
        <div className={panelClass}>
          <PromptTemplatePropertiesPanel node={selectedNode} onChange={onChange} />
        </div>
      );
    }
    if (selectedNode.subtype === "knowledge-base") {
      return (
        <div className={panelClass}>
          <KnowledgeBasePropertiesPanel node={selectedNode} onChange={onChange} />
        </div>
      );
    }
    if (selectedNode.subtype === "conversation-flow") {
      return (
        <div className={panelClass}>
          <ConversationFlowPropertiesPanel node={selectedNode as CanvasNode & { data: ConversationFlowNodeData }} onChange={onChange} />
        </div>
      );
    }
  }

  // --- LOGIC NODES ---
  if (selectedNode.type === "logic") {
    if (selectedNode.subtype === "if-else") {
      return (
        <div className={panelClass}>
          <IfElsePropertiesPanel node={selectedNode} onChange={onChange} />
        </div>
      );
    }
    if (selectedNode.subtype === "decision-tree") {
      return (
        <div className={panelClass}>
          <DecisionTreePropertiesPanel node={selectedNode} onChange={onChange} />
        </div>
      );
    }
    if (selectedNode.subtype === "state-machine") {
      return (
        <div className={panelClass}>
          <StateMachinePropertiesPanel node={selectedNode} onChange={onChange} />
        </div>
      );
    }
  }

  // --- TESTING NODES ---
  if (selectedNode.type === "testing") {
    if (selectedNode.subtype === "test-case") {
      return (
        <div className={panelClass}>
          <TestCasePropertiesPanel node={selectedNode} onChange={onChange} />
        </div>
      );
    }
    if (selectedNode.subtype === "simulator") {
      return (
        <div className={panelClass}>
          <SimulatorPropertiesPanel node={selectedNode} onChange={onChange} />
        </div>
      );
    }
  }

  // --- UI NODES ---
  if (selectedNode.type === "ui" || selectedNode.type === "gui") {
    if (selectedNode.subtype === "dashboard") {
      return (
        <div className={panelClass}>
          <DashboardPropertiesPanel node={selectedNode} onChange={onChange} />
        </div>
      );
    }
    if (selectedNode.subtype === "chat-interface") {
      return (
        <div className={panelClass}>
          <ChatInterfacePropertiesPanel node={selectedNode} onChange={onChange} />
        </div>
      );
    }
  }

  // === FALLBACK: Use type guards for data structure detection ===
  if (isMessageNodeData(selectedNode.data)) {
    return (
      <div className={panelClass}>
        <MessagePropertiesPanel node={selectedNode} onChange={onChange} />
      </div>
    );
  }
  if (isPromptTemplateNodeData(selectedNode.data)) {
    return (
      <div className={panelClass}>
        <PromptTemplatePropertiesPanel node={selectedNode} onChange={onChange} />
      </div>
    );
  }
  if (isKnowledgeBaseNodeData(selectedNode.data)) {
    return (
      <div className={panelClass}>
        <KnowledgeBasePropertiesPanel node={selectedNode} onChange={onChange} />
      </div>
    );
  }
  if (isIfElseNodeData(selectedNode.data)) {
    return (
      <div className={panelClass}>
        <IfElsePropertiesPanel node={selectedNode} onChange={onChange} />
      </div>
    );
  }
  if (isDecisionTreeNodeData(selectedNode.data)) {
    return (
      <div className={panelClass}>
        <DecisionTreePropertiesPanel node={selectedNode} onChange={onChange} />
      </div>
    );
  }
  if (isStateMachineNodeData(selectedNode.data)) {
    return (
      <div className={panelClass}>
        <StateMachinePropertiesPanel node={selectedNode} onChange={onChange} />
      </div>
    );
  }
  if (isConversationFlowNodeData(selectedNode.data)) {
    return (
      <div className={panelClass}>
        <ConversationFlowPropertiesPanel node={selectedNode as CanvasNode & { data: ConversationFlowNodeData }} onChange={onChange} />
      </div>
    );
  }
  if (isSimulatorNodeData(selectedNode.data)) {
    return (
      <div className={panelClass}>
        <SimulatorPropertiesPanel node={selectedNode} onChange={onChange} />
      </div>
    );
  }
  if (isDashboardNodeData(selectedNode.data)) {
    return (
      <div className={panelClass}>
        <DashboardPropertiesPanel node={selectedNode} onChange={onChange} />
      </div>
    );
  }
  if (isChatNodeData(selectedNode.data)) {
    return (
      <div className={panelClass}>
        <ChatInterfacePropertiesPanel node={selectedNode} onChange={onChange} />
      </div>
    );
  }

  // === DEFAULT: Unknown node type ===
  return (
    <div className={panelClass + " p-4 text-vscode-textSecondary"}>
      <div className="text-lg font-semibold mb-2">Unknown Node Type</div>
      <div className="text-sm mb-4">
        Type: <span className="font-mono">{selectedNode.type}</span>
        <br />
        Subtype: <span className="font-mono">{selectedNode.subtype}</span>
      </div>
      <div className="text-xs bg-vscode-panel p-3 rounded">
        This node type doesn&apos;t have a properties panel yet. 
        Add a panel for &quot;{selectedNode.subtype}&quot; nodes.
      </div>
    </div>
  );
}

// TODO: Add unit tests for this panel to ensure type safety and prevent regressions.
// TODO: Add unit tests for this panel to ensure type safety and prevent regressions.
