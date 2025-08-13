"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Project, CanvasNode, Connection, NodeType } from "@/types";
import { supabase } from "@/lib/supabaseClient";
import CleanDashboard from "@/components/dashboard/CleanDashboard";
import DesignerLayout from "@/components/layout/DesignerLayout";
import ChatPanel from "@/components/chat/ChatPanel";

import { ComponentLibrary } from "@/components/canvas/ComponentLibrary";
import DesignerCanvas from "@/components/canvas/DesignerCanvas";
import { nodeCategories } from "@/data/nodeDefinitions";
import { runWorkflow } from "@/lib/workflowRunner";
import { TESTER_V2_ENABLED } from "@/lib/flags";

const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000000";

// Helper: attach auth token from Supabase session
async function buildHeaders(json: boolean = true): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  if (json) headers["Content-Type"] = "application/json";
  try {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (token) headers["Authorization"] = `Bearer ${token}`;
  } catch {
    // no session available; fall back to no auth header
  }
  return headers;
}

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

  const showStatus = useCallback((msg: string) => {
    setStatusMessage(msg);
    const timeoutId = setTimeout(() => setStatusMessage(null), 1000);
    return () => clearTimeout(timeoutId);
  }, []);

  // Replace current flow with data imported from MCP
  const handleReplaceFlowFromMcp = async (payload: { nodes: CanvasNode[]; connections: Connection[]; startNodeId: string | null }) => {
    if (!currentProject) return;
    const projectId = currentProject.id;
    const headersAuth = await buildHeaders(true);

    try {
      // 1) Fetch existing server-side nodes and connections
      const [resNodes, resConns] = await Promise.all([
        fetch(`/api/projects/${projectId}/nodes?project_id=${projectId}`, { headers: await buildHeaders(false) }),
        fetch(`/api/projects/${projectId}/connections?project_id=${projectId}`, { headers: await buildHeaders(false) }),
      ]);
      const existingNodes: any[] = resNodes.ok ? await resNodes.json().catch(() => []) : [];
      const existingConns: any[] = resConns.ok ? await resConns.json().catch(() => []) : [];

      // 2) Delete existing connections, then nodes (server state)
      for (const c of existingConns) {
        await fetch(`/api/projects/${projectId}/connections`, {
          method: 'DELETE',
          headers: headersAuth,
          body: JSON.stringify({ id: c.id, project_id: projectId }),
        });
      }
      for (const n of existingNodes) {
        await fetch(`/api/projects/${projectId}/nodes`, {
          method: 'DELETE',
          headers: headersAuth,
          body: JSON.stringify({ id: n.id, project_id: projectId }),
        });
      }

      // 3) Use MCP-provided IDs directly (assumes they are unique within the flow)
      const nextNodes: CanvasNode[] = payload.nodes;

      // 4) Persist nodes
      for (const n of nextNodes) {
        await fetch(`/api/projects/${projectId}/nodes`, {
          method: 'POST',
          headers: headersAuth,
          body: JSON.stringify({
            id: n.id,
            project_id: projectId,
            type: n.type,
            subtype: n.subtype,
            position: n.position,
            size: n.size,
            data: n.data,
            inputs: n.inputs,
            outputs: n.outputs,
          }),
        });
      }

      // 5) Persist connections (IDs from MCP or regen if absent)
      const nextConnections: Connection[] = payload.connections.map((c) => ({
        id: c.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        sourceNode: c.sourceNode,
        sourceOutput: c.sourceOutput,
        targetNode: c.targetNode,
        targetInput: c.targetInput,
      }));

      for (const c of nextConnections) {
        await fetch(`/api/projects/${projectId}/connections`, {
          method: 'POST',
          headers: headersAuth,
          body: JSON.stringify({
            id: c.id,
            project_id: projectId,
            source_node: c.sourceNode,
            source_output: c.sourceOutput,
            target_node: c.targetNode,
            target_input: c.targetInput,
          }),
        });
      }

      // 6) Update project start node (as provided)
      const newStartNodeId = payload.startNodeId ?? null;
      await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: headersAuth,
        body: JSON.stringify({ start_node_id: newStartNodeId }),
      });

      // 7) Update local state
      setHistory((h) => [...h, nodes]);
      setNodes(nextNodes);
      setConnections(nextConnections);
      setStartNodeId(newStartNodeId);
      setSelectedNode(null);
      setFuture([]);
      showStatus("Imported from MCP");
    } catch (err) {
      console.error("Failed to replace flow from MCP:", err);
      alert(err instanceof Error ? err.message : 'Failed to replace flow from MCP');
    }
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
      const res = await fetch("/api/projects", { headers: await buildHeaders(false) });
      const ct = res.headers.get("content-type") || "";
      const isJson = ct.includes("application/json");
      const payload = isJson ? await res.json().catch(() => []) : [];
      if (!res.ok) {
        console.error("Error fetching projects:", payload);
        return;
      }
      const transformedProjects: Project[] = (payload || []).map((project: any) => ({
        id: project.id,
        name: project.name || "Untitled Project",
        description: project.description || "",
        lastModified: project.created_at ? new Date(project.created_at) : new Date(),
        nodeCount: 0,
        status: project.status || "draft",
        startNodeId: project.start_node_id || null,
        created_at: project.created_at || new Date().toISOString(),
        user_id: project.user_id || DEFAULT_USER_ID,
      }));
      setProjects(transformedProjects);
    } catch (err) {
      console.error("Unexpected error fetching projects:", err);
    }
  };

  const fetchNodes = async (projectId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/nodes?project_id=${projectId}`, {
        headers: await buildHeaders(false),
      });
      const ct = res.headers.get("content-type") || "";
      const isJson = ct.includes("application/json");
      const payload = isJson ? await res.json().catch(() => []) : [];
      if (!res.ok) {
        console.error("Error fetching nodes:", payload);
        return;
      }
      const transformedNodes: CanvasNode[] = (payload || []).map((node: any) => ({
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
      const res = await fetch(`/api/projects/${projectId}/connections?project_id=${projectId}`, {
        headers: await buildHeaders(false),
      });
      const ct = res.headers.get("content-type") || "";
      const isJson = ct.includes("application/json");
      const payload = isJson ? await res.json().catch(() => []) : [];
      if (!res.ok) {
        console.error("Error fetching connections:", payload);
        return;
      }
      const transformedConnections: Connection[] = (payload || []).map((conn: any) => ({
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
      const res = await fetch(`/api/projects/${currentProject.id}`, {
        method: "PATCH",
        headers: await buildHeaders(true),
        body: JSON.stringify({ start_node_id: nodeId }),
      });
      if (!res.ok) {
        const errText = await res.text();
        console.error("Error updating start node:", errText);
        return;
      }
      setCurrentProject({ ...currentProject, startNodeId: nodeId });
      setProjects((prev) =>
        prev.map((p) => (p.id === currentProject.id ? { ...p, startNodeId: nodeId } : p))
      );
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

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: await buildHeaders(true),
        body: JSON.stringify(newProjectData)
      });
      const ct = res.headers.get('content-type') || '';
      const isJson = ct.includes('application/json');
      const payload = isJson ? await res.json().catch(() => null) : null;
      if (!res.ok || !payload) {
        console.error('Project create failed:', payload);
        setStatusMessage(`Failed to create project: ${!res.ok ? res.status : 'No data returned'}`);
        return;
      }

      const newProject: Project = {
        id: payload.id,
        name: payload.name,
        description: payload.description || "",
        lastModified: payload.created_at ? new Date(payload.created_at) : new Date(),
        nodeCount: 0,
        status: payload.status || "draft",
        startNodeId: payload.start_node_id || null,
        created_at: payload.created_at || new Date().toISOString(),
        user_id: payload.user_id || DEFAULT_USER_ID,
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
        id: typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${subtype}-${Date.now()}`,
        type: nodeDef?.type || nodeData.type || "conversation",
        subtype: subtype,
        position: { x: baseX, y: baseY },
        size: { width: 250, height: 120 },
        data: nodeSpecificData,
        inputs: defaultInputs,
        outputs: defaultOutputs,
      };

      // Persist via API
      try {
        const res = await fetch(`/api/projects/${currentProject.id}/nodes`, {
          method: 'POST',
          headers: await buildHeaders(true),
          body: JSON.stringify({
            id: newNode.id,
            project_id: currentProject.id,
            type: newNode.type,
            subtype: newNode.subtype,
            position: newNode.position,
            size: newNode.size,
            data: newNode.data,
            inputs: newNode.inputs,
            outputs: newNode.outputs,
          })
        });
        if (!res.ok) {
          const t = await res.text();
          console.error('Error saving new node:', t);
        }
      } catch (dbErr) {
        console.error("Error saving new node:", dbErr);
      }

      setNodes([...nodes, newNode]);
    } catch (err) {
      console.error("Error adding node:", err);
    }
  };

  const handleNodeUpdate = useCallback(async (updatedNode: CanvasNode) => {
    setHistory((h) => [...h, nodes]);
    setNodes(prevNodes => prevNodes.map((n) => (n.id === updatedNode.id ? updatedNode : n)));
    setFuture([]);
    showStatus("Saved");

    // Persist updates to Supabase
    if (currentProject) {
      try {
        const res = await fetch(`/api/projects/${currentProject.id}/nodes`, {
          method: 'PATCH',
          headers: await buildHeaders(true),
          body: JSON.stringify({
            id: updatedNode.id,
            project_id: currentProject.id,
            type: updatedNode.type,
            subtype: updatedNode.subtype,
            position: updatedNode.position,
            size: updatedNode.size,
            data: updatedNode.data,
            inputs: updatedNode.inputs,
            outputs: updatedNode.outputs,
          })
        });
        if (!res.ok) {
          const t = await res.text();
          console.error('Error updating node:', t);
        }
      } catch (dbErr) {
        console.error("Error updating node:", dbErr);
      }
    }
  }, [nodes, currentProject]);

  const handleTestFlow = async () => {
    // Show the SimpleTestingPanel (our liquid glassmorphism testing panel)
    setShowTester(true);
    return;
  };

  // Debug logging for connections state
  useEffect(() => {
    console.log("Connections state updated:", connections);
  }, [connections]);

  // Persist connection deletions to Supabase
  const prevConnectionsRef = useRef<Connection[]>([]);
  useEffect(() => {
    if (!currentProject) {
      prevConnectionsRef.current = connections;
      return;
    }
    const prev = prevConnectionsRef.current;
    const removed = prev.filter(
      (p) => !connections.some((c) => c.id === p.id)
    );
    if (removed.length) {
      (async () => {
        for (const r of removed) {
          try {
            const res = await fetch(`/api/projects/${currentProject.id}/connections`, {
              method: 'DELETE',
              headers: await buildHeaders(true),
              body: JSON.stringify({ id: r.id, project_id: currentProject.id })
            });
            if (!res.ok) {
              const t = await res.text();
              console.error('Error deleting connection:', r.id, t);
            }
          } catch (err) {
            console.error("Error deleting connection:", r.id, err);
          }
        }
      })();
    }
    prevConnectionsRef.current = connections;
  }, [connections, currentProject]);

  // Persist node deletions to Supabase (also delete related connections)
  const prevNodesRef = useRef<CanvasNode[]>([]);
  useEffect(() => {
    if (!currentProject) {
      prevNodesRef.current = nodes;
      return;
    }
    const prev = prevNodesRef.current;
    const removed = prev.filter((p) => !nodes.some((n) => n.id === p.id));
    if (removed.length) {
      (async () => {
        for (const r of removed) {
          // Skip deletion for non-UUID IDs (local default nodes)
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (!uuidRegex.test(r.id)) {
            console.log('Skipping deletion for non-UUID node:', r.id);
            continue;
          }
          
          try {
            const resNode = await fetch(`/api/projects/${currentProject.id}/nodes`, {
              method: 'DELETE',
              headers: await buildHeaders(true),
              body: JSON.stringify({ id: r.id, project_id: currentProject.id })
            });
            if (!resNode.ok) {
              const t = await resNode.text();
              console.error('Error deleting node:', r.id, t);
            }
            // Related connections are deleted by DB cascade if defined; otherwise ensure cleanup
            const resConn = await fetch(`/api/projects/${currentProject.id}/connections?project_id=${currentProject.id}`, {
              headers: await buildHeaders(false)
            });
            if (resConn.ok) {
              const conns = await resConn.json().catch(() => []);
              const related = (conns || []).filter((c: any) => c.source_node === r.id || c.target_node === r.id);
              for (const c of related) {
                await fetch(`/api/projects/${currentProject.id}/connections`, {
                  method: 'DELETE',
                  headers: await buildHeaders(true),
                  body: JSON.stringify({ id: c.id, project_id: currentProject.id })
                });
              }
            }
          } catch (err) {
            console.error("Error deleting node or its connections:", r.id, err);
          }
        }
      })();
    }
    prevNodesRef.current = nodes;
  }, [nodes, currentProject]);

  // Render
  if (currentView === "projects") {
    return (
      <CleanDashboard
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
        onManageFolders={() => {
          // TODO: Implement folder management
          console.log('Manage folders clicked');
        }}
        onManageMCPServers={() => {
          // TODO: Implement MCP server management
          console.log('Manage MCP servers clicked');
        }}
      />
    );
  }

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden">
      <DesignerLayout
        left={
          <ComponentLibrary
            onAddNode={handleAddNode}
            onBackToProjects={() => setCurrentView("projects")}
            onTest={handleTestFlow}
            testButtonDisabled={isTesting}
            projectName={currentProject?.name || 'Untitled Project'}
            onProjectNameChange={async (newName) => {
              if (currentProject) {
                try {
                  const res = await fetch(`/api/projects/${currentProject.id}`, {
                    method: 'PATCH',
                    headers: await buildHeaders(true),
                    body: JSON.stringify({ name: newName })
                  });
                  if (res.ok) {
                    setCurrentProject({ ...currentProject, name: newName });
                  }
                } catch (error) {
                  console.error('Failed to update project name:', error);
                }
              }
            }}
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
            onCreateConnection={async (connectionData) => {
              if (!currentProject) return;
              try {
                const res = await fetch(`/api/projects/${currentProject.id}/connections`, {
                  method: 'POST',
                  headers: await buildHeaders(true),
                  body: JSON.stringify({
                    id: connectionData.id,
                    project_id: currentProject.id,
                    source_node: connectionData.sourceNode,
                    source_output: connectionData.sourceOutput,
                    target_node: connectionData.targetNode,
                    target_input: connectionData.targetInput,
                  })
                });
                if (!res.ok) {
                  const t = await res.text();
                  console.error('Error creating connection:', t);
                }
              } catch (err) {
                console.error("Error creating connection:", err);
              }
            }}
            showTester={showTester}
            testFlowResult={testFlowResult}
            setShowTester={setShowTester}
            setTestFlowResult={setTestFlowResult}
            onTestFlow={handleTestFlow}
            testButtonDisabled={isTesting}
            startNodeId={startNodeId}
            onStartNodeChange={handleStartNodeChange}
            projectId={currentProject ? currentProject.id : null}
            projectName={currentProject ? currentProject.name : null}
            onReplaceFlowFromMcp={handleReplaceFlowFromMcp}
            onDeleteNode={(id: string) => {
              setHistory((h) => [...h, nodes]);
              setNodes((prev) => prev.filter((n) => n.id !== id));
              if (selectedNode?.id === id) setSelectedNode(null);
              showStatus("Deleted");
            }}
          />
        }
        right={null}
        // Hidden for now - Chat Panel functionality preserved but not displayed
        // right={
        //   <div className="w-96 h-full">
        //     <ChatPanel onFlowGenerated={handleReplaceFlowFromMcp} />
        //   </div>
        // }
      />
      {statusMessage && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-3 py-1 rounded shadow">
          {statusMessage}
        </div>
      )}
    </div>
  );
}
