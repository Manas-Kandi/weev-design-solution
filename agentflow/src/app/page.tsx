"use client";

import { useState, useEffect } from "react";
import { Project, CanvasNode, Connection, NodeType } from "@/types";
import { supabase } from '@/lib/supabaseClient';
import ProjectDashboard from "@/components/ProjectDashboard";
import DesignerLayout from "@/components/DesignerLayout";
import { ComponentLibrary } from "@/components/ComponentLibrary";
import DesignerCanvas from "@/components/DesignerCanvas";
import PropertiesPanel from "@/components/PropertiesPanel";
import { nodeCategories } from "@/data/nodeDefinitions";
import { runWorkflow } from "@/lib/workflowRunner";

const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000000';

export default function AgentFlowPage() {
  const [currentView, setCurrentView] = useState<'projects' | 'designer'>("projects");
  const [projects, setProjects] = useState<Project[]>([]);
  const [nodes, setNodes] = useState<CanvasNode[]>([
    {
      id: "prompt-node-1",
      type: "conversation",
      subtype: "template",
      position: { x: 100, y: 100 },
      size: { width: 300, height: 200 },
      data: {
        title: "Email Template",
        description: "Insert a topic into a predefined email",
        icon: "📄",
        color: "#6d28d9",
        template: "Dear students, today we will discuss {{topic}}.",
        variables: { topic: "inflation" }
      },
      inputs: [],
      outputs: [{ id: "result", label: "Generated Prompt" }]
    }
  ]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNode, setSelectedNode] = useState<CanvasNode | null>(null);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [showTester, setShowTester] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testFlowResult, setTestFlowResult] = useState<Record<string, unknown> | null>(null);

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
        inputs: node.inputs || [{ id: 'input-1', label: 'Input' }],
        outputs: node.outputs || [{ id: 'output-1', label: 'Output' }]
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
      const projectPayload = {
        name: projectData.name || `New Project ${Date.now()}`,
        description: projectData.description || '',
        status: projectData.status || 'draft',
        user_id: DEFAULT_USER_ID // Use proper UUID
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

      // Find the node definition from nodeCategories
      const nodeDef = nodeCategories
        .flatMap(cat => cat.nodes)
        .find(n => n.id === nodeData.id);

      if (!nodeDef) {
        console.warn('Node definition not found for id:', nodeData.id);
      }

      // Use nodeDef for inputs/outputs, color, icon, etc. Fallback to nodeData if missing
      const defaultInputs = nodeDef?.defaultInputs || nodeData.defaultInputs || [{ id: 'input-1', label: 'Input', type: 'text' }];
      const defaultOutputs = nodeDef?.defaultOutputs || nodeData.defaultOutputs || [{ id: 'output-1', label: 'Output', type: 'text' }];
      const color = nodeDef?.color || nodeData.color || '#0066cc';
      const icon = nodeDef?.id || nodeData.id;
      const description = nodeDef?.description || nodeData.description || '';
      const title = nodeDef?.name || nodeData.name || 'Untitled Node';
      const subtype = nodeDef?.subtype || nodeData.subtype || nodeDef?.id || nodeData.id;

      // Create payload that matches your existing schema
      const nodePayload = {
        project_id: currentProject.id,
        user_id: DEFAULT_USER_ID, // Use proper UUID instead of 'default-user'
        type: nodeDef?.type || nodeData.type,
        subtype,
        position: { x: baseX, y: baseY }, // JSON field
        size: { width: 200, height: 100 }, // JSON field
        data: { // JSON field
          title,
          description,
          color,
          icon
        },
        inputs: defaultInputs,
        outputs: defaultOutputs
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
          title,
          description,
          color,
          icon
        },
        inputs: data.inputs || defaultInputs,
        outputs: data.outputs || defaultOutputs
      };

      console.log('Node created and added to canvas:', newNode);
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
        // Don't return here - we might still want to add to local state
        // or handle this gracefully
        throw new Error(`Failed to create connection in database: ${error.message}`);
      }

      if (!data) {
        console.error('No data returned from connection creation');
        throw new Error('No data returned from connection creation');
      }

      console.log('Connection created in database:', data);

      // Transform the response to match our Connection interface
      const newConnection: Connection = {
        id: data.id,
        sourceNode: data.source_node,
        sourceOutput: data.source_output,
        targetNode: data.target_node,
        targetInput: data.target_input
      };

      console.log('Adding connection to local state:', newConnection);

      // Update local state
      setConnections(prev => {
        const updated = [...prev, newConnection];
        console.log('Updated connections array:', updated);
        return updated;
      });

      console.log('Connection successfully created and added to state!');

    } catch (err) {
      console.error('Unexpected error creating connection:', err);
      // For now, let's still add it to local state even if DB fails
      // This will at least show the connection visually while you debug
      console.log('Adding connection to local state despite error...');
      setConnections(prev => [...prev, connectionData]);
    }
  };

  const handleNodeUpdate = (updatedNode: CanvasNode) => {
    console.log('handleNodeUpdate received:', updatedNode.data); // Debug log
    setNodes(prevNodes => {
      const updated = prevNodes.map(node =>
        node.id === updatedNode.id ? updatedNode : node
      );
      console.log('Updated nodes array:', updated); // Debug log
      return updated;
    });
    setSelectedNode(updatedNode);
    // Also save to database
    supabase
      .from('nodes')
      .update({ 
        data: updatedNode.data,
        position: updatedNode.position,
        size: updatedNode.size 
      })
      .eq('id', updatedNode.id)
      .then(result => console.log('Supabase node update result:', result)); // Debug log
  };

  const handleTestFlow = async () => {
    setShowTester(true);
    setIsTesting(true);
    try {
      const result = await runWorkflow(nodes, connections);
      setTestFlowResult(result);
    } catch (err) {
      setTestFlowResult({ error: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setIsTesting(false);
    }
  };

  // Debug logging for connections state
  useEffect(() => {
    console.log('Connections state updated:', connections);
  }, [connections]);

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
          onNodeSelect={setSelectedNode}
          onNodeUpdate={updatedNode => {
            setNodes(nodes.map(n => n.id === updatedNode.id ? updatedNode : n));
          }}
          onConnectionsChange={setConnections}
          onCreateConnection={async (connectionData) => {
            // ...existing logic...
          }}
          showTester={showTester}
          isTesting={isTesting}
          testFlowResult={testFlowResult}
          setShowTester={setShowTester}
          setTestFlowResult={setTestFlowResult}
          setNodes={setNodes} // <-- Pass setNodes for node deletion
        />
      }
      right={
        <PropertiesPanel
          selectedNode={selectedNode}
          onChange={handleNodeUpdate}
        />
      }
      onTestFlow={handleTestFlow}
      testButtonDisabled={isTesting}
    />
  );
}