"use client"

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { 
  Plus, 
  Hand, 
  MousePointer, 
  Square, 
  Circle, 
  Bot,
  Layers,
  Share,
  Play,
  ZoomIn,
  ZoomOut,
  Settings,
  Search,
  FileText,
  Mail,
  Calculator,
  Image as ImageIcon,
  Database,
  MessageSquare,
  Users,
  Folder,
  ChevronRight,
  ChevronDown,
  Eye,
  Lock,
  Sparkles,
  TrendingUp,
  Zap,
  FolderOpen,
  File,
  MoreHorizontal,
  GitBranch,
  Palette,
  ExternalLink,
  Link,
  Minimize2
} from 'lucide-react'

interface CanvasNode {
  id: string
  type: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  data: {
    title: string
    description: string
    color: string
    icon: any
    content?: string
  }
  inputs: { id: string; label: string }[]
  outputs: { id: string; label: string }[]
}

interface Connection {
  id: string
  sourceNode: string
  sourceOutput: string
  targetNode: string
  targetInput: string
}

interface Project {
  id: string
  name: string
  description: string
  lastModified: Date
  nodeCount: number
  status: 'draft' | 'testing' | 'deployed'
}

interface Tool {
  id: string
  name: string
  icon: any
  shortcut: string
}

export default function AgentFlowDesigner() {
  const [currentView, setCurrentView] = useState<'projects' | 'designer'>('projects')
  const [currentTool, setCurrentTool] = useState('select')
  const [nodes, setNodes] = useState<CanvasNode[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [viewportTransform, setViewportTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [isSpacePressed, setIsSpacePressed] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  const [isDragging, setIsDragging] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isConnecting, setIsConnecting] = useState<{
    sourceNode: string
    sourceOutput: string
  } | null>(null)
  const [expandedSections, setExpandedSections] = useState({
    core: true,
    advanced: false,
    templates: false
  })
  const [projects] = useState<Project[]>([
    {
      id: '1',
      name: 'Customer Support Agent',
      description: 'Handles customer inquiries and escalations',
      lastModified: new Date('2024-01-15'),
      nodeCount: 12,
      status: 'testing'
    },
    {
      id: '2', 
      name: 'Sales Qualification Bot',
      description: 'Qualifies leads and schedules demos',
      lastModified: new Date('2024-01-12'),
      nodeCount: 8,
      status: 'draft'
    },
    {
      id: '3',
      name: 'Onboarding Assistant',
      description: 'Guides new users through setup',
      lastModified: new Date('2024-01-10'),
      nodeCount: 15,
      status: 'deployed'
    }
  ])
  
  const canvasRef = useRef<HTMLDivElement>(null)
  const lastPanPoint = useRef({ x: 0, y: 0 })

  // VS Code inspired color scheme
  const colors = {
    background: '#1e1e1e',
    sidebar: '#252526',
    panel: '#2d2d30',
    border: '#3e3e42',
    text: '#cccccc',
    textSecondary: '#969696',
    accent: '#007acc',
    success: '#4ec9b0',
    warning: '#dcdcaa',
    error: '#f48771',
    purple: '#c586c0',
    orange: '#ce9178',
    blue: '#9cdcfe',
    green: '#6a9955'
  }

  // Node types organized by category with VS Code colors
  const nodeCategories = [
    {
      id: 'core',
      name: 'Core Nodes',
      nodes: [
        { id: 'user-intent', name: 'User Intent', icon: MessageSquare, color: colors.blue, description: 'Captures user purpose and goals' },
        { id: 'agent-response', name: 'Agent Response', icon: Bot, color: colors.success, description: 'Defines agent reply logic' },
        { id: 'branch-condition', name: 'Branch/Condition', icon: GitBranch, color: colors.purple, description: 'Controls flow logic' },
        { id: 'memory', name: 'Memory Object', icon: Database, color: colors.orange, description: 'Stores context' },
      ]
    },
    {
      id: 'advanced',
      name: 'Advanced',
      nodes: [
        { id: 'personality', name: 'Personality Modifier', icon: Palette, color: colors.warning, description: 'Adjusts agent behavior' },
        { id: 'external-action', name: 'External Action', icon: ExternalLink, color: colors.error, description: 'API calls & escalations' },
      ]
    }
  ]

  const tools: Tool[] = [
    { id: 'select', name: 'Select', icon: MousePointer, shortcut: 'V' },
    { id: 'hand', name: 'Hand', icon: Hand, shortcut: 'H' },
    { id: 'connect', name: 'Connect', icon: Link, shortcut: 'C' },
    { id: 'text', name: 'Comment', icon: FileText, shortcut: 'T' },
  ]

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        setIsSpacePressed(true)
      }
      if (e.key.toLowerCase() === 'v') setCurrentTool('select')
      if (e.key.toLowerCase() === 'h') setCurrentTool('hand')
      if (e.key.toLowerCase() === 'c') setCurrentTool('connect')
      if (e.key === 'Escape') {
        setSelectedNode(null)
        setIsConnecting(null)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false)
      }
    }

    if (currentView === 'designer') {
      window.addEventListener('keydown', handleKeyDown)
      window.addEventListener('keyup', handleKeyUp)
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [currentView])

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return
    setSelectedNode(null)
    setIsConnecting(null)
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (currentTool === 'hand' || isSpacePressed) {
      setIsPanning(true)
      lastPanPoint.current = { x: e.clientX, y: e.clientY }
    }
  }, [currentTool, isSpacePressed])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      const deltaX = e.clientX - lastPanPoint.current.x
      const deltaY = e.clientY - lastPanPoint.current.y
      
      setViewportTransform(prev => ({
        ...prev,
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }))
      
      lastPanPoint.current = { x: e.clientX, y: e.clientY }
    }

    if (isDragging) {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return

      const x = (e.clientX - rect.left - dragOffset.x - viewportTransform.x) / viewportTransform.scale
      const y = (e.clientY - rect.top - dragOffset.y - viewportTransform.y) / viewportTransform.scale

      setNodes(prev => prev.map(node => 
        node.id === isDragging 
          ? { ...node, position: { x, y } }
          : node
      ))
    }
  }, [isPanning, isDragging, dragOffset, viewportTransform])

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
    setIsDragging(null)
  }, [])

  const handleZoom = (delta: number) => {
    setViewportTransform(prev => ({
      ...prev,
      scale: Math.max(0.1, Math.min(2, prev.scale + delta))
    }))
  }

  const handleNodeMouseDown = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (currentTool === 'select') {
      setSelectedNode(nodeId)
      setIsDragging(nodeId)
      
      const node = nodes.find(n => n.id === nodeId)
      if (node) {
        setDragOffset({
          x: e.clientX - node.position.x * viewportTransform.scale - viewportTransform.x,
          y: e.clientY - node.position.y * viewportTransform.scale - viewportTransform.y
        })
      }
    }
  }

  const handleOutputClick = (nodeId: string, outputId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (currentTool === 'connect') {
      setIsConnecting({ sourceNode: nodeId, sourceOutput: outputId })
    }
  }

  const handleInputClick = (nodeId: string, inputId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (isConnecting && currentTool === 'connect') {
      const newConnection: Connection = {
        id: `conn-${Date.now()}`,
        sourceNode: isConnecting.sourceNode,
        sourceOutput: isConnecting.sourceOutput,
        targetNode: nodeId,
        targetInput: inputId
      }
      setConnections(prev => [...prev, newConnection])
      setIsConnecting(null)
    }
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const addNode = (nodeType: any) => {
    const newNode: CanvasNode = {
      id: `node-${Date.now()}`,
      type: nodeType.id,
      position: { x: 300, y: 200 },
      size: { width: 220, height: 140 },
      data: {
        title: nodeType.name,
        description: nodeType.description,
        color: nodeType.color,
        icon: nodeType.icon,
        content: ''
      },
      inputs: [{ id: 'input-1', label: 'Input' }],
      outputs: [{ id: 'output-1', label: 'Output' }]
    }
    setNodes(prev => [...prev, newNode])
    setSelectedNode(newNode.id)
  }

  const createNewProject = () => {
    setCurrentView('designer')
    setNodes([])
    setConnections([])
    setSelectedNode(null)
  }

  const openProject = (project: Project) => {
    setCurrentView('designer')
    setNodes([])
    setConnections([])
  }

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'deployed': return `bg-green-500/20 text-green-400 border-green-500/30`
      case 'testing': return `bg-yellow-500/20 text-yellow-400 border-yellow-500/30`
      case 'draft': return `bg-gray-500/20 text-gray-400 border-gray-500/30`
      default: return `bg-gray-500/20 text-gray-400 border-gray-500/30`
    }
  }

  // Calculate connection path
  const getConnectionPath = (conn: Connection) => {
    const sourceNode = nodes.find(n => n.id === conn.sourceNode)
    const targetNode = nodes.find(n => n.id === conn.targetNode)
    
    if (!sourceNode || !targetNode) return ''

    const sourceX = sourceNode.position.x + sourceNode.size.width
    const sourceY = sourceNode.position.y + sourceNode.size.height / 2
    const targetX = targetNode.position.x
    const targetY = targetNode.position.y + targetNode.size.height / 2

    const controlX1 = sourceX + 100
    const controlX2 = targetX - 100

    return `M ${sourceX} ${sourceY} C ${controlX1} ${sourceY} ${controlX2} ${targetY} ${targetX} ${targetY}`
  }

  // Projects View
  if (currentView === 'projects') {
    return (
      <div className="h-screen" style={{ backgroundColor: colors.background }}>
        {/* Header */}
        <div className="border-b" style={{ borderColor: colors.border, backgroundColor: colors.sidebar }}>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-sm flex items-center justify-center" style={{ backgroundColor: colors.accent }}>
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-medium" style={{ color: colors.text }}>AgentFlow</h1>
                <p className="text-sm" style={{ color: colors.textSecondary }}>Design intelligent agent systems</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: colors.textSecondary }} />
                <Input 
                  placeholder="Search projects..." 
                  className="pl-10 w-64 border-0"
                  style={{ 
                    backgroundColor: colors.panel, 
                    color: colors.text,
                    borderColor: colors.border
                  }}
                />
              </div>
              <Button 
                onClick={createNewProject} 
                className="gap-2"
                style={{ 
                  backgroundColor: colors.accent,
                  color: 'white'
                }}
              >
                <Plus className="w-4 h-4" />
                New Project
              </Button>
            </div>
          </div>
        </div>
        {/* Projects Grid */}
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-medium mb-2" style={{ color: colors.text }}>Recent Projects</h2>
            <p className="text-sm" style={{ color: colors.textSecondary }}>Continue working on your agent designs</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(project => (
              <Card 
                key={project.id} 
                className="p-4 cursor-pointer hover:shadow-lg transition-all duration-200 border"
                style={{ 
                  backgroundColor: colors.panel,
                  borderColor: colors.border
                }}
                onClick={() => openProject(project)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <File className="w-4 h-4" style={{ color: colors.textSecondary }} />
                    <h3 className="font-medium" style={{ color: colors.text }}>{project.name}</h3>
                  </div>
                  <button className="p-1 rounded hover:bg-black/20">
                    <MoreHorizontal className="w-4 h-4" style={{ color: colors.textSecondary }} />
                  </button>
                </div>
                <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>{project.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className={`border ${getStatusColor(project.status)}`}>
                      {project.status}
                    </Badge>
                    <span className="text-xs" style={{ color: colors.textSecondary }}>
                      {project.nodeCount} nodes
                    </span>
                  </div>
                  <span className="text-xs" style={{ color: colors.textSecondary }}>
                    {project.lastModified.toLocaleDateString()}
                  </span>
                </div>
              </Card>
            ))}
            {/* Create New Card */}
            <Card 
              className="p-4 cursor-pointer hover:shadow-lg transition-all duration-200 border-dashed border-2 flex items-center justify-center min-h-[200px]"
              style={{ 
                backgroundColor: colors.panel,
                borderColor: colors.border
              }}
              onClick={createNewProject}
            >
              <div className="text-center">
                <Plus className="w-8 h-8 mx-auto mb-2" style={{ color: colors.textSecondary }} />
                <p className="text-sm font-medium" style={{ color: colors.text }}>Create New Project</p>
                <p className="text-xs" style={{ color: colors.textSecondary }}>Start designing an agent system</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Designer View  
  return (
    <div className="h-screen w-full flex overflow-hidden" style={{ backgroundColor: colors.background }}>
      {/* Left Sidebar */}
      <div className="w-64 border-r flex flex-col" style={{ backgroundColor: colors.sidebar, borderColor: colors.border }}>
        {/* Header */}
        <div className="h-12 border-b flex items-center px-4" style={{ borderColor: colors.border }}>
          <button 
            onClick={() => setCurrentView('projects')}
            className="flex items-center space-x-2 hover:bg-white/5 px-2 py-1 rounded transition-colors"
          >
            <div className="w-6 h-6 rounded-sm flex items-center justify-center" style={{ backgroundColor: colors.accent }}>
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-medium" style={{ color: colors.text }}>AgentFlow</span>
          </button>
        </div>

        {/* Node Library */}
        <div className="flex-1 overflow-auto">
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium" style={{ color: colors.text }}>Components</span>
            </div>
            
            <div className="space-y-3">
              {nodeCategories.map(category => (
                <div key={category.id}>
                  <button
                    onClick={() => toggleSection(category.id as keyof typeof expandedSections)}
                    className="w-full flex items-center space-x-2 p-2 hover:bg-white/5 rounded text-left transition-colors"
                  >
                    {expandedSections[category.id as keyof typeof expandedSections] ? 
                      <ChevronDown className="w-4 h-4" style={{ color: colors.textSecondary }} /> : 
                      <ChevronRight className="w-4 h-4" style={{ color: colors.textSecondary }} />
                    }
                    <span className="text-sm" style={{ color: colors.text }}>{category.name}</span>
                  </button>
                  
                  {expandedSections[category.id as keyof typeof expandedSections] && (
                    <div className="ml-6 space-y-1">
                      {category.nodes.map(node => (
                        <div
                          key={node.id}
                          className="flex items-center space-x-2 p-2 hover:bg-white/5 rounded cursor-pointer transition-colors"
                          onClick={() => addNode(node)}
                        >
                          <div 
                            className="w-3 h-3 rounded-sm"
                            style={{ backgroundColor: node.color }}
                          />
                          <node.icon className="w-4 h-4" style={{ color: colors.textSecondary }} />
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
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="h-12 border-b flex items-center justify-between px-4" style={{ backgroundColor: colors.sidebar, borderColor: colors.border }}>
          <div className="flex items-center space-x-1">
            {tools.map(tool => (
              <button
                key={tool.id}
                onClick={() => setCurrentTool(tool.id)}
                className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
                  currentTool === tool.id 
                    ? 'text-white' 
                    : 'hover:bg-white/10'
                }`}
                style={{ 
                  backgroundColor: currentTool === tool.id ? colors.accent : 'transparent',
                  color: currentTool === tool.id ? 'white' : colors.textSecondary
                }}
                title={`${tool.name} (${tool.shortcut})`}
              >
                <tool.icon className="w-4 h-4" />
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-sm" style={{ color: colors.textSecondary }}>
              {Math.round(viewportTransform.scale * 100)}%
            </span>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => handleZoom(-0.1)}
                className="w-7 h-7 rounded flex items-center justify-center hover:bg-white/10 transition-colors"
                style={{ color: colors.textSecondary }}
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleZoom(0.1)}
                className="w-7 h-7 rounded flex items-center justify-center hover:bg-white/10 transition-colors"
                style={{ color: colors.textSecondary }}
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 border-0"
              style={{ 
                backgroundColor: colors.panel,
                color: colors.text,
                borderColor: colors.border
              }}
            >
              <Play className="w-4 h-4" />
              Test
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 border-0"
              style={{ 
                backgroundColor: colors.panel,
                color: colors.text,
                borderColor: colors.border
              }}
            >
              <Share className="w-4 h-4" />
              Share
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <div
            ref={canvasRef}
            className="absolute inset-0"
            style={{ 
              backgroundColor: colors.background,
              cursor: currentTool === 'hand' || isSpacePressed ? 'grab' : 
                     currentTool === 'connect' ? 'crosshair' : 'default',
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
              `,
              backgroundSize: `${20 * viewportTransform.scale}px ${20 * viewportTransform.scale}px`,
              backgroundPosition: `${viewportTransform.x}px ${viewportTransform.y}px`
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onClick={handleCanvasClick}
          >
            {/* SVG for connections */}
            <svg 
              className="absolute inset-0 pointer-events-none"
              style={{
                transform: `translate(${viewportTransform.x}px, ${viewportTransform.y}px) scale(${viewportTransform.scale})`,
                transformOrigin: '0 0'
              }}
            >
              {connections.map(conn => (
                <path
                  key={conn.id}
                  d={getConnectionPath(conn)}
                  stroke={colors.accent}
                  strokeWidth="2"
                  fill="none"
                  opacity="0.8"
                />
              ))}
            </svg>

            {/* Nodes */}
            <div
              style={{
                transform: `translate(${viewportTransform.x}px, ${viewportTransform.y}px) scale(${viewportTransform.scale})`,
                transformOrigin: '0 0'
              }}
            >
              {nodes.map(node => {
                const IconComponent = node.data.icon
                const isSelected = selectedNode === node.id
                
                return (
                  <div
                    key={node.id}
                    className={`absolute border-2 cursor-pointer transition-all ${
                      isSelected ? 'shadow-lg' : 'hover:shadow-md'
                    }`}
                    style={{
                      left: node.position.x,
                      top: node.position.y,
                      width: node.size.width,
                      height: node.size.height,
                      userSelect: 'none',
                      borderRadius: '4px',
                      backgroundColor: colors.panel,
                      borderColor: isSelected ? colors.accent : colors.border
                    }}
                    onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
                  >
                    {/* Header */}
                    <div 
                      className="h-8 flex items-center justify-center"
                      style={{ 
                        backgroundColor: node.data.color,
                        borderTopLeftRadius: '2px',
                        borderTopRightRadius: '2px'
                      }}
                    >
                      <IconComponent className="w-4 h-4 text-white" />
                    </div>
                    
                    {/* Content */}
                    <div className="p-3">
                      <h4 className="font-medium text-sm mb-1" style={{ color: colors.text }}>
                        {node.data.title}
                      </h4>
                      <p className="text-xs" style={{ color: colors.textSecondary }}>
                        {node.data.description}
                      </p>
                    </div>

                    {/* Input/Output Ports */}
                    {node.inputs.map((input, idx) => (
                      <div
                        key={input.id}
                        className="absolute w-3 h-3 rounded-full border-2 cursor-pointer hover:scale-110 transition-transform"
                        style={{
                          left: -6,
                          top: 40 + idx * 20,
                          backgroundColor: colors.background,
                          borderColor: colors.accent
                        }}
                        onClick={(e) => handleInputClick(node.id, input.id, e)}
                      />
                    ))}
                    
                    {node.outputs.map((output, idx) => (
                      <div
                        key={output.id}
                        className="absolute w-3 h-3 rounded-full border-2 cursor-pointer hover:scale-110 transition-transform"
                        style={{
                          right: -6,
                          top: 40 + idx * 20,
                          backgroundColor: colors.accent,
                          borderColor: colors.accent
                        }}
                        onClick={(e) => handleOutputClick(node.id, output.id, e)}
                      />
                    ))}
                  </div>
                )
              })}
            </div>

            {/* Empty State */}
            {nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div 
                    className="w-16 h-16 border rounded-lg flex items-center justify-center mx-auto mb-4"
                    style={{ 
                      backgroundColor: colors.panel,
                      borderColor: colors.border
                    }}
                  >
                    <Bot className="w-8 h-8" style={{ color: colors.textSecondary }} />
                  </div>
                  <h2 className="text-lg font-medium mb-2" style={{ color: colors.text }}>
                    Start designing your agent
                  </h2>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    Add nodes from the sidebar or press <kbd className="px-2 py-1 bg-white/10 rounded text-xs">C</kbd> to connect
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}