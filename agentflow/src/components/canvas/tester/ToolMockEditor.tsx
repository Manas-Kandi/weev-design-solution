import React, { useState, useEffect } from 'react';
import { X, Plus, Save, Trash2, Copy, Settings, Clock, AlertCircle } from 'lucide-react';
import { 
  toolSimulator, 
  ToolMockConfig, 
  ToolMockProfile, 
  ToolMockOverride,
  ToolError
} from '@/lib/toolSimulator';
import { TOOL_MOCKS } from '@/types/toolSimulator';

interface ToolMockEditorProps {
  onClose: () => void;
}

export function ToolMockEditor({ onClose }: ToolMockEditorProps) {
  const [profiles, setProfiles] = useState<ToolMockProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<ToolMockProfile | null>(null);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [selectedOperation, setSelectedOperation] = useState<string | null>(null);
  const [showNewProfile, setShowNewProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileDesc, setNewProfileDesc] = useState('');

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = () => {
    const stored = toolSimulator.getStoredProfiles();
    const profileList = Object.values(stored);
    setProfiles(profileList);
    
    const active = toolSimulator.getActiveProfile();
    setActiveProfile(active);
  };

  const createProfile = () => {
    if (!newProfileName.trim()) return;
    
    const profile = toolSimulator.createProfile(
      newProfileName.trim(),
      newProfileDesc.trim() || 'Custom mock profile'
    );
    
    toolSimulator.saveProfile(profile);
    toolSimulator.setActiveProfile(profile);
    loadProfiles();
    
    setNewProfileName('');
    setNewProfileDesc('');
    setShowNewProfile(false);
  };

  const setActive = (profile: ToolMockProfile) => {
    toolSimulator.setActiveProfile(profile);
    setActiveProfile(profile);
  };

  const deleteProfile = (profileId: string) => {
    toolSimulator.deleteBranch(profileId);
    loadProfiles();
  };

  const setToolOverride = (
    toolName: string,
    operation: string,
    override: ToolMockOverride
  ) => {
    if (!activeProfile) return;
    
    const updatedProfile = {
      ...activeProfile,
      tools: {
        ...activeProfile.tools,
        [`${toolName}:${operation}`]: override
      },
      updatedAt: Date.now()
    };
    
    toolSimulator.saveProfile(updatedProfile);
    toolSimulator.setActiveProfile(updatedProfile);
    setActiveProfile(updatedProfile);
  };

  const removeToolOverride = (toolName: string, operation: string) => {
    if (!activeProfile) return;
    
    const updatedProfile = {
      ...activeProfile,
      tools: { ...activeProfile.tools }
    };
    
    delete updatedProfile.tools[`${toolName}:${operation}`];
    updatedProfile.updatedAt = Date.now();
    
    toolSimulator.saveProfile(updatedProfile);
    toolSimulator.setActiveProfile(updatedProfile);
    setActiveProfile(updatedProfile);
  };

  const tools = Object.values(TOOL_MOCKS);

  return (
    <div className="flex h-full">
      {/* Sidebar - Profiles */}
      <div className="w-64 border-r border-slate-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-300">Profiles</h3>
          <button
            onClick={() => setShowNewProfile(true)}
            className="p-1 text-slate-400 hover:text-slate-200"
          >
            <Plus size={16} />
          </button>
        </div>

        {showNewProfile && (
          <div className="mb-4 p-3 bg-slate-800 rounded-lg">
            <input
              type="text"
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              placeholder="Profile name"
              className="w-full mb-2 px-2 py-1 text-sm bg-slate-700 border border-slate-600 rounded"
            />
            <input
              type="text"
              value={newProfileDesc}
              onChange={(e) => setNewProfileDesc(e.target.value)}
              placeholder="Description (optional)"
              className="w-full mb-2 px-2 py-1 text-sm bg-slate-700 border border-slate-600 rounded"
            />
            <div className="flex gap-2">
              <button
                onClick={createProfile}
                className="flex-1 text-sm bg-blue-600 text-white rounded py-1 hover:bg-blue-700"
              >
                Create
              </button>
              <button
                onClick={() => setShowNewProfile(false)}
                className="flex-1 text-sm bg-slate-600 text-white rounded py-1 hover:bg-slate-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {profiles.map(profile => (
            <div
              key={profile.id}
              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                activeProfile?.id === profile.id
                  ? 'bg-blue-600/20 border border-blue-600/50'
                  : 'bg-slate-800 hover:bg-slate-700'
              }`}
              onClick={() => setActive(profile)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-200">{profile.name}</div>
                  <div className="text-xs text-slate-400">{profile.description}</div>
                </div>
                {profile.id !== 'default' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteProfile(profile.id);
                    }}
                    className="p-1 text-slate-400 hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content - Tools */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-300">Tool Mocks</h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid gap-4">
          {tools.map(tool => (
            <div key={tool.id} className="bg-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-medium text-slate-200">{tool.name}</h4>
                  <p className="text-sm text-slate-400">{tool.description}</p>
                </div>
                <Settings size={16} className="text-slate-400" />
              </div>

              <div className="space-y-3">
                {tool.operations.map(operation => {
                  const overrideKey = `${tool.id}:${operation.name}`;
                  const override = activeProfile?.tools[overrideKey];
                  
                  return (
                    <div key={operation.name} className="border-l-2 border-slate-600 pl-3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="text-sm font-medium text-slate-300">
                            {operation.name}
                          </div>
                          <div className="text-xs text-slate-400">
                            {operation.description}
                          </div>
                        </div>
                        
                        {override && (
                          <button
                            onClick={() => removeToolOverride(tool.id, operation.name)}
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      {!override ? (
                        <div className="flex gap-2">
                          {tool.presets.slice(0, 3).map(preset => (
                            <button
                              key={preset.id}
                              onClick={() => setToolOverride(tool.id, operation.name, {
                                toolName: tool.id,
                                operation: operation.name,
                                presetId: preset.id
                              })}
                              className="text-xs px-2 py-1 bg-slate-700 rounded hover:bg-slate-600"
                            >
                              {preset.name}
                            </button>
                          ))}
                          
                          <button
                            onClick={() => {
                              setSelectedTool(tool.id);
                              setSelectedOperation(operation.name);
                            }}
                            className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Custom
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400">
                          {override.presetId ? (
                            <span>Using preset: {tool.presets.find(p => p.id === override.presetId)?.name}</span>
                          ) : override.customOutput ? (
                            <span>Custom output configured</span>
                          ) : override.customError ? (
                            <span>Error: {override.customError.message}</span>
                          ) : (
                            <span>Custom configuration</span>
                          )}
                          
                          {override.latencyMs && (
                            <span className="ml-2 flex items-center gap-1">
                              <Clock size={12} />
                              {override.latencyMs}ms
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
