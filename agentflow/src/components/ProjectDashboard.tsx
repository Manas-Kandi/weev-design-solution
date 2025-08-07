"use client";

import React, { useState } from "react";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarSeparator,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { colors } from "@/data/nodeDefinitions";
import { Project } from "@/types";
import MCPModal from '@/components/MCPModal';
import { Plus, Search, CreditCard, UserCog, MoreHorizontal, File, Clock, Folder, Zap, Star, Circle, Diamond, Triangle, Hexagon, Square, Heart, Bookmark } from "lucide-react";
import FolderTree from "./FolderTree";
import Image from "next/image";
import AccountSettings from "@/components/AccountSettings";
import UserAvatar from "@/components/UserAvatar";
import ProjectDetails from "./ProjectDetails";

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
  const [activeSection, setActiveSection] = useState<"projects" | "account">(
    "projects"
  );
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<{id: string, name: string} | null>(null);
  const [folderProjects, setFolderProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFolderSelect = async (folderId: string, folderName: string) => {
    try {
      // Import supabase here to avoid issues
      const { supabase } = await import('@/lib/supabaseClient');
      
      // Fetch projects in this folder
      const { data, error } = await supabase
        .from('project_folders')
        .select('project_id')
        .eq('folder_id', folderId);
      
      if (error) {
        console.error('Error fetching folder projects:', error);
        return;
      }
      
      // Filter projects that are in this folder
      const projectIds = data.map(pf => pf.project_id);
      const projectsInFolder = projects.filter(p => projectIds.includes(p.id));
      
      setSelectedFolder({ id: folderId, name: folderName });
      setFolderProjects(projectsInFolder);
      setSelectedProject(null); // Clear any selected project
    } catch (err) {
      console.error('Error selecting folder:', err);
    }
  };

  const handleBackToAllProjects = () => {
    setSelectedFolder(null);
    setFolderProjects([]);
    setSelectedProject(null);
  };

  const statusColor = (status: Project["status"]) => {
    switch (status) {
      case "deployed":
        return "bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30";
      case "testing":
        return "bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30";
      default:
        return "bg-[#6b7280]/20 text-[#6b7280] border-[#6b7280]/30";
    }
  };

  const getProjectIcon = (projectId: string) => {
    const icons = [Folder, Zap, Star, Circle, Diamond, Triangle, Hexagon, Square, Heart, Bookmark];
    
    // Simple hash function to consistently assign icons
    let hash = 0;
    for (let i = 0; i < projectId.length; i++) {
      const char = projectId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    const index = Math.abs(hash) % icons.length;
    return icons[index];
  };

  const getProjectGradient = (projectId: string) => {
    const gradients = [
      'linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(139, 92, 246, 0.06))', // Blue to Purple
      'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(34, 197, 94, 0.06))', // Emerald to Green
      'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(251, 191, 36, 0.06))', // Amber to Yellow
      'linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(251, 113, 133, 0.06))', // Red to Pink
      'linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(196, 181, 253, 0.06))', // Violet to Purple
      'linear-gradient(135deg, rgba(6, 182, 212, 0.12), rgba(34, 211, 238, 0.06))', // Cyan to Sky
      'linear-gradient(135deg, rgba(168, 85, 247, 0.12), rgba(217, 70, 239, 0.06))', // Purple to Fuchsia
      'linear-gradient(135deg, rgba(34, 197, 94, 0.12), rgba(132, 204, 22, 0.06))', // Green to Lime
      'linear-gradient(135deg, rgba(251, 113, 133, 0.12), rgba(244, 63, 94, 0.06))', // Pink to Rose
      'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(129, 140, 248, 0.06))', // Indigo to Blue
    ];
    
    // Use the same hash function to consistently assign gradients
    let hash = 0;
    for (let i = 0; i < projectId.length; i++) {
      const char = projectId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  };

  /* -----------------------------  RENDER  ----------------------------- */
  return (
    <SidebarProvider defaultOpen>

      <Sidebar className="border-r" style={{ borderColor: colors.border, '--sidebar-width': '14rem' } as React.CSSProperties}>
                <SidebarContent className="p-1.5 flex flex-col gap-1">
          <SidebarMenu className="gap-0.5">
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" className="justify-start py-2 px-3 gap-2">
                <Image
                  src="/weevthing.png"
                  alt="AgentFlow logo"
                  width={114}
                  height={114}
                  priority
                  className="rounded-sm -ml-3 mt-1.5"
                />
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarSeparator className="my-0.5" />
          </SidebarMenu>

          <div className="flex-grow overflow-y-auto min-h-0">
            <FolderTree 
              onSelectProject={(id) => {
                const project = projects.find(p => p.id === id);
                if (project) setSelectedProject(project);
              }}
              onSelectFolder={handleFolderSelect}
              selectedProjectId={selectedProject?.id}
              projects={projects}
            />
          </div>

          <SidebarMenu className="gap-2">
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={activeSection === "account"}
                onClick={() => setActiveSection("account")}
                className="justify-start py-2 pl-3"
              >
                <CreditCard className="mt-0.5" />
                Billing
                <SidebarMenuBadge className="mr-2">
                  <div className="w-1 h-1 rounded-full bg-white/30" />
                  <span className="text-[8px] font-normal">new</span>
                </SidebarMenuBadge>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton disabled className="justify-start py-2 pl-3">
                <UserCog />
                Account
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        
          <SidebarMenu className="gap-2 mb-4">
             <SidebarSeparator className="my-3" />
             <SidebarMenuItem>
              <SidebarMenuButton className="justify-start py-2">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/10 backdrop-blur-sm border border-white/10"></div>
                  <div className="relative z-10">
                    <UserAvatar name="Manas Kandimalla" />
                  </div>
                </div>
                <span className="truncate">Manas Kandimalla</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>

      <SidebarInset className="border-b" style={{ borderColor: colors.border }}>
        {/* ---- Header bar ---- */}
        <div className="flex items-center justify-between px-4 py-4">
          {activeSection === "projects" ? (
            <div className="flex items-center justify-between w-full">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full border-0 shadow-none focus:ring-0 focus:border-0"
                  style={{ backgroundColor: colors.panel }}
                />
              </div>
              <Button 
                onClick={onCreateProject} 
                variant="ghost" 
                className="gap-2 hover:bg-white/5 ml-4"
              >
                <Plus className="w-4 h-4" />
                New Project
              </Button>
            </div>
          ) : (
            <h1 className="text-xl font-medium">Billing & Account</h1>
          )}
        </div>

                {/* ---- Main content ---- */}
        {activeSection === "projects" ? (
          selectedProject ? (
            <div className="p-6">
              <ProjectDetails
                project={selectedProject}
                onBack={() => setSelectedProject(null)}
                onOpenCanvas={onOpenProject}
              />
            </div>
          ) : selectedFolder ? (
            <div className="p-4 space-y-8 overflow-y-auto max-h-[calc(100vh-80px)] custom-scrollbar">
              {/* Folder View Header */}
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={handleBackToAllProjects}
                  className="flex items-center gap-2 text-white/60 hover:text-white/80 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to All Projects
                </button>
              </div>
              <div className="space-y-4">
                <h2 className="text-base font-light text-white/60">{selectedFolder.name} ({folderProjects.length} projects)</h2>
                <div className="space-y-3">
                  {folderProjects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => setSelectedProject(project)}
                      className="group w-full flex items-center justify-between gap-4 px-4 py-3 hover:bg-white/[0.02] transition-all text-left rounded-lg"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div 
                          className="p-1.5 rounded-lg backdrop-blur-sm border border-white/10 mt-0.5 transition-all duration-200 group-hover:backdrop-blur-md group-hover:border-white/20"
                          style={{ 
                            background: getProjectGradient(project.id),
                            '--hover-gradient': getProjectGradient(project.id).replace(/0\.(\d+)/g, (match, p1) => {
                              const opacity = parseFloat('0.' + p1);
                              return (opacity * 1.5).toFixed(2);
                            })
                          } as React.CSSProperties & { '--hover-gradient': string }}
                        >
                          {React.createElement(getProjectIcon(project.id), {
                            className: "w-4 h-4 flex-shrink-0 text-white/80"
                          })}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-base leading-[1.4] truncate">{project.name}</p>
                          <p className="text-[13px] text-white/55 truncate">{project.description}</p>
                        </div>
                      </div>
                      
                      <div className="hidden md:flex items-center gap-3 flex-shrink-0 text-sm text-white/60">
                        <Badge variant="outline" className={`border-0 text-xs px-1.5 py-0.5 opacity-60 ${statusColor(project.status)}`}>
                          {project.status}
                        </Badge>
                        <span className="inline-flex items-center gap-1 whitespace-nowrap">{project.nodeCount} nodes</span>
                        <span className="inline-flex items-center gap-1 whitespace-nowrap">{project.lastModified.toLocaleDateString()}</span>
                      </div>
                    </button>
                  ))}
                  {folderProjects.length === 0 && (
                    <div className="text-center py-8 text-white/40">
                      <Folder className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>No projects in this folder yet</p>
                      <p className="text-sm mt-1">Drag projects from the main view to add them here</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-8 overflow-y-auto max-h-[calc(100vh-80px)] custom-scrollbar">
              {/* Recent Projects Section */}
              <div className="space-y-4">
                <h2 className="text-base font-light text-white/60">Recent Projects</h2>
                <div className="space-y-3">
                  {projects.slice(0, 3).map((project) => (
                    <button
                      key={project.id}
                      onClick={() => setSelectedProject(project)}
                      draggable
                      onDragStart={() => {
                        // Set drag data that FolderTree can access
                        (window as any).draggedProjectId = project.id;
                      }}
                      onDragEnd={() => {
                        (window as any).draggedProjectId = null;
                      }}
                      className="group w-full flex items-center justify-between gap-4 px-4 py-3 hover:bg-white/[0.02] transition-all text-left rounded-lg cursor-move"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div 
                          className="p-1.5 rounded-lg backdrop-blur-sm border border-white/10 mt-0.5 transition-all duration-200 group-hover:backdrop-blur-md group-hover:border-white/20"
                          style={{ 
                            background: getProjectGradient(project.id),
                            '--hover-gradient': getProjectGradient(project.id).replace(/0\.(\d+)/g, (match, p1) => {
                              const opacity = parseFloat('0.' + p1);
                              return (opacity * 1.5).toFixed(2);
                            })
                          } as React.CSSProperties & { '--hover-gradient': string }}
                        >
                          {React.createElement(getProjectIcon(project.id), {
                            className: "w-4 h-4 flex-shrink-0 text-white/80"
                          })}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-base leading-[1.4] truncate">{project.name}</p>
                          <p className="text-[13px] text-white/55 truncate">{project.description}</p>
                        </div>
                      </div>
                      
                      <div className="hidden md:flex items-center gap-3 flex-shrink-0 text-sm text-white/60">
                        <Badge variant="outline" className={`border-0 text-xs px-1.5 py-0.5 opacity-60 ${statusColor(project.status)}`}>
                          {project.status}
                        </Badge>
                        <span className="inline-flex items-center gap-1 whitespace-nowrap">{project.nodeCount} nodes</span>
                        <span className="inline-flex items-center gap-1 whitespace-nowrap">{project.lastModified.toLocaleDateString()}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t" style={{ borderColor: colors.border }}></div>

              {/* All Projects Section */}
              <div className="space-y-4">
                <h2 className="text-base font-light text-white/60">All Projects</h2>
                <div className="space-y-3">
                  {filteredProjects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => setSelectedProject(project)}
                      draggable
                      onDragStart={() => {
                        // Set drag data that FolderTree can access
                        (window as any).draggedProjectId = project.id;
                      }}
                      onDragEnd={() => {
                        (window as any).draggedProjectId = null;
                      }}
                      className="group w-full flex items-center justify-between gap-4 px-4 py-3 hover:bg-white/[0.02] transition-all text-left rounded-lg cursor-move"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div 
                          className="p-1.5 rounded-lg backdrop-blur-sm border border-white/10 mt-0.5 transition-all duration-200 group-hover:backdrop-blur-md group-hover:border-white/20"
                          style={{ 
                            background: getProjectGradient(project.id),
                            '--hover-gradient': getProjectGradient(project.id).replace(/0\.(\d+)/g, (match, p1) => {
                              const opacity = parseFloat('0.' + p1);
                              return (opacity * 1.5).toFixed(2);
                            })
                          } as React.CSSProperties & { '--hover-gradient': string }}
                        >
                          {React.createElement(getProjectIcon(project.id), {
                            className: "w-4 h-4 flex-shrink-0 text-white/80"
                          })}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-base leading-[1.4] truncate">{project.name}</p>
                          <p className="text-[13px] text-white/55 truncate">{project.description}</p>
                        </div>
                      </div>
                      
                      <div className="hidden md:flex items-center gap-3 flex-shrink-0 text-sm text-white/60">
                        <Badge variant="outline" className={`border-0 text-xs px-1.5 py-0.5 opacity-60 ${statusColor(project.status)}`}>
                          {project.status}
                        </Badge>
                        <span className="inline-flex items-center gap-1 whitespace-nowrap">{project.nodeCount} nodes</span>
                        <span className="inline-flex items-center gap-1 whitespace-nowrap">{project.lastModified.toLocaleDateString()}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )
        ) : (
          <AccountSettings />
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
