"use client";

import { useState, useEffect, useCallback } from "react";
import { Project, CanvasNode, Connection, NodeType } from "@/types";
import { supabase } from "@/lib/supabaseClient";
import ProjectDashboard from "@/components/ProjectDashboard";
import DesignerLayout from "@/components/DesignerLayout";
import TabBar from "@/components/TabBar";
import { ComponentLibrary } from "@/components/ComponentLibrary";
import DesignerCanvas from "@/components/DesignerCanvas";
import PropertiesPanel from "@/components/PropertiesPanel";
import { nodeCategories } from "@/data/nodeDefinitions";
import { runWorkflow } from "@/lib/workflowRunner";

const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000000";

export default function AgentFlowPage() {
  const [currentView, setCurrentView] = useState<"projects" | "designer">(
    "projects"
  );
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
        variables: { topic: "inflation" },
      },
      inputs: [],
      outputs: [{ id: "result", label: "Generated Prompt" }],
    },
  ]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [startNodeId, setStartNodeId] = useState<string | null>(
    "prompt-node-1"
  );
  const [selectedNode, setSelectedNode] = useState<CanvasNode | null>(null);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [showTester, setShowTester] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testFlowResult, setTestFlowResult] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [history, setHistory] = useState<CanvasNode[][]>([]);
  const [future, setFuture] = useState<CanvasNode[][]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 1000);
  };

  const handleUndo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setFuture((f) => [nodes, ...f]);
      setNodes(prev);
      showStatus("Undid");
      return h.slice(0, -1);
    });
  }, [nodes]);

  const handleRedo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const [next, ...rest] = f;
      setHistory((h) => [...h, nodes]);
      setNodes(next);
      showStatus("Redid");
      return rest;
    });
  }, [nodes]);

  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        handleUndo();
      } else if (
        (e.metaKey || e.ctrlKey) &&
        (e.key === "y" || (e.shiftKey && e.key === "Z"))
      ) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener("keydown", keyHandler);
    return () => window.removeEventListener("keydown", keyHandler);
  }, [handleUndo, handleRedo]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching projects:", error);
        return;
      }

      // Transform the data to match our Project interface
      const transformedProjects: Project[] = (data || []).map((project) => ({
        id: project.id,
        name: project.name || "Untitled Project",
        description: project.description || "",
        lastModified: new Date(project.created_at),
        nodeCount: 0, // We'll calculate this separately if needed
        status: project.status || "draft",
        startNodeId: project.start_node_id || null,
        created_at: project.created_at,
        user_id: project.user_id || DEFAULT_USER_ID
      }));

      setProjects(transformedProjects);
    } catch (err) {
      console.error("Unexpected error fetching projects:", err);
    }
  };

  const fetchNodes = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from("nodes")
        .select("*")
        .eq("project_id", projectId);

      if (error) {
        console.error("Error fetching nodes:", error);
        return;
      }

      // Transform the data to match our CanvasNode interface
      const transformedNodes: CanvasNode[] = (data || []).map((node) => ({
        id: node.id,
        type: node.type,
        subtype: node.subtype || "",
        position: node.position || { x: 100, y: 100 },
        size: node.size || { width: 200, height: 100 },
        data: node.data || {
          title: "Untitled Node",
          description: "No description",
          color: "#0066cc",
          icon: "User",
        },
        inputs: node.inputs || [{ id: "input-1", label: "Input" }],
        outputs: node.outputs || [{ id: "output-1", label: "Output" }],
      }));

      setNodes(transformedNodes);
    } catch (err) {
      console.error("Unexpected error fetching nodes:", err);
    }
  };

  const fetchConnections = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from("connections")
        .select("*")
        .eq("project_id", projectId);

      if (error) {
        console.error("Error fetching connections:", error);
        return;
      }

      // Transform the data to match our Connection interface
      const transformedConnections: Connection[] = (data || []).map((conn) => ({
        id: conn.id,
        sourceNode: conn.source_node,
        sourceOutput: conn.source_output,
        targetNode: conn.target_node,
        targetInput: conn.target_input,
      }));

      setConnections(transformedConnections);
    } catch (err) {
      console.error("Unexpected error fetching connections:", err);
    }
  };

  const handleStartNodeChange = async (nodeId: string | null) => {
    setStartNodeId(nodeId);
    if (!currentProject) return;
    try {
      const { error } = await supabase
        .from("projects")
        .update({ start_node_id: nodeId })
        .eq("id", currentProject.id);
      if (error) {
        console.error("Error updating start node:", error);
      } else {
        setCurrentProject({ ...currentProject, startNodeId: nodeId });
        setProjects((prev) =>
          prev.map((p) =>
            p.id === currentProject.id ? { ...p, startNodeId: nodeId } : p
          )
        );
      }
    } catch (err) {
      console.error("Unexpected error updating start node:", err);
    }
  };

  const handleCreateProject = async (
    projectData: Omit<Project, "id" | "lastModified" | "nodeCount">
  ) => {
    try {
      // Log environment check
      console.log("Checking Supabase connection...");
      console.log("Supabase URL exists:", !!process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log("Supabase Anon Key exists:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

      // Log input data
      console.log("Creating project with data:", {
        name: projectData.name,
        description: projectData.description,
        status: projectData.status
      });
      
      // Prepare minimal project data
      const newProjectData = {
        name: projectData.name || 'Untitled Project',
        description: projectData.description || '',
        status: 'draft',
        user_id: DEFAULT_USER_ID
      };

      console.log("Attempting to insert project with data:", newProjectData);

      // Try a simple insert first
      let result;
      try {
        result = await supabase
          .from("projects")
          .insert(newProjectData)
          .select()
          .single();
        
        console.log("Insert response:", result);
      } catch (insertErr) {
        console.error("Caught error during insert:", insertErr);
        setStatusMessage("Failed to create project: Network or permission error");
        return;
      }

      const { data: insertedProject, error: insertError } = result;

      if (insertError) {
        console.error("Database error during insert:", {
          message: insertError.message,
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint
        });
        setStatusMessage(`Failed to create project: ${insertError.message}`);
        return;
      }

      // If insert successful, fetch the created project
      const { data, error: selectError } = await supabase
        .from("projects")
        .select('*')
        .eq('name', projectData.name)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (selectError) {
        console.error("Error fetching created project:", selectError);
        setStatusMessage(`Project created but failed to fetch details`);
        return;
      }

      if (!data) {
        console.error("No data returned from project creation");
        setStatusMessage("Failed to create project: No data returned");
        return;
      }

      // Transform the data to match our Project interface
      const newProject: Project = {
        id: data.id,
        name: data.name,
        description: data.description || "",
        lastModified: new Date(data.created_at),
        nodeCount: (data.nodes || []).length,
        status: data.status || "draft",
        startNodeId: data.start_node_id || null,
        created_at: data.created_at,
        user_id: data.user_id
      };

      // Update state
      setProjects([newProject, ...projects]);
      setCurrentProject(newProject);
      setStartNodeId(null);
      setNodes([]);
      setConnections([]);
      setCurrentView("designer");
      
      // Show success message
      setStatusMessage("Project created successfully");
    } catch (err) {
      console.error("Unexpected error creating project:", err);
      setStatusMessage("Failed to create project: Unexpected error");
    }
  };

  const handleOpenProject = async (projectId: string) => {
    const project = projects.find((p) => p.id === projectId) || null;
    setCurrentProject(project);
    setCurrentView("designer");
    if (project) {
      setStartNodeId(project.startNodeId || null);
      await fetchNodes(projectId);
      await fetchConnections(projectId);
    }
  };

  const handleAddNode = async (nodeData: NodeType) => {
    if (!currentProject) return;

    try {
      const nodeCount = nodes.length;
      const baseX = 200 + (nodeCount % 3) * 250;
      const baseY = 100 + Math.floor(nodeCount / 3) * 150;

      // Find node definition
      const nodeDef = nodeCategories
        .flatMap((cat) => cat.nodes)
        .find((n) => n.id === nodeData.id);

      const defaultInputs = nodeDef?.defaultInputs ||
        nodeData.defaultInputs || [
          { id: "input-1", label: "Input", type: "text" },
        ];
      const defaultOutputs = nodeDef?.defaultOutputs ||
        nodeData.defaultOutputs || [
          { id: "output-1", label: "Output", type: "text" },
        ];
      const color = nodeDef?.color || nodeData.color || "#0066cc";
      const icon = nodeDef?.id || nodeData.id;
      const description = nodeDef?.description || nodeData.description || "";
      const title = nodeDef?.name || nodeData.name || "Untitled Node";
      const subtype =
        nodeDef?.subtype || nodeData.subtype || nodeDef?.id || nodeData.id;

      // Build proper data structure based on node type
      let nodeSpecificData: Record<string, unknown> = {
        title,
        description,
        color,
        icon,
      };

      // Add type-specific data
      if (subtype === "agent" || subtype === "generic") {
        nodeSpecificData = {
          ...nodeSpecificData,
          systemPrompt: nodeDef?.systemPrompt || "",
          personality: nodeDef?.personality || "",
          escalationLogic: nodeDef?.escalationLogic || "",
          confidenceThreshold: nodeDef?.confidenceThreshold || 0.7,
          model: "gemini-pro",
          prompt: "",
        };
      } else if (subtype === "tool-agent") {
        nodeSpecificData = {
          ...nodeSpecificData,
          toolConfig: {
            toolType: "web-search",
            parameters: {},
          },
          prompt: "",
        };
      } else if (subtype === "prompt-template" || subtype === "template") {
        nodeSpecificData = {
          ...nodeSpecificData,
          template: "Hello {{name}}, welcome to {{place}}!",
          variables: { name: "", place: "" },
        };
      } else if (subtype === "message") {
        nodeSpecificData = {
          ...nodeSpecificData,
          content: "Enter your message here...",
          messageType: "user",
        };
      }

      const newNode: CanvasNode = {
        id: `${subtype}-${Date.now()}`,
        type: nodeDef?.type || nodeData.type || "conversation",
        subtype: subtype,
        position: { x: baseX, y: baseY },
        size: { width: 250, height: 120 },
        data: nodeSpecificData,
        inputs: defaultInputs,
        outputs: defaultOutputs,
      };

      setNodes([...nodes, newNode]);
    } catch (err) {
      console.error("Error adding node:", err);
    }
  };

  const handleNodeUpdate = (updatedNode: CanvasNode) => {
    setHistory((h) => [...h, nodes]);
    setNodes(nodes.map((n) => (n.id === updatedNode.id ? updatedNode : n)));
    setFuture([]);
    showStatus("Saved");
  };

  const handleTestFlow = async () => {
    setIsTesting(true);
    setTestFlowResult(null);

    try {
      const result = await runWorkflow(
        nodes,
        connections,
        startNodeId
      );

      setTestFlowResult(result);
    } catch (err) {
      console.error("Error running workflow:", err);
      setTestFlowResult({
        error: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Debug logging for connections state
  useEffect(() => {
    console.log("Connections state updated:", connections);
  }, [connections]);

  // Render
  if (currentView === "projects") {
    return (
      <ProjectDashboard
        projects={projects}
        onCreateProject={() =>
          handleCreateProject({
            name: `New Project ${new Date().toLocaleDateString()}`,
            description: "A new agent flow project",
            status: "draft",
            created_at: new Date().toISOString(),
            user_id: DEFAULT_USER_ID
          })
        }
        onOpenProject={handleOpenProject}
      />
    );
  }

  return (
    <>
      <TabBar onTest={handleTestFlow} testButtonDisabled={isTesting} />
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
            selectedNode={selectedNode}
            onNodeSelect={setSelectedNode}
            onNodeUpdate={handleNodeUpdate}
            onConnectionsChange={setConnections}
            onCreateConnection={async () => {
              // TODO: Implement connection creation logic if needed
            }}
            showTester={showTester}
            testFlowResult={testFlowResult}
            setShowTester={setShowTester}
            setTestFlowResult={setTestFlowResult}
            onTestFlow={handleTestFlow}
            testButtonDisabled={isTesting}
            startNodeId={startNodeId}
            onStartNodeChange={handleStartNodeChange}
          />
        }
        right={
          <PropertiesPanel
            selectedNode={selectedNode}
            onChange={handleNodeUpdate}
          />
        }
      />
      {statusMessage && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-3 py-1 rounded shadow">
          {statusMessage}
        </div>
      )}
    </>
  );
}
