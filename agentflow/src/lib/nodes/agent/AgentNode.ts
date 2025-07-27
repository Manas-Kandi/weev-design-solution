import { BaseNode, NodeContext } from "../base/BaseNode";
import { NodeOutput } from "@/types";
import { callGemini } from "@/lib/geminiClient";

// Define AgentNodeData type if not imported from elsewhere
export interface AgentNodeData {
  systemPrompt?: string;
  personality?: string;
  escalationLogic?: string;
  confidenceThreshold?: number;
  prompt?: string;
  model?: string;
}

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
      const response = await callGemini(finalPrompt, {
        model: data.model || "gemini-2.5-flash-lite",
      });
      return { gemini: response };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
