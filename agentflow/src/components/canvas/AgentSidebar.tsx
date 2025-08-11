"use client"

import { Card } from "@/components/primitives/card"
import { Separator } from "@/components/primitives/separator"
import { Search, FileText, Bot, Database, Mail, Calculator, Image, MessageSquare } from "lucide-react"

const microAgents = [
  {
    id: 'writer',
    name: 'Writer Agent',
    description: 'Generates written content from inputs',
    icon: FileText,
    color: 'bg-green-50 text-green-600'
  },
  {
    id: 'searcher',
    name: 'Web Search Agent',
    description: 'Searches and retrieves web content',
    icon: Search,
    color: 'bg-blue-50 text-blue-600'
  },
  {
    id: 'analyzer',
    name: 'Data Analyzer Agent',
    description: 'Analyzes and processes data',
    icon: Bot,
    color: 'bg-purple-50 text-purple-600'
  },
  {
    id: 'database',
    name: 'Database Agent',
    description: 'Queries and manages database operations',
    icon: Database,
    color: 'bg-orange-50 text-orange-600'
  },
  {
    id: 'email',
    name: 'Email Agent',
    description: 'Handles email reading and composition',
    icon: Mail,
    color: 'bg-red-50 text-red-600'
  },
  {
    id: 'calculator',
    name: 'Calculator Agent',
    description: 'Performs mathematical calculations',
    icon: Calculator,
    color: 'bg-yellow-50 text-yellow-600'
  },
  {
    id: 'image',
    name: 'Image Agent',
    description: 'Processes and analyzes images',
    icon: Image,
    color: 'bg-pink-50 text-pink-600'
  },
  {
    id: 'chat',
    name: 'Chat Agent',
    description: 'Handles conversational interactions',
    icon: MessageSquare,
    color: 'bg-indigo-50 text-indigo-600'
  }
]

export function AgentSidebar() {
  const handleDragStart = (e: React.DragEvent, agentType: string) => {
    e.dataTransfer.setData('application/node-type', agentType)
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div className="w-80 border-r border-[var(--figma-border)] bg-[var(--figma-surface)] h-full">
      <div className="border-b border-[var(--figma-border)] p-4">
        <h2 className="font-medium text-[var(--figma-text)]">Micro-Agents</h2>
        <p className="text-sm text-[var(--figma-text-secondary)] mt-1">
          Drag agents onto the canvas to build your system
        </p>
      </div>

      <div className="p-4 space-y-4 h-full overflow-auto figma-scrollbar">
        <div>
          <h3 className="font-medium mb-3 text-sm text-[var(--figma-text)]">Core Agents</h3>
          <div className="space-y-2">
            {microAgents.map((agent) => {
              const IconComponent = agent.icon

              return (
                <Card
                  key={agent.id}
                  className="p-3 cursor-grab hover:bg-[var(--figma-bg)] transition-colors border-[var(--figma-border)] active:cursor-grabbing"
                  draggable
                  onDragStart={(e) => handleDragStart(e, agent.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${agent.color}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-[var(--figma-text)]">{agent.name}</p>
                      <p className="text-xs text-[var(--figma-text-secondary)] mt-1">
                        {agent.description}
                      </p>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="font-medium mb-3 text-sm text-[var(--figma-text)]">Custom Agents</h3>
          <Card className="p-4 border-dashed border-2 border-[var(--figma-border)] text-center">
            <p className="text-sm text-[var(--figma-text-secondary)]">
              Create custom agents
            </p>
            <p className="text-xs text-[var(--figma-text-secondary)] mt-1">
              Coming soon...
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
