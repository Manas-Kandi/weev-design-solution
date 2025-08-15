// Tester Data Contracts (v0.1)
// Defines structured artifacts and events produced during a test run.

import type { CanvasNode, NodeOutput, Connection } from "@/types";
import type { ToolEnvironment } from "@/types/toolSimulator";
import type { FlowContextBag } from "./flow-io";

export type TesterStatus = "success" | "error" | "skipped";

export type TesterEventType =
  | "flow-started"
  | "flow-finished"
  | "node-started"
  | "node-finished";

export interface FlowStartedEvent {
  type: "flow-started";
  at: number; // epoch ms
  meta: {
    nodeCount: number;
    connectionCount: number;
    startNodeIds: string[];
    // Optional engine/protocol metadata for UI display and analytics
    testerSchemaVersion?: string; // e.g., "0.1"
    engine?: {
      visualDelayMs?: number; // expected fixed delay added by engine for visibility
      startNodePriority?: boolean; // true if engine ensures start node first
      parallelScheduling?: boolean; // true if nodes are scheduled as soon as inputs are ready
      topologicalGuarantee?: boolean; // true if execution respects DAG dependencies
    };
  };
}

export interface FlowFinishedEvent {
  type: "flow-finished";
  at: number; // epoch ms
  durationMs: number;
}

export type CauseOfExecution =
  | { kind: "start-node" }
  | { kind: "all-inputs-ready"; inputCount: number };

export interface NodeStartEvent {
  type: "node-started";
  at: number; // epoch ms
  nodeId: string;
  title?: string;
  nodeType?: string;
  nodeSubtype?: string;
  cause: CauseOfExecution;
  // Optional metadata for future grouping/visualization
  topoIndex?: number;
  parallelGroup?: number;
  flowContextBefore?: FlowContextBag;
}

export interface FlowContextDiffChange {
  nodeId: string;
  fields: string[]; // shallow keys that changed
}

export interface FlowContextDiff {
  added: string[]; // nodeIds added
  removed: string[]; // nodeIds removed
  changed: FlowContextDiffChange[]; // nodeIds with shallow field changes
}

export interface NodeFinishEvent {
  type: "node-finished";
  at: number; // epoch ms
  nodeId: string;
  title?: string;
  nodeType?: string;
  nodeSubtype?: string;
  status: TesterStatus;
  durationMs: number; // measured duration; visualDelayMs indicates fixed delay included in engine
  visualDelayMs?: number;
  output?: NodeOutput;
  summary?: string; // human-readable compact summary of output or decision
  error?: string;
  flowContextBefore?: FlowContextBag;
  flowContextAfter?: FlowContextBag;
  flowContextDiff?: FlowContextDiff;
  // Optional: which edges moved data after this node finished
  // Used by the Designer canvas to animate pulses along active edges
  forwardedConnectionIds?: string[];
  forwardedTargetNodeIds?: string[];
}

export type TesterEvent =
  | FlowStartedEvent
  | FlowFinishedEvent
  | NodeStartEvent
  | NodeFinishEvent;

// High-level artifact per node for timeline/result cards
export interface NodeExecutionArtifact {
  nodeId: string;
  title?: string;
  nodeType?: string;
  nodeSubtype?: string;
  cause: CauseOfExecution;
  startedAt: number;
  endedAt: number;
  durationMs: number;
  status: TesterStatus;
  output?: NodeOutput;
  summary?: string;
  error?: string;
  flowContextBefore?: FlowContextBag;
  flowContextAfter?: FlowContextBag;
  flowContextDiff?: FlowContextDiff;
}

export interface TesterRunSummary {
  startedAt: number;
  endedAt: number;
  durationMs: number;
  nodes: NodeExecutionArtifact[];
}

export interface NodeDescriptorLite {
  id: string;
  type?: string;
  subtype?: string;
  data?: CanvasNode["data"];
  title?: string;
}

// Manifest describing a single test run, including configuration and results
export interface RunManifest {
  id: string;
  timestamp: number;
  scenario: string;
  environment: ToolEnvironment;
  seed: string;
  toolProfile: string | null;
  nodes: CanvasNode[];
  connections: Connection[];
  startNodeId: string | null;
  results: NodeExecutionArtifact[];
  duration: number;
  status: "success" | "error" | "cancelled";
}
