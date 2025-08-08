// Flow context helpers: redaction, truncation, snapshot, and transform utilities
// Non-invasive utilities for the Node I/O Protocol (v1.0.0)

import type { CanvasNode, NodeOutput } from "@/types";
import type {
  ContextControls,
  FlowContextEntry,
  TransformSpec,
  FlowContextBag,
} from "@/types/flow-io";
import type { FlowContextDiff } from "@/types/tester";

// Defaults per product guidance
export const DEFAULT_BYTE_LIMIT = 2048; // ~2KB
export const DEFAULT_REDACT_KEYS = [
  "apikey",
  "secret",
  "token",
  "authorization",
  "password",
  "accesstoken",
  "refreshtoken",
];

// Utility: UTF-8 byte length
export function byteLength(value: string): number {
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(value).length;
  }
  // Fallback for environments without TextEncoder
  return unescape(encodeURIComponent(value)).length;
}

// Safe stringify with circular reference handling
export function safeStringify(value: unknown): string {
  const seen = new WeakSet<object>();
  return JSON.stringify(
    value,
    (key, val) => {
      if (typeof val === "object" && val !== null) {
        if (seen.has(val as object)) return "[Circular]";
        seen.add(val as object);
      }
      return val;
    },
    0
  ) ?? "";
}

// Redact known sensitive keys (case-insensitive)
export function redactConfig<T = any>(input: T, keys = DEFAULT_REDACT_KEYS): T {
  const keySet = new Set(keys.map((k) => k.toLowerCase()));
  const visit = (val: any): any => {
    if (val === null || typeof val !== "object") return val;
    if (Array.isArray(val)) return val.map(visit);
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      if (keySet.has(k.toLowerCase())) {
        out[k] = "[redacted]";
      } else {
        out[k] = visit(v);
      }
    }
    return out;
  };
  return visit(input);
}

// Replace overly large fields with a brief summary string
export function truncateLargeFields(input: any, byteLimit = DEFAULT_BYTE_LIMIT): any {
  const summarize = (sizeBytes: number) => `"[omitted: ${(sizeBytes / 1024).toFixed(1)} KB]"`;

  const visit = (val: any): any => {
    if (val == null) return val;

    if (typeof val === "string") {
      const size = byteLength(val);
      if (size > byteLimit) return summarize(size);
      return val;
    }

    if (typeof val !== "object") return val; // number | boolean | symbol | bigint

    if (Array.isArray(val)) {
      // Map elements and also check whole array size
      const mapped = val.map(visit);
      const size = byteLength(safeStringify(mapped));
      if (size > byteLimit) return summarize(size);
      return mapped;
    }

    // Plain object
    const entries = Object.entries(val);
    const out: Record<string, any> = {};
    for (const [k, v] of entries) {
      // First check size of entire subtree
      const subtree = v;
      try {
        const size = byteLength(safeStringify(subtree));
        if (size > byteLimit) {
          out[k] = summarize(size);
        } else {
          out[k] = visit(subtree);
        }
      } catch {
        out[k] = "[omitted: <unserializable>]";
      }
    }

    const totalSize = byteLength(safeStringify(out));
    if (totalSize > byteLimit) return summarize(totalSize);
    return out;
  };

  return visit(input);
}

// Keep only scalar fields and small metadata from a config object
export function pruneConfigForFlowContext(config: any, byteLimit = DEFAULT_BYTE_LIMIT): any {
  const isScalar = (v: any) =>
    v == null || typeof v === "string" || typeof v === "number" || typeof v === "boolean";

  if (isScalar(config)) return truncateLargeFields(config, byteLimit);

  if (Array.isArray(config)) {
    // Arrays are considered large metadata; summarize if too big
    const size = byteLength(safeStringify(config));
    if (size > byteLimit) return `"[omitted: ${(size / 1024).toFixed(1)} KB]"`;
    // Otherwise, keep scalars and summarize large elements individually
    return truncateLargeFields(config, byteLimit);
  }

  // Plain object: include scalars; for non-scalars, include only if small
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(config ?? {})) {
    if (isScalar(v)) {
      out[k] = truncateLargeFields(v, byteLimit);
    } else {
      const size = byteLength(safeStringify(v));
      if (size > byteLimit) {
        out[k] = `"[omitted: ${(size / 1024).toFixed(1)} KB]"`;
      } else {
        // Shallow include when below limit
        out[k] = truncateLargeFields(v, byteLimit);
      }
    }
  }
  // Final size gate on whole config snapshot
  const totalSize = byteLength(safeStringify(out));
  if (totalSize > byteLimit) return `"[omitted: ${(totalSize / 1024).toFixed(1)} KB]"`;
  return out;
}

// Build a sanitized snapshot suitable for the flowContext bag
export function snapshotNodeForFlowContext(args: {
  node: Pick<CanvasNode, "id" | "type" | "subtype" | "data">;
  output?: NodeOutput;
  weight?: number;
  byteLimit?: number;
  redactKeys?: string[];
}): FlowContextEntry {
  const { node, output, weight, byteLimit = DEFAULT_BYTE_LIMIT, redactKeys = DEFAULT_REDACT_KEYS } = args;
  const redacted = redactConfig(node.data, redactKeys);
  const config = pruneConfigForFlowContext(redacted, byteLimit);
  const entry: FlowContextEntry = {
    config,
    output: truncateLargeFields(output, byteLimit),
    metadata: {
      type: node.type,
      subtype: node.subtype,
      ...(typeof weight === "number" ? { weight } : {}),
    },
  };
  return entry;
}

// Apply per-connection TransformSpec to a NodeOutput
export function applyTransformSpecToOutput(output: NodeOutput, spec?: TransformSpec): NodeOutput {
  if (!spec) return output;
  // Only apply to plain object outputs
  if (typeof output !== "object" || output === null || Array.isArray(output)) return output;
  // Start with a shallow copy
  let result: Record<string, any> = { ...output };

  if (spec.pickPaths && spec.pickPaths.length > 0) {
    const picked: Record<string, any> = {};
    for (const key of spec.pickPaths) {
      if (key in result) picked[key] = result[key];
    }
    result = picked;
  }

  if (spec.dropPaths && spec.dropPaths.length > 0) {
    for (const key of spec.dropPaths) delete result[key];
  }

  if (spec.rename) {
    const renamed: Record<string, any> = {};
    for (const [from, to] of Object.entries(spec.rename)) {
      if (from in result) {
        renamed[to] = result[from];
        delete result[from];
      }
    }
    result = { ...result, ...renamed };
  }

  return result as NodeOutput;
}

// Convenience: apply full context controls (block handled by caller)
export function applyContextControlsToOutput(
  output: NodeOutput,
  controls?: ContextControls
): { output: NodeOutput; weight?: number } {
  if (!controls) return { output };
  const transformed = applyTransformSpecToOutput(output, controls.control);
  return { output: transformed, weight: controls.weight };
}

// Compute a shallow diff between two FlowContext bags
export function diffFlowContext(
  before: FlowContextBag | undefined,
  after: FlowContextBag | undefined
): FlowContextDiff {
  const a = before ?? {};
  const b = after ?? {};
  const aKeys = new Set(Object.keys(a));
  const bKeys = new Set(Object.keys(b));

  const added: string[] = [];
  const removed: string[] = [];
  const changed: { nodeId: string; fields: string[] }[] = [];

  for (const k of bKeys) if (!aKeys.has(k)) added.push(k);
  for (const k of aKeys) if (!bKeys.has(k)) removed.push(k);

  const intersect = [...aKeys].filter((k) => bKeys.has(k));
  for (const k of intersect) {
    const aEntry = a[k];
    const bEntry = b[k];
    const fields: string[] = [];
    const eq = (x: unknown, y: unknown) => safeStringify(x) === safeStringify(y);
    if (!eq(aEntry?.config, bEntry?.config)) fields.push("config");
    if (!eq(aEntry?.output, bEntry?.output)) fields.push("output");
    if (!eq(aEntry?.metadata, bEntry?.metadata)) fields.push("metadata");
    if (fields.length > 0) changed.push({ nodeId: k, fields });
  }

  return { added, removed, changed };
}
