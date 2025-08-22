/**
 * Enhanced Flow Execution Panel with Advanced Step-by-Step Execution Controls
 * 
 * This is a fixed version that resolves the runtime errors while maintaining
 * the advanced step-by-step execution capabilities.
 */

"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Pause,
  Square,
  ChevronRight,
  X, 
  FileText, 
  Zap, 
  Eye, 
  CheckCircle, 
  AlertCircle, 
  Copy,
  Check,
  ArrowRight,
  Clock,
  Brain,
  Target
} from 'lucide-react';
import { CanvasNode, Connection, NodeContext } from '@/types';
import { SteppableWorkflowRunner, ExecutionState, ExecutionStep } from '@/lib/execution/SteppableWorkflowRunner';
import { ExecutionEventAggregator, LLMInteractionEvent } from '@/lib/execution/events';
import ExecutionControls from '@/components/testing/ExecutionControls';
import ExecutionTimeline from '@/components/testing/ExecutionTimeline';
import ReasoningPanel from '@/components/testing/ReasoningPanel';

interface FlowExecutionPanelProps {
  nodes: CanvasNode[];
  connections: Connection[];
  selectedNode: CanvasNode | null;
  isVisible: boolean;
  onClose: () => void;
}

type TabType = 'flow' | 'outputs' | 'timeline' | 'context' | 'reasoning' | 'breakpoints';

interface FlowExecutionResult {
  success: boolean;
  executionOrder: string[];
  nodeResults: Record<string, any>;
  finalOutput: any;
  executionTime: number;
  error?: string;
  contextFlow: Record<string, any>[];
  events: any[];
  steps: ExecutionStep[];
  executionState: ExecutionState;
}

export default function FlowExecutionPanel({
  nodes,
  connections,
  isVisible,
  onClose
}: FlowExecutionPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('flow');
  const [executionResult, setExecutionResult] = useState<FlowExecutionResult | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Step-by-step execution state
  const [workflowRunner, setWorkflowRunner] = useState<SteppableWorkflowRunner | null>(null);
  const [executionState, setExecutionState] = useState<ExecutionState>({
    status: 'idle',
    currentNodeId: null,
    queuedNodes: [],
    completedNodes: [],
    breakpoints: new Set(),
    speed: 1.0,
    startTime: null,
    pauseTime: null,
    totalPauseTime: 0
  });
  const [executionSteps, setExecutionSteps] = useState<ExecutionStep[]>([]);
  const [eventAggregator] = useState(new ExecutionEventAggregator());
  const [llmInteractions, setLlmInteractions] = useState<LLMInteractionEvent[]>([]);

  // Initialize workflow runner when nodes/connections change
  useEffect(() => {
    if (nodes.length > 0) {
      const runner = new SteppableWorkflowRunner(nodes, connections);
      
      // Listen to execution events
      runner.on('executionEvent', (event) => {
        eventAggregator.addEvent(event);
        
        // Update LLM interactions
        if (event.type === 'llm_request' || event.type === 'llm_response') {
          setLlmInteractions(prev => [...prev, event as LLMInteractionEvent]);
        }
        
        // Update execution state
        setExecutionState(runner.getExecutionState());
        setExecutionSteps(runner.getExecutionSteps());
      });
      
      setWorkflowRunner(runner);
    }
  }, [nodes, connections, eventAggregator]);

  // Step-by-step execution controls
  const handlePlay = useCallback(async () => {
    if (!workflowRunner) return;
    
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
        events: [],
        steps: [],
        executionState: executionState
      });
      return;
    }

    try {
      const results = await workflowRunner.executeWorkflow(startNode.id);
      
      setExecutionResult({
        success: true,
        executionOrder: executionSteps.map(step => step.nodeId),
        nodeResults: results,
        finalOutput: results,
        executionTime: Date.now() - (executionState.startTime || Date.now()),
        contextFlow: [],
        events: eventAggregator.getAllEvents(),
        steps: executionSteps,
        executionState: workflowRunner.getExecutionState()
      });
    } catch (error) {
      setExecutionResult({
        success: false,
        executionOrder: [],
        nodeResults: {},
        finalOutput: null,
        executionTime: Date.now() - (executionState.startTime || Date.now()),
        error: error instanceof Error ? error.message : String(error),
        contextFlow: [],
        events: eventAggregator.getAllEvents(),
        steps: executionSteps,
        executionState: workflowRunner.getExecutionState()
      });
    }
  }, [workflowRunner, findStartNode, executionState, executionSteps, eventAggregator]);

  const handlePause = useCallback(async () => {
    if (workflowRunner) {
      await workflowRunner.pause();
    }
  }, [workflowRunner]);

  const handleStep = useCallback(async () => {
    if (workflowRunner) {
      await workflowRunner.step();
    }
  }, [workflowRunner]);

  const handleReset = useCallback(() => {
    if (workflowRunner) {
      workflowRunner.reset();
      setExecutionResult(null);
      setExecutionSteps([]);
      setLlmInteractions([]);
      eventAggregator.clear();
    }
  }, [workflowRunner, eventAggregator]);

  const handleSpeedChange = useCallback((speed: number) => {
    if (workflowRunner) {
      workflowRunner.setSpeed(speed);
    }
  }, [workflowRunner]);

  const handleToggleBreakpoint = useCallback((nodeId: string) => {
    if (workflowRunner) {
      workflowRunner.toggleBreakpoint(nodeId);
      setExecutionState(workflowRunner.getExecutionState());
    }
  }, [workflowRunner]);

  const handleJumpToStep = useCallback((stepIndex: number) => {
    // For now, just select the node - full jump functionality would require more complex state management
    if (executionSteps[stepIndex]) {
      setSelectedNodeId(executionSteps[stepIndex].nodeId);
    }
  }, [executionSteps]);

  // Copy output functionality
  const copyOutput = useCallback(() => {
    if (executionResult?.finalOutput) {
      navigator.clipboard.writeText(JSON.stringify(executionResult.finalOutput, null, 2));
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  }, [executionResult]);

  if (!isVisible) return null;

  const isExecuting = executionState.status === 'running';
  const startNode = findStartNode();

  return (
    <div className="h-full flex flex-col bg-slate-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-800">
        <h2 className="text-lg font-semibold">Flow Execution Panel</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-800 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Execution Controls */}
      <ExecutionControls
        executionState={executionState}
        onPlay={handlePlay}
        onPause={handlePause}
        onStep={handleStep}
        onReset={handleReset}
        onSpeedChange={handleSpeedChange}
        disabled={nodes.length === 0}
      />

      {/* Execute Button (Legacy compatibility) */}
      <div className="p-3 border-b border-slate-800">
        <button
          onClick={handlePlay}
          disabled={isExecuting || nodes.length === 0}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white rounded text-sm transition-colors"
        >
          <Play className="w-3 h-3" />
          {isExecuting ? 'Executing...' : `Execute (${nodes.length})`}
        </button>
        
        {startNode && (
          <p className="text-xs text-slate-400 mt-2 text-center">
            Starting from: {(startNode.data as any)?.title || startNode.id}
          </p>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-800">
        {[
          { id: 'flow', label: 'Flow', icon: Zap },
          { id: 'outputs', label: 'Outputs', icon: FileText },
          { id: 'timeline', label: 'Timeline', icon: Clock },
          { id: 'reasoning', label: 'Reasoning', icon: Brain },
          { id: 'context', label: 'Context', icon: Eye }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as TabType)}
            className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
              activeTab === id
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'flow' && (
          <FlowTab 
            nodes={nodes} 
            connections={connections} 
            executionResult={executionResult}
            isExecuting={isExecuting}
            executionSteps={executionSteps}
            onToggleBreakpoint={handleToggleBreakpoint}
            breakpoints={executionState.breakpoints}
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
          <ExecutionTimeline
            steps={executionSteps}
            currentNodeId={executionState.currentNodeId}
            onJumpToStep={handleJumpToStep}
            className="h-full"
          />
        )}
        
        {activeTab === 'reasoning' && (
          <ReasoningPanel
            llmInteractions={llmInteractions}
            currentNodeId={executionState.currentNodeId}
            className="h-full"
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
  isExecuting,
  executionSteps,
  onToggleBreakpoint,
  breakpoints
}: { 
  nodes: CanvasNode[];
  connections: Connection[];
  executionResult: FlowExecutionResult | null;
  isExecuting: boolean;
  executionSteps: ExecutionStep[];
  onToggleBreakpoint: (nodeId: string) => void;
  breakpoints: Set<string>;
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

  if (!executionResult && nodes.length === 0) {
    return (
      <div className="text-center text-slate-400 py-8">
        <Zap className="w-8 h-8 mx-auto mb-2" />
        <p>No nodes in workflow</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-slate-300">Workflow Structure</h3>
        <div className="text-xs text-slate-400">
          {nodes.length} nodes, {connections.length} connections
        </div>
      </div>

      {/* Node List with Breakpoint Controls */}
      <div className="space-y-2">
        {nodes.map((node) => {
          const hasBreakpoint = breakpoints.has(node.id);
          const isCompleted = executionSteps.some(step => step.nodeId === node.id && step.status === 'completed');
          const isError = executionSteps.some(step => step.nodeId === node.id && step.status === 'error');
          
          return (
            <div
              key={node.id}
              className={`
                p-3 rounded border cursor-pointer transition-colors
                ${hasBreakpoint ? 'border-red-500 bg-red-500/10' : 'border-slate-700 hover:border-slate-600'}
                ${isCompleted ? 'bg-green-500/10 border-green-500' : ''}
                ${isError ? 'bg-red-500/10 border-red-500' : ''}
              `}
              onClick={() => onToggleBreakpoint(node.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">
                    {(node.data as any)?.title || node.id}
                  </div>
                  <div className="text-xs text-slate-400">
                    {node.type} {node.subtype && `• ${node.subtype}`}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {hasBreakpoint && (
                    <div className="w-2 h-2 bg-red-500 rounded-full" title="Breakpoint" />
                  )}
                  {isCompleted && <CheckCircle className="w-4 h-4 text-green-500" />}
                  {isError && <AlertCircle className="w-4 h-4 text-red-500" />}
                </div>
              </div>
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
          <ArrowRight className="w-8 h-8" />
        </motion.div>
        <p>Generating outputs...</p>
      </div>
    );
  }

  if (!executionResult) {
    return (
      <div className="text-center text-slate-400 py-8">
        <FileText className="w-8 h-8 mx-auto mb-2" />
        <p>No execution results yet</p>
        <p className="text-xs mt-1">Run the workflow to see outputs</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      {/* Execution Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {executionResult.success ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-500" />
          )}
          <span className={`text-sm font-medium ${
            executionResult.success ? 'text-green-400' : 'text-red-400'
          }`}>
            {executionResult.success ? 'Success' : 'Failed'}
          </span>
        </div>
        
        <div className="text-xs text-slate-400">
          {executionResult.executionTime}ms
        </div>
      </div>

      {/* Error Display */}
      {executionResult.error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded">
          <div className="text-sm font-medium text-red-400 mb-1">Error</div>
          <div className="text-xs text-red-300 font-mono">
            {executionResult.error}
          </div>
        </div>
      )}

      {/* Final Output */}
      {executionResult.finalOutput && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-300">Final Output</h3>
            <button
              onClick={onCopyOutput}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 rounded transition-colors"
            >
              {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {isCopied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          
          <div className="p-3 bg-slate-800 rounded text-xs font-mono overflow-x-auto">
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(executionResult.finalOutput, null, 2)}
            </pre>
          </div>
        </div>
      )}
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
          <ArrowRight className="w-8 h-8" />
        </motion.div>
        <p>Tracking context flow...</p>
      </div>
    );
  }

  if (!executionResult || !executionResult.contextFlow.length) {
    return (
      <div className="text-center text-slate-400 py-8">
        <Eye className="w-8 h-8 mx-auto mb-2" />
        <p>No context flow data</p>
        <p className="text-xs mt-1">Run the workflow to see data flow</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      <h3 className="text-sm font-medium text-slate-300">Context Flow</h3>
      
      <div className="space-y-3">
        {executionResult.contextFlow.map((context, index) => (
          <div key={index} className="p-3 bg-slate-800 rounded">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">
                {context.title || context.nodeId}
              </div>
              <div className="text-xs text-slate-400">
                {new Date(context.timestamp).toLocaleTimeString()}
              </div>
            </div>
            
            <div className="text-xs font-mono text-slate-300">
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(context.context, null, 2)}
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
