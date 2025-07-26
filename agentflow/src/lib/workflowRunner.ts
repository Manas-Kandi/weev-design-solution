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
    if (
      node.type === "agent" ||
      node.type === "logic" ||
      node.type === "gui" ||
      node.type === "conversation" ||
      node.type === "testing" ||
      node.type === "ui"
    ) {
      // Compose the prompt using systemPrompt, personality, escalationLogic, confidenceThreshold, context, and user prompt
      const systemPrompt = "systemPrompt" in node.data ? node.data.systemPrompt || "" : "";
      const personality = "personality" in node.data && node.data.personality ? `Personality: ${node.data.personality}` : "";
      const escalationLogic = "escalationLogic" in node.data && node.data.escalationLogic ? `Escalation Logic: ${node.data.escalationLogic}` : "";
      const confidenceThreshold = "confidenceThreshold" in node.data && node.data.confidenceThreshold !== undefined ? `Confidence Threshold: ${node.data.confidenceThreshold}` : "";
      const conversationHistory =
        "messages" in node.data && Array.isArray(node.data.messages)
          ? node.data.messages
              .map(m => `${m.sender === "user" ? "User" : "Agent"}: ${m.text}`)
              .join("\n")
          : "";
      const userPrompt = "prompt" in node.data && typeof node.data.prompt === "string" ? node.data.prompt : "";
      const incoming = connections.filter(c => c.targetNode === node.id);
      const inputContext = incoming
        .map(conn => {
          const output = nodeOutputs[conn.sourceNode];
          if (typeof output === "string") return output;
          if (output && typeof output === "object") return JSON.stringify(output);
          return "";
        })
        .join("\n");
      const finalPrompt = [
        systemPrompt,
        personality,
        escalationLogic,
        confidenceThreshold,
        conversationHistory,
        inputContext,
        userPrompt
      ].filter(Boolean).join("\n\n");
      // Evaluate condition if present
      if (
        "condition" in node.data &&
        node.data.condition &&
        !evaluateCondition(node.data.condition, nodeOutputs)
      ) {
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
    } else {
      nodeOutputs[node.id] = { error: `Unsupported node type: ${node.type}` };
    }
  }
  return nodeOutputs;
}
