import React from 'react';
import { CanvasNode, Connection } from '@/types';
import { useExecutionState } from './hooks/useExecutionState';
import { useExecutionHistory } from './hooks/useExecutionHistory';
import { useStepExpansion } from './hooks/useStepExpansion';
import { TestingPanelHeader } from './components/TestingPanelHeader';
import { ExecutionProgress } from './components/ExecutionProgress';
import { ExecutionSteps } from './components/ExecutionSteps';
import { ExecutionHistory } from './components/ExecutionHistory';

interface ModernTestingPanelProps {
  nodes: CanvasNode[];
  connections: Connection[];
  isVisible: boolean;
  onClose: () => void;
}

export function ModernTestingPanel({ 
  nodes, 
  connections, 
  isVisible, 
  onClose 
}: ModernTestingPanelProps) {
  const {
    executionContext,
    currentStep,
    isRunning,
    expertMode,
    setExpertMode,
    executeWorkflow
  } = useExecutionState(nodes, connections);

  const {
    historyVisible,
    setHistoryVisible,
    executionHistory
  } = useExecutionHistory();

  const {
    expandedStep,
    toggleStep
  } = useStepExpansion();

  return (
    <div className="w-96 h-screen bg-gray-950 border-l border-gray-800 flex flex-col">
      <TestingPanelHeader
        onExecute={executeWorkflow}
        isRunning={isRunning}
        expertMode={expertMode}
        onExpertModeChange={setExpertMode}
        historyVisible={historyVisible}
        onHistoryToggle={setHistoryVisible}
        onClose={onClose}
      />
      
      <div className="flex-1 overflow-hidden">
        {historyVisible ? (
          <ExecutionHistory 
            history={executionHistory}
            expertMode={expertMode}
          />
        ) : (
          <>
            {executionContext && (
              <ExecutionProgress
                context={executionContext}
                currentStep={currentStep}
                isRunning={isRunning}
                expertMode={expertMode}
              />
            )}
            
            <ExecutionSteps
              context={executionContext}
              expandedStep={expandedStep}
              onToggleStep={toggleStep}
              expertMode={expertMode}
            />
          </>
        )}
      </div>
    </div>
  );
}