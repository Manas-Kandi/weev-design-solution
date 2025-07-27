import { CanvasNode, Connection } from "@/types";
import { FlowEngine } from "./flow/FlowEngine";

export async function runWorkflow(
  nodes: CanvasNode[],
  connections: Connection[]
) {
  const engine = new FlowEngine(nodes, connections);

  // Find start node (you can enhance this to let users mark a start node)
  const startNode =
    nodes.find((n) => n.data.title?.toLowerCase().includes("start")) ||
    nodes[0];
  if (startNode) {
    engine.setStartNode(startNode.id);
  }

  return await engine.execute();
}
