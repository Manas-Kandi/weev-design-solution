/**
 * MCP (Model Context Protocol) Types and Schema Contracts – v0.1
 *
 * This file defines the portable MCP export schema used to serialize Weev flows
 * so that external tools (e.g., Windsurf IDE) can load, run, debug, and edit the
 * exact workflow without loss of information.
 *
 * Backward-compatibility:
 * - Aligns with existing canvas types in `src/types/index.ts` (CanvasNode, Connection, node data shapes)
 * - Does NOT alter existing types; only adds new MCP-facing contracts
 *
 * Validations:
 * - `validateMcpExport()` performs minimal, strict runtime validation to ensure
 *   required fields are present and conform to expected shapes.
 */

import type {
  AgentNodeData,
  ToolAgentNodeData,
  DecisionTreeNodeData,
  KnowledgeBaseNodeData,
  CanvasNode,
  Connection,
} from './index';
import type { ToolEnvironment } from './toolSimulator';

// Re-export ToolEnvironment for external consumers
export type { ToolEnvironment };

/**
 * Stable MCP schema version string for cross-tool compatibility checks.
 */
export const MCP_SCHEMA_VERSION = '0.1' as const;

/**
 * Reduced node set supported by the initial MCP export.
 * These are logical types (title-cased) for portable interchange.
 */
export type McpNodeKind =
  | 'Agent'
  | 'ToolAgent'
  | 'DecisionTree'
  | 'KnowledgeBase';

/**
 * Node configuration payload allowed in MCP. This intentionally maps to the
 * corresponding node data interfaces but is kept as Partial to allow forward
 * compatibility while remaining type-safe for current fields.
 */
export type McpNodeConfig =
  | Partial<AgentNodeData>
  | Partial<ToolAgentNodeData>
  | Partial<DecisionTreeNodeData>
  | Partial<KnowledgeBaseNodeData>;

/**
 * Portable node descriptor used by MCP FlowSpec.
 */
export interface McpNodeSpec {
  /** Stable unique node id within the flow. */
  id: string;
  /** Logical node kind in the reduced set. */
  kind: McpNodeKind;
  /** Optional human-readable label/title for UIs. */
  label?: string;
  /** Node configuration payload; shape depends on `kind`. */
  config: McpNodeConfig;
  /**
   * Optional prompt/system fields used by execution engines.
   * For Agent/ToolAgent these may include `systemPrompt`, `behavior`, `temperature`, etc.
   */
  prompts?: {
    systemPrompt?: string;
    userPrompt?: string;
    behavior?: string;
    temperature?: number;
    provider?: string; // e.g., 'nvidia' | 'gemini'
    model?: string;
  };
}

/**
 * Portable edge descriptor used by MCP FlowSpec.
 * Kept minimal and portable; endpoints are node ids.
 */
export interface McpEdgeSpec {
  /** Stable unique edge id within the flow. */
  id: string;
  /** Source node id. */
  from: string;
  /** Target node id. */
  to: string;
  /** Optional label or condition string (for decision/branching). */
  condition?: string;
  label?: string;
}

/**
 * Additional portable metadata to accompany a flow.
 */
export interface McpFlowMeta {
  /** Identifier of tool that created/last exported the flow, e.g., 'weev' or 'flow-builder'. */
  createdBy: string;
  /** Human rationale or description. */
  rationale?: string;
  /** Epoch seconds of creation time. */
  createdAt: number;
  /** Optional arbitrary tags for organization. */
  tags?: string[];
}

/**
 * A single portable flow definition inside an MCP export.
 */
export interface McpFlowSpec {
  /** Stable flow id (unique within the export). */
  id: string;
  /** List of portable node specs. */
  nodes: McpNodeSpec[];
  /** List of portable edge specs. */
  edges: McpEdgeSpec[];
  /** Portable metadata. */
  meta: McpFlowMeta;
  /** Optional hint for engines: which node(s) to start from. */
  startNodeIds?: string[];
}

/**
 * Simple, JSON-schema-like shape for tool args/returns.
 * External consumers may treat these as JSON Schema fragments.
 */
export interface McpToolSchema {
  /**
   * Input argument schema. Accepts either a JSON Schema object or a simple
   * record-based schema. Engines should treat this as descriptive only.
   */
  args: Record<string, unknown>;
  /** Return/result schema with same conventions as `args`. */
  returns: Record<string, unknown>;
}

/**
 * Tool definition: declares contract necessary for an MCP consumer to invoke a tool.
 */
export interface McpToolDefinition {
  /** Tool name (unique within export). */
  name: string;
  /** Portable schema for arguments and returns. */
  schema: McpToolSchema;
  /** Optional human-readable description. */
  description?: string;
  /** Optional category for grouping (e.g., 'calendar', 'email'). */
  category?: string;
}

/**
 * Error injection configuration for reproducible testing.
 */
export interface McpErrorInjection {
  /** Error kind identifier; up to the consumer/tooling. */
  type: string;
  /** Optional message payload. */
  message?: string;
  /** Optional chance (0-1) to inject error. */
  probability?: number;
}

/**
 * Environment configuration describing how a flow is expected to execute.
 */
export interface McpEnvironmentConfig {
  /** Execution mode: mock, mixed, or live. */
  mode: ToolEnvironment; // 'mock' | 'mixed' | 'live'
  /** Active mock profile id when mode is mock/mixed. */
  mockProfile?: string;
  /** Randomness seed; string value or 'auto' to indicate non-deterministic. */
  seed?: string | 'auto';
  /** Optional latency budget/config. */
  latency?: { min?: number; max?: number };
  /** Optional global error injection configuration. */
  errorInjection?: McpErrorInjection | null;
  /** Optional scenario label/id from the Testing Panel. */
  scenario?: string;
  /** Optional LLM provider/model defaults used across the flow. */
  llmDefaults?: { provider?: string; model?: string; temperature?: number };
}

/**
 * Root MCP export document. This is the portable artifact produced at /export/mcp.
 */
export interface McpExport {
  /** Schema version string. */
  version: typeof MCP_SCHEMA_VERSION | string;
  /** Collection of flows (usually a single active flow). */
  flows: McpFlowSpec[];
  /** Tool contracts available to the flow(s). */
  tools: McpToolDefinition[];
  /** Execution environment description. */
  environment: McpEnvironmentConfig;
}

/**
 * Alias to the app's RunManifest for test history persistence, exposed for MCP consumers.
 * This keeps a single source of truth while satisfying the MCP acceptance criteria.
 */
export type McpRunManifest = import('./tester').RunManifest;

/**
 * Minimal runtime validation result.
 */
export interface McpValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Runtime validator for MCP export documents.
 * Performs structural and required-field checks without external libraries.
 * Intended to be strict on required fields, lenient on optional metadata.
 */
export function validateMcpExport(doc: unknown): McpValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const isObject = (v: unknown): v is Record<string, unknown> =>
    !!v && typeof v === 'object';

  if (!isObject(doc)) {
    return { valid: false, errors: ['Document is not an object'], warnings };
  }

  const version = (doc as Record<string, unknown>)['version'];
  const flows = (doc as Record<string, unknown>)['flows'];
  const tools = (doc as Record<string, unknown>)['tools'];
  const environment = (doc as Record<string, unknown>)['environment'];

  if (typeof version !== 'string') {
    errors.push('version must be a string');
  }
  if (!Array.isArray(flows)) {
    errors.push('flows must be an array');
  }
  if (!Array.isArray(tools)) {
    errors.push('tools must be an array');
  }
  if (!isObject(environment)) {
    errors.push('environment must be an object');
  }

  // Validate environment basics
  if (isObject(environment)) {
    const mode = environment['mode'];
    if (mode !== 'mock' && mode !== 'mixed' && mode !== 'live') {
      errors.push("environment.mode must be 'mock' | 'mixed' | 'live'");
    }
    const seed = environment['seed'];
    if (seed !== undefined && !(typeof seed === 'string' || seed === 'auto')) {
      errors.push("environment.seed must be a string or 'auto'");
    }
    const latency = environment['latency'];
    if (latency !== undefined) {
      if (!isObject(latency))
        errors.push('environment.latency must be an object if provided');
      else {
        const min = latency['min'];
        const max = latency['max'];
        if (min !== undefined && typeof min !== 'number')
          errors.push('environment.latency.min must be a number');
        if (max !== undefined && typeof max !== 'number')
          errors.push('environment.latency.max must be a number');
      }
    }
    const errInj = environment['errorInjection'];
    if (errInj !== undefined && errInj !== null) {
      if (!isObject(errInj))
        errors.push('environment.errorInjection must be an object or null');
      else if (typeof errInj['type'] !== 'string')
        errors.push('environment.errorInjection.type must be a string');
      else if (
        errInj['probability'] !== undefined &&
        typeof errInj['probability'] !== 'number'
      ) {
        errors.push('environment.errorInjection.probability must be a number');
      }
    }
  }

  // Validate flows
  if (Array.isArray(flows)) {
    flows.forEach((flow, idx) => {
      if (!isObject(flow)) {
        errors.push(`flows[${idx}] must be an object`);
        return;
      }
      if (typeof flow['id'] !== 'string')
        errors.push(`flows[${idx}].id must be a string`);

      const nodes = flow['nodes'];
      if (!Array.isArray(nodes))
        errors.push(`flows[${idx}].nodes must be an array`);
      else {
        nodes.forEach((node, nIdx) => {
          if (!isObject(node)) {
            errors.push(`flows[${idx}].nodes[${nIdx}] must be an object`);
            return;
          }
          const id = node['id'];
          const kind = node['kind'];
          const config = node['config'];
          if (typeof id !== 'string')
            errors.push(`flows[${idx}].nodes[${nIdx}].id must be a string`);
          if (
            kind !== 'Agent' &&
            kind !== 'ToolAgent' &&
            kind !== 'DecisionTree' &&
            kind !== 'KnowledgeBase'
          ) {
            errors.push(
              `flows[${idx}].nodes[${nIdx}].kind must be one of Agent|ToolAgent|DecisionTree|KnowledgeBase`,
            );
          }
          if (!isObject(config))
            errors.push(
              `flows[${idx}].nodes[${nIdx}].config must be an object`,
            );
        });
      }

      const edges = flow['edges'];
      if (!Array.isArray(edges))
        errors.push(`flows[${idx}].edges must be an array`);
      else {
        edges.forEach((edge, eIdx) => {
          if (!isObject(edge)) {
            errors.push(`flows[${idx}].edges[${eIdx}] must be an object`);
            return;
          }
          if (typeof edge['id'] !== 'string')
            errors.push(`flows[${idx}].edges[${eIdx}].id must be a string`);
          if (typeof edge['from'] !== 'string')
            errors.push(`flows[${idx}].edges[${eIdx}].from must be a string`);
          if (typeof edge['to'] !== 'string')
            errors.push(`flows[${idx}].edges[${eIdx}].to must be a string`);
        });
      }

      const meta = flow['meta'];
      if (!isObject(meta)) errors.push(`flows[${idx}].meta must be an object`);
      else {
        if (typeof meta['createdBy'] !== 'string')
          errors.push(`flows[${idx}].meta.createdBy must be a string`);
        if (typeof meta['createdAt'] !== 'number')
          errors.push(
            `flows[${idx}].meta.createdAt must be a number (epoch seconds)`,
          );
        if (meta['tags'] !== undefined && !Array.isArray(meta['tags']))
          warnings.push(
            `flows[${idx}].meta.tags should be an array if provided`,
          );
      }
    });
  }

  // Validate tools
  if (Array.isArray(tools)) {
    tools.forEach((tool, idx) => {
      if (!isObject(tool)) {
        errors.push(`tools[${idx}] must be an object`);
        return;
      }
      if (typeof tool['name'] !== 'string')
        errors.push(`tools[${idx}].name must be a string`);
      const schema = tool['schema'];
      if (!isObject(schema))
        errors.push(`tools[${idx}].schema must be an object`);
      else {
        if (!isObject(schema['args']))
          errors.push(`tools[${idx}].schema.args must be an object`);
        if (!isObject(schema['returns']))
          errors.push(`tools[${idx}].schema.returns must be an object`);
      }
    });
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Helpers to adapt existing Canvas structures to portable MCP specs.
 * These are non-validating convenience adapters and are optional to use.
 */
export function adaptCanvasToMcpFlow(params: {
  id: string;
  nodes: CanvasNode[];
  connections: Connection[];
  createdBy: string;
  rationale?: string;
  createdAt: number;
  startNodeIds?: string[];
}): McpFlowSpec {
  const nodes: McpNodeSpec[] = params.nodes
    .filter((n) =>
      ['agent', 'conversation', 'logic', 'testing', 'ui'].includes(n.type),
    )
    .map((n) => {
      // Map canvas subtype to portable kind (only reduced set supported explicitly)
      const subtype = (n.subtype || '').toLowerCase();
      let kind: McpNodeKind = 'Agent';
      if (subtype.includes('tool')) kind = 'ToolAgent';
      else if (subtype.includes('decision')) kind = 'DecisionTree';
      else if (subtype.includes('knowledge')) kind = 'KnowledgeBase';

      // Type guards for node data
      const data = n.data ?? {};
      let systemPrompt: string | undefined;
      let userPrompt: string | undefined;
      let behavior: string | undefined;
      let temperature: number | undefined;
      let provider: string | undefined;
      let model: string | undefined;

      // AgentNodeData
      if ('systemPrompt' in data && typeof data.systemPrompt === 'string') {
        systemPrompt = data.systemPrompt;
      }
      if ('prompt' in data && typeof data.prompt === 'string') {
        userPrompt = data.prompt;
      }
      if ('behavior' in data && typeof data.behavior === 'string') {
        behavior = data.behavior;
      }
      if ('temperature' in data && typeof data.temperature === 'number') {
        temperature = data.temperature;
      }
      if ('provider' in data && typeof data.provider === 'string') {
        provider = data.provider;
      }
      if ('model' in data && typeof data.model === 'string') {
        model = data.model;
      }

      return {
        id: n.id,
        kind,
        label:
          typeof data === 'object' &&
          data !== null &&
          'title' in data &&
          typeof (data as { title?: unknown }).title === 'string'
            ? (data as { title: string }).title
            : n.subtype || n.id,
        config: data as McpNodeConfig,
        prompts: {
          systemPrompt,
          userPrompt,
          behavior,
          temperature,
          provider,
          model,
        },
      } satisfies McpNodeSpec;
    });

  const edges: McpEdgeSpec[] = params.connections.map((c) => ({
    id: c.id,
    from: c.sourceNode,
    to: c.targetNode,
    label: `${c.sourceOutput ?? 'out'}→${c.targetInput ?? 'in'}`,
  }));

  return {
    id: params.id,
    nodes,
    edges,
    meta: {
      createdBy: params.createdBy,
      rationale: params.rationale,
      createdAt: params.createdAt,
    },
    startNodeIds: params.startNodeIds,
  };
}
