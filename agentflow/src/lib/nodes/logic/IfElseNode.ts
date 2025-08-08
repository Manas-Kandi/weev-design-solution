import { BaseNode, NodeContext } from "../base/BaseNode";
import { NodeOutput } from "@/types";
import { callGemini } from "@/lib/geminiClient";

export class IfElseNode extends BaseNode {
  async execute(context: NodeContext): Promise<NodeOutput> {
    // Use the strict IfElseNodeData type
    const data = this.node.data as import("@/types").IfElseNodeData;
    const condition = data.condition || "";
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
    const systemPrompt = `
You are an expert flow router for an AI workflow tool. Your job is to evaluate routing rules written in natural language or simple logic.

- The user will provide a rule (the "Condition") and an input (the "Input").
- Interpret the rule as flexibly as possible and decide if the input matches the rule.
- Respond ONLY with "TRUE" or "FALSE" (no explanation).
- Examples:
  - Condition: If the message contains 'refund', route to Support.  Input: I want a refund.  → TRUE
  - Condition: If the user asks about pricing, route to Sales.  Input: What does it cost?  → TRUE
  - Condition: If the input is empty, return false.  Input:   → FALSE

---
Condition: ${condition}
Input: ${typeof input === "string" ? input : JSON.stringify(input)}
Context: ${JSON.stringify(nodeContext)}
---
Remember: Only output TRUE or FALSE.
`;

    try {
      const response = await callGemini("", {
        model: "gemini-2.5-flash-lite",
        temperature: 0, // Deterministic for logic nodes
        contents: [
          {
            role: "user",
            parts: [{ text: systemPrompt }],
          },
        ],
      });
      const resultText = response.candidates?.[0]?.content?.parts?.[0]?.text
        ?.trim()
        .toUpperCase();
      const isTrue = resultText === "TRUE";
      return {
        output: isTrue ? "true" : "false",
        gemini: response,
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
