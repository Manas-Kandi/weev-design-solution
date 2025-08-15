"use client";

import React, { useMemo, useState } from "react";
import { Copy, Check } from "lucide-react";
import { SummaryText, JSONBlock, KeyValueList, NodeOutputRenderer, LLMRawBlock } from "@/components/canvas/tester/Renderers";
import type { NodeExecutionArtifact } from "@/types/tester";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function StatusDot({ status }: { status: NodeExecutionArtifact["status"] }) {
  const cls =
    status === "success" ? "bg-emerald-600" : status === "error" ? "bg-red-600" : "bg-gray-400";
  return <span className={cn("inline-block h-2 w-2 rounded-full", cls)} />;
}

type TabId = "summary" | "output" | "inputs" | "llm" | "trace" | "errors";
type TabDef = { id: TabId; label: string; disabled?: boolean };

export default function ResultCard({
  artifact,
  providerModel,
  selected,
  onClick,
  hasBreakpoint,
  onToggleBreakpoint,
}: {
  artifact: NodeExecutionArtifact;
  providerModel?: string;
  selected?: boolean;
  onClick?: () => void;
  hasBreakpoint?: boolean;
  onToggleBreakpoint?: () => void;
}) {
  const [tab, setTab] = useState<TabId>("summary");
  const [copied, setCopied] = useState(false);

  const outputObj: Record<string, unknown> | null =
    artifact.output && typeof artifact.output === "object" && !Array.isArray(artifact.output)
      ? (artifact.output as Record<string, unknown>)
      : null;
  const isLLM = !!(outputObj && ("gemini" in outputObj || "llm" in outputObj));

  const durationLabel = useMemo(() => ((artifact.durationMs || 0) / 1000).toFixed(2) + "s", [artifact.durationMs]);
  const nodeTypeLabel = useMemo(
    () => `${artifact.nodeType}${artifact.nodeSubtype ? ":" + artifact.nodeSubtype : ""}`,
    [artifact.nodeType, artifact.nodeSubtype]
  );

  // Add copy to clipboard function
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Get output as string for copying
  const getOutputAsString = useMemo(() => {
    if (!artifact.output) return '';
    if (typeof artifact.output === 'string') return artifact.output;
    return JSON.stringify(artifact.output, null, 2);
  }, [artifact.output]);

  return (
    <div
      className={cn(
        "rounded-lg border p-3 bg-[#101214] text-gray-200",
        selected
          ? "border-blue-500 ring-1 ring-blue-400/30 bg-[#0f172a]/30"
          : "border-gray-800 hover:bg-[#0f1115] cursor-pointer"
      )}
      onClick={onClick}
      role="button"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <StatusDot status={artifact.status} />
          <div className="truncate">
            <div className="text-sm font-medium text-gray-100 truncate">{artifact.title || artifact.nodeId}</div>
            <div className="text-[11px] text-gray-500 truncate">{nodeTypeLabel}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Breakpoint toggle */}
          {onToggleBreakpoint && (
            <button
              type="button"
              title={hasBreakpoint ? "Remove breakpoint" : "Add breakpoint"}
              aria-pressed={!!hasBreakpoint}
              onClick={(e) => {
                e.stopPropagation();
                onToggleBreakpoint?.();
              }}
              className={cn(
                "inline-flex items-center justify-center h-5 w-5 rounded-full border text-[10px]",
                hasBreakpoint ? "border-red-500 bg-red-500/20 text-red-400" : "border-gray-600 text-gray-400 hover:bg-[#1a1c20]"
              )}
            >
              B
            </button>
          )}
          {providerModel && (
            <span className="text-[11px] rounded border border-gray-700 px-2 py-0.5 text-gray-200 bg-[#121316] whitespace-nowrap">
              {providerModel}
            </span>
          )}
          <span className="text-[11px] text-gray-400 whitespace-nowrap">{durationLabel}</span>
        </div>
      </div>

      {/* Quick meta row */}
      <div className="mt-1">
        <KeyValueList
          obj={{
            cause: ((): string | undefined => {
              const c = (artifact as unknown as { cause?: { kind?: string } }).cause;
              return c?.kind;
            })(),
            startedAt: artifact.startedAt ? new Date(artifact.startedAt).toLocaleTimeString() : undefined,
            endedAt: artifact.endedAt ? new Date(artifact.endedAt).toLocaleTimeString() : undefined,
          }}
        />
      </div>

      {/* Tabs */}
      <div className="mt-2">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1 text-[11px]">
            {([
              { id: "summary", label: "Summary" },
              { id: "output", label: "Output" },
              { id: "inputs", label: "Inputs" },
              { id: "llm", label: "LLM", disabled: !isLLM },
              { id: "trace", label: "Trace" },
              { id: "errors", label: "Errors" },
            ] as TabDef[]).map((t) => (
              <button
                key={t.id}
                disabled={!!t.disabled}
                onClick={() => setTab(t.id)}
                className={cn(
                  "px-2 py-1 rounded",
                  tab === t.id ? "bg-gray-800 text-gray-100" : "text-gray-400 hover:bg-[#1a1c20]",
                  t.disabled ? "opacity-50 cursor-not-allowed" : undefined
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          {tab === "output" && getOutputAsString && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(getOutputAsString);
              }}
              className="text-xs text-gray-400 hover:text-gray-200 flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-800"
              title="Copy output to clipboard"
            >
              {copied ? (
                <>
                  <Check size={12} /> Copied!
                </>
              ) : (
                <>
                  <Copy size={12} /> Copy
                </>
              )}
            </button>
          )}
        </div>
        <div className="mt-2">
          {tab === "summary" && <SummaryText text={artifact.summary} maxChars={800} />}
          {tab === "output" && (
            <div className="text-[11px] text-gray-200">
              <NodeOutputRenderer artifact={artifact} />
            </div>
          )}
          {tab === "inputs" && (
            <div className="text-[11px] text-gray-200">
              <div className="mb-1 font-medium">flowContextBefore</div>
              <JSONBlock value={artifact.flowContextBefore} />
            </div>
          )}
          {tab === "llm" && isLLM && (
            <div className="text-[11px] text-gray-200">
              <LLMRawBlock outputObj={outputObj} />
            </div>
          )}
          {tab === "trace" && (
            <div className="text-[11px] text-gray-200 space-y-2">
              <div>
                <div className="font-medium">Flow Context Diff</div>
                <JSONBlock value={artifact.flowContextDiff} />
              </div>
              <div>
                <div className="font-medium">flowContextAfter</div>
                <JSONBlock value={artifact.flowContextAfter} />
              </div>
            </div>
          )}
          {tab === "errors" && <div className="text-sm text-red-500">{artifact.error || "(no errors)"}</div>}
        </div>
      </div>
    </div>
  );
}
