import { describe, it, expect } from 'vitest';
import { mapToMcpExport } from '@/lib/mcp/mapToMcpExport';
import { mapFromMcpExport } from '@/lib/mcp/mapFromMcpExport';
import type { CanvasNode, Connection } from '@/types';

function normalizeNode(n: CanvasNode) {
  // Ignore visual fields; focus on identity and data fidelity
  const { id, type, subtype, data, inputs, outputs } = n;
  return { id, type, subtype, data, inputs, outputs };
}

function normalizeConn(c: Connection) {
  return {
    sourceNode: c.sourceNode,
    targetNode: c.targetNode,
    sourceOutput: c.sourceOutput || 'output-1',
    targetInput: c.targetInput || 'input-1',
  };
}

describe('MCP round-trip', () => {
  it('export → import preserves nodes, edges, and prompts', () => {
    const nodes: CanvasNode[] = [
      {
        id: 'A',
        type: 'agent',
        subtype: 'agent',
        position: { x: 0, y: 0 },
        size: { width: 200, height: 120 },
        data: {
          title: 'Agent A',
          description: 'Agent for testing',
          color: '#4f46e5',
          icon: 'bot',
          systemPrompt: 'You are helpful',
          behavior: 'concise',
          temperature: 0.2,
          provider: 'gemini',
          model: 'pro',
        },
        inputs: [{ id: 'in', label: 'in' }],
        outputs: [{ id: 'out', label: 'out' }],
      },
      {
        id: 'B',
        type: 'agent',
        subtype: 'tool-agent',
        position: { x: 300, y: 0 },
        size: { width: 200, height: 120 },
        data: {
          title: 'Tool Agent B',
          description: 'Tool agent for testing',
          color: '#4f46e5',
          icon: 'wrench',
          tools: ['calendar.create'],
        },
        inputs: [{ id: 'in', label: 'in' }],
        outputs: [{ id: 'out', label: 'out' }],
      },
    ];

    const connections: Connection[] = [
      { id: 'E1', sourceNode: 'A', sourceOutput: 'out', targetNode: 'B', targetInput: 'in' },
    ];

    const { export: doc, validation } = mapToMcpExport({
      projectId: 'P1',
      projectName: 'Demo',
      projectDescription: 'Round-trip test',
      startNodeId: 'A',
      nodes,
      connections,
      env: { mode: 'mock' },
    });

    expect(validation.valid).toBe(true);
    expect(doc.flows[0].nodes.length).toBe(2);
    expect(doc.tools.length).toBeGreaterThan(0);

    const back = mapFromMcpExport(doc);
    // Compare normalized shapes (ports default to input-1/output-1 on import)
    const originalNorm = nodes.map(normalizeNode);
    const backNorm = back.nodes.map(normalizeNode).sort((a,b) => a.id.localeCompare(b.id));

    // Expect same node ids and core data to be present
    expect(backNorm.map(n => n.id).sort()).toEqual(originalNorm.map(n => n.id).sort());
    // Ensure prompts and titles survived within data
    const agentA = backNorm.find(n => n.id === 'A')!;
    expect(agentA.data).toMatchObject({
      title: 'Agent A',
      systemPrompt: 'You are helpful',
      behavior: 'concise',
      temperature: 0.2,
      provider: 'gemini',
      model: 'pro',
    });

    // Edge fidelity
    const backConns = back.connections.map(normalizeConn);
    expect(backConns).toContainEqual({ sourceNode: 'A', targetNode: 'B', sourceOutput: 'output-1', targetInput: 'input-1' });

    // Start node
    expect(back.startNodeId).toBe('A');
  });
});
