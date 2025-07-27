import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, User, Bot, Clock, AlertCircle, CheckCircle, TrendingUp, Send } from 'lucide-react';

interface Node {
  id: string;
  type: string;
  // Add other properties as needed
}

type Connection = object; // Replace empty interface with object type

interface ConversationTesterProps {
  nodes: Node[];
  connections: Connection[];
  onClose?: () => void;
}

interface TestMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  text: string;
  timestamp: Date;
  confidence?: number;
  processingTime?: number;
  nodeId?: string;
  metadata?: Record<string, unknown>;
}

interface TestMetrics {
  totalMessages: number;
  avgResponseTime: number;
  avgConfidence: number;
  escalations: number;
  errors: number;
}

export default function ConversationTester({ nodes, connections, onClose }: ConversationTesterProps) {
  const [messages, setMessages] = useState<TestMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [currentNodePath, setCurrentNodePath] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<TestMetrics>({
    totalMessages: 0,
    avgResponseTime: 0,
    avgConfidence: 0,
    escalations: 0,
    errors: 0
  });
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const testScenarios = [
    {
      id: 'happy-path',
      name: 'Happy Path',
      description: 'Standard successful interaction',
      messages: [
        "Hi, I'd like to check my order status",
        "My order number is 12345",
        "Thank you!"
      ]
    },
    {
      id: 'frustrated',
      name: 'Frustrated Customer',
      description: 'Tests empathy and escalation',
      messages: [
        "This is the third time I'm calling about this!",
        "Your service is terrible",
        "I want to speak to a manager NOW"
      ]
    },
    {
      id: 'technical',
      name: 'Technical Support',
      description: 'Complex technical inquiry',
      messages: [
        "My integration is throwing a 401 error",
        "I've checked my API keys and they're correct",
        "Can you help me debug this?"
      ]
    },
    {
      id: 'edge-case',
      name: 'Edge Cases',
      description: 'Unusual requests and edge cases',
      messages: [
        "🦄💫✨",
        "Can you write me a haiku about customer service?",
        "What's the meaning of life?"
      ]
    }
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const simulateAgentResponse = async (userMessage: string, currentNode: Node) => {
    const startTime = Date.now();
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
    
    const processingTime = Date.now() - startTime;
    const confidence = 0.7 + Math.random() * 0.3;
    
    // Simulate different response types based on message content
    let responseText = "I understand your concern. Let me help you with that.";
    let nextNodeId = null;
    
    if (userMessage.toLowerCase().includes('manager') || userMessage.toLowerCase().includes('escalate')) {
      responseText = "I understand you'd like to speak with a manager. Let me connect you with someone who can better assist you.";
      nextNodeId = 'escalation';
      setMetrics(prev => ({ ...prev, escalations: prev.escalations + 1 }));
    } else if (userMessage.toLowerCase().includes('order')) {
      responseText = "I'd be happy to help you check your order status. Could you please provide your order number?";
    } else if (userMessage.toLowerCase().includes('error') || userMessage.toLowerCase().includes('401')) {
      responseText = "I see you're experiencing a 401 authentication error. This typically means there's an issue with your API credentials. Let me guide you through troubleshooting this.";
    }
    
    return {
      text: responseText,
      confidence,
      processingTime,
      nextNodeId
    };
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !isRunning) return;
    
    const userMessage: TestMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputText,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    
    // Find the current active node (simplified - in real implementation, follow the actual flow)
    const currentNode = nodes.find(n => n.type === 'agent') || nodes[0];
    
    try {
      const response = await simulateAgentResponse(userMessage.text, currentNode);
      
      const agentMessage: TestMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: response.text,
        timestamp: new Date(),
        confidence: response.confidence,
        processingTime: response.processingTime,
        nodeId: currentNode?.id
      };
      
      setMessages(prev => [...prev, agentMessage]);
      
      // Update metrics
      setMetrics(prev => ({
        ...prev,
        totalMessages: prev.totalMessages + 2,
        avgResponseTime: (prev.avgResponseTime * (prev.totalMessages / 2) + response.processingTime) / ((prev.totalMessages / 2) + 1),
        avgConfidence: (prev.avgConfidence * (prev.totalMessages / 2) + response.confidence) / ((prev.totalMessages / 2) + 1)
      }));
      
      if (response.nextNodeId) {
        if (response.nextNodeId) {
          if (response.nextNodeId) {
            setCurrentNodePath(prev => [...prev, response.nextNodeId as string]);
          }
        }
      }
    } catch (error) {
      const errorMessage: TestMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'system',
        text: 'Error: Failed to process message',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setMetrics(prev => ({ ...prev, errors: prev.errors + 1 }));
    }
  };

  const runScenario = async (scenario: typeof testScenarios[0]) => {
    setSelectedScenario(scenario.id);
    setMessages([]);
    setMetrics({
      totalMessages: 0,
      avgResponseTime: 0,
      avgConfidence: 0,
      escalations: 0,
      errors: 0
    });
    
    for (const message of scenario.messages) {
      setInputText(message);
      await new Promise(resolve => setTimeout(resolve, 1500));
      await sendMessage();
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  };

  const reset = () => {
    setMessages([]);
    setInputText('');
    setCurrentNodePath([]);
    setMetrics({
      totalMessages: 0,
      avgResponseTime: 0,
      avgConfidence: 0,
      escalations: 0,
      errors: 0
    });
    setSelectedScenario('');
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex overflow-hidden">
        {/* Left Panel - Test Scenarios */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-2">Conversation Tester</h2>
            <p className="text-sm text-gray-400">Test your agent flows with realistic scenarios</p>
          </div>
          
          <div className="p-6 space-y-4 flex-1 overflow-y-auto">
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isRunning
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Stop Testing
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Start Testing
                  </>
                )}
              </button>
              <button
                onClick={reset}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4 text-gray-300" />
              </button>
            </div>

            <div>
              <h3 className="font-medium text-white mb-3">Test Scenarios</h3>
              <div className="space-y-2">
                {testScenarios.map(scenario => (
                  <button
                    key={scenario.id}
                    onClick={() => runScenario(scenario)}
                    disabled={!isRunning}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedScenario === scenario.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    } ${!isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="font-medium text-sm">{scenario.name}</div>
                    <div className="text-xs mt-1 opacity-80">{scenario.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-700">
              <h3 className="font-medium text-white mb-3">Metrics</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Messages</span>
                  <span className="text-white font-medium">{metrics.totalMessages}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Avg Response Time</span>
                  <span className="text-white font-medium">{metrics.avgResponseTime.toFixed(0)}ms</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Avg Confidence</span>
                  <span className="text-white font-medium">{(metrics.avgConfidence * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Escalations</span>
                  <span className="text-yellow-400 font-medium">{metrics.escalations}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Errors</span>
                  <span className="text-red-400 font-medium">{metrics.errors}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Chat Interface */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-700 flex items-center justify-between bg-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-white font-medium">Test Conversation</span>
              {currentNodePath.length > 0 && (
                <span className="text-xs text-gray-400">
                  Path: {currentNodePath.join(' → ')}
                </span>
              )}
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] ${message.sender === 'system' ? 'w-full' : ''}`}>
                  {message.sender === 'system' ? (
                    <div className="flex items-center gap-2 text-yellow-400 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      {message.text}
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {message.sender === 'user' ? (
                          <User className="w-4 h-4 text-blue-400" />
                        ) : (
                          <Bot className="w-4 h-4 text-green-400" />
                        )}
                        <span className="text-xs text-gray-400">
                          {message.sender === 'user' ? 'User' : `Agent${message.nodeId ? ` (${message.nodeId})` : ''}`}
                        </span>
                        {message.processingTime && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {message.processingTime}ms
                          </span>
                        )}
                        {message.confidence && (
                          <span className={`text-xs ${message.confidence > 0.8 ? 'text-green-400' : 'text-yellow-400'}`}>
                            {(message.confidence * 100).toFixed(0)}% confident
                          </span>
                        )}
                      </div>
                      <div
                        className={`rounded-lg px-4 py-2 ${
                          message.sender === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-100'
                        }`}
                      >
                        {message.text}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-700 bg-gray-800">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                disabled={!isRunning}
                placeholder={isRunning ? "Type a message..." : "Start testing to send messages"}
                className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={!isRunning || !inputText.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
