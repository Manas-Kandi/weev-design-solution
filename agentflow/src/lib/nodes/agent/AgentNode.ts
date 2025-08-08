import { BaseNode, NodeContext } from "../base/BaseNode";
import { NodeOutput, AgentNodeData } from "@/types";
import { callLLM } from "@/lib/llmClient";

// Using AgentNodeData from types

export class AgentNode extends BaseNode {
  async execute(context: NodeContext): Promise<NodeOutput> {
    const data = this.node.data as AgentNodeData;

    // Build the prompt
    const prompts: string[] = [];

    // System prompt
    if ("systemPrompt" in data && data.systemPrompt) {
      prompts.push(`System: ${data.systemPrompt}`);
    }

    // Personality
    if ("personality" in data && data.personality) {
      prompts.push(`Personality: ${data.personality}`);
    }

    // Escalation logic
    if ("escalationLogic" in data && data.escalationLogic) {
      prompts.push(`Escalation Logic: ${data.escalationLogic}`);
    }

    // Confidence threshold
    if (
      "confidenceThreshold" in data &&
      data.confidenceThreshold !== undefined
    ) {
      prompts.push(`Confidence Threshold: ${data.confidenceThreshold}`);
    }

    // Input context from connected nodes
    const inputContext = this.formatInputContext(context);
    if (inputContext) {
      prompts.push(`Context:\n${inputContext}`);
    }

    // User prompt
    if ("prompt" in data && data.prompt) {
      prompts.push(`User: ${data.prompt}`);
    }

    const finalPrompt = prompts.filter(Boolean).join("\n\n");

    try {
      const overrides = context.runOptions?.overrides || {};
      const llm = await callLLM(finalPrompt, {
        model: overrides.model ?? data.model,
        temperature: typeof overrides.temperature === "number"
          ? overrides.temperature
          : (typeof data.temperature === "number" ? data.temperature : undefined),
        provider: (overrides.provider as any) ?? ((data as any).provider as any),
        seed: overrides.seed,
      });
      return { output: llm.text, llm: llm.raw, provider: llm.provider } as unknown as NodeOutput;
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
