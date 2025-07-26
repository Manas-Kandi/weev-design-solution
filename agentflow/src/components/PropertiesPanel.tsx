"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { theme } from "@/data/theme";
import { CanvasNode, AgentNodeData } from "@/types";
import { Minimize2, Play, Settings } from "lucide-react";
import React, { useEffect, useState } from "react";
import { nodeCategories } from "@/data/nodeDefinitions";

interface PropertiesPanelProps {
  selectedNode: CanvasNode | null;
  onChange: (updatedNode: CanvasNode) => void;
}

const AGENT_PRESETS = [
  {
    label: "Support Agent",
    value: "support",
    systemPrompt: "You are a support agent. Help users resolve issues, escalate if unsure.",
    personality: "Empathetic, patient, clear",
    escalationLogic: "If confidence < 0.7, escalate to human-handoff node.",
    confidenceThreshold: 0.7,
  },
  {
    label: "Sales Agent",
    value: "sales",
    systemPrompt: "You are a sales agent. Guide users to products and answer questions.",
    personality: "Persuasive, friendly, energetic",
    escalationLogic: "If user requests a discount, escalate to manager.",
    confidenceThreshold: 0.8,
  },
  {
    label: "Research Agent",
    value: "research",
    systemPrompt: "You are a research agent. Find and summarize information for users.",
    personality: "Analytical, concise, neutral",
    escalationLogic: "If information is missing, escalate to human researcher.",
    confidenceThreshold: 0.6,
  }
];

export default function PropertiesPanel({ selectedNode, onChange }: PropertiesPanelProps) {
  const [activeTab] = useState<'properties' | 'config' | 'testing'>('properties');
  // Use a properly typed localData
  const [localData, setLocalData] = useState<CanvasNode['data']>(selectedNode?.data || {
    title: '',
    description: '',
    color: '',
    icon: '',
    prompt: '',
    model: 'gemini-pro', // default model
    preset: '', // Add preset property for agent nodes
    systemPrompt: '',
    personality: '',
    escalationLogic: '',
    confidenceThreshold: 0.7
  });
  const [testResult, setTestResult] = useState<string | null>(null);

  // Reset localData when selectedNode changes
  useEffect(() => {
    if (selectedNode) {
      setLocalData(selectedNode.data);
    }
    // Inject Prompt Template Node for testing if not present
    // Only run on initial load of nodes (not every node selection)
    // This should be done in the main app/page.tsx, but for demo, we show how to inject here
  }, [selectedNode]);

  // Controlled input handlers
  const handleFieldChange = (field: keyof AgentNodeData, value: string | number) => {
    const updatedData = { ...localData, [field]: value };
    setLocalData(updatedData);
    if (selectedNode) {
      onChange({ ...selectedNode, data: updatedData });
    }
  };

  // Test node with Gemini
  const handleTestNode = async () => {
    if (
      selectedNode &&
      selectedNode.type === 'agent' &&
      'prompt' in localData &&
      typeof localData.prompt === 'string' &&
      localData.prompt
    ) {
      setTestResult('Running...');
      try {
        const { callGemini } = await import('@/lib/geminiClient');
        // For demo, always route to Gemini, but pass model for future extensibility
        const res = await callGemini(localData.prompt);
        setTestResult(res.candidates?.[0]?.content?.parts?.[0]?.text || 'No response');
      } catch (err) {
        setTestResult('Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
      }
    }
  };

  // Helper: get icon component from nodeCategories
  const getNodeIcon = (node: CanvasNode) => {
    for (const category of nodeCategories) {
      const found = category.nodes.find(n => n.id === node.data.icon || n.id === node.id);
      if (found) return found.icon;
    }
    return null;
  };

  if (!selectedNode) {
    return (
      <div
        className="w-80 border-l flex flex-col items-center justify-center"
        style={{ backgroundColor: theme.sidebar, borderColor: theme.border }}
      >
        <p className="text-sm" style={{ color: theme.textMute }}>
          Select a node to edit its properties.
        </p>
        </div>
      )
    }
  
  return (
    <div
      className="w-80 border-l flex flex-col"
      style={{ backgroundColor: theme.sidebar, borderColor: theme.border }}
    >
      {/* Panel Header */}
      <div className="h-12 border-b flex items-center justify-between px-4" style={{ borderColor: theme.border }}>
        <h3 className="font-medium" style={{ color: theme.text }}>
          Properties
        </h3>
        <button className="p-1 hover:bg-white/10 rounded transition-colors" style={{ color: theme.textMute }}>
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
                  style={{ backgroundColor: localData.color || '#888' }}
                >
                  {/* Only render if icon is not null */}
                  {(() => {
                    const IconComp = getNodeIcon(selectedNode);
                    return IconComp ? React.createElement(IconComp, { className: "w-3 h-3 text-white" }) : null;
                  })()}
                </div>
                <span className="text-sm" style={{ color: theme.text }}>
                  {localData.title || selectedNode.subtype || selectedNode.type}
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
                style={{ backgroundColor: theme.bgElevate, color: theme.text }}
                value={localData.title}
                placeholder="Enter node name..."
                onChange={e => handleFieldChange('title', e.target.value)}
              />
            </div>
            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.textSecondary }}>
                Description
              </label>
              <textarea
                className="w-full px-3 py-2 text-sm rounded resize-none border-0"
                style={{ backgroundColor: theme.bgElevate, color: theme.text }}
                rows={3}
                placeholder="Describe what this node does..."
                value={localData.description}
                onChange={e => handleFieldChange('description', e.target.value)}
              />
            </div>
            {/* Agent node fields */}
            {selectedNode.type === 'agent' && (
              <>
                <div className="space-y-2">
                  <div className="mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: theme.textSecondary }}>Agent Preset</span>
                  </div>
                  <div>
                    <select
                      className="w-full px-3 py-2 text-sm rounded border-0 bg-gray-800 text-white mb-2"
                      style={{ backgroundColor: theme.bgElevate, color: theme.text }}
                      value={selectedNode.type === 'agent' ? (localData as AgentNodeData).preset || '' : ''}
                      onChange={e => {
                        const preset = AGENT_PRESETS.find(p => p.value === e.target.value);
                        if (preset && selectedNode.type === 'agent') {
                          setLocalData({
                            ...localData,
                            systemPrompt: preset.systemPrompt,
                            personality: preset.personality,
                            escalationLogic: preset.escalationLogic,
                            confidenceThreshold: preset.confidenceThreshold,
                            preset: preset.value
                          });
                          onChange({ ...selectedNode, data: {
                            ...localData,
                            systemPrompt: preset.systemPrompt,
                            personality: preset.personality,
                            escalationLogic: preset.escalationLogic,
                            confidenceThreshold: preset.confidenceThreshold,
                            preset: preset.value
                          }});
                        }
                      }}
                    >
                      <option value="">Select preset...</option>
                      {AGENT_PRESETS.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: theme.textSecondary }}>Agent Guardrails</span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: theme.textMute }}>
                      System Prompt
                    </label>
                    <textarea
                      className="w-full px-3 py-2 text-sm rounded resize-none border-0"
                      style={{ backgroundColor: theme.bgElevate, color: theme.text }}
                      rows={2}
                      placeholder="e.g. You are an autonomous agent operating in a workflow."
                      value={(localData as AgentNodeData).systemPrompt || ''}
                      onChange={e => handleFieldChange('systemPrompt', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: theme.textMute }}>
                      Personality
                    </label>
                    <Input
                      className="border-0 px-3 py-2"
                      style={{ backgroundColor: theme.bgElevate, color: theme.text }}
                      value={(localData as AgentNodeData).personality || ''}
                      placeholder="e.g. Friendly, helpful, concise"
                      onChange={e => handleFieldChange('personality', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: theme.textMute }}>
                      Escalation Logic
                    </label>
                    <Input
                      className="border-0 px-3 py-2"
                      style={{ backgroundColor: theme.bgElevate, color: theme.text }}
                      value={(localData as AgentNodeData).escalationLogic || ''}
                      placeholder="e.g. If confidence < 0.7, escalate to human-handoff node."
                      onChange={e => handleFieldChange('escalationLogic', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: theme.textMute }}>
                      Confidence Threshold
                    </label>
                    <Input
                      type="number"
                      className="border-0 px-3 py-2"
                      style={{ backgroundColor: theme.bgElevate, color: theme.text }}
                      value={(localData as AgentNodeData).confidenceThreshold ?? ''}
                      placeholder="e.g. 0.7"
                      onChange={e => handleFieldChange('confidenceThreshold', Number(e.target.value))}
                    />
                  </div>
                </div>
                <Separator style={{ backgroundColor: theme.border }} />
                <div className="space-y-2 mt-4">
                  <div className="mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: theme.textSecondary }}>Agent Prompt & Model</span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: theme.textMute }}>
                      Model
                    </label>
                    <select
                      className="w-full px-3 py-2 text-sm rounded border-0 bg-gray-800 text-white"
                      style={{ backgroundColor: theme.bgElevate, color: theme.text }}
                      value={(localData as AgentNodeData).model || 'gemini-pro'}
                      onChange={e => handleFieldChange('model', e.target.value)}
                    >
                      <option value="gemini-pro">Gemini Pro</option>
                      <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</option>
                      <option value="gpt-4">GPT-4</option>
                      <option value="claude-3">Claude 3</option>
                      <option value="llama-3">Llama 3</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: theme.textMute }}>
                      User Prompt
                    </label>
                    <textarea
                      className="w-full px-3 py-2 text-sm rounded resize-none border-0"
                      style={{ backgroundColor: theme.bgElevate, color: theme.text }}
                      rows={3}
                      placeholder="Enter the prompt for Gemini..."
                      value={(localData as AgentNodeData).prompt || ''}
                      onChange={e => handleFieldChange('prompt', e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}
            {/* Prompt Template Node Editing */}
            {selectedNode.type === "conversation" && selectedNode.subtype === "template" && (
              (() => {
                const data = localData as import("@/types").PromptTemplateNodeData;
                return (
                  <>
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.textSecondary }}>
                      Template
                    </label>
                    <textarea
                      className="w-full px-3 py-2 text-sm rounded resize-none border-0"
                      style={{ backgroundColor: theme.bgElevate, color: theme.text }}
                      value={data.template}
                      placeholder="Enter prompt template..."
                      onChange={e => {
                        const updated = { ...data, template: e.target.value };
                        setLocalData(updated);
                        onChange({ ...selectedNode, data: updated });
                      }}
                    />
                    <label className="block text-sm font-medium mb-2 mt-4" style={{ color: theme.textSecondary }}>
                      Variables (JSON)
                    </label>
                    <textarea
                      className="w-full px-3 py-2 text-sm rounded resize-none border-0"
                      style={{ backgroundColor: theme.bgElevate, color: theme.text }}
                      value={JSON.stringify(data.variables, null, 2)}
                      placeholder={`{
  "topic": "inflation"
}`}
                      onChange={e => {
                        try {
                          const parsed = JSON.parse(e.target.value);
                          const updated = { ...data, variables: parsed };
                          setLocalData(updated);
                          onChange({ ...selectedNode, data: updated });
                        } catch {}
                      }}
                    />
                  </>
                );
              })()
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
            style={{ backgroundColor: theme.accent, color: 'white' }}
            onClick={handleTestNode}
            disabled={selectedNode.type !== 'agent'}
          >
            <Play className="w-4 h-4" />
            Test Node
          </Button>
          {testResult && (
            <div className="mt-2 p-2 rounded bg-gray-900 text-white text-xs">
              {testResult}
            </div>
          )}
          <Button
            variant="outline"
            className="w-full gap-2 border-0"
            style={{ backgroundColor: theme.bgElevate, color: theme.text, borderColor: theme.border }}
          >
            <Settings className="w-4 h-4" />
            Advanced Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
