"use client"

import { useState, useRef, useCallback } from 'react'
import { Bot, MessageSquare, Search, FileText } from 'lucide-react'

interface CanvasNode {
  id: string
  type: 'writer' | 'searcher' | 'analyzer' | 'custom'
  position: { x: number; y: number }
  title: string
  description: string
}

interface CanvasProps {
  onNodeSelect: (nodeId: string | null) => void
  selectedNode: string | null
}

export function Canvas({ onNodeSelect, selectedNode }: CanvasProps) {
  const [nodes, setNodes] = useState<CanvasNode[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [draggedNode, setDraggedNode] = useState<string | null>(null)
  const [viewportTransform, setViewportTransform] = useState({ x: 0, y: 0, scale: 1 })
  const canvasRef = useRef<HTMLDivElement>(null)

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'writer': return FileText
      case 'searcher': return Search
      case 'analyzer': return Bot
      default: return MessageSquare
    }
  }

  const handleNodeDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const nodeType = e.dataTransfer.getData('application/node-type')
    
    if (!nodeType || !canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left - viewportTransform.x) / viewportTransform.scale
    const y = (e.clientY - rect.top - viewportTransform.y) / viewportTransform.scale

    const newNode: CanvasNode = {
      id: `node-${Date.now()}`,
      type: nodeType as any,
      position: { x, y },
      title: `${nodeType} Agent`,
      description: `A ${nodeType} micro-agent`
    }

    setNodes(prev => [...prev, newNode])
  }, [viewportTransform])

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation()
    setDraggedNode(nodeId)
    setIsDragging(true)
    onNodeSelect(nodeId)

    const node = nodes.find(n => n.id === nodeId)
    if (node) {
      setDragOffset({
        x: e.clientX - node.position.x * viewportTransform.scale - viewportTransform.x,
        y: e.clientY - node.position.y * viewportTransform.scale - viewportTransform.y
      })
    }
  }

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !draggedNode) return

    const newX = (e.clientX - dragOffset.x - viewportTransform.x) / viewportTransform.scale
    const newY = (e.clientY - dragOffset.y - viewportTransform.y) / viewportTransform.scale

    setNodes(prev => prev.map(node => 
      node.id === draggedNode 
        ? { ...node, position: { x: newX, y: newY } }
        : node
    ))
  }, [isDragging, draggedNode, dragOffset, viewportTransform])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDraggedNode(null)
  }, [])

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onNodeSelect(null)
    }
  }

  return (
    <div 
      ref={canvasRef}
      className="relative w-full h-full overflow-hidden bg-gray-50 cursor-grab"
      onDrop={handleNodeDrop}
      onDragOver={(e) => e.preventDefault()}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={handleCanvasClick}
      style={{
        backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
        backgroundSize: `${20 * viewportTransform.scale}px ${20 * viewportTransform.scale}px`,
        backgroundPosition: `${viewportTransform.x}px ${viewportTransform.y}px`
      }}
    >
      {/* Transform container */}
      <div 
        style={{
          transform: `translate(${viewportTransform.x}px, ${viewportTransform.y}px) scale(${viewportTransform.scale})`,
          transformOrigin: '0 0'
        }}
      >
        {nodes.map(node => {
          const IconComponent = getNodeIcon(node.type)
          const isSelected = selectedNode === node.id
          
          return (
            <div
              key={node.id}
              className={`absolute bg-white rounded-lg border-2 p-4 cursor-pointer shadow-sm hover:shadow-md transition-all min-w-[200px] ${
                isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
              }`}
              style={{
                left: node.position.x,
                top: node.position.y,
                userSelect: 'none'
              }}
              onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <IconComponent className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-sm text-gray-900">{node.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{node.description}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty state */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-gray-400" />
            </div>
            <div className="text-lg font-medium text-gray-400 mb-2">
              Start building your agent system
            </div>
            <div className="text-sm text-gray-400">
              Drag micro-agents from the sidebar to begin
            </div>
          </div>
        </div>
      )}
    </div>
  )
}