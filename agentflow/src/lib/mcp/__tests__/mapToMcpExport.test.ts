import { describe, it, expect } from 'vitest';
import { mapToMcpExport, buildMcpToolsFromMocks } from '@/lib/mcp/mapToMcpExport';
import type { CanvasNode, Connection } from '@/types';

const node = (id: string, subtype: string, data: Record<string, any> = {}): CanvasNode => ({
  id,
  type: 'agent',
  subtype,
  position: { x: 0, y: 0 },
  size: { width: 200, height: 100 },
  data: data as any,
  inputs: [],
  outputs: [],
});

const conn = (id: string, from: string, to: string): Connection => ({
  id,
  sourceNode: from,
  sourceOutput: 'out',
  targetNode: to,
  targetInput: 'in',
});

describe('buildMcpToolsFromMocks', () => {
  it('returns an array of tool definitions', () => {
    const tools = buildMcpToolsFromMocks();
    expect(Array.isArray(tools)).toBe(true);
    // Tool mocks have been removed, so we expect an empty array
    expect(tools.length).toBe(0);
  });
});

describe('mapToMcpExport', () => {
  it('produces a schema-valid MCP export', () => {
    const nodes: CanvasNode[] = [
      node('n1', 'AgentNode', { title: 'Agent A', systemPrompt: 'You are helpful.' }),
      node('n2', 'ToolAgentNode', { title: 'Tool A' }),
    ];
    const connections: Connection[] = [conn('c1', 'n1', 'n2')];

    const { export: doc, validation } = mapToMcpExport({
      projectId: 'proj1',
      projectName: 'Test Project',
      projectDescription: 'desc',
      startNodeId: 'n1',
      nodes,
      connections,
      env: { mode: 'mock', seed: 'auto', scenario: 'smoke' },
    });

    expect(validation.valid).toBe(true);
    expect(doc.version).toBeTypeOf('string');
    expect(doc.flows.length).toBe(1);
    expect(doc.flows[0].nodes.length).toBe(2);
    // Tool mocks have been removed, so we expect 0 tools
    expect(doc.tools.length).toBe(0);
    expect(doc.environment.mode).toBe('mock');
  });
});
