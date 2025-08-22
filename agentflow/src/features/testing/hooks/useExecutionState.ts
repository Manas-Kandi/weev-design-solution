import { useState, useCallback } from 'react';
import { CanvasNode, Connection } from '@/types';
import { ExecutionContext, TestingEvent } from '@/lib/testing/events';
import { ExecutionHistoryManager } from '@/lib/testing/historyManager';
import { runWorkflowWithProperties } from '@/lib/workflowRunnerPropertiesDriven';
import { findStartNode } from '@/lib/utils/findStartNode';

export function useExecutionState(nodes: CanvasNode[], connections: Connection[]) {
  const [executionContext, setExecutionContext] = useState<ExecutionContext | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [expertMode, setExpertMode] = useState(false);

  const executeWorkflow = useCallback(async (inputMode: string, inputValue: string) => {
    const context: ExecutionContext = {
      sessionId: crypto.randomUUID(),
      startTime: Date.now(),
      inputMode: inputMode as any,
      inputValue,
      expertMode,
      events: []
    };

    setExecutionContext(context);
    setIsRunning(true);
    setCurrentStep(0);

    // Enhanced execution with reasoning extraction
    const result = await runWorkflowWithProperties(
      nodes,
      connections,
      findStartNode(nodes, connections),
      {},
      {
        emitTesterEvent: (event: any) => {
          const enhancedEvent: TestingEvent = {
            ...event,
            reasoning: event.reasoning || 'Processing...',
            properties: event.properties || {},
            inputs: event.inputs || {},
            technicalDetails: event.technicalDetails || {}
          };
          
          context.events.push(enhancedEvent);
          setCurrentStep(context.events.length);
          
          // Trigger re-render
          setExecutionContext({...context});
        }
      },
      {}, // testing options
      'basic' // user tier
    );

    setIsRunning(false);
    ExecutionHistoryManager.getInstance().saveExecution(context);
  }, [nodes, connections, expertMode]);

  return {
    executionContext,
    currentStep,
    isRunning,
    expertMode,
    setExpertMode,
    executeWorkflow
  };
}