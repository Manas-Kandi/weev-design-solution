import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, GitBranch, Trash2, Edit2, ChevronRight, User, Bot } from 'lucide-react';
import {
  figmaNodeStyle,
  selectedNodeStyle,
  hoverNodeStyle
} from './nodeStyles';

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
  const [isHovered, setIsHovered] = useState(false);

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

  // UI/UX ENHANCEMENTS FOR HYPER-MINIMAL DARK THEME
  // - Use less rounded corners (borderRadius: 4px)
  // - Sleek, modern, VS Code-inspired
  // - Consistent dark colors, subtle borders, minimal shadows
  // - Remove excessive padding, use tight spacing
  // - Use subtle hover/focus effects
  // - Use monospace font for message bubbles for a professional feel

  const nodeStyle: React.CSSProperties = {
    ...figmaNodeStyle,
    left: node.position.x,
    top: node.position.y,
    width: 400,
    minHeight: 300,
    borderColor: isSelected ? 'var(--figma-accent)' : 'var(--figma-border)',
    zIndex: isSelected ? 10 : 5,
    fontFamily: 'Inter, Menlo, monospace',
    ...(isHovered ? hoverNodeStyle : {}),
    ...(isSelected ? selectedNodeStyle : {})
  };

  return (
    <div
      className="absolute overflow-hidden transition-all"
      style={nodeStyle}
      onMouseDown={(e) => onNodeMouseDown(e, node.id)}
      onClick={(e) => onNodeClick(e, node.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="bg-[#23232a] px-3 py-2 flex items-center justify-between border-b border-[#23232a]">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-500" />
          <span className="font-medium text-white text-sm tracking-tight">Conversation Flow</span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); addMessage('user'); }}
            className="p-1 hover:bg-[#23232a] rounded transition-colors"
            title="Add user message"
            style={{ borderRadius: 4 }}
          >
            <User className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); addMessage('agent'); }}
            className="p-1 hover:bg-[#23232a] rounded transition-colors"
            title="Add agent response"
            style={{ borderRadius: 4 }}
          >
            <Bot className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="p-3 space-y-2 max-h-[500px] overflow-y-auto figma-scrollbar">
        {messages.map((message, index) => (
          <div key={message.id} className="relative group">
            {/* Connection Line */}
            {index > 0 && (
              <div className="absolute -top-2 left-6 w-0.5 h-2 bg-[#23232a]" />
            )}

            {/* Message Bubble */}
            <div className={`flex ${message.type === 'user' ? 'justify-start' : 'justify-end'}`}> 
              <div
                className={`relative max-w-[80%] px-3 py-1 text-xs font-mono tracking-tight ${
                  message.type === 'user'
                    ? 'bg-blue-700 text-white'
                    : 'bg-[#23232a] text-gray-200'
                }`}
                style={{ borderRadius: 4, boxShadow: 'none' }}
              >
                {/* Message Icon */}
                <div className={`absolute -left-3 top-1 w-6 h-6 flex items-center justify-center ${
                  message.type === 'user' ? 'bg-blue-600' : 'bg-[#23232a]'
                }`} style={{ borderRadius: 4 }}>
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
                    className="bg-transparent border-b border-gray-500 outline-none w-full text-xs font-mono"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                    style={{ borderRadius: 4 }}
                  />
                ) : (
                  <div className="text-xs font-mono">{message.text}</div>
                )}

                {/* Message Actions */}
                <div className="absolute -right-2 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingMessage(message.id);
                      setEditText(message.text);
                    }}
                    className="p-1 bg-[#23232a] rounded hover:bg-[#18181b] transition-colors"
                    style={{ borderRadius: 4 }}
                  >
                    <Edit2 className="w-3 h-3 text-gray-400" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMessage(message.id);
                    }}
                    className="p-1 bg-[#23232a] rounded hover:bg-red-700 transition-colors"
                    style={{ borderRadius: 4 }}
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
                      className="flex-1 flex items-center gap-2 px-2 py-1 rounded border border-[#23232a] hover:border-blue-500 transition-colors"
                      style={{ borderLeftColor: branch.color, borderLeftWidth: 3, borderRadius: 4 }}
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
                          className="bg-transparent outline-none text-xs font-mono flex-1"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                          style={{ borderRadius: 4 }}
                        />
                      ) : (
                        <span className="text-xs font-mono flex-1">{branch.label}</span>
                      )}
                      {/* Branch Actions */}
                      <div className="opacity-0 group-hover/branch:opacity-100 transition-opacity flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingMessage(`branch-${branch.id}`);
                            setEditText(branch.label);
                          }}
                          className="p-0.5 hover:bg-[#23232a] rounded"
                          style={{ borderRadius: 4 }}
                        >
                          <Edit2 className="w-3 h-3 text-gray-400" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteBranch(message.id, branch.id);
                          }}
                          className="p-0.5 hover:bg-red-700 rounded"
                          style={{ borderRadius: 4 }}
                        >
                          <Trash2 className="w-3 h-3 text-gray-400" />
                        </button>
                      </div>
                      {/* Output Port */}
                      <div
                        className="absolute -right-3 w-3 h-3 rounded border-2 cursor-pointer hover:scale-125 transition-transform"
                        style={{
                          backgroundColor: branch.color,
                          borderColor: branch.color,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          borderRadius: 4
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
                  className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-gray-300 hover:bg-[#23232a] rounded transition-colors"
                  style={{ borderRadius: 4 }}
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
        className="absolute -right-3 top-1/2 w-3 h-3 rounded border-2 cursor-pointer hover:scale-125 transition-transform bg-[#23232a]"
        style={{
          borderColor: '#23232a',
          transform: 'translateY(-50%)',
          borderRadius: 4
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
