import { BaseNode, NodeContext } from "../base/BaseNode";
import { NodeOutput } from "@/types";
import { callLLM } from "@/lib/llmClient";

interface DecisionRule {
  condition: string;
  outputPath: string;
  priority?: number;
}

export interface DecisionTreeNodeData {
  rules?: DecisionRule[];
  defaultPath?: string;
  evaluationMode?: "sequential" | "priority" | "llm";
}

export class DecisionTreeNode extends BaseNode {
  async execute(context: NodeContext): Promise<NodeOutput> {
    const data = this.node.data as DecisionTreeNodeData;
    const rules = data.rules || [];
    const defaultPath = data.defaultPath || "default";
    const evaluationMode = data.evaluationMode || "sequential";
    const inputContext = this.formatInputContext(context);

    if (rules.length === 0) {
      return { error: "No decision rules defined" };
    }

    // Sort rules by priority if in priority mode
    const sortedRules =
      evaluationMode === "priority"
        ? [...rules].sort((a, b) => (b.priority || 0) - (a.priority || 0))
        : rules;

    if (evaluationMode === "llm") {
      // Use LLM to evaluate all rules at once
      return this.evaluateWithLLM(sortedRules, inputContext, defaultPath);
    }

    // Sequential or priority evaluation
    for (const rule of sortedRules) {
      const isTrue = await this.evaluateCondition(rule.condition, inputContext);
      if (isTrue) {
        return rule.outputPath;
      }
    }

    return defaultPath;
  }

  private async evaluateCondition(
    condition: string,
    context: string
  ): Promise<boolean> {
    const evalPrompt = `
Given the following context, determine if this condition is TRUE or FALSE.
Respond with only "TRUE" or "FALSE".

Context: ${context}
Condition: ${condition}
`;

    try {
      const llm = await callLLM(evalPrompt, { temperature: 0 });
      const result = (llm.text || "").trim().toUpperCase();
      return result === "TRUE";
    } catch {
      return false;
    }
  }

  private async evaluateWithLLM(
    rules: DecisionRule[],
    context: string,
    defaultPath: string
  ): Promise<NodeOutput> {
    const rulesText = rules
      .map(
        (r, i) => `${i + 1}. If "${r.condition}" then output "${r.outputPath}"`
      )
      .join("\n");

    const evalPrompt = `
Given the context below, evaluate which rule applies and return ONLY the output path.

Context: ${context}

Rules:
${rulesText}

If no rules apply, return: ${defaultPath}

Return only the output path, nothing else.
`;

    try {
      const llm = await callLLM(evalPrompt, { temperature: 0 });
      const result = (llm.text || "").trim() || defaultPath;
      return result;
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
