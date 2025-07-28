import { CanvasNode, Connection } from "@/types";
import { FlowEngine } from "./flow/FlowEngine";

export async function runWorkflow(
  nodes: CanvasNode[],
  connections: Connection[],
  startNodeId?: string | null,
  emitLog?: (
    nodeId: string,
    log: string,
    output?: unknown,
    error?: string
  ) => void
) {
  const engine = new FlowEngine(nodes, connections);

  // Use provided startNodeId or find start node
  if (startNodeId) {
    engine.setStartNode(startNodeId);
  } else {
    const startNode =
      nodes.find((n) => n.data.title?.toLowerCase().includes("start")) ||
      nodes[0];
    if (startNode) {
      engine.setStartNode(startNode.id);
    }
  }

  return await engine.execute(emitLog);
}
