import { BaseNode, NodeContext } from "../base/BaseNode";
import { NodeOutput } from "@/types";
// LLM logic removed

interface DecisionRule {
  condition: string;
  outputPath: string;
  priority?: number;
}

export interface DecisionTreeNodeData {
  rules?: DecisionRule[];
  defaultPath?: string;
  evaluationMode?: "sequential" | "priority";
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

    // Ignore LLM evaluation mode since LLM is disabled

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
    const hay = context || '';
    return !!(condition && hay.includes(condition));
  }
  // Removed LLM-based evaluation helper
}
