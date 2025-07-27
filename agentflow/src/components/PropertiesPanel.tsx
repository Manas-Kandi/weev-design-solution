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

// --- Enhanced If/Else Interfaces ---
interface ConditionGroup {
  id: string;
  operator: 'AND' | 'OR';
  conditions: Condition[];
}
interface Condition {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'greater_equal' | 'less_equal' | 'exists' | 'not_exists' | 'matches_regex' | 'in_array' | 'llm_evaluate';
  value: string | number | boolean | string[];
  dataType: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'auto';
  llmPrompt?: string;
}
interface ComplexIfElseNodeData extends Record<string, unknown> {
  conditionGroups: ConditionGroup[];
  globalOperator: 'AND' | 'OR';
  truePath: { label: string; description: string };
  falsePath: { label: string; description: string };
  testData?: Record<string, unknown>;
  evaluationMode: 'strict' | 'fuzzy' | 'llm_assisted';
  llmModel: 'gemini-pro' | 'gemini-2.5-flash-lite';
  title?: string;
  description?: string;
  color?: string;
  icon?: string;
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
            return renderComplexIfElseProperties();
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

  // --- Enhanced If/Else Properties Panel ---
  const renderComplexIfElseProperties = (): React.ReactElement | null => {
    if (!selectedNode || selectedNode.type !== 'logic' || selectedNode.subtype !== 'if-else') return null;
    const nodeData = selectedNode.data as unknown as ComplexIfElseNodeData;
    const conditionGroups = nodeData.conditionGroups || [];

    // Use the onChange prop to update node data
    const handleFieldChange = (
      field: keyof ComplexIfElseNodeData,
      value: string | number | boolean | ConditionGroup[] | { label: string; description: string } | Record<string, unknown> | undefined
    ) => {
      onChange({
        ...selectedNode,
        data: {
          ...nodeData,
          [field]: value,
          color: nodeData.color || "#ffffff",
          icon: nodeData.icon || "settings",
          title: typeof nodeData.title === "string" ? nodeData.title : "",
          description: typeof nodeData.description === "string" ? nodeData.description : ""
        }
      });
    };

    // Handler functions
    const addConditionGroup = () => {
      const newGroup: ConditionGroup = {
        id: `group-${Date.now()}`,
        operator: 'AND',
        conditions: [{
          id: `condition-${Date.now()}`,
          field: '',
          operator: 'equals',
          value: '',
          dataType: 'auto'
        }]
      };
      handleFieldChange('conditionGroups', [...conditionGroups, newGroup]);
    };
    const updateConditionGroup = (groupId: string, updates: Partial<ConditionGroup>) => {
      const updatedGroups = conditionGroups.map(group => 
        group.id === groupId ? { ...group, ...updates } : group
      );
      handleFieldChange('conditionGroups', updatedGroups);
    };
    const addConditionToGroup = (groupId: string) => {
      const updatedGroups = conditionGroups.map(group => {
        if (group.id === groupId) {
          const newCondition: Condition = {
            id: `condition-${Date.now()}`,
            field: '',
            operator: 'equals',
            value: '',
            dataType: 'auto'
          };
          return { ...group, conditions: [...group.conditions, newCondition] };
        }
        return group;
      });
      handleFieldChange('conditionGroups', updatedGroups);
    };
    const updateCondition = (groupId: string, conditionId: string, updates: Partial<Condition>) => {
      const updatedGroups = conditionGroups.map(group => {
        if (group.id === groupId) {
          const updatedConditions = group.conditions.map(condition =>
            condition.id === conditionId ? { ...condition, ...updates } : condition
          );
          return { ...group, conditions: updatedConditions };
        }
        return group;
      });
      handleFieldChange('conditionGroups', updatedGroups);
    };
    const removeCondition = (groupId: string, conditionId: string) => {
      const updatedGroups = conditionGroups.map(group => {
        if (group.id === groupId) {
          return { ...group, conditions: group.conditions.filter(c => c.id !== conditionId) };
        }
        return group;
      });
      handleFieldChange('conditionGroups', updatedGroups.filter(group => group.conditions.length > 0));
    };
    const handleRemoveConditionGroup = (groupId: string) => {
      handleFieldChange('conditionGroups', conditionGroups.filter(group => group.id !== groupId));
    };
    const handleAddConditionGroup = () => {
      addConditionGroup();
    };
    const handleConditionOperatorChange = (groupId: string, conditionId: string, operator: Condition['operator']) => {
      updateCondition(groupId, conditionId, { operator });
    };
    const handleConditionValueChange = (
      groupId: string,
      conditionId: string,
      value: string | number | boolean | string[]
    ) => {
      updateCondition(groupId, conditionId, { value });
    };

    return (
      <div className="space-y-4">
        {/* Node Name */}
        <div>
          <label className="text-sm" style={{ color: theme.textSecondary }}>
            Node Name
          </label>
          <Input
            value={nodeData.title || ""}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            className="mt-1"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-sm" style={{ color: theme.textSecondary }}>
            Description
          </label>
          <textarea
            value={nodeData.description || ""}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            className="mt-1 w-full h-20 px-3 py-2 rounded border bg-transparent resize-none"
            style={{
              borderColor: theme.border,
              color: theme.text,
            }}
            placeholder="Enter a brief description of this node..."
          />
        </div>

        <Separator />

        {/* Condition Groups */}
        <div>
          <h4 className="text-sm font-medium mb-2" style={{ color: theme.text }}>
            Condition Groups
          </h4>
          <p className="text-xs" style={{ color: theme.textSecondary }}>
            Define the conditions that determine the flow of the conversation. Each group can have multiple conditions.
          </p>
        </div>

        {/* Render condition groups */}
        {conditionGroups.map((group: ConditionGroup, index: number) => (
          <div
            key={group.id}
            className="p-4 rounded-lg"
            style={{ backgroundColor: theme.bgElevate }}
          >
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-sm font-medium" style={{ color: theme.text }}>
                Condition Group {index + 1}
              </h5>
              <button
                onClick={() => handleRemoveConditionGroup(group.id)}
                className="text-red-500 hover:text-red-400 transition-colors"
                title="Remove Condition Group"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Render conditions within the group */}
            {group.conditions.map((condition: Condition) => (
              <div key={condition.id} className="space-y-2 mb-3 p-2 rounded" style={{ backgroundColor: theme.bg }}>
                <div className="flex items-center">
                  <select
                    value={condition.operator}
                    onChange={(e) => handleConditionOperatorChange(group.id, condition.id, e.target.value as Condition['operator'])}
                    className="mr-2 bg-transparent border rounded px-3 py-1 text-sm"
                    style={{ borderColor: theme.border, color: theme.text }}
                  >
                    <option value="equals">Equals</option>
                    <option value="not_equals">Does Not Equal</option>
                    <option value="contains">Contains</option>
                    <option value="not_contains">Does Not Contain</option>
                    <option value="greater_than">Greater Than</option>
                    <option value="less_than">Less Than</option>
                    <option value="greater_equal">Greater Than or Equal</option>
                    <option value="less_equal">Less Than or Equal</option>
                    <option value="exists">Exists</option>
                    <option value="not_exists">Does Not Exist</option>
                    <option value="matches_regex">Matches Regex</option>
                    <option value="in_array">In Array</option>
                    <option value="llm_evaluate">LLM Evaluate</option>
                  </select>

                  <Input
                    value={condition.value as string}
                    onChange={(e) => handleConditionValueChange(group.id, condition.id, e.target.value)}
                    className="flex-1 bg-transparent border rounded px-3 py-1 text-sm"
                    style={{ borderColor: theme.border, color: theme.text }}
                    placeholder="Enter value..."
                  />
                </div>

                {/* Field name input */}
                <Input
                  placeholder="Field name (e.g., user_message, confidence_score)"
                  className="border-0 text-xs"
                  style={{ backgroundColor: theme.bgElevate, color: theme.text }}
                  value={condition.field}
                  onChange={e => updateCondition(group.id, condition.id, { field: e.target.value })}
                />

                {/* Value input */}
                <Input
                  placeholder="Value to compare"
                  className="border-0 text-xs"
                  style={{ backgroundColor: theme.bgElevate, color: theme.text }}
                  value={typeof condition.value === 'string' || typeof condition.value === 'number' ? condition.value : String(condition.value)}
                  onChange={e => {
                    let value: string | number | boolean | string[] = e.target.value;
                    if (condition.dataType === 'number') value = Number(value);
                    if (condition.dataType === 'boolean') value = value === 'true';
                    if (condition.dataType === 'array') value = (value as string).split(',').map((s: string) => s.trim());
                    updateCondition(group.id, condition.id, { value });
                  }}
                />

                {/* Remove Condition Button */}
                <div className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCondition(group.id, condition.id)}
                    className="text-xs"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => addConditionToGroup(group.id)}
              className="w-full text-xs"
            >
              Add Condition to Group
            </Button>
          </div>
        ))}

        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddConditionGroup}
            className="text-sm"
            style={{ color: theme.accent, borderColor: theme.accent }}
          >
            + Add Condition Group
          </Button>
        </div>

        <Separator />

        {/* Paths */}
        <div>
          <h4 className="text-sm font-medium mb-2" style={{ color: theme.text }}>
            Paths
          </h4>
          <p className="text-xs" style={{ color: theme.textSecondary }}>
            Define the actions to take when conditions are met or not met.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm" style={{ color: theme.textSecondary }}>
              True Path Label
            </label>
            <Input
              value={nodeData.truePath?.label || ""}
              onChange={(e) => handleFieldChange('truePath', { ...nodeData.truePath, label: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm" style={{ color: theme.textSecondary }}>
              True Path Description
            </label>
            <textarea
              value={nodeData.truePath?.description || ""}
              onChange={(e) => handleFieldChange('truePath', { ...nodeData.truePath, description: e.target.value })}
              className="mt-1 w-full h-20 px-3 py-2 rounded border bg-transparent resize-none"
              style={{
                borderColor: theme.border,
                color: theme.text,
              }}
              placeholder="Enter description for the true path..."
            />
          </div>

          <div>
            <label className="text-sm" style={{ color: theme.textSecondary }}>
              False Path Label
            </label>
            <Input
              value={nodeData.falsePath?.label || ""}
              onChange={(e) => handleFieldChange('falsePath', { ...nodeData.falsePath, label: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm" style={{ color: theme.textSecondary }}>
              False Path Description
            </label>
            <textarea
              value={nodeData.falsePath?.description || ""}
              onChange={(e) => handleFieldChange('falsePath', { ...nodeData.falsePath, description: e.target.value })}
              className="mt-1 w-full h-20 px-3 py-2 rounded border bg-transparent resize-none"
              style={{
                borderColor: theme.border,
                color: theme.text,
              }}
              placeholder="Enter description for the false path..."
            />
          </div>
        </div>

        {/* Test Data */}
        <div>
          <label className="text-sm" style={{ color: theme.textSecondary }}>
            Test Data
          </label>
          <textarea
            className="w-full px-3 py-2 text-sm rounded resize-none border-0"
            style={{ backgroundColor: theme.bgElevate, color: theme.text }}
            rows={4}
            placeholder={`{\n  "user_message": "I need help with my order",\n  "confidence_score": 0.85,\n  "user_tier": "premium",\n  "sentiment": "neutral"\n}`}
            value={JSON.stringify(nodeData.testData || {}, null, 2)}
            onChange={e => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleFieldChange('testData', parsed);
              } catch {
                // Invalid JSON, keep the text but don't update
              }
            }}
          />
        </div>

        {/* Evaluation Mode */}
        <div>
          <label className="text-sm" style={{ color: theme.textSecondary }}>
            Evaluation Mode
          </label>
          <select
            value={nodeData.evaluationMode}
            onChange={(e) => handleFieldChange('evaluationMode', e.target.value)}
            className="mt-1 bg-transparent border rounded px-3 py-1 text-sm"
            style={{ borderColor: theme.border, color: theme.text }}
          >
            <option value="strict">Strict</option>
            <option value="fuzzy">Fuzzy</option>
            <option value="llm_assisted">LLM Assisted</option>
          </select>
        </div>

        {/* LLM Model */}
        <div>
          <label className="text-sm" style={{ color: theme.textSecondary }}>
            LLM Model
          </label>
          <select
            value={nodeData.llmModel}
            onChange={(e) => handleFieldChange('llmModel', e.target.value)}
            className="mt-1 bg-transparent border rounded px-3 py-1 text-sm"
            style={{ borderColor: theme.border, color: theme.text }}
          >
            <option value="gemini-pro">Gemini Pro</option>
            <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</option>
          </select>
        </div>
      </div>
    );
  };

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
