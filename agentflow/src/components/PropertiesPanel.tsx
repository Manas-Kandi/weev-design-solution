"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { theme } from "@/data/theme";
import { CanvasNode } from "@/types";
import { Minimize2, Play, Settings } from "lucide-react";
import React, { useState } from "react";
import { nodeCategories } from "@/data/nodeDefinitions";

interface PropertiesPanelProps {
  selectedNode: CanvasNode | null;
  onChange: (updatedNode: CanvasNode) => void;
}

export default function PropertiesPanel({ selectedNode, onChange }: PropertiesPanelProps) {
  const [activeTab, setActiveTab] = useState<'properties' | 'config' | 'testing'>('properties');

  if (!selectedNode) {
    return (
      <div
        className="w-80 border-l flex flex-col items-center justify-center"
        style={{
          backgroundColor: theme.sidebar,
          borderColor: theme.border,
        }}
      >
        <p className="text-sm" style={{ color: theme.textMute }}>
          Select a node to edit its properties.
        </p>
      </div>
    );
  }

  // --- Update node name and description handlers ---
  // Add controlled input for name and description, and call onChange
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...selectedNode,
      data: {
        ...selectedNode.data,
        title: e.target.value,
      },
    });
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      ...selectedNode,
      data: {
        ...selectedNode.data,
        description: e.target.value,
      },
    });
  };

  // Helper: get icon component from nodeCategories
  const getNodeIcon = (node: CanvasNode) => {
    for (const category of nodeCategories) {
      const found = category.nodes.find(n => n.id === node.data.icon || n.id === node.id);
      if (found) return found.icon;
    }
    return null;
  };

  return (
    <div
      className="w-80 border-l flex flex-col"
      style={{
        backgroundColor: theme.sidebar,
        borderColor: theme.border,
      }}
    >
      {/* Panel Header */}
      <div className="h-12 border-b flex items-center justify-between px-4" style={{ borderColor: theme.border }}>
        <h3 className="font-medium" style={{ color: theme.text }}>
          Properties
        </h3>
        <button
          className="p-1 hover:bg-white/10 rounded transition-colors"
          style={{ color: theme.textMute }}
        >
          <Minimize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {activeTab === 'properties' && (
          <>
            {/* Node Type Display */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.textMute }}>
                Node Type
              </label>
              <div className="flex items-center space-x-2 p-2 rounded" style={{ backgroundColor: theme.bgElevate }}>
                <div
                  className="w-4 h-4 rounded-sm flex items-center justify-center"
                  style={{ backgroundColor: selectedNode.data.color }}
                >
                  {/* Only render if icon is not null */}
                  {(() => {
                    const IconComp = getNodeIcon(selectedNode);
                    return IconComp ? React.createElement(IconComp, { className: "w-3 h-3 text-white" }) : null;
                  })()}
                </div>
                <span className="text-sm" style={{ color: theme.text }}>
                  {selectedNode.data.title}
                </span>
              </div>
            </div>

            {/* Node Name */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.textSecondary }}>
                Name
              </label>
              <Input
                className="border-0"
                style={{
                  backgroundColor: theme.bgElevate,
                  color: theme.text,
                }}
                value={selectedNode.data.title}
                placeholder="Enter node name..."
                onChange={handleNameChange}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.textSecondary }}>
                Description
              </label>
              <textarea
                className="w-full px-3 py-2 text-sm rounded resize-none border-0"
                style={{
                  backgroundColor: theme.bgElevate,
                  color: theme.text,
                }}
                rows={3}
                placeholder="Describe what this node does..."
                value={selectedNode.data.description}
                onChange={handleDescriptionChange}
              />
            </div>

            {/* Configuration based on node type */}
            {selectedNode.subtype === "desktop-screen" && (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.textMute }}>
                  Screen Dimensions
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Width"
                    className="border-0"
                    style={{ backgroundColor: theme.bgElevate, color: theme.text }}
                  />
                  <Input
                    placeholder="Height"
                    className="border-0"
                    style={{ backgroundColor: theme.bgElevate, color: theme.text }}
                  />
                </div>
              </div>
            )}

            {selectedNode.type === "agent" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: theme.textMute }}>
                    AI Model
                  </label>
                  <select
                    className="w-full px-3 py-2 text-sm rounded border-0"
                    style={{
                      backgroundColor: theme.bgElevate,
                      color: theme.text,
                    }}
                  >
                    <option>GPT-4</option>
                    <option>Claude</option>
                    <option>Gemini</option>
                    <option>Custom Model</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: theme.textMute }}>
                    System Prompt
                  </label>
                  <textarea
                    className="w-full px-3 py-2 text-sm rounded resize-none border-0"
                    style={{
                      backgroundColor: theme.bgElevate,
                      color: theme.text,
                    }}
                    rows={4}
                    placeholder="Enter the system prompt for this agent..."
                  />
                </div>
              </>
            )}
          </>
        )}
        {activeTab === 'config' && (
          <div>
            {/* Configuration settings can go here */}
            <p className="text-sm" style={{ color: theme.text }}>
              Configuration settings for the node will be displayed here.
            </p>
          </div>
        )}
        {activeTab === 'testing' && (
          <div>
            {/* Testing controls can go here */}
            <p className="text-sm" style={{ color: theme.text }}>
              Testing controls for the node will be displayed here.
            </p>
          </div>
        )}

        <Separator style={{ backgroundColor: theme.border }} />

        {/* Actions */}
        <div className="space-y-2">
          <Button
            className="w-full gap-2"
            style={{
              backgroundColor: theme.accent,
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
              backgroundColor: theme.bgElevate,
              color: theme.text,
              borderColor: theme.border,
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
