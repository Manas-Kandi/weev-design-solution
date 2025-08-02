import React, { useState } from 'react';
import { Sparkles, Brain, Heart, Zap, Shield, AlertTriangle, MessageSquare, Gauge } from 'lucide-react';
import { AgentNodeData, PersonalityTrait, BehaviorRule } from '@/types';

interface AgentNode {
  data: AgentNodeData;
  // Add other properties as needed
}

interface AgentConfigProps {
  node: AgentNode;
  onUpdate: (data: AgentNodeData) => void;
}

export default function EnhancedAgentConfig({ node, onUpdate }: AgentConfigProps) {
  const [activeTab, setActiveTab] = useState<'personality' | 'behavior' | 'knowledge' | 'testing'>('personality');
  
  const [personalityTraits, setPersonalityTraits] = useState<PersonalityTrait[]>([
    { id: 'friendliness', name: 'Friendliness', icon: Heart, value: 70, color: '#ef4444', description: 'How warm and approachable the agent is' },
    { id: 'formality', name: 'Formality', icon: Shield, value: 40, color: '#3b82f6', description: 'Professional vs casual communication style' },
    { id: 'creativity', name: 'Creativity', icon: Sparkles, value: 60, color: '#8b5cf6', description: 'How creative and imaginative responses are' },
    { id: 'assertiveness', name: 'Assertiveness', icon: Zap, value: 50, color: '#f59e0b', description: 'How confident and direct the agent is' },
    { id: 'empathy', name: 'Empathy', icon: Brain, value: 80, color: '#10b981', description: 'Understanding and emotional intelligence' }
  ]);

  const [behaviorRules, setBehaviorRules] = useState<BehaviorRule[]>([
    { id: '1', trigger: 'User expresses frustration', action: 'Acknowledge feelings and offer immediate help', enabled: true },
    { id: '2', trigger: 'Confidence < 70%', action: 'Suggest escalation to human agent', enabled: true },
    { id: '3', trigger: 'User asks for manager', action: 'Initiate handoff protocol', enabled: true },
    { id: '4', trigger: 'Detect technical issue', action: 'Switch to technical support mode', enabled: false }
  ]);

  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(150);

  // Load initial state from node.data
  React.useEffect(() => {
    if (node.data.personalityTraits) setPersonalityTraits(node.data.personalityTraits);
    if (node.data.behaviorRules) setBehaviorRules(node.data.behaviorRules);
    if (node.data.knowledge) setKnowledge(node.data.knowledge);
  }, [node.data]);

  // Knowledge state
  const [knowledge, setKnowledge] = useState(node.data.knowledge || "");

  const updateTrait = (traitId: string, value: number) => {
    const updated = personalityTraits.map(trait =>
      trait.id === traitId ? { ...trait, value } : trait
    );
    setPersonalityTraits(updated);
    onUpdate({
      ...node.data,
      personalityTraits: updated
    });
  };

  const addBehaviorRule = () => {
    const newRule = {
      id: Date.now().toString(),
      trigger: 'New trigger condition',
      action: 'Action to take',
      enabled: true
    };
    setBehaviorRules([...behaviorRules, newRule]);
  };

  const generatePersonalityPrompt = () => {
    const traits = personalityTraits.map(trait => {
      const level = trait.value > 70 ? 'very' : trait.value > 40 ? 'moderately' : 'slightly';
      return `${level} ${trait.name.toLowerCase()}`;
    }).join(', ');

    return `You are an AI assistant with the following personality traits: ${traits}. Adjust your responses accordingly while maintaining helpfulness and accuracy.`;
  };

  // Update behavior rules handler
  const updateBehaviorRules = (rules: BehaviorRule[]) => {
    setBehaviorRules(rules);
    onUpdate({
      ...node.data,
      behaviorRules: rules
    });
  };

  // Update knowledge handler
  const updateKnowledge = (value: string) => {
    setKnowledge(value);
    onUpdate({
      ...node.data,
      knowledge: value
    });
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#18181b] border border-[#23232a] overflow-hidden" style={{ borderRadius: 4, fontFamily: 'Inter, Menlo, monospace' }}>
      {/* Tabs */}
      <div className="flex-shrink-0 border-b border-[#23232a]">
        <div className="flex border-b border-[#23232a]">
          {[
            { id: 'personality', label: 'Personality', icon: Sparkles },
            { id: 'behavior', label: 'Behavior', icon: Brain },
            { id: 'knowledge', label: 'Knowledge', icon: MessageSquare },
            { id: 'testing', label: 'Testing', icon: Gauge }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'personality' | 'behavior' | 'knowledge' | 'testing')}
              className={`flex-1 px-3 py-2 flex items-center justify-center gap-2 transition-colors text-xs font-mono ${
                activeTab === tab.id
                  ? 'bg-[#23232a] text-white border-b-2 border-blue-500'
                  : 'text-gray-400 hover:bg-[#23232a]'
              }`}
              style={{ borderRadius: 4 }}
            >
              <tab.icon className="w-4 h-4" />
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto figma-scrollbar p-4 space-y-4">
        {/* Personality Tab */}
        {activeTab === 'personality' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-white mb-2">Agent Personality</h3>
              <p className="text-xs text-gray-400 mb-2">
                Adjust personality traits to define how your agent communicates
              </p>
            </div>

            {/* Personality Traits */}
            <div className="space-y-2">
              {personalityTraits.map(trait => {
                const Icon = trait.icon || Sparkles;
                return (
                  <div key={trait.id} className="bg-[#23232a] border border-[#23232a] p-3" style={{ borderRadius: 4 }}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 flex items-center justify-center"
                          style={{ backgroundColor: `${trait.color}20`, borderRadius: 4 }}
                        >
                          <Icon className="w-4 h-4" style={{ color: trait.color }} />
                        </div>
                        <div>
                          <h4 className="font-medium text-white text-xs">{trait.name}</h4>
                          <p className="text-xs text-gray-400">{trait.description}</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-white">{trait.value}%</span>
                    </div>
                    <div className="relative">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={trait.value}
                        onChange={(e) => updateTrait(trait.id, parseInt(e.target.value))}
                        className="w-full h-2 bg-[#23232a] appearance-none cursor-pointer"
                        style={{
                          borderRadius: 4,
                          background: `linear-gradient(to right, ${trait.color} 0%, ${trait.color} ${trait.value}%, #23232a ${trait.value}%, #23232a 100%)`
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Generated Prompt Preview */}
            <div className="bg-[#23232a] border border-[#23232a] p-3" style={{ borderRadius: 4 }}>
              <h4 className="font-medium text-white mb-1 text-xs">Generated Personality Prompt</h4>
              <p className="text-xs text-gray-300 font-mono bg-[#18181b] p-2" style={{ borderRadius: 4 }}>
                {generatePersonalityPrompt()}
              </p>
            </div>
          </div>
        )}

        {/* Behavior Tab */}
        {activeTab === 'behavior' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Behavior Rules</h3>
              <p className="text-sm text-gray-400 mb-6">
                Define how your agent responds to specific situations
              </p>
            </div>

            {/* Model Selection */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium text-white mb-3">AI Model</h4>
              <div className="grid grid-cols-2 gap-3">
                {['gpt-4', 'gpt-3.5-turbo', 'claude-3', 'gemini-pro'].map(model => (
                  <button
                    key={model}
                    onClick={() => setSelectedModel(model)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedModel === model
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {model}
                  </button>
                ))}
              </div>
            </div>

            {/* Temperature & Max Tokens */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <h4 className="font-medium text-white mb-2">Temperature</h4>
                <p className="text-xs text-gray-400 mb-3">Controls randomness</p>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full"
                />
                <span className="text-sm text-gray-300">{temperature}</span>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <h4 className="font-medium text-white mb-2">Max Tokens</h4>
                <p className="text-xs text-gray-400 mb-3">Response length</p>
                <input
                  type="number"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  className="w-full bg-gray-700 text-white px-3 py-1 rounded"
                />
              </div>
            </div>

            {/* Behavior Rules */}
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-white">Conditional Behaviors</h4>
                <button
                  onClick={addBehaviorRule}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  + Add Rule
                </button>
              </div>
              
              {behaviorRules.map(rule => (
                <div key={rule.id} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={(e) => {
                        updateBehaviorRules(behaviorRules.map(r =>
                          r.id === rule.id ? { ...r, enabled: e.target.checked } : r
                        ));
                      }}
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-500" />
                        <input
                          type="text"
                          value={rule.trigger}
                          onChange={(e) => {
                            updateBehaviorRules(behaviorRules.map(r =>
                              r.id === rule.id ? { ...r, trigger: e.target.value } : r
                            ));
                          }}
                          className="flex-1 bg-gray-700 text-white px-3 py-1 rounded text-sm"
                          placeholder="Trigger condition"
                        />
                      </div>
                      <div className="flex items-center gap-2 ml-6">
                        <span className="text-gray-500">→</span>
                        <input
                          type="text"
                          value={rule.action}
                          onChange={(e) => {
                            updateBehaviorRules(behaviorRules.map(r =>
                              r.id === rule.id ? { ...r, action: e.target.value } : r
                            ));
                          }}
                          className="flex-1 bg-gray-700 text-white px-3 py-1 rounded text-sm"
                          placeholder="Action to take"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Knowledge Tab */}
        {activeTab === 'knowledge' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Knowledge Base</h3>
              <p className="text-sm text-gray-400 mb-6">
                Configure what your agent knows and can reference
              </p>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium text-white mb-3">System Instructions</h4>
              <textarea
                className="w-full h-32 bg-gray-700 text-white p-3 rounded text-sm"
                placeholder="Describe what your agent knows..."
                value={knowledge}
                onChange={e => updateKnowledge(e.target.value)}
                onBlur={e => updateKnowledge(e.target.value)}
              />
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium text-white mb-3">Context Sources</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked />
                  <span className="text-sm text-gray-300">Conversation History</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked />
                  <span className="text-sm text-gray-300">User Profile Data</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" />
                  <span className="text-sm text-gray-300">External Knowledge Base</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" />
                  <span className="text-sm text-gray-300">Real-time Data APIs</span>
                </label>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium text-white mb-3">Capabilities</h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'Answer Questions',
                  'Make Recommendations',
                  'Process Transactions',
                  'Schedule Appointments',
                  'Escalate Issues',
                  'Collect Information'
                ].map(capability => (
                  <label key={capability} className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked={capability === 'Answer Questions'} />
                    <span className="text-sm text-gray-300">{capability}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Testing Tab */}
        {activeTab === 'testing' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Agent Testing</h3>
              <p className="text-sm text-gray-400 mb-6">
                Test your agent configuration with sample conversations
              </p>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium text-white mb-3">Quick Test Scenarios</h4>
              <div className="space-y-2">
                {[
                  { id: '1', name: 'Friendly Greeting', prompt: 'Hi there!' },
                  { id: '2', name: 'Frustrated Customer', prompt: "This is ridiculous! I've been waiting for hours!" },
                  { id: '3', name: 'Technical Question', prompt: 'How do I reset my password?' },
                  { id: '4', name: 'Escalation Request', prompt: 'I want to speak to your manager!' }
                ].map(scenario => (
                  <button
                    key={scenario.id}
                    className="w-full text-left bg-gray-700 hover:bg-gray-600 p-3 rounded-lg transition-colors"
                  >
                    <div className="font-medium text-white text-sm">{scenario.name}</div>
                    <div className="text-xs text-gray-400 mt-1">&quot;{scenario.prompt}&quot;</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium text-white mb-3">Performance Metrics</h4>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-400">92%</div>
                  <div className="text-xs text-gray-400">Confidence Score</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-400">1.2s</div>
                  <div className="text-xs text-gray-400">Avg Response Time</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-400">4.8/5</div>
                  <div className="text-xs text-gray-400">User Satisfaction</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-400">15%</div>
                  <div className="text-xs text-gray-400">Escalation Rate</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
