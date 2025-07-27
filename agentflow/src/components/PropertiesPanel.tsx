"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { theme } from "@/data/theme";
import { CanvasNode } from "@/types";
import { Minimize2 } from "lucide-react";
import EnhancedAgentConfig from "./EnhancedAgentConfig";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

// Move interfaces to types/index.ts for reuse and import them here
// import {
//   MessageNodeData,
//   PromptTemplateNodeData,
//   KnowledgeBaseNodeData,
//   ConversationFlowNodeData,
//   IfElseNodeData,
//   DecisionTreeNodeData,
//   StateMachineNodeData,
//   TestCaseNodeData,
//   SimulatorNodeData,
//   ChatInterfaceNodeData,
//   DashboardNodeData
// } from '@/types';

interface PropertiesPanelProps {
  selectedNode: CanvasNode | null;
  onChange: (updatedNode: CanvasNode) => void;
}

export default function PropertiesPanel({
  selectedNode,
  onChange,
}: PropertiesPanelProps) {
  // --- Component-Specific Properties Renderer ---
  const renderComponentSpecificProperties = (): React.ReactNode => {
    const nodeType = selectedNode?.type;
    const nodeSubtype = selectedNode?.subtype;
    switch (nodeType) {
      case "conversation":
        switch (nodeSubtype) {
          case "message":
            return renderMessageProperties();
          case "prompt-template":
            return renderPromptTemplateProperties();
          case "knowledge-base":
            return renderKnowledgeBaseProperties();
          case "conversation-flow":
            return renderConversationFlowProperties();
          default:
            return null;
        }
      case "logic":
        switch (nodeSubtype) {
          case "if-else":
            return renderIfElseProperties();
          case "decision-tree":
            return renderDecisionTreeProperties();
          case "state-machine":
            return renderStateMachineProperties();
          default:
            return null;
        }
      case "testing":
        switch (nodeSubtype) {
          case "test-case":
            return renderTestCaseProperties();
          case "simulator":
            return renderSimulatorProperties();
          default:
            return null;
        }
      case "ui":
        switch (nodeSubtype) {
          case "chat":
            return renderChatInterfaceProperties();
          case "dashboard":
            return renderDashboardProperties();
          default:
            return null;
        }
      default:
        return null;
    }
  };

  // --- Specialized Property Renderers ---
  const renderMessageProperties = (): React.ReactElement => (
    <div className="space-y-4">
      {/* Implementation for rendering message properties */}
    </div>
  );
  const renderPromptTemplateProperties = (): React.ReactElement => (
    <div className="space-y-4">
      {/* Implementation for rendering prompt template properties */}
    </div>
  );
  const renderKnowledgeBaseProperties = (): React.ReactElement => (
    <div className="space-y-4">
      {/* Implementation for rendering knowledge base properties */}
    </div>
  );
  const renderConversationFlowProperties = (): React.ReactElement => (
    <div className="space-y-4">
      {/* Implementation for rendering conversation flow properties */}
    </div>
  );
  const renderIfElseProperties = (): React.ReactElement => (
    <div className="space-y-4">
      {/* Implementation for rendering if-else properties */}
    </div>
  );
  const renderDecisionTreeProperties = (): React.ReactElement => (
    <div className="space-y-4">
      {/* Implementation for rendering decision tree properties */}
    </div>
  );
  const renderStateMachineProperties = (): React.ReactElement => (
    <div className="space-y-4">
      {/* Implementation for rendering state machine properties */}
    </div>
  );
  const renderTestCaseProperties = (): React.ReactElement => (
    <div className="space-y-4">
      {/* Implementation for rendering test case properties */}
    </div>
  );
  const renderSimulatorProperties = (): React.ReactElement => (
    <div className="space-y-4">
      {/* Implementation for rendering simulator properties */}
    </div>
  );
  const renderChatInterfaceProperties = (): React.ReactElement => (
    <div className="space-y-4">
      {/* Implementation for rendering chat interface properties */}
    </div>
  );
  const renderDashboardProperties = (): React.ReactElement => (
    <div className="space-y-4">
      {/* Implementation for rendering dashboard properties */}
    </div>
  );

  // --- Main Render ---
  if (!selectedNode) {
    return (
      <div
        className="w-96 h-full border-l flex items-center justify-center"
        style={{
          backgroundColor: theme.sidebar,
          borderColor: theme.border,
        }}
      >
        <p style={{ color: theme.textSecondary }}>Select a node to edit</p>
      </div>
    );
  }

  // For agent nodes, show the enhanced configuration
  if (selectedNode.type === "agent") {
    return (
      <div
        className="w-96 h-full border-l flex flex-col"
        style={{
          backgroundColor: theme.sidebar,
          borderColor: theme.border,
        }}
      >
        <div
          className="h-12 border-b flex items-center justify-between px-4"
          style={{ borderColor: theme.border }}
        >
          <h3 className="font-medium" style={{ color: theme.text }}>
            Agent Configuration
          </h3>
          <button
            className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/10 transition-colors"
            style={{ color: theme.textSecondary }}
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 h-full overflow-hidden flex flex-col">
          <EnhancedAgentConfig
            node={{ data: selectedNode.data as import("@/types").AgentNodeData }}
            onUpdate={(data) =>
              onChange({ ...selectedNode, data: { ...selectedNode.data, ...data } })
            }
          />
        </div>
      </div>
    );
  }

  // For conversation flow nodes, show specific configuration
  if (selectedNode.type === "conversation" && selectedNode.subtype === "conversation-flow") {
    return (
      <div
        className="w-96 h-full border-l flex flex-col"
        style={{
          backgroundColor: theme.sidebar,
          borderColor: theme.border,
        }}
      >
        <div
          className="h-12 border-b flex items-center justify-between px-4"
          style={{ borderColor: theme.border }}
        >
          <h3 className="font-medium" style={{ color: theme.text }}>
            Conversation Flow
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="text-sm" style={{ color: theme.textSecondary }}>
              Flow Name
            </label>
            <Input
              value={selectedNode.data.title || ""}
              onChange={(e) =>
                onChange({
                  ...selectedNode,
                  data: { ...selectedNode.data, title: e.target.value },
                })
              }
              className="mt-1"
            />
          </div>

          <Separator />

          <div>
            <h4 className="text-sm font-medium mb-2" style={{ color: theme.text }}>
              Branch Settings
            </h4>
            <p className="text-xs" style={{ color: theme.textSecondary }}>
              Configure branch conditions and routing logic for this conversation flow.
              Each branch can connect to different nodes based on user input or context.
            </p>
          </div>

          <div>
            <label className="text-sm" style={{ color: theme.textSecondary }}>
              Default Response
            </label>
            <textarea
              value={
                typeof selectedNode.data === "object" &&
                "defaultResponse" in selectedNode.data
                  ? (selectedNode.data as { defaultResponse?: string }).defaultResponse ||
                    ""
                  : ""
              }
              onChange={(e) =>
                onChange({
                  ...selectedNode,
                  data: {
                    ...selectedNode.data,
                    ...(typeof selectedNode.data === "object"
                      ? { defaultResponse: e.target.value }
                      : {}),
                  },
                })
              }
              className="mt-1 w-full h-20 px-3 py-2 rounded border bg-transparent resize-none"
              style={{
                borderColor: theme.border,
                color: theme.text,
              }}
              placeholder="Enter default response when no branches match..."
            />
          </div>

          <div>
            <label className="text-sm" style={{ color: theme.textSecondary }}>
              Context Variables
            </label>
            <p className="text-xs mt-1 mb-2" style={{ color: theme.textSecondary }}>
              Variables available in this conversation flow
            </p>
            <div className="space-y-2">
              {["user_name", "user_id", "conversation_id", "timestamp"].map((variable) => (
                <div
                  key={variable}
                  className="flex items-center justify-between p-2 rounded bg-black/20"
                >
                  <code className="text-xs" style={{ color: theme.accent }}>{`{{${variable}}}`}</code>
                  <span className="text-xs" style={{ color: theme.textSecondary }}>System</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default properties panel for other node types
  return (
    <aside
      className="bg-[#18181b] border border-[#23232a] rounded font-mono"
      style={{ minWidth: 320, maxWidth: 400, height: "100%", boxShadow: "none", display: "flex", flexDirection: "column" }}
    >
      <div className="h-12 border-b flex items-center justify-between px-4" style={{ borderColor: "#23232a" }}>
        <h3 className="text-white font-semibold text-sm">Properties</h3>
        <button
          className="w-6 h-6 rounded flex items-center justify-center hover:bg-blue-600/10 transition-colors"
          style={{ color: "#60a5fa" }}
        >
          <Minimize2 className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="text-xs text-gray-400 font-mono">Node ID</label>
          <Input
            value={selectedNode.id}
            disabled
            className="mt-1 bg-[#23232a] border-[#23232a] rounded font-mono text-white px-2 py-1 text-xs"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 font-mono">Title</label>
          <Input
            value={selectedNode.data.title || ""}
            onChange={(e) => onChange({ ...selectedNode, data: { ...selectedNode.data, title: e.target.value } })}
            className="mt-1 bg-[#23232a] border-[#23232a] rounded font-mono text-white px-2 py-1 text-xs"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 font-mono">Description</label>
          <textarea
            value={selectedNode.data.description || ""}
            onChange={(e) => onChange({ ...selectedNode, data: { ...selectedNode.data, description: e.target.value } })}
            className="mt-1 w-full h-16 px-2 py-1 rounded border bg-[#23232a] border-[#23232a] font-mono text-white text-xs resize-none"
          />
        </div>
        <Separator />
        <div>
          <h4 className="text-xs font-semibold text-white mb-2">Position</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-400 font-mono">X</label>
              <Input
                type="number"
                value={Math.round(selectedNode.position.x)}
                onChange={(e) => onChange({ ...selectedNode, position: { ...selectedNode.position, x: parseInt(e.target.value) || 0 } })}
                className="mt-1 bg-[#23232a] border-[#23232a] rounded font-mono text-white px-2 py-1 text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 font-mono">Y</label>
              <Input
                type="number"
                value={Math.round(selectedNode.position.y)}
                onChange={(e) => onChange({ ...selectedNode, position: { ...selectedNode.position, y: parseInt(e.target.value) || 0 } })}
                className="mt-1 bg-[#23232a] border-[#23232a] rounded font-mono text-white px-2 py-1 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Component-Specific Properties */}
        {renderComponentSpecificProperties()}

        {selectedNode && String(selectedNode.type) !== "agent" && (
          <div className="pt-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                // Component-specific testing logic
                console.log('Testing component:', selectedNode.type, selectedNode.subtype);
                // Optionally show a toast or modal for feedback
              }}
            >
              <Play className="w-4 h-4 mr-2" />
              Test Component
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}
