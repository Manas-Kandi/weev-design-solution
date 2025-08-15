/**
 * ================================================================================
 * FINAL PROPERTIES PANEL — SINGLE SOURCE OF TRUTH
 * ================================================================================
 * 
 * This is the unified Properties Panel shell that handles ALL properties panel UI 
 * and data flow. This component is the single source of truth for properties panel 
 * rendering across the entire application.
 * 
 * ALL OTHER PANEL IMPLEMENTATIONS ARE DEPRECATED.
 * 
 * This shell:
 * - Consolidates all panel types (Agent, Tool Config, Router, KB, Rules, etc.)
 * - Applies consistent minimal dark-theme liquid-glass aesthetic
 * - Maintains all existing data flows and functionality
 * - Provides unified structure, headers, sections, typography, and controls
 * 
 * ================================================================================
 */

"use client";
import React, { useState, useEffect, useRef } from "react";
import { MousePointerClick, Sparkles, Settings, Database, Route, MessageSquare, Brain, TestTube, Monitor, GitBranch, FileText, Bot, HardDrive, Wrench } from "lucide-react";
import { Skeleton } from "@/components/primitives/skeleton";
import { figmaPropertiesTheme as theme, themeHelpers } from "@/components/panels/propertiesPanelTheme";
import { 
  PanelContainer, 
  PanelSection, 
  FormField, 
  TextInput,
  TextArea,
  Select,
  Button 
} from "@/components/panels/shared/PropertiesPanelPrimitives";
import ContextControlsSection from "@/components/primitives/ContextControlsSection";
import { CanvasNode, Connection } from "@/types";
import { RouterNodeData } from "@/lib/nodes/router/types";
import { ToolNodeData } from "@/types";
import { KnowledgeBaseNode } from "@/lib/nodes/knowledge/KnowledgeBaseNode";
import { getAvailableTools, getToolSchema, getToolMockPresets, getMockPreset } from "@/lib/nodes/tool/catalog";
import { TOOL_MODES, MOCK_ERROR_MODES } from "@/lib/nodes/tool/types";

interface UnifiedPropertiesPanelProps {
  selectedNode: CanvasNode | null;
  onChange: (updatedNode: CanvasNode) => void;
  nodes: CanvasNode[];
  connections: Connection[];
  onConnectionsChange: (next: Connection[]) => void;
  onClose?: () => void;
}

const panelStyle: React.CSSProperties = {
  width: 320,
  minWidth: 260,
  height: "100vh", // Full viewport height
  // Liquid Glass surface
  background: "rgba(18,18,20,0.55)",
  backdropFilter: "blur(16px) saturate(120%)",
  WebkitBackdropFilter: "blur(16px) saturate(120%)",
  fontFamily: theme.typography.fontFamily,
  fontSize: 15,
  color: theme.colors.textPrimary,
  display: "flex",
  flexDirection: "column",
  // Squared edges - no border radius
  borderRadius: 0,
  boxShadow:
    "inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px rgba(255,255,255,0.05), 0 10px 30px rgba(0,0,0,0.35)",
  boxSizing: "border-box",
  // Position flush to screen edge
  position: "fixed" as const,
  top: 0,
  right: 0,
};

// ================================================================================
// UNIFIED PANEL CONTENT RENDERERS
// ================================================================================

// Router Panel Content
const RouterPanelContent: React.FC<{ node: CanvasNode; onChange: (node: CanvasNode) => void }> = ({ node, onChange }) => {
  const data = node.data as RouterNodeData;
  const [mode, setMode] = useState<"expression" | "llm">(data.mode || 'expression');
  const [expression, setExpression] = useState(data.expression || 'inputs[0]?.content?.score > 0.5');
  const [llmRule, setLlmRule] = useState(data.llmRule || 'Return true if the input indicates a positive sentiment, false otherwise.');

  useEffect(() => {
    setMode(data.mode || 'expression');
    setExpression(data.expression || 'inputs[0]?.content?.score > 0.5');
    setLlmRule(data.llmRule || 'Return true if the input indicates a positive sentiment, false otherwise.');
  }, [data]);

  const handleChange = (updates: Partial<RouterNodeData>) => {
    onChange({ ...node, data: { ...data, ...updates } });
  };

  return (
    <>
      <PanelSection title="Routing Configuration" subtitle="Configure how the router makes routing decisions">
        <FormField label="Routing Mode" help="Choose how the router makes decisions: JavaScript expression or LLM-based reasoning">
          <Select
            value={mode}
            onChange={(value) => {
              setMode(value as "expression" | "llm");
              handleChange({ mode: value as "expression" | "llm" });
            }}
            options={[
              { value: 'expression', label: 'Expression' },
              { value: 'llm', label: 'LLM Decision' }
            ]}
          />
        </FormField>

        {mode === 'expression' && (
          <FormField label="Expression" help="JavaScript expression that evaluates to true/false">
            <TextArea
              value={expression}
              onChange={(value) => {
                setExpression(value);
                handleChange({ expression: value });
              }}
              placeholder="inputs[0]?.content?.score > 0.5"
              rows={4}
            />
          </FormField>
        )}

        {mode === 'llm' && (
          <FormField label="LLM Rule" help="Instruction for the LLM to make a true/false decision">
            <TextArea
              value={llmRule}
              onChange={(value) => {
                setLlmRule(value);
                handleChange({ llmRule: value });
              }}
              placeholder="Return true if the input indicates a positive sentiment, false otherwise."
              rows={4}
            />
          </FormField>
        )}
      </PanelSection>

      <PanelSection title="Router Outputs">
        <div style={{ fontSize: '12px', color: '#aaa', lineHeight: '1.5' }}>
          • <strong>true</strong> port: Routes when decision is true<br/>
          • <strong>false</strong> port: Routes when decision is false
        </div>
      </PanelSection>
    </>
  );
};

// Tool Panel Content
const ToolPanelContent: React.FC<{ node: CanvasNode; onChange: (node: CanvasNode) => void }> = ({ node, onChange }) => {
  const data = node.data as ToolNodeData;
  const [selectedTool, setSelectedTool] = useState(data.toolName || '');
  const [selectedOperation, setSelectedOperation] = useState(data.operation || '');
  const [mode, setMode] = useState(data.mode || 'mock');
  const [mockPreset, setMockPreset] = useState(data.mockPreset || '');
  const [latencyMs, setLatencyMs] = useState(data.latencyMs || 500);

  const availableTools = getAvailableTools();
  const toolSchema = getToolSchema(selectedTool);
  const availableOperations = toolSchema?.operations ? Object.keys(toolSchema.operations) : [];
  const mockPresets = getToolMockPresets(selectedTool);

  const handleChange = (updates: Partial<ToolNodeData>) => {
    onChange({ ...node, data: { ...data, ...updates } });
  };

  return (
    <>
      <PanelSection title="Tool Configuration" subtitle="Configure tool execution and behavior">
        <FormField label="Tool" help="Select the tool to execute">
          <Select
            value={selectedTool}
            onChange={(value) => {
              setSelectedTool(value);
              handleChange({ toolName: value });
            }}
            options={availableTools.map(tool => ({ value: tool, label: tool }))}
          />
        </FormField>

        {availableOperations.length > 0 && (
          <FormField label="Operation" help="Select the operation to perform">
            <Select
              value={selectedOperation}
              onChange={(value) => {
                setSelectedOperation(value);
                handleChange({ operation: value });
              }}
              options={availableOperations.map(op => ({ value: op, label: op }))}
            />
          </FormField>
        )}

        <FormField label="Mode" help="Choose execution mode">
          <Select
            value={mode}
            onChange={(value) => {
              setMode(value as any);
              handleChange({ mode: value as any });
            }}
            options={TOOL_MODES.map(mode => ({ value: mode, label: mode }))}
          />
        </FormField>

        {mode === 'mock' && mockPresets.length > 0 && (
          <FormField label="Mock Preset" help="Select a mock response preset">
            <Select
              value={mockPreset}
              onChange={(value) => {
                setMockPreset(value);
                handleChange({ mockPreset: value });
              }}
              options={mockPresets.map(preset => ({ value: preset, label: preset }))}
            />
          </FormField>
        )}

        <FormField label="Latency (ms)" help="Simulated execution delay">
          <TextInput
            type="number"
            value={latencyMs.toString()}
            onChange={(value) => {
              const num = parseInt(value) || 500;
              setLatencyMs(num);
              handleChange({ latencyMs: num });
            }}
          />
        </FormField>
      </PanelSection>
    </>
  );
};

// Knowledge Base Panel Content
const KnowledgeBasePanelContent: React.FC<{ node: CanvasNode; onChange: (node: CanvasNode) => void }> = ({ node, onChange }) => {
  const data = node.data as any;
  const [operation, setOperation] = useState<"store" | "retrieve" | "search">(data.operation || "retrieve");
  const [documents, setDocuments] = useState<any[]>(data.documents || []);
  const [metadata, setMetadata] = useState<string>(data.metadata ? JSON.stringify(data.metadata, null, 2) : "{}");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (updates: any) => {
    onChange({ ...node, data: { ...data, ...updates } });
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    
    const newDocs = await Promise.all(
      Array.from(files).map(async (file) => {
        const content = await file.text();
        return { name: file.name, content };
      })
    );
    
    const updatedDocs = [...documents, ...newDocs];
    setDocuments(updatedDocs);
    handleChange({ documents: updatedDocs });
  };

  return (
    <>
      <PanelSection title="Knowledge Base Configuration" subtitle="Configure knowledge storage and retrieval">
        <FormField label="Operation" help="Choose the knowledge base operation">
          <Select
            value={operation}
            onChange={(value) => {
              setOperation(value as any);
              handleChange({ operation: value });
            }}
            options={[
              { value: 'store', label: 'Store' },
              { value: 'retrieve', label: 'Retrieve' },
              { value: 'search', label: 'Search' }
            ]}
          />
        </FormField>

        <FormField label="Documents" help="Upload documents to the knowledge base">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".txt,.md,.pdf,.json"
            onChange={(e) => handleFiles(e.target.files)}
            style={{ display: 'none' }}
          />
          <Button onClick={() => fileInputRef.current?.click()}>
            Upload Documents
          </Button>
          {documents.length > 0 && (
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#aaa' }}>
              {documents.length} document(s) uploaded
            </div>
          )}
        </FormField>

        <FormField label="Metadata" help="JSON metadata for the knowledge base">
          <TextArea
            value={metadata}
            onChange={(value) => {
              setMetadata(value);
              try {
                const parsed = JSON.parse(value);
                handleChange({ metadata: parsed });
              } catch {
                // Invalid JSON, don't update
              }
            }}
            rows={4}
            placeholder='{"key": "value"}'
          />
        </FormField>
      </PanelSection>
    </>
  );
};

// Rules Panel Content (for Agent, Message, Decision Tree, etc.)
const RulesPanelContent: React.FC<{ 
  node: CanvasNode; 
  onChange: (node: CanvasNode) => void;
  title: string;
  subtitle: string;
}> = ({ node, onChange, title, subtitle }) => {
  const data = node.data as any;
  const rules = data.rules || {};
  const [text, setText] = useState<string>(rules.nl || "");

  useEffect(() => {
    setText(rules.nl || "");
  }, [node.id]);

  const handleChange = (value: string) => {
    setText(value);
    const newData = { 
      ...data, 
      rules: { ...rules, nl: value } 
    };
    onChange({ ...node, data: newData });
  };

  return (
    <PanelSection title={title} subtitle={subtitle}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
        <div style={{
          backgroundColor: "#5AA7FF",
          borderRadius: "12px",
          padding: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <Sparkles size={16} color="white" />
        </div>
        <div style={{ fontSize: "13px", color: "#aaa" }}>
          Natural language rules are compiled into executable logic
        </div>
      </div>

      <FormField label="Rule">
        <TextArea
          placeholder="e.g., Summarize inputs succinctly, ask clarifying questions if missing context, return JSON with keys: answer, citations"
          value={text}
          onChange={handleChange}
          rows={8}
        />
      </FormField>

      {rules.compiled?.summary && (
        <div style={{ 
          fontSize: "11px", 
          color: "#888", 
          marginTop: "8px",
          padding: "8px 12px",
          backgroundColor: "rgba(255,255,255,0.03)",
          borderRadius: "8px",
          border: "1px solid rgba(255,255,255,0.06)"
        }}>
          <strong>Compiled:</strong> {rules.compiled.summary}
        </div>
      )}
    </PanelSection>
  );
};

// ================================================================================
// MAIN UNIFIED PROPERTIES PANEL COMPONENT
// ================================================================================

export default function UnifiedPropertiesPanel({
  selectedNode,
  onChange,
  nodes,
  connections,
  onConnectionsChange,
  onClose,
}: UnifiedPropertiesPanelProps) {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedNode) {
      setIsLoading(true);
      const t = setTimeout(() => setIsLoading(false), 300);
      return () => clearTimeout(t);
    }
  }, [selectedNode?.id]);

  if (!selectedNode) {
    return (
      <div style={panelStyle} className="flex h-full items-center justify-center">
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

  // Get panel configuration based on node type
  const getPanelConfig = () => {
    switch (nodeType) {
      case "agent":
      case "generic":
      case "human-handoff":
        return {
          title: "Agent Rules",
          icon: <Bot size={16} />,
          content: (
            <RulesPanelContent
              node={selectedNode}
              onChange={onChange}
              title="Agent Rules"
              subtitle="Type natural-language rules for this agent."
            />
          )
        };

      case "router":
        return {
          title: "Router",
          icon: <Route size={16} />,
          content: <RouterPanelContent node={selectedNode} onChange={onChange} />
        };

      case "tool":
        return {
          title: "Tool Configuration",
          icon: <Wrench size={16} />,
          content: <ToolPanelContent node={selectedNode} onChange={onChange} />
        };

      case "knowledge-base":
        return {
          title: "Knowledge Base",
          icon: <Database size={16} />,
          content: <KnowledgeBasePanelContent node={selectedNode} onChange={onChange} />
        };

      case "message":
        return {
          title: "Message Rules",
          icon: <MessageSquare size={16} />,
          content: (
            <RulesPanelContent
              node={selectedNode}
              onChange={onChange}
              title="Message Rules"
              subtitle="Describe how to format and route messages."
            />
          )
        };

      case "conversation":
        return {
          title: "Conversation Rules",
          icon: <MessageSquare size={16} />,
          content: (
            <RulesPanelContent
              node={selectedNode}
              onChange={onChange}
              title="Conversation Rules"
              subtitle="Define dialogue behavior in plain language."
            />
          )
        };

      case "decision-tree":
        return {
          title: "Decision Rules",
          icon: <GitBranch size={16} />,
          content: (
            <RulesPanelContent
              node={selectedNode}
              onChange={onChange}
              title="Decision Rules"
              subtitle="Describe branching logic succinctly."
            />
          )
        };

      case "if-else":
        return {
          title: "Condition Rules",
          icon: <GitBranch size={16} />,
          content: (
            <RulesPanelContent
              node={selectedNode}
              onChange={onChange}
              title="Condition Rules"
              subtitle="Write the condition in NL; engine enforces determinism."
            />
          )
        };

      case "template":
        return {
          title: "Template Rules",
          icon: <FileText size={16} />,
          content: (
            <RulesPanelContent
              node={selectedNode}
              onChange={onChange}
              title="Template Rules"
              subtitle="Define prompt behavior and variables in NL."
            />
          )
        };

      case "state-machine":
        return {
          title: "State Rules",
          icon: <Settings size={16} />,
          content: (
            <RulesPanelContent
              node={selectedNode}
              onChange={onChange}
              title="State Rules"
              subtitle="Describe states and transitions in NL."
            />
          )
        };

      case "test-case":
        return {
          title: "Test Rules",
          icon: <TestTube size={16} />,
          content: (
            <RulesPanelContent
              node={selectedNode}
              onChange={onChange}
              title="Test Rules"
              subtitle="Define expected behavior and assertions in NL."
            />
          )
        };

      case "memory":
        return {
          title: "Memory",
          icon: <HardDrive size={16} />,
          content: (
            <PanelSection title="Memory Configuration" subtitle="Configure memory storage and retrieval">
              <FormField label="Memory Type" help="Choose the type of memory">
                <Select
                  value={(selectedNode.data as any)?.memoryType || 'short-term'}
                  onChange={(value) => onChange({ 
                    ...selectedNode, 
                    data: { ...selectedNode.data, memoryType: value } 
                  })}
                  options={[
                    { value: 'short-term', label: 'Short Term' },
                    { value: 'long-term', label: 'Long Term' },
                    { value: 'episodic', label: 'Episodic' }
                  ]}
                />
              </FormField>
            </PanelSection>
          )
        };

      case "thinking":
        return {
          title: "Thinking",
          icon: <Brain size={16} />,
          content: (
            <PanelSection title="Thinking Configuration" subtitle="Configure internal reasoning process">
              <FormField label="Thinking Mode" help="Choose how the node processes thoughts">
                <Select
                  value={(selectedNode.data as any)?.thinkingMode || 'reflective'}
                  onChange={(value) => onChange({ 
                    ...selectedNode, 
                    data: { ...selectedNode.data, thinkingMode: value } 
                  })}
                  options={[
                    { value: 'reflective', label: 'Reflective' },
                    { value: 'analytical', label: 'Analytical' },
                    { value: 'creative', label: 'Creative' }
                  ]}
                />
              </FormField>
            </PanelSection>
          )
        };

      default:
        return {
          title: "Properties",
          icon: <Settings size={16} />,
          content: (
            <PanelSection title="Unknown Node Type">
              <div style={{ textAlign: "center", color: "#aaa", padding: "32px" }}>
                <span style={{ fontWeight: 500, fontSize: 18 }}>
                  Unknown node type: {nodeType}
                </span>
                <div style={{ marginTop: 8, fontSize: 14 }}>
                  This node type is not yet supported.
                </div>
              </div>
            </PanelSection>
          )
        };
    }
  };

  const { title, icon, content } = getPanelConfig();

  return (
    <AnimatedPanel title={title} icon={icon} onClose={onClose}>
      <PanelContainer>
        {content}
        <ContextControlsSection
          node={selectedNode}
          nodes={nodes}
          connections={connections}
          onConnectionsChange={onConnectionsChange}
        />
      </PanelContainer>
    </AnimatedPanel>
  );
}

function AnimatedPanel({ 
  title, 
  icon, 
  children, 
  onClose 
}: { 
  title: string; 
  icon: React.ReactNode;
  children: React.ReactNode; 
  onClose?: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
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
          background: "rgba(18,18,20,0.86)",
          WebkitBackdropFilter: "blur(16px) saturate(120%)",
          backdropFilter: "blur(16px) saturate(120%)",
          boxShadow: "0 1px 0 rgba(255,255,255,0.04) inset",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ color: "#5AA7FF" }}>{icon}</div>
          <div className="properties-title text-[16px] leading-5 font-semibold">{title}</div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close properties"
            style={{
              ...themeHelpers.getButtonStyle("secondary"),
              width: theme.components.button.height,
              padding: 0,
            }}
          >
            ×
          </button>
        )}
      </div>
      <div className="properties-content flex-1 min-h-0 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
