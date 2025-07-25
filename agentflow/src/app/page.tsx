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
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        return;
      }

      // Transform the data to match our Project interface
      const transformedProjects: Project[] = (data || []).map(project => ({
        id: project.id,
        name: project.name || 'Untitled Project',
        description: project.description || '',
        lastModified: new Date(project.created_at),
        nodeCount: 0, // We'll calculate this separately if needed
        status: project.status || 'draft'
      }));

      setProjects(transformedProjects);
    } catch (err) {
      console.error('Unexpected error fetching projects:', err);
    }
  };

  const fetchNodes = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('nodes')
        .select('*')
        .eq('project_id', projectId);

      if (error) {
        console.error('Error fetching nodes:', error);
        return;
      }

      // Transform the data to match our CanvasNode interface
      const transformedNodes: CanvasNode[] = (data || []).map(node => ({
        id: node.id,
        type: node.type,
        subtype: node.subtype || '',
        position: node.position || { x: 100, y: 100 },
        size: node.size || { width: 200, height: 100 },
        data: node.data || {
          title: 'Untitled Node',
          description: 'No description',
          color: '#0066cc',
          icon: 'User'
        },
        inputs: [{ id: 'input-1', label: 'Input' }], // Default inputs
        outputs: [{ id: 'output-1', label: 'Output' }] // Default outputs
      }));

      setNodes(transformedNodes);
    } catch (err) {
      console.error('Unexpected error fetching nodes:', err);
    }
  };

  const fetchConnections = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('connections')
        .select('*')
        .eq('project_id', projectId);

      if (error) {
        console.error('Error fetching connections:', error);
        return;
      }

      // Transform the data to match our Connection interface
      const transformedConnections: Connection[] = (data || []).map(conn => ({
        id: conn.id,
        sourceNode: conn.source_node,
        sourceOutput: conn.source_output,
        targetNode: conn.target_node,
        targetInput: conn.target_input
      }));

      setConnections(transformedConnections);
    } catch (err) {
      console.error('Unexpected error fetching connections:', err);
    }
  };

  const handleCreateProject = async (projectData: Omit<Project, 'id' | 'lastModified' | 'nodeCount'>) => {
    try {
      // Create payload that matches your existing schema
      const projectPayload = {
        name: projectData.name || `New Project ${Date.now()}`,
        description: projectData.description || '',
        status: projectData.status || 'draft'
        // Note: No user_id - you might need to add this if your RLS requires it
      };

      console.log('Creating project with payload:', projectPayload);

      const { data, error } = await supabase
        .from('projects')
        .insert([projectPayload])
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating project:', {
          error,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        alert(`Error creating project: ${error.message || 'Unknown error'}`);
        return;
      }

      if (!data) {
        console.error('No data returned from project creation');
        alert('No data returned from project creation');
        return;
      }

      console.log('Project created successfully:', data);

      // Transform the response to match our Project interface
      const newProject: Project = {
        id: data.id,
        name: data.name,
        description: data.description || '',
        lastModified: new Date(data.created_at),
        nodeCount: 0,
        status: data.status
      };

      setProjects(prev => [newProject, ...prev]);
      setCurrentProject(newProject);
      setCurrentView('designer');
    } catch (err) {
      console.error('Unexpected error creating project:', err);
      alert(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
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
    if (!currentProject) {
      console.error('No current project selected');
      return;
    }

    try {
      // Create a unique position for the new node
      const baseX = 100 + (nodes.length * 50);
      const baseY = 100 + (nodes.length * 50);

      // Create payload that matches your existing schema
      const nodePayload = {
        project_id: currentProject.id,
        type: nodeData.type,
        subtype: nodeData.subtype || nodeData.id,
        position: { x: baseX, y: baseY }, // JSON field
        size: { width: 200, height: 100 }, // JSON field
        data: { // JSON field
          title: nodeData.name,
          description: nodeData.description,
          color: nodeData.color,
          icon: nodeData.id // Changed from nodeData.icon.name to nodeData.id
        }
        // Note: No user_id - you might need to add this if your RLS requires it
      };

      console.log('Creating node with payload:', nodePayload);

      const { data, error } = await supabase
        .from('nodes')
        .insert([nodePayload])
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating node:', {
          error,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return;
      }

      if (!data) {
        console.error('No data returned from node creation');
        return;
      }

      // Transform the response to match our CanvasNode interface
      const newNode: CanvasNode = {
        id: data.id,
        type: data.type,
        subtype: data.subtype || '',
        position: data.position || { x: baseX, y: baseY },
        size: data.size || { width: 200, height: 100 },
        data: data.data || {
          title: nodeData.name,
          description: nodeData.description,
          color: nodeData.color,
          icon: nodeData.id // Changed from nodeData.icon.name to nodeData.id
        },
        inputs: [{ id: 'input-1', label: 'Input' }],
        outputs: [{ id: 'output-1', label: 'Output' }]
      };

      setNodes(prev => [...prev, newNode]);
      setSelectedNode(newNode);
    } catch (err) {
      console.error('Unexpected error adding node:', err);
    }
  };

  const handleCreateConnection = async (connectionData: Connection) => {
    if (!currentProject) {
      console.error('No current project selected');
      return;
    }

    try {
      // Create payload that matches your existing schema
      const connectionPayload = {
        project_id: currentProject.id,
        source_node: connectionData.sourceNode,
        source_output: connectionData.sourceOutput,
        target_node: connectionData.targetNode,
        target_input: connectionData.targetInput
        // Note: No user_id - you might need to add this if your RLS requires it
      };

      console.log('Creating connection with payload:', connectionPayload);

      const { data, error } = await supabase
        .from('connections')
        .insert([connectionPayload])
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating connection:', {
          error,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return;
      }

      if (!data) {
        console.error('No data returned from connection creation');
        return;
      }

      // Transform the response to match our Connection interface
      const newConnection: Connection = {
        id: data.id,
        sourceNode: data.source_node,
        sourceOutput: data.source_output,
        targetNode: data.target_node,
        targetInput: data.target_input
      };

      setConnections(prev => [...prev, newConnection]);
    } catch (err) {
      console.error('Unexpected error creating connection:', err);
    }
  };

  // Render
  if (currentView === "projects") {
    return (
      <ProjectDashboard
        projects={projects}
        onCreateProject={() => handleCreateProject({ 
          name: `New Project ${new Date().toLocaleDateString()}`, 
          description: 'A new agent flow project', 
          status: 'draft' 
        })}
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