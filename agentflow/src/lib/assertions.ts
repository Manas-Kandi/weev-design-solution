import type { Connection, NodeOutput } from "@/types";

export type AssertionOp =
  | "exists"
  | "equals"
  | "notEquals"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "contains"
  | "notContains"
  | "lengthGte"
  | "lengthEq"
  | "noErrors"
  | "noErrorsDownstream";

export interface AssertionSpec {
  id?: string;
  description?: string;
  op: AssertionOp;
  // For path-based assertions, use dot/bracket syntax relative to a logical root of node outputs.
  // Example: "agent1.output.slots" or "tool1.output.items[0].id" or "agent1.output.slots.length"
  path?: string;
  // Comparison value for ops that require it
  value?: unknown;
  // For downstream checks, the starting node
  fromNodeId?: string;
}

export interface AssertionResult {
  id?: string;
  description?: string;
  op: AssertionOp;
  path?: string;
  fromNodeId?: string;
  pass: boolean;
  actual?: unknown;
  message: string;
}

export interface EvaluateAssertionsInput {
  assertions: AssertionSpec[];
  nodeOutputs: Record<string, NodeOutput>;
  connections: Connection[];
}

export interface EvaluateAssertionsResult {
  passed: boolean;
  results: AssertionResult[];
}

// --- Core evaluator ---
export function evaluateAssertions(input: EvaluateAssertionsInput): EvaluateAssertionsResult {
  const { assertions, nodeOutputs, connections } = input;
  const results: AssertionResult[] = [];

  for (const a of assertions) {
    let pass = false;
    let actual: unknown = undefined;
    let message = "";

    try {
      switch (a.op) {
        case "noErrors": {
          const offenders = Object.entries(nodeOutputs)
            .filter(([, out]) => isErrorOutput(out))
            .map(([id]) => id);
          pass = offenders.length === 0;
          message = pass ? "No errors found" : `Errors found in nodes: ${offenders.join(", ")}`;
          break;
        }
        case "noErrorsDownstream": {
          if (!a.fromNodeId) {
            pass = false;
            message = "fromNodeId is required for noErrorsDownstream";
            break;
          }
          const downstream = getDownstreamNodeIds(a.fromNodeId, connections);
          const offenders = Array.from(downstream)
            .filter((id) => isErrorOutput(nodeOutputs[id]))
          pass = offenders.length === 0;
          message = pass ? `No downstream errors from ${a.fromNodeId}` : `Downstream errors: ${offenders.join(", ")}`;
          break;
        }
        case "exists": {
          if (!a.path) throw new Error("path is required for exists");
          actual = safeGet(nodeOutputs, a.path);
          pass = actual !== undefined && actual !== null;
          message = pass ? `Value exists at ${a.path}` : `No value at ${a.path}`;
          break;
        }
        case "equals":
        case "notEquals":
        case "gt":
        case "gte":
        case "lt":
        case "lte": {
          if (!a.path) throw new Error("path is required for comparison op");
          actual = safeGet(nodeOutputs, a.path);
          pass = compare(actual as unknown, a.value, a.op);
          message = `Expected ${a.path} ${a.op} ${formatVal(a.value)}, actual=${formatVal(actual)}`;
          break;
        }
        case "contains":
        case "notContains": {
          if (!a.path) throw new Error("path is required for contains op");
          actual = safeGet(nodeOutputs, a.path);
          if (typeof actual === "string") {
            const needle = String(a.value ?? "");
            const has = actual.includes(needle);
            pass = a.op === "contains" ? has : !has;
            message = `Expected ${a.path} ${a.op} ${formatVal(needle)}, actual=${formatVal(actual)}`;
          } else if (Array.isArray(actual)) {
            const has = (actual as unknown[]).some((item) => deepEqual(item, a.value));
            pass = a.op === "contains" ? has : !has;
            message = `Expected ${a.path} ${a.op} ${formatVal(a.value)}, actual length=${(actual as unknown[]).length}`;
          } else {
            pass = false;
            message = `Actual at ${a.path} is not array/string`;
          }
          break;
        }
        case "lengthGte":
        case "lengthEq": {
          if (!a.path) throw new Error("path is required for length op");
          actual = safeGet(nodeOutputs, a.path);
          const len = typeof actual === "string" || Array.isArray(actual) ? (actual as { length: number }).length : undefined;
          if (typeof len !== "number") {
            pass = false;
            message = `Actual at ${a.path} has no length`;
          } else {
            const expected = Number(a.value);
            pass = a.op === "lengthGte" ? len >= expected : len === expected;
            message = `Expected length ${a.op === "lengthGte" ? ">=" : "=="} ${expected}, actual=${len}`;
            actual = len;
          }
          break;
        }
        default: {
          pass = false;
          message = `Unsupported op: ${a.op}`;
        }
      }
    } catch (err) {
      pass = false;
      message = err instanceof Error ? err.message : "Assertion evaluation error";
    }

    results.push({ id: a.id, description: a.description, op: a.op, path: a.path, fromNodeId: a.fromNodeId, pass, actual, message });
  }

  return { passed: results.every((r) => r.pass), results };
}

// --- Helpers ---
function isErrorOutput(out: NodeOutput | undefined): boolean {
  return !!(out && typeof out === "object" && !Array.isArray(out) && "error" in (out as Record<string, unknown>));
}

function formatVal(v: unknown): string {
  try {
    if (typeof v === "string") return JSON.stringify(v);
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function compare(actual: unknown, expected: unknown, op: "equals"|"notEquals"|"gt"|"gte"|"lt"|"lte"): boolean {
  if (op === "equals") return deepEqual(actual, expected);
  if (op === "notEquals") return !deepEqual(actual, expected);
  const aNum = Number(actual);
  const eNum = Number(expected);
  if (!Number.isFinite(aNum) || !Number.isFinite(eNum)) return false;
  if (op === "gt") return aNum > eNum;
  if (op === "gte") return aNum >= eNum;
  if (op === "lt") return aNum < eNum;
  if (op === "lte") return aNum <= eNum;
  return false;
}

function deepEqual(a: unknown, b: unknown): boolean {
  try { return JSON.stringify(a) === JSON.stringify(b); } catch { return a === b; }
}

// Minimal dot/bracket path getter over a root object (nodeOutputs)
// Supports: foo.bar, foo[0], foo.bar[1].baz, and .length terminal
export function safeGet(root: unknown, path: string): unknown {
  if (!path) return undefined;
  // Allow implicit root prefixes: if path starts with a node id (e.g., "agent1.output"), we interpret
  // it against the shape: nodeOutputs[nodeId]
  // Also allow explicit $.nodeId.output style; we strip leading "$.":
  const p = path.startsWith("$.") ? path.slice(2) : path;
  const tokens = tokenizePath(p);
  let cur: unknown = root; // root is record of nodeOutputs
  for (const t of tokens) {
    if (cur == null) return undefined;
    if (t.type === "prop") {
      // Special case: first prop might be a nodeId: cur[nodeId]
      if (typeof cur === "object" && cur !== null) {
        const obj = cur as Record<string, unknown>;
        cur = obj[t.key];
      } else {
        return undefined;
      }
    } else {
      // index
      if (!Array.isArray(cur)) return undefined;
      const arr: unknown[] = cur;
      const idx = t.index;
      cur = arr[idx];
    }
  }
  return cur;
}

type Token = { type: "prop"; key: string } | { type: "index"; index: number };

function tokenizePath(path: string): Token[] {
  const tokens: Token[] = [];
  let buf = "";
  for (let i = 0; i < path.length; i++) {
    const ch = path[i];
    if (ch === ".") {
      if (buf) { tokens.push({ type: "prop", key: buf }); buf = ""; }
    } else if (ch === "[") {
      if (buf) { tokens.push({ type: "prop", key: buf }); buf = ""; }
      const end = path.indexOf("]", i);
      const numStr = path.slice(i + 1, end);
      const idx = Number(numStr);
      tokens.push({ type: "index", index: Number.isFinite(idx) ? idx : -1 });
      i = end; // skip to closing bracket
    } else {
      buf += ch;
    }
  }
  if (buf) tokens.push({ type: "prop", key: buf });

  // Support terminal .length by expanding to a pseudo index-less property
  // That is, consumer may pass path ending with .length, we keep it as a prop token and rely on runtime access
  return tokens;
}

// Compute downstream node IDs for a node
export function getDownstreamNodeIds(from: string, connections: Connection[]): Set<string> {
  const downstream = new Set<string>();
  const queue: string[] = [from];
  const visited = new Set<string>();
  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (visited.has(cur)) continue;
    visited.add(cur);
    const outgoing = connections.filter((c) => c.sourceNode === cur);
    for (const c of outgoing) {
      const controls = (c as unknown as { contextControls?: { blocked?: boolean } }).contextControls;
      if (controls?.blocked) continue;
      if (!downstream.has(c.targetNode)) {
        downstream.add(c.targetNode);
        queue.push(c.targetNode);
      }
    }
  }
  downstream.delete(from);
  return downstream;
}

// Convenience builders
export const A = {
  noErrors: (description?: string): AssertionSpec => ({ op: "noErrors", description }),
  noErrorsDownstream: (fromNodeId: string, description?: string): AssertionSpec => ({ op: "noErrorsDownstream", fromNodeId, description }),
  exists: (path: string, description?: string): AssertionSpec => ({ op: "exists", path, description }),
  equals: (path: string, value: unknown, description?: string): AssertionSpec => ({ op: "equals", path, value, description }),
  notEquals: (path: string, value: unknown, description?: string): AssertionSpec => ({ op: "notEquals", path, value, description }),
  gt: (path: string, value: number, description?: string): AssertionSpec => ({ op: "gt", path, value, description }),
  gte: (path: string, value: number, description?: string): AssertionSpec => ({ op: "gte", path, value, description }),
  lt: (path: string, value: number, description?: string): AssertionSpec => ({ op: "lt", path, value, description }),
  lte: (path: string, value: number, description?: string): AssertionSpec => ({ op: "lte", path, value, description }),
  contains: (path: string, value: unknown, description?: string): AssertionSpec => ({ op: "contains", path, value, description }),
  notContains: (path: string, value: unknown, description?: string): AssertionSpec => ({ op: "notContains", path, value, description }),
  lengthGte: (path: string, value: number, description?: string): AssertionSpec => ({ op: "lengthGte", path, value, description }),
  lengthEq: (path: string, value: number, description?: string): AssertionSpec => ({ op: "lengthEq", path, value, description }),
};
