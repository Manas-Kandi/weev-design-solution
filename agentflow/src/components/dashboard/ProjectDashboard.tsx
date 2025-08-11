"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Search, Grid3X3, LayoutGrid, Kanban, Plus, CreditCard, UserCog, MoreHorizontal, File, Clock, Folder, Zap, Star, Circle, Diamond, Triangle, Hexagon, Square, Heart, Bookmark } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarSeparator, SidebarProvider, SidebarInset } from '@/components/primitives/sidebar';
import { Button } from '@/components/primitives/button';
import { Card } from '@/components/primitives/card';
import { Badge } from '@/components/primitives/badge';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import FolderTree from './FolderTree';
import ProjectDetails from './ProjectDetails';
import KanbanBoard from './KanbanBoard';
import AccountSettings from '@/components/layout/AccountSettings';
import type { Project } from '@/types';
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
  const [viewMode, setViewMode] = useState<'grid' | 'kanban'>('grid');

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUpdateProjectStatus = (projectId: string, newStatus: string) => {
    // This would typically update the project in your backend
    console.log('Updating project status:', projectId, newStatus);
    // For now, we'll just log it - you can implement the actual update logic
  };

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
                  {/* Abstract Geometric Logo */}
                  <div className="relative w-8 h-8 flex-shrink-0">
                    <svg 
                      width="32" 
                      height="32" 
                      viewBox="0 0 32 32" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                      className="opacity-90"
                    >
                      {/* Modern abstract geometric shape */}
                      <defs>
                        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
                          <stop offset="100%" stopColor="rgba(255,255,255,0.6)" />
                        </linearGradient>
                      </defs>
                      <path 
                        d="M8 4L24 4C26.2091 4 28 5.79086 28 8V12L20 16L28 20V24C28 26.2091 26.2091 28 24 28H8C5.79086 28 4 26.2091 4 24V20L12 16L4 12V8C4 5.79086 5.79086 4 8 4Z" 
                        fill="url(#logoGradient)"
                        fillOpacity="0.8"
                      />
                      <circle 
                        cx="16" 
                        cy="16" 
                        r="3" 
                        fill="rgba(255,255,255,0.9)"
                      />
                    </svg>
                  </div>
                  <span 
                    className="text-neutral-300 font-light text-lg tracking-wide"
                    style={{ fontWeight: 300 }}
                  >
                    AgentFlow
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
              {/* All Projects Button */}
              <button 
                className="w-full flex items-center gap-3 py-2.5 px-4 mb-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-neutral-400 hover:text-neutral-300 transition-all duration-200 hover:scale-[1.01] group"
                onClick={() => {
                  setSelectedFolder(null);
                  setFolderProjects([]);
                  setSelectedProject(null);
                }}
              >
                <Grid3X3 className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                <span className="font-medium text-sm">All Projects</span>
              </button>
              
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
                      <Image 
                        src="/profile-picture.jpg" 
                        alt="Profile Picture" 
                        width={32} 
                        height={32} 
                        className="rounded-full"
                      />
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

      <SidebarInset>
        {/* ---- Ultra-minimal Header bar ---- */}
        <div className="flex items-center justify-between px-6 py-3">
          {activeSection === "projects" ? (
            <>
              {/* Left side - Search Bar */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-transparent border-none text-sm text-neutral-300 placeholder-neutral-500 focus:outline-none focus:bg-white/[0.02] rounded-lg transition-all duration-200 w-64"
                  />
                </div>
              </div>
              
              {/* Right side - Controls */}
              <div className="flex items-center gap-4">
                {/* Elegant View Toggle */}
                <div className="flex items-center bg-white/[0.03] rounded-full p-0.5 transition-all duration-300 hover:bg-white/[0.05]">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      "p-2 rounded-full transition-all duration-300",
                      viewMode === 'grid' 
                        ? "bg-white/[0.08] text-white shadow-sm" 
                        : "text-neutral-400 hover:text-neutral-300 hover:bg-white/[0.04]"
                    )}
                    title="Grid View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('kanban')}
                    className={cn(
                      "p-2 rounded-full transition-all duration-300",
                      viewMode === 'kanban' 
                        ? "bg-white/[0.08] text-white shadow-sm" 
                        : "text-neutral-400 hover:text-neutral-300 hover:bg-white/[0.04]"
                    )}
                    title="Kanban View"
                  >
                    <Kanban className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Refined New Project Button */}
                <button
                  onClick={onCreateProject}
                  className="flex items-center gap-2 px-4 py-2 bg-white/[0.06] hover:bg-white/[0.1] text-white rounded-full text-sm font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4" />
                  New Project
                </button>
              </div>
            </>
          ) : (
            <h1 className="text-lg font-medium text-neutral-200">Billing & Account</h1>
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
          ) : viewMode === 'kanban' ? (
            <div className="flex-1 overflow-hidden">
              <KanbanBoard 
                projects={filteredProjects}
                onUpdateProjectStatus={handleUpdateProjectStatus}
                onProjectClick={(project) => setSelectedProject(project)}
              />
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
              <div className={`border-t ${styles.projectsDivider}`}></div>

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
