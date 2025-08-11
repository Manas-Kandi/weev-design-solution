import React, { useState } from 'react';
import { Project } from '@/types';
import { Button } from '@/components/primitives/button';
import { Card } from '@/components/primitives/card';
import { Badge } from '@/components/primitives/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/primitives/tabs';
import { Share2, ArrowLeft } from 'lucide-react';
import FileManager from './components/FileManager';
import MCPModal from '@/components/export/MCPModal';

interface ProjectDetailsProps {
  project: Project;
  onBack: () => void;
  onOpenCanvas: (projectId: string) => void;
}

export default function ProjectDetails({ project, onBack, onOpenCanvas }: ProjectDetailsProps) {
  const [mcpModalOpen, setMcpModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const statusColor = (status: Project['status']) => {
    switch (status) {
      case 'deployed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'testing':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-medium">{project.name}</h1>
            <p className="text-muted-foreground">{project.description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setMcpModalOpen(true)}>
            <Share2 className="w-4 h-4 mr-2" />
            Share MCP
          </Button>
          <Button onClick={() => onOpenCanvas(project.id)}>
            Open Canvas
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-1">Project Details</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={statusColor(project.status)}>
                      {project.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {project.nodeCount} nodes
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Created on {new Date(project.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Last modified on {project.lastModified.toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="files">
          <FileManager projectId={project.id} />
        </TabsContent>
      </Tabs>

      <MCPModal
        isOpen={mcpModalOpen}
        onClose={() => setMcpModalOpen(false)}
        projectId={project.id}
        projectName={project.name}
        onServerStatusChange={() => {}}
      />
    </div>
  );
}
