/**
 * Execution Controls Component
 * 
 * Provides play/pause/step/reset buttons and speed control for workflow execution
 */

"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Square, 
  SkipForward,
  RotateCcw,
  Gauge
} from 'lucide-react';
import { ExecutionState } from '@/lib/execution/SteppableWorkflowRunner';

interface ExecutionControlsProps {
  executionState: ExecutionState;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  disabled?: boolean;
}

export const ExecutionControls: React.FC<ExecutionControlsProps> = ({
  executionState,
  onPlay,
  onPause,
  onStep,
  onReset,
  onSpeedChange,
  disabled = false
}) => {
  const { status, speed } = executionState;
  
  const isRunning = status === 'running';
  const isPaused = status === 'paused';
  const isCompleted = status === 'completed';
  const isError = status === 'error';
  const isIdle = status === 'idle';

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;
    
    switch (event.key) {
      case ' ':
        event.preventDefault();
        if (isRunning) {
          onPause();
        } else if (isPaused || isIdle) {
          onPlay();
        }
        break;
      case 'ArrowRight':
        event.preventDefault();
        if (isPaused) {
          onStep();
        }
        break;
      case 'r':
        if (event.metaKey || event.ctrlKey) {
          event.preventDefault();
          onReset();
        }
        break;
    }
  };

  const speedOptions = [0.25, 0.5, 1.0, 1.5, 2.0, 3.0, 5.0];

  return (
    <div 
      className="flex items-center gap-3 p-3 bg-white border-b border-gray-200"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Main Control Buttons */}
      <div className="flex items-center gap-2">
        {/* Play/Pause Button */}
        <motion.button
          onClick={isRunning ? onPause : onPlay}
          disabled={disabled || isCompleted}
          className={`
            flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200
            ${isRunning 
              ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700' 
              : 'bg-green-100 hover:bg-green-200 text-green-700'
            }
            ${disabled || isCompleted ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
          `}
          whileTap={{ scale: 0.95 }}
          title={isRunning ? 'Pause (Space)' : 'Play (Space)'}
        >
          {isRunning ? <Pause size={20} /> : <Play size={20} />}
        </motion.button>

        {/* Step Button */}
        <motion.button
          onClick={onStep}
          disabled={disabled || !isPaused}
          className={`
            flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200
            bg-blue-100 hover:bg-blue-200 text-blue-700
            ${disabled || !isPaused ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
          `}
          whileTap={{ scale: 0.95 }}
          title="Step Forward (→)"
        >
          <SkipForward size={20} />
        </motion.button>

        {/* Reset Button */}
        <motion.button
          onClick={onReset}
          disabled={disabled || isIdle}
          className={`
            flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200
            bg-gray-100 hover:bg-gray-200 text-gray-700
            ${disabled || isIdle ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
          `}
          whileTap={{ scale: 0.95 }}
          title="Reset (Cmd+R)"
        >
          <RotateCcw size={20} />
        </motion.button>
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-gray-300" />

      {/* Speed Control */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Gauge size={16} />
          <span>Speed:</span>
        </div>
        
        <select
          value={speed}
          onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
          disabled={disabled}
          className={`
            px-2 py-1 text-sm border border-gray-300 rounded-md bg-white
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {speedOptions.map(speedOption => (
            <option key={speedOption} value={speedOption}>
              {speedOption}x
            </option>
          ))}
        </select>
      </div>

      {/* Status Indicator */}
      <div className="flex items-center gap-2 ml-auto">
        <div className={`
          w-2 h-2 rounded-full animate-pulse
          ${isRunning ? 'bg-green-500' : ''}
          ${isPaused ? 'bg-yellow-500' : ''}
          ${isCompleted ? 'bg-blue-500' : ''}
          ${isError ? 'bg-red-500' : ''}
          ${isIdle ? 'bg-gray-400' : ''}
        `} />
        <span className="text-sm text-gray-600 capitalize">
          {status}
        </span>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="text-xs text-gray-400 ml-4">
        <div>Space: Play/Pause</div>
        <div>→: Step</div>
        <div>⌘R: Reset</div>
      </div>
    </div>
  );
};

export default ExecutionControls;
