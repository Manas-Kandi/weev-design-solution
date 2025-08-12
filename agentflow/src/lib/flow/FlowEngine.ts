import { CanvasNode, Connection, NodeOutput } from "@/types";
import type { RunExecutionOptions } from "@/types/run";
import { AgentNode } from "../nodes/agent/AgentNode";
import { ToolAgentNode } from "../nodes/agent/ToolAgentNode";
import { ThinkingNode } from "../nodes/thinking/ThinkingNode";
import { IfElseNode } from "../nodes/logic/IfElseNode";
import { KnowledgeBaseNode } from "../nodes/knowledge/KnowledgeBaseNode";
// import { MessageNode } from "../nodes/conversation/MessageNode";
// FIX: Update the import path if the file exists elsewhere, e.g.:
// import { MessageNode } from "../nodes/conversation/message/MessageNode";
import { MessageNode } from "../nodes/conversation/MessageNode";
import { MessageNode as MessageFormatterNode } from "../nodes/message/MessageNode";
import { RouterNode } from "../nodes/router/Executor";
import { MemoryNode } from "../nodes/memory/Executor";
import { ToolNode } from "../nodes/tool/Executor";
// Or, if the file does not exist, create MessageNode.ts in the expected directory.
import { BaseNode } from "../nodes/base/BaseNode";
import { PromptTemplateNode } from "../nodes/conversation/PromptTemplateNode";
import { DecisionTreeNode } from "../nodes/logic/DecisionTreeNode";
import { StateMachineNode } from "../nodes/logic/StateMachineNode";
import {
  applyContextControlsToOutput,
  snapshotNodeForFlowContext,
  diffFlowContext,
} from "./flowContext";
import type {
  TesterEvent,
  NodeStartEvent,
  NodeFinishEvent,
  FlowStartedEvent,
  FlowFinishedEvent,
  CauseOfExecution,
} from "@/types/tester";

export class FlowEngine {
  private nodes: CanvasNode[];
  private connections: Connection[];
  private nodeOutputs: Record<string, NodeOutput> = {};
  private executionOrder: CanvasNode[] = [];
  private startNodeId: string | null = null;
  private options?: RunExecutionOptions;

  constructor(nodes: CanvasNode[], connections: Connection[], options?: RunExecutionOptions) {
    this.nodes = nodes;
    this.connections = connections;
    this.options = options;
  }

  setStartNode(nodeId: string) {
    this.startNodeId = nodeId;
  }

  private getNodeExecutor(node: CanvasNode): BaseNode | null {
    // Check subtype first, then fall back to type
    const nodeType = node.subtype || node.type;
    switch (nodeType) {
      case "agent":
      case "generic":
        return new AgentNode(node);
      case "tool-agent":
        return new ToolAgentNode(node);
      case "thinking":
        return new ThinkingNode(node);
      case "if-else":
        return new IfElseNode(node);
      case "knowledge-base":
        return new KnowledgeBaseNode(node);
      case "message":
        return new MessageNode(node);
      case "message-formatter":
        return new MessageFormatterNode(node);
      case "router":
        return new RouterNode(node);
      case "memory":
        return new MemoryNode(node);
      case "tool":
        return new ToolNode(node);
      case "prompt-template":
      case "template":
        return new PromptTemplateNode(node);
      case "decision-tree":
        return new DecisionTreeNode(node);
      case "state-machine":
        return new StateMachineNode(node);
      case "ui":
        // For UI nodes (like chat interface), we don't execute them
        return null;
      default:
        console.warn(
          `No executor found for node type: ${nodeType} (type: ${node.type}, subtype: ${node.subtype})`
        );
        return null;
    }
  }

  // Validate connections before execution and return only valid ones
  private validateConnections(
    emitLog?: (
      nodeId: string,
      log: string,
      output?: NodeOutput,
      error?: string
    ) => void
  ): { validConnections: Connection[]; invalidIds: Set<string> } {
    const nodeById = new Map(this.nodes.map((n) => [n.id, n] as const));
    const invalidIds = new Set<string>();

    for (const c of this.connections) {
      const src = nodeById.get(c.sourceNode);
      const tgt = nodeById.get(c.targetNode);

      const issue = (msg: string) => {
        invalidIds.add(c.id);
        const nid = src?.id || tgt?.id || "flow";
        if (emitLog) emitLog(nid, msg, undefined, msg);
        else console.warn(`[FlowEngine] ${msg}`);
      };

      if (!src) {
        issue(`Invalid connection ${c.id}: source node '${c.sourceNode}' not found.`);
        continue;
      }

      if (!tgt) {
        issue(`Invalid connection ${c.id}: target node '${c.targetNode}' not found.`);
        continue;
      }

      const srcPort = (src.outputs || []).find((p) => p.id === c.sourceOutput);
      if (!srcPort) {
        issue(
          `Invalid connection ${c.id}: source output '${c.sourceOutput}' not found on node '${src.id}'.`
        );
        continue;
      }
      const tgtPort = (tgt.inputs || []).find((p) => p.id === c.targetInput);
      if (!tgtPort) {
        issue(
          `Invalid connection ${c.id}: target input '${c.targetInput}' not found on node '${tgt.id}'.`
        );
        continue;
      }

      // Optional type compatibility check
      if (
        srcPort.type &&
        tgtPort.type &&
        srcPort.type !== tgtPort.type
      ) {
        issue(
          `Type mismatch on connection ${c.id}: '${src.id}.${srcPort.id}:${srcPort.type}' -> '${tgt.id}.${tgtPort.id}:${tgtPort.type}'.`
        );
        continue;
      }
    }

    const validConnections = this.connections.filter((c) => !invalidIds.has(c.id));
    return { validConnections, invalidIds };
  }

  // --- NEW: Dynamic, output-aware, input-ready execution ---
  /**
   * Executes the workflow from the start node(s), supporting real-time log emission.
   * @param emitLog Optional callback: (nodeId, log, output, error) => void
   * @param hooks Optional tester hooks for structured events
   */
  async execute(
    emitLog?: (
      nodeId: string,
      log: string,
      output?: NodeOutput,
      error?: string
    ) => void,
    hooks?: {
      emitTesterEvent?: (event: TesterEvent) => void;
      beforeNodeExecute?: (node: CanvasNode) => Promise<void>;
    }
  ): Promise<Record<string, NodeOutput>> {
    const VISUAL_DELAY_MS = 500; // enforced per product rule
    const emitTester = hooks?.emitTesterEvent;
    const beforeNodeExecute = hooks?.beforeNodeExecute;
    // Validate connections and use only the valid set for this run
    const { validConnections } = this.validateConnections(emitLog);
    const connections = validConnections;
    // Map: nodeId -> set of input nodeIds that have completed
    const inputReady: Record<string, Set<string>> = {};
    // Map: nodeId -> number of required inputs
    const inputCounts: Record<string, number> = {};
    // Track which nodes have executed
    const executed = new Set<string>();
    // Output results
    this.nodeOutputs = {};

    // --- PATCH: Move queue declaration above UI node loop so it is available for queuing downstream nodes ---
    const queue: string[] = [];
    // Build input counts and inputReady for each node (comprehensive fix)
    for (const node of this.nodes) {
      const incoming = connections.filter((c) => c.targetNode === node.id);
      inputCounts[node.id] = incoming.length;
      inputReady[node.id] = new Set();
    }
    // Define a type for UI node data
    type UINodeData = {
      content?: string;
      message?: string;
      inputValue?: string;
      messages?: Array<string | { text?: string }>;
      [key: string]: unknown;
    };

    // Handle UI nodes: set output, mark as executed, queue downstreams if ready
    for (const node of this.nodes) {
      if (
        node.type === "ui" ||
        node.subtype === "ui" ||
        node.subtype === "gui"
      ) {
        const data = node.data as unknown as UINodeData;
        // Comprehensive: try all common fields for user input
        let uiOutput = "";
        if (typeof data?.content === "string" && data.content.trim()) {
          uiOutput = data.content;
        } else if (typeof data?.message === "string" && data.message.trim()) {
          uiOutput = data.message;
        } else if (
          typeof data?.inputValue === "string" &&
          data.inputValue.trim()
        ) {
          uiOutput = data.inputValue;
        } else if (Array.isArray(data?.messages) && data.messages.length > 0) {
          // Use last user message if available
          const lastMsg = data.messages[data.messages.length - 1];
          if (typeof lastMsg === "string") {
            uiOutput = lastMsg;
          } else if (lastMsg && typeof lastMsg.text === "string") {
            uiOutput = lastMsg.text;
          }
        }
        this.nodeOutputs[node.id] = uiOutput;
        executed.add(node.id);
        const outgoing = connections.filter(
          (c) => c.sourceNode === node.id
        );
        for (const conn of outgoing) {
          if (inputReady[conn.targetNode]) {
            inputReady[conn.targetNode].add(node.id);
            if (
              inputReady[conn.targetNode].size === inputCounts[conn.targetNode]
            ) {
              queue.push(conn.targetNode);
            }
          } else {
            // Defensive: should never happen now
            console.warn(
              `[FlowEngine] inputReady not initialized for node ${conn.targetNode}. Skipping queuing.`
            );
          }
        }
      }
    }
    // Find start node(s)
    let startNodeIds: string[] = [];
    if (this.startNodeId) {
      startNodeIds = [this.startNodeId];
    } else {
      startNodeIds = this.nodes
        .filter((node) => !connections.some((c) => c.targetNode === node.id))
        .map((n) => n.id);
    }
    const runStartedAt = Date.now();
    // Emit flow-started tester event
    if (emitTester) {
      const evt: FlowStartedEvent = {
        type: "flow-started",
        at: runStartedAt,
        meta: {
          nodeCount: this.nodes.length,
          connectionCount: connections.length,
          startNodeIds,
          testerSchemaVersion: "0.1",
          engine: {
            visualDelayMs: VISUAL_DELAY_MS,
            startNodePriority: true,
            parallelScheduling: true,
            topologicalGuarantee: true,
          },
        },
      };
      emitTester(evt);
    }
    // Add start nodes to the FRONT of the queue to ensure start node priority
    for (let i = startNodeIds.length - 1; i >= 0; i--) {
      const id = startNodeIds[i];
      const existingIdx = queue.indexOf(id);
      if (existingIdx !== -1) queue.splice(existingIdx, 1);
      queue.unshift(id);
    }

    // Queue of nodes ready to execute
    // const queue: string[] = [...startNodeIds];

    // Loop detection
    const visitCounts: Record<string, number> = {};

    let visitIndex = 0;
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      if (executed.has(nodeId)) continue;

      // Loop detection
      visitCounts[nodeId] = (visitCounts[nodeId] || 0) + 1;
      if (visitCounts[nodeId] > 1) {
        this.nodeOutputs[nodeId] = {
          error: "Loop detected: node executed more than once in the same run.",
        };
        continue;
      }

      const node = this.nodes.find((n) => n.id === nodeId);
      if (!node) continue;

      const executor = this.getNodeExecutor(node);
      if (!executor) {
        // Already handled UI nodes above, so just skip
        continue;
      }

      // Wait for all inputs to be ready (except for start nodes)
      if (
        inputCounts[node.id] > 0 &&
        inputReady[node.id].size < inputCounts[node.id]
      ) {
        continue;
      }

      // Build context
      // Build V2 inputs map with per-edge controls
      const incoming = connections.filter((c) => c.targetNode === node.id);
      const inputs: Record<string, NodeOutput> = {};
      for (const conn of incoming) {
        const upstreamOutput = this.nodeOutputs[conn.sourceNode];
        // Skip if input not yet available (defensive)
        if (typeof upstreamOutput === "undefined") continue;
        const controls = (conn as any).contextControls as
          | { weight?: number; blocked?: boolean; control?: any }
          | undefined;
        if (controls?.blocked) continue; // blocked edge → exclude entirely
        const { output: transformed } = applyContextControlsToOutput(
          upstreamOutput,
          controls
        );
        inputs[conn.targetInput] = transformed;
      }

      // Build transitive, namespaced flowContext (respect blocked edges)
      const upstreamIds = this.getUpstreamNodeIds(node.id, connections);
      const flowContext: Record<string, ReturnType<typeof snapshotNodeForFlowContext>> = {} as any;
      for (const uid of upstreamIds) {
        const upNode = this.nodes.find((n) => n.id === uid);
        if (!upNode) continue;
        const upOut = this.nodeOutputs[uid];
        // If there's a direct edge from uid → node.id, capture advisory weight
        const direct = incoming.find((c) => c.sourceNode === uid);
        const weight = (direct as any)?.contextControls?.weight as number | undefined;
        flowContext[uid] = snapshotNodeForFlowContext({
          node: { id: upNode.id, type: upNode.type, subtype: upNode.subtype, data: upNode.data },
          output: upOut,
          weight,
        });
      }

      // Emit node-started tester event
      const cause: CauseOfExecution = inputCounts[node.id] === 0
        ? { kind: "start-node" }
        : { kind: "all-inputs-ready", inputCount: inputCounts[node.id] };
      const nodeStartAt = Date.now();
      if (emitTester) {
        const startEvt: NodeStartEvent = {
          type: "node-started",
          at: nodeStartAt,
          nodeId: node.id,
          title: getNodeTitle(node),
          nodeType: node.type,
          nodeSubtype: node.subtype,
          cause,
          topoIndex: visitIndex,
          flowContextBefore: flowContext as any,
        };
        emitTester(startEvt);
      }

      // Optional pause/breakpoint gating: allow UI to pause before executing this node
      if (beforeNodeExecute) {
        await beforeNodeExecute(node);
      }

      // Add delay for visual feedback (must occur before execution)
      await new Promise((resolve) => setTimeout(resolve, VISUAL_DELAY_MS));

      const context = {
        // Legacy fields (back-compat)
        nodes: this.nodes,
        connections,
        nodeOutputs: this.nodeOutputs,
        currentNode: node,
        // V2 fields
        inputs,
        config: node.data,
        flowContext,
        mode: "NewMode" as const,
        runOptions: this.options,
      };

      // Execute node
      let output: NodeOutput;
      let errorMsg: string | undefined = undefined;
      try {
        output = await executor.execute(context);
      } catch (error) {
        output = {
          error: error instanceof Error ? error.message : "Unknown error",
        };
        errorMsg = output.error as string;
      }
      this.nodeOutputs[node.id] = output;
      executed.add(node.id);

      const nodeEndAt = Date.now();
      const durationMs = nodeEndAt - nodeStartAt;
      const status =
        typeof output === "object" && output !== null && "error" in (output as any)
          ? ("error" as const)
          : ("success" as const);

      // Build flowContextAfter by adding this node's snapshot
      const flowContextAfter: typeof flowContext = {
        ...flowContext,
        [node.id]: snapshotNodeForFlowContext({
          node: { id: node.id, type: node.type, subtype: node.subtype, data: node.data },
          output,
        }),
      };
      const fcDiff = diffFlowContext(flowContext as any, flowContextAfter as any);

      // Generate a compact human-readable summary
      const summary = this.generateSummary(node, output);

      // Emit log for real-time panel
      if (emitLog) {
        emitLog(
          node.id,
          `[${node.type}${
            node.subtype ? ":" + node.subtype : ""
          }] Executed node: ${getNodeTitle(node)}`,
          output,
          errorMsg
        );
      }

      // Find outgoing connections
      const outgoing = connections.filter((c) => c.sourceNode === node.id);

      // Determine which branch(es) to follow
      let nextConnections: typeof outgoing;
      if (node.subtype === "if-else" || node.subtype === "decision-tree") {
        // Only follow the connection whose sourceOutput matches the output
        let outputStr: string = "";
        if (typeof output === "string") {
          outputStr = output;
        } else if (
          typeof output === "object" &&
          output !== null &&
          "output" in output &&
          typeof (output as { output?: string }).output === "string"
        ) {
          outputStr = (output as { output?: string }).output || "";
        } else {
          outputStr = String(output);
        }
        nextConnections = outgoing.filter((c) => {
          // For IfElse: output "true" or "false" → "true-path"/"false-path"
          if (node.subtype === "if-else") {
            if (outputStr === "true" && c.sourceOutput === "true-path")
              return true;
            if (outputStr === "false" && c.sourceOutput === "false-path")
              return true;
            return false;
          }
          // For DecisionTree: output matches branch id
          if (node.subtype === "decision-tree") {
            return c.sourceOutput === outputStr;
          }
          return false;
        });
      } else {
        // For all other nodes, follow all outgoing connections
        nextConnections = outgoing;
      }

      // Emit node-finished tester event (after determining nextConnections)
      if (emitTester) {
        const forwardedConnectionIds = (nextConnections || []).map((c) => c.id);
        const forwardedTargetNodeIds = (nextConnections || []).map((c) => c.targetNode);
        const finishEvt: NodeFinishEvent = {
          type: "node-finished",
          at: nodeEndAt,
          nodeId: node.id,
          title: getNodeTitle(node),
          nodeType: node.type,
          nodeSubtype: node.subtype,
          status,
          durationMs,
          visualDelayMs: VISUAL_DELAY_MS,
          output,
          summary,
          error: errorMsg,
          flowContextBefore: flowContext as any,
          flowContextAfter: flowContextAfter as any,
          flowContextDiff: fcDiff,
          forwardedConnectionIds,
          forwardedTargetNodeIds,
        };
        emitTester(finishEvt);
      }

      visitIndex += 1;

      // Mark downstream nodes as having received input from this node
      for (const conn of nextConnections) {
        inputReady[conn.targetNode].add(node.id);
        // If all inputs ready, add to queue
        if (inputReady[conn.targetNode].size === inputCounts[conn.targetNode]) {
          queue.push(conn.targetNode);
        }
      }
    }

    const finishedAt = Date.now();
    if (emitTester) {
      const finishedEvt: FlowFinishedEvent = {
        type: "flow-finished",
        at: finishedAt,
        durationMs: finishedAt - runStartedAt,
      };
      emitTester(finishedEvt);
    }
    return this.nodeOutputs;
  }

  // Compute all upstream node IDs for a given node, respecting blocked edges.
  // We perform a BFS over the reverse graph from target node.
  private getUpstreamNodeIds(targetNodeId: string, connections: Connection[]): Set<string> {
    const upstream = new Set<string>();
    const queue: string[] = [targetNodeId];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);
      const incoming = connections.filter((c) => c.targetNode === current);
      for (const conn of incoming) {
        const controls = (conn as any).contextControls as
          | { blocked?: boolean }
          | undefined;
        if (controls?.blocked) continue; // do not traverse blocked edges
        upstream.add(conn.sourceNode);
        queue.push(conn.sourceNode);
      }
    }

    // Remove the target itself if present
    upstream.delete(targetNodeId);
    return upstream;
  }

  // Create a compact, human-readable summary for tester UI cards
  private generateSummary(node: CanvasNode, output: NodeOutput): string {
    const type = node.subtype || node.type;
    const truncate = (s: string, n = 160) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
    const asJSON = (v: unknown) => {
      try {
        return truncate(JSON.stringify(v));
      } catch {
        return "<unserializable>";
      }
    };

    if (typeof output === "string") {
      return truncate(output.trim());
    }
    if (output && typeof output === "object" && "error" in output) {
      const msg = (output as any).error as string;
      return `Error: ${truncate(String(msg || "Unknown error"))}`;
    }
    if (type === "if-else") {
      // IfElse node typically returns "true" | "false" | { output: string }
      let v = "";
      if (typeof (output as any)?.output === "string") v = (output as any).output;
      else if (typeof output === "string") v = output;
      else v = asJSON(output);
      return `If/Else → ${v}`;
    }
    if (type === "decision-tree") {
      let v = "";
      if (typeof (output as any)?.output === "string") v = (output as any).output;
      else if (typeof output === "string") v = output;
      else v = asJSON(output);
      return `Branch → ${v}`;
    }
    if (output && typeof output === "object" && "gemini" in output) {
      return "LLM response"; // details shown in inspector tab
    }
    // Fallback for structured tool/agent outputs
    return asJSON(output);
  }
}

// Helper to safely get node title
function getNodeTitle(node: CanvasNode): string {
  if (!node) return "";
  const data = node.data;
  if (
    typeof data === "object" &&
    data !== null &&
    "title" in data &&
    typeof (data as { title?: unknown }).title === "string"
  ) {
    return (data as { title: string }).title;
  }
  // Optionally use description if present
  if (
    typeof data === "object" &&
    data !== null &&
    "description" in data &&
    typeof (data as { description?: unknown }).description === "string"
  ) {
    return (data as { description: string }).description;
  }
  return node.id;
}
