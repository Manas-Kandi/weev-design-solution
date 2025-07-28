import { BaseNode, NodeContext } from "../base/BaseNode";
import { NodeOutput } from "@/types";

interface PromptTemplateNodeData {
  template?: string;
  variables?: Record<string, string>;
  // Allow dynamic variable extraction from input
  extractVariablesFromInput?: boolean;
}

export class PromptTemplateNode extends BaseNode {
  async execute(context: NodeContext): Promise<NodeOutput> {
    const data = this.node.data as PromptTemplateNodeData;
    const template = data.template || "";
    const staticVariables = data.variables || {};

    // Get input values to use as dynamic variables
    const inputValues = this.getInputValues(context);
    const inputContext = this.formatInputContext(context);

    // Extract variables from input if enabled
    const dynamicVariables: Record<string, string> = {};
    if (data.extractVariablesFromInput && inputContext) {
      // Simple extraction: look for key=value patterns
      const matches = inputContext.matchAll(/(\w+)=([^\n]+)/g);
      for (const match of matches) {
        dynamicVariables[match[1]] = match[2].trim();
      }
    }

    // Merge static and dynamic variables
    const allVariables = {
      ...dynamicVariables,
      ...staticVariables,
      input: inputContext, // Always provide the full input as a variable
    };

    // Replace variables in template
    let result = template;
    for (const [key, value] of Object.entries(allVariables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
      result = result.replace(regex, value);
    }

    // Also support numbered inputs {{input1}}, {{input2}}, etc.
    inputValues.forEach((value, index) => {
      const regex = new RegExp(`{{\\s*input${index + 1}\\s*}}`, "g");
      result = result.replace(regex, value);
    });

    return result;
  }
}
