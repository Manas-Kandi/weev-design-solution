"use client";

import { useState, useEffect } from "react";
import { Project, CanvasNode, Connection, NodeType } from "@/types";
import { supabase } from '@/lib/supabaseClient';
import ProjectDashboard from "@/components/ProjectDashboard";
import DesignerLayout from "@/components/DesignerLayout";
import { ComponentLibrary } from "@/components/ComponentLibrary";
import DesignerCanvas from "@/components/DesignerCanvas";
import PropertiesPanel from "@/components/PropertiesPanel";

export default function AgentFlowPage() {
  const [currentView, setCurrentView] = useState<'projects' | 'designer'>("projects");
  const [projects, setProjects] = useState<Project[]>([]);
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNode, setSelectedNode] = useState<CanvasNode | null>(null);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select();

    if (error) console.error('Error fetching projects:', error);
    setProjects(data || []);
  };

  const fetchNodes = async (projectId: string) => {
    const { data, error } = await supabase
      .from('nodes')
      .select()
      .eq('project_id', projectId);

    if (error) console.error('Error fetching nodes:', error);
    setNodes(data || []);
  };

  const fetchConnections = async (projectId: string) => {
    const { data, error } = await supabase
      .from('connections')
      .select()
      .eq('project_id', projectId);

    if (error) console.error('Error fetching connections:', error);
    setConnections(data || []);
  };

  const handleCreateProject = async (projectData: Omit<Project, 'id' | 'lastModified' | 'nodeCount'>) => {
    const { data, error } = await supabase
      .from('projects')
      .insert([projectData])
      .select();

    if (error) {
      console.error('Error creating project:', error);
      return;
    }

    setProjects(prev => [...prev, data[0]]);
    setCurrentProject(data[0]);
    setCurrentView('designer');
  };

  const handleOpenProject = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId) || null;
    setCurrentProject(project);
    setCurrentView('designer');
    if (project) {
      await fetchNodes(projectId);
      await fetchConnections(projectId);
    }
  };

  const handleAddNode = async (nodeData: NodeType) => {
    if (!currentProject) return;
    const { data, error } = await supabase
      .from('nodes')
      .insert([{
        ...nodeData,
        project_id: currentProject.id
      }])
      .select();

    if (error) {
      console.error('Error adding node:', error);
      return;
    }

    setNodes(prev => [...prev, data[0]]);
    setSelectedNode(data[0]);
  };

  const handleCreateConnection = async (connectionData: Connection) => {
    if (!currentProject) return;
    const { data, error } = await supabase
      .from('connections')
      .insert([{
        ...connectionData,
        project_id: currentProject.id
      }])
      .select();

    if (error) {
      console.error('Error creating connection:', error);
      return;
    }

    setConnections(prev => [...prev, data[0]]);
  };

  // Render
  if (currentView === "projects") {
    return (
      <ProjectDashboard
        projects={projects}
        onCreateProject={() => handleCreateProject({ name: '', description: '', status: 'draft' })}
        onOpenProject={handleOpenProject}
      />
    );
  }

  return (
    <DesignerLayout
      left={
        <ComponentLibrary
          onAddNode={handleAddNode}
          onBackToProjects={() => setCurrentView("projects")}
        />
      }
      center={
        <DesignerCanvas
          nodes={nodes}
          connections={connections}
          onNodeSelect={(n: CanvasNode | null) => setSelectedNode(n)}
          selectedNodeId={selectedNode ? selectedNode.id : null}
          onConnectionsChange={(updatedConnections: Connection[]) => setConnections(updatedConnections)}
          onCreateConnection={handleCreateConnection}
          onNodeUpdate={(updatedNode: CanvasNode) => {
            setNodes(prevNodes =>
              prevNodes.map(node => node.id === updatedNode.id ? updatedNode : node)
            );
            if (selectedNode && selectedNode.id === updatedNode.id) {
              setSelectedNode(updatedNode);
            }
          }}
        />
      }
      right={
        <PropertiesPanel
          selectedNode={selectedNode}
          onChange={(updatedNode: CanvasNode) => {
            // Handle node update logic here
          }}
        />
      }
    />
  );
}