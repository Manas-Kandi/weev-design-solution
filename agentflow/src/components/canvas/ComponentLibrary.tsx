"use client"

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, ChevronLeft, User, Play, Home } from 'lucide-react';
import { simplifiedNodeCategories, nodeTypeMapping } from '@/data/simplifiedNodeDefinitions';
import { nodeCategories as allNodeCategories } from '@/data/nodeDefinitions';
import { NodeType, NodeCategory } from '@/types';

interface ComponentLibraryProps {
  onAddNode: (nodeType: NodeType) => void;
  onBackToProjects: () => void;
  onTest?: () => void;
  testButtonDisabled?: boolean;
  projectName?: string;
  onProjectNameChange?: (name: string) => void;
}

export function ComponentLibrary({ onAddNode, onBackToProjects, onTest, testButtonDisabled = false, projectName = 'Untitled Project', onProjectNameChange }: ComponentLibraryProps) {
  // Dynamically create expandedSections based on simplified categories
  const initialSections: Record<string, boolean> = Object.fromEntries(
    simplifiedNodeCategories.map((cat: NodeCategory) => [cat.id, true])
  );
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(initialSections);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedNode, setSelectedNode] = useState<NodeType | null>(null);
  const [isEditingProjectName, setIsEditingProjectName] = useState(false);
  const [tempProjectName, setTempProjectName] = useState(projectName);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    setSelectedNode(null); // Clear selection when toggling
  };

  // Get all nodes for search functionality (including hidden ones)
  const allNodes = useMemo(() => {
    const nodes: NodeType[] = [];
    allNodeCategories.forEach(category => {
      category.nodes.forEach(node => {
        nodes.push(node);
      });
    });
    return nodes;
  }, []);

  // Filter nodes based on search term
  const filteredCategories: NodeCategory[] = useMemo(() => {
    if (searchTerm) {
      // When searching, include all nodes (even hidden ones) that match
      const matchingNodes = allNodes.filter((node: NodeType) => 
        node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      // Group matching nodes by their mapped category
      const categorizedNodes: Record<string, NodeType[]> = {};
      matchingNodes.forEach(node => {
        const mappedType = nodeTypeMapping[node.id];
        if (mappedType && mappedType !== 'hidden') {
          // Find which simplified category this belongs to
          for (const cat of simplifiedNodeCategories) {
            if (cat.nodes.some(n => n.id === mappedType)) {
              if (!categorizedNodes[cat.id]) {
                categorizedNodes[cat.id] = [];
              }
              categorizedNodes[cat.id].push(node);
              break;
            }
          }
        }
      });
      
      // Return categories with matching nodes
      return simplifiedNodeCategories
        .map(cat => ({
          ...cat,
          nodes: categorizedNodes[cat.id] || []
        }))
        .filter(cat => cat.nodes.length > 0);
    } else {
      // When not searching, show only simplified categories
      return simplifiedNodeCategories;
    }
  }, [searchTerm, allNodes]);

  // Panel styles - content now uses full width since controls are panel children
  const panelWidth = isCollapsed ? 72 : 280;
  const contentWidth = panelWidth; // Use full panel width
  
  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    left: 0,
    top: 0,
    bottom: 0,
    width: panelWidth,
    zIndex: 1000,
    background: `
      linear-gradient(180deg, rgba(10, 10, 10, 0.85) 0%, rgba(15, 15, 15, 0.85) 100%),
      radial-gradient(circle at top left, rgba(60, 0, 80, 0.15), transparent 60%),
      radial-gradient(circle at bottom right, rgba(0, 80, 120, 0.15), transparent 60%)
    `,
    backdropFilter: 'blur(12px)',
    borderRight: '1px solid rgba(255, 255, 255, 0.06)',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    overflow: 'hidden',
  };

  const searchInputStyle: React.CSSProperties = {
    width: '100%',
    height: 32,
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: 6,
    padding: '0 12px',
    fontSize: 13,
    color: '#ffffff',
    outline: 'none',
    transition: 'border-color 0.2s, background-color 0.2s',
  };

  const categoryHeaderStyle: React.CSSProperties = {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start', // Ensure left alignment
    gap: 8,
    padding: '6px 12px',
    background: 'none',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 500,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'left',
    outline: 'none',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    transition: 'color 0.2s',
  };

  const nodeButtonStyle: React.CSSProperties = {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 12px',
    background: 'none',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
    color: '#ffffff',
    textAlign: 'left',
    outline: 'none',
    marginBottom: 2,
    transition: 'background-color 0.15s ease-out, transform 0.1s ease-out',
  };

  // Control buttons positioned within panel container
  const controlsContainerStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    height: 160, // Increased height for Home button
    display: 'flex',
    flexDirection: 'column',
    alignItems: isCollapsed ? 'center' : 'flex-end',
    justifyContent: 'flex-end',
    gap: 12,
    padding: isCollapsed ? '0' : '0 20px 0 0',
    pointerEvents: 'none', // Allow clicks to pass through container
  };

  const testButtonStyle: React.CSSProperties = {
    width: isCollapsed ? 32 : 72,
    height: 32,
    background: testButtonDisabled 
      ? 'rgba(255, 255, 255, 0.05)' 
      : 'linear-gradient(135deg, rgba(0, 102, 204, 0.8), rgba(0, 80, 160, 0.8))',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: testButtonDisabled ? 'not-allowed' : 'pointer',
    color: testButtonDisabled ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.9)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    backdropFilter: 'blur(12px)',
    fontSize: 12,
    fontWeight: 600,
    gap: 6,
    opacity: testButtonDisabled ? 0.6 : 1,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)',
    pointerEvents: 'auto', // Enable clicks on button
  };

  const collapseButtonStyle: React.CSSProperties = {
    width: 32,
    height: 32,
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'rgba(255, 255, 255, 0.8)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    backdropFilter: 'blur(12px)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    pointerEvents: 'auto', // Enable clicks on button
  };

  const profileButtonStyle: React.CSSProperties = {
    width: 32,
    height: 32,
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'rgba(255, 255, 255, 0.8)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    backdropFilter: 'blur(12px)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    pointerEvents: 'auto', // Enable clicks on button
  };

  const homeButtonStyle: React.CSSProperties = {
    width: 32,
    height: 32,
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'rgba(255, 255, 255, 0.7)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    backdropFilter: 'blur(12px)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    pointerEvents: 'auto',
  };

  const projectNameInputStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.8px',
    outline: 'none',
    width: '100%',
    padding: '2px 0',
    borderBottom: isEditingProjectName ? '1px solid rgba(0, 102, 204, 0.5)' : '1px solid transparent',
    transition: 'border-color 0.2s',
  };

  // Mini properties panel for collapsed mode
  const MiniPropertiesPanel = ({ node }: { node: NodeType }) => (
    <motion.div
      initial={{ opacity: 0, x: -10, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      style={{
        position: 'fixed',
        left: panelWidth + 12,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 240,
        background: `
          linear-gradient(180deg, rgba(10, 10, 10, 0.9) 0%, rgba(15, 15, 15, 0.9) 100%),
          radial-gradient(circle at top left, rgba(60, 0, 80, 0.2), transparent 60%),
          radial-gradient(circle at bottom right, rgba(0, 80, 120, 0.2), transparent 60%)
        `,
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        padding: 16,
        zIndex: 1003,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      }}
    >
      <div style={{ 
        fontSize: 14, 
        fontWeight: 600, 
        color: '#ffffff', 
        marginBottom: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}>
        {React.createElement(node.icon, { 
          className: "w-4 h-4", 
          style: { color: node.color } 
        })}
        {node.name}
      </div>
      <div style={{ 
        fontSize: 12, 
        color: 'rgba(255, 255, 255, 0.7)', 
        marginBottom: 12,
        lineHeight: 1.4
      }}>
        {node.description}
      </div>
      <button
        onClick={() => {
          onAddNode(node);
          setSelectedNode(null);
        }}
        style={{
          width: '100%',
          padding: '8px 12px',
          background: 'linear-gradient(135deg, #0066cc, #004499)',
          border: 'none',
          borderRadius: 6,
          color: '#ffffff',
          fontSize: 12,
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'transform 0.1s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.02)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        Add Component
      </button>
    </motion.div>
  );

  return (
    <>
      <motion.aside
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1, width: panelWidth }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        style={panelStyle}
      >
        {!isCollapsed ? (
          // Expanded Mode
          <>
            {/* Header - Project Name */}
            <div style={{ 
              padding: '20px 20px 16px 20px', 
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              width: contentWidth,
              maxWidth: contentWidth
            }}>
              {isEditingProjectName ? (
                <input
                  type="text"
                  value={tempProjectName}
                  onChange={(e) => setTempProjectName(e.target.value)}
                  onBlur={() => {
                    setIsEditingProjectName(false);
                    if (onProjectNameChange && tempProjectName.trim()) {
                      onProjectNameChange(tempProjectName.trim());
                    } else {
                      setTempProjectName(projectName);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur();
                    } else if (e.key === 'Escape') {
                      setTempProjectName(projectName);
                      setIsEditingProjectName(false);
                    }
                  }}
                  style={projectNameInputStyle}
                  autoFocus
                  maxLength={50}
                />
              ) : (
                <h2 
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#ffffff',
                    margin: 0,
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    cursor: 'pointer',
                    padding: '2px 0',
                    borderBottom: '1px solid transparent',
                    transition: 'color 0.2s',
                  }}
                  onClick={() => {
                    setIsEditingProjectName(true);
                    setTempProjectName(projectName);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  title="Click to edit project name"
                >
                  {projectName}
                </h2>
              )}
            </div>

            {/* Search */}
            <div style={{ 
              padding: '12px 20px 16px 20px',
              width: contentWidth,
              maxWidth: contentWidth
            }}>
              <input
                type="text"
                placeholder="Search components..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  ...searchInputStyle,
                  width: `${contentWidth - 40}px`,
                  maxWidth: `${contentWidth - 40}px`
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(0, 102, 204, 0.5)';
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                }}
              />
            </div>

            {/* Component List */}
            <div style={{
              flex: 1,
              overflow: 'auto',
              padding: '0 12px 180px 12px', // Increased bottom padding for controls including Home button
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              width: contentWidth,
              maxWidth: contentWidth
            }}>
              <style>
                {`
                  div::-webkit-scrollbar { display: none; }
                `}
              </style>
              {filteredCategories.map((category, index) => (
                <motion.div 
                  key={category.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  style={{ marginBottom: 20 }}
                >
                  {/* Category Header */}
                  <button
                    onClick={() => toggleSection(category.id)}
                    style={categoryHeaderStyle}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
                    }}
                  >
                    {expandedSections[category.id] ? (
                      <ChevronDown size={12} style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                    ) : (
                      <ChevronRight size={12} style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                    )}
                    {category.name}
                  </button>

                  {/* Category Items */}
                  <AnimatePresence>
                    {expandedSections[category.id] && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ marginLeft: 8, marginTop: 4, overflow: 'hidden' }}
                      >
                        {category.nodes.map((node, nodeIndex) => (
                          <motion.button
                            key={node.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: nodeIndex * 0.03 }}
                            onClick={() => onAddNode(node)}
                            style={nodeButtonStyle}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                              e.currentTarget.style.transform = 'translateX(2px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.transform = 'translateX(0)';
                            }}
                          >
                            {/* Icon with glow effect */}
                            <div style={{
                              width: 20,
                              height: 20,
                              borderRadius: 4,
                              backgroundColor: `${node.color}15`,
                              border: `1px solid ${node.color}40`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}>
                              {React.createElement(node.icon, { 
                                size: 12,
                                style: { color: node.color }
                              })}
                            </div>
                            
                            {/* Name */}
                            <span style={{ 
                              flex: 1, 
                              textAlign: 'left', 
                              fontWeight: 500,
                              display: 'flex',
                              alignItems: 'center',
                              lineHeight: 1
                            }}>
                              {node.name}
                            </span>
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}

              {filteredCategories.length === 0 && searchTerm && (
                <div style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: 13,
                }}>
                  No components found
                </div>
              )}
            </div>

            {/* Controls Container - Expanded Mode */}
            <div style={controlsContainerStyle}>
              {onTest && (
                <motion.button
                  animate={{ width: isCollapsed ? 32 : 72 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  onClick={onTest}
                  disabled={testButtonDisabled}
                  style={testButtonStyle}
                  title={isCollapsed ? "Test" : undefined}
                  onMouseEnter={(e) => {
                    if (!testButtonDisabled) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 102, 204, 0.9), rgba(0, 80, 160, 0.9))';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!testButtonDisabled) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 102, 204, 0.8), rgba(0, 80, 160, 0.8))';
                      e.currentTarget.style.transform = 'scale(1)';
                    }
                  }}
                >
                  <Play size={isCollapsed ? 14 : 12} />
                  {!isCollapsed && <span>Test</span>}
                </motion.button>
              )}

              <button
                onClick={toggleCollapse}
                style={collapseButtonStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <ChevronLeft 
                  size={16} 
                  style={{ 
                    transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }} 
                />
              </button>

              <button
                onClick={onBackToProjects}
                style={profileButtonStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <Home size={16} />
              </button>
            </div>
          </>
        ) : (
          // Collapsed Mode - Icons Only
          <>
            <div style={{
              flex: 1,
              overflow: 'auto',
              padding: '20px 0 180px 0', // Increased bottom padding for controls including Home button
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}>
              {simplifiedNodeCategories.map(category => 
                category.nodes.map(node => (
                  <div
                    key={node.id}
                    style={{
                      position: 'relative',
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      backgroundColor: `${node.color}15`,
                      border: `1px solid ${node.color}40`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onClick={() => setSelectedNode(selectedNode?.id === node.id ? null : node)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `${node.color}25`;
                      e.currentTarget.style.borderColor = `${node.color}60`;
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = `${node.color}15`;
                      e.currentTarget.style.borderColor = `${node.color}40`;
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                    title={node.name}
                  >
                    {React.createElement(node.icon, { 
                      size: 16,
                      style: { color: node.color }
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Controls Container - Collapsed Mode */}
            <div style={controlsContainerStyle}>
              {onTest && (
                <motion.button
                  animate={{ width: isCollapsed ? 32 : 72 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  onClick={onTest}
                  disabled={testButtonDisabled}
                  style={testButtonStyle}
                  title={isCollapsed ? "Test" : undefined}
                  onMouseEnter={(e) => {
                    if (!testButtonDisabled) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 102, 204, 0.9), rgba(0, 80, 160, 0.9))';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!testButtonDisabled) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 102, 204, 0.8), rgba(0, 80, 160, 0.8))';
                      e.currentTarget.style.transform = 'scale(1)';
                    }
                  }}
                >
                  <Play size={isCollapsed ? 14 : 12} />
                  {!isCollapsed && <span>Test</span>}
                </motion.button>
              )}

              <button
                onClick={toggleCollapse}
                style={collapseButtonStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <ChevronLeft 
                  size={16} 
                  style={{ 
                    transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }} 
                />
              </button>

              <button
                onClick={onBackToProjects}
                style={profileButtonStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <Home size={16} />
              </button>
            </div>
          </>
        )}
      </motion.aside>



      {/* Mini Properties Panel for Collapsed Mode */}
      <AnimatePresence>
        {isCollapsed && selectedNode && (
          <MiniPropertiesPanel node={selectedNode} />
        )}
      </AnimatePresence>

      {/* Overlay to close mini panel */}
      {isCollapsed && selectedNode && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
          }}
          onClick={() => setSelectedNode(null)}
        />
      )}
    </>
  );
}
