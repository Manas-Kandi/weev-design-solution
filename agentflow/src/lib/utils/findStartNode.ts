import { CanvasNode, Connection } from '@/types';

export const findStartNode = (nodes: CanvasNode[], connections: Connection[]) => {
  const nodeIds = nodes.map(n => n.id);
  const targetIds = new Set(
    connections.map(c => (c as any).targetNode ?? (c as any).target).filter(Boolean)
  );
  const startNodes = nodes.filter(n => !targetIds.has(n.id));

  // Heuristic: prefer nodes that look like Agents and have Properties Panel rules
  const preferAgent = (n: any) => {
    const d = (n?.data ?? {}) as any;
    const hasRules = !!(d.rules?.nl || d.systemPrompt || d.behavior || d.mockResponse);
    return (n.type === 'agent' || n.subtype === 'agent' || d?.kind === 'agent' || d?.type === 'agent') && hasRules;
  };

  // 1) Prefer an agent with configured properties
  const agentWithProps = startNodes.find(preferAgent);
  if (agentWithProps) {
    return agentWithProps;
  }

  // 2) Otherwise prefer any agent-like node
  const anyAgent = startNodes.find(n => n.type === 'agent' || n.subtype === 'agent' || (n.data as any)?.kind === 'agent');
  if (anyAgent) {
    return anyAgent;
  }

  // 3) Fallback to the first start node or first node
  const selectedStartNode = startNodes.length > 0 ? startNodes[0] : nodes[0];
  return selectedStartNode;
};