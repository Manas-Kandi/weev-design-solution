import { adaptCanvasToMcpFlow, McpExport, McpToolDefinition, validateMcpExport, MCP_SCHEMA_VERSION } from "@/types/mcp.types";
import type { CanvasNode, Connection } from "@/types";
import { TOOL_MOCKS } from "@/types/toolSimulator";

export interface EnvOverrides {
  mode?: "mock" | "mixed" | "live";
  mockProfile?: string | null;
  seed?: string | "auto";
  latencyMin?: number;
  latencyMax?: number;
  errorType?: string | null;
  errorProbability?: number | null;
  scenario?: string | null;
  llmProvider?: string | null;
  llmModel?: string | null;
  llmTemperature?: number | null;
}

/**
 * Build MCP ToolDefinitions from the TOOL_MOCKS registry by flattening each tool operation
 * as a separate tool entry named `${toolName}.${operation}`.
 */
export function buildMcpToolsFromMocks(): McpToolDefinition[] {
  const out: McpToolDefinition[] = [];
  for (const [toolName, cfg] of Object.entries(TOOL_MOCKS)) {
    for (const op of cfg.operations) {
      const args: Record<string, unknown> = { type: "object", required: [], properties: {} } as any;
      for (const p of op.parameters) {
        (args as any).properties[p.name] = {
          type: p.type,
          description: p.description,
          ...(p.enum ? { enum: p.enum } : {}),
          ...(p.default !== undefined ? { default: p.default } : {}),
        };
        if (p.required) (args as any).required.push(p.name);
      }
      const returns = op.responseSchema ?? { type: "object" };
      out.push({
        name: `${toolName}.${op.name}`,
        schema: { args, returns },
        description: op.description,
        category: cfg.category,
      });
    }
  }
  return out;
}

export interface MapToMcpParams {
  projectId: string;
  projectName: string;
  projectDescription?: string | null;
  startNodeId?: string | null;
  nodes: CanvasNode[];
  connections: Connection[];
  env?: EnvOverrides;
}

export interface MapToMcpResult {
  export: McpExport;
  validation: ReturnType<typeof validateMcpExport>;
}

/**
 * Assemble a schema-valid McpExport from canvas nodes, connections, and environment.
 * Does NOT mutate inputs.
 */
export function mapToMcpExport(params: MapToMcpParams): MapToMcpResult {
  const { projectId, projectName, projectDescription, startNodeId, nodes, connections, env } = params;

  const createdAtEpoch = Math.floor(Date.now() / 1000); // note: MCP types expect number

  const flow = adaptCanvasToMcpFlow({
    id: projectId,
    nodes: nodes.slice(),
    connections: connections.slice(),
    createdBy: "weev",
    rationale: projectDescription ?? undefined,
    createdAt: createdAtEpoch,
    startNodeIds: startNodeId ? [startNodeId] : undefined,
  });

  const tools = buildMcpToolsFromMocks();

  const environment = {
    mode: env?.mode ?? "mock",
    mockProfile: env?.mockProfile ?? undefined,
    seed: env?.seed ?? "auto",
    latency: env?.latencyMin !== undefined || env?.latencyMax !== undefined ? {
      ...(env?.latencyMin !== undefined ? { min: env.latencyMin } : {}),
      ...(env?.latencyMax !== undefined ? { max: env.latencyMax } : {}),
    } : undefined,
    errorInjection: env?.errorType ? {
      type: env.errorType,
      ...(typeof env.errorProbability === 'number' ? { probability: env.errorProbability } : {}),
    } : null,
    scenario: env?.scenario ?? undefined,
    llmDefaults: (env?.llmProvider || env?.llmModel || typeof env?.llmTemperature === 'number') ? {
      ...(env?.llmProvider ? { provider: env.llmProvider } : {}),
      ...(env?.llmModel ? { model: env.llmModel } : {}),
      ...(typeof env?.llmTemperature === 'number' ? { temperature: env.llmTemperature } : {}),
    } : undefined,
  } as McpExport['environment'];

  const doc: McpExport = {
    version: MCP_SCHEMA_VERSION,
    flows: [flow],
    tools,
    environment,
  };

  const validation = validateMcpExport(doc);
  return { export: doc, validation };
}
