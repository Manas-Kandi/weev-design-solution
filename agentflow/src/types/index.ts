export interface CanvasNode {
  id: string
  type: 'agent' | 'gui' | 'logic'
  subtype: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  data: {
    title: string
    description: string
    color: string
    icon: string
    content?: string
    config?: Record<string, unknown>
  }
  inputs: { id: string; label: string; type?: string }[]
  outputs: { id: string; label: string; type?: string }[]
}

export interface Connection {
  id: string
  sourceNode: string
  sourceOutput: string
  targetNode: string
  targetInput: string
}

export interface Project {
  id: string
  name: string
  description: string
  lastModified: Date
  nodeCount: number
  status: 'draft' | 'testing' | 'deployed'
  nodes?: CanvasNode[]
  connections?: Connection[]
}

export interface Tool {
  id: string
  name: string
  icon: string
  shortcut: string
}

export interface NodeCategory {
  id: string
  name: string
  type: 'agent' | 'gui' | 'logic'
  nodes: NodeType[]
}

export interface NodeType {
  id: string
  name: string
  icon: React.ElementType
  color: string
  description: string
  type: 'agent' | 'gui' | 'logic'
  subtype?: string
  defaultInputs?: { id: string; label: string; type?: string }[]
  defaultOutputs?: { id: string; label: string; type?: string }[]
}

export interface ViewportTransform {
  x: number
  y: number
  scale: number
}

export interface Colors {
  background: string
  sidebar: string
  panel: string
  border: string
  text: string
  textSecondary: string
  accent: string
  success: string
  warning: string
  error: string
  purple: string
  orange: string
  blue: string
  green: string
}
