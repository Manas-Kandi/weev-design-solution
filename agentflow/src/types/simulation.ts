export type SimulationMode = "simulate" | "live";

export interface SimulationScenario {
  id: string;
  label: string;
  description?: string;
}

export interface OperationSpec {
  name: string; // e.g., findEvents, listEmails
  paramsSchema?: Record<string, unknown>; // simple shape for UI
}

export interface SimulationProvider {
  id: string; // e.g., calendar, email
  label: string;
  operations: OperationSpec[];
  scenarios: SimulationScenario[];
  run: (args: {
    operation: string;
    params: Record<string, unknown>;
    scenarioId: string;
    latencyMs?: number;
    injectError?: { type: string; message?: string } | null;
  }) => Promise<{ data?: unknown; error?: string }>;
}

export interface CompiledRuleSpec {
  operation?: string; // inferred operation name
  fields?: string[];  // extracted keywords
  notes?: string;     // human readable summary
}

export interface ToolAgentRules {
  nl?: string;              // natural language rule text
  compiled?: CompiledRuleSpec; // generated/spec form
}

export interface ToolAgentSimulationConfig {
  providerId: string;
  operation?: string;
  scenarioId: string;
  latencyMs?: number;
  injectError?: { type: string; message?: string } | null;
  params?: Record<string, unknown>;
  mode?: SimulationMode; // default simulate
}
