import { BaseNode, NodeContext } from "../base/BaseNode";
import { NodeOutput } from "@/types";
import { callGemini } from "@/lib/geminiClient";

export interface ToolConfig {
  toolType:
    | "web-search"
    | "calculator"
    | "code-executor"
    | "file-operations"
    | "database-query"
    | "custom-api";
  endpoint?: string;
  apiKey?: string;
  parameters?: Record<string, unknown>;
}

export class ToolAgentNode extends BaseNode {
  async execute(context: NodeContext): Promise<NodeOutput> {
    const data = this.node.data as unknown as {
      toolConfig: ToolConfig;
      prompt?: string;
    };
    const toolConfig = data.toolConfig as ToolConfig;
    const inputContext = this.formatInputContext(context);

    if (!toolConfig) {
      return { error: "No tool configuration provided" };
    }

    // For now, simulate tool execution with Gemini
    // In production, this would call actual APIs
    const toolPrompt = this.buildToolPrompt(
      toolConfig,
      inputContext,
      data.prompt || ""
    );

    try {
      const response = await callGemini(toolPrompt, {
        model: "gemini-2.5-flash-lite",
      });
      return { gemini: response };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private buildToolPrompt(
    config: ToolConfig,
    context: string,
    userInput: string
  ): string {
    const toolDescriptions = {
      "web-search":
        "You are simulating a web search tool. Provide realistic search results.",
      calculator:
        "You are a calculator. Perform the requested mathematical operations.",
      "code-executor":
        "You are simulating code execution. Provide realistic output.",
      "file-operations":
        "You are simulating file operations. Describe the file operation results.",
      "database-query":
        "You are simulating database queries. Provide realistic query results.",
      "custom-api":
        "You are simulating an API call. Provide realistic API response.",
    };

    return `
${toolDescriptions[config.toolType]}

Context: ${context}
User Request: ${userInput}
${config.parameters ? `Parameters: ${JSON.stringify(config.parameters)}` : ""}

Provide a realistic response for this tool operation.
`;
  }
}
