"use client";

import { useState } from "react";
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
import { Plus, Search, CreditCard, UserCog, MoreHorizontal, File, Clock } from "lucide-react";
import FolderTree from "./FolderTree";
import Image from "next/image";
import AccountSettings from "@/components/AccountSettings";
import UserAvatar from "@/components/UserAvatar";

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
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  /* -----------------------------  RENDER  ----------------------------- */
  return (
    <SidebarProvider defaultOpen>

      <Sidebar className="border-r" style={{ borderColor: colors.border, '--sidebar-width': '14rem' } as React.CSSProperties}>
                <SidebarContent className="p-1.5 flex flex-col gap-1">
          <SidebarMenu className="gap-0.5">
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" className="justify-start py-2 gap-2.5">
                <div className="flex items-center">
                  <Image
                    src="/weev-finalIcon.png"
                    alt="Weev logo"
                    width={32}
                    height={32}
                    priority
                    className="rounded-sm"
                  />
                </div>
                <span className="font-thin text-lg tracking-wide -mt-1 text-white/75">weev</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarSeparator className="my-0.5" />
          </SidebarMenu>

          <div className="flex-grow overflow-y-auto min-h-0">
            <FolderTree
              projects={projects}
              onSelectProject={onOpenProject}
              selectedProjectId={selectedProject?.id}
            />
          </div>

          <SidebarMenu className="gap-0.5">
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={activeSection === "account"}
                onClick={() => setActiveSection("account")}
                className="justify-start py-1.5"
              >
                <CreditCard className="mt-0.5" />
                Billing
                <SidebarMenuBadge>
                  <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                  <span className="text-[9px] font-normal">new</span>
                </SidebarMenuBadge>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton disabled className="justify-start py-1.5">
                <UserCog />
                Account
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        
          <SidebarMenu className="gap-0.5">
             <SidebarSeparator className="my-0.5" />
             <SidebarMenuItem>
              <SidebarMenuButton className="justify-start py-1.5">
                <UserAvatar name="Weev User" />
                <span className="truncate">Weev User</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>

      <SidebarInset>
        {/* ---- Header bar ---- */}
        <div
          className="border-b flex items-center justify-between px-6 py-4"
          style={{ borderColor: colors.border }}
        >
          {activeSection === "projects" ? (
            <>
              <h1 className="text-2xl font-semibold">Projects</h1>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64 border-0 shadow-none focus:ring-0 focus:border-0"
                    style={{ backgroundColor: colors.panel }}
                  />
                </div>
                                 <Button 
                  onClick={onCreateProject} 
                  variant="ghost" 
                  className="gap-2 hover:bg-white/5"
                >
                  <Plus className="w-4 h-4" />
                  New Project
                </Button>
              </div>
            </>
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
          ) : (
            <div className="p-6 space-y-8">
              {/* Recent Projects Section */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Recent Projects</h2>
                <div className="rounded-xl border border-[#3a3a3a] divide-y divide-white/5 overflow-hidden">
                  {projects.slice(0, 6).map((project) => (
                    <button
                      key={project.id}
                      onClick={() => setSelectedProject(project)}
                      className="w-full flex items-center justify-between gap-4 px-7 py-5 hover:bg-white/[0.02] transition-all text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <File className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="font-semibold text-[17px] leading-[1.4] truncate mb-0.5">{project.name}</p>
                          <p className="text-[14px] font-normal text-white/55 truncate">{project.description}</p>
                        </div>
                      </div>
                      
                      <div className="hidden md:flex items-center gap-4 flex-shrink-0 text-[12px] font-medium text-white/70">
                        <Badge variant="outline" className={`border text-[11px] px-2 py-0.5 ${statusColor(project.status)}`}>
                          {project.status}
                        </Badge>
                        <span className="inline-flex items-center gap-1 whitespace-nowrap"><File className="w-3 h-3" /> {project.nodeCount} nodes</span>
                        <span className="inline-flex items-center gap-1 whitespace-nowrap"><Clock className="w-3 h-3" /> {project.lastModified.toLocaleDateString()}</span>
                        <MoreHorizontal className="w-4 h-4 text-muted-foreground opacity-50" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* All Projects Section */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">All Projects</h2>
                <div className="rounded-xl border border-[#3a3a3a] divide-y divide-white/5 overflow-hidden">
                  {filteredProjects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => setSelectedProject(project)}
                      className="w-full flex items-center justify-between gap-4 px-7 py-5 hover:bg-white/[0.03] transition-all text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <File className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="font-semibold text-[16px] leading-[1.4] truncate mb-0.5">{project.name}</p>
                          <p className="text-[14px] font-normal text-white/55 truncate">{project.description}</p>
                        </div>
                      </div>
                      
                      <div className="hidden md:flex items-center gap-4 flex-shrink-0 text-[12px] font-medium text-white/70">
                        <Badge variant="outline" className={`border ${statusColor(project.status)}`}>
                          {project.status}
                        </Badge>
                        <span className="inline-flex items-center gap-1 whitespace-nowrap"><File className="w-3 h-3" /> {project.nodeCount} nodes</span>
                        <span className="inline-flex items-center gap-1 whitespace-nowrap"><Clock className="w-3 h-3" /> {project.lastModified.toLocaleDateString()}</span>
                        <MoreHorizontal className="w-4 h-4 text-muted-foreground opacity-50" />
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
