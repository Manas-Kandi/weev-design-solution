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
import { CanvasNode, Connection, NodeContext } from '@/types';
import { FlowEngine } from '@/lib/flow/FlowEngine';
import { executeNodeFromProperties } from '@/lib/propertiesTestingBridge';
import { callLLM } from '@/lib/llmClient';

interface FlowExecutionPanelProps {
  nodes: CanvasNode[];
  connections: Connection[];
  selectedNode: CanvasNode | null;
  isVisible: boolean;
  onClose: () => void;
}

type TabType = 'flow' | 'outputs' | 'timeline' | 'context';

interface FlowExecutionResult {
  success: boolean;
  executionOrder: string[];
  nodeResults: Record<string, any>;
  finalOutput: any;
  executionTime: number;
  error?: string;
  contextFlow: Record<string, any>[];
  events: any[];
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
    // Support both Connection shapes: {targetNode, sourceNode} and {target, source}
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

    console.log('🔍 Start Node Detection:', {
      nodeIds,
      targetIds: Array.from(targetIds),
      startNodes: startNodes.map(n => ({ id: n.id, type: n.type, subtype: n.subtype, title: (n.data as any)?.title })),
      connections: connections.map(c => ({ source: (c as any).sourceNode ?? (c as any).source, target: (c as any).targetNode ?? (c as any).target }))
    });

    // 1) Prefer an agent with configured properties
    const agentWithProps = startNodes.find(preferAgent);
    if (agentWithProps) {
      console.log('🎯 Selected Agent with properties as start node:', agentWithProps.id);
      return agentWithProps;
    }

    // 2) Otherwise prefer any agent-like node
    const anyAgent = startNodes.find(n => n.type === 'agent' || n.subtype === 'agent' || (n.data as any)?.kind === 'agent');
    if (anyAgent) {
      console.log('🎯 Selected Agent-like start node:', anyAgent.id);
      return anyAgent;
    }

    // 3) Fallback to the first start node or first node
    const selectedStartNode = startNodes.length > 0 ? startNodes[0] : nodes[0];
    console.log('🚀 Final start node selected (fallback):', {
      id: selectedStartNode?.id,
      type: selectedStartNode?.type,
      subtype: selectedStartNode?.subtype
    });

    return selectedStartNode;
  }, [nodes, connections]);

  // Execute the entire workflow with contextual data flow
  const executeFlow = useCallback(async () => {
    const startNode = findStartNode();
    if (!startNode) {
      setExecutionResult({
        success: false,
        executionOrder: [],
        nodeResults: {},
        finalOutput: null,
        executionTime: 0,
        error: 'No start node found',
        contextFlow: [],
        events: []
      });
      return;
    }

    setIsExecuting(true);
    const startTime = Date.now();
    const events: any[] = [];
    const contextFlow: Record<string, any>[] = [];

    try {
      // Extract Properties Panel input from start node
      const startNodeData = startNode.data as any;
      let initialInput = '';

      // Helper to probe multiple fields for agent rules/user prompt
      const pick = (...paths: Array<string>): any => {
        for (const p of paths) {
          try {
            const val = p.split('.').reduce((acc: any, key: string) => (acc ? acc[key] : undefined), startNodeData);
            if (val !== undefined && val !== null && val !== '') return val;
          } catch {}
        }
        return undefined;
      };

      // Try to grab the most relevant input text configured in Properties Panel
      const chosen = pick(
        'rules.nl',
        'rulesNl',
        'agentRules.nl',
        'llmRule',
        'prompt',
        'content',
        'input',
        'systemPrompt',
        'behavior',
        'config.rules.nl',
        'properties.rules.nl'
      );
      if (chosen) initialInput = String(chosen);
      
      console.log('🔍 Flow Execution Debug:', {
        startNode: startNode.id,
        startNodeData,
        initialInput,
        pickedFrom: initialInput ? 'properties-probe' : 'none',
        nodeType: startNode.type,
        nodeSubtype: startNode.subtype
      });

      // Create FlowEngine with enhanced context tracking
      const flowEngine = new FlowEngine(nodes, connections);
      flowEngine.setStartNode(startNode.id);

      // Execute workflow with context capture
      const result = await flowEngine.execute(
        (nodeId, log, output, error) => {
          console.log(`📝 [${nodeId}] ${log}`);
          events.push({
            type: 'log',
            nodeId,
            message: log,
            output,
            error,
            timestamp: Date.now()
          });
        },
        {
          emitTesterEvent: (event) => {
            console.log('🔄 Workflow Event:', event);
            events.push(event);
          },
          beforeNodeExecute: async (node) => {
            // Create context packet for this node
            const contextPacket = {
              nodeId: node.id,
              nodeType: node.type,
              nodeSubtype: node.subtype,
              timestamp: Date.now(),
              previousNodes: contextFlow.map(c => ({
                id: c.nodeId,
                type: c.nodeType,
                output: c.output,
                summary: c.summary
              })),
              propertiesData: node.data,
              inputFromProperties: node.id === startNode.id ? initialInput : undefined
            };
            
            contextFlow.push(contextPacket);
            
            console.log('📦 Context packet for node:', {
              nodeId: node.id,
              contextPacket,
              totalPreviousNodes: contextPacket.previousNodes.length
            });
          }
        }
      );

      const executionTime = Date.now() - startTime;
      
      console.log('✅ Workflow Result:', {
        result,
        finalOutput: Object.values(result).pop(),
        executionOrder: Object.keys(result)
      });
      
      // Extract final output from the last node in execution order
      let finalOutput = null;
      const resultEntries = Object.entries(result);
      
      // Find the most meaningful output
      for (let i = resultEntries.length - 1; i >= 0; i--) {
        const [nodeId, nodeResult] = resultEntries[i];
        
        if (nodeResult && typeof nodeResult === 'object') {
          const extracted = (nodeResult as any).output || 
                            (nodeResult as any).result ||
                            (nodeResult as any).message ||
                            nodeResult;
          
          if (extracted !== undefined && extracted !== null && extracted !== '') {
            finalOutput = extracted;
            break;
          }
        } else if (nodeResult !== undefined && nodeResult !== null && nodeResult !== '') {
          finalOutput = nodeResult;
          break;
        }
      }
      
      // Update context flow with outputs
      contextFlow.forEach((context, index) => {
        const nodeResult = result[context.nodeId];
        context.output = nodeResult;
        context.summary = `Node executed with ${typeof nodeResult} output`;
      });
      
      console.log('🎯 Final Output Extracted:', {
        finalOutput,
        outputType: typeof finalOutput,
        outputLength: finalOutput?.length
      });
      
      setExecutionResult({
        success: true,
        executionOrder: Object.keys(result),
        nodeResults: result,
        finalOutput: finalOutput,
        executionTime,
        contextFlow,
        events,
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
        error: error instanceof Error ? error.message : 'Unknown error',
        contextFlow,
        events
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
    <div className="w-80 h-full bg-slate-950 border-l border-slate-800 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-medium text-slate-200">Flow Execution</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-slate-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Execute Button */}
      <div className="p-3 border-b border-slate-800">
        <button
          onClick={executeFlow}
          disabled={isExecuting || nodes.length === 0}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white rounded text-sm transition-colors"
        >
          <Play className="w-3 h-3" />
          {isExecuting ? 'Executing...' : `Execute (${nodes.length})`}
        </button>
        
        {startNode && (
          <p className="text-xs text-slate-500 mt-2 text-center">
            Start: {(startNode.data as any)?.title || startNode.id}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        {[
          { id: 'flow', label: 'Flow', icon: ArrowRight },
          { id: 'outputs', label: 'Output', icon: Zap },
          { id: 'timeline', label: 'Timeline', icon: Clock },
          { id: 'context', label: 'Context', icon: FileText }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as TabType)}
            className={`flex items-center gap-1 px-2 py-2 text-xs font-medium transition-colors flex-1 justify-center ${
              activeTab === id
                ? 'text-blue-400 border-b border-blue-400 bg-slate-900'
                : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            <Icon className="w-3 h-3" />
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
        
        {activeTab === 'context' && (
          <ContextTab 
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
                      <div className="font-medium text-slate-300 mb-1">Properties Panel Config:</div>
                      {config.slice(0, 80)}...
                    </div>
                  );
                }
                return null;
              })()}
              
              {/* Show context flow information */}
              {executionResult?.contextFlow && (() => {
                const nodeContext = executionResult.contextFlow.find(c => c.nodeId === node.id);
                if (nodeContext && nodeContext.previousNodes.length > 0) {
                  return (
                    <div className="mt-2 text-xs text-slate-400 bg-blue-500/10 p-2 rounded border border-blue-500/20">
                      <div className="font-medium text-blue-300 mb-1">Context from previous nodes:</div>
                      <div className="space-y-1">
                        {nodeContext.previousNodes.slice(-2).map((prev: any, idx: number) => (
                          <div key={prev.id} className="text-slate-400">
                            • {prev.id}: {prev.summary || 'executed'}
                          </div>
                        ))}
                        {nodeContext.previousNodes.length > 2 && (
                          <div className="text-slate-500 italic">
                            ...and {nodeContext.previousNodes.length - 2} more
                          </div>
                        )}
                      </div>
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
      <div className="mt-2 bg-slate-800/50 p-3 rounded-md">
        <pre className="text-xs text-slate-200 whitespace-pre-wrap break-words">
          <code>
            {typeof executionResult.finalOutput === 'object'
              ? JSON.stringify(executionResult.finalOutput, null, 2)
              : String(executionResult.finalOutput)}
          </code>
        </pre>
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

      {/* Agent Delegation Trace */}
      {executionResult.nodeResults && Object.values(executionResult.nodeResults).some((res: any) => (res.nodeType === 'agent' || res.nodeSubtype === 'agent') && res.trace?.delegatedToTool) && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-slate-300 mt-4">Agent Delegation Trace</h3>
          {Object.entries(executionResult.nodeResults).map(([nodeId, nodeResult]: [string, any]) => (
            (nodeResult.nodeType === 'agent' || nodeResult.nodeSubtype === 'agent') && nodeResult.trace?.delegatedToTool && (
              <div key={nodeId} className="p-3 bg-slate-800/50 rounded-md border border-slate-700">
                <p className="text-xs text-slate-400 mb-2">Agent Node ID: {nodeId}</p>
                <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono">
                  <code>
                    {JSON.stringify(nodeResult.trace.delegatedToTool, null, 2)}
                  </code>
                </pre>
              </div>
            )
          ))}
        </div>
      )}

      {/* Tool Execution Trace */}
      {executionResult.nodeResults && Object.values(executionResult.nodeResults).some((res: any) => res.nodeType === 'tool' && res.trace) && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-slate-300 mt-4">Tool Execution Trace</h3>
          {Object.entries(executionResult.nodeResults).map(([nodeId, nodeResult]: [string, any]) => (
            nodeResult.nodeType === 'tool' && nodeResult.trace && (
              <div key={nodeId} className="p-3 bg-slate-800/50 rounded-md border border-slate-700">
                <p className="text-xs text-slate-400 mb-2">Node ID: {nodeId}</p>
                <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono">
                  <code>
                    {JSON.stringify(nodeResult.trace, null, 2)}
                  </code>
                </pre>
              </div>
            )
          ))}
        </div>
      )}

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

// Context Tab - Shows contextual data flow between nodes
function ContextTab({ 
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
          <FileText className="w-8 h-8" />
        </motion.div>
        <p>Tracking context flow...</p>
      </div>
    );
  }

  if (!executionResult) {
    return (
      <div className="text-center text-slate-400 py-8">
        <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>Execute flow to see context packets</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-slate-300 mb-3">
        Context Flow Between Nodes
      </h3>
      
      {executionResult.contextFlow && executionResult.contextFlow.length > 0 ? (
        <div className="space-y-3">
          {executionResult.contextFlow.map((context, index) => (
            <div key={context.nodeId} className="bg-slate-800/50 p-3 rounded border border-slate-600">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium text-slate-300">
                    {context.nodeId}
                  </span>
                  <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                    {context.nodeSubtype || context.nodeType}
                  </span>
                </div>
                <span className="text-xs text-slate-500">
                  {new Date(context.timestamp).toLocaleTimeString()}
                </span>
              </div>
              
              {/* Properties Panel Data */}
              {context.inputFromProperties && (
                <div className="mb-2 p-2 bg-green-500/10 rounded border border-green-500/20">
                  <div className="text-xs font-medium text-green-400 mb-1">Input from Properties Panel:</div>
                  <div className="text-xs text-green-300">
                    {context.inputFromProperties.slice(0, 100)}...
                  </div>
                </div>
              )}
              
              {/* Context from Previous Nodes */}
              {context.previousNodes && context.previousNodes.length > 0 && (
                <div className="mb-2 p-2 bg-blue-500/10 rounded border border-blue-500/20">
                  <div className="text-xs font-medium text-blue-400 mb-1">
                    Context from {context.previousNodes.length} previous node(s):
                  </div>
                  <div className="space-y-1">
                    {context.previousNodes.map((prev: any, idx: number) => (
                      <div key={prev.id} className="text-xs text-blue-300">
                        • {prev.id} ({prev.type}): {prev.summary || 'executed'}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Node Output */}
              {context.output && (
                <div className="p-2 bg-slate-700/50 rounded border">
                  <div className="text-xs font-medium text-slate-300 mb-1">Node Output:</div>
                  <div className="text-xs text-slate-400 font-mono">
                    {typeof context.output === 'object' 
                      ? JSON.stringify(context.output, null, 2).slice(0, 200) + '...'
                      : String(context.output).slice(0, 200) + (String(context.output).length > 200 ? '...' : '')
                    }
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-slate-500 py-4">
          No context flow data available
        </div>
      )}
    </div>
  );
}
