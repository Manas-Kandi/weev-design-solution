import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Eye, EyeOff } from 'lucide-react';

interface EnhancedResultCardProps {
  result: {
    nodeId: string;
    title: string;
    nodeSubtype: string;
    output: any;
    summary: string;
    error?: any;
  };
}

export default function EnhancedResultCard({ result }: EnhancedResultCardProps) {
  const [showMetadata, setShowMetadata] = useState(false);
  const [copied, setCopied] = useState(false);

  // --- Helpers for friendly rendering ---
  const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
  const tryParseJSON = <T,>(v: unknown): T | undefined => {
    if (typeof v !== 'string') return undefined;
    try {
      const cleaned = v.replace(/```json|```/gi, '').trim();
      return JSON.parse(cleaned) as T;
    } catch {
      try {
        const match = (v as string).match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
        if (match) return JSON.parse(match[1]) as T;
      } catch {}
      return undefined;
    }
  };
  const sanitizeText = (s: string): string => {
    const withoutFences = s.replace(/```[a-z]*|```/gi, ' ');
    const withoutEscapes = withoutFences.replace(/\\[nrt]/g, ' ').replace(/[\n\r\t]+/g, ' ');
    const withoutBrackets = withoutEscapes.replace(/[\[\]{}\"]+/g, ' ');
    return withoutBrackets.replace(/\s+/g, ' ').trim();
  };
  const valueToPlain = (v: unknown, maxLen = 200): string => {
    if (v == null) return '';
    if (typeof v === 'string') return sanitizeText(v).slice(0, maxLen);
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    try {
      const s = JSON.stringify(v);
      return sanitizeText(s).slice(0, maxLen);
    } catch {
      return String(v);
    }
  };
  const toFriendly = (value: unknown): { text?: string; bullets?: string[] } => {
    if (value == null) return { text: 'No output provided.' };
    if (typeof value === 'string') {
      const parsed = tryParseJSON<any>(value);
      if (parsed !== undefined) return toFriendly(parsed);
      const text = sanitizeText(value);
      return { text: text || 'No output provided.' };
    }
    if (Array.isArray(value)) {
      if (value.length === 0) return { text: 'No output provided.' };
      const first = value[0];
      if (isRecord(first)) {
        const keys = Object.keys(first).slice(0, 4);
        const bullets = value.slice(0, 5).map((item, i) => {
          const rec = isRecord(item) ? item : {};
          const parts = keys.map((k) => `${k}: ${valueToPlain(rec[k])}`);
          return `Item ${i + 1} — ${parts.join(', ')}`;
        });
        if (value.length > 5) bullets.push(`…and ${value.length - 5} more`);
        return { bullets };
      }
      const bullets = value.slice(0, 8).map((x) => valueToPlain(x));
      if (value.length > 8) bullets.push(`…and ${value.length - 8} more`);
      return { bullets };
    }
    if (isRecord(value)) {
      // Special-case Gemini-style candidate text
      const parts = (value as any)?.candidates?.[0]?.content?.parts;
      const t = Array.isArray(parts) ? parts[0]?.text : undefined;
      if (typeof t === 'string') return toFriendly(t);
      const entries = Object.entries(value).slice(0, 8);
      if (entries.length === 0) return { text: 'No output provided.' };
      const bullets = entries.map(([k, v]) => `${k}: ${valueToPlain(v)}`);
      return { bullets };
    }
    return { text: valueToPlain(value) };
  };

  // Extract friendly response and metadata from the output
  const rawResponse = (() => {
    const fromResponse = result.output?.response;
    if (typeof fromResponse !== 'undefined') return fromResponse;
    const parts = (result.output as any)?.candidates?.[0]?.content?.parts;
    const t = Array.isArray(parts) ? parts[0]?.text : undefined;
    if (typeof t === 'string') return t;
    return result.output;
  })();
  const friendly = toFriendly(rawResponse);
  const metadata = result.output?.metadata || {
    nodeType: result.nodeSubtype,
    nodeId: result.nodeId,
    executionTime: Date.now(),
    note: 'Legacy output format - metadata not available'
  };

  const handleCopyMetadata = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(metadata, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy metadata:', err);
    }
  };

  const getNodeIcon = (nodeSubtype: string) => {
    switch (nodeSubtype) {
      case 'agent': return '🤖';
      case 'tool-agent': return '🔧';
      case 'knowledge-base': return '📚';
      case 'router': return '🔀';
      case 'decision-tree': return '🌳';
      default: return '📄';
    }
  };

  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getNodeIcon(result.nodeSubtype)}</span>
          <div>
            <h4 className="text-slate-200 font-medium text-sm">
              {result.title || result.nodeId}
            </h4>
            <p className="text-slate-400 text-xs capitalize">
              {result.nodeSubtype.replace('-', ' ')}
            </p>
          </div>
        </div>
        {result.error && (
          <span className="text-red-400 text-xs bg-red-900/20 px-2 py-1 rounded">
            Error
          </span>
        )}
      </div>

      {/* Friendly Response */}
      <div className="space-y-2">
        <h5 className="text-slate-300 text-sm font-medium">Response:</h5>
        <div className="bg-slate-900/50 border border-slate-600/30 rounded p-3">
          {friendly.bullets && friendly.bullets.length > 0 ? (
            <ul className="list-disc pl-4 space-y-1 text-slate-200 text-sm">
              {friendly.bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-200 text-sm leading-relaxed whitespace-normal">
              {friendly.text || 'No output provided.'}
            </p>
          )}
        </div>
      </div>

      {/* Metadata Toggle */}
      <div className="border-t border-slate-700/50 pt-3">
        <button
          onClick={() => setShowMetadata(!showMetadata)}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-300 text-sm transition-colors"
        >
          {showMetadata ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <span>Execution Metadata</span>
          {showMetadata ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
        </button>

        {showMetadata && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between">
              <h6 className="text-slate-300 text-xs font-medium">JSON Metadata:</h6>
              <button
                onClick={handleCopyMetadata}
                className="flex items-center gap-1 text-slate-400 hover:text-slate-300 text-xs transition-colors"
              >
                <Copy className="w-3 h-3" />
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="bg-slate-900/70 border border-slate-600/30 rounded p-3 overflow-x-auto">
              <pre className="text-slate-300 text-xs font-mono">
                {JSON.stringify(metadata, null, 2)}
              </pre>
            </div>

            {/* Show routing results in Testing Panel for visibility. */}
            {result.output?._propertiesResult?.trace?.delegatedToTool?.toolName && (
              <div className="mt-2">
                <h6 className="text-slate-300 text-xs font-medium">Matched Tool:</h6>
                <p className="text-slate-200 text-sm">
                  {result.output._propertiesResult.trace.delegatedToTool.toolName}
                </p>
                {/* Show routing results in Testing Panel for visibility. */}
                <p className="text-slate-400 text-xs">
                  Capability: {result.output._propertiesResult?.parsedIntent?.capability}
                </p>
              </div>
            )}

            {!result.output?._propertiesResult?.trace?.delegatedToTool &&
              result.output?._propertiesResult?.executionSummary && (
                <div className="mt-2">
                  <h6 className="text-slate-300 text-xs font-medium">Routing</h6>
                  <p className="text-slate-400 text-xs">
                    {result.output._propertiesResult.executionSummary}
                  </p>
                </div>
              )}

            {result.output?._propertiesResult?.parsedIntent && (
              <div className="mt-2">
                <h6 className="text-slate-300 text-xs font-medium">Parsed Intent:</h6>
                <pre className="text-slate-200 text-sm font-mono">
                  {JSON.stringify(result.output._propertiesResult.parsedIntent, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Display */}
      {result.error && (
        <div className="bg-red-900/20 border border-red-700/50 rounded p-3">
          <h6 className="text-red-400 text-sm font-medium mb-2">Error Details:</h6>
          <p className="text-red-300 text-xs font-mono">
            {typeof result.error === 'string' 
              ? result.error 
              : JSON.stringify(result.error, null, 2)
            }
          </p>
        </div>
      )}
    </div>
  );
}
