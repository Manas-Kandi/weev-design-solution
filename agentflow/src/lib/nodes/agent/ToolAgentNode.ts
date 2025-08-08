import { BaseNode, NodeContext } from "../base/BaseNode";
import { NodeOutput, ToolAgentNodeData } from "@/types";
import { callGemini } from "@/lib/geminiClient";
import { getProvider } from "@/lib/simulation/providers";

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
    const data = this.node.data as unknown as ToolAgentNodeData & {
      toolConfig?: ToolConfig;
      prompt?: string;
    };
    const toolConfig = (data.toolConfig || {
      toolType: "web-search",
      parameters: {},
    }) as ToolConfig;
    const inputContext = this.formatInputContext(context);

    // Prefer simulation-first execution if configured
    const simulation = data.simulation;
    const rules = data.rules;

    // 1) Simulation Mode → run provider registry (default if mode undefined and provider exists)
    const shouldSimulate = (() => {
      if (!simulation) return false;
      if (simulation.mode === "simulate") return true;
      if (!simulation.mode) return !!simulation.providerId; // default to simulate when provider configured
      return false;
    })();

    if (shouldSimulate) {
      if (!simulation) {
        return { error: "Simulation config missing" };
      }
      const sim = simulation; // narrowed
      const provider = getProvider(sim.providerId || "");
      if (!provider) {
        // Gracefully fall back to LLM if provider missing
      } else {
        const op = sim.operation || provider.operations[0]?.name;
        if (!op) {
          return { error: "Simulation: No operation selected or available" };
        }
        try {
          const result = await provider.run({
            operation: op,
            params: sim.params || {},
            scenarioId: sim.scenarioId,
            latencyMs: sim.latencyMs,
            injectError: sim.injectError || null,
          });
          // Return structured JSON so the Results panel shows it nicely
          return { data: result, metadata: { provider: provider.id, operation: op, mode: "simulate" } } as unknown as NodeOutput;
        } catch (e) {
          return { error: e instanceof Error ? e.message : "Simulation failed" };
        }
      }
    }

    // 2) Live/LLM Mode → build prompt from natural-language rules if present
    const toolPrompt = this.buildToolPromptFromRules({
      rulesNl: rules?.nl || "",
      compiledOp: rules?.compiled?.operation,
      simulationParams: simulation?.params,
      inputContext,
      fallbackConfig: toolConfig,
      userInput: data.prompt || "",
    });

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

  private buildToolPromptFromRules(args: {
    rulesNl: string;
    compiledOp?: string;
    simulationParams?: Record<string, unknown> | undefined;
    inputContext: string;
    fallbackConfig: ToolConfig;
    userInput: string;
  }): string {
    const { rulesNl, compiledOp, simulationParams, inputContext, fallbackConfig, userInput } = args;

    const baseDescByTool: Record<string, string> = {
      "web-search": "You are simulating a web search tool. Provide realistic search results.",
      calculator: "You are a calculator. Perform the requested mathematical operations.",
      "code-executor": "You are simulating code execution. Provide realistic output.",
      "file-operations": "You are simulating file operations. Describe the file operation results.",
      "database-query": "You are simulating database queries. Provide realistic query results.",
      "custom-api": "You are simulating an API call. Provide realistic API response.",
    };

    const desc = baseDescByTool[fallbackConfig.toolType] || baseDescByTool["custom-api"];
    const paramsMerged = simulationParams ?? fallbackConfig.parameters ?? {};

    const nlBlock = rulesNl ? `Behavior Rule:\n${rulesNl}\n` : "";
    const opBlock = compiledOp ? `Operation: ${compiledOp}\n` : "";
    const paramsBlock = Object.keys(paramsMerged).length ? `Parameters: ${JSON.stringify(paramsMerged)}` : "";

    const systemSimulator = `SYSTEM: You are an Agent Simulator. You DO NOT ask for permissions or external access. You simulate the results of tools and APIs based on the behavior rule, inputs, and parameters. You invent plausible but deterministic-feeling outputs and clearly structured data when applicable. Stay concise. Do not roleplay as a human assistant; behave as a simulation engine. If information is missing, make a sensible assumption consistent with the scenario.`;

    const outputGuidance = `Output: Provide the simulated tool result directly. Prefer structured JSON for data-centric operations. Examples: calendar → [{ "title": "...", "start": "ISO", "end": "ISO", "location": "..." }]; email-send → { "status": "sent", "to": "...", "subject": "..." }.`;

    return `
${systemSimulator}

${desc}

${nlBlock}${opBlock}
Context: ${inputContext}
User Request: ${userInput}
${paramsBlock}

${outputGuidance}
`;
  }
}
