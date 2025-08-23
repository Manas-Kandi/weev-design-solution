import { BaseNode, NodeContext } from "../base/BaseNode";
import { NodeOutput, ToolAgentNodeData } from "@/types";
// LLM logic removed
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
    const globalSim = context.runOptions?.simulation;
    const overrides = context.runOptions?.overrides || {};
    const rules = data.rules;

    // 1) Simulation Mode → run provider registry (default if mode undefined and provider exists)
    const shouldSimulate = (() => {
      if (globalSim?.useSimulators) return true;
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
          // Optional global latency simulation
          if (globalSim?.latencyMs && typeof globalSim.latencyMs.min === 'number' && typeof globalSim.latencyMs.max === 'number') {
            const { min, max } = globalSim.latencyMs;
            const delay = Math.max(0, Math.floor(min + Math.random() * Math.max(0, max - min)));
            if (delay > 0) await new Promise((r) => setTimeout(r, delay));
          }
          // Optional global failure injection if node-level not specified
          const injectError = sim.injectError ?? (
            typeof globalSim?.failurePercent === 'number' && globalSim.failurePercent > 0
              ? (Math.random() * 100 < globalSim.failurePercent ? { type: 'global', message: 'Injected failure by simulation settings' } : null)
              : null
          );
          const result = await provider.run({
            operation: op,
            params: sim.params || {},
            scenarioId: sim.scenarioId,
            latencyMs: sim.latencyMs,
            injectError,
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

    return { error: 'LLM is disabled in this build' } as unknown as NodeOutput;
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

    const outputGuidance = `Output: Provide the simulated tool result directly. Prefer structured JSON for data-centric operations. Examples: calendar → { "free_timeslots": [{ "start": "ISO", "end": "ISO", "durationMinutes": 60, "label": "optional" }] }; email-send → { "status": "sent", "to": "...", "subject": "..." }.`;

    const wantsCalendar = /calendar/i.test(rulesNl) || /calendar/i.test(userInput);
    const calendarSchema = wantsCalendar
      ? `\nSchema (calendar): { "free_timeslots": [{ "start": "ISO8601", "end": "ISO8601", "durationMinutes": number, "label"?: string }] }\nAssumptions: If no range is provided, use today in the user's locale; working hours 09:00-17:00; timezone from context if present else UTC. Always produce at least 3 one-hour slots if feasible. Do not return an error; make sensible assumptions.`
      : "";

    return `
${systemSimulator}

${desc}

${nlBlock}${opBlock}
Context: ${inputContext}
User Request: ${userInput}
${paramsBlock}

${outputGuidance}${calendarSchema}
`;
  }

  private buildSystemPrompt(args: { toolType: ToolConfig["toolType"]; rulesNl: string; userInput: string }): string {
    const { toolType, rulesNl, userInput } = args;
    const baseDescByTool: Record<string, string> = {
      "web-search": "You simulate a web search tool and produce plausible results.",
      calculator: "You simulate a calculator and return numeric results.",
      "code-executor": "You simulate code execution and return program output.",
      "file-operations": "You simulate file operations and return results.",
      "database-query": "You simulate database queries and return datasets.",
      "custom-api": "You simulate API calls and return realistic responses.",
    };
    const desc = baseDescByTool[toolType] || baseDescByTool["custom-api"];
    const wantsCalendar = /calendar/i.test(rulesNl) || /calendar/i.test(userInput);
    const calendarPolicy = wantsCalendar
      ? "When the user asks for calendar availability, always return a JSON object { \"free_timeslots\": [...] } with at least three 60-minute slots based on sensible assumptions if data is missing."
      : "";
    return [
      `${desc}`,
      "Return ONLY a single valid JSON object or array in assistant content. No prose, no markdown, no code fences, no control tokens.",
      "Do NOT include chain-of-thought or reasoning.",
      "If information is missing, make reasonable assumptions and still produce a best-effort JSON result.",
      calendarPolicy,
    ].filter(Boolean).join(" ");
  }

  private buildCalendarFallback(): { free_timeslots: Array<{ start: string; end: string; durationMinutes: number; label?: string }>; assumptions: { date: string; workHours: string; timezone: string } } {
    const now = new Date();
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

    const mk = (h: number, m: number) => {
      const d = new Date(date);
      d.setHours(h, m, 0, 0);
      return d;
    };
    const toISO = (d: Date) => d.toISOString();

    const slots = [
      { start: mk(9, 0), end: mk(10, 0), label: 'Morning slot' },
      { start: mk(11, 0), end: mk(12, 0), label: 'Late morning' },
      { start: mk(15, 0), end: mk(16, 0), label: 'Afternoon slot' },
    ].map(s => ({ start: toISO(s.start), end: toISO(s.end), durationMinutes: 60, label: s.label }));

    return {
      free_timeslots: slots,
      assumptions: {
        date: date.toISOString().slice(0, 10),
        workHours: '09:00-17:00',
        timezone: tz,
      },
    };
  }
}
