# MCP JSON Format (v0.1)

This document describes the portable MCP JSON used for Weev ↔ Windsurf round-trip.
For the authoritative machine-validated schema, see `public/mcp.schema.json`.

- Version: `0.1`
- Root type: `McpExport`

## Structure

- `version: string` — schema version, currently `0.1`.
- `flows: McpFlowSpec[]` — list of flows (usually 1).
- `tools: McpToolDefinition[]` — available tool contracts; Weev exports from internal TOOL_MOCKS.
- `environment: McpEnvironmentConfig` — execution environment (mode, latency, error injection, llm defaults).

### FlowSpec
- `id: string` — stable flow id.
- `nodes: McpNodeSpec[]` — portable node descriptors.
- `edges: McpEdgeSpec[]` — portable edge descriptors.
- `meta: McpFlowMeta` — metadata (createdBy, createdAt, rationale).
- `startNodeIds?: string[]` — optional start node(s).

### NodeSpec
- `id: string` — stable unique id.
- `kind: "Agent" | "ToolAgent" | "DecisionTree" | "KnowledgeBase"`.
- `label?: string` — optional human title.
- `config: object` — node-type-specific configuration. Round-trip safe.
- `prompts?: { systemPrompt?, userPrompt?, behavior?, temperature?, provider?, model? }` — LLM prompt/model fields.

### EdgeSpec
- `id: string` — stable unique id.
- `from: string` — source node id.
- `to: string` — target node id.
- `condition?: string` — optional edge condition/label.
- `label?: string` — optional display label.

### ToolDefinition
- `name: string` — unique name; Weev flattens operations to `tool.operation`.
- `schema: { args: object; returns: object }` — JSON-schema-like shapes.
- `description?: string`, `category?: string`.

### Environment
- `mode: "mock" | "mixed" | "live"`.
- `mockProfile?: string`, `seed?: string | "auto"`.
- `latency?: { min?: number; max?: number }`.
- `errorInjection?: { type: string; message?: string; probability?: number } | null`.
- `scenario?: string`.
- `llmDefaults?: { provider?: string; model?: string; temperature?: number }`.

## Mapping to Weev Canvas

- Node `kind` maps to Weev `CanvasNode.type/subtype`:
  - Agent → (`agent`, `agent`)
  - ToolAgent → (`agent`, `tool-agent`)
  - DecisionTree → (`logic`, `decision-tree`)
  - KnowledgeBase → (`logic`, `knowledge-base`)
- Prompts are merged into node `data` fields.
- Default single ports are assigned on import: `inputs:[{id:"input-1"}]`, `outputs:[{id:"output-1"}]`.
- Edges map to `Connection` using those default ports.

## Import API

POST `/api/projects/:id/import/mcp`

Body: `McpExport` JSON

- Validates with `validateMcpExport()`
- Replaces project flow: deletes existing connections + nodes, then inserts imported nodes and connections.
- Updates `projects.start_node_id` from `startNodeIds[0]`.

Example:
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d @weev-example-mcp.json \
  http://localhost:3000/api/projects/<PROJECT_ID>/import/mcp
```

## Export API

GET `/api/projects/:id/export/mcp`

- Returns schema-valid `McpExport`.
- Includes tool mocks from internal registry.
- Dates are epoch seconds (UTC base).

## Round-Trip Guarantees

- No field drops for nodes/edges/prompts.
- IDs preserved end-to-end; importer rejects duplicates.
- Tool schemas are included on export and validated on import. Weev currently uses internal TOOL_MOCKS for execution; imported tool definitions are not persisted yet.

For any questions, see `src/types/mcp.types.ts`, `src/lib/mcp/mapToMcpExport.ts`, and `src/lib/mcp/mapFromMcpExport.ts`.
