"use client";

import { useState, useEffect } from "react";
import { Project, CanvasNode, Connection, NodeType } from "@/types";
import { supabase } from "@/lib/supabaseClient";
import ProjectDashboard from "@/components/ProjectDashboard";
import DesignerLayout from "@/components/DesignerLayout";
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
  const [selectedNode, setSelectedNode] = useState<CanvasNode | null>(null);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [showTester, setShowTester] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testFlowResult, setTestFlowResult] = useState<Record<
    string,
    unknown
  > | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

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

  const handleCreateProject = async (
    projectData: Omit<Project, "id" | "lastModified" | "nodeCount">
  ) => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .insert([
          {
            name: projectData.name,
            description: projectData.description,
            status: projectData.status,
            user_id: DEFAULT_USER_ID,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Error creating project:", error);
        return;
      }

      const newProject: Project = {
        id: data.id,
        name: data.name,
        description: data.description || "",
        lastModified: new Date(data.created_at),
        nodeCount: 0,
        status: data.status || "draft",
      };

      setProjects([newProject, ...projects]);
      setCurrentProject(newProject);
      setCurrentView("designer");
    } catch (err) {
      console.error("Unexpected error creating project:", err);
    }
  };

  const handleOpenProject = async (projectId: string) => {
    const project = projects.find((p) => p.id === projectId) || null;
    setCurrentProject(project);
    setCurrentView("designer");
    if (project) {
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
    setNodes(nodes.map((n) => (n.id === updatedNode.id ? updatedNode : n)));
  };

  const handleTestFlow = async () => {
    setIsTesting(true);
    setTestFlowResult(null);

    try {
      const result = await runWorkflow(
        nodes,
        connections,
        nodes[0]?.id // Use first node as start node for now
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
          })
        }
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
          selectedNode={selectedNode}
          onNodeSelect={setSelectedNode}
          onNodeUpdate={(updatedNode) => {
            setNodes(
              nodes.map((n) => (n.id === updatedNode.id ? updatedNode : n))
            );
          }}
          onConnectionsChange={setConnections}
          onCreateConnection={async () => {
            // TODO: Implement connection creation logic if needed
          }}
          showTester={showTester}
          isTesting={isTesting}
          testFlowResult={testFlowResult}
          setShowTester={setShowTester}
          setTestFlowResult={setTestFlowResult}
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
