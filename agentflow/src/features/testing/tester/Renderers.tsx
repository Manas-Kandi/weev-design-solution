"use client";

import React, { useMemo, useState } from "react";
import { safeStringify } from "@/lib/flow/flowContext";
import type { NodeExecutionArtifact } from "@/features/testing/types/tester";

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
    // Strip common code fences (```json ... ```), then attempt direct parse
    const cleaned = v.replace(/```json|```/gi, "").trim();
    return JSON.parse(cleaned) as T;
  } catch {
    // Fallback: extract the first plausible JSON object/array from the text
    try {
      const match = (v as string).match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
      if (match) {
        return JSON.parse(match[1]) as T;
      }
    } catch {}
    return undefined;
  }
}

function isArrayOfObjects(v: unknown): v is Record<string, unknown>[] {
  return Array.isArray(v) && v.every((x) => x && typeof x === "object" && !Array.isArray(x));
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

// --- Friendly text helpers ---
function sanitizeText(s: string): string {
  const withoutFences = s.replace(/```[a-z]*|```/gi, " ");
  const withoutEscapes = withoutFences.replace(/\\[nrt]/g, " ").replace(/[\n\r\t]+/g, " ");
  const withoutBrackets = withoutEscapes.replace(/[\[\]{}\"]+/g, " ");
  return withoutBrackets.replace(/\s+/g, " ").trim();
}

function valueToPlain(v: unknown, maxLen = 200): string {
  if (v == null) return "";
  if (typeof v === "string") return sanitizeText(v).slice(0, maxLen);
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try {
    const s = safeStringify(v);
    return sanitizeText(s).slice(0, maxLen);
  } catch {
    return String(v);
  }
}

function toFriendly(value: unknown): { text?: string; bullets?: string[] } {
  if (value == null) return { text: "No output provided." };
  // If it's a string that might contain JSON, parse then recurse
  if (typeof value === "string") {
    const parsed = tryParseJSON<any>(value);
    if (parsed !== undefined) return toFriendly(parsed);
    const text = sanitizeText(value);
    return { text: text || "No output provided." };
  }
  // Arrays
  if (Array.isArray(value)) {
    if (value.length === 0) return { text: "No output provided." };
    const first = value[0];
    if (isRecord(first)) {
      const keys = Object.keys(first).slice(0, 4);
      const bullets = value.slice(0, 5).map((item, i) => {
        const rec = isRecord(item) ? item : {};
        const parts = keys.map((k) => `${k}: ${valueToPlain(rec[k])}`);
        return `Item ${i + 1} — ${parts.join(", ")}`;
      });
      if (value.length > 5) bullets.push(`…and ${value.length - 5} more`);
      return { bullets };
    }
    // Primitive list
    const bullets = value.slice(0, 8).map((x) => valueToPlain(x));
    if (value.length > 8) bullets.push(`…and ${value.length - 8} more`);
    return { bullets };
  }
  // Objects
  if (isRecord(value)) {
    const entries = Object.entries(value).slice(0, 8);
    if (entries.length === 0) return { text: "No output provided." };
    const bullets = entries.map(([k, v]) => `${k}: ${valueToPlain(v)}`);
    return { bullets };
  }
  // Fallback
  return { text: valueToPlain(value) };
}

function FriendlyBox({ text, bullets }: { text?: string; bullets?: string[] }) {
  if ((!text || !text.trim()) && (!bullets || bullets.length === 0)) {
    text = "No output provided.";
  }
  return (
    <div className="rounded border border-gray-800 bg-[#0e0f13] p-3 text-[12px] text-gray-200">
      {bullets && bullets.length > 0 ? (
        <ul className="list-disc pl-4 space-y-1">
          {bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      ) : (
        <p className="whitespace-normal">{text}</p>
      )}
    </div>
  );
}

export function LLMRawBlock({ outputObj, className }: { outputObj: Record<string, unknown> | null; className?: string }) {
  const oo = outputObj as Record<string, unknown> | null;
  const raw = oo ? ("llm" in oo ? oo["llm"] : oo["gemini"]) : undefined;
  const friendly = toFriendly(raw);
  return <FriendlyBox {...friendly} />;
}

export function NodeOutputRenderer({ artifact, className }: { artifact: NodeExecutionArtifact; className?: string }) {
  const typeKey = `${artifact.nodeSubtype || artifact.nodeType || ""}`.toLowerCase();
  const output = artifact.output;
  const outputObj: Record<string, unknown> | null =
    output && typeof output === "object" && !Array.isArray(output) ? (output as Record<string, unknown>) : null;

  // ToolAgentNode: prefer structured data path, render as friendly text
  if (typeKey === "tool-agent") {
    const data = outputObj ? (outputObj["data"] as unknown) : undefined;
    const metadata = outputObj ? (outputObj["metadata"] as Record<string, unknown> | undefined) : undefined;
    if (typeof data !== "undefined") {
      const friendly = toFriendly(data);
      return <FriendlyBox {...friendly} />;
    }
    const fallbackFriendly = toFriendly(artifact.output);
    return <FriendlyBox {...fallbackFriendly} />;
  }

  // KnowledgeBaseNode: often returns JSON string for retrieve/search
  if (typeKey === "knowledge-base") {
    if (typeof output === "string") {
      const parsed = tryParseJSON(output);
      const friendly = toFriendly(parsed ?? output);
      return <FriendlyBox {...friendly} />;
    }
    return <FriendlyBox {...toFriendly(artifact.output)} />;
  }

  // AgentNode: show assistant text when present
  if (typeKey === "agent" || typeKey === "generic") {
    const text = outputObj && typeof outputObj["output"] === "string" ? (outputObj["output"] as string) : (typeof output === "string" ? output : undefined);
    if (typeof text === "string") {
      const parsed = tryParseJSON(text);
      return <FriendlyBox {...toFriendly(parsed ?? text)} />;
    }
    // Fallback: Gemini-style response path candidates[0].content.parts[0].text
    const candidateText = (() => {
      try {
        const oo = outputObj as any;
        const parts = oo?.candidates?.[0]?.content?.parts;
        const t = Array.isArray(parts) ? parts[0]?.text : undefined;
        return typeof t === "string" ? t : undefined;
      } catch {
        return undefined;
      }
    })();
    if (typeof candidateText === "string") {
      const parsed = tryParseJSON(candidateText);
      return <FriendlyBox {...toFriendly(parsed ?? candidateText)} />;
    }
    return <FriendlyBox {...toFriendly(artifact.output)} />;
  }

  // Message / PromptTemplate are text-centric
  if (typeKey === "message" || typeKey === "prompt-template" || typeKey === "template") {
    const text = typeof output === "string" ? output : outputObj && typeof outputObj["output"] === "string" ? (outputObj["output"] as string) : undefined;
    if (typeof text === "string") {
      const parsed = tryParseJSON(text);
      return <FriendlyBox {...toFriendly(parsed ?? text)} />;
    }
    // Fallback to candidate style if present (some nodes may pass raw LLM object)
    const candidateText = (() => {
      try {
        const oo = outputObj as any;
        const parts = oo?.candidates?.[0]?.content?.parts;
        const t = Array.isArray(parts) ? parts[0]?.text : undefined;
        return typeof t === "string" ? t : undefined;
      } catch {
        return undefined;
      }
    })();
    if (typeof candidateText === "string") {
      const parsed = tryParseJSON(candidateText);
      return <FriendlyBox {...toFriendly(parsed ?? candidateText)} />;
    }
    return <FriendlyBox {...toFriendly(artifact.output)} />;
  }

  // IfElse: decision chip and context info if available
  if (typeKey === "if-else") {
    const decision = outputObj && typeof outputObj["output"] === "string" ? (outputObj["output"] as string) : (typeof output === "string" ? output : "");
    const infoRaw = outputObj && typeof outputObj["info"] === "string" ? (outputObj["info"] as string) : undefined;
    const info = tryParseJSON<Record<string, unknown>>(infoRaw);
    const friendly = toFriendly({ Decision: decision || "unknown", ...(info || {}) });
    return <FriendlyBox {...friendly} />;
  }

  // DecisionTree: show chosen branch
  if (typeKey === "decision-tree") {
    const branch = typeof output === "string" ? output : outputObj && typeof outputObj["output"] === "string" ? (outputObj["output"] as string) : undefined;
    const friendly = toFriendly(branch ?? artifact.output);
    return <FriendlyBox {...friendly} />;
  }

  // StateMachine: pretty state transition
  if (typeKey === "state-machine") {
    const prev = outputObj && typeof outputObj["previousState"] === "string" ? (outputObj["previousState"] as string) : undefined;
    const cur = outputObj && typeof outputObj["currentState"] === "string" ? (outputObj["currentState"] as string) : undefined;
    const event = outputObj && typeof outputObj["event"] === "string" ? (outputObj["event"] as string) : undefined;
    const transition = outputObj && typeof outputObj["transition"] === "string" ? (outputObj["transition"] as string) : undefined;
    const friendly = toFriendly({ Event: event || "none", Transition: `${prev || "?"} to ${cur || "?"}`, Details: transition });
    return <FriendlyBox {...friendly} />;
  }

  // Default: best-effort generic
  if (isArrayOfObjects(artifact.output)) {
    return <FriendlyBox {...toFriendly(artifact.output)} />;
  }
  return <FriendlyBox {...toFriendly(artifact.output)} />;
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
