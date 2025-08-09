import { BaseNode, NodeContext } from "../base/BaseNode";
import { NodeOutput, AgentNodeData } from "@/types";
import { callLLM } from "@/lib/llmClient";
import { getRuleText, buildSystemFromRules } from "../util/rules";

// Using AgentNodeData from types

export class AgentNode extends BaseNode {
  async execute(context: NodeContext): Promise<NodeOutput> {
    const data = this.node.data as AgentNodeData;

    // Build the prompt
    const prompts: string[] = [];

    // System prompt
    const rulesText = getRuleText(data as unknown as Record<string, unknown>);
    const combinedSystem = [
      ("systemPrompt" in data && data.systemPrompt) ? String(data.systemPrompt) : undefined,
      buildSystemFromRules({ rulesNl: rulesText, fallback: undefined }),
    ]
      .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      .join("\n");
    if (combinedSystem) prompts.push(`System: ${combinedSystem}`);

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
        // Do NOT pass node-level provider/model; rely on global defaults unless explicitly overridden
        model: overrides.model,
        provider: overrides.provider as any,
        temperature: typeof overrides.temperature === "number"
          ? overrides.temperature
          : (typeof (data as any).temperature === "number" ? (data as any).temperature : 0.2),
        seed: overrides.seed,
        system: combinedSystem || undefined,
      });
      return { output: llm.text, llm: llm.raw, provider: llm.provider } as unknown as NodeOutput;
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
