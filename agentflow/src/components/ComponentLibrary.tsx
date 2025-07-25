"use client"

import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Bot } from 'lucide-react';
import { nodeCategories } from '@/data/nodeDefinitions';
import { theme as colors } from '@/data/theme';
import { NodeType, NodeCategory } from '@/types';

interface ComponentLibraryProps {
  onAddNode: (nodeType: NodeType) => void;
  onBackToProjects: () => void;
}

export function ComponentLibrary({ onAddNode, onBackToProjects }: ComponentLibraryProps) {
  // Dynamically create expandedSections based on nodeCategories
  const initialSections: Record<string, boolean> = Object.fromEntries(nodeCategories.map((cat: NodeCategory) => [cat.id, true]));
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(initialSections);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Filter nodes based on search term
  const filteredCategories: NodeCategory[] = nodeCategories.map((category: NodeCategory) => ({
    ...category,
    nodes: category.nodes.filter((node: NodeType) => 
      node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter((category: NodeCategory) => category.nodes.length > 0);

  return (
    <div className="w-64 border-r flex flex-col" style={{ backgroundColor: colors.sidebar, borderColor: colors.border }}>
      {/* Header - VS Code style */}
      <div className="h-12 border-b flex items-center px-4" style={{ borderColor: colors.border }}>
        <button 
          onClick={onBackToProjects}
          className="flex items-center space-x-2 hover:bg-white/5 px-2 py-1 transition-colors border-0 rounded-none shadow-none focus:ring-0 focus:outline-none"
          style={{ borderRadius: 0, boxShadow: 'none' }}
        >
          <div className="w-6 h-6 rounded-sm flex items-center justify-center" style={{ backgroundColor: colors.accent }}>
            <Bot className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-medium" style={{ color: colors.text }}>AgentFlow</span>
        </button>
      </div>

      {/* Node Library - VS Code Explorer style */}
      <div className="flex-1 overflow-auto">
        <div className="p-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium" style={{ color: colors.text }}>Components</span>
          </div>
          
          <div className="space-y-3">
            {filteredCategories.map(category => (
              <div key={category.id}>
                <button
                  onClick={() => toggleSection(category.id)}
                  className="w-full flex items-center space-x-2 p-2 hover:bg-white/5 text-left transition-colors border-0 rounded-none shadow-none focus:ring-0 focus:outline-none"
                  style={{ borderRadius: 0, boxShadow: 'none' }}
                >
                  {expandedSections[category.id] ? 
                    <ChevronDown className="w-4 h-4" style={{ color: colors.textSecondary }} /> : 
                    <ChevronRight className="w-4 h-4" style={{ color: colors.textSecondary }} />
                  }
                  <span className="text-sm" style={{ color: colors.text }}>{category.name}</span>
                </button>
                
                {expandedSections[category.id] && (
                  <div className="ml-6 space-y-1">
                    {category.nodes.map(node => (
                      <div
                        key={node.id}
                        className="flex items-center space-x-2 p-2 hover:bg-white/5 cursor-pointer transition-colors border-0 rounded-none shadow-none focus:ring-0 focus:outline-none"
                        style={{ borderRadius: 0, boxShadow: 'none' }}
                        onClick={() => onAddNode(node)}
                      >
                        <div 
                          className="w-3 h-3 rounded-sm"
                          style={{ backgroundColor: node.color }}
                        />
                        {React.createElement(node.icon, { className: "w-4 h-4", style: { color: colors.textSecondary } })}
                        <span className="text-sm" style={{ color: colors.text }}>{node.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
