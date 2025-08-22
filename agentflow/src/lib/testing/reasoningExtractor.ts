import { CanvasNode } from '@/types';

export async function generateExecutionReasoning(
  node: CanvasNode,
  prompt: string,
  result: any,
  llmExecutor: Function
): Promise<string> {
  const reasoningPrompt = `
You just executed a ${node.type} node. Explain your reasoning in simple terms.

Node Type: ${node.type}
Node Purpose: ${node.data.title || 'Unnamed node'}
Input Prompt: ${prompt.substring(0, 200)}...
Your Output: ${JSON.stringify(result).substring(0, 200)}...

In 1-2 sentences, explain:
1. What you understood from the input
2. Why you produced this specific output

Keep it simple and human-readable.
`;

  try {
    return await llmExecutor(reasoningPrompt);
  } catch (error) {
    return `Processing ${node.type} node with configured rules.`;
  }
}