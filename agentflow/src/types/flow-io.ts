// Node I/O Protocol v1.0.0 (types only)
// This file defines the new NodeContext (v2), namespaced flowContext bag,
// and per-connection context controls. It is additive and non-breaking.

import type { CanvasNode, Connection, NodeOutput } from "@/types";

// Dual-mode context for migration
export type FlowMode = "NewMode" | "LegacyMode";

// An entry in the transitive, namespaced flow context bag
export interface FlowContextEntry {
  // Sanitized, size-limited snapshot of the node's config (node.data)
  config: any;
  // Last output of this node if available
  output?: NodeOutput;
  // Small metadata to help consumers (kept tiny)
  metadata?: {
    type?: string;
    subtype?: string;
    // Advisory weight from edge controls (not applied by engine)
    weight?: number;
    // Additional metadata fields permitted
    [key: string]: unknown;
  };
}

// Namespaced by nodeId → { config, output, metadata }
export type FlowContextBag = Record<string, FlowContextEntry>;

// New NodeContext passed to nodes that opt-in to v2 API
export interface NodeContextV2 {
  // Inputs addressed by this node's input port names
  inputs: Record<string, NodeOutput>;
  // The current node's own configuration (thisNode.data)
  config: any;
  // Transitive, namespaced context of all upstream nodes
  flowContext: FlowContextBag;
  // Dual-mode flag (default: "NewMode")
  mode?: FlowMode;
}

// Optional, per-connection controls surfaced in Advanced ▶ Context
export interface TransformSpec {
  // Keep only these top-level keys when output is an object
  pickPaths?: string[];
  // Drop these top-level keys when output is an object
  dropPaths?: string[];
  // Rename top-level keys when output is an object
  rename?: Record<string, string>;
}

export interface ContextControls {
  weight?: number; // advisory only; surfaced in metadata
  blocked?: boolean; // if true, exclude this upstream entirely
  control?: TransformSpec; // optional transform applied to upstream output
}

// Convenience helper type for connections that carry optional controls
export type ConnectionWithControls = Connection & {
  contextControls?: ContextControls;
};

// Lightweight descriptor for a node used during context building
export interface MinimalNodeDescriptor {
  id: string;
  type?: string;
  subtype?: string;
  data?: any;
}

// Public helper type for snapshotting nodes into flowContext
export interface SnapshotArgs {
  node: Pick<CanvasNode, "id" | "type" | "subtype" | "data"> | MinimalNodeDescriptor;
  output?: NodeOutput;
}
