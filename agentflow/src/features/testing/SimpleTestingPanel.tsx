"use client";

import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  X, 
  Play, 
  Pause, 
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
import EnhancedResultCard from "@/components/canvas/EnhancedResultCard";

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
    setIsPaused(false);
    setStatus('running');
    setResults([]);
    setStartTime(Date.now());

    try {
      // Find effective start node
      let effectiveStartNodeId = startNodeId;
      if (!effectiveStartNodeId) {
        // Find the first node without incoming connections
        const nodesWithIncoming = new Set(connections.map(c => c.targetNode));
        const startNodes = nodes.filter(n => !nodesWithIncoming.has(n.id));
        if (startNodes.length > 0) {
          effectiveStartNodeId = startNodes[0].id;
        } else if (nodes.length > 0) {
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
            seed: 'test-seed',
            environment: 'mock',
            latency: 100,
            errorInjection: false
          }
        }
      );
    } catch (error) {
      console.error('Workflow execution failed:', error);
      setStatus('error');
      setIsRunning(false);
    }
  }, [nodes, connections, startNodeId, scenario, isRunning, onTesterEvent]);

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
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-slate-200">Testing Panel</h2>
          <StatusIndicator status={status} />
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Controls */}
      <div className="p-4 space-y-4 border-b border-slate-700/50">
        {/* Control Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            <Play className="w-4 h-4" />
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
              <EnhancedResultCard key={`${result.nodeId}-${index}`} result={result} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
