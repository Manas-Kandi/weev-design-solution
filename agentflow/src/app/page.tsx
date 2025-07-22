"use client"

import { useState, useRef, useCallback, useEffect } from 'react'
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
  Lock
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
  }
}

interface Tool {
  id: string
  name: string
  icon: any
  shortcut: string
}

export default function AgentFlowDesigner() {
  const [currentTool, setCurrentTool] = useState('select')
  const [nodes, setNodes] = useState<CanvasNode[]>([])
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [viewportTransform, setViewportTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [isSpacePressed, setIsSpacePressed] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    agents: true,
    templates: false
  })
  
  const canvasRef = useRef<HTMLDivElement>(null)
  const lastPanPoint = useRef({ x: 0, y: 0 })

  // Agent types with Figma-like styling
  const agentTypes = [
    { id: 'writer', name: 'Writer Agent', icon: FileText, color: '#10B981' },
    { id: 'searcher', name: 'Search Agent', icon: Search, color: '#3B82F6' },
    { id: 'email', name: 'Email Agent', icon: Mail, color: '#EF4444' },
    { id: 'calculator', name: 'Calculator Agent', icon: Calculator, color: '#F59E0B' },
    { id: 'image', name: 'Image Agent', icon: ImageIcon, color: '#8B5CF6' },
    { id: 'database', name: 'Database Agent', icon: Database, color: '#F97316' },
    { id: 'chat', name: 'Chat Agent', icon: MessageSquare, color: '#6366F1' },
  ]

  const tools: Tool[] = [
    { id: 'select', name: 'Move', icon: MousePointer, shortcut: 'V' },
    { id: 'hand', name: 'Hand', icon: Hand, shortcut: 'H' },
    { id: 'agent', name: 'Agent', icon: Bot, shortcut: 'A' },
    { id: 'text', name: 'Text', icon: FileText, shortcut: 'T' },
    { id: 'shape', name: 'Shape', icon: Square, shortcut: 'R' },
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
      if (e.key.toLowerCase() === 'a') setCurrentTool('agent')
      if (e.key === 'Escape') setSelectedNode(null)
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return
    
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = (e.clientX - rect.left - viewportTransform.x) / viewportTransform.scale
    const y = (e.clientY - rect.top - viewportTransform.y) / viewportTransform.scale

    if (currentTool === 'agent') {
      const agentType = agentTypes[0] // Default to first agent type
      const newNode: CanvasNode = {
        id: `agent-${Date.now()}`,
        type: agentType.id,
        position: { x: x - 75, y: y - 50 },
        size: { width: 150, height: 100 },
        data: {
          title: agentType.name,
          description: 'New agent',
          color: agentType.color,
          icon: agentType.icon
        }
      }
      setNodes(prev => [...prev, newNode])
      setSelectedNode(newNode.id)
    } else {
      setSelectedNode(null)
    }
  }, [currentTool, viewportTransform])

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
  }, [isPanning])

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [])

  const handleZoom = (delta: number) => {
    setViewportTransform(prev => ({
      ...prev,
      scale: Math.max(0.1, Math.min(2, prev.scale + delta))
    }))
  }

  const handleNodeClick = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedNode(nodeId)
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  return (
    <div className="h-screen w-full bg-gray-900 flex overflow-hidden">
      {/* Left Sidebar - Figma Style */}
      <div className="w-60 bg-gray-800 border-r border-gray-700 flex flex-col">
        {/* File Tab */}
        <div className="h-12 border-b border-gray-700 flex items-center px-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="text-white text-sm font-medium">AgentFlow</span>
          </div>
        </div>

        {/* Layers Panel */}
        <div className="flex-1 overflow-hidden">
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white text-sm font-medium">Layers</span>
              <button className="p-1 hover:bg-gray-700 rounded">
                <Plus className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            
            <div className="space-y-1">
              {/* Agent Section */}
              <div>
                <button
                  onClick={() => toggleSection('agents')}
                  className="w-full flex items-center space-x-2 p-2 hover:bg-gray-700 rounded text-left"
                >
                  {expandedSections.agents ? 
                    <ChevronDown className="w-4 h-4 text-gray-400" /> : 
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  }
                  <Folder className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300 text-sm">Agents</span>
                </button>
                
                {expandedSections.agents && (
                  <div className="ml-6 space-y-1">
                    {agentTypes.map(agent => (
                      <div
                        key={agent.id}
                        className="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded cursor-pointer"
                        onClick={() => {
                          const newNode: CanvasNode = {
                            id: `agent-${Date.now()}`,
                            type: agent.id,
                            position: { x: 200, y: 200 },
                            size: { width: 150, height: 100 },
                            data: {
                              title: agent.name,
                              description: 'New agent',
                              color: agent.color,
                              icon: agent.icon
                            }
                          }
                          setNodes(prev => [...prev, newNode])
                        }}
                      >
                        <div 
                          className="w-3 h-3 rounded-sm"
                          style={{ backgroundColor: agent.color }}
                        />
                        <agent.icon className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-300 text-sm">{agent.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Current Nodes */}
              {nodes.map(node => (
                <div
                  key={node.id}
                  className={`flex items-center space-x-2 p-2 hover:bg-gray-700 rounded cursor-pointer ${
                    selectedNode === node.id ? 'bg-blue-600' : ''
                  }`}
                  onClick={() => setSelectedNode(node.id)}
                >
                  <Eye className="w-4 h-4 text-gray-400" />
                  <div 
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: node.data.color }}
                  />
                  <span className="text-gray-300 text-sm">{node.data.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="h-12 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4">
          <div className="flex items-center space-x-1">
            {tools.map(tool => (
              <button
                key={tool.id}
                onClick={() => setCurrentTool(tool.id)}
                className={`w-9 h-9 rounded flex items-center justify-center transition-colors ${
                  currentTool === tool.id 
                    ? 'bg-blue-600 text-white' 
                    : 'hover:bg-gray-700 text-gray-400'
                }`}
                title={`${tool.name} (${tool.shortcut})`}
              >
                <tool.icon className="w-4 h-4" />
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-gray-400 text-sm">
              {Math.round(viewportTransform.scale * 100)}%
            </span>
            <button
              onClick={() => handleZoom(-0.1)}
              className="w-8 h-8 rounded flex items-center justify-center hover:bg-gray-700 text-gray-400"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleZoom(0.1)}
              className="w-8 h-8 rounded flex items-center justify-center hover:bg-gray-700 text-gray-400"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors flex items-center gap-2">
              <Play className="w-4 h-4" />
              Test
            </button>
            <button className="px-3 py-1.5 bg-gray-700 text-gray-300 text-sm rounded hover:bg-gray-600 transition-colors flex items-center gap-2">
              <Share className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative">
          <div
            ref={canvasRef}
            className="absolute inset-0 bg-gray-900"
            style={{ 
              cursor: currentTool === 'hand' || isSpacePressed ? 'grab' : 'default',
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: `${20 * viewportTransform.scale}px ${20 * viewportTransform.scale}px`,
              backgroundPosition: `${viewportTransform.x}px ${viewportTransform.y}px`
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onClick={handleCanvasClick}
          >
            {/* Agent Nodes */}
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
                    className={`absolute bg-gray-800 border-2 cursor-pointer transition-all ${
                      isSelected ? 'border-blue-500' : 'border-gray-600 hover:border-gray-500'
                    }`}
                    style={{
                      left: node.position.x,
                      top: node.position.y,
                      width: node.size.width,
                      height: node.size.height,
                      userSelect: 'none'
                    }}
                    onClick={(e) => handleNodeClick(node.id, e)}
                  >
                    <div 
                      className="h-8 flex items-center justify-center"
                      style={{ backgroundColor: node.data.color }}
                    >
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <div className="p-3">
                      <h4 className="font-medium text-sm text-white">{node.data.title}</h4>
                      <p className="text-xs text-gray-400 mt-1">{node.data.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Empty State */}
            {nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-800 border border-gray-600 flex items-center justify-center mx-auto mb-4">
                    <Bot className="w-8 h-8 text-gray-400" />
                  </div>
                  <h2 className="text-lg font-medium text-gray-300 mb-2">Start designing agents</h2>
                  <p className="text-gray-500 text-sm">Add agents from the sidebar or press A to create</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Sidebar - Properties */}
      {selectedNode && (
        <div className="w-72 bg-gray-800 border-l border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-medium">Properties</h3>
            <button
              onClick={() => setSelectedNode(null)}
              className="p-1 hover:bg-gray-700 rounded text-gray-400"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">Name</label>
              <input
                type="text"
                className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                defaultValue="Writer Agent"
              />
            </div>
            
            <div>
              <label className="block text-gray-400 text-sm mb-2">Type</label>
              <select className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                {agentTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-gray-400 text-sm mb-2">Personality</label>
              <select className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                <option>Professional</option>
                <option>Friendly</option>
                <option>Technical</option>
                <option>Creative</option>
              </select>
            </div>
            
            <div>
              <label className="block text-gray-400 text-sm mb-2">Instructions</label>
              <textarea
                className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
                rows={4}
                placeholder="Define how this agent should behave..."
              />
            </div>
            
            <button className="w-full py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
              Test Agent
            </button>
          </div>
        </div>
      )}
    </div>
  )
}