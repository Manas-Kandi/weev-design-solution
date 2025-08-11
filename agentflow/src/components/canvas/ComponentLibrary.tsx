"use client"

import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { nodeCategories } from '@/data/nodeDefinitions';
import { NodeType, NodeCategory } from '@/types';

interface ComponentLibraryProps {
  onAddNode: (nodeType: NodeType) => void;
  onBackToProjects: () => void;
}

export function ComponentLibrary({ onAddNode, onBackToProjects }: ComponentLibraryProps) {
  // Dynamically create expandedSections based on nodeCategories
  const initialSections: Record<string, boolean> = Object.fromEntries(
    nodeCategories.map((cat: NodeCategory) => [cat.id, true])
  );
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
      style={{
        width: 240,
        height: '100vh',
        background: '#0a0a0a',
        borderRight: '1px solid #1a1a1a',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #1a1a1a',
          background: '#0a0a0a',
        }}
      >
        <h2
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#ffffff',
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Components
        </h2>
      </div>

      {/* Search */}
      <div style={{ padding: '12px 16px' }}>
        <input
          type="text"
          placeholder="Search components..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            height: 28,
            background: '#1a1a1a',
            border: '1px solid #2a2a2a',
            borderRadius: 4,
            padding: '0 8px',
            fontSize: 12,
            color: '#ffffff',
            outline: 'none',
          }}
          onFocus={(e) => {
            e.target.style.border = '1px solid #0969da';
          }}
          onBlur={(e) => {
            e.target.style.border = '1px solid #2a2a2a';
          }}
        />
      </div>

      {/* Component List */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '0 8px 16px 8px',
        }}
      >
        {filteredCategories.map(category => (
          <div key={category.id} style={{ marginBottom: 16 }}>
            {/* Category Header */}
            <button
              onClick={() => toggleSection(category.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 8px',
                background: 'none',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 400,
                color: '#666666',
                textAlign: 'left',
                outline: 'none',
                justifyContent: 'flex-start',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.color = '#888888';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.color = '#666666';
              }}
            >
              {expandedSections[category.id] ? (
                <ChevronDown className="w-3 h-3" style={{ color: '#555555', flexShrink: 0 }} />
              ) : (
                <ChevronRight className="w-3 h-3" style={{ color: '#555555', flexShrink: 0 }} />
              )}
              <span style={{ textAlign: 'left' }}>{category.name}</span>
            </button>

            {/* Category Items */}
            {expandedSections[category.id] && (
              <div style={{ marginLeft: 8, marginTop: 2 }}>
                {category.nodes.map(node => (
                  <button
                    key={node.id}
                    onClick={() => onAddNode(node)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 8px',
                      background: 'none',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 12,
                      color: '#ffffff',
                      textAlign: 'left',
                      outline: 'none',
                      marginBottom: 1,
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#1a1a1a';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'none';
                    }}
                  >
                    {/* Color indicator */}
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 2,
                        backgroundColor: node.color,
                        flexShrink: 0,
                      }}
                    />
                    
                    {/* Icon */}
                    {React.createElement(node.icon, { 
                      className: "w-4 h-4", 
                      style: { color: '#888888', flexShrink: 0 } 
                    })}
                    
                    {/* Name */}
                    <span style={{ flex: 1, textAlign: 'left' }}>
                      {node.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {filteredCategories.length === 0 && searchTerm && (
          <div
            style={{
              padding: '32px 16px',
              textAlign: 'center',
              color: '#666666',
              fontSize: 12,
            }}
          >
            No components found
          </div>
        )}
      </div>
    </aside>
  );
}