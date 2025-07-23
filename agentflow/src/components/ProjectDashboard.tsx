"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { colors } from "@/data/nodeDefinitions";
import { Project } from "@/types";
import { Plus, Search, Bot, File, MoreHorizontal } from "lucide-react";

interface ProjectDashboardProps {
  projects: Project[];
  onCreateProject: () => void;
  onOpenProject: (id: string) => void;
}

export default function ProjectDashboard({
  projects,
  onCreateProject,
  onOpenProject,
}: ProjectDashboardProps) {
  const getStatusColor = (status: Project["status"]) => {
    switch (status) {
      case "deployed":
        return `bg-green-500/20 text-green-400 border-green-500/30`;
      case "testing":
        return `bg-yellow-500/20 text-yellow-400 border-yellow-500/30`;
      case "draft":
        return `bg-gray-500/20 text-gray-400 border-gray-500/30`;
      default:
        return `bg-gray-500/20 text-gray-400 border-gray-500/30`;
    }
  };

  return (
    <div className="h-screen" style={{ backgroundColor: colors.bg }}>
      {/* Header */}
      <div
        className="border-b"
        style={{ borderColor: colors.border, backgroundColor: colors.sidebar }}
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div
              className="w-8 h-8 rounded-sm flex items-center justify-center"
              style={{ backgroundColor: colors.accent }}
            >
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-medium" style={{ color: colors.text }}>
                AgentFlow
              </h1>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                Design intelligent agent systems
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search
                className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2"
                style={{ color: colors.textSecondary }}
              />
              <Input
                placeholder="Search projects..."
                className="pl-10 w-64 border-0 shadow-none focus:ring-0 focus:border-0"
                style={{
                  backgroundColor: colors.panel,
                  color: colors.text,
                  borderColor: colors.border,
                  borderRadius: 0,
                  boxShadow: 'none',
                }}
              />
            </div>
            <Button
              onClick={onCreateProject}
              className="gap-2 shadow-none border-0 focus:ring-0"
              style={{
                backgroundColor: colors.accent,
                color: 'white',
                borderRadius: 0,
                boxShadow: 'none',
              }}
            >
              <Plus className="w-4 h-4" />
              New Project
            </Button>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="p-6">
        <div className="mb-6">
          <h2
            className="text-lg font-medium mb-2"
            style={{ color: colors.text }}
          >
            Recent Projects
          </h2>
          <p
            className="text-sm"
            style={{ color: colors.textSecondary }}
          >{`Continue working on your agent designs`}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="p-4 cursor-pointer hover:shadow-lg transition-all duration-200 border"
              style={{
                backgroundColor: colors.panel,
                borderColor: colors.border,
              }}
              onClick={() => onOpenProject(project.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <File className="w-4 h-4" style={{ color: colors.textSecondary }} />
                  <h3 className="font-medium" style={{ color: colors.text }}>
                    {project.name}
                  </h3>
                </div>
                <button className="p-1 rounded hover:bg-black/20">
                  <MoreHorizontal
                    className="w-4 h-4"
                    style={{ color: colors.textSecondary }}
                  />
                </button>
              </div>

              <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
                {project.description}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Badge
                    variant="outline"
                    className={`border ${getStatusColor(project.status)}`}
                  >
                    {project.status}
                  </Badge>
                  <span
                    className="text-xs"
                    style={{ color: colors.textSecondary }}
                  >
                    {project.nodeCount} nodes
                  </span>
                </div>
                <span
                  className="text-xs"
                  style={{ color: colors.textSecondary }}
                >
                  {project.lastModified.toLocaleDateString()}
                </span>
              </div>
            </Card>
          ))}

          {/* Create New Card */}
          <Card
            className="p-4 cursor-pointer hover:shadow-lg transition-all duration-200 border-dashed border-2 flex items-center justify-center min-h-[200px]"
            style={{
              backgroundColor: colors.panel,
              borderColor: colors.border,
            }}
            onClick={onCreateProject}
          >
            <div className="text-center">
              <Plus
                className="w-8 h-8 mx-auto mb-2"
                style={{ color: colors.textSecondary }}
              />
              <p className="text-sm font-medium" style={{ color: colors.text }}>
                Create New Project
              </p>
              <p
                className="text-xs"
                style={{ color: colors.textSecondary }}
              >
                Start designing an agent system
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
