"use client";

import React, { useState, useEffect, useRef } from "react";
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
} from "@/components/primitives/sidebar";
import { Button } from "@/components/primitives/button";
import { Card } from "@/components/primitives/card";
import { Badge } from "@/components/primitives/badge";
import { Input } from "@/components/primitives/input";
import { colors } from "@/data/nodeDefinitions";
import { Project } from "@/types";
import { Plus, Search, CreditCard, UserCog, MoreHorizontal, File, Clock, Folder, Zap, Star, Circle, Diamond, Triangle, Hexagon, Square, Heart, Bookmark } from "lucide-react";
import FolderTree from "./FolderTree";
import Image from "next/image";
import AccountSettings from "@/components/layout/AccountSettings";
import UserAvatar from "@/components/layout/UserAvatar";
import ProjectDetails from "./ProjectDetails";
import styles from './css/ProjectDashboard.module.css';

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

      <Sidebar 
        className={`border-r ${styles.sidebarBorder} ${styles.sidebarWidth} transition-all duration-300 ease-out`} 
        style={{ 
          borderColor: 'rgba(255, 255, 255, 0.06)',
          background: 'rgba(16, 16, 16, 0.85)',
          backdropFilter: 'blur(20px) saturate(1.2)',
          borderWidth: '0.5px'
        } as React.CSSProperties}
      >
        <SidebarContent className="p-0 flex flex-col" style={{ height: '100vh', minHeight: 0, overflow: 'hidden' }}>
          {/* Logo Section - Fixed Height */}
          <div className="flex-shrink-0 p-3">
            <SidebarMenu className="gap-1">
              <SidebarMenuItem>
                <div className="flex items-center py-4 px-3 gap-3">
                  <svg 
                    width="32" 
                    height="30" 
                    viewBox="0 0 552 515" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                    className="opacity-90 flex-shrink-0"
                  >
                    <path d="M188.675 222.774C12.8732 368.493 143.277 463.686 146.99 453.964C150.598 444.517 113.418 337.757 238.154 259.157" stroke="white" strokeOpacity="1" strokeWidth="10"/>
                    <path d="M275.418 230.102L278.202 224.495C288.193 204.372 294.166 182.494 295.786 160.086L296.878 144.986C298.187 126.888 295.065 108.743 287.784 92.1214L281.506 77.7883C280.357 75.1663 278.752 72.769 276.766 70.7078V70.7078C274.618 68.4789 272.063 66.6828 269.238 65.417L267.918 64.8252C264.226 63.1707 260.251 62.239 256.209 62.0804L219.697 60.6479C212.431 61.1017 213.191 69.9704 220.583 86.9484C253.602 162.784 231.401 175.318 225.377 193.448" stroke="white" strokeOpacity="1" strokeWidth="10"/>
                    <path d="M307.59 267C309.217 265.633 310.844 264.265 312.471 262.898C307.777 256.763 303.07 250.639 298.35 244.527C297.997 244.07 297.645 243.614 297.292 243.157C289.396 232.957 280.464 223.501 270.661 214.988C269.011 213.553 267.361 212.118 265.709 210.685C258.101 204.094 249.972 198.069 241.417 192.688C237.793 190.404 234.165 188.124 230.535 185.849C215.681 176.554 199.552 169.206 182.714 164.084C175.176 161.786 167.633 159.505 160.085 157.242L158.996 157.004C154.719 156.328 150.441 155.657 146.162 154.992C133.134 152.925 119.307 156.583 108.984 164.844C106.818 166.563 104.804 168.467 102.967 170.53C98.6814 175.346 94.4048 180.171 90.1374 185.003C86.6698 188.845 85.4971 194.564 87.1631 199.448C89.0522 205.387 94.943 209.51 100.851 209.618C153.716 212.554 206.936 236.233 245.472 275.001C250.798 280.359 255.861 286.014 260.65 291.962C262.365 290.708 264.081 289.453 265.796 288.198C261.443 281.647 256.731 275.354 251.67 269.34C214.788 225.675 160.002 197.165 101.477 192.96C102.043 192.937 102.831 193.39 103.109 194.202C103.352 194.878 103.203 195.681 102.72 196.231C107.038 191.444 111.346 186.647 115.645 181.843C116.842 180.505 118.149 179.273 119.553 178.159C126.245 172.808 135.177 170.368 143.691 171.598C147.978 172.208 152.266 172.812 156.554 173.41L155.466 173.173C163.053 175.299 170.646 177.407 178.244 179.498C193.908 183.796 209.074 190.018 223.312 198.009C227.046 200.109 230.783 202.204 234.523 204.294C242.774 208.896 250.717 214.088 258.276 219.828C260.016 221.152 261.757 222.475 263.498 223.797C273.278 231.204 282.416 239.527 290.757 248.649C291.146 249.075 291.535 249.501 291.924 249.927C297.133 255.629 302.355 261.32 307.59 267Z" fill="white" fillOpacity="1"/>
                    <path d="M285.861 312.493C284.148 314.138 282.436 315.784 280.723 317.429C284.183 321.602 287.658 325.761 291.147 329.906C297.826 337.842 304.557 345.728 311.341 353.564C325.529 369.907 342.974 383.645 362.432 393.692C368.476 396.825 374.533 399.929 380.604 403.006C383.796 404.61 387.216 405.773 390.734 406.446C400.954 408.451 411.972 406.082 420.494 400.044C424.592 397.167 428.129 393.483 430.836 389.283C433.898 384.525 436.942 379.756 439.968 374.975C443.36 369.782 443.731 362.831 440.952 357.34C438.98 353.337 435.452 350.154 431.3 348.604C419.251 344.203 407.161 339.906 395.032 335.713C385.501 332.452 376.385 327.775 368.064 321.824C367.066 321.106 366.068 320.389 365.07 319.672C357.992 314.623 351.369 308.842 345.338 302.413C344.436 301.452 343.547 300.477 342.672 299.487C339.996 296.445 337.31 293.41 334.616 290.382C332.731 291.827 330.846 293.271 328.961 294.716C331.186 298.105 333.419 301.486 335.661 304.861C336.445 306.037 337.25 307.2 338.075 308.351C343.589 316.048 349.999 323.177 357.156 329.541C358.072 330.36 358.99 331.178 359.907 331.996C368.558 339.66 378.511 345.976 389.267 350.577C401.052 355.659 412.877 360.637 424.743 365.511C424.638 365.517 424.518 365.471 424.43 365.373C424.308 365.240 424.26 365.014 424.35 364.807C421.202 369.509 418.073 374.223 414.962 378.949C413.524 381.123 411.692 383.007 409.569 384.499C405.146 387.626 399.487 388.926 394.112 388.008C392.264 387.699 390.453 387.141 388.744 386.349C382.587 383.449 376.416 380.577 370.232 377.734C352.213 369.48 335.441 358.271 320.743 344.53C313.185 337.439 305.574 330.398 297.911 323.407C293.909 319.755 289.892 316.117 285.861 312.493Z" fill="white" fillOpacity="1"/>
                    <path d="M241.889 374.02L222.176 394.045L206.21 413.837L192.314 432.24C191.649 433.121 191.053 434.053 190.533 435.026L179.019 456.551C174.567 464.875 162.318 463.84 159.326 454.886L154.45 428.462C153.391 422.721 152.924 416.887 153.059 411.052C153.669 384.584 166.073 359.773 186.879 343.403L188.857 341.847L221.651 316.176L311.972 239.128L340.115 216.432L372.625 183.533C379.925 176.146 386.613 168.179 392.624 159.711L400.393 148.766L419.821 116.996C425.196 108.207 437.786 107.722 443.822 116.071C447.461 121.104 449.992 126.852 451.249 132.934L451.929 136.225C453.264 142.688 453.518 149.327 452.68 155.872L452.262 159.135C451.218 167.288 448.914 175.229 445.432 182.674L439.301 195.783L432.755 207.202C428.402 214.796 423.32 221.949 417.581 228.559L411.667 235.37L409.422 237.956C401.243 247.376 392.165 255.977 382.318 263.636L334.08 301.154L286.263 335.813L241.889 374.02Z" fill="white" fillOpacity="1"/>
                  </svg>
                  <span 
                    className="text-neutral-300 font-light text-lg tracking-wide"
                    style={{ fontWeight: 300 }}
                  >
                    weev
                  </span>
                </div>
              </SidebarMenuItem>
              
              <SidebarSeparator 
                className="my-4 mx-4" 
                style={{ 
                  background: 'rgba(255, 255, 255, 0.04)',
                  height: '0.5px',
                  border: 'none'
                }} 
              />
            </SidebarMenu>
          </div>

          {/* Folder Tree Section - Flexible */}
          <div className="flex-1 min-h-0 px-2" style={{ overflow: 'hidden' }}>
            <div 
              className="h-full transition-all duration-300 ease-out"
              style={{
                background: 'transparent',
                padding: '4px 0',
                overflow: 'auto'
              }}
            >
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
          </div>

          {/* Billing & Account Section - Fixed Height at Bottom */}
          <div className="flex-shrink-0 mt-auto">
            <div className="px-4 mb-6">
              <div className={styles.menuSeparator} />
            </div>
            
            <div className="px-2 mb-4">
              {/* Billing Item */}
              <div 
                className={`${styles.menuItem} ${activeSection === "account" ? 'bg-opacity-10' : ''}`}
                onClick={() => setActiveSection("account")}
              >
                <CreditCard 
                  className={styles.menuItemIcon} 
                  size={16}
                  strokeWidth={1.5}
                />
                <span className={styles.menuItemText}>
                  Billing
                </span>
                <div className={`${styles.pillBadge} ml-auto`}>
                  new
                </div>
              </div>

              {/* Account Item */}
              <div className={`${styles.menuItem} opacity-50`}>
                <UserCog 
                  className={styles.menuItemIcon} 
                  size={16}
                  strokeWidth={1.5}
                />
                <span className={styles.menuItemText}>
                  Account
                </span>
              </div>
            </div>
          
            {/* User Nameplate Section */}
            <div className="px-4 mb-6">
              <div className={styles.menuSeparator} />
            </div>
            
            <div className="px-2 mb-4 relative">
            {/* Profile Card with Popover */}
            {(() => {
              // Use refs for better management
              const profileCardRef = useRef<HTMLDivElement>(null);
              const popoverRef = useRef<HTMLDivElement>(null);
              const [isPopoverOpen, setIsPopoverOpen] = useState(false);
              
              // Handle clicks outside the popover
              useEffect(() => {
                const handleClickOutside = (event: MouseEvent) => {
                  if (isPopoverOpen && 
                      popoverRef.current && 
                      profileCardRef.current && 
                      !popoverRef.current.contains(event.target as Node) &&
                      !profileCardRef.current.contains(event.target as Node)) {
                    setIsPopoverOpen(false);
                  }
                };
                
                document.addEventListener('mousedown', handleClickOutside);
                return () => {
                  document.removeEventListener('mousedown', handleClickOutside);
                };
              }, [isPopoverOpen]);
              
              return (
                <>
                  {/* Premium Profile Card */}
                  <div 
                    ref={profileCardRef}
                    className={styles.profileCard}
                    onClick={() => setIsPopoverOpen(!isPopoverOpen)}
                  >
                    {/* Avatar with Status Indicator */}
                    <div className={styles.avatarWrapper}>
                      <div className={styles.avatarGradientBorder}></div>
                      <div className={styles.statusIndicator}></div>
                      <UserAvatar name="Manas Kandimalla" />
                    </div>
                    
                    {/* User Info */}
                    <div className="flex flex-col min-w-0 flex-1">
                      <span 
                        className="truncate font-medium text-sm text-neutral-200 transition-all duration-300"
                        style={{ letterSpacing: '-0.01em' }}
                      >
                        Manas Kandimalla
                      </span>
                      <span className={styles.premiumBadge}>
                        Premium
                      </span>
                    </div>
                  </div>
                  
                  {/* Profile Popover */}
                  <div 
                    ref={popoverRef}
                    className={`${styles.profilePopover} ${isPopoverOpen ? styles.popoverOpen : ''}`}
                  >
                    <div className={styles.popoverItem}>
                      <UserCog size={14} className={styles.popoverItemIcon} />
                      <span>Settings</span>
                    </div>
                    <div className={styles.popoverItem}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.popoverItemIcon}>
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      <span>Logout</span>
                    </div>
                    <div className={styles.popoverItem}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.popoverItemIcon}>
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      <span>Profile</span>
                    </div>
                  </div>
                </>
              );
            })()}
            </div>
          </div>

        </SidebarContent>
      </Sidebar>

      <SidebarInset className={`border-b ${styles.headerBorder}`} style={{ borderColor: colors.border }}>
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
                  className={`pl-10 w-full ${styles.searchInput}`}
                  style={{ backgroundColor: colors.panel }}
                />
              </div>
              <Button 
                onClick={onCreateProject} 
                variant="ghost" 
                className={styles.newProjectButton}
              >
                <Plus className="w-4 h-4" />
                New Project
              </Button>
            </div>
          ) : (
            <h1 className={styles.accountSectionHeader}>Billing & Account</h1>
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
              <div className={styles.folderViewHeader}>
                <button
                  onClick={handleBackToAllProjects}
                  className={`${styles.folderViewBackButton} ${styles.folderViewBackButtonHover}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to All Projects
                </button>
              </div>
              <div className="space-y-4">
                <h2 className={styles.folderViewProjectCount}>{selectedFolder.name} ({folderProjects.length} projects)</h2>
                <div className="space-y-3">
                  {folderProjects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => setSelectedProject(project)}
                      className={`group w-full flex items-center justify-between gap-4 px-4 py-3 text-left rounded-lg ${styles.projectCard} ${styles.projectCardHover}`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div 
                          className={`p-1.5 rounded-lg backdrop-blur-sm border border-white/10 mt-0.5 transition-all duration-200 group-hover:backdrop-blur-md group-hover:border-white/20 ${styles.projectGradient}`}
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
                    <div className={styles.folderViewEmptyState}>
                      <Folder className={`w-12 h-12 mx-auto mb-3 ${styles.folderViewEmptyStateIcon}`} />
                      <p>No projects in this folder yet</p>
                      <p className={styles.folderViewEmptyStateText}>Drag projects from the main view to add them here</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-8 overflow-y-auto max-h-[calc(100vh-80px)] custom-scrollbar">
              {/* Recent Projects Section */}
              <div className="space-y-4">
                <h2 className={styles.recentProjectsHeader}>Recent Projects</h2>
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
                      className={`group w-full flex items-center justify-between gap-4 px-4 py-3 text-left rounded-lg ${styles.projectCard} ${styles.projectCardHover} ${styles.projectCardDraggable}`}
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
              <div className={`border-t ${styles.projectsDivider}`} style={{ borderColor: colors.border }}></div>

              {/* All Projects Section */}
              <div className="space-y-4">
                <h2 className={styles.allProjectsHeader}>All Projects</h2>
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
                      className={`group w-full flex items-center justify-between gap-4 px-4 py-3 text-left rounded-lg ${styles.projectCard} ${styles.projectCardHover} ${styles.projectCardDraggable}`}
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
