/**
 * Modern Testing Panel - Complete UI/UX Overhaul
 * 
 * This component replaces the FlowExecutionPanel with a simplified, professional
 * design based on the Claude mockup. Features clean layout, smooth animations,
 * and intuitive step-by-step execution visualization.
 */

"use client";

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause,
  Square,
  X, 
  CheckCircle, 
  Loader2,
  Circle,
  Clock,
  Hash
} from 'lucide-react';
import { CanvasNode, Connection } from '@/types';
import { runWorkflowWithProperties as runWorkflow } from '@/lib/workflowRunnerPropertiesDriven';

interface ModernTestingPanelProps {
  nodes: CanvasNode[];
  connections: Connection[];
  isVisible: boolean;
  onClose: () => void;
  selectedNode?: CanvasNode | null;
}

interface ExecutionStep {
  id: number;
  name: string;
  type: 'agent' | 'tool' | 'template' | 'logic';
  status: 'completed' | 'running' | 'paused' | 'pending';
  duration: string;
  nodeId: string;
}

type StepStatus = 'completed' | 'running' | 'paused' | 'pending';

export default function ModernTestingPanel({
  nodes,
  connections,
  isVisible,
  onClose,
  selectedNode
}: ModernTestingPanelProps) {
  // Execution state
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [scenario, setScenario] = useState("");
  const [steps, setSteps] = useState<ExecutionStep[]>([]);
  const [liveOutput, setLiveOutput] = useState("");
  const [totalDuration, setTotalDuration] = useState("0s");
  const [executionResults, setExecutionResults] = useState<any>(null);

  // Refs for execution control
  const executionStartTime = useRef<number>(0);
  const stepStartTime = useRef<number>(0);
  const executionInterval = useRef<NodeJS.Timeout | null>(null);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);

  // Initialize steps from nodes
  useEffect(() => {
    if (nodes.length > 0) {
      const initialSteps: ExecutionStep[] = nodes.map((node, index) => ({
        id: index,
        name: (node.data as any)?.title || node.id,
        type: getNodeType(node.type),
        status: 'pending' as StepStatus,
        duration: '0s',
        nodeId: node.id
      }));
      setSteps(initialSteps);
    }
  }, [nodes]);

  // Helper function to determine node type
  const getNodeType = (nodeType: string): 'agent' | 'tool' | 'template' | 'logic' => {
    if (nodeType.includes('agent')) return 'agent';
    if (nodeType.includes('tool')) return 'tool';
    if (nodeType.includes('template')) return 'template';
    return 'logic';
  };

  // Get step status based on current execution state
  const getStepStatus = useCallback((index: number): StepStatus => {
    if (index < currentStep) return "completed";
    if (index === currentStep && isRunning && !isPaused) return "running";
    if (index === currentStep && isPaused) return "paused";
    return "pending";
  }, [currentStep, isRunning, isPaused]);

  // Dynamic button text
  const getButtonText = useCallback(() => {
    if (!isRunning) return 'Run Test';
    return isPaused ? 'Resume' : 'Pause';
  }, [isRunning, isPaused]);

  // Progress percentage calculation
  const progressPercentage = steps.length > 0 ? (currentStep / steps.length) * 100 : 0;

  // Format duration helper
  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Update duration display
  const updateDuration = useCallback(() => {
    if (executionStartTime.current > 0) {
      const elapsed = Date.now() - executionStartTime.current;
      setTotalDuration(formatDuration(elapsed));
    }
  }, []);

  // Start execution
  const handlePlay = useCallback(async () => {
    if (nodes.length === 0) return;

    if (!isRunning) {
      // Start new execution
      setIsRunning(true);
      setIsPaused(false);
      setCurrentStep(0);
      setLiveOutput("");
      executionStartTime.current = Date.now();
      stepStartTime.current = Date.now();

      // Start duration timer
      durationInterval.current = setInterval(updateDuration, 100);

      // Reset all steps to pending
      setSteps(prev => prev.map(step => ({ ...step, status: 'pending', duration: '0s' })));

      try {
        // Add scenario to output if provided
        if (scenario.trim()) {
          setLiveOutput(`Testing Scenario: ${scenario}\n\n`);
        }

        // Start step-by-step execution
        await executeStepsSequentially();
      } catch (error) {
        console.error('Execution failed:', error);
        setLiveOutput(prev => prev + `\nError: ${error instanceof Error ? error.message : 'Unknown error'}`);
        handleReset();
      }
    } else if (isPaused) {
      // Resume execution
      setIsPaused(false);
      stepStartTime.current = Date.now();
      await continueExecution();
    } else {
      // Pause execution
      setIsPaused(true);
    }
  }, [nodes, isRunning, isPaused, scenario, currentStep]);

  // Execute steps sequentially
  const executeStepsSequentially = useCallback(async () => {
    for (let i = 0; i < steps.length; i++) {
      if (isPaused) break;

      setCurrentStep(i);
      stepStartTime.current = Date.now();

      // Update step status to running
      setSteps(prev => prev.map((step, index) => 
        index === i ? { ...step, status: 'running' } : step
      ));

      // Simulate step execution with live output
      setLiveOutput(prev => prev + `Executing ${steps[i].name}...\n`);

      // Execute the actual workflow for this step
      try {
        const stepResult = await executeStep(steps[i]);
        const stepDuration = formatDuration(Date.now() - stepStartTime.current);

        // Update step as completed
        setSteps(prev => prev.map((step, index) => 
          index === i ? { ...step, status: 'completed', duration: stepDuration } : step
        ));

        // Add result to output
        setLiveOutput(prev => prev + `✓ ${steps[i].name} completed (${stepDuration})\n`);
        
        // Add a small delay for visual feedback
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        const stepDuration = formatDuration(Date.now() - stepStartTime.current);
        setSteps(prev => prev.map((step, index) => 
          index === i ? { ...step, status: 'completed', duration: stepDuration } : step
        ));
        setLiveOutput(prev => prev + `✗ ${steps[i].name} failed (${stepDuration})\n`);
      }
    }

    // Complete execution
    if (!isPaused) {
      setCurrentStep(steps.length);
      setIsRunning(false);
      setLiveOutput(prev => prev + `\n✅ Workflow completed successfully!`);
      
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }
    }
  }, [steps, isPaused]);

  // Continue execution after pause
  const continueExecution = useCallback(async () => {
    await executeStepsSequentially();
  }, [executeStepsSequentially]);

  // Execute individual step using the actual workflow runner
  const executeStep = useCallback(async (step: ExecutionStep) => {
    // Find the corresponding node
    const node = nodes.find(n => n.id === step.nodeId);
    if (!node) throw new Error(`Node ${step.nodeId} not found`);

    try {
      // Execute the actual workflow for this single node
      // Note: This is a simplified approach - in a full implementation,
      // you would need to execute the workflow step-by-step
      const result = await runWorkflow(nodes, connections, node.id);
      return { success: true, output: result };
    } catch (error) {
      console.error(`Step execution failed for ${step.name}:`, error);
      throw error;
    }
  }, [nodes, connections]);

  // Reset execution
  const handleReset = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    setCurrentStep(0);
    setLiveOutput("");
    setTotalDuration("0s");
    setExecutionResults(null);
    executionStartTime.current = 0;

    if (executionInterval.current) {
      clearInterval(executionInterval.current);
      executionInterval.current = null;
    }

    if (durationInterval.current) {
      clearInterval(durationInterval.current);
      durationInterval.current = null;
    }

    // Reset all steps
    setSteps(prev => prev.map(step => ({ ...step, status: 'pending', duration: '0s' })));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (executionInterval.current) clearInterval(executionInterval.current);
      if (durationInterval.current) clearInterval(durationInterval.current);
    };
  }, []);

  // Render step status icon
  const renderStepIcon = (status: StepStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'running':
        return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'paused':
        return <Pause className="w-4 h-4 text-yellow-400" />;
      default:
        return <Circle className="w-4 h-4 text-slate-500" />;
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-slate-900 border-l border-slate-700 flex flex-col z-50">
      {/* Header Section */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Test Workflow</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={handlePlay}
            disabled={nodes.length === 0}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white rounded text-sm transition-colors"
          >
            {isRunning && !isPaused ? (
              <Pause className="w-3 h-3" />
            ) : (
              <Play className="w-3 h-3" />
            )}
            {getButtonText()}
          </button>
          
          <button
            onClick={handleReset}
            disabled={!isRunning && currentStep === 0}
            className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white rounded text-sm transition-colors"
          >
            <Square className="w-3 h-3" />
            Reset
          </button>
        </div>

        {/* Scenario Input */}
        <input
          type="text"
          value={scenario}
          onChange={(e) => setScenario(e.target.value)}
          placeholder="Describe what you're testing..."
          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Progress Section */}
      <div className="p-4 border-b border-slate-700">
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-slate-300 mb-2">
            <span>Progress</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Step List */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {steps.map((step, index) => {
            const status = getStepStatus(index);
            return (
              <div
                key={step.id}
                className={`flex items-center gap-3 p-2 rounded ${
                  status === 'completed' ? 'bg-green-900/20 border border-green-500/30' :
                  status === 'running' ? 'bg-blue-900/20 border border-blue-500/30' :
                  'bg-slate-800'
                }`}
              >
                {renderStepIcon(status)}
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">{step.name}</div>
                  <div className="text-xs text-slate-400">{step.type}</div>
                </div>
                <div className="text-xs text-slate-500">{step.duration}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Result Section */}
      <div className="flex-1 p-4 flex flex-col">
        <h3 className="text-sm font-medium text-white mb-3">Live Output</h3>
        
        {/* Output Container */}
        <div className="flex-1 bg-slate-800 rounded p-3 mb-4 overflow-y-auto">
          {liveOutput ? (
            <pre className="text-sm text-slate-100 whitespace-pre-wrap font-mono">
              {liveOutput}
            </pre>
          ) : (
            <div className="text-slate-400 text-sm">
              {isRunning ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                  Generating...
                </div>
              ) : (
                "Click 'Run Test' to start execution"
              )}
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-800 rounded p-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-400">Duration</span>
            </div>
            <div className="text-lg font-semibold text-white">{totalDuration}</div>
          </div>
          
          <div className="bg-slate-800 rounded p-3">
            <div className="flex items-center gap-2 mb-1">
              <Hash className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-400">Steps</span>
            </div>
            <div className="text-lg font-semibold text-white">
              {currentStep}/{steps.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
