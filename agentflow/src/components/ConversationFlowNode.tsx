import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, GitBranch, Trash2, Edit2, ChevronRight, User, Bot } from 'lucide-react';

interface ConversationNodeData {
  messages: ConversationMessage[];
  outputCount: number;
  [key: string]: unknown;
}

interface ConversationNode {
  id: string;
  position: { x: number; y: number };
  data: ConversationNodeData;
}

interface ConversationFlowNodeProps {
  node: ConversationNode;
  isSelected: boolean;
  onNodeMouseDown: (e: React.MouseEvent, nodeId: string) => void;
  onNodeClick: (e: React.MouseEvent, nodeId: string) => void;
  onNodeUpdate: (node: ConversationNode) => void;
  onPortMouseDown: (e: React.MouseEvent, nodeId: string, outputId: string, index: number) => void;
  theme: object;
}

interface ConversationBranch {
  id: string;
  condition: string;
  label: string;
  outputId: string;
  color: string;
}

interface ConversationMessage {
  id: string;
  type: 'user' | 'agent';
  text: string;
  branches?: ConversationBranch[];
}

export default function ConversationFlowNode({
  node,
  isSelected,
  onNodeMouseDown,
  onNodeClick,
  onNodeUpdate,
  onPortMouseDown,
  theme
}: ConversationFlowNodeProps) {
  const [messages, setMessages] = useState<ConversationMessage[]>([
    {
      id: '1',
      type: 'user',
      text: 'Hello, I need help with my order',
      branches: []
    },
    {
      id: '2', 
      type: 'agent',
      text: 'I\'d be happy to help! Can you tell me more about your issue?',
      branches: [
        { id: 'b1', condition: 'refund', label: 'Refund Request', outputId: 'refund-flow', color: '#ff6b6b' },
        { id: 'b2', condition: 'tracking', label: 'Order Tracking', outputId: 'tracking-flow', color: '#4ecdc4' },
        { id: 'b3', condition: 'other', label: 'Other Issue', outputId: 'other-flow', color: '#45b7d1' }
      ]
    }
  ]);
  
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showBranchMenu, setShowBranchMenu] = useState<string | null>(null);

  useEffect(() => {
    // Update node data when messages change
    onNodeUpdate({
      ...node,
      data: {
        ...node.data,
        messages,
        outputCount: messages.reduce((acc, msg) => acc + (msg.branches?.length || 0), 0)
      }
    });
  }, [messages]);

  const addMessage = (type: 'user' | 'agent') => {
    const newMessage: ConversationMessage = {
      id: Date.now().toString(),
      type,
      text: type === 'user' ? 'User message...' : 'Agent response...',
      branches: type === 'agent' ? [] : undefined
    };
    setMessages([...messages, newMessage]);
  };

  const updateMessage = (id: string, text: string) => {
    setMessages(messages.map(msg => 
      msg.id === id ? { ...msg, text } : msg
    ));
    setEditingMessage(null);
    setEditText('');
  };

  const deleteMessage = (id: string) => {
    setMessages(messages.filter(msg => msg.id !== id));
  };

  const addBranch = (messageId: string) => {
    const branchColors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f7b731', '#5f27cd'];
    setMessages(messages.map(msg => {
      if (msg.id === messageId && msg.branches) {
        const newBranch: ConversationBranch = {
          id: Date.now().toString(),
          condition: 'condition',
          label: 'New Branch',
          outputId: `branch-${Date.now()}`,
          color: branchColors[msg.branches.length % branchColors.length]
        };
        return { ...msg, branches: [...msg.branches, newBranch] };
      }
      return msg;
    }));
  };

  const updateBranch = (messageId: string, branchId: string, label: string) => {
    setMessages(messages.map(msg => {
      if (msg.id === messageId && msg.branches) {
        return {
          ...msg,
          branches: msg.branches.map(branch =>
            branch.id === branchId ? { ...branch, label } : branch
          )
        };
      }
      return msg;
    }));
  };

  const deleteBranch = (messageId: string, branchId: string) => {
    setMessages(messages.map(msg => {
      if (msg.id === messageId && msg.branches) {
        return {
          ...msg,
          branches: msg.branches.filter(branch => branch.id !== branchId)
        };
      }
      return msg;
    }));
  };

  return (
    <div
      className={`absolute bg-gray-900 border-2 rounded-lg overflow-hidden transition-all ${
        isSelected ? 'ring-2 ring-blue-400 shadow-2xl' : 'shadow-lg'
      }`}
      style={{
        left: node.position.x,
        top: node.position.y,
        width: 400,
        minHeight: 300,
        borderColor: isSelected ? '#3b82f6' : '#374151',
        zIndex: isSelected ? 10 : 5
      }}
      onMouseDown={(e) => onNodeMouseDown(e, node.id)}
      onClick={(e) => onNodeClick(e, node.id)}
    >
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-400" />
          <span className="font-medium text-white">Conversation Flow</span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); addMessage('user'); }}
            className="p-1.5 hover:bg-gray-700 rounded transition-colors"
            title="Add user message"
          >
            <User className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); addMessage('agent'); }}
            className="p-1.5 hover:bg-gray-700 rounded transition-colors"
            title="Add agent response"
          >
            <Bot className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
        {messages.map((message, index) => (
          <div key={message.id} className="relative group">
            {/* Connection Line */}
            {index > 0 && (
              <div className="absolute -top-3 left-6 w-0.5 h-3 bg-gray-600" />
            )}

            {/* Message Bubble */}
            <div className={`flex ${message.type === 'user' ? 'justify-start' : 'justify-end'}`}>
              <div
                className={`relative max-w-[80%] rounded-lg px-4 py-2 ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-100'
                }`}
              >
                {/* Message Icon */}
                <div className={`absolute -left-3 top-2 w-6 h-6 rounded-full flex items-center justify-center ${
                  message.type === 'user' ? 'bg-blue-500' : 'bg-gray-600'
                }`}>
                  {message.type === 'user' ? (
                    <User className="w-3 h-3 text-white" />
                  ) : (
                    <Bot className="w-3 h-3 text-white" />
                  )}
                </div>

                {/* Message Text */}
                {editingMessage === message.id ? (
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onBlur={() => updateMessage(message.id, editText)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') updateMessage(message.id, editText);
                      if (e.key === 'Escape') setEditingMessage(null);
                    }}
                    className="bg-transparent border-b border-gray-400 outline-none w-full"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div className="text-sm">{message.text}</div>
                )}

                {/* Message Actions */}
                <div className="absolute -right-2 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingMessage(message.id);
                      setEditText(message.text);
                    }}
                    className="p-1 bg-gray-800 rounded hover:bg-gray-700 transition-colors"
                  >
                    <Edit2 className="w-3 h-3 text-gray-400" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMessage(message.id);
                    }}
                    className="p-1 bg-gray-800 rounded hover:bg-red-600 transition-colors"
                  >
                    <Trash2 className="w-3 h-3 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* Branches for Agent Messages */}
            {message.type === 'agent' && message.branches && (
              <div className="mt-2 ml-8 space-y-1">
                {message.branches.map((branch, branchIndex) => (
                  <div key={branch.id} className="flex items-center gap-2 group/branch">
                    <GitBranch className="w-4 h-4 text-gray-500" />
                    <div
                      className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-600 hover:border-gray-500 transition-colors"
                      style={{ borderLeftColor: branch.color, borderLeftWidth: 3 }}
                    >
                      {editingMessage === `branch-${branch.id}` ? (
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onBlur={() => {
                            updateBranch(message.id, branch.id, editText);
                            setEditingMessage(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updateBranch(message.id, branch.id, editText);
                              setEditingMessage(null);
                            }
                            if (e.key === 'Escape') setEditingMessage(null);
                          }}
                          className="bg-transparent outline-none text-sm text-gray-300 flex-1"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="text-sm text-gray-300 flex-1">{branch.label}</span>
                      )}
                      
                      {/* Branch Actions */}
                      <div className="opacity-0 group-hover/branch:opacity-100 transition-opacity flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingMessage(`branch-${branch.id}`);
                            setEditText(branch.label);
                          }}
                          className="p-0.5 hover:bg-gray-700 rounded"
                        >
                          <Edit2 className="w-3 h-3 text-gray-400" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteBranch(message.id, branch.id);
                          }}
                          className="p-0.5 hover:bg-red-600 rounded"
                        >
                          <Trash2 className="w-3 h-3 text-gray-400" />
                        </button>
                      </div>

                      {/* Output Port */}
                      <div
                        className="absolute -right-3 w-3 h-3 rounded-full border-2 cursor-pointer hover:scale-125 transition-transform"
                        style={{
                          backgroundColor: branch.color,
                          borderColor: branch.color,
                          top: '50%',
                          transform: 'translateY(-50%)'
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          onPortMouseDown(e, node.id, branch.outputId, branchIndex);
                        }}
                        title={`${branch.label} output`}
                      />
                    </div>
                  </div>
                ))}
                
                {/* Add Branch Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addBranch(message.id);
                  }}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-gray-300 hover:bg-gray-800 rounded transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Add branch
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Default Output Port */}
      <div
        className="absolute -right-3 top-1/2 w-3 h-3 rounded-full border-2 cursor-pointer hover:scale-125 transition-transform bg-gray-600"
        style={{
          borderColor: '#6b7280',
          transform: 'translateY(-50%)'
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          onPortMouseDown(e, node.id, 'default', 0);
        }}
        title="Default output"
      />
    </div>
  );
}
