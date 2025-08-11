import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/primitives/tabs';
import { Card } from '@/components/primitives/card';
import { Button } from '@/components/primitives/button';
import { Share2 } from 'lucide-react';
import FileManager from './components/FileManager';
import MCPModal from './components/MCPModal';

interface ProjectViewProps {
  project: {
    id: string;
    name: string;
    description: string;
    status: string;
    created_at: string;
  };
  onOpenCanvas: (projectId: string) => void;
}

export default function ProjectView({ project, onOpenCanvas }: ProjectViewProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [mcpModalOpen, setMcpModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-medium">{project.name}</h1>
          <p className="text-muted-foreground">{project.description}</p>
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
                <p className="text-sm text-muted-foreground">
                  Created on {new Date(project.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-1">Status</h3>
                <p className="text-sm text-muted-foreground">
                  {project.status}
                </p>
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
