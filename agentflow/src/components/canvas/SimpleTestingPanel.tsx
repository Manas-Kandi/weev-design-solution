"use client";

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Download,
  Clock,
  AlertCircle,
  CheckCircle,
  Zap,
  ChevronRight
} from "lucide-react";
import { CanvasNode, Connection } from "@/types";
import { runWorkflow } from "@/lib/workflowRunner";

interface SimpleTestingPanelProps {
  nodes: CanvasNode[];
  connections: Connection[];
  isVisible: boolean;
  onClose: () => void;
  isPropertiesPanelVisible: boolean;
  compactMode?: boolean;
  startNodeId?: string | null;
  onTesterEvent?: (event: any) => void;
  onNodeSelect?: (nodeId: string) => void;
  isVerticalSplit?: boolean;
}

// Status indicator component
function StatusIndicator({ status }: { status: string }) {
  const statusConfig = {
    idle: { icon: Clock, color: 'text-slate-400', text: 'Idle' },
    running: { icon: Zap, color: 'text-blue-400', text: 'Running' },
    paused: { icon: Pause, color: 'text-yellow-400', text: 'Paused' },
    finished: { icon: CheckCircle, color: 'text-green-400', text: 'Finished' },
    error: { icon: AlertCircle, color: 'text-red-400', text: 'Error' },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.idle;
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      <Icon className={`w-4 h-4 ${config.color}`} />
      <span className={`text-sm font-medium ${config.color}`}>{config.text}</span>
    </div>
  );
}

// Enhanced result card component with comprehensive LLM output display
function ResultCard({ result }: { result: any }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const formatOutput = (output: any) => {
    if (typeof output === 'string') {
      // Check if it's JSON-like
      try {
        const parsed = JSON.parse(output);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return output;
      }
    }
    return JSON.stringify(output, null, 2);
  };

  const getNodeTypeIcon = (subtype: string) => {
    switch (subtype) {
      case 'agent': return '🤖';
      case 'tool-agent': return '🔧';
      case 'knowledge-base': return '📚';
      case 'decision-tree': return '🌳';
      case 'router': return '🔀';
      default: return '⚡';
    }
  };

  const getNodeTypeColor = (subtype: string) => {
    switch (subtype) {
      case 'agent': return 'text-blue-400';
      case 'tool-agent': return 'text-green-400';
      case 'knowledge-base': return 'text-purple-400';
      case 'decision-tree': return 'text-yellow-400';
      case 'router': return 'text-orange-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-lg border border-slate-600/30 bg-slate-800/50 backdrop-blur-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getNodeTypeIcon(result.nodeSubtype)}</span>
          <div>
            <h4 className="text-sm font-medium text-slate-200">
              {result.title || result.nodeId}
            </h4>
            <span className={`text-xs ${getNodeTypeColor(result.nodeSubtype)}`}>
              {result.nodeSubtype?.replace('-', ' ').toUpperCase() || 'NODE'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {result.durationMs && (
            <span className="text-xs text-slate-500">
              {result.durationMs}ms
            </span>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-slate-400 hover:text-slate-300 transition-colors"
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>
      </div>

      {/* Summary */}
      {result.summary && (
        <div className="mb-3">
          <div className="text-xs text-slate-400 mb-1">Summary:</div>
          <div className="text-sm text-slate-300">{result.summary}</div>
        </div>
      )}

      {/* Error Display */}
      {result.error && (
        <div className="mb-3 p-2 bg-red-900/20 border border-red-500/30 rounded">
          <div className="text-xs text-red-400 mb-1">Error:</div>
          <div className="text-sm text-red-300 font-mono">
            {result.error instanceof Error ? result.error.message : String(result.error)}
          </div>
        </div>
      )}

      {/* Output Display */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">LLM Output:</span>
          <span className="text-xs text-slate-500">
            {typeof result.output === 'string' ? `${result.output.length} chars` : 'Object'}
          </span>
        </div>
        
        <div className={`bg-slate-900/50 border border-slate-700/50 rounded-lg p-3 ${
          isExpanded ? '' : 'max-h-32'
        } overflow-y-auto`}>
          <div className="text-sm text-slate-200 whitespace-pre-wrap font-mono leading-relaxed">
            {formatOutput(result.output)}
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 pt-3 border-t border-slate-700/50 space-y-2"
        >
          {/* Node Details */}
          <div>
            <div className="text-xs text-slate-400 mb-1">Node Details:</div>
            <div className="text-xs text-slate-300 space-y-1">
              <div>ID: <span className="font-mono">{result.nodeId}</span></div>
              <div>Type: <span className="font-mono">{result.nodeType}</span></div>
              <div>Subtype: <span className="font-mono">{result.nodeSubtype}</span></div>
              {result.at && (
                <div>Executed: <span className="font-mono">{new Date(result.at).toLocaleTimeString()}</span></div>
              )}
            </div>
          </div>

          {/* Flow Context */}
          {result.flowContextBefore && Object.keys(result.flowContextBefore).length > 0 && (
            <div>
              <div className="text-xs text-slate-400 mb-1">Available Context:</div>
              <div className="bg-slate-800/50 p-2 rounded text-xs font-mono text-slate-400">
                {Object.keys(result.flowContextBefore).map(nodeId => (
                  <div key={nodeId}>• {nodeId}</div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

export function SimpleTestingPanel({
  nodes,
  connections,
  isVisible,
  onClose,
  isPropertiesPanelVisible,
  compactMode = false,
  startNodeId = null,
  onTesterEvent,
  onNodeSelect,
  isVerticalSplit = false,
}: SimpleTestingPanelProps) {
  const [scenario, setScenario] = useState("email writer");
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [status, setStatus] = useState('idle');
  const [startTime, setStartTime] = useState<number | null>(null);

  const handleRun = useCallback(async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setStatus('running');
    setResults([]);
    setStartTime(Date.now());

    try {
      // Determine start node if not provided
      let effectiveStartNodeId = startNodeId;
      if (!effectiveStartNodeId && nodes.length > 0) {
        // Find a node that has no incoming connections (potential start node)
        const nodesWithIncoming = new Set(connections.map(c => c.targetNode));
        const potentialStartNodes = nodes.filter(n => !nodesWithIncoming.has(n.id));
        
        if (potentialStartNodes.length > 0) {
          effectiveStartNodeId = potentialStartNodes[0].id;
        } else {
          // If all nodes have incoming connections, use the first node
          effectiveStartNodeId = nodes[0].id;
        }
      }

      if (!effectiveStartNodeId) {
        throw new Error("No nodes available to execute");
      }

      // Enhanced workflow runner with event callbacks
      await runWorkflow(
        nodes,
        connections,
        effectiveStartNodeId,
        { inputs: { input: scenario } },
        {
          emitTesterEvent: (event) => {
            onTesterEvent?.(event);
            
            if (event.type === 'node-finished') {
              setResults(prev => [...prev, {
                nodeId: event.nodeId,
                title: event.title,
                nodeSubtype: event.nodeSubtype,
                output: event.output,
                summary: event.summary,
                error: event.error
              }]);
            }
            
            if (event.type === 'flow-finished') {
              setIsRunning(false);
              setStatus('finished');
            }
          },
          beforeNodeExecute: async (node) => {
            // Optional: Add delays or breakpoints here
          }
        },
        {
          scenario: { description: scenario },
          overrides: {
            environment: 'mock',
            latency: 500,
            errorInjection: false
          }
        }
      );
    } catch (error) {
      console.error("Workflow execution failed:", error);
      setIsRunning(false);
      setStatus('error');
      setResults(prev => [...prev, {
        nodeId: 'error',
        title: 'Execution Error',
        nodeSubtype: 'error',
        output: error instanceof Error ? error.message : 'Unknown error occurred',
        summary: 'Failed to execute workflow',
        error: true
      }]);
    }
  }, [nodes, connections, startNodeId, scenario, onTesterEvent]);

  const handlePause = useCallback(() => {
    setIsPaused(!isPaused);
    setStatus(isPaused ? 'running' : 'paused');
  }, [isPaused]);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    setResults([]);
    setStatus('idle');
    setStartTime(null);
  }, []);

  const handleExport = useCallback(() => {
    const exportData = {
      scenario,
      results,
      timestamp: new Date().toISOString(),
      duration: startTime ? Date.now() - startTime : 0
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow-test-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [scenario, results, startTime]);

  if (!isVisible) return null;

  return (
    <div
      className={`${isVerticalSplit ? 'h-full' : 'fixed top-4 bottom-4'} z-50 flex flex-col`}
      style={{
        right: isVerticalSplit ? undefined : (isPropertiesPanelVisible ? '340px' : '16px'),
        width: isVerticalSplit ? '100%' : (isPropertiesPanelVisible ? '320px' : '400px'),
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
      }}
    >
      {/* Liquid Glassmorphism Effects */}
      <div 
        className="absolute inset-0 pointer-events-none liquid-overlay"
        style={{
          background: `
            radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), 
              rgba(59, 130, 246, 0.1) 0%, 
              transparent 40%
            )
          `,
          borderRadius: '20px',
          opacity: 0.6,
          animation: 'liquidFlow 8s ease-in-out infinite'
        }}
      />
      
      {/* Animated Border Glow */}
      <div 
        className="absolute inset-0 pointer-events-none border-glow"
        style={{
          background: `
            linear-gradient(45deg, 
              rgba(59, 130, 246, 0.3) 0%, 
              rgba(139, 92, 246, 0.3) 25%,
              rgba(16, 185, 129, 0.3) 50%,
              rgba(236, 72, 153, 0.3) 75%,
              rgba(59, 130, 246, 0.3) 100%
            )
          `,
          borderRadius: '20px',
          padding: '1px',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'xor',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          animation: 'borderFlow 6s linear infinite',
          backgroundSize: '400% 400%'
        }}
      />

      {/* Floating Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ borderRadius: '20px' }}>
        <div 
          className="absolute w-32 h-32 rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%)',
            top: '10%',
            left: '20%',
            animation: 'float1 12s ease-in-out infinite'
          }}
        />
        <div 
          className="absolute w-24 h-24 rounded-full opacity-15"
          style={{
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)',
            bottom: '20%',
            right: '15%',
            animation: 'float2 10s ease-in-out infinite reverse'
          }}
        />
        <div 
          className="absolute w-20 h-20 rounded-full opacity-25"
          style={{
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, transparent 70%)',
            top: '60%',
            left: '70%',
            animation: 'float3 14s ease-in-out infinite'
          }}
        />
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700/30">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-slate-100">Testing Panel</h2>
          <StatusIndicator status={status} />
          {isRunning && startTime && (
            <span className="text-sm text-slate-400">
              {Math.round((Date.now() - startTime) / 1000)}s
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-700/50 rounded transition-colors"
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Controls */}
      <div className="p-4 space-y-4">
        <div className="flex gap-2">
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            <Play className="w-4 h-4" />
            Run
          </button>
          <button
            onClick={handlePause}
            disabled={!isRunning}
            className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-800 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            <Pause className="w-4 h-4" />
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Scenario Input */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Test Scenario
          </label>
          <textarea
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            placeholder="Describe the test scenario..."
            className="w-full p-3 bg-slate-800/50 border border-slate-600/30 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
            rows={3}
          />
        </div>

        {/* Environment */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Environment
          </label>
          <div className="flex gap-2">
            <button className="flex-1 px-3 py-2 bg-green-600/20 border border-green-500/30 text-green-400 rounded-lg text-sm">
              Mock
            </button>
            <button className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600/30 text-slate-400 rounded-lg text-sm opacity-50">
              Mixed
            </button>
            <button className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600/30 text-slate-400 rounded-lg text-sm opacity-50">
              Live
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-slate-300">
            Results {results.length > 0 && `(${results.length} nodes)`}
          </h3>
          {results.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">
                {startTime ? `${Math.round((Date.now() - startTime) / 1000)}s` : ''}
              </span>
              <button
                onClick={handleExport}
                className="flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-slate-300 transition-colors"
              >
                <Download className="w-3 h-3" />
                Export
              </button>
            </div>
          )}
        </div>

        {/* Flow Path Visualization */}
        {results.length > 1 && (
          <div className="mb-4 p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
            <div className="text-xs text-slate-400 mb-2">Execution Path:</div>
            <div className="flex items-center gap-2 flex-wrap">
              {results.map((result, index) => (
                <React.Fragment key={result.nodeId}>
                  <div className="flex items-center gap-1 px-2 py-1 bg-slate-700/50 rounded text-xs">
                    <span>{result.nodeSubtype === 'agent' ? '🤖' : 
                           result.nodeSubtype === 'router' ? '🔀' : 
                           result.nodeSubtype === 'tool' ? '🔧' : 
                           result.nodeSubtype === 'template' ? '⚡' : '📄'}</span>
                    <span className="text-slate-300">{result.title || result.nodeId}</span>
                    {result.error && <span className="text-red-400">⚠</span>}
                  </div>
                  {index < results.length - 1 && (
                    <ChevronRight className="w-3 h-3 text-slate-500" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
        
        <div className="space-y-3">
          {results.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              {isRunning ? (
                <div className="space-y-2">
                  <div className="animate-pulse">Executing workflow...</div>
                  <div className="text-xs">Processing nodes with LLM reasoning</div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div>No results yet.</div>
                  <div className="text-xs">Run a test to see comprehensive LLM-powered execution results.</div>
                </div>
              )}
            </div>
          ) : (
            results.map((result, index) => (
              <ResultCard key={`${result.nodeId}-${index}`} result={result} />
            ))
          )}
        </div>
      </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes liquidFlow {
          0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); }
          25% { transform: translate(10px, -5px) rotate(1deg) scale(1.02); }
          50% { transform: translate(-5px, 10px) rotate(-0.5deg) scale(0.98); }
          75% { transform: translate(-10px, -10px) rotate(0.5deg) scale(1.01); }
        }

        @keyframes borderFlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.2; }
          25% { transform: translate(15px, -20px) scale(1.1); opacity: 0.3; }
          50% { transform: translate(-10px, 15px) scale(0.9); opacity: 0.15; }
          75% { transform: translate(-20px, -10px) scale(1.05); opacity: 0.25; }
        }

        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 0.15; }
          33% { transform: translate(-12px, 18px) rotate(120deg); opacity: 0.25; }
          66% { transform: translate(18px, -12px) rotate(240deg); opacity: 0.1; }
        }

        @keyframes float3 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.25; }
          20% { transform: translate(8px, -15px) scale(1.15); opacity: 0.35; }
          40% { transform: translate(-15px, 8px) scale(0.85); opacity: 0.15; }
          60% { transform: translate(12px, 12px) scale(1.1); opacity: 0.3; }
          80% { transform: translate(-8px, -18px) scale(0.9); opacity: 0.2; }
        }

        /* Hover effects for liquid interaction */
        .testing-panel:hover .liquid-overlay {
          animation-duration: 4s;
          opacity: 0.8;
        }

        .testing-panel:hover .border-glow {
          animation-duration: 3s;
        }

        /* Breathing effect for the entire panel */
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.002); }
        }

        .testing-panel {
          animation: breathe 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
