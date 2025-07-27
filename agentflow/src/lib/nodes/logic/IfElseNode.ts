import { BaseNode, NodeContext } from "../base/BaseNode";
import { NodeOutput } from "@/types";
import { callGemini } from "@/lib/geminiClient";

export class IfElseNode extends BaseNode {
  async execute(context: NodeContext): Promise<NodeOutput> {
    interface IfElseNodeData {
      condition?: string;
      // Add other properties if needed
    }
    const data = this.node.data as IfElseNodeData;
    const condition = data.condition || "";
    const inputContext = this.formatInputContext(context);

    if (!condition) {
      return { error: "No condition specified" };
    }

    // Use Gemini to evaluate the condition
    const evalPrompt = `
Given the following context and condition, determine if the condition is TRUE or FALSE.
Respond with only "TRUE" or "FALSE".

Context: ${inputContext}
Condition: ${condition}
`;

    try {
      const response = await callGemini(evalPrompt, {
        model: "gemini-2.5-flash-lite",
        temperature: 0, // Low temperature for consistent evaluation
      });

      const result = response.candidates?.[0]?.content?.parts?.[0]?.text
        ?.trim()
        .toUpperCase();
      return result === "TRUE" ? "true" : "false";
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
