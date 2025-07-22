"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { nodeCategories, colors } from "@/data/nodeDefinitions";
import { Project, CanvasNode, Connection, NodeType } from "@/types";
import ProjectDashboard from "@/components/ProjectDashboard";
import DesignerLayout from "@/components/DesignerLayout";
import { ComponentLibrary } from "@/components/ComponentLibrary";
import DesignerCanvas from "@/components/DesignerCanvas";
import PropertiesPanel from "@/components/PropertiesPanel";

export default function AgentFlowPage() {
  const [currentView, setCurrentView] = useState<'projects' | 'designer'>("projects");
  const [projects] = useState<Project[]>([
    {
      id: "1",
      name: "Customer Support Agent",
      description: "Handles customer inquiries and escalations",
      lastModified: new Date("2024-01-15"),
      nodeCount: 12,
      status: "testing",
    },
    {
      id: "2",
      name: "Sales Qualification Bot",
      description: "Qualifies leads and schedules demos",
      lastModified: new Date("2024-01-12"),
      nodeCount: 8,
      status: "draft",
    },
    {
      id: "3",
      name: "Onboarding Assistant",
      description: "Guides new users through setup",
      lastModified: new Date("2024-01-10"),
      nodeCount: 15,
      status: "deployed",
    },
  ]);
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNode, setSelectedNode] = useState<CanvasNode | null>(null);

  // Project dashboard handlers
  const handleCreateProject = () => {
    setCurrentView("designer");
    setNodes([]);
    setConnections([]);
    setSelectedNode(null);
  };
  const handleOpenProject = (id: string) => {
    setCurrentView("designer");
    setNodes([]);
    setConnections([]);
    setSelectedNode(null);
  };

  // Designer handlers
  const handleAddNode = (nodeType: NodeType) => {
    const newNode: CanvasNode = {
      id: `node-${Date.now()}`,
      type: nodeType.type,
      subtype: nodeType.id,
      position: { x: 300, y: 200 },
      size: { width: 220, height: 140 },
      data: {
        title: nodeType.name,
        description: nodeType.description,
        color: nodeType.color,
        icon: nodeType.icon,
      },
      inputs: nodeType.defaultInputs || [{ id: "input-1", label: "Input" }],
      outputs: nodeType.defaultOutputs || [{ id: "output-1", label: "Output" }],
    };
    setNodes((prev) => [...prev, newNode]);
    setSelectedNode(newNode);
  };
  const handleNodeSelect = (node: CanvasNode | null) => setSelectedNode(node);
  const handleNodeChange = (updatedNode: CanvasNode) => {
    setNodes((prev) => prev.map((n) => (n.id === updatedNode.id ? updatedNode : n)));
    setSelectedNode(updatedNode);
  };

  // Render
  if (currentView === "projects") {
    return (
      <ProjectDashboard
        projects={projects}
        onCreateProject={handleCreateProject}
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
          onNodeSelect={handleNodeSelect}
          selectedNodeId={selectedNode?.id || null}
        />
      }
      right={
        <PropertiesPanel
          selectedNode={selectedNode}
          onChange={handleNodeChange}
        />
      }
    />
  );
}