import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, X, CheckCircle2, Loader2, Clock, Brain } from 'lucide-react';
import { CanvasNode, Connection } from '@/types';
import { runWorkflowWithProperties } from '@/lib/workflowRunnerPropertiesDriven';

interface ModernTestingPanelProps {
  nodes: CanvasNode[];
  connections: Connection[];
  isVisible: boolean;
  onClose: () => void;
  selectedNode?: CanvasNode | null;
}

interface ExecutionStep {
  id: string;
  name: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  duration?: number;
  output?: string;
}

export function ModernTestingPanel({ 
  nodes, 
  connections, 
  isVisible, 
  onClose 
}: ModernTestingPanelProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [inputValue, setInputValue] = useState('Build a user profile component with avatar and contact info');
  const [inputMode, setInputMode] = useState('user');
  const [steps, setSteps] = useState<ExecutionStep[]>([]);
  const [finalOutput, setFinalOutput] = useState<string>('');
  const [executionTime, setExecutionTime] = useState(0);

  const inputModes = {
    user: { label: 'Ask', placeholder: 'What do you want to build or do?' },
    auto: { label: 'Trigger', placeholder: 'timer:daily, webhook:payment' },
    data: { label: 'Data', placeholder: '{"user_id": 123, "action": "create"}' },
    test: { label: 'Edge Case', placeholder: 'What if the database is empty?' }
  };

  // Find start node
  const findStartNode = useCallback(() => {
    const nodeIds = nodes.map(n => n.id);
    const connectedTargets = new Set(connections.map(c => c.target));
    const startNodes = nodes.filter(n => !connectedTargets.has(n.id));
    return startNodes.length > 0 ? startNodes[0].id : (nodes.length > 0 ? nodes[0].id : null);
  }, [nodes, connections]);

  // Convert nodes to execution steps
  const generateSteps = useCallback(() => {
    if (nodes.length === 0) return [];
    
    const startNodeId = findStartNode();
    if (!startNodeId) return [];

    // Simple execution order (can be enhanced with proper graph traversal)
    const orderedNodes: CanvasNode[] = [];
    const visited = new Set<string>();
    
    const traverse = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      
      const node = nodes.find(n => n.id === nodeId);
      if (node) {
        orderedNodes.push(node);
        
        // Find connected nodes
        const outgoingConnections = connections.filter(c => c.source === nodeId);
        outgoingConnections.forEach(conn => traverse(conn.target));
      }
    };

    traverse(startNodeId);

    return orderedNodes.map((node, index) => ({
      id: node.id,
      name: getStepName(node),
      type: node.type || 'unknown',
      status: 'pending' as const
    }));
  }, [nodes, connections, findStartNode]);

  const getStepName = (node: CanvasNode): string => {
    const data = node.data as any;
    if (data?.title) return data.title;
    
    switch (node.type) {
      case 'agent': return 'Understanding Request';
      case 'tool': return 'Using Tool';
      case 'router': return 'Making Decision';
      case 'memory': return 'Retrieving Context';
      case 'template': return 'Formatting Output';
      default: return `${node.type || 'Unknown'} Node`;
    }
  };

  const executeWorkflow = useCallback(async () => {
    if (nodes.length === 0) {
      alert('Please add some nodes to test!');
      return;
    }

    const startNodeId = findStartNode();
    if (!startNodeId) {
      alert('No start node found!');
      return;
    }

    setIsRunning(true);
    setCurrentStep(0);
    setFinalOutput('');
    setExecutionTime(0);

    // Generate and initialize steps
    const generatedSteps = generateSteps();
    setSteps(generatedSteps);

    const startTime = Date.now();

    try {
      // Execute workflow step by step
      for (let i = 0; i < generatedSteps.length; i++) {
        setCurrentStep(i + 1);
        
        // Update step status to running
        setSteps(prev => prev.map((step, index) => 
          index === i 
            ? { ...step, status: 'running' }
            : index < i 
            ? { ...step, status: 'completed' }
            : step
        ));

        // Simulate step execution time
        await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

        // Update step status to completed
        setSteps(prev => prev.map((step, index) => 
          index === i 
            ? { ...step, status: 'completed', duration: Date.now() - startTime }
            : step
        ));
      }

      // Run the actual workflow
      const result = await runWorkflowWithProperties(
        nodes,
        connections,
        startNodeId,
        { inputs: { userInput: inputValue } },
        undefined,
        undefined,
        'basic' // user tier
      );

      // Extract final output
      const finalResult = extractFinalOutput(result);
      setFinalOutput(finalResult);
      setExecutionTime(Date.now() - startTime);

    } catch (error) {
      console.error('Workflow execution failed:', error);
      setFinalOutput(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Mark current step as error
      setSteps(prev => prev.map((step, index) => 
        index === currentStep - 1 
          ? { ...step, status: 'error' }
          : step
      ));
    } finally {
      setIsRunning(false);
    }
  }, [nodes, connections, findStartNode, inputValue, generateSteps, currentStep]);

  const extractFinalOutput = (result: any): string => {
    if (!result || typeof result !== 'object') {
      return 'No output generated';
    }

    // Try to find meaningful output
    const resultEntries = Object.entries(result);
    for (let i = resultEntries.length - 1; i >= 0; i--) {
      const [, nodeResult] = resultEntries[i];
      
      if (nodeResult && typeof nodeResult === 'object') {
        const output = (nodeResult as any).output || 
                      (nodeResult as any).result ||
                      (nodeResult as any).message;
        
        if (output && typeof output === 'string' && output.trim()) {
          return output;
        }
      }
    }

    return JSON.stringify(result, null, 2);
  };

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setCurrentStep(0);
    setSteps([]);
    setFinalOutput('');
    setExecutionTime(0);
  }, []);

  // Initialize steps when nodes change
  useEffect(() => {
    if (!isRunning) {
      setSteps(generateSteps());
    }
  }, [nodes, connections, generateSteps, isRunning]);

  if (!isVisible) return null;

  return (
    <div className="w-96 h-screen bg-gray-950 border-l border-gray-800 flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <div className="text-gray-100 text-sm font-medium">Test Your Agent</div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300">
            <X size={16} />
          </button>
        </div>
        
        {/* Input Mode Tabs */}
        <div className="flex text-xs mb-2 border border-gray-700">
          {Object.entries(inputModes).map(([key, mode]) => (
            <button
              key={key}
              onClick={() => setInputMode(key)}
              className={`flex-1 px-2 py-1 transition-colors ${
                inputMode === key 
                  ? 'bg-gray-700 text-gray-100' 
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
              }`}
              title={mode.placeholder}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {/* Input */}
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={inputModes[inputMode as keyof typeof inputModes].placeholder}
          className="w-full px-2 py-2 bg-gray-900 border border-gray-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-gray-600 text-xs resize-none"
          rows={3}
        />

        {/* Controls */}
        <div className="flex gap-2 mt-2">
          <button
            onClick={executeWorkflow}
            disabled={isRunning || nodes.length === 0}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              isRunning || nodes.length === 0
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isRunning ? (
              <span className="flex items-center justify-center gap-1">
                <Loader2 size={12} className="animate-spin" />
                Working...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-1">
                <Play size={12} />
                {nodes.length === 0 ? 'Add Nodes First' : 'Run Test'}
              </span>
            )}
          </button>
          
          <button
            onClick={handleReset}
            disabled={isRunning}
            className="px-3 py-2 text-xs bg-gray-700 hover:bg-gray-600 text-gray-100 disabled:opacity-50"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-3 overflow-y-auto">
        {steps.length === 0 && !isRunning ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border border-gray-700 bg-gray-900 mx-auto mb-3 flex items-center justify-center">
              <Play size={14} className="text-gray-500" />
            </div>
            <div className="text-xs text-gray-500 mb-2">Ready to help</div>
            <div className="text-xs text-gray-600 max-w-sm mx-auto">
              {nodes.length === 0 
                ? 'Add some nodes to your canvas first, then come back to test them!'
                : 'Enter your request above and click "Run Test" to see your agent in action.'
              }
            </div>
          </div>
        ) : (
          <>
            {/* Progress */}
            {(isRunning || currentStep > 0) && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                  <span>Step {currentStep} of {steps.length}</span>
                  <span>{isRunning ? 'working...' : 'done!'}</span>
                </div>
                <div className="w-full bg-gray-800 h-px">
                  <div 
                    className="bg-blue-500 h-px transition-all duration-1000 ease-out"
                    style={{ width: `${(currentStep / steps.length) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Steps */}
            <div className="space-y-2 mb-6">
              {steps.map((step, index) => {
                const status = index < currentStep ? 'completed' : 
                             index === currentStep - 1 && isRunning ? 'running' : 
                             'pending';
                
                return (
                  <div key={step.id} className="flex items-start gap-3 p-2">
                    <div className={`flex-shrink-0 mt-0.5 ${
                      status === 'completed' ? 'text-green-400' :
                      status === 'running' ? 'text-blue-400' :
                      status === 'error' ? 'text-red-400' :
                      'text-gray-600'
                    }`}>
                      {status === 'completed' ? (
                        <CheckCircle2 size={16} />
                      ) : status === 'running' ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : status === 'error' ? (
                        <X size={16} />
                      ) : (
                        <div className="w-4 h-4 border-2 border-gray-600 rounded-full" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-sm ${
                          status === 'completed' ? 'text-gray-200' :
                          status === 'running' ? 'text-blue-200' :
                          status === 'error' ? 'text-red-200' :
                          'text-gray-500'
                        }`}>
                          {step.name}
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-800 px-1.5 py-0.5">
                          {step.type}
                        </span>
                      </div>
                      
                      {status === 'running' && (
                        <div className="text-xs text-blue-400 italic">
                          processing...
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Final Output */}
            {finalOutput && !isRunning && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Brain size={16} className="text-green-400" />
                  <h3 className="text-sm font-medium text-gray-200">Result</h3>
                </div>
                <div className="bg-gray-900 border border-gray-700 p-3 rounded">
                  <div className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {finalOutput}
                  </div>
                </div>
                
                {/* Stats */}
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-lg text-gray-200">
                      {(executionTime / 1000).toFixed(1)}s
                    </div>
                    <div className="text-xs text-gray-500">total time</div>
                  </div>
                  <div>
                    <div className="text-lg text-gray-200">{steps.length}</div>
                    <div className="text-xs text-gray-500">steps</div>
                  </div>
                  <div>
                    <div className="text-lg text-green-400">Free</div>
                    <div className="text-xs text-gray-500">cost</div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}