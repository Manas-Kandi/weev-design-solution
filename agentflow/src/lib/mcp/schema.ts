// JSON Schema publication and versioning for MCP export
// Keep in sync with export.ts McpExportFormat

export const CURRENT_EXPORT_VERSION = '1.1.0';

const schema_1_1_0 = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'https://agentflow.dev/schema/mcp-export-1.1.0.json',
  title: 'AgentFlow MCP Export v1.1.0',
  type: 'object',
  required: ['projectId', 'projectName', 'version', 'timestamp', 'flow', 'metadata'],
  additionalProperties: false,
  properties: {
    projectId: { type: 'string' },
    projectName: { type: 'string' },
    version: { type: 'string', const: '1.1.0' },
    timestamp: { type: 'string', format: 'date-time' },
    startNodeId: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    flow: {
      type: 'object',
      required: ['nodes', 'connections'],
      additionalProperties: false,
      properties: {
        nodes: {
          type: 'array',
          items: { $ref: '#/definitions/CanvasNode' },
        },
        connections: {
          type: 'array',
          items: { $ref: '#/definitions/Connection' },
        },
      },
    },
    metadata: {
      type: 'object',
      required: ['portSchemas', 'nodeConfigs', 'knowledgeBaseAssets'],
      additionalProperties: false,
      properties: {
        portSchemas: {
          type: 'object',
          description: 'Map of nodeId to its inputs and outputs schema',
          additionalProperties: {
            type: 'object',
            required: ['inputs', 'outputs'],
            additionalProperties: false,
            properties: {
              inputs: { type: 'array', items: { $ref: '#/definitions/PortDefinition' } },
              outputs: { type: 'array', items: { $ref: '#/definitions/PortDefinition' } },
            },
          },
        },
        nodeConfigs: {
          type: 'object',
          description: 'Map of nodeId to its configuration (data payload)',
          additionalProperties: true,
        },
        knowledgeBaseAssets: {
          type: 'array',
          items: { $ref: '#/definitions/Asset' },
        },
      },
    },
  },
  definitions: {
    CanvasNode: {
      type: 'object',
      required: ['id', 'type', 'subtype', 'position', 'size'],
      additionalProperties: true,
      properties: {
        id: { type: 'string' },
        type: { type: 'string', enum: ['agent', 'conversation', 'logic', 'testing', 'ui'] },
        subtype: { type: 'string' },
        position: { $ref: '#/definitions/Position' },
        size: { $ref: '#/definitions/Size' },
        data: { type: 'object' },
        inputs: { type: 'array', items: { $ref: '#/definitions/PortDefinition' } },
        outputs: { type: 'array', items: { $ref: '#/definitions/PortDefinition' } },
        output: { type: ['object', 'string'], nullable: true },
        context: { type: 'object' },
      },
    },
    Connection: {
      type: 'object',
      required: ['id', 'sourceNode', 'sourceOutput', 'targetNode', 'targetInput'],
      additionalProperties: false,
      properties: {
        id: { type: 'string' },
        sourceNode: { type: 'string' },
        sourceOutput: { type: 'string' },
        targetNode: { type: 'string' },
        targetInput: { type: 'string' },
      },
    },
    PortDefinition: {
      type: 'object',
      required: ['id', 'label'],
      additionalProperties: true,
      properties: {
        id: { type: 'string' },
        label: { type: 'string' },
        type: { type: 'string' },
      },
    },
    Position: {
      type: 'object',
      required: ['x', 'y'],
      additionalProperties: false,
      properties: {
        x: { type: 'number' },
        y: { type: 'number' },
      },
    },
    Size: {
      type: 'object',
      required: ['width', 'height'],
      additionalProperties: false,
      properties: {
        width: { type: 'number' },
        height: { type: 'number' },
      },
    },
    Asset: {
      type: 'object',
      required: ['id', 'name', 'file_path', 'file_type', 'size_bytes', 'created_at'],
      additionalProperties: false,
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        file_path: { type: 'string' },
        file_type: { type: 'string' },
        size_bytes: { type: 'number' },
        created_at: { type: 'string', format: 'date-time' },
      },
    },
  },
};

const schema_1_0_0 = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'https://agentflow.dev/schema/mcp-export-1.0.0.json',
  title: 'AgentFlow MCP Export v1.0.0',
  type: 'object',
  required: ['projectId', 'projectName', 'version', 'timestamp', 'flow'],
  additionalProperties: true,
  properties: {
    projectId: { type: 'string' },
    projectName: { type: 'string' },
    version: { type: 'string', const: '1.0.0' },
    timestamp: { type: 'string', format: 'date-time' },
    startNodeId: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    flow: {
      type: 'object',
      required: ['nodes', 'connections'],
      properties: {
        nodes: { type: 'array' },
        connections: { type: 'array' },
      },
    },
  },
};

const SCHEMAS: Record<string, object> = {
  '1.1.0': schema_1_1_0,
  '1.0.0': schema_1_0_0,
};

export function getMcpExportSchema(version: string): object | null {
  return SCHEMAS[version] || null;
}
