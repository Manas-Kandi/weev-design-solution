import { CanvasNode, Connection } from "@/types";
import type { TesterEvent } from "@/types/tester";
import { FlowEngine } from "./flow/FlowEngine";

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
  return "";
}

export async function runWorkflow(
  nodes: CanvasNode[],
  connections: Connection[],
  startNodeId?: string | null,
  emitLog?: (
    nodeId: string,
    log: string,
    output?: unknown,
    error?: string
  ) => void,
  hooks?: {
    emitTesterEvent?: (event: TesterEvent) => void;
  }
) {
  const engine = new FlowEngine(nodes, connections);

  // Use provided startNodeId or find start node
  if (startNodeId) {
    engine.setStartNode(startNodeId);
  } else {
    const startNode =
      nodes.find((n) => getNodeTitle(n).toLowerCase().includes("start")) ||
      nodes[0];
    if (startNode) {
      engine.setStartNode(startNode.id);
    }
  }

  return await engine.execute(emitLog, hooks);
}
