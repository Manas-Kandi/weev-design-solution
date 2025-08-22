/**
 * Execution Timeline Component
 * 
 * Visual timeline showing execution order with click-to-jump functionality
 */

"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Play, CheckCircle, AlertCircle, Pause } from 'lucide-react';
import { ExecutionStep } from '@/lib/execution/SteppableWorkflowRunner';
import { ExecutionEventFormatter } from '@/lib/execution/events';

interface ExecutionTimelineProps {
  steps: ExecutionStep[];
  currentNodeId: string | null;
  onJumpToStep: (stepIndex: number) => void;
  className?: string;
}

export const ExecutionTimeline: React.FC<ExecutionTimelineProps> = ({
  steps,
  currentNodeId,
  onJumpToStep,
  className = ''
}) => {
  if (steps.length === 0) {
    return (
      <div className={`flex items-center justify-center h-20 text-gray-500 ${className}`}>
        <Clock size={16} className="mr-2" />
        <span>No execution steps yet</span>
      </div>
    );
  }

  const totalDuration = steps.reduce((sum, step) => sum + (step.duration || 0), 0);
  const startTime = steps[0]?.timestamp || Date.now();

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900">Execution Timeline</h3>
        <div className="text-xs text-gray-500">
          Total: {ExecutionEventFormatter.formatDuration(totalDuration)}
        </div>
      </div>

      {/* Timeline Container */}
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

        {/* Timeline Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => {
            const isCurrentNode = step.nodeId === currentNodeId;
            const relativeTime = step.timestamp - startTime;
            
            return (
              <motion.div
                key={`${step.nodeId}-${index}`}
                className={`
                  relative flex items-center cursor-pointer group
                  ${isCurrentNode ? 'bg-blue-50 rounded-lg p-2 -m-2' : ''}
                `}
                onClick={() => onJumpToStep(index)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Timeline Dot */}
                <div className={`
                  relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2
                  ${step.status === 'completed' ? 'bg-green-100 border-green-300' : ''}
                  ${step.status === 'error' ? 'bg-red-100 border-red-300' : ''}
                  ${step.status === 'executing' ? 'bg-blue-100 border-blue-300' : ''}
                  ${step.status === 'queued' ? 'bg-gray-100 border-gray-300' : ''}
                  ${isCurrentNode ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                  group-hover:scale-110 transition-transform duration-200
                `}>
                  {step.status === 'completed' && <CheckCircle size={20} className="text-green-600" />}
                  {step.status === 'error' && <AlertCircle size={20} className="text-red-600" />}
                  {step.status === 'executing' && <Play size={20} className="text-blue-600" />}
                  {step.status === 'queued' && <Pause size={20} className="text-gray-600" />}
                </div>

                {/* Step Content */}
                <div className="ml-4 flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {(step.node.data as any)?.title || step.nodeId}
                      </h4>
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                        {step.node.type}
                        {step.node.subtype && ` • ${step.node.subtype}`}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>+{ExecutionEventFormatter.formatDuration(relativeTime)}</span>
                      {step.duration && (
                        <span className="px-2 py-1 bg-gray-100 rounded">
                          {ExecutionEventFormatter.formatDuration(step.duration)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Step Details */}
                  <div className="mt-1 text-xs text-gray-600">
                    {step.status === 'completed' && (
                      <span className="text-green-600">✓ Completed successfully</span>
                    )}
                    {step.status === 'error' && (
                      <span className="text-red-600">✗ {step.error?.message || 'Execution failed'}</span>
                    )}
                    {step.status === 'executing' && (
                      <span className="text-blue-600">⟳ Currently executing...</span>
                    )}
                    {step.status === 'queued' && (
                      <span className="text-gray-600">⏸ Queued for execution</span>
                    )}
                  </div>

                  {/* Input/Output Preview */}
                  {(Object.keys(step.inputData).length > 0 || step.output) && (
                    <div className="mt-2 space-y-1">
                      {Object.keys(step.inputData).length > 0 && (
                        <div className="text-xs">
                          <span className="text-gray-500">Input:</span>
                          <span className="ml-1 text-gray-700 font-mono">
                            {JSON.stringify(step.inputData).substring(0, 50)}
                            {JSON.stringify(step.inputData).length > 50 ? '...' : ''}
                          </span>
                        </div>
                      )}
                      {step.output && (
                        <div className="text-xs">
                          <span className="text-gray-500">Output:</span>
                          <span className="ml-1 text-gray-700 font-mono">
                            {JSON.stringify(step.output).substring(0, 50)}
                            {JSON.stringify(step.output).length > 50 ? '...' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Hover Actions */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onJumpToStep(index);
                    }}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    Jump Here
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Current Position Indicator */}
        {currentNodeId && (
          <motion.div
            className="absolute left-5 w-2 h-2 bg-blue-500 rounded-full shadow-lg"
            style={{
              top: `${steps.findIndex(s => s.nodeId === currentNodeId) * 80 + 20}px`
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
      </div>

      {/* Timeline Scrubber */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span>0ms</span>
          <span>{ExecutionEventFormatter.formatDuration(totalDuration)}</span>
        </div>
        
        <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
          {steps.map((step, index) => {
            const stepDuration = step.duration || 0;
            const stepWidth = totalDuration > 0 ? (stepDuration / totalDuration) * 100 : 0;
            const stepOffset = totalDuration > 0 ? 
              (steps.slice(0, index).reduce((sum, s) => sum + (s.duration || 0), 0) / totalDuration) * 100 : 0;

            return (
              <div
                key={`scrubber-${step.nodeId}-${index}`}
                className={`
                  absolute top-0 h-full cursor-pointer
                  ${step.status === 'completed' ? 'bg-green-400' : ''}
                  ${step.status === 'error' ? 'bg-red-400' : ''}
                  ${step.status === 'executing' ? 'bg-blue-400' : ''}
                  ${step.status === 'queued' ? 'bg-gray-400' : ''}
                  hover:opacity-80 transition-opacity duration-200
                `}
                style={{
                  left: `${stepOffset}%`,
                  width: `${stepWidth}%`
                }}
                onClick={() => onJumpToStep(index)}
                title={`${(step.node.data as any)?.title || step.nodeId} (${ExecutionEventFormatter.formatDuration(stepDuration)})`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ExecutionTimeline;
