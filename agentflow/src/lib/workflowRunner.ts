import { CanvasNode, Connection, NodeOutput } from "@/types";
import { callGemini } from "@/lib/geminiClient";

// Topological sort utility (simple, assumes no cycles)
function getExecutionOrder(nodes: CanvasNode[], connections: Connection[]): CanvasNode[] {
  const order: CanvasNode[] = [];
  const visited = new Set<string>();
  function visit(node: CanvasNode) {
    if (visited.has(node.id)) return;
    visited.add(node.id);
    const incoming = connections.filter(c => c.targetNode === node.id);
    incoming.forEach(conn => {
      const source = nodes.find(n => n.id === conn.sourceNode);
      if (source) visit(source);
    });
    order.push(node);
  }
  nodes.forEach(visit);
  return order;
}

function evaluateCondition(condition: string, context: Record<string, NodeOutput>): boolean {
  // Very basic JS eval for demo (in production, use a safe parser)
  try {
    // context: { nodeId: output, ... }
    // Example: condition = "context['nodeA'] === 'yes'"
    // eslint-disable-next-line no-eval
    return !!eval(condition);
  } catch {
    return false;
  }
}

export async function runWorkflow(nodes: CanvasNode[], connections: Connection[]) {
  const order = getExecutionOrder(nodes, connections);
  const nodeOutputs: Record<string, NodeOutput> = {};
  for (const node of order) {
    if (node.type === "agent" || node.type === "conversation" || node.type === "logic" || node.type === "testing" || node.type === "ui") {
      // Compose the prompt using systemPrompt, context, and user prompt
      const systemPrompt = node.data.systemPrompt || "";
      const userPrompt = node.data.prompt || "";
      const inputContext = node.inputs.map(i => nodeOutputs[i.id]).join("\n");
      const finalPrompt = [systemPrompt, inputContext, userPrompt].filter(Boolean).join("\n\n");
      // Evaluate condition if present
      if (node.data.condition && !evaluateCondition(node.data.condition, nodeOutputs)) {
        nodeOutputs[node.id] = "Skipped due to condition";
        continue;
      }
      try {
        // Always use gemini-2.5-flash-lite for demo, regardless of model picker
        const geminiRes = await callGemini(finalPrompt, { model: "gemini-2.5-flash-lite" });
        nodeOutputs[node.id] = { gemini: geminiRes };
      } catch (err) {
        nodeOutputs[node.id] = { error: err instanceof Error ? err.message : "Unknown error" };
      }
    } else if (node.type === "logic") {
      // Example: logic node could evaluate JS from node.data.content
      try {
        // eslint-disable-next-line no-eval
        nodeOutputs[node.id] = eval(node.data.content || 'null');
      } catch (err) {
        nodeOutputs[node.id] = { error: err instanceof Error ? err.message : "Logic error" };
      }
    } else {
      nodeOutputs[node.id] = "Not implemented";
    }
  }
  return nodeOutputs;
}
