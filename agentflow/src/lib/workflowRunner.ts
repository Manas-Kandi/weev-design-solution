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
  const executionTrace: Array<{
    node: CanvasNode;
    inputs: Record<string, unknown>;
    output: NodeOutput;
    context: Record<string, NodeOutput>;
    order: number;
    error?: string;
  }> = [];

  // Handle Text Input nodes first - use their input value
  for (const node of nodes) {
    if (node.type === "ui" && node.subtype === "chat") {
      const chatData = node.data as import("@/types").ChatNodeData;
      // Prefer inputValue if present, else last user message, else fallback
      const inputValue = typeof chatData.inputValue === 'string' && chatData.inputValue.trim() !== ''
        ? chatData.inputValue
        : Array.isArray(chatData.messages)
          ? chatData.messages.filter(m => m.sender === "user").pop()?.text || "Hello"
          : "Hello";
      nodeOutputs[node.id] = inputValue;
      executionTrace.push({
        node,
        inputs: {},
        output: inputValue,
        context: { ...nodeOutputs },
        order: executionTrace.length,
      });
    }
  }

  for (const node of order) {
    const inputs: Record<string, unknown> = {};
    let output: NodeOutput = "";
    let error: string | undefined = undefined;
    // Handle Prompt Template node
    if (node.type === "conversation" && node.subtype === "template") {
      const data = node.data as import("@/types").PromptTemplateNodeData;
      output = data.template;
      for (const [key, value] of Object.entries(data.variables || {})) {
        output = output.replaceAll(`{{${key}}}`, value);
      }
      nodeOutputs[node.id] = output;
    } else if (node.type === "ui" && node.subtype === "chat") {
      continue;
    } else if (node.type === "agent") {
      const incoming = connections.filter(c => c.targetNode === node.id);
      incoming.forEach(conn => {
        inputs[conn.targetInput] = nodeOutputs[conn.sourceNode];
      });
      const data = node.data as import("@/types").AgentNodeData;
      // Use both systemPrompt and prompt from agent config, and combine with chat input
      const userPrompt = typeof data.prompt === 'string' && data.prompt.trim() !== ''
        ? data.prompt
        : Object.values(inputs)[0] as string || "What would you like me to help you with?";
      let systemPrompt = typeof data.systemPrompt === 'string' ? data.systemPrompt : "";
      // Replace variables in systemPrompt with input values
      for (const [key, value] of Object.entries(inputs)) {
        systemPrompt = systemPrompt.replaceAll(`{{${key}}}`, String(value));
      }
      // Strict instruction prefix for Gemini
      const strictPrefix = "ONLY reply with the email as specified. Do NOT add extra explanations, options, or commentary. Format the email cleanly.\n\n";
      const finalPrompt = strictPrefix + (systemPrompt.trim() ? `${systemPrompt.trim()}\n\n${userPrompt.trim()}` : userPrompt.trim());
      const contents = [{
        role: "user",
        parts: [{ text: finalPrompt }],
      }];
      try {
        const result = await callGemini("", {
          model: data.model || "gemini-pro",
          generationConfig: {
            temperature: data.temperature ?? 0.7,
          },
          contents,
        });
        let rawOutput = result?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
        // Clean up output: replace \n with real newlines, remove extra text after email
        rawOutput = rawOutput.replace(/\\n/g, '\n').replace(/---[\s\S]*$/, '').trim();
        output = rawOutput;
        nodeOutputs[node.id] = output;
      } catch (err) {
        error = err instanceof Error ? err.message : "Unknown error";
        output = { error };
        nodeOutputs[node.id] = output;
      }
    } else if (node.type === "logic" && node.subtype === "ifelse") {
      const condition = (node.data as { condition?: string }).condition || "";
      const isTrue = evaluateCondition(condition, nodeOutputs);
      output = isTrue ? "true" : "false";
      nodeOutputs[node.id] = output;
    } else {
      output = nodeOutputs[node.id] ?? null;
    }
    executionTrace.push({
      node,
      inputs,
      output,
      context: { ...nodeOutputs },
      order: executionTrace.length,
      error,
    });
  }
  // After building executionTrace, assign output/context to each node for UI wiring
  executionTrace.forEach(traceStep => {
    traceStep.node.output = traceStep.output;
    traceStep.node.context = traceStep.context;
  });
  return { outputs: nodeOutputs, trace: executionTrace };
}
