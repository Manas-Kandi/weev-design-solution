import { CanvasNode, Connection, NodeOutput } from "@/types";
import { AgentNode } from "../nodes/agent/AgentNode";
import { ToolAgentNode } from "../nodes/agent/ToolAgentNode";
import { IfElseNode } from "../nodes/logic/IfElseNode";
import { KnowledgeBaseNode } from "../nodes/knowledge/KnowledgeBaseNode";
// import { MessageNode } from "../nodes/conversation/MessageNode";
// FIX: Update the import path if the file exists elsewhere, e.g.:
// import { MessageNode } from "../nodes/conversation/message/MessageNode";
import { MessageNode } from "../nodes/conversation/MessageNode";
// Or, if the file does not exist, create MessageNode.ts in the expected directory.
import { BaseNode } from "../nodes/base/BaseNode";
import { PromptTemplateNode } from "../nodes/conversation/PromptTemplateNode";
import { DecisionTreeNode } from "../nodes/logic/DecisionTreeNode";
import { StateMachineNode } from "../nodes/logic/StateMachineNode";

export class FlowEngine {
  private nodes: CanvasNode[];
  private connections: Connection[];
  private nodeOutputs: Record<string, NodeOutput> = {};
  private executionOrder: CanvasNode[] = [];
  private startNodeId: string | null = null;

  constructor(nodes: CanvasNode[], connections: Connection[]) {
    this.nodes = nodes;
    this.connections = connections;
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
      case "if-else":
        return new IfElseNode(node);
      case "knowledge-base":
        return new KnowledgeBaseNode(node);
      case "message":
        return new MessageNode(node);
      case "prompt-template":
      case "template":
        return new PromptTemplateNode(node);
      case "decision-tree":
        return new DecisionTreeNode(node);
      case "state-machine":
        return new StateMachineNode(node);
      case "ui":
      case "gui":
        // For UI nodes (like chat interface), we don't execute them
        return null;
      default:
        console.warn(
          `No executor found for node type: ${nodeType} (type: ${node.type}, subtype: ${node.subtype})`
        );
        return null;
    }
  }

  // --- NEW: Dynamic, output-aware, input-ready execution ---
  /**
   * Executes the workflow from the start node(s), supporting real-time log emission.
   * @param emitLog Optional callback: (nodeId, log, output, error) => void
   */
  async execute(
    emitLog?: (
      nodeId: string,
      log: string,
      output?: NodeOutput,
      error?: string
    ) => void
  ): Promise<Record<string, NodeOutput>> {
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
      const incoming = this.connections.filter((c) => c.targetNode === node.id);
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
        node.type === "gui" ||
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
        const outgoing = this.connections.filter(
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
        .filter(
          (node) => !this.connections.some((c) => c.targetNode === node.id)
        )
        .map((n) => n.id);
    }
    // Add start nodes to the queue (after UI node downstreams)
    for (const id of startNodeIds) {
      if (!queue.includes(id)) queue.push(id);
    }

    // Queue of nodes ready to execute
    // const queue: string[] = [...startNodeIds];

    // Loop detection
    const visitCounts: Record<string, number> = {};

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

      // Add delay for visual feedback
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Build context
      const context = {
        nodes: this.nodes,
        connections: this.connections,
        nodeOutputs: this.nodeOutputs,
        currentNode: node,
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
      const outgoing = this.connections.filter((c) => c.sourceNode === node.id);

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

      // Mark downstream nodes as having received input from this node
      for (const conn of nextConnections) {
        inputReady[conn.targetNode].add(node.id);
        // If all inputs ready, add to queue
        if (inputReady[conn.targetNode].size === inputCounts[conn.targetNode]) {
          queue.push(conn.targetNode);
        }
      }
    }

    return this.nodeOutputs;
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
