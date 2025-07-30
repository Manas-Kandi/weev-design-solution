"use client";

import React from "react";
import {
  AgentNodeData,
  ToolAgentNodeData,
  PromptTemplateNodeData,
  CanvasNode,
} from "@/types";

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
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "./ui/select";
import { Button } from "./ui/button";
import { ChevronDownIcon, ChevronUpIcon, InfoIcon, RotateCwIcon, CheckCircle2Icon, AlertTriangleIcon, XCircleIcon, DownloadIcon, UploadIcon, HistoryIcon, SparklesIcon } from "lucide-react";

export default function PropertiesPanel({ selectedNode, onChange, isTesting }: PropertiesPanelProps) {
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
    if (selectedNode?.type === "agent" && (selectedNode.data as AgentNodeData)?.personality) {
      return (selectedNode.data as AgentNodeData).personality!.split(",").map((t: string) => t.trim()).filter(Boolean);
    }
    return [];
  });
  const [promptRows, setPromptRows] = useState(2);

  // --- Helper Functions ---
  const toggleSection = (key: keyof typeof sections) => setSections(s => ({ ...s, [key]: !s[key] }));
  const handleFieldChange = (field: string, value: unknown) => {
    if (!selectedNode) return;
    onChange({ ...selectedNode, data: { ...selectedNode.data, [field]: value } });
  };
  const addTag = (tag: string) => {
    if (!personalityTags.includes(tag)) {
      const next = [...personalityTags, tag];
      setPersonalityTags(next);
      handleFieldChange("personality", next.join(", "));
    }
  };
  const removeTag = (tag: string) => {
    const next = personalityTags.filter(t => t !== tag);
    setPersonalityTags(next);
    handleFieldChange("personality", next.join(", "));
  };
  const isModified = (_field: string) => false; // Placeholder: implement if you add default comparison
  const handleReset = (_field: string) => {}; // Placeholder

  // --- State Indicator Icon ---
  const StateDot = ({ state }: { state: "modified" | "valid" | "warn" | "error" | null }) => {
    if (state === "modified") return <span className="inline-block w-2 h-2 rounded-full bg-[#00c4ff] ml-1 align-middle" title="Modified" />;
    if (state === "valid") return <CheckCircle2Icon className="inline w-4 h-4 text-green-400 ml-1 align-middle" title="Valid" />;
    if (state === "warn") return <AlertTriangleIcon className="inline w-4 h-4 text-yellow-400 ml-1 align-middle" title="Warning" />;
    if (state === "error") return <XCircleIcon className="inline w-4 h-4 text-red-400 ml-1 align-middle" title="Error" />;
    return null;
  };

  // --- Section Helper ---
  function Section({ title, open, onToggle, children }: { title: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
    return (
      <div className="mb-7 pb-3 border-b border-[#252525] last:border-b-0 last:mb-0 last:pb-0">
        <button className="flex items-center gap-2 w-full text-left select-none group" onClick={onToggle} type="button">
          <span className="uppercase text-[#858585] text-[11px] tracking-widest font-semibold group-hover:text-[#00c4ff] transition-colors">{title}</span>
          {open ? <ChevronUpIcon className="w-4 h-4 ml-1 text-[#858585] group-hover:text-[#00c4ff]" /> : <ChevronDownIcon className="w-4 h-4 ml-1 text-[#858585] group-hover:text-[#00c4ff]" />}
        </button>
        {open && <div className="pt-2 space-y-4">{children}</div>}
      </div>
    );
  }

  // --- Field Row Helper ---
  function FieldRow({ label, help, example, modified, children }: { label: string; help: string; example?: string; modified?: boolean; children: React.ReactNode }) {
    return (
      <div className="mb-2">
        <div className="flex items-center gap-2 mb-1">
          <span className="block text-[12px] font-semibold text-[#969696] uppercase tracking-wider">{label}</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-[#858585] hover:text-[#00c4ff]" tabIndex={-1}><InfoIcon className="w-3.5 h-3.5" /></button>
            </TooltipTrigger>
            <TooltipContent>{help}{example && <><br /><span className="text-[#00c4ff]">{example}</span></>}</TooltipContent>
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
      <button className="ml-2 px-2 py-1 rounded bg-[#23272e] border border-[#00c4ff] text-[#00c4ff] text-xs hover:bg-[#00c4ff] hover:text-[#1e1e1e] transition" onClick={onClick}><RotateCwIcon className="w-3.5 h-3.5" /></button>
    );
  }

  // --- No node selected ---
  if (!selectedNode) {
    return (
      <div className={panelClass + " flex flex-col items-center justify-center h-full text-[#7f7f7f] text-base p-10 font-sans"}>
        <div className="text-2xl mb-2">🛈</div>
        <div>No node selected</div>
        <div className="text-xs mt-2 text-vscode-textSecondary">Select a node to view and edit its properties.</div>
      </div>
    );
  }

  // --- AGENT NODE TYPE ---
  if (selectedNode.type === "agent") {
    const data = selectedNode.data as AgentNodeData;
    const confidence = typeof data.confidenceThreshold === "number" ? data.confidenceThreshold : 80;
    const tagSuggestions = ["Friendly", "Helpful", "Concise", "Creative", "Formal"];
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
          <span className="text-xl font-bold tracking-tight">Agent Properties</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="ml-1 text-[#858585] hover:text-[#00c4ff]">
                <InfoIcon className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Configure all aspects of your agent node here. Most changes are saved instantly.</TooltipContent>
          </Tooltip>
          <div className="flex-1" />
          <Select value={preset} onValueChange={setPreset}>
            <SelectTrigger className="w-[150px] h-8 text-xs bg-[#23272e] border border-[#252525] rounded-md px-2">
              <SelectValue placeholder="Choose Preset" />
            </SelectTrigger>
            <SelectContent>
              {presetOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="ml-2"><UploadIcon className="w-4 h-4 text-[#858585] hover:text-[#00c4ff]" /></button>
            </TooltipTrigger>
            <TooltipContent>Import agent configuration (coming soon)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="ml-1"><DownloadIcon className="w-4 h-4 text-[#858585] hover:text-[#00c4ff]" /></button>
            </TooltipTrigger>
            <TooltipContent>Export agent configuration (coming soon)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="ml-1"><HistoryIcon className="w-4 h-4 text-[#858585] hover:text-[#00c4ff]" /></button>
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
          <FieldRow label="Title" help="Short agent name" example="e.g. Support Bot" modified={isModified("title")}>
            <Input
              className="w-full px-3 py-2 rounded-lg bg-[#23272e] border border-[#252525] text-[#e6e6e6] placeholder-[#7f7f7f] focus:outline-none focus:border-[#00c4ff] focus:ring-2 focus:ring-[#00c4ff33] transition disabled:opacity-60 font-sans"
              value={data.title || ""}
              onChange={e => handleFieldChange("title", e.target.value)}
              disabled={isTesting}
              placeholder="Title"
            />
            {isModified("title") && <ResetBtn onClick={() => handleReset("title")} />}
          </FieldRow>
          {/* Description */}
          <FieldRow label="Description" help="What does this agent do?" example="e.g. Handles customer inquiries" modified={isModified("description")}>
            <textarea
              className="w-full px-3 py-2 rounded-lg bg-[#23272e] border border-[#252525] text-[#e6e6e6] placeholder-[#7f7f7f] focus:outline-none focus:border-[#00c4ff] focus:ring-2 focus:ring-[#00c4ff33] transition disabled:opacity-60 font-sans"
              value={data.description || ""}
              onChange={e => handleFieldChange("description", e.target.value)}
              disabled={isTesting}
              placeholder="Description"
              rows={2}
            />
            {isModified("description") && <ResetBtn onClick={() => handleReset("description")} />}
          </FieldRow>
          {/* Icon & Color (stub) */}
          <FieldRow label="Icon & Color" help="Agent icon and color" example="e.g. 🤖, #00c4ff">
            <div className="flex gap-2 items-center opacity-60">(Coming soon)</div>
          </FieldRow>
        </Section>

        {/* --- Agent Behavior Section --- */}
        <Section
          title="Agent Behavior"
          open={sections.behavior}
          onToggle={() => toggleSection("behavior")}
        >
          {/* Personality (tag input) */}
          <FieldRow label="Personality" help="Add/remove agent traits" example="e.g. Friendly, Helpful" modified={isModified("personality")}>
            <div className="flex flex-wrap gap-2">
              {personalityTags.map(tag => (
                <span key={tag} className="bg-[#23272e] border border-[#00c4ff] text-[#00c4ff] rounded-full px-3 py-1 text-xs flex items-center gap-1">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="ml-1 text-[#858585] hover:text-red-400 focus:outline-none"><XCircleIcon className="w-3 h-3" /></button>
                </span>
              ))}
              <input
                className="bg-transparent border-none outline-none text-xs text-[#e6e6e6] placeholder-[#7f7f7f] w-24"
                placeholder="Add trait..."
                value={""}
                onChange={e => {
                  const v = e.target.value.trim();
                  if (v && !personalityTags.includes(v) && v.length < 20) {
                    addTag(v);
                    e.target.value = "";
                  }
                }}
                onKeyDown={e => {
                  if (e.key === "Enter" && e.currentTarget.value.trim()) {
                    addTag(e.currentTarget.value.trim());
                    e.currentTarget.value = "";
                  }
                }}
                disabled={isTesting}
              />
              {/* Suggestions */}
              {tagSuggestions.filter(s => !personalityTags.includes(s)).map(s => (
                <button key={s} onClick={() => addTag(s)} className="bg-[#23272e] border border-[#252525] text-[#7f7f7f] rounded-full px-2 py-1 text-xs hover:border-[#00c4ff] hover:text-[#00c4ff] ml-1" disabled={isTesting}>{s}</button>
              ))}
            </div>
            {isModified("personality") && <ResetBtn onClick={() => handleReset("personality")} />}
          </FieldRow>
          {/* Response Style (stub) */}
          <FieldRow label="Response Style" help="Formal, friendly, concise, etc." example="e.g. Formal">
            <div className="flex gap-2 items-center opacity-60">(Coming soon)</div>
          </FieldRow>
          {/* Knowledge Domains (stub) */}
          <FieldRow label="Knowledge Domains" help="Areas of expertise" example="e.g. HR, Finance">
            <div className="flex gap-2 items-center opacity-60">(Coming soon)</div>
          </FieldRow>
        </Section>

        {/* --- System Instructions Section --- */}
        <Section
          title="System Instructions"
          open={sections.system}
          onToggle={() => toggleSection("system")}
        >
          {/* System Prompt (expandable textarea) */}
          <FieldRow label="System Prompt" help="Instructions for the LLM" example="e.g. You are an expert assistant." modified={isModified("systemPrompt")}>
            <div className="relative w-full">
              <textarea
                className="w-full px-3 py-2 rounded-lg bg-[#23272e] border border-[#252525] text-[#e6e6e6] placeholder-[#7f7f7f] focus:outline-none focus:border-[#00c4ff] focus:ring-2 focus:ring-[#00c4ff33] transition disabled:opacity-60 font-mono"
                value={data.systemPrompt || ""}
                onChange={e => handleFieldChange("systemPrompt", e.target.value)}
                disabled={isTesting}
                placeholder="System Prompt"
                rows={promptRows}
                onFocus={() => setPromptRows(8)}
                onBlur={() => setPromptRows(2)}
              />
              <button className="absolute top-2 right-2 text-[#858585] hover:text-[#00c4ff]" onClick={() => setPromptRows(r => r === 2 ? 8 : 2)}>
                <SparklesIcon className="w-4 h-4" />
              </button>
            </div>
            {isModified("systemPrompt") && <ResetBtn onClick={() => handleReset("systemPrompt")} />}
          </FieldRow>
          {/* Context Handling (stub) */}
          <FieldRow label="Context Handling" help="How agent manages context" example="e.g. Windowed memory">
            <div className="flex gap-2 items-center opacity-60">(Coming soon)</div>
          </FieldRow>
          {/* Memory Settings (stub) */}
          <FieldRow label="Memory Settings" help="Short/long-term memory" example="e.g. 10 turns">
            <div className="flex gap-2 items-center opacity-60">(Coming soon)</div>
          </FieldRow>
        </Section>

        {/* --- Flow Control Section --- */}
        <Section
          title="Flow Control"
          open={sections.flow}
          onToggle={() => toggleSection("flow")}
        >
          {/* Confidence Threshold (slider) */}
          <FieldRow label="Confidence Threshold" help="LLM must be this confident to proceed" example="e.g. 80%" modified={isModified("confidenceThreshold")}>
            <div className="flex items-center gap-4 w-full">
              <input
                type="range"
                min={0}
                max={100}
                value={confidence}
                onChange={e => handleFieldChange("confidenceThreshold", Number(e.target.value))}
                className="w-full accent-[#00c4ff]"
                disabled={isTesting}
              />
              <span className="w-12 text-right text-[13px] text-[#e6e6e6]">{confidence}%</span>
              {isModified("confidenceThreshold") && <ResetBtn onClick={() => handleReset("confidenceThreshold")} />}
            </div>
          </FieldRow>
          {/* Escalation Logic (stub) */}
          <FieldRow label="Escalation Logic" help="Rules for escalation" example="e.g. If confidence < 60%">
            <div className="flex gap-2 items-center opacity-60">(Visual rule builder coming soon)</div>
          </FieldRow>
          {/* Timeout Settings (stub) */}
          <FieldRow label="Timeout Settings" help="Max time to wait" example="e.g. 30s">
            <div className="flex gap-2 items-center opacity-60">(Coming soon)</div>
          </FieldRow>
        </Section>

        {/* --- Advanced Settings Section --- */}
        <Section
          title="Advanced Settings"
          open={sections.advanced}
          onToggle={() => toggleSection("advanced")}
        >
          {/* Model (dropdown) */}
          <FieldRow label="Model" help="Gemini model to use" example="e.g. gemini-2.5-flash-lite" modified={isModified("model")}>
            <Select value={data.model || ""} onValueChange={v => handleFieldChange("model", v)}>
              <SelectTrigger className="w-full h-9 text-[13px] bg-[#23272e] border border-[#252525] rounded-md px-2">
                <SelectValue placeholder="Choose model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini-2.5-flash-lite">gemini-2.5-flash-lite</SelectItem>
                <SelectItem value="gemini-pro">gemini-pro</SelectItem>
                <SelectItem value="gemini-1.5-flash">gemini-1.5-flash</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            {isModified("model") && <ResetBtn onClick={() => handleReset("model")} />}
          </FieldRow>
          {/* Temperature/Creativity (stub) */}
          <FieldRow label="Temperature/Creativity" help="LLM randomness" example="e.g. 0.7">
            <div className="flex gap-2 items-center opacity-60">(Slider coming soon)</div>
          </FieldRow>
          {/* Token Limits (stub) */}
          <FieldRow label="Token Limits" help="Max LLM tokens" example="e.g. 2048">
            <div className="flex gap-2 items-center opacity-60">(Coming soon)</div>
          </FieldRow>
          {/* Output Formatting (stub) */}
          <FieldRow label="Output Formatting" help="Format of agent output" example="e.g. JSON, Markdown">
            <div className="flex gap-2 items-center opacity-60">(Coming soon)</div>
          </FieldRow>
        </Section>
      </div>
    );
  }

  // --- OTHER NODE TYPES ---
  return (
    <div className={panelClass + " flex flex-col items-center justify-center h-full text-[#7f7f7f] text-base p-10 font-sans"}>
      <div className="text-2xl mb-2">🛈</div>
      <div>No configurable properties for this node type.</div>
    </div>
  );
}
    };
    // --- Preset Dropdown (UI only) ---
    const presetOptions = [
      { label: "Default Agent", value: "default" },
      { label: "Creative Assistant", value: "creative" },
      { label: "Strict Rule Follower", value: "strict" },
      { label: "Conversational Bot", value: "convo" },
      { label: "Custom", value: "custom" },
    ];
    // --- Tag Input for Personality ---
    const tagSuggestions = ["Friendly", "Helpful", "Concise", "Creative", "Formal"];
    const addTag = (tag: string) => {
      if (!personalityTags.includes(tag)) {
        const next = [...personalityTags, tag];
        setPersonalityTags(next);
        handleFieldChange("personality", next.join(", "));
      }
    };
    const removeTag = (tag: string) => {
      const next = personalityTags.filter(t => t !== tag);
      setPersonalityTags(next);
      handleFieldChange("personality", next.join(", "));
    };
    const StateDot = ({ state }: { state: "modified" | "valid" | "warn" | "error" | null }) => {
      if (state === "modified") return <span className="inline-block w-2 h-2 rounded-full bg-[#00c4ff] ml-1 align-middle" title="Modified" />;
      if (state === "valid") return <CheckCircle2Icon className="inline w-4 h-4 text-green-400 ml-1 align-middle" title="Valid" />;
      if (state === "warn") return <AlertTriangleIcon className="inline w-4 h-4 text-yellow-400 ml-1 align-middle" title="Warning" />;
      if (state === "error") return <XCircleIcon className="inline w-4 h-4 text-red-400 ml-1 align-middle" title="Error" />;
      return null;
    };
    return (
      <div className={panelClass}>
        {/* ... FULL AGENT PANEL CODE (as in previous implementation) ... */}
        {/* For brevity, keep all the advanced controls and sections here, but only for agent nodes */}
      </div>
    );
  }

  // --- OTHER NODE TYPES ---
  // For now, show a simple message; you can add per-type controls as needed.
  return (
    <div className={panelClass + " flex flex-col items-center justify-center h-full text-[#7f7f7f] text-base p-10 font-sans"}>
      <div className="text-2xl mb-2">🛈</div>
      <div>No configurable properties for this node type.</div>
    </div>
  );
}

  // Collapsible section state
  const [sections, setSections] = useState({
    basic: true,
    behavior: false,
    system: false,
    flow: false,
    advanced: false,
  });
  // Preset (UI only)
  const [preset, setPreset] = useState<string>("");
  // Tag input state (for personality)
  const [personalityTags, setPersonalityTags] = useState<string[]>(() => {
    if (selectedNode?.data?.personality) {
      return selectedNode.data.personality.split(",").map((t: string) => t.trim()).filter(Boolean);
    }
    return [];
  });
  // Confidence slider state
  const confidence = typeof selectedNode?.data?.confidence === "number" ? selectedNode.data.confidence : 80;
  // Expandable textarea (system prompt)
  const [promptRows, setPromptRows] = useState(2);
  // Helper: handle collapsible toggle
  const toggleSection = (key: keyof typeof sections) => setSections(s => ({ ...s, [key]: !s[key] }));
  // Helper: field modified state
  const isModified = (field: string) => selectedNode?.data?.[field] !== selectedNode?.defaultData?.[field];

  // Helper: reset field to default
  const handleReset = (field: string) => {
    if (!selectedNode?.defaultData) return;
    onChange({ ...selectedNode, data: { ...selectedNode.data, [field]: selectedNode.defaultData[field] } });
  };
  // Helper: field change
  const handleFieldChange = (field: string, value: unknown) => {
    if (!selectedNode) return;
    onChange({ ...selectedNode, data: { ...selectedNode.data, [field]: value } });
  };

  // --- Preset Dropdown (UI only) ---
  const presetOptions = [
    { label: "Default Agent", value: "default" },
    { label: "Creative Assistant", value: "creative" },
    { label: "Strict Rule Follower", value: "strict" },
    { label: "Conversational Bot", value: "convo" },
    { label: "Custom", value: "custom" },
  ];

  // --- Tag Input for Personality ---
  const tagSuggestions = ["Friendly", "Helpful", "Concise", "Creative", "Formal"];
  const addTag = (tag: string) => {
    if (!personalityTags.includes(tag)) {
      const next = [...personalityTags, tag];
      setPersonalityTags(next);
      handleFieldChange("personality", next.join(", "));
    }
  };
  const removeTag = (tag: string) => {
    const next = personalityTags.filter(t => t !== tag);
    setPersonalityTags(next);
    handleFieldChange("personality", next.join(", "));
  };

  // --- State Indicator Icon ---
  const StateDot = ({ state }: { state: "modified" | "valid" | "warn" | "error" | null }) => {
    if (state === "modified") return <span className="inline-block w-2 h-2 rounded-full bg-[#00c4ff] ml-1 align-middle" title="Modified" />;
    if (state === "valid") return <CheckCircle2Icon className="inline w-4 h-4 text-green-400 ml-1 align-middle" title="Valid" />;
    if (state === "warn") return <AlertTriangleIcon className="inline w-4 h-4 text-yellow-400 ml-1 align-middle" title="Warning" />;
    if (state === "error") return <XCircleIcon className="inline w-4 h-4 text-red-400 ml-1 align-middle" title="Error" />;
    return null;
  };

  // --- Panel Header with Presets, Import/Export, Version ---
  return (
    <div className={panelClass}>
      <div className="flex items-center gap-3 mb-6 pb-2 border-b-2 border-[#00c4ff]">
        <span className="text-xl font-bold tracking-tight">Agent Properties</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="ml-1 text-[#858585] hover:text-[#00c4ff]">
              <InfoIcon className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Configure all aspects of your agent node here. Most changes are saved instantly.</TooltipContent>
        </Tooltip>
        <div className="flex-1" />
        <Select value={preset} onValueChange={setPreset}>
          <SelectTrigger className="w-[150px] h-8 text-xs bg-[#23272e] border border-[#252525] rounded-md px-2">
            <SelectValue placeholder="Choose Preset" />
          </SelectTrigger>
          <SelectContent>
            {presetOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="ml-2"><UploadIcon className="w-4 h-4 text-[#858585] hover:text-[#00c4ff]" /></button>
          </TooltipTrigger>
          <TooltipContent>Import agent configuration (coming soon)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="ml-1"><DownloadIcon className="w-4 h-4 text-[#858585] hover:text-[#00c4ff]" /></button>
          </TooltipTrigger>
          <TooltipContent>Export agent configuration (coming soon)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="ml-1"><HistoryIcon className="w-4 h-4 text-[#858585] hover:text-[#00c4ff]" /></button>
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
        <FieldRow label="Title" help="Short agent name" example="e.g. Support Bot" modified={isModified("title")}> 
          <Input
            className="w-full px-3 py-2 rounded-lg bg-[#23272e] border border-[#252525] text-[#e6e6e6] placeholder-[#7f7f7f] focus:outline-none focus:border-[#00c4ff] focus:ring-2 focus:ring-[#00c4ff33] transition disabled:opacity-60 font-sans text-[13px]"
            value={selectedNode?.data?.title || ""}
            onChange={e => handleFieldChange("title", e.target.value)}
            disabled={isTesting}
            placeholder="Title"
          />
          {isModified("title") && <ResetBtn onClick={() => handleReset("title")} />}
        </FieldRow>
        {/* Description */}
        <FieldRow label="Description" help="What does this agent do?" example="e.g. Handles customer inquiries" modified={isModified("description")}> 
          <textarea
            className="w-full px-3 py-2 rounded-lg bg-[#23272e] border border-[#252525] text-[#e6e6e6] placeholder-[#7f7f7f] focus:outline-none focus:border-[#00c4ff] focus:ring-2 focus:ring-[#00c4ff33] transition disabled:opacity-60 font-sans text-[13px] resize"
            value={selectedNode?.data?.description || ""}
            onChange={e => handleFieldChange("description", e.target.value)}
            disabled={isTesting}
            placeholder="Description"
            rows={2}
          />
          {isModified("description") && <ResetBtn onClick={() => handleReset("description")} />}
        </FieldRow>
        {/* Icon & Color (stub) */}
        <FieldRow label="Icon & Color" help="Agent icon and color" example="e.g. 🤖, #00c4ff">
          <div className="flex gap-2 items-center opacity-60">(Coming soon)</div>
        </FieldRow>
      </Section>

      {/* --- Agent Behavior Section --- */}
      <Section
        title="Agent Behavior"
        open={sections.behavior}
        onToggle={() => toggleSection("behavior")}
      >
        {/* Personality (tag input) */}
        <FieldRow label="Personality" help="Add/remove agent traits" example="e.g. Friendly, Helpful" modified={isModified("personality")}> 
          <div className="flex flex-wrap gap-2">
            {personalityTags.map(tag => (
              <span key={tag} className="bg-[#23272e] border border-[#00c4ff] text-[#00c4ff] rounded-full px-3 py-1 text-xs flex items-center gap-1">
                {tag}
                <button onClick={() => removeTag(tag)} className="ml-1 text-[#858585] hover:text-red-400 focus:outline-none"><XCircleIcon className="w-3 h-3" /></button>
              </span>
            ))}
            <input
              className="bg-transparent border-none outline-none text-xs text-[#e6e6e6] placeholder-[#7f7f7f] w-24"
              placeholder="Add trait..."
              value={""}
              onChange={e => {
                const v = e.target.value.trim();
                if (v && !personalityTags.includes(v) && v.length < 20) {
                  addTag(v);
                  e.target.value = "";
                }
              }}
              onKeyDown={e => {
                if (e.key === "Enter" && e.currentTarget.value.trim()) {
                  addTag(e.currentTarget.value.trim());
                  e.currentTarget.value = "";
                }
              }}
              disabled={isTesting}
            />
            {/* Suggestions */}
            {tagSuggestions.filter(s => !personalityTags.includes(s)).map(s => (
              <button key={s} onClick={() => addTag(s)} className="bg-[#23272e] border border-[#252525] text-[#7f7f7f] rounded-full px-2 py-1 text-xs hover:border-[#00c4ff] hover:text-[#00c4ff] ml-1" disabled={isTesting}>{s}</button>
            ))}
          </div>
          {isModified("personality") && <ResetBtn onClick={() => handleReset("personality")} />}
        </FieldRow>
        {/* Response Style (stub) */}
        <FieldRow label="Response Style" help="Formal, friendly, concise, etc." example="e.g. Formal" >
          <div className="flex gap-2 items-center opacity-60">(Coming soon)</div>
        </FieldRow>
        {/* Knowledge Domains (stub) */}
        <FieldRow label="Knowledge Domains" help="Areas of expertise" example="e.g. HR, Finance">
          <div className="flex gap-2 items-center opacity-60">(Coming soon)</div>
        </FieldRow>
      </Section>

      {/* --- System Instructions Section --- */}
      <Section
        title="System Instructions"
        open={sections.system}
        onToggle={() => toggleSection("system")}
      >
        {/* System Prompt (expandable textarea) */}
        <FieldRow label="System Prompt" help="Instructions for the LLM" example="e.g. You are an expert assistant." modified={isModified("systemPrompt")}> 
          <div className="relative w-full">
            <textarea
              className="w-full px-3 py-2 rounded-lg bg-[#23272e] border border-[#252525] text-[#e6e6e6] placeholder-[#7f7f7f] focus:outline-none focus:border-[#00c4ff] focus:ring-2 focus:ring-[#00c4ff33] transition disabled:opacity-60 font-mono text-[13px] resize"
              value={selectedNode?.data?.systemPrompt || ""}
              onChange={e => handleFieldChange("systemPrompt", e.target.value)}
              disabled={isTesting}
              placeholder="System Prompt"
              rows={promptRows}
              onFocus={() => setPromptRows(8)}
              onBlur={() => setPromptRows(2)}
            />
            <button className="absolute top-2 right-2 text-[#858585] hover:text-[#00c4ff]" onClick={() => setPromptRows(r => r === 2 ? 8 : 2)}>
              <SparklesIcon className="w-4 h-4" />
            </button>
          </div>
          {isModified("systemPrompt") && <ResetBtn onClick={() => handleReset("systemPrompt")} />}
        </FieldRow>
        {/* Context Handling (stub) */}
        <FieldRow label="Context Handling" help="How agent manages context" example="e.g. Windowed memory">
          <div className="flex gap-2 items-center opacity-60">(Coming soon)</div>
        </FieldRow>
        {/* Memory Settings (stub) */}
        <FieldRow label="Memory Settings" help="Short/long-term memory" example="e.g. 10 turns">
          <div className="flex gap-2 items-center opacity-60">(Coming soon)</div>
        </FieldRow>
      </Section>

      {/* --- Flow Control Section --- */}
      <Section
        title="Flow Control"
        open={sections.flow}
        onToggle={() => toggleSection("flow")}
      >
        {/* Confidence Threshold (slider) */}
        <FieldRow label="Confidence Threshold" help="LLM must be this confident to proceed" example="e.g. 80%" modified={isModified("confidence")}> 
          <div className="flex items-center gap-4 w-full">
            <input
              type="range"
              min={0}
              max={100}
              value={confidence}
              onChange={e => handleFieldChange("confidence", Number(e.target.value))}
              className="w-full accent-[#00c4ff]"
              disabled={isTesting}
            />
            <span className="w-12 text-right text-[13px] text-[#e6e6e6]">{confidence}%</span>
            {isModified("confidence") && <ResetBtn onClick={() => handleReset("confidence")} />}
          </div>
        </FieldRow>
        {/* Escalation Logic (stub) */}
        <FieldRow label="Escalation Logic" help="Rules for escalation" example="e.g. If confidence < 60%" >
          <div className="flex gap-2 items-center opacity-60">(Visual rule builder coming soon)</div>
        </FieldRow>
        {/* Timeout Settings (stub) */}
        <FieldRow label="Timeout Settings" help="Max time to wait" example="e.g. 30s">
          <div className="flex gap-2 items-center opacity-60">(Coming soon)</div>
        </FieldRow>
      </Section>

      {/* --- Advanced Settings Section --- */}
      <Section
        title="Advanced Settings"
        open={sections.advanced}
        onToggle={() => toggleSection("advanced")}
      >
        {/* Model (dropdown) */}
        <FieldRow label="Model" help="Gemini model to use" example="e.g. gemini-2.5-flash-lite" modified={isModified("model")}> 
          <Select value={selectedNode?.data?.model || ""} onValueChange={v => handleFieldChange("model", v)}>
            <SelectTrigger className="w-full h-9 text-[13px] bg-[#23272e] border border-[#252525] rounded-md px-2">
              <SelectValue placeholder="Choose model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gemini-2.5-flash-lite">gemini-2.5-flash-lite</SelectItem>
              <SelectItem value="gemini-pro">gemini-pro</SelectItem>
              <SelectItem value="gemini-1.5-flash">gemini-1.5-flash</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
          {isModified("model") && <ResetBtn onClick={() => handleReset("model")} />}
        </FieldRow>
        {/* Temperature/Creativity (stub) */}
        <FieldRow label="Temperature/Creativity" help="LLM randomness" example="e.g. 0.7">
          <div className="flex gap-2 items-center opacity-60">(Slider coming soon)</div>
        </FieldRow>
        {/* Token Limits (stub) */}
        <FieldRow label="Token Limits" help="Max LLM tokens" example="e.g. 2048">
          <div className="flex gap-2 items-center opacity-60">(Coming soon)</div>
        </FieldRow>
        {/* Output Formatting (stub) */}
        <FieldRow label="Output Formatting" help="Format of agent output" example="e.g. JSON, Markdown">
          <div className="flex gap-2 items-center opacity-60">(Coming soon)</div>
        </FieldRow>
      </Section>
    </div>
  );

  // --- Collapsible Section Component ---
  function Section({ title, open, onToggle, children }: { title: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
    return (
      <div className="mb-7 pb-3 border-b border-[#252525] last:border-b-0 last:mb-0 last:pb-0">
        <button className="flex items-center gap-2 w-full text-left select-none group" onClick={onToggle} type="button">
          <span className="uppercase text-[#858585] text-[11px] tracking-widest font-semibold group-hover:text-[#00c4ff] transition-colors">{title}</span>
          {open ? <ChevronUpIcon className="w-4 h-4 ml-1 text-[#858585] group-hover:text-[#00c4ff]" /> : <ChevronDownIcon className="w-4 h-4 ml-1 text-[#858585] group-hover:text-[#00c4ff]" />}
        </button>
        {open && <div className="pt-2 space-y-4">{children}</div>}
      </div>
    );
  }

  // --- Field Row with Label, Tooltip, State Indicator, Reset ---
  function FieldRow({ label, help, example, modified, children }: { label: string; help: string; example?: string; modified?: boolean; children: React.ReactNode }) {
    return (
      <div className="mb-2">
        <div className="flex items-center gap-2 mb-1">
          <span className="block text-[12px] font-semibold text-[#969696] uppercase tracking-wider">{label}</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-[#858585] hover:text-[#00c4ff]" tabIndex={-1}><InfoIcon className="w-3.5 h-3.5" /></button>
            </TooltipTrigger>
            <TooltipContent>{help}{example && <><br /><span className="text-[#00c4ff]">{example}</span></>}</TooltipContent>
          </Tooltip>
          {modified && <StateDot state="modified" />}
        </div>
        <div className="flex items-center gap-2 w-full">{children}</div>
      </div>
    );
  }

  // --- Reset Button ---
  function ResetBtn({ onClick }: { onClick: () => void }) {
    return (
      <button className="ml-2 px-2 py-1 rounded bg-[#23272e] border border-[#00c4ff] text-[#00c4ff] text-xs hover:bg-[#00c4ff] hover:text-[#1e1e1e] transition" onClick={onClick}><RotateCwIcon className="w-3.5 h-3.5" /></button>
    );
  }
}

  if (!selectedNode) {
    return (
      <div className={panelClass + " " + noNodeClass}>
        <div className="text-2xl mb-2">🛈</div>
        <div>No node selected</div>
        <div className="text-xs mt-2 text-vscode-textSecondary">Select a node to view and edit its properties.</div>
      </div>
    );
  }

  const handleFieldChange = (field: string, value: unknown) => {
    if (!selectedNode) return;
    onChange({ ...selectedNode, data: { ...selectedNode.data, [field]: value } });
  };

  // --- Tool Agent Node ---
  if (selectedNode.type === "agent" && selectedNode.subtype === "tool-agent") {
    const data = selectedNode.data as ToolAgentNodeData;
    const toolConfig = data.toolConfig ?? { toolType: "" };
    return (
      <div className={panelClass}>
        <div className={headerClass}>Tool Agent Properties</div>
        <div className={sectionClass}>
          <label className={labelClass}>Tool Preset</label>
          <select
            className={inputClass}
            disabled={isTesting}
            value={toolConfig.toolType || ""}
            onChange={e => handleFieldChange("toolConfig", { ...toolConfig, toolType: e.target.value })}
          >
            <option value="">Select Tool</option>
            {TOOL_PRESETS.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        {toolConfig.toolType === "custom-api" && (
          <div className={sectionClass}>
            <label className={labelClass}>API Endpoint</label>
            <input
              className={inputClass}
              disabled={isTesting}
              value={toolConfig.endpoint || ""}
              onChange={e => handleFieldChange("toolConfig", { ...toolConfig, endpoint: e.target.value })}
              placeholder="API Endpoint"
            />
          </div>
        )}
        <div className={sectionClass}>
          <label className={labelClass}>User Prompt</label>
          <input
            className={inputClass}
            disabled={isTesting}
            value={data.prompt || ""}
            onChange={e => handleFieldChange("prompt", e.target.value)}
            placeholder="User Prompt"
          />
        </div>
      </div>
    );
  }

  // --- Agent Node ---
  if (selectedNode.type === "agent" && selectedNode.subtype !== "tool-agent") {
    const data = selectedNode.data as AgentNodeData;
    return (
      <div className={panelClass}>
        <div className={headerClass}>Agent Properties</div>

        {/* Basic Configuration */}
        <div>
          <div className="uppercase text-[#858585] text-[11px] tracking-widest border-b border-[#252525] pb-1 pt-2 mb-4 font-semibold">Basic Configuration</div>
          <div className={sectionClass}>
            <label className={labelClass}>Title</label>
            <input
              className={inputClass}
              disabled={isTesting}
              value={data.title || ""}
              onChange={e => handleFieldChange("title", e.target.value)}
              placeholder="Title"
            />
          </div>
          <div className={sectionClass}>
            <label className={labelClass}>Description</label>
            <textarea
              className={inputClass}
              disabled={isTesting}
              value={data.description || ""}
              onChange={e => handleFieldChange("description", e.target.value)}
              placeholder="Description"
              rows={2}
            />
          </div>
          {/* Icon & Color placeholder */}
          <div className={sectionClass}>
            {/* TODO: Icon & Color Picker */}
          </div>
        </div>

        {/* Agent Behavior */}
        <div>
          <div className="uppercase text-[#858585] text-[11px] tracking-widest border-b border-[#252525] pb-1 pt-2 mb-4 font-semibold">Agent Behavior</div>
          <div className={sectionClass}>
            <label className={labelClass}>Personality</label>
            <input
              className={inputClass}
              disabled={isTesting}
              value={data.personality || ""}
              onChange={e => handleFieldChange("personality", e.target.value)}
              placeholder="Personality"
            />
          </div>
          {/* Response Style placeholder */}
          <div className={sectionClass}>
            {/* TODO: Response Style Control */}
          </div>
          {/* Knowledge Domains placeholder */}
          <div className={sectionClass}>
            {/* TODO: Knowledge Domains Control */}
          </div>
        </div>

        {/* System Instructions */}
        <div>
          <div className="uppercase text-[#858585] text-[11px] tracking-widest border-b border-[#252525] pb-1 pt-2 mb-4 font-semibold">System Instructions</div>
          <div className={sectionClass}>
            <label className={labelClass}>System Prompt</label>
            <input
              className={inputClass}
              disabled={isTesting}
              value={data.systemPrompt || ""}
              onChange={e => handleFieldChange("systemPrompt", e.target.value)}
              placeholder="System Prompt"
            />
          </div>
          {/* Context Handling placeholder */}
          <div className={sectionClass}>
            {/* TODO: Context Handling Control */}
          </div>
          {/* Memory Settings placeholder */}
          <div className={sectionClass}>
            {/* TODO: Memory Settings Control */}
          </div>
        </div>

        {/* Flow Control */}
        <div>
          <div className="uppercase text-[#858585] text-[11px] tracking-widest border-b border-[#252525] pb-1 pt-2 mb-4 font-semibold">Flow Control</div>
          <div className={sectionClass}>
            <label className={labelClass}>Confidence Threshold</label>
            <input
              className={inputClass}
              type="number"
              disabled={isTesting}
              value={data.confidenceThreshold ?? ""}
              onChange={e => handleFieldChange("confidenceThreshold", Number(e.target.value))}
              placeholder="Confidence Threshold"
            />
          </div>
          <div className={sectionClass}>
            <label className={labelClass}>Escalation Logic</label>
            <input
              className={inputClass}
              disabled={isTesting}
              value={data.escalationLogic || ""}
              onChange={e => handleFieldChange("escalationLogic", e.target.value)}
              placeholder="Escalation Logic"
            />
          </div>
          {/* Timeout Settings placeholder */}
          <div className={sectionClass}>
            {/* TODO: Timeout Settings Control */}
          </div>
        </div>

        {/* Advanced Settings */}
        <div>
          <div className="uppercase text-[#858585] text-[11px] tracking-widest border-b border-[#252525] pb-1 pt-2 mb-4 font-semibold">Advanced Settings</div>
          <div className={sectionClass}>
            <label className={labelClass}>Model</label>
            <input
              className={inputClass}
              disabled={isTesting}
              value={data.model || ""}
              onChange={e => handleFieldChange("model", e.target.value)}
              placeholder="Model (e.g. gemini-2.5-flash-lite)"
            />
          </div>
          {/* Temperature/Creativity placeholder */}
          <div className={sectionClass}>
            {/* TODO: Temperature/Creativity Slider */}
          </div>
          {/* Token Limits placeholder */}
          <div className={sectionClass}>
            {/* TODO: Token Limits Control */}
          </div>
          {/* Output Formatting placeholder */}
          <div className={sectionClass}>
            {/* TODO: Output Formatting Control */}
          </div>
        </div>
      </div>
    );
  }

  // --- Knowledge Base Node ---
  if (selectedNode.type === "logic" && selectedNode.subtype === "knowledge-base") {
    const data = selectedNode.data as { operation?: string };
    return (
      <div className={panelClass}>
        <div className={headerClass}>Knowledge Base Properties</div>
        <div>
          <label className={labelClass}>Operation</label>
          <select
            className={inputClass}
            disabled={isTesting}
            value={data.operation || "retrieve"}
            onChange={e => handleFieldChange("operation", e.target.value)}
          >
            <option value="store">Store</option>
            <option value="retrieve">Retrieve</option>
            <option value="search">Search</option>
          </select>
        </div>
      </div>
    );
  }

  // --- IfElse Logic Node ---
  if (selectedNode.type === "logic" && selectedNode.subtype === "if-else") {
    const data = selectedNode.data as { condition?: string };
    return (
      <div className={panelClass}>
        <div className={headerClass}>If/Else Properties</div>
        <div>
          <label className={labelClass}>Condition</label>
          <input
            className={inputClass}
            disabled={isTesting}
            value={data.condition || ""}
            onChange={e => handleFieldChange("condition", e.target.value)}
            placeholder="Condition (e.g. input == 'yes')"
          />
        </div>
      </div>
    );
  }

  // --- State Machine Node ---
  if (selectedNode.type === "logic" && selectedNode.subtype === "state-machine") {
    const data = selectedNode.data as { states?: string[]; initialState?: string };
    return (
      <div className={panelClass}>
        <div className={headerClass}>State Machine Properties</div>
        <div className={sectionClass}>
          <label className={labelClass}>Initial State</label>
          <input
            className={inputClass}
            disabled={isTesting}
            value={data.initialState || ""}
            onChange={e => handleFieldChange("initialState", e.target.value)}
            placeholder="Initial State"
          />
        </div>
        <div>
          <label className={labelClass}>States</label>
          <textarea
            className={inputClass}
            disabled={isTesting}
            value={data.states?.join(", ") || ""}
            onChange={e => handleFieldChange("states", e.target.value.split(",").map(s => s.trim()))}
            placeholder="States (comma separated)"
            rows={2}
          />
        </div>
      </div>
    );
  }

  // --- Decision Tree Node ---
  if (selectedNode.type === "logic" && selectedNode.subtype === "decision-tree") {
    const data = selectedNode.data as { rules?: { condition: string; outputPath: string }[] };
    return (
      <div className={panelClass}>
        <div className={headerClass}>Decision Tree Properties</div>
        {(data.rules || []).map((rule, i) => (
          <div key={i} className="flex gap-2 items-center mb-2">
            <input
              className={inputClass + " flex-1"}
              disabled={isTesting}
              value={rule.condition}
              onChange={e => {
                const newRules = [...(data.rules || [])];
                newRules[i] = { ...rule, condition: e.target.value };
                handleFieldChange("rules", newRules);
              }}
              placeholder="Condition"
            />
            <input
              className={inputClass + " flex-1"}
              disabled={isTesting}
              value={rule.outputPath}
              onChange={e => {
                const newRules = [...(data.rules || [])];
                newRules[i] = { ...rule, outputPath: e.target.value };
                handleFieldChange("rules", newRules);
              }}
              placeholder="Output Path"
            />
          </div>
        ))}
        <button
          className="mt-2 px-3 py-1 rounded bg-vscode-button text-vscode-buttonText hover:bg-vscode-buttonHover transition"
          disabled={isTesting}
          onClick={() => handleFieldChange("rules", [...(data.rules || []), { condition: "", outputPath: "" }])}
        >Add Rule</button>
      </div>
    );
  }

  // --- Prompt Template Node ---
  if (selectedNode.type === "conversation" && selectedNode.subtype === "template") {
    const data = selectedNode.data as PromptTemplateNodeData;
    return (
      <div className={panelClass}>
        <div className={headerClass}>Prompt Template Properties</div>
        <div className={sectionClass}>
          <label className={labelClass}>Template</label>
          <textarea
            className={inputClass}
            disabled={isTesting}
            value={data.template || ""}
            onChange={e => handleFieldChange("template", e.target.value)}
            placeholder="Template (use {{variable}} syntax)"
            rows={2}
          />
        </div>
        <div>
          <label className={labelClass}>Variables</label>
          <textarea
            className={inputClass}
            disabled={isTesting}
            value={Object.entries(data.variables || {}).map(([k, v]) => `${k}=${v}`).join("\n")}
            onChange={e => {
              const vars: Record<string, string> = {};
              e.target.value.split("\n").forEach(line => {
                const [k, ...rest] = line.split("=");
                if (k) vars[k.trim()] = rest.join("=").trim();
              });
              handleFieldChange("variables", vars);
            }}
            placeholder="Variables (one per line: key=value)"
            rows={2}
          />
        </div>
      </div>
    );
  }

  // --- Message Node ---
  if (selectedNode.type === "conversation" && selectedNode.subtype === "message") {
    const data = selectedNode.data as { content?: string; message?: string };
    return (
      <div className={panelClass}>
        <div className={headerClass}>Message Node Properties</div>
        <div>
          <label className={labelClass}>Message Content</label>
          <textarea
            className={inputClass}
            disabled={isTesting}
            value={data.content || data.message || ""}
            onChange={e => handleFieldChange("content", e.target.value)}
            placeholder="Message Content"
            rows={2}
          />
        </div>
      </div>
    );
  }

  // --- UI Node ---
  if (selectedNode.type === "ui" || selectedNode.subtype === "ui") {
    const data = selectedNode.data as { content?: string; message?: string; inputValue?: string };
    return (
      <div className={panelClass}>
        <div className={headerClass}>UI Node Properties</div>
        <div>
          <label className={labelClass}>User Input</label>
          <input
            className={inputClass}
            disabled={isTesting}
            value={data.content || data.message || data.inputValue || ""}
            onChange={e => handleFieldChange("content", e.target.value)}
            placeholder="User Input"
          />
