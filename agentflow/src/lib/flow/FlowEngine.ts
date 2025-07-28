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
    switch (node.subtype || node.type) {
      case "agent":
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
      default:
        return null;
    }
  }

  private buildExecutionOrder(): void {
    const visited = new Set<string>();
    const order: CanvasNode[] = [];

    const visit = (node: CanvasNode) => {
      if (visited.has(node.id)) return;
      visited.add(node.id);

      // Visit dependencies first
      const dependencies = this.connections
        .filter((c) => c.targetNode === node.id)
        .map((c) => this.nodes.find((n) => n.id === c.sourceNode))
        .filter(Boolean) as CanvasNode[];

      dependencies.forEach((dep) => visit(dep));
      order.push(node);
    };

    // Start from the designated start node or find nodes with no inputs
    if (this.startNodeId) {
      const startNode = this.nodes.find((n) => n.id === this.startNodeId);
      if (startNode) visit(startNode);
    } else {
      // Find nodes with no incoming connections
      const startNodes = this.nodes.filter(
        (node) => !this.connections.some((c) => c.targetNode === node.id)
      );
      startNodes.forEach((node) => visit(node));
    }

    // Visit any remaining nodes
    this.nodes.forEach((node) => visit(node));

    this.executionOrder = order;
  }

  async execute(): Promise<Record<string, NodeOutput>> {
    this.buildExecutionOrder();
    this.nodeOutputs = {};

    for (const node of this.executionOrder) {
      const executor = this.getNodeExecutor(node);
      if (!executor) {
        this.nodeOutputs[node.id] = {
          error: `No executor for node type: ${node.type}`,
        };
        continue;
      }

      try {
        // Add delay for visual feedback
        await new Promise((resolve) => setTimeout(resolve, 500));

        const context = {
          nodes: this.nodes,
          connections: this.connections,
          nodeOutputs: this.nodeOutputs,
          currentNode: node,
        };

        const output = await executor.execute(context);
        this.nodeOutputs[node.id] = output;
      } catch (error) {
        this.nodeOutputs[node.id] = {
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }

    return this.nodeOutputs;
  }
}
