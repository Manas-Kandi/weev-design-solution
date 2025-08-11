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

    // Build system prompt: combine backend systemPrompt with user behavior
    const systemParts: string[] = [];
    
    // 1. Backend system prompt (hidden from UI)
    if ("systemPrompt" in data && data.systemPrompt) {
      systemParts.push(String(data.systemPrompt));
    } else {
      // Default system prompt if none exists
      systemParts.push("You are an autonomous agent operating in a workflow. You will receive further instructions and context.");
    }
    
    // 2. User-defined behavior (from the UI text box)
    if ("behavior" in data && data.behavior && String(data.behavior).trim()) {
      systemParts.push(String(data.behavior));
    }
    
    // 3. Rules if any
    const rulesText = getRuleText(data as unknown as Record<string, unknown>);
    const rulesSystem = buildSystemFromRules({ rulesNl: rulesText, fallback: undefined });
    if (rulesSystem) {
      systemParts.push(rulesSystem);
    }
    
    // Combine all system prompt parts
    const combinedSystem = systemParts
      .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      .join("\n\n");
    
    if (combinedSystem) prompts.push(`System: ${combinedSystem}`);

    // Legacy personality field (for backward compatibility)
    if ("personality" in data && data.personality && !("behavior" in data)) {
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
