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
  AgentNodeData,
  CanvasNode,
  TestCaseNodeData,
  PromptTemplateNodeData,
  KnowledgeBaseNodeData,
  IfElseNodeData,
  DecisionTreeNodeData,
  StateMachineNodeData,
  ConversationFlowNodeData,
  SimulatorNodeData,
  DashboardNodeData,
  ChatNodeData
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
import TestCasePropertiesPanel from "./propertiesPanels/TestCasePropertiesPanel";
import DashboardPropertiesPanel from "./propertiesPanels/DashboardPropertiesPanel";
import ChatInterfacePropertiesPanel from "./propertiesPanels/ChatInterfacePropertiesPanel";

interface PropertiesPanelProps {
  selectedNode: CanvasNode | null;
  onChange: (updatedNode: CanvasNode) => void;
  isTesting?: boolean;
}

const TOOL_PRESETS = [
  { label: "Web Search", value: "web-search" },
  { label: "Calculator", value: "calculator" },
  { label: "Code Executor", value: "code-executor" },
];

const panelClass =
  "bg-[#1e1e1e] border border-[#3e3e42] rounded-2xl shadow-lg text-[#e6e6e6] min-w-[280px] max-w-[600px] h-screen min-h-0 flex flex-col px-8 py-7 font-sans overflow-y-auto space-y-8 resize-x";
const headerClass =
  "text-xl font-bold mb-6 pb-2 border-b-2 border-[#00c4ff] tracking-tight flex items-center gap-2";
const labelClass =
  "block text-sm font-semibold text-[#7f7f7f] uppercase mb-2 mt-6 tracking-wider";
const inputClass =
  "w-full px-3 py-2 rounded-lg bg-[#23272e] border border-[#252525] text-[#e6e6e6] placeholder-[#7f7f7f] focus:outline-none focus:border-[#00c4ff] focus:ring-2 focus:ring-[#00c4ff33] transition disabled:opacity-60 font-sans";
const sectionClass =
  "mb-7 pb-3 border-b border-[#252525] last:border-b-0 last:mb-0 last:pb-0";
const noNodeClass =
  "flex flex-col items-center justify-center h-full text-[#7f7f7f] text-base p-10 font-sans";
const errorClass =
  "border-[#ef4444] text-[#ef4444] focus:border-[#ef4444] focus:ring-[#ef444455]";

import { useState } from "react";
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";
import { Input } from "./ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  InfoIcon,
  RotateCwIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  XCircleIcon,
  DownloadIcon,
  UploadIcon,
  HistoryIcon,
  SparklesIcon,
} from "lucide-react";

function isTestCaseNodeData(data: unknown): data is TestCaseNodeData {
  return (
    typeof data === "object" &&
    data !== null &&
    ("input" in data || "expectedOutput" in data)
  );
}

export default function PropertiesPanel({
  selectedNode,
  onChange,
  isTesting,
}: PropertiesPanelProps) {
  // --- State Hooks (top-level only) ---
  const [sections, setSections] = useState({
    basic: true,
    behavior: false,
    system: false,
    flow: false,
    advanced: false,
  });
  const [preset, setPreset] = useState<string>("");
  const [personalityTags, setPersonalityTags] = useState<string[]>(() => {
    if (
      selectedNode?.type === "agent" &&
      (selectedNode.data as AgentNodeData)?.personality
    ) {
      return (selectedNode.data as AgentNodeData)
        .personality!.split(",")
        .map((t: string) => t.trim())
        .filter(Boolean);
    }
    return [];
  });
  const [promptRows, setPromptRows] = useState(2);

  // --- Helper Functions ---
  const toggleSection = (key: keyof typeof sections) =>
    setSections((s) => ({ ...s, [key]: !s[key] }));
  const handleFieldChange = (field: string, value: unknown) => {
    if (selectedNode && isTestCaseNodeData(selectedNode.data)) {
      onChange({
        ...selectedNode,
        data: {
          ...selectedNode.data,
          [field]: value,
        } as TestCaseNodeData,
      });
    }
  };
  const addTag = (tag: string) => {
    if (!personalityTags.includes(tag)) {
      const next = [...personalityTags, tag];
      setPersonalityTags(next);
      handleFieldChange("personality", next.join(", "));
    }
  };
  const removeTag = (tag: string) => {
    const next = personalityTags.filter((t) => t !== tag);
    setPersonalityTags(next);
    handleFieldChange("personality", next.join(", "));
  };
  const isModified = (_field: string) => false; // Placeholder: implement if you add default comparison
  const handleReset = (_field: string) => {}; // Placeholder

  // --- State Indicator Icon ---
  const StateDot = ({
    state,
  }: {
    state: "modified" | "valid" | "warn" | "error" | null;
  }) => {
    if (state === "modified")
      return (
        <span
          className="inline-block w-2 h-2 rounded-full bg-[#00c4ff] ml-1 align-middle"
          title="Modified"
        />
      );
    if (state === "valid")
      return (
        <CheckCircle2Icon className="inline w-4 h-4 text-green-400 ml-1 align-middle" />
      );
    if (state === "warn")
      return (
        <AlertTriangleIcon className="inline w-4 h-4 text-yellow-400 ml-1 align-middle" />
      );
    if (state === "error")
      return (
        <XCircleIcon className="inline w-4 h-4 text-red-400 ml-1 align-middle" />
      );
    return null;
  };

  // --- Section Helper ---
  function Section({
    title,
    open,
    onToggle,
    children,
  }: {
    title: string;
    open: boolean;
    onToggle: () => void;
    children: React.ReactNode;
  }) {
    return (
      <div className="mb-7 pb-3 border-b border-[#252525] last:border-b-0 last:mb-0 last:pb-0">
        <button
          className="flex items-center gap-2 w-full text-left select-none group"
          onClick={onToggle}
          type="button"
        >
          <span className="uppercase text-[#858585] text-[11px] tracking-widest font-semibold group-hover:text-[#00c4ff] transition-colors">
            {title}
          </span>
          {open ? (
            <ChevronUpIcon className="w-4 h-4 ml-1 text-[#858585] group-hover:text-[#00c4ff]" />
          ) : (
            <ChevronDownIcon className="w-4 h-4 ml-1 text-[#858585] group-hover:text-[#00c4ff]" />
          )}
        </button>
        {open && <div className="pt-2 space-y-4">{children}</div>}
      </div>
    );
  }

  // --- Field Row Helper ---
  function FieldRow({
    label,
    help,
    example,
    modified,
    children,
  }: {
    label: string;
    help: string;
    example?: string;
    modified?: boolean;
    children: React.ReactNode;
  }) {
    return (
      <div className="mb-2">
        <div className="flex items-center gap-2 mb-1">
          <span className="block text-[12px] font-semibold text-[#969696] uppercase tracking-wider">
            {label}
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="text-[#858585] hover:text-[#00c4ff]"
                tabIndex={-1}
              >
                <InfoIcon className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {help}
              {example && (
                <>
                  <br />
                  <span className="text-[#00c4ff]">{example}</span>
                </>
              )}
            </TooltipContent>
          </Tooltip>
          {modified && <StateDot state="modified" />}
        </div>
        <div className="flex items-center gap-2 w-full">{children}</div>
      </div>
    );
  }

  // --- Reset Button Helper ---
  function ResetBtn({ onClick }: { onClick: () => void }) {
    return (
      <button
        className="ml-2 px-2 py-1 rounded bg-[#23272e] border border-[#00c4ff] text-[#00c4ff] text-xs hover:bg-[#00c4ff] hover:text-[#1e1e1e] transition"
        onClick={onClick}
      >
        <RotateCwIcon className="w-3.5 h-3.5" />
      </button>
    );
  }

  // --- No node selected ---
  if (!selectedNode) {
    return (
      <div
        className={
          panelClass +
          " flex flex-col items-center justify-center h-full text-[#7f7f7f] text-base p-10 font-sans"
        }
      >
        <div className="text-2xl mb-2">🛈</div>
        <div>No node selected</div>
        <div className="text-xs mt-2 text-vscode-textSecondary">
          Select a node to view and edit its properties.
        </div>
      </div>
    );
  }

  // --- TOOL AGENT NODE TYPE ---
  if (selectedNode.type === "agent" && selectedNode.subtype === "tool-agent") {
    // If you have a ToolAgentPropertiesPanel, import and use it here
    // return (
    //   <div className={panelClass}>
    //     <ToolAgentPropertiesPanel node={selectedNode} onChange={onChange} />
    //   </div>
    // );
  }

  // --- AGENT NODE TYPE ---
  if (selectedNode.type === "agent") {
    return (
      <div className={panelClass}>
        <AgentPropertiesPanel node={selectedNode} onChange={onChange} />
      </div>
    );
  }

  // --- PROMPT TEMPLATE NODE TYPE ---
  if (isPromptTemplateNodeData(selectedNode.data)) {
    return (
      <div className={panelClass}>
        <PromptTemplatePropertiesPanel node={selectedNode} onChange={onChange} />
      </div>
    );
  }

  // --- KNOWLEDGE BASE NODE TYPE ---
  if (isKnowledgeBaseNodeData(selectedNode.data)) {
    return (
      <div className={panelClass}>
        <KnowledgeBasePropertiesPanel node={selectedNode} onChange={onChange} />
      </div>
    );
  }

  // --- IF/ELSE NODE TYPE ---
  if (isIfElseNodeData(selectedNode.data)) {
    return (
      <div className={panelClass}>
        <IfElsePropertiesPanel node={selectedNode} onChange={onChange} />
      </div>
    );
  }

  // --- DECISION TREE NODE TYPE ---
  if (isDecisionTreeNodeData(selectedNode.data)) {
    return (
      <div className={panelClass}>
        <DecisionTreePropertiesPanel node={selectedNode} onChange={onChange} />
      </div>
    );
  }

  // --- STATE MACHINE NODE TYPE ---
  if (isStateMachineNodeData(selectedNode.data)) {
    return (
      <div className={panelClass}>
        <StateMachinePropertiesPanel node={selectedNode} onChange={onChange} />
      </div>
    );
  }

// --- CONVERSATION FLOW NODE TYPE ---
  if (isConversationFlowNodeData(selectedNode.data)) {
    return (
      <div className={panelClass}>
        <ConversationFlowPropertiesPanel node={selectedNode as CanvasNode & { data: ConversationFlowNodeData }} onChange={onChange} />
      </div>
    );
  }

  // --- SIMULATOR NODE TYPE ---
  if (isSimulatorNodeData(selectedNode.data)) {
    return (
      <div className={panelClass}>
        <SimulatorPropertiesPanel node={selectedNode} onChange={onChange} />
      </div>
    );
  }

  // --- TEST CASE NODE TYPE ---
  if (isTestCaseNodeData(selectedNode.data)) {
    return (
      <div className={panelClass}>
        <TestCasePropertiesPanel node={selectedNode} onChange={onChange} />
      </div>
    );
  }

  // --- DASHBOARD NODE TYPE ---
  if (isDashboardNodeData(selectedNode.data)) {
    return (
      <div className={panelClass}>
        <DashboardPropertiesPanel node={selectedNode} onChange={onChange} />
      </div>
    );
  }

  // --- CHAT INTERFACE NODE TYPE ---
  if (isChatNodeData(selectedNode.data)) {
    return (
      <div className={panelClass}>
        <ChatInterfacePropertiesPanel node={selectedNode} onChange={onChange} />
      </div>
    );
  }

  // --- MESSAGE NODE TYPE ---
  if (isMessageNodeData(selectedNode.data)) {
    return (
      <div className={panelClass}>
        <MessagePropertiesPanel node={selectedNode} onChange={onChange} />
      </div>
    );
  }

  const data = selectedNode.data as AgentNodeData;
  const confidence =
    typeof data.confidenceThreshold === "number"
      ? data.confidenceThreshold
      : 80;
  const tagSuggestions = [
    "Friendly",
    "Helpful",
    "Concise",
    "Creative",
    "Formal",
  ];
  const presetOptions = [
    { label: "Default Agent", value: "default" },
    { label: "Creative Assistant", value: "creative" },
    { label: "Strict Rule Follower", value: "strict" },
    { label: "Conversational Bot", value: "convo" },
    { label: "Custom", value: "custom" },
  ];
  return (
    <div className={panelClass}>
      {/* Panel Header with Presets, Import/Export, Version */}
      <div className="flex items-center gap-3 mb-6 pb-2 border-b-2 border-[#00c4ff]">
        <span className="text-xl font-bold tracking-tight">
          Agent Properties
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="ml-1 text-[#858585] hover:text-[#00c4ff]">
              <InfoIcon className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            Configure all aspects of your agent node here. Most changes are
            saved instantly.
          </TooltipContent>
        </Tooltip>
        <div className="flex-1" />
        <Select value={preset} onValueChange={setPreset}>
          <SelectTrigger className="w-[150px] h-8 text-xs bg-[#23272e] border border-[#252525] rounded-md px-2">
            <SelectValue placeholder="Choose Preset" />
          </SelectTrigger>
          <SelectContent>
            {presetOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="ml-2">
              <UploadIcon className="w-4 h-4 text-[#858585] hover:text-[#00c4ff]" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            Import agent configuration (coming soon)
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="ml-1">
              <DownloadIcon className="w-4 h-4 text-[#858585] hover:text-[#00c4ff]" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            Export agent configuration (coming soon)
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="ml-1">
              <HistoryIcon className="w-4 h-4 text-[#858585] hover:text-[#00c4ff]" />
            </button>
          </TooltipTrigger>
          <TooltipContent>View version history (coming soon)</TooltipContent>
        </Tooltip>
      </div>

      {/* --- Basic Configuration Section --- */}
      <Section
        title="Basic Configuration"
        open={sections.basic}
        onToggle={() => toggleSection("basic")}
      >
        {/* Title */}
        <FieldRow
          label="Title"
          help="Short agent name"
          example="e.g. Support Bot"
          modified={isModified("title")}
        >
          <Input
            className="w-full px-3 py-2 rounded-lg bg-[#23272e] border border-[#252525] text-[#e6e6e6] placeholder-[#7f7f7f] focus:outline-none focus:border-[#00c4ff] focus:ring-2 focus:ring-[#00c4ff33] transition disabled:opacity-60 font-sans text-[13px]"
            value={data.title || ""}
            onChange={(e) => handleFieldChange("title", e.target.value)}
            disabled={isTesting}
            placeholder="Title"
          />
          {isModified("title") && (
            <ResetBtn onClick={() => handleReset("title")} />
          )}
        </FieldRow>
        {/* Description */}
        <FieldRow
          label="Description"
          help="What does this agent do?"
          example="e.g. Handles customer inquiries"
          modified={isModified("description")}
        >
          <textarea
            className="w-full px-3 py-2 rounded-lg bg-[#23272e] border border-[#252525] text-[#e6e6e6] placeholder-[#7f7f7f] focus:outline-none focus:border-[#00c4ff] focus:ring-2 focus:ring-[#00c4ff33] transition disabled:opacity-60 font-sans text-[13px] resize"
            value={data.description || ""}
            onChange={(e) => handleFieldChange("description", e.target.value)}
            disabled={isTesting}
            placeholder="Description"
            rows={2}
          />
          {isModified("description") && (
            <ResetBtn onClick={() => handleReset("description")} />
          )}
        </FieldRow>
        {/* Icon & Color (stub) */}
        <FieldRow
          label="Icon & Color"
          help="Agent icon and color"
          example="e.g. 🤖, #00c4ff"
        >
          <div className="flex gap-2 items-center opacity-60">
            (Coming soon)
          </div>
        </FieldRow>
      </Section>

      {/* --- Agent Behavior Section --- */}
      <Section
        title="Agent Behavior"
        open={sections.behavior}
        onToggle={() => toggleSection("behavior")}
      >
        {/* Personality (tag input) */}
        <FieldRow
          label="Personality"
          help="Add/remove agent traits"
          example="e.g. Friendly, Helpful"
          modified={isModified("personality")}
        >
          <div className="flex flex-wrap gap-2">
            {personalityTags.map((tag) => (
              <span
                key={tag}
                className="bg-[#23272e] border border-[#00c4ff] text-[#00c4ff] rounded-full px-3 py-1 text-xs flex items-center gap-1"
              >
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="ml-1 text-[#858585] hover:text-red-400 focus:outline-none"
                >
                  <XCircleIcon className="w-3 h-3" />
                </button>
              </span>
            ))}
            <input
              className="bg-transparent border-none outline-none text-xs text-[#e6e6e6] placeholder-[#7f7f7f] w-24"
              placeholder="Add trait..."
              value={""}
              onChange={(e) => {
                const v = e.target.value.trim();
                if (v && !personalityTags.includes(v) && v.length < 20) {
                  addTag(v);
                  e.target.value = "";
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.currentTarget.value.trim()) {
                  addTag(e.currentTarget.value.trim());
                  e.currentTarget.value = "";
                }
              }}
              disabled={isTesting}
            />
            {/* Suggestions */}
            {tagSuggestions
              .filter((s) => !personalityTags.includes(s))
              .map((s) => (
                <button
                  key={s}
                  onClick={() => addTag(s)}
                  className="bg-[#23272e] border border-[#252525] text-[#7f7f7f] rounded-full px-2 py-1 text-xs hover:border-[#00c4ff] hover:text-[#00c4ff] ml-1"
                  disabled={isTesting}
                >
                  {s}
                </button>
              ))}
          </div>
          {isModified("personality") && (
            <ResetBtn onClick={() => handleReset("personality")} />
          )}
        </FieldRow>
        {/* Response Style (stub) */}
        <FieldRow
          label="Response Style"
          help="Formal, friendly, concise, etc."
          example="e.g. Formal"
        >
          <div className="flex gap-2 items-center opacity-60">
            (Coming soon)
          </div>
        </FieldRow>
        {/* Knowledge Domains (stub) */}
        <FieldRow
          label="Knowledge Domains"
          help="Areas of expertise"
          example="e.g. HR, Finance"
        >
          <div className="flex gap-2 items-center opacity-60">
            (Coming soon)
          </div>
        </FieldRow>
      </Section>

      {/* --- System Instructions Section --- */}
      <Section
        title="System Instructions"
        open={sections.system}
        onToggle={() => toggleSection("system")}
      >
        {/* System Prompt (expandable textarea) */}
        <FieldRow
          label="System Prompt"
          help="Instructions for the LLM"
          example="e.g. You are an expert assistant."
          modified={isModified("systemPrompt")}
        >
          <div className="relative w-full">
            <textarea
              className="w-full px-3 py-2 rounded-lg bg-[#23272e] border border-[#252525] text-[#e6e6e6] placeholder-[#7f7f7f] focus:outline-none focus:border-[#00c4ff] focus:ring-2 focus:ring-[#00c4ff33] transition disabled:opacity-60 font-mono text-[13px] resize"
              value={data.systemPrompt || ""}
              onChange={(e) =>
                handleFieldChange("systemPrompt", e.target.value)
              }
              disabled={isTesting}
              placeholder="System Prompt"
              rows={promptRows}
              onFocus={() => setPromptRows(8)}
              onBlur={() => setPromptRows(2)}
            />
            <button
              className="absolute top-2 right-2 text-[#858585] hover:text-[#00c4ff]"
              onClick={() => setPromptRows((r) => (r === 2 ? 8 : 2))}
            >
              <SparklesIcon className="w-4 h-4" />
            </button>
          </div>
          {isModified("systemPrompt") && (
            <ResetBtn onClick={() => handleReset("systemPrompt")} />
          )}
        </FieldRow>
        {/* Context Handling (stub) */}
        <FieldRow
          label="Context Handling"
          help="How agent manages context"
          example="e.g. Windowed memory"
        >
          <div className="flex gap-2 items-center opacity-60">
            (Coming soon)
          </div>
        </FieldRow>
        {/* Memory Settings (stub) */}
        <FieldRow
          label="Memory Settings"
          help="Short/long-term memory"
          example="e.g. 10 turns"
        >
          <div className="flex gap-2 items-center opacity-60">
            (Coming soon)
          </div>
        </FieldRow>
      </Section>

      {/* --- Flow Control Section --- */}
      <Section
        title="Flow Control"
        open={sections.flow}
        onToggle={() => toggleSection("flow")}
      >
        {/* Confidence Threshold (slider) */}
        <FieldRow
          label="Confidence Threshold"
          help="LLM must be this confident to proceed"
          example="e.g. 80%"
          modified={isModified("confidenceThreshold")}
        >
          <div className="flex items-center gap-4 w-full">
            <input
              type="range"
              min={0}
              max={100}
              value={confidence}
              onChange={(e) =>
                handleFieldChange(
                  "confidenceThreshold",
                  Number(e.target.value)
                )
              }
              className="w-full accent-[#00c4ff]"
              disabled={isTesting}
            />
            <span className="w-12 text-right text-[13px] text-[#e6e6e6]">
              {confidence}%
            </span>
            {isModified("confidenceThreshold") && (
              <ResetBtn onClick={() => handleReset("confidenceThreshold")} />
            )}
          </div>
        </FieldRow>
        {/* Escalation Logic (stub) */}
        <FieldRow
          label="Escalation Logic"
          help="Rules for escalation"
          example="e.g. If confidence < 60%"
        >
          <div className="flex gap-2 items-center opacity-60">
            (Visual rule builder coming soon)
          </div>
        </FieldRow>
        {/* Timeout Settings (stub) */}
        <FieldRow
          label="Timeout Settings"
          help="Max time to wait"
          example="e.g. 30s"
        >
          <div className="flex gap-2 items-center opacity-60">
            (Coming soon)
          </div>
        </FieldRow>
      </Section>

      {/* --- Advanced Settings Section --- */}
      <Section
        title="Advanced Settings"
        open={sections.advanced}
        onToggle={() => toggleSection("advanced")}
      >
        {/* Model (dropdown) */}
        <FieldRow
          label="Model"
          help="Gemini model to use"
          example="e.g. gemini-2.5-flash-lite"
          modified={isModified("model")}
        >
          <Select
            value={data.model || ""}
            onValueChange={(v) => handleFieldChange("model", v)}
          >
            <SelectTrigger className="w-full h-9 text-[13px] bg-[#23272e] border border-[#252525] rounded-md px-2">
              <SelectValue placeholder="Choose model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gemini-2.5-flash-lite">
                gemini-2.5-flash-lite
              </SelectItem>
              <SelectItem value="gemini-pro">gemini-pro</SelectItem>
              <SelectItem value="gemini-1.5-flash">
                gemini-1.5-flash
              </SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
          {isModified("model") && (
            <ResetBtn onClick={() => handleReset("model")} />
          )}
        </FieldRow>
        {/* Temperature/Creativity (stub) */}
        <FieldRow
          label="Temperature/Creativity"
          help="LLM randomness"
          example="e.g. 0.7"
        >
          <div className="flex gap-2 items-center opacity-60">
            (Slider coming soon)
          </div>
        </FieldRow>
        {/* Token Limits (stub) */}
        <FieldRow
          label="Token Limits"
          help="Max LLM tokens"
          example="e.g. 2048"
        >
          <div className="flex gap-2 items-center opacity-60">
            (Coming soon)
          </div>
        </FieldRow>
        {/* Output Formatting (stub) */}
        <FieldRow
          label="Output Formatting"
          help="Format of agent output"
          example="e.g. JSON, Markdown"
        >
          <div className="flex gap-2 items-center opacity-60">
            (Coming soon)
          </div>
        </FieldRow>
      </Section>
    </div>
  );

  // --- OTHER NODE TYPES ---
  return (
    <div
      className={
        panelClass +
        " flex flex-col items-center justify-center h-full text-[#7f7f7f] text-base p-10 font-sans"
      }
    >
      <div className="text-2xl mb-2">🛈</div>
      <div>No configurable properties for this node type.</div>
    </div>
  );
}

// TODO: Add unit tests for this panel to ensure type safety and prevent regressions.
// TODO: Add unit tests for this panel to ensure type safety and prevent regressions.
