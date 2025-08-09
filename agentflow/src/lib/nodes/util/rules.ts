export type AnyNodeData = Record<string, unknown> | undefined | null;

export function getRuleText(data: AnyNodeData): string {
  const d = (data && typeof data === 'object') ? (data as Record<string, unknown>) : {};
  const rules = d.rules as Record<string, unknown> | undefined;
  const nl = rules && typeof rules === 'object' ? (rules as any).nl : undefined;
  return typeof nl === 'string' ? nl : '';
}

export function getRuleCompiled<T = Record<string, unknown>>(data: AnyNodeData): T | undefined {
  const d = (data && typeof data === 'object') ? (data as Record<string, unknown>) : {};
  const rules = d.rules as Record<string, unknown> | undefined;
  const compiled = rules && typeof rules === 'object' ? (rules as any).compiled : undefined;
  return (compiled && typeof compiled === 'object') ? (compiled as T) : undefined;
}

export function buildSystemFromRules(args: { rulesNl?: string; fallback?: string }): string | undefined {
  const base = (args.rulesNl || '').trim();
  if (base.length === 0) return args.fallback;
  return `Behavior Rules: ${base}`;
}
