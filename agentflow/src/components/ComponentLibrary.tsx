"use client"

import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Bot } from 'lucide-react';
import { nodeCategories } from '@/data/nodeDefinitions';
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
    <aside
      className="bg-[var(--figma-surface)] font-mono w-64 flex flex-col"
      style={{ minWidth: 220, maxWidth: 280, height: '100%', boxShadow: 'none', padding: 0, display: 'flex' }}
    >

      {/* Node Library - minimalist explorer */}
      <div className="flex-1 overflow-auto figma-scrollbar p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-[var(--figma-text)]">Components</span>
        </div>
        <div className="space-y-3">
          {filteredCategories.map(category => (
            <div key={category.id}>
              <button
                onClick={() => toggleSection(category.id)}
                className="w-full flex items-center gap-2 px-2 py-2 hover:bg-[var(--figma-accent)]/20 text-left transition-colors rounded focus:outline-none"
                style={{ borderRadius: 4, background: 'none', boxShadow: 'none' }}
              >
                {expandedSections[category.id] ?
                  <ChevronDown className="w-4 h-4 text-[var(--figma-accent)]" /> :
                  <ChevronRight className="w-4 h-4 text-[var(--figma-accent)]" />
                }
                <span className="text-xs font-semibold text-[var(--figma-text)]">{category.name}</span>
              </button>
              {expandedSections[category.id] && (
                <div className="ml-4 space-y-2">
                  {category.nodes.map(node => (
                    <div
                      key={node.id}
                      className="flex items-center gap-3 px-2 py-2 cursor-pointer transition-colors rounded focus:outline-none hover:bg-[var(--figma-accent)]/10"
                      style={{ borderRadius: 4, background: 'none', boxShadow: 'none' }}
                      onClick={() => onAddNode(node)}
                    >
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: node.color }} />
                      {React.createElement(node.icon, { className: "w-4 h-4 text-[var(--figma-text-secondary)]" })}
                      <span className="text-xs font-mono text-[var(--figma-text)]">{node.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
