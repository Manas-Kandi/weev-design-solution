import { BaseNode, NodeContext } from "../base/BaseNode";
import { NodeOutput } from "@/types";
import { callLLM } from "@/lib/llmClient";
import { getRuleText } from "../util/rules";

export class IfElseNode extends BaseNode {
  async execute(context: NodeContext): Promise<NodeOutput> {
    // Use the strict IfElseNodeData type
    const data = this.node.data as import("@/types").IfElseNodeData & Record<string, unknown>;
    const condition = (data.condition && String(data.condition)) || getRuleText(data) || "";
    // Prefer V2 inputs (respecting transforms/block); fallback to legacy helper
    const v2Inputs = context.inputs
      ? Object.values(context.inputs)
      : [];
    const toText = (val: import("@/types").NodeOutput): string => {
      if (typeof val === "string") return val;
      if (val && typeof val === "object") {
        // Common fields
        if (typeof (val as any).output === "string") return (val as any).output;
        if (typeof (val as any).message === "string") return (val as any).message;
        // Gemini extraction
        if ("gemini" in val && val.gemini) {
          const g: any = (val as any).gemini;
          const t = g?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (typeof t === "string") return t;
        }
      }
      try {
        return JSON.stringify(val);
      } catch {
        return String(val);
      }
    };
    const inputValues = v2Inputs.length > 0 ? v2Inputs.map(toText) : this.getInputValues(context);
    const input = inputValues.length === 1 ? inputValues[0] : inputValues;
    const nodeContext = data.context || {};

    if (!condition) {
      return { error: "No condition specified" };
    }

    // Compose a robust system prompt for natural language rule evaluation
    const systemPrompt = `You are a deterministic flow router. Return only TRUE or FALSE. No explanation. Favor clear substring/intent matches. Empty/unknown inputs → FALSE.`;
    const userPrompt = `Condition: ${condition}\nInput: ${typeof input === "string" ? input : JSON.stringify(input)}\nContext: ${JSON.stringify(nodeContext)}`;

    try {
      const overrides = context.runOptions?.overrides || {};
      const llm = await callLLM(userPrompt, { temperature: 0, provider: overrides.provider as any, model: overrides.model });
      const resultText = (llm.text || "").trim().toUpperCase();
      const isTrue = resultText === "TRUE";
      return {
        output: isTrue ? "true" : "false",
        llm: llm.raw,
        provider: llm.provider,
        info: JSON.stringify({
          condition,
          input,
          context: nodeContext,
          result: resultText,
          value: input, // included in info for downstream use
        }),
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Unknown error",
        info: JSON.stringify({
          condition,
          input,
          context: nodeContext,
        }),
      };
    }
  }
}
