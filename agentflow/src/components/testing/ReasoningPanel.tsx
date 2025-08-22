/**
 * Reasoning Panel Component
 * 
 * Displays live LLM interactions, prompts, and responses for debugging AI agent reasoning
 */

"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  MessageSquare, 
  ChevronDown, 
  ChevronRight,
  Copy,
  Check,
  Clock,
  Zap
} from 'lucide-react';
import { LLMInteractionEvent, ExecutionEventFormatter } from '@/lib/execution/events';

interface ReasoningPanelProps {
  llmInteractions: LLMInteractionEvent[];
  currentNodeId: string | null;
  className?: string;
}

interface LLMInteractionPair {
  request: LLMInteractionEvent;
  response?: LLMInteractionEvent;
  nodeId: string;
  timestamp: number;
}

export const ReasoningPanel: React.FC<ReasoningPanelProps> = ({
  llmInteractions,
  currentNodeId,
  className = ''
}) => {
  const [expandedInteractions, setExpandedInteractions] = useState<Set<string>>(new Set());
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Group interactions into request/response pairs
  const interactionPairs: LLMInteractionPair[] = [];
  const requestMap = new Map<string, LLMInteractionEvent>();

  llmInteractions.forEach(interaction => {
    if (interaction.type === 'llm_request') {
      requestMap.set(interaction.nodeId, interaction);
    } else if (interaction.type === 'llm_response') {
      const request = requestMap.get(interaction.nodeId);
      if (request) {
        interactionPairs.push({
          request,
          response: interaction,
          nodeId: interaction.nodeId,
          timestamp: request.timestamp
        });
        requestMap.delete(interaction.nodeId);
      }
    }
  });

  // Add any remaining requests without responses
  requestMap.forEach(request => {
    interactionPairs.push({
      request,
      nodeId: request.nodeId,
      timestamp: request.timestamp
    });
  });

  // Sort by timestamp
  interactionPairs.sort((a, b) => a.timestamp - b.timestamp);

  const toggleExpanded = (nodeId: string) => {
    const newExpanded = new Set(expandedInteractions);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedInteractions(newExpanded);
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(id);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  if (interactionPairs.length === 0) {
    return (
      <div className={`flex items-center justify-center h-40 text-gray-500 bg-white border border-gray-200 rounded-lg ${className}`}>
        <Brain size={20} className="mr-2" />
        <span>No LLM interactions yet</span>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
            <Brain size={16} />
            Live AI Reasoning
          </h3>
          <div className="text-xs text-gray-500">
            {interactionPairs.length} interaction{interactionPairs.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        <AnimatePresence>
          {interactionPairs.map((pair, index) => {
            const isExpanded = expandedInteractions.has(pair.nodeId);
            const isCurrentNode = pair.nodeId === currentNodeId;
            const hasResponse = !!pair.response;
            const duration = pair.response ? 
              pair.response.timestamp - pair.request.timestamp : null;

            return (
              <motion.div
                key={`${pair.nodeId}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`
                  border-b border-gray-100 last:border-b-0
                  ${isCurrentNode ? 'bg-blue-50' : 'hover:bg-gray-50'}
                  transition-colors duration-200
                `}
              >
                {/* Interaction Header */}
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => toggleExpanded(pair.nodeId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        <MessageSquare size={16} className="text-purple-600" />
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          Node: {pair.nodeId}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                          <Clock size={12} />
                          {new Date(pair.timestamp).toLocaleTimeString()}
                          {duration && (
                            <>
                              <span>•</span>
                              <Zap size={12} />
                              {ExecutionEventFormatter.formatDuration(duration)}
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {pair.request.data?.tokens && (
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                          {pair.request.data.tokens} tokens
                        </span>
                      )}
                      
                      <div className={`
                        w-2 h-2 rounded-full
                        ${hasResponse ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}
                      `} />
                      
                      <span className={`
                        text-xs px-2 py-1 rounded
                        ${hasResponse ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}
                      `}>
                        {hasResponse ? 'Complete' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-4">
                        {/* Request Section */}
                        <div className="bg-blue-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-blue-900">
                              LLM Request
                            </h4>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(
                                  pair.request.data?.prompt || '', 
                                  `request-${pair.nodeId}`
                                );
                              }}
                              className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                              title="Copy prompt"
                            >
                              {copiedText === `request-${pair.nodeId}` ? 
                                <Check size={14} /> : <Copy size={14} />
                              }
                            </button>
                          </div>
                          
                          {pair.request.data?.model && (
                            <div className="text-xs text-blue-700 mb-2">
                              Model: {pair.request.data.model}
                            </div>
                          )}
                          
                          <div className="text-sm text-gray-800 font-mono bg-white p-2 rounded border max-h-32 overflow-y-auto">
                            {pair.request.data?.prompt || 'No prompt available'}
                          </div>
                        </div>

                        {/* Response Section */}
                        {pair.response ? (
                          <div className="bg-green-50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-medium text-green-900">
                                LLM Response
                              </h4>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(
                                    pair.response?.data?.response || '', 
                                    `response-${pair.nodeId}`
                                  );
                                }}
                                className="p-1 text-green-600 hover:text-green-800 transition-colors"
                                title="Copy response"
                              >
                                {copiedText === `response-${pair.nodeId}` ? 
                                  <Check size={14} /> : <Copy size={14} />
                                }
                              </button>
                            </div>
                            
                            <div className="text-sm text-gray-800 font-mono bg-white p-2 rounded border max-h-32 overflow-y-auto">
                              {pair.response.data?.response || 'No response available'}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-yellow-50 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-yellow-800">
                              <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />
                              <span className="text-sm">Waiting for LLM response...</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ReasoningPanel;
