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

  // Define the expected shape for chat node data
  interface ChatNodeData {
    inputValue?: string;
    [key: string]: unknown;
  }

  // Define ChatBoxNodeData type for type safety
  interface ChatBoxNodeData {
    inputValue?: string;
    title?: string;
    // add other properties as needed
  }

  // Handle Text Input nodes first - use their input value
  for (const node of nodes) {
    if (node.type === "ui" && node.subtype === "chat") {
      console.log('Full node data:', JSON.stringify(node.data, null, 2));
      const chatData = node.data as unknown as ChatNodeData;
      const inputValue = chatData.inputValue || (chatData as { input?: string }).input || "Hello";
      console.log('Using input value:', inputValue);
      nodeOutputs[node.id] = inputValue;
    }
  }

  for (const node of order) {
    // Handle Prompt Template node
    if (node.type === "conversation" && node.subtype === "template") {
      const data = node.data as import("@/types").PromptTemplateNodeData;
      let output = data.template;
      for (const [key, value] of Object.entries(data.variables || {})) {
        output = output.replaceAll(`{{${key}}}`, value);
      }
      nodeOutputs[node.id] = output;
      continue;
    }
    // Skip Chat Interface nodes in main loop
    if (node.type === "ui" && node.subtype === "chat") {
      continue; // Already handled above
    }
    if (node.type === "agent") {
      // Gather resolved inputs for agent node
      const incoming = connections.filter(c => c.targetNode === node.id);
      const resolvedInputs: Record<string, unknown> = {};
      incoming.forEach(conn => {
        const output = nodeOutputs[conn.sourceNode];
        resolvedInputs[conn.targetInput] = output;
      });
      const data = node.data as import("@/types").AgentNodeData;
      // Grab prompt from inputs cleanly
      const userPrompt = Object.values(resolvedInputs)[0] as string || "What would you like me to help you with?";
      const systemPrompt = data.systemPrompt || "";
      // Log the final payload
      console.log("Sending prompt to Gemini:", userPrompt, "System prompt:", systemPrompt);
      try {
        const result = await callGemini("", {
          model: data.model || "gemini-pro",
          generationConfig: {
            temperature: data.temperature ?? 0.7,
          },
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: systemPrompt
                    ? `${systemPrompt.trim()}\n\n${userPrompt.trim()}`
                    : userPrompt.trim(),
                },
              ],
            },
          ],
        });
        nodeOutputs[node.id] = result?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
      } catch (err) {
        nodeOutputs[node.id] = { error: err instanceof Error ? err.message : "Unknown error" };
      }
      continue;
    }
    // ...existing code for other node types...
  }
  return nodeOutputs;
}
