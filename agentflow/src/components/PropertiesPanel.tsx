"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { theme } from "@/data/theme";
import { CanvasNode } from "@/types";
import { Minimize2 } from "lucide-react";
import EnhancedAgentConfig from "./EnhancedAgentConfig";

interface PropertiesPanelProps {
  selectedNode: CanvasNode | null;
  onChange: (updatedNode: CanvasNode) => void;
}

export default function PropertiesPanel({
  selectedNode,
  onChange,
}: PropertiesPanelProps) {
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
  if (selectedNode.type === 'agent') {
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
        
        <div className="flex-1 overflow-hidden">
          <EnhancedAgentConfig
            node={{ data: selectedNode.data as import('@/types').AgentNodeData }}
            onUpdate={(data) => onChange({ ...selectedNode, data: { ...selectedNode.data, ...data } })}
          />
        </div>
      </div>
    );
  }

  // For conversation flow nodes, show specific configuration
  if (selectedNode.type === 'conversation' && selectedNode.subtype === 'conversation-flow') {
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
              value={selectedNode.data.title || ''}
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
              value={typeof selectedNode.data === 'object' && 'defaultResponse' in selectedNode.data ? (selectedNode.data as { defaultResponse?: string }).defaultResponse || '' : ''}
              onChange={(e) =>
                onChange({
                  ...selectedNode,
                  data: { ...selectedNode.data, ...(typeof selectedNode.data === 'object' ? { defaultResponse: e.target.value } : {}) },
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
              {['user_name', 'user_id', 'conversation_id', 'timestamp'].map(variable => (
                <div key={variable} className="flex items-center justify-between p-2 rounded bg-black/20">
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
          Properties
        </h3>
        <button
          className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/10 transition-colors"
          style={{ color: theme.textSecondary }}
        >
          <Minimize2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="text-sm" style={{ color: theme.textSecondary }}>
            Node ID
          </label>
          <Input value={selectedNode.id} disabled className="mt-1" />
        </div>

        <div>
          <label className="text-sm" style={{ color: theme.textSecondary }}>
            Title
          </label>
          <Input
            value={selectedNode.data.title || ''}
            onChange={(e) =>
              onChange({
                ...selectedNode,
                data: { ...selectedNode.data, title: e.target.value },
              })
            }
            className="mt-1"
          />
        </div>

        <div>
          <label className="text-sm" style={{ color: theme.textSecondary }}>
            Description
          </label>
          <textarea
            value={selectedNode.data.description || ''}
            onChange={(e) =>
              onChange({
                ...selectedNode,
                data: { ...selectedNode.data, description: e.target.value },
              })
            }
            className="mt-1 w-full h-20 px-3 py-2 rounded border bg-transparent resize-none"
            style={{
              borderColor: theme.border,
              color: theme.text,
            }}
          />
        </div>

        <Separator />

        <div>
          <h4 className="text-sm font-medium mb-2" style={{ color: theme.text }}>
            Position
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs" style={{ color: theme.textSecondary }}>
                X
              </label>
              <Input
                type="number"
                value={Math.round(selectedNode.position.x)}
                onChange={(e) =>
                  onChange({
                    ...selectedNode,
                    position: { ...selectedNode.position, x: parseInt(e.target.value) || 0 },
                  })
                }
              />
            </div>
            <div>
              <label className="text-xs" style={{ color: theme.textSecondary }}>
                Y
              </label>
              <Input
                type="number"
                value={Math.round(selectedNode.position.y)}
                onChange={(e) =>
                  onChange({
                    ...selectedNode,
                    position: { ...selectedNode.position, y: parseInt(e.target.value) || 0 },
                  })
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
