"use client";

import React, { useMemo, useState } from "react";
import { safeStringify } from "@/lib/flow/flowContext";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
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
        "border-gray-300 text-gray-600 hover:bg-gray-50",
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
      <div className="text-sm text-gray-800 whitespace-pre-wrap">{truncated || "(no summary)"}</div>
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
        <div className="text-[11px] text-gray-500">JSON</div>
        <CopyButton getText={() => str} />
      </div>
      <pre className={cn("max-h-56 overflow-auto rounded bg-gray-50 p-2 border border-gray-200 text-[12px] leading-5", className)}>
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
            <div className="min-w-[96px] text-gray-600">{k}</div>
            <div className="flex-1 text-gray-900">
              {redaction ? (
                <span className={cn(
                  "inline-flex items-center rounded px-1.5 py-0.5 text-[10px]",
                  redaction === "redacted" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-700"
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
        <div className="text-[11px] text-gray-500">Table</div>
        <CopyButton getText={() => JSON.stringify(data, null, 2)} />
      </div>
      <div className="overflow-auto border border-gray-200 rounded">
        <table className="min-w-full text-[12px]">
          <thead className="bg-gray-50">
            <tr>
              {cols.map((c) => (
                <th key={c} className="text-left font-medium text-gray-700 px-2 py-1 border-b border-gray-200 sticky top-0 bg-gray-50">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {objects.slice(0, maxRows).map((row, i) => (
              <tr key={i} className={i % 2 ? "bg-white" : "bg-gray-50/50"}>
                {cols.map((c) => (
                  <td key={c} className="px-2 py-1 border-b border-gray-100 align-top">
                    <span className="break-all text-gray-800">
                      {(() => {
                        const v = (row as any)[c];
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
