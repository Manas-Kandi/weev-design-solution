"use client";

import React, { useMemo, useState } from "react";
import { safeStringify } from "@/lib/flow/flowContext";
import type { NodeExecutionArtifact } from "@/types/tester";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

// --- Specialized renderers ---
function TextBlock({ text }: { text: string }) {
  return (
    <pre className="max-h-56 overflow-auto rounded bg-[#0e0f13] p-2 border border-gray-800 text-[12px] leading-5 whitespace-pre-wrap text-gray-200 figma-scrollbar">
      {text}
    </pre>
  );
}

function tryParseJSON<T = unknown>(v: unknown): T | undefined {
  if (typeof v !== "string") return undefined;
  try {
    return JSON.parse(v) as T;
  } catch {
    return undefined;
  }
}

function isArrayOfObjects(v: unknown): v is Record<string, unknown>[] {
  return Array.isArray(v) && v.every((x) => x && typeof x === "object" && !Array.isArray(x));
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

export function LLMRawBlock({ outputObj, className }: { outputObj: Record<string, unknown> | null; className?: string }) {
  const oo = outputObj as Record<string, unknown> | null;
  const raw = oo ? ("llm" in oo ? oo["llm"] : oo["gemini"]) : undefined;
  return <JSONBlock value={raw} className={className} />;
}

export function NodeOutputRenderer({ artifact, className }: { artifact: NodeExecutionArtifact; className?: string }) {
  const typeKey = `${artifact.nodeSubtype || artifact.nodeType || ""}`.toLowerCase();
  const output = artifact.output;
  const outputObj: Record<string, unknown> | null =
    output && typeof output === "object" && !Array.isArray(output) ? (output as Record<string, unknown>) : null;

  // ToolAgentNode: prefer structured data path
  if (typeKey === "tool-agent") {
    const data = outputObj ? (outputObj["data"] as unknown) : undefined;
    const metadata = outputObj ? (outputObj["metadata"] as Record<string, unknown> | undefined) : undefined;
    if (typeof data !== "undefined") {
      // Calendar-style result
      if (isRecord(data) && Array.isArray(data["free_timeslots"])) {
        return (
          <div className={className}>
            <div className="mb-1 font-medium text-gray-400">Free time slots</div>
            <TableRenderer data={data["free_timeslots"] as unknown[]} />
            {isRecord(data) && "assumptions" in data && (
              <div className="mt-2">
                <div className="text-[11px] text-gray-400">Assumptions</div>
                <KeyValueList obj={data["assumptions"] as Record<string, unknown>} />
              </div>
            )}
            {metadata && (
              <div className="mt-2">
                <div className="text-[11px] text-gray-400">Metadata</div>
                <KeyValueList obj={metadata} />
              </div>
            )}
          </div>
        );
      }
      if (Array.isArray(data)) {
        return <TableRenderer data={data} />;
      }
      if (isRecord(data)) {
        return (
          <div className={className}>
            <JSONBlock value={data} />
            {metadata && (
              <div className="mt-2">
                <div className="text-[11px] text-gray-500">Metadata</div>
                <KeyValueList obj={metadata} />
              </div>
            )}
          </div>
        );
      }
    }
    // Fallbacks
    if (outputObj && typeof outputObj["output"] === "string") {
      return <TextBlock text={outputObj["output"] as string} />;
    }
    return <JSONBlock value={artifact.output} />;
  }

  // KnowledgeBaseNode: often returns JSON string for retrieve/search
  if (typeKey === "knowledge-base") {
    if (typeof output === "string") {
      const parsed = tryParseJSON(output);
      if (Array.isArray(parsed) && isArrayOfObjects(parsed)) {
        return <TableRenderer data={parsed} />;
      }
      return <TextBlock text={output} />;
    }
    return <JSONBlock value={artifact.output} />;
  }

  // AgentNode: show assistant text when present
  if (typeKey === "agent" || typeKey === "generic") {
    const text = outputObj && typeof outputObj["output"] === "string" ? (outputObj["output"] as string) : (typeof output === "string" ? output : undefined);
    if (typeof text === "string") return <TextBlock text={text} />;
    return <JSONBlock value={artifact.output} />;
  }

  // Message / PromptTemplate are text-centric
  if (typeKey === "message" || typeKey === "prompt-template" || typeKey === "template") {
    const text = typeof output === "string" ? output : outputObj && typeof outputObj["output"] === "string" ? (outputObj["output"] as string) : undefined;
    if (typeof text === "string") return <TextBlock text={text} />;
    return <JSONBlock value={artifact.output} />;
  }

  // IfElse: decision chip and context info if available
  if (typeKey === "if-else") {
    const decision = outputObj && typeof outputObj["output"] === "string" ? (outputObj["output"] as string) : (typeof output === "string" ? output : "");
    const infoRaw = outputObj && typeof outputObj["info"] === "string" ? (outputObj["info"] as string) : undefined;
    const info = tryParseJSON<Record<string, unknown>>(infoRaw);
    return (
      <div className={className}>
        <div className="mb-1">
          <span className={cn(
            "inline-flex items-center rounded px-1.5 py-0.5 text-[10px]",
            decision === "true" ? "bg-emerald-900/30 text-emerald-200" : decision === "false" ? "bg-red-900/30 text-red-200" : "bg-gray-800 text-gray-300"
          )}>
            Decision: {decision || "(unknown)"}
          </span>
        </div>
        {info ? (
          <div>
            <div className="text-[11px] text-gray-400">Evaluation</div>
            <KeyValueList obj={info} />
          </div>
        ) : (
          <JSONBlock value={artifact.output} />
        )}
      </div>
    );
  }

  // DecisionTree: show chosen branch
  if (typeKey === "decision-tree") {
    const branch = typeof output === "string" ? output : outputObj && typeof outputObj["output"] === "string" ? (outputObj["output"] as string) : undefined;
    return (
      <div className={className}>
        <div className="mb-1 font-medium text-gray-400">Selected Branch</div>
        <TextBlock text={branch || safeStringify(artifact.output)} />
      </div>
    );
  }

  // StateMachine: pretty state transition
  if (typeKey === "state-machine") {
    const prev = outputObj && typeof outputObj["previousState"] === "string" ? (outputObj["previousState"] as string) : undefined;
    const cur = outputObj && typeof outputObj["currentState"] === "string" ? (outputObj["currentState"] as string) : undefined;
    const event = outputObj && typeof outputObj["event"] === "string" ? (outputObj["event"] as string) : undefined;
    const transition = outputObj && typeof outputObj["transition"] === "string" ? (outputObj["transition"] as string) : undefined;
    return (
      <div className={className}>
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] bg-gray-800 text-gray-300">Event: {event || "(none)"}</span>
          <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] bg-blue-900/30 text-blue-200">{prev || "?"} → {cur || "?"}</span>
        </div>
        {transition && (
          <div className="text-[11px] text-gray-400">{transition}</div>
        )}
        {!transition && <JSONBlock value={artifact.output} />}
      </div>
    );
  }

  // Default: best-effort generic
  if (isArrayOfObjects(artifact.output)) {
    return <TableRenderer data={artifact.output} />;
  }
  return <JSONBlock value={artifact.output} />;
}

export function CopyButton({ getText, className }: { getText: () => string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(getText());
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        } catch {}
      }}
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 text-[11px]",
        "border-gray-700 text-gray-300 hover:bg-[#1a1c20]",
        className
      )}
      aria-label="Copy to clipboard"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function SummaryText({ text, maxChars = 200 }: { text?: string | null; maxChars?: number }) {
  const value = (text || "").trim();
  const truncated = value.length > maxChars ? value.slice(0, maxChars - 1) + "…" : value;
  return (
    <div className="group">
      <div className="text-sm text-gray-200 whitespace-pre-wrap">{truncated || "(no summary)"}</div>
      {value && (
        <div className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <CopyButton getText={() => value} />
        </div>
      )}
    </div>
  );
}

export function JSONBlock({ value, className }: { value: unknown; className?: string }) {
  const str = useMemo(() => {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      // Fallback to safe stringify for circulars
      try {
        return safeStringify(value);
      } catch {
        return String(value);
      }
    }
  }, [value]);

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1">
        <div className="text-[11px] text-gray-400">JSON</div>
        <CopyButton getText={() => str} />
      </div>
      <pre className={cn("max-h-56 overflow-auto rounded bg-[#0e0f13] p-2 border border-gray-800 text-[12px] leading-5 text-gray-200 figma-scrollbar", className)}>
        {str}
      </pre>
    </div>
  );
}

function isRedactionToken(v: unknown): "redacted" | "omitted" | null {
  if (typeof v !== "string") return null;
  const s = v.trim().toLowerCase();
  if (s === "[redacted]") return "redacted";
  if (s.startsWith("[omitted:")) return "omitted";
  if (s.startsWith("\"[omitted:")) return "omitted"; // quotes from JSON stringification
  return null;
}

export function KeyValueList({ obj }: { obj: Record<string, unknown> | undefined | null }) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return <div className="text-[11px] text-gray-500">(no metadata)</div>;
  }
  const entries = Object.entries(obj);
  if (entries.length === 0) return <div className="text-[11px] text-gray-500">(empty)</div>;
  return (
    <div className="space-y-1">
      {entries.map(([k, v]) => {
        const redaction = isRedactionToken(v);
        return (
          <div key={k} className="flex items-start gap-2 text-[12px]">
            <div className="min-w-[96px] text-gray-400">{k}</div>
            <div className="flex-1 text-gray-200">
              {redaction ? (
                <span className={cn(
                  "inline-flex items-center rounded px-1.5 py-0.5 text-[10px]",
                  redaction === "redacted" ? "bg-amber-900/40 text-amber-300" : "bg-gray-800 text-gray-300"
                )}>
                  {redaction === "redacted" ? "[redacted]" : String(v)}
                </span>
              ) : (
                <span className="break-all">{typeof v === "string" ? v : safeStringify(v)}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Renders an array of objects as a table (best-effort). Falls back to JSON when structure is irregular.
export function TableRenderer({ data, maxRows = 100, maxCols = 8 }: { data: unknown[]; maxRows?: number; maxCols?: number }) {
  const rows = Array.isArray(data) ? data : [];
  const objects = rows.filter((r) => r && typeof r === "object" && !Array.isArray(r)) as Record<string, unknown>[];
  if (rows.length === 0 || objects.length === 0) {
    return <JSONBlock value={data} />;
  }
  // Build column set from up to first 20 objects
  const sample = objects.slice(0, 20);
  const colSet = new Set<string>();
  sample.forEach((o) => Object.keys(o).forEach((k) => colSet.add(k)));
  const cols = Array.from(colSet).slice(0, maxCols);

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1">
        <div className="text-[11px] text-gray-400">Table</div>
        <CopyButton getText={() => JSON.stringify(data, null, 2)} />
      </div>
      <div className="overflow-auto border border-gray-800 rounded figma-scrollbar">
        <table className="min-w-full text-[12px]">
          <thead className="bg-[#0f1115]">
            <tr>
              {cols.map((c) => (
                <th key={c} className="text-left font-medium text-gray-300 px-2 py-1 border-b border-gray-800 sticky top-0 bg-[#0f1115]">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {objects.slice(0, maxRows).map((row, i) => (
              <tr key={i} className={i % 2 ? "bg-[#0e1014]" : "bg-[#0d0f13]"}>
                {cols.map((c) => (
                  <td key={c} className="px-2 py-1 border-b border-gray-800 align-top">
                    <span className="break-all text-gray-200">
                      {(() => {
                        const v = row[c as keyof typeof row];
                        const redaction = isRedactionToken(v);
                        if (redaction) return redaction === "redacted" ? "[redacted]" : String(v);
                        if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
                        if (v == null) return "";
                        return safeStringify(v);
                      })()}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
