/**
 * Flow Execution Panel
 * 
 * This component executes the entire workflow from start to finish,
 * following the connections between nodes and using Properties Panel
 * configurations as the authoritative source for each node's behavior.
 */

"use client";

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  X, 
  FileText, 
  Zap, 
  Eye, 
  CheckCircle, 
  AlertCircle, 
  Copy,
  Check,
  ArrowRight,
  Clock
} from 'lucide-react';
import { CanvasNode, Connection } from '@/types';
import { runWorkflowWithProperties } from '@/lib/workflowRunnerPropertiesDriven';

interface FlowExecutionPanelProps {
  nodes: CanvasNode[];
  connections: Connection[];
  selectedNode: CanvasNode | null;
  isVisible: boolean;
  onClose: () => void;
}

type TabType = 'flow' | 'outputs' | 'timeline';

interface FlowExecutionResult {
  success: boolean;
  executionOrder: string[];
  nodeResults: Record<string, any>;
  finalOutput: any;
  executionTime: number;
  error?: string;
}

export default function FlowExecutionPanel({
  nodes,
  connections,
  isVisible,
  onClose
}: FlowExecutionPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('flow');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<FlowExecutionResult | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Find the start node (node with no incoming connections)
  const findStartNode = useCallback(() => {
    const nodeIds = nodes.map(n => n.id);
    const targetNodeIds = new Set(connections.map(c => c.target));
    const startNodes = nodes.filter(n => !targetNodeIds.has(n.id));
    return startNodes.length > 0 ? startNodes[0] : nodes[0];
  }, [nodes, connections]);

  // Execute the entire workflow
  const executeFlow = useCallback(async () => {
    const startNode = findStartNode();
    if (!startNode) {
      setExecutionResult({
        success: false,
        executionOrder: [],
        nodeResults: {},
        finalOutput: null,
        executionTime: 0,
        error: 'No start node found'
      });
      return;
    }

    setIsExecuting(true);
    const startTime = Date.now();

    try {
      const result = await runWorkflowWithProperties(
        nodes,
        connections,
        startNode.id,
        {}, // options
        {}, // callbacks
        {} // testing options
      );

      const executionTime = Date.now() - startTime;
      
      setExecutionResult({
        success: true,
        executionOrder: Object.keys(result),
        nodeResults: result,
        finalOutput: Object.values(result).pop(),
        executionTime,
        error: undefined
      });
    } catch (error) {
      const executionTime = Date.now() - startTime;
      setExecutionResult({
        success: false,
        executionOrder: [],
        nodeResults: {},
        finalOutput: null,
        executionTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsExecuting(false);
    }
  }, [nodes, connections, findStartNode]);

  // Copy output to clipboard
  const copyOutput = useCallback(async () => {
    if (!executionResult?.finalOutput) return;
    
    try {
      const outputText = typeof executionResult.finalOutput === 'string' 
        ? executionResult.finalOutput 
        : JSON.stringify(executionResult.finalOutput, null, 2);
      
      await navigator.clipboard.writeText(outputText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy output:', error);
    }
  }, [executionResult]);

  if (!isVisible) return null;

  const startNode = findStartNode();

  return (
    <div className="w-80 h-full bg-slate-900 border-l border-slate-700 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">Flow Execution</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Execute Button */}
      <div className="p-4 border-b border-slate-700">
        <button
          onClick={executeFlow}
          disabled={isExecuting || nodes.length === 0}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded-md transition-colors"
        >
          <Play className="w-4 h-4" />
          {isExecuting ? 'Executing Flow...' : `Execute Flow (${nodes.length} nodes)`}
        </button>
        
        {startNode && (
          <p className="text-xs text-slate-400 mt-2 text-center">
            Starting from: {(startNode.data as any)?.title || startNode.id}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700">
        {[
          { id: 'flow', label: 'Flow', icon: ArrowRight },
          { id: 'outputs', label: 'Output', icon: Zap },
          { id: 'timeline', label: 'Timeline', icon: Clock }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as TabType)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors flex-1 ${
              activeTab === id
                ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-800/50'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'flow' && (
          <FlowTab 
            nodes={nodes} 
            connections={connections} 
            executionResult={executionResult}
            isExecuting={isExecuting}
          />
        )}
        
        {activeTab === 'outputs' && (
          <OutputsTab 
            executionResult={executionResult}
            isExecuting={isExecuting}
            onCopyOutput={copyOutput}
            isCopied={isCopied}
          />
        )}
        
        {activeTab === 'timeline' && (
          <TimelineTab 
            executionResult={executionResult}
            isExecuting={isExecuting}
          />
        )}
      </div>
    </div>
  );
}

// Flow Tab - Shows the flow structure and execution path
function FlowTab({ 
  nodes, 
  connections, 
  executionResult,
  isExecuting 
}: { 
  nodes: CanvasNode[];
  connections: Connection[];
  executionResult: FlowExecutionResult | null;
  isExecuting: boolean;
}) {
  if (isExecuting) {
    return (
      <div className="text-center text-slate-400 py-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 mx-auto mb-2"
        >
          <ArrowRight className="w-8 h-8" />
        </motion.div>
        <p>Executing workflow...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-slate-300 mb-3">
        Workflow Structure
      </h3>
      
      <div className="space-y-2">
        <div className="text-xs text-slate-400 mb-2">
          {nodes.length} nodes, {connections.length} connections
        </div>
        
        {nodes.map((node, index) => {
          const isExecuted = executionResult?.executionOrder.includes(node.id);
          const hasError = executionResult?.error && !executionResult.success;
          
          return (
            <div
              key={node.id}
              className={`p-3 rounded-md border ${
                hasError
                  ? 'bg-red-500/10 border-red-500/20'
                  : isExecuted
                  ? 'bg-green-500/10 border-green-500/20'
                  : 'bg-slate-700/50 border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    hasError
                      ? 'bg-red-400'
                      : isExecuted
                      ? 'bg-green-400'
                      : 'bg-slate-500'
                  }`} />
                  <span className="text-sm font-medium text-slate-300">
                    {(node.data as any)?.title || node.id}
                  </span>
                </div>
                <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                  {node.subtype || node.type}
                </span>
              </div>
              
              {/* Show Properties Panel configuration */}
              {(() => {
                const nodeData = node.data as any;
                const config = nodeData?.rules?.nl || nodeData?.systemPrompt || nodeData?.behavior || nodeData?.llmRule;
                if (config) {
                  return (
                    <div className="mt-2 text-xs text-slate-400 bg-slate-800/50 p-2 rounded border">
                      {config.slice(0, 60)}...
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Outputs Tab - Shows final workflow output
function OutputsTab({ 
  executionResult,
  isExecuting,
  onCopyOutput,
  isCopied
}: { 
  executionResult: FlowExecutionResult | null;
  isExecuting: boolean;
  onCopyOutput: () => void;
  isCopied: boolean;
}) {
  if (isExecuting) {
    return (
      <div className="text-center text-slate-400 py-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 mx-auto mb-2"
        >
          <Zap className="w-8 h-8" />
        </motion.div>
        <p>Processing workflow...</p>
      </div>
    );
  }

  if (!executionResult) {
    return (
      <div className="text-center text-slate-400 py-8">
        <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>Execute flow to see output</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-300">
          Final Output
        </h3>
        {executionResult.finalOutput && (
          <button
            onClick={onCopyOutput}
            className="flex items-center gap-2 px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs rounded transition-colors"
          >
            {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {isCopied ? 'Copied!' : 'Copy'}
          </button>
        )}
      </div>

      {/* Status Indicator */}
      <div className={`p-3 rounded-md border ${
        executionResult.success
          ? 'bg-green-500/10 border-green-500/20'
          : 'bg-red-500/10 border-red-500/20'
      }`}>
        <div className="flex items-center gap-2 mb-2">
          {executionResult.success ? (
            <CheckCircle className="w-4 h-4 text-green-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400" />
          )}
          <span className={`text-sm font-medium ${
            executionResult.success ? 'text-green-400' : 'text-red-400'
          }`}>
            {executionResult.success ? 'Flow Completed' : 'Flow Failed'}
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Executed in {executionResult.executionTime}ms
        </p>
      </div>

      {/* Output Content */}
      {executionResult.error ? (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
          <p className="text-sm text-red-400 font-medium mb-1">Error:</p>
          <p className="text-sm text-red-300">{executionResult.error}</p>
        </div>
      ) : executionResult.finalOutput ? (
        <div className="bg-slate-800/50 p-3 rounded border">
          <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono">
            {typeof executionResult.finalOutput === 'string' 
              ? executionResult.finalOutput 
              : JSON.stringify(executionResult.finalOutput, null, 2)
            }
          </pre>
        </div>
      ) : (
        <div className="text-center text-slate-500 py-4">
          No output generated
        </div>
      )}
    </div>
  );
}

// Timeline Tab - Shows execution timeline
function TimelineTab({ 
  executionResult,
  isExecuting
}: { 
  executionResult: FlowExecutionResult | null;
  isExecuting: boolean;
}) {
  if (isExecuting) {
    return (
      <div className="text-center text-slate-400 py-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 mx-auto mb-2"
        >
          <Clock className="w-8 h-8" />
        </motion.div>
        <p>Building timeline...</p>
      </div>
    );
  }

  if (!executionResult) {
    return (
      <div className="text-center text-slate-400 py-8">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>Execute flow to see timeline</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-slate-300 mb-3">
        Execution Timeline
      </h3>
      
      <div className="space-y-3">
        {executionResult.executionOrder.map((nodeId, index) => (
          <div key={nodeId} className="flex items-center gap-3">
            <div className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-xs rounded-full">
              {index + 1}
            </div>
            <div className="flex-1">
              <div className="text-sm text-slate-300">{nodeId}</div>
              <div className="text-xs text-slate-500">Step {index + 1}</div>
            </div>
            <CheckCircle className="w-4 h-4 text-green-400" />
          </div>
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-slate-800/50 rounded border">
        <div className="text-xs text-slate-400">
          Total execution time: {executionResult.executionTime}ms
        </div>
        <div className="text-xs text-slate-400">
          Nodes executed: {executionResult.executionOrder.length}
        </div>
      </div>
    </div>
  );
}
