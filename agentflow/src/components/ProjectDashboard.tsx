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
import {
  Plus,
  Search,
  File,
  MoreHorizontal,
  LayoutDashboard,
  CreditCard,
  UserCog,
} from "lucide-react";
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

  const statusColor = (status: Project["status"]) => {
    switch (status) {
      case "deployed":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "testing":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  /* -----------------------------  RENDER  ----------------------------- */
  return (
    <SidebarProvider defaultOpen>
      <Sidebar className="border-r" style={{ borderColor: colors.border, '--sidebar-width': '14rem' } as React.CSSProperties}>
                <SidebarContent className="p-2 flex flex-col">
          <SidebarMenu className="flex-grow">
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" className="justify-start">
                <Image
                  src="/weave%20icon%20no%20background.png"
                  alt="Weev logo"
                  width={28}
                  height={28}
                  priority
                  className="rounded-sm"
                />
                <span className="font-thin text-lg tracking-wide">weev</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarSeparator className="my-1" />

            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={activeSection === "projects"}
                onClick={() => setActiveSection("projects")}
                className="justify-start"
              >
                <LayoutDashboard />
                Projects
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={activeSection === "account"}
                onClick={() => setActiveSection("account")}
                className="justify-start"
              >
                <CreditCard />
                Billing
                <SidebarMenuBadge>NEW</SidebarMenuBadge>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton disabled  className="justify-start">
                <UserCog />
                Account
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        
          <SidebarMenu>
             <SidebarSeparator className="my-1" />
             <SidebarMenuItem>
              <SidebarMenuButton className="justify-start">
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
              <h1 className="text-xl font-medium">Projects</h1>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search projects..."
                    className="pl-10 w-64 border-0 shadow-none focus:ring-0 focus:border-0"
                    style={{ backgroundColor: colors.panel }}
                  />
                </div>
                <Button onClick={onCreateProject} className="gap-2">
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
          <div className="p-4">
                         <ul className="space-y-1">
               {projects.map((project) => (
                 <li key={project.id}>
                   <button
                     onClick={() => onOpenProject(project.id)}
                     className="w-full flex items-center justify-between gap-4 rounded-md px-3 py-2 hover:bg-white/5 transition-colors text-left"
                   >
                     {/* left block –––––––– */}
                     <div className="flex items-center gap-3 min-w-0">
                       <File className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                       <div className="min-w-0">
                         <p className="font-medium truncate">{project.name}</p>
                         <p className="text-xs text-muted-foreground truncate">{project.description}</p>
                       </div>
                     </div>
 
                     {/* right meta –––––––– */}
                     <div className="hidden md:flex items-center gap-4 flex-shrink-0">
                       <Badge variant="outline" className={`border ${statusColor(project.status)}`}>
                         {project.status}
                       </Badge>
                       <span className="text-xs text-muted-foreground whitespace-nowrap">{project.nodeCount} nodes</span>
                       <span className="text-xs text-muted-foreground whitespace-nowrap">
                         {project.lastModified.toLocaleDateString()}
                       </span>
                       <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                     </div>
                   </button>
                 </li>
               ))}
 
               {/* create-new row */}
               <li>
                 <button
                   onClick={onCreateProject}
                   className="w-full flex items-center gap-3 rounded-md px-3 py-2 border border-dashed border-muted-foreground/30 hover:bg-white/5 hover:border-muted-foreground/50 transition-colors"
                 >
                   <Plus className="w-4 h-4" />
                   <span className="font-medium">Create New Project</span>
                 </button>
               </li>
             </ul>
          </div>
        ) : (
          <AccountSettings />
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
