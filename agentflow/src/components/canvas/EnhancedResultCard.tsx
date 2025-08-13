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

  // Extract friendly response and metadata from the output
  const friendlyResponse = result.output?.response || result.output || 'No response available';
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
          <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
            {typeof friendlyResponse === 'string' 
              ? friendlyResponse 
              : JSON.stringify(friendlyResponse, null, 2)
            }
          </p>
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
