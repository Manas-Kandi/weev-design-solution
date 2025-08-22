/**
 * Flow Execution Panel
 * 
 * This component executes the entire workflow from start to finish,
 * following the connections between nodes and using Properties Panel
 * configurations as the authoritative source for each node's behavior.
 */

"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  X, 
  FileText, 
  Zap, 
  Eye, 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle,
  Copy,
  Check,
  ArrowRight,
  Settings,
  Info
} from 'lucide-react';
import { CanvasNode, Connection } from '@/types';
import { executeNodeFromProperties, PropertiesExecutionResult } from '@/lib/propertiesTestingBridge';
import { callLLM } from '@/lib/llmClient';
import { type UserTier } from '@/lib/subscriptionTiers';

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
  selectedNode,
  isVisible,
  onClose
}: FlowExecutionPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('inputs');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResults, setExecutionResults] = useState<Map<string, PropertiesExecutionResult>>(new Map());
  const [lastExecutedNodeId, setLastExecutedNodeId] = useState<string | null>(null);
  const [copiedStates, setCopiedStates] = useState<Map<string, boolean>>(new Map());
  const [userTier, setUserTier] = useState<UserTier>('basic');

  // Execute selected node using Properties Panel data ONLY
  const executeSelectedNode = useCallback(async () => {
    if (!selectedNode) return;
    
    setIsExecuting(true);
    setLastExecutedNodeId(selectedNode.id);
    
    try {
      // Extract Properties Panel configuration based on node type
      const nodeData = selectedNode.data as any;
      let propertiesPanelInput = '';
      
      // Get the actual Properties Panel input based on node structure
      if (nodeData?.rules?.nl) {
        propertiesPanelInput = nodeData.rules.nl; // Generic agent rules
      } else if (nodeData?.systemPrompt) {
        propertiesPanelInput = nodeData.systemPrompt; // System prompt
      } else if (nodeData?.behavior) {
        propertiesPanelInput = nodeData.behavior; // Behavior rules
      } else if (nodeData?.llmRule) {
        propertiesPanelInput = nodeData.llmRule; // Router LLM rules
      } else if (nodeData?.expression) {
        propertiesPanelInput = nodeData.expression; // Router expressions
      }
      
      // Create an LLM executor that uses the unified LLM client with tier enforcement
      const llmExecutor = async (prompt: string, systemPrompt?: string, tools?: any[]) => {
        // Get model from current node data, default to Llama if not specified
        const selectedModel = (selectedNode.data as any)?.model || 'meta/llama-3.1-70b-instruct';
        
        console.log('🔍 PropertiesDrivenTestingPanel - Model Selection:', {
          nodeId: selectedNode.id,
          selectedModel,
          nodeData: selectedNode.data,
          userTier: userTier
        });
        
        const result = await callLLM(prompt, {
          model: selectedModel,
          system: systemPrompt,
          temperature: 0.7,
          max_tokens: 1024,
          userTier: userTier // Use selected user tier for testing
        });
        return result.text;
      };

      const result = await executeNodeFromProperties(
        selectedNode,
        { input: propertiesPanelInput }, // Use actual Properties Panel input
        llmExecutor
      );
      
      console.log('✅ PropertiesDrivenTestingPanel - Execution result:', {
        nodeId: selectedNode.id,
        result,
        executionSummary: result.executionSummary
      });
      
      setExecutionResults(prev => new Map(prev).set(selectedNode.id, result));
    } catch (error) {
      console.error('❌ PropertiesDrivenTestingPanel - Execution failed:', error);
      
      // Create an error result to display tier enforcement errors
      const errorResult = {
        nodeId: selectedNode.id,
        nodeType: selectedNode.type,
        result: null,
        executionSummary: `Error: ${error instanceof Error ? error.message : String(error)}`,
        outputsTab: {
          result: null,
          source: 'Error during execution'
        },
        summaryTab: {
          explanation: `Execution failed: ${error instanceof Error ? error.message : String(error)}`
        },
        trace: { error: error instanceof Error ? error.message : String(error) }
      };
      
      setExecutionResults(prev => new Map(prev).set(selectedNode.id, errorResult));
    } finally {
      setIsExecuting(false);
    }
  }, [selectedNode]);

  // Get current execution result for selected node
  const currentResult = selectedNode ? executionResults.get(selectedNode.id) || null : null;

  // Copy output to clipboard for debugging
  const copyOutputToClipboard = useCallback(async (result: PropertiesExecutionResult) => {
    if (!result.outputsTab.result) return;
    
    // Extract plain text output for debugging
    let plainTextOutput = '';
    
    if (result.outputsTab.result === 'No info input in properties panel') {
      plainTextOutput = 'No info input in properties panel';
    } else if (typeof result.outputsTab.result === 'object') {
      plainTextOutput = JSON.stringify(result.outputsTab.result, null, 2);
    } else {
      plainTextOutput = String(result.outputsTab.result);
    }
    
    // Add context for debugging
    const debugText = `Node: ${(selectedNode?.data as any)?.title || selectedNode?.id || 'Unknown'}
Type: ${result.nodeType}
Source: ${result.outputsTab.source}

Output:
${plainTextOutput}`;

    try {
      await navigator.clipboard.writeText(debugText);
      setCopiedStates(prev => new Map(prev).set(result.nodeId, true));
      setTimeout(() => {
        setCopiedStates(prev => new Map(prev).set(result.nodeId, false));
      }, 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }, [selectedNode]);

  // Auto-execute when node selection changes (to show immediate feedback)
  useEffect(() => {
    if (selectedNode && isVisible) {
      executeSelectedNode();
    }
  }, [selectedNode?.id, selectedNode?.data, isVisible, executeSelectedNode]);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed top-0 right-0 h-full w-96 bg-slate-900/95 backdrop-blur-lg border-l border-slate-700 shadow-2xl z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">Testing Panel</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-700 rounded-md transition-colors"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* Node Info */}
      {selectedNode && (
        <div className="p-4 border-b border-slate-700 bg-slate-800/50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-white">
              {(selectedNode.data as any)?.title || selectedNode.id}
            </h3>
            <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
              {selectedNode.subtype || selectedNode.type}
            </span>
          </div>
          
          {/* User Tier Selection */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-slate-400 mb-1">
              User Tier
            </label>
            <select
              value={userTier}
              onChange={(e) => setUserTier(e.target.value as UserTier)}
              className="w-full px-2 py-1 text-sm bg-slate-700 border border-slate-600 rounded text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="basic">Basic ($5/month)</option>
              <option value="pro">Pro ($25/month)</option>
            </select>
          </div>
          
          <button
            onClick={executeSelectedNode}
            disabled={isExecuting}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white text-sm rounded-md transition-colors"
          >
            <Play className="w-4 h-4" />
{isExecuting ? 'Executing...' : (() => {
              const nodeData = selectedNode.data as any;
              let propertiesInput = '';
              
              // Get the actual Properties Panel input based on node structure
              if (nodeData?.rules?.nl) {
                propertiesInput = nodeData.rules.nl;
              } else if (nodeData?.systemPrompt) {
                propertiesInput = nodeData.systemPrompt;
              } else if (nodeData?.behavior) {
                propertiesInput = nodeData.behavior;
              } else if (nodeData?.llmRule) {
                propertiesInput = nodeData.llmRule;
              } else if (nodeData?.expression) {
                propertiesInput = nodeData.expression;
              }
              
              return propertiesInput 
                ? `Execute "${propertiesInput.slice(0, 20)}${propertiesInput.length > 20 ? '...' : ''}"`
                : 'Execute Node';
            })()}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-700">
        {[
          { id: 'inputs', label: 'Properties', icon: FileText },
          { id: 'outputs', label: 'Output', icon: Zap },
          { id: 'summary', label: 'Rules Applied', icon: Eye }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as TabType)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
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
      <div className="flex-1 overflow-y-auto">
        {!selectedNode ? (
          <div className="p-4 text-center text-slate-400">
            <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Select a node to view its testing information</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="p-4"
            >
              {activeTab === 'inputs' && (
                <InputsTab result={currentResult} />
              )}
              {activeTab === 'outputs' && (
                <OutputsTab 
                  result={currentResult} 
                  isExecuting={isExecuting}
                  onCopyOutput={currentResult ? () => copyOutputToClipboard(currentResult) : undefined}
                  isCopied={currentResult ? copiedStates.get(currentResult.nodeId) || false : false}
                />
              )}
              {activeTab === 'summary' && (
                <SummaryTab result={currentResult} />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}

// Properties Tab - Shows Properties Panel configuration
function InputsTab({ result }: { result: PropertiesExecutionResult | null }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-slate-300 mb-3">
        Properties Panel Configuration
      </h3>
      
      {!result ? (
        <div className="p-3 bg-slate-700/50 border border-slate-600 rounded-md">
          <p className="text-sm text-slate-400">
            Click "Execute Properties" to see configuration
          </p>
        </div>
      ) : result.inputsTab.properties.length === 0 ? (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-md">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">No Properties Configured</span>
          </div>
          <p className="text-sm text-amber-300/80 mt-1">
            Configure this node in the Properties Panel to see inputs here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {result.inputsTab.properties.map((prop, index) => (
            <div
              key={prop.key}
              className={`p-3 rounded-md border ${
                prop.configured
                  ? 'bg-green-500/10 border-green-500/20'
                  : 'bg-slate-700/50 border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-slate-300">
                  {prop.label}
                </span>
                {prop.configured ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-slate-500" />
                )}
              </div>
              
              {prop.configured ? (
                <div className="text-sm text-slate-400 bg-slate-800/50 p-2 rounded border">
                  <pre className="whitespace-pre-wrap font-mono text-xs">
                    {typeof prop.value === 'object' 
                      ? JSON.stringify(prop.value, null, 2)
                      : String(prop.value)
                    }
                  </pre>
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">
                  Not configured in Properties Panel
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Output Tab - Shows result from Properties Panel execution
function OutputsTab({ 
  result, 
  isExecuting,
  onCopyOutput,
  isCopied
}: { 
  result: PropertiesExecutionResult | null;
  isExecuting: boolean;
  onCopyOutput?: () => Promise<void>;
  isCopied?: boolean;
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
        <p>Executing Properties Panel configuration...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="text-center text-slate-400 py-8">
        <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>Click "Execute Properties" to see output</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-300">
          Output from Properties Panel
        </h3>
        {onCopyOutput && result.outputsTab.result && (
          <button
            onClick={onCopyOutput}
            className="flex items-center gap-2 px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs rounded transition-colors"
            title="Copy output for debugging in Windsurf"
          >
            {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {isCopied ? 'Copied!' : 'Copy'}
          </button>
        )}
      </div>

      {/* Result Type Indicator */}
      <div className={`p-3 rounded-md border ${
        result.outputsTab.resultType === 'error'
          ? 'bg-red-500/10 border-red-500/20'
          : result.outputsTab.resultType === 'mock'
          ? 'bg-blue-500/10 border-blue-500/20'
          : 'bg-green-500/10 border-green-500/20'
      }`}>
        <div className="flex items-center gap-2 mb-2">
          {result.outputsTab.resultType === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-400" />
          ) : result.outputsTab.resultType === 'mock' ? (
            <FileText className="w-4 h-4 text-blue-400" />
          ) : (
            <CheckCircle className="w-4 h-4 text-green-400" />
          )}
          <span className={`text-sm font-medium ${
            result.outputsTab.resultType === 'error'
              ? 'text-red-400'
              : result.outputsTab.resultType === 'mock'
              ? 'text-blue-400'
              : 'text-green-400'
          }`}>
            {result.outputsTab.resultType === 'error'
              ? 'Properties Missing'
              : result.outputsTab.resultType === 'mock'
              ? 'Mock Response Used'
              : 'Properties Executed'
            }
          </span>
        </div>
        <p className="text-xs text-slate-400">
          {result.outputsTab.source}
        </p>
      </div>

      {/* Result Content */}
      {result.outputsTab.result === 'No info input in properties panel' ? (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-md text-center">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-amber-400" />
          <p className="text-amber-400 font-medium">No info input in properties panel</p>
          <p className="text-amber-300/80 text-sm mt-1">
            Configure this node in the Properties Panel to see results here.
          </p>
          {onCopyOutput && (
            <button
              onClick={onCopyOutput}
              className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 text-sm rounded-md transition-colors mx-auto"
            >
              {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {isCopied ? 'Copied!' : 'Copy for Debug'}
            </button>
          )}
        </div>
      ) : result.outputsTab.result ? (
        <div className="bg-slate-800/50 p-3 rounded-md border border-slate-600">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-slate-300">Result</h4>
            {onCopyOutput && (
              <button
                onClick={onCopyOutput}
                className="flex items-center gap-2 px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs rounded transition-colors"
                title="Copy output for debugging in Windsurf"
              >
                {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {isCopied ? 'Copied!' : 'Copy'}
              </button>
            )}
          </div>
          <div className="text-sm text-slate-400 bg-slate-900/50 p-3 rounded border">
            <pre className="whitespace-pre-wrap font-mono text-xs">
              {typeof result.outputsTab.result === 'object'
                ? JSON.stringify(result.outputsTab.result, null, 2)
                : String(result.outputsTab.result)
              }
            </pre>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-slate-700/50 border border-slate-600 rounded-md text-center">
          <AlertCircle className="w-6 h-6 mx-auto mb-2 text-slate-500" />
          <p className="text-slate-400">No result available</p>
        </div>
      )}
    </div>
  );
}

// Summary Tab - Explains what rules fired and why
function SummaryTab({ result }: { result: PropertiesExecutionResult | null }) {
  if (!result) {
    return (
      <div className="text-center text-slate-400 py-8">
        <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>Run test to see execution summary</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-slate-300 mb-3">
        {result.summaryTab.title}
      </h3>

      {/* Execution Summary */}
      <div className="p-3 bg-slate-800/50 rounded-md border border-slate-600">
        <h4 className="text-sm font-medium text-slate-300 mb-2">What Happened</h4>
        <p className="text-sm text-slate-400">
          {result.summaryTab.explanation}
        </p>
      </div>

      {/* Rules Fired */}
      {result.summaryTab.rulesFired.length > 0 && (
        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md">
          <h4 className="text-sm font-medium text-green-400 mb-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Rules Applied
          </h4>
          <ul className="space-y-1">
            {result.summaryTab.rulesFired.map((rule, index) => (
              <li key={index} className="text-sm text-green-300 flex items-center gap-2">
                <span className="w-1 h-1 bg-green-400 rounded-full"></span>
                {rule}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Missing Properties */}
      {result.summaryTab.missingProperties.length > 0 && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
          <h4 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Missing Configuration
          </h4>
          <ul className="space-y-1">
            {result.summaryTab.missingProperties.map((prop, index) => (
              <li key={index} className="text-sm text-red-300 flex items-center gap-2">
                <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                {prop}
              </li>
            ))}
          </ul>
          <p className="text-xs text-red-300/80 mt-2">
            Configure these properties in the Properties Panel to enable execution.
          </p>
        </div>
      )}

      {/* Properties Used */}
      <div className="p-3 bg-slate-700/50 rounded-md border border-slate-600">
        <h4 className="text-sm font-medium text-slate-300 mb-2">Properties Panel Data Used</h4>
        <div className="space-y-2">
          {Object.entries(result.propertiesUsed).map(([key, value]) => (
            <div key={key} className="flex justify-between items-start gap-2">
              <span className="text-sm text-slate-400 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}:
              </span>
              <span className={`text-sm ${value ? 'text-slate-300' : 'text-slate-500 italic'}`}>
                {value ? (typeof value === 'object' ? 'Configured' : 'Set') : 'Not set'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Execution Metadata */}
      <div className="p-3 bg-slate-800/30 rounded-md border border-slate-700">
        <h4 className="text-sm font-medium text-slate-300 mb-2">Execution Info</h4>
        <div className="space-y-1 text-xs text-slate-400">
          <div>Node Type: {result.nodeType}</div>
          <div>Node ID: {result.nodeId}</div>
          <div>Executed: {new Date(result.timestamp).toLocaleTimeString()}</div>
          <div>Summary: {result.executionSummary}</div>
        </div>
      </div>
    </div>
  );
}
