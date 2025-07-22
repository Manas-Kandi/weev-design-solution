"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { colors } from "@/data/nodeDefinitions";
import { CanvasNode } from "@/types";
import { Minimize2, Play, Settings } from "lucide-react";

interface PropertiesPanelProps {
  selectedNode: CanvasNode | null;
  onChange: (updatedNode: CanvasNode) => void;
}

export default function PropertiesPanel({ selectedNode, onChange }: PropertiesPanelProps) {
  if (!selectedNode) {
    return (
      <div
        className="w-80 border-l flex flex-col items-center justify-center"
        style={{
          backgroundColor: colors.sidebar,
          borderColor: colors.border,
        }}
      >
        <p className="text-sm" style={{ color: colors.textSecondary }}>
          Select a node to edit its properties.
        </p>
      </div>
    );
  }

  return (
    <div
      className="w-80 border-l flex flex-col"
      style={{
        backgroundColor: colors.sidebar,
        borderColor: colors.border,
      }}
    >
      {/* Panel Header */}
      <div className="h-12 border-b flex items-center justify-between px-4" style={{ borderColor: colors.border }}>
        <h3 className="font-medium" style={{ color: colors.text }}>
          Properties
        </h3>
        <button
          className="p-1 hover:bg-white/10 rounded transition-colors"
          style={{ color: colors.textSecondary }}
        >
          <Minimize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Node Type Display */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
            Node Type
          </label>
          <div className="flex items-center space-x-2 p-2 rounded" style={{ backgroundColor: colors.panel }}>
            <div
              className="w-4 h-4 rounded-sm flex items-center justify-center"
              style={{ backgroundColor: selectedNode.data.color }}
            >
              <selectedNode.data.icon className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm" style={{ color: colors.text }}>
              {selectedNode.data.title}
            </span>
          </div>
        </div>

        {/* Node Name */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
            Name
          </label>
          <Input
            className="border-0"
            style={{
              backgroundColor: colors.panel,
              color: colors.text,
            }}
            defaultValue={selectedNode.data.title}
            placeholder="Enter node name..."
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
            Description
          </label>
          <textarea
            className="w-full px-3 py-2 text-sm rounded resize-none border-0"
            style={{
              backgroundColor: colors.panel,
              color: colors.text,
            }}
            rows={3}
            placeholder="Describe what this node does..."
            defaultValue={selectedNode.data.description}
          />
        </div>

        {/* Configuration based on node type */}
        {selectedNode.subtype === "desktop-screen" && (
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
              Screen Dimensions
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Width"
                className="border-0"
                style={{ backgroundColor: colors.panel, color: colors.text }}
              />
              <Input
                placeholder="Height"
                className="border-0"
                style={{ backgroundColor: colors.panel, color: colors.text }}
              />
            </div>
          </div>
        )}

        {selectedNode.type === "agent" && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                AI Model
              </label>
              <select
                className="w-full px-3 py-2 text-sm rounded border-0"
                style={{
                  backgroundColor: colors.panel,
                  color: colors.text,
                }}
              >
                <option>GPT-4</option>
                <option>Claude</option>
                <option>Gemini</option>
                <option>Custom Model</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                System Prompt
              </label>
              <textarea
                className="w-full px-3 py-2 text-sm rounded resize-none border-0"
                style={{
                  backgroundColor: colors.panel,
                  color: colors.text,
                }}
                rows={4}
                placeholder="Enter the system prompt for this agent..."
              />
            </div>
          </>
        )}

        <Separator style={{ backgroundColor: colors.border }} />

        {/* Actions */}
        <div className="space-y-2">
          <Button
            className="w-full gap-2"
            style={{
              backgroundColor: colors.accent,
              color: "white",
            }}
          >
            <Play className="w-4 h-4" />
            Test Node
          </Button>

          <Button
            variant="outline"
            className="w-full gap-2 border-0"
            style={{
              backgroundColor: colors.panel,
              color: colors.text,
              borderColor: colors.border,
            }}
          >
            <Settings className="w-4 h-4" />
            Advanced Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
