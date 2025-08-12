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
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'kanban' | 'table'>('grid');

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
        className={`${styles.sidebarWidth} transition-all duration-300 ease-out`} 
        style={{ 
          background: 'rgba(20, 20, 20, 0.35)',
          backdropFilter: 'blur(16px)',
          backgroundImage: 'radial-gradient(circle at top left, rgba(255, 255, 255, 0.03) 0%, transparent 50%)'
        } as React.CSSProperties}
      >
        <SidebarContent className="p-0 flex flex-col" style={{ height: '100vh', minHeight: 0, overflow: 'hidden' }}>
          {/* Logo Section - Fixed Height */}
          <div className="flex-shrink-0 p-4">
            <div className="flex items-center justify-center py-3 gap-3">
              {/* Minimal Logo */}
              <div className="relative w-7 h-7 flex-shrink-0">
                <svg 
                  width="28" 
                  height="28" 
                  viewBox="0 0 32 32" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  className="opacity-85"
                >
                  <defs>
                    <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
                      <stop offset="100%" stopColor="rgba(255,255,255,0.5)" />
                    </linearGradient>
                  </defs>
                  <path 
                    d="M8 4L24 4C26.2091 4 28 5.79086 28 8V12L20 16L28 20V24C28 26.2091 26.2091 28 24 28H8C5.79086 28 4 26.2091 4 24V20L12 16L4 12V8C4 5.79086 5.79086 4 8 4Z" 
                    fill="url(#logoGradient)"
                    fillOpacity="0.7"
                  />
                  <circle 
                    cx="16" 
                    cy="16" 
                    r="3" 
                    fill="rgba(255,255,255,0.8)"
                  />
                </svg>
              </div>
              <span 
                className="text-white/75 font-light text-base tracking-wide"
                style={{ fontWeight: 300 }}
              >
                AgentFlow
              </span>
            </div>
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
                className="w-full flex items-center gap-3 py-3 px-4 mb-6 rounded-full transition-all duration-200 group"
                style={{
                  background: selectedFolder === null ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.04)',
                  color: selectedFolder === null ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.6)'
                }}
                onMouseEnter={(e) => {
                  if (selectedFolder !== null) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedFolder !== null) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
                  }
                }}
                onClick={() => {
                  setSelectedFolder(null);
                  setFolderProjects([]);
                  setSelectedProject(null);
                }}
              >
                <Grid3X3 className="w-4 h-4 transition-all duration-200" />
                <span className="font-medium text-sm">All Projects</span>
                {selectedFolder === null && (
                  <div 
                    className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{ background: 'rgba(255, 255, 255, 0.4)' }}
                  />
                )}
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

          {/* Bottom Actions Section - Fixed Height at Bottom */}
          <div className="flex-shrink-0 mt-auto">
            <div className="px-4 mb-4 space-y-1">
              {/* Billing Item */}
              <div 
                className="flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all duration-200 cursor-pointer group"
                style={{
                  background: activeSection === "account" ? 'rgba(255, 255, 255, 0.06)' : 'transparent'
                }}
                onMouseEnter={(e) => {
                  if (activeSection !== "account") {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeSection !== "account") {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
                onClick={() => setActiveSection("account")}
              >
                <CreditCard 
                  className="w-4 h-4 text-white/60 group-hover:text-white/80 transition-colors" 
                  strokeWidth={1.5}
                />
                <span className="text-sm text-white/70 group-hover:text-white/90 transition-colors font-medium">
                  Billing
                </span>
                <div 
                  className="ml-auto px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{
                    background: 'rgba(34, 197, 94, 0.15)',
                    color: 'rgba(34, 197, 94, 0.9)'
                  }}
                >
                  new
                </div>
              </div>

              {/* Account Item */}
              <div 
                className="flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all duration-200 cursor-pointer group opacity-60 hover:opacity-80"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <UserCog 
                  className="w-4 h-4 text-white/60 group-hover:text-white/80 transition-colors" 
                  strokeWidth={1.5}
                />
                <span className="text-sm text-white/70 group-hover:text-white/90 transition-colors font-medium">
                  Account
                </span>
              </div>
            </div>
          
            {/* User Profile Section */}
            <div className="px-4 pb-6">
            {(() => {
              const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
              const profileCardRef = React.useRef<HTMLDivElement>(null);
              const popoverRef = React.useRef<HTMLDivElement>(null);
              
              React.useEffect(() => {
                const handleClickOutside = (event: MouseEvent) => {
                  if (
                    profileCardRef.current && 
                    !profileCardRef.current.contains(event.target as Node) &&
                    popoverRef.current && 
                    !popoverRef.current.contains(event.target as Node)
                  ) {
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
                  {/* Premium Glassy Profile Card */}
                  <div 
                    ref={profileCardRef}
                    className="flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 cursor-pointer group relative"
                    style={{
                      background: 'rgba(20, 20, 20, 0.4)',
                      backdropFilter: 'blur(12px)',
                      backgroundImage: 'radial-gradient(circle at top left, rgba(255, 255, 255, 0.04) 0%, transparent 50%)',
                      borderRadius: '16px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(30, 30, 30, 0.5)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(20, 20, 20, 0.4)';
                      e.currentTarget.style.backgroundImage = 'radial-gradient(circle at top left, rgba(255, 255, 255, 0.04) 0%, transparent 50%)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                    onClick={() => setIsPopoverOpen(!isPopoverOpen)}
                  >
                    {/* Avatar with Status */}
                    <div className="relative">
                      <div 
                        className="w-8 h-8 rounded-full overflow-hidden"
                        style={{
                          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                          padding: '1px'
                        }}
                      >
                        <Image 
                          src="/profile-picture.jpg" 
                          alt="Profile Picture" 
                          width={30} 
                          height={30} 
                          className="rounded-full w-full h-full object-cover"
                        />
                      </div>
                      {/* Status Indicator */}
                      <div 
                        className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
                        style={{
                          background: '#4ade80',
                          border: '1.5px solid rgba(20, 20, 20, 0.8)',
                          boxShadow: '0 0 0 1px rgba(74, 222, 128, 0.3)'
                        }}
                      />
                    </div>
                    
                    {/* User Info */}
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="truncate font-medium text-sm text-white/90 transition-all duration-200">
                        Manas Kandimalla
                      </span>
                      <span 
                        className="text-xs font-medium"
                        style={{
                          background: 'linear-gradient(to right, #ffd700, #f0c040)',
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          letterSpacing: '0.02em'
                        }}
                      >
                        Premium
                      </span>
                    </div>
                  </div>
                  
                  {/* Glassy Profile Popover */}
                  <div 
                    ref={popoverRef}
                    className="absolute left-4 right-4 transition-all duration-200 z-50"
                    style={{
                      bottom: 'calc(100% + 8px)',
                      background: 'rgba(20, 20, 20, 0.9)',
                      backdropFilter: 'blur(16px)',
                      borderRadius: '12px',
                      padding: '8px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                      transform: isPopoverOpen ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.95)',
                      opacity: isPopoverOpen ? 1 : 0,
                      visibility: isPopoverOpen ? 'visible' : 'hidden'
                    }}
                  >
                    <div 
                      className="flex items-center gap-2 p-2.5 rounded-lg transition-all duration-150 cursor-pointer group"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <UserCog size={14} className="text-white/60 group-hover:text-white/90 transition-colors" />
                      <span className="text-sm text-white/80 group-hover:text-white/100 transition-colors">Settings</span>
                    </div>
                    <div 
                      className="flex items-center gap-2 p-2.5 rounded-lg transition-all duration-150 cursor-pointer group"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/60 group-hover:text-white/90 transition-colors">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      <span className="text-sm text-white/80 group-hover:text-white/100 transition-colors">Profile</span>
                    </div>
                    <div 
                      className="flex items-center gap-2 p-2.5 rounded-lg transition-all duration-150 cursor-pointer group"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/60 group-hover:text-white/90 transition-colors">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      <span className="text-sm text-white/80 group-hover:text-white/100 transition-colors">Logout</span>
                    </div>
                  </div>
                </>
              );
            })()
            }</div>
          </div>

        </SidebarContent>
      </Sidebar>

      <SidebarInset className="relative" style={{ border: 'none', boxShadow: 'none', margin: 0, borderRadius: 0 }}>
        {/* Animated vignette gradient backdrop */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(circle at 30% 20%, rgba(59, 130, 246, 0.03) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(139, 92, 246, 0.02) 0%, transparent 50%)",
            animation: "vignette-pulse 20s ease-in-out infinite",
          }}
        />
        <style jsx>{`
          @keyframes vignette-pulse {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 0.7; }
          }
          @keyframes fade-in-up {
            0% {
              opacity: 0;
              transform: translateY(8px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
        
        {/* ---- Frosted Header bar ---- */}
        <div className="sticky top-0 z-10 flex items-center gap-6 px-6 py-4 min-w-0 backdrop-blur-md bg-black/10">
          {activeSection === "projects" ? (
            <>
              {/* Glass Control Dock */}
              <div className="inline-flex items-center gap-1 rounded-2xl bg-white/5 backdrop-blur-md p-1 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-white/0 hover:bg-white/5 focus:bg-white/8 border-none text-sm text-white/90 placeholder-white/50 focus:outline-none rounded-xl transition-all duration-200 w-64"
                  />
                </div>
                
                {/* View Toggle Pills */}
                <div className="flex items-center gap-0.5 ml-2">
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200",
                      viewMode === 'list' 
                        ? "bg-white/12 text-white shadow-sm" 
                        : "bg-white/0 text-white/70 hover:bg-white/8 hover:text-white/90"
                    )}
                    title="List View"
                  >
                    List
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      "p-1.5 rounded-xl transition-all duration-200",
                      viewMode === 'grid' 
                        ? "bg-white/12 text-white shadow-sm" 
                        : "bg-white/0 text-white/70 hover:bg-white/8 hover:text-white/90"
                    )}
                    title="Grid View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('kanban')}
                    className={cn(
                      "p-1.5 rounded-xl transition-all duration-200",
                      viewMode === 'kanban' 
                        ? "bg-white/12 text-white shadow-sm" 
                        : "bg-white/0 text-white/70 hover:bg-white/8 hover:text-white/90"
                    )}
                    title="Kanban View"
                  >
                    <Kanban className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200",
                      viewMode === 'table' 
                        ? "bg-white/12 text-white shadow-sm" 
                        : "bg-white/0 text-white/70 hover:bg-white/8 hover:text-white/90"
                    )}
                    title="Table View"
                  >
                    Table
                  </button>
                </div>
                
                {/* New Project Button in Dock */}
                <button
                  onClick={onCreateProject}
                  className="ml-2 flex items-center gap-2 px-3 py-1.5 bg-blue-500/90 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl hover:ring-1 hover:ring-white/10"
                >
                  <Plus className="w-4 h-4" />
                  New Project
                </button>
              </div>
              
              {/* Spacer */}
              <div className="flex-1"></div>
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
              <div className="space-y-8">
                <div className="px-1">
                  <h2 className="text-lg font-medium text-white/60 mb-1">{selectedFolder.name}</h2>
                  <p className="text-sm text-white/40">{folderProjects.length} projects in this folder</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {folderProjects.map((project, index) => (
                    <button
                      key={project.id}
                      onClick={() => setSelectedProject(project)}
                      className="group relative p-5 text-left backdrop-blur-[12px] transition-all duration-200 ease-out cursor-pointer hover:-translate-y-0.5"
                      style={{
                        borderRadius: '14px',
                        background: 'rgba(20, 20, 20, 0.35)',
                        backgroundImage: 'radial-gradient(circle at top left, rgba(255, 255, 255, 0.03) 0%, transparent 50%)',
                        animationDelay: `${index * 50}ms`,
                        animation: 'fade-in-up 0.6s ease-out forwards'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(30, 30, 30, 0.45)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(20, 20, 20, 0.35)';
                        e.currentTarget.style.backgroundImage = 'radial-gradient(circle at top left, rgba(255, 255, 255, 0.03) 0%, transparent 50%)';
                      }}
                    >
                      {/* Layout: Icon + Content + Meta */}
                      <div className="flex items-start gap-4">
                        {/* Left Section - Icon */}
                        <div className="flex-shrink-0">
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:shadow-lg"
                            style={{ 
                              background: getProjectGradient(project.id),
                              boxShadow: '0 0 0 0 rgba(59, 130, 246, 0)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.boxShadow = '0 0 20px 4px rgba(59, 130, 246, 0.15)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.boxShadow = '0 0 0 0 rgba(59, 130, 246, 0)';
                            }}
                          >
                            {React.createElement(getProjectIcon(project.id), {
                              className: "w-5 h-5 text-white/95"
                            })}
                          </div>
                        </div>

                        {/* Center Section - Main Info */}
                        <div className="flex-1 min-w-0">
                          {/* Title */}
                          <h3 
                            className="font-semibold text-base leading-tight truncate text-white/90 mb-1"
                            title={project.name}
                          >
                            {project.name}
                          </h3>
                          
                          {/* Description */}
                          <p className="text-sm text-white/70 truncate mb-2">
                            {project.description}
                          </p>
                          
                          {/* Status Pill */}
                          <div 
                            className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold"
                            style={{
                              background: 'rgba(255, 255, 255, 0.08)',
                              color: 'rgba(255, 255, 255, 0.8)'
                            }}
                          >
                            {project.status}
                          </div>
                        </div>

                        {/* Right Section - Meta Info */}
                        <div className="flex-shrink-0 text-right">
                          <div className="text-xs text-white/60 font-medium mb-1">
                            {project.nodeCount} nodes
                          </div>
                          <div className="text-xs text-white/45">
                            {project.lastModified.toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      {/* Mobile Responsive Layout */}
                      <div className="md:hidden mt-4 pt-3 border-t border-white/5">
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-white/60 font-medium">
                            {project.nodeCount} nodes
                          </div>
                          <div className="text-xs text-white/45">
                            {project.lastModified.toLocaleDateString()}
                          </div>
                        </div>
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
          ) : viewMode === 'list' ? (
            <div className="p-4 space-y-8 overflow-y-auto max-h-[calc(100vh-80px)] custom-scrollbar">
              {/* List View */}
              <div className="space-y-8">
                <div className="px-1">
                  <h2 className="text-lg font-medium text-white/60 mb-1">All Projects</h2>
                  <p className="text-sm text-white/40">{filteredProjects.length} projects in your workspace</p>
                </div>
                <div className="space-y-4">
                  {filteredProjects.map((project, index) => (
                    <button
                      key={project.id}
                      onClick={() => setSelectedProject(project)}
                      className="group relative w-full p-5 text-left backdrop-blur-[12px] transition-all duration-200 ease-out cursor-pointer hover:-translate-y-0.5"
                      style={{
                        borderRadius: '14px',
                        background: 'rgba(20, 20, 20, 0.35)',
                        backgroundImage: 'radial-gradient(circle at top left, rgba(255, 255, 255, 0.03) 0%, transparent 50%)',
                        animationDelay: `${index * 20}ms`,
                        animation: 'fade-in-up 0.6s ease-out forwards'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(30, 30, 30, 0.45)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(20, 20, 20, 0.35)';
                        e.currentTarget.style.backgroundImage = 'radial-gradient(circle at top left, rgba(255, 255, 255, 0.03) 0%, transparent 50%)';
                      }}
                    >
                      {/* Horizontal Layout: Icon + Content + Status + Meta */}
                      <div className="flex items-center gap-4">
                        {/* Left Section - Icon */}
                        <div className="flex-shrink-0">
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:shadow-lg"
                            style={{ 
                              background: getProjectGradient(project.id),
                              boxShadow: '0 0 0 0 rgba(59, 130, 246, 0)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.boxShadow = '0 0 20px 4px rgba(59, 130, 246, 0.15)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.boxShadow = '0 0 0 0 rgba(59, 130, 246, 0)';
                            }}
                          >
                            {React.createElement(getProjectIcon(project.id), {
                              className: "w-5 h-5 text-white/95"
                            })}
                          </div>
                        </div>

                        {/* Center Section - Main Info */}
                        <div className="flex-1 min-w-0">
                          {/* Title */}
                          <h3 
                            className="font-semibold text-base leading-tight truncate text-white/90 mb-1"
                            title={project.name}
                          >
                            {project.name}
                          </h3>
                          
                          {/* Description */}
                          <p className="text-sm text-white/70 truncate">
                            {project.description}
                          </p>
                        </div>

                        {/* Status Pill */}
                        <div className="hidden md:flex flex-shrink-0">
                          <div 
                            className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold"
                            style={{
                              background: 'rgba(255, 255, 255, 0.08)',
                              color: 'rgba(255, 255, 255, 0.8)'
                            }}
                          >
                            {project.status}
                          </div>
                        </div>

                        {/* Right Section - Meta Info */}
                        <div className="hidden md:flex flex-shrink-0 text-right">
                          <div className="space-y-1">
                            <div className="text-xs text-white/60 font-medium">
                              {project.nodeCount} nodes
                            </div>
                            <div className="text-xs text-white/45">
                              {project.lastModified.toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Mobile Responsive Layout */}
                      <div className="md:hidden mt-3 pt-3 border-t border-white/5">
                        <div className="flex justify-between items-center">
                          <div 
                            className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold"
                            style={{
                              background: 'rgba(255, 255, 255, 0.08)',
                              color: 'rgba(255, 255, 255, 0.8)'
                            }}
                          >
                            {project.status}
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-xs text-white/60 font-medium">
                              {project.nodeCount} nodes
                            </div>
                            <div className="text-xs text-white/45">
                              {project.lastModified.toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : viewMode === 'table' ? (
            <div className="p-4 space-y-8 overflow-y-auto max-h-[calc(100vh-80px)] custom-scrollbar">
              {/* Table View - Coming Soon */}
              <div className="text-center py-12">
                <div className="text-neutral-400 text-lg mb-2">Table View</div>
                <div className="text-neutral-500 text-sm">Coming soon...</div>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-8 overflow-y-auto max-h-[calc(100vh-80px)] custom-scrollbar">
              {/* Recent Projects Section */}
              <div className="space-y-8">
                <div className="px-1">
                  <h2 className="text-lg font-medium text-white/60 mb-1">Recent Projects</h2>
                  <p className="text-sm text-white/40">Your most recently accessed projects</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.slice(0, 6).map((project, index) => (
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
                      className="group relative p-5 text-left backdrop-blur-[12px] transition-all duration-200 ease-out cursor-pointer hover:-translate-y-0.5"
                      style={{
                        borderRadius: '14px',
                        background: 'rgba(20, 20, 20, 0.35)',
                        backgroundImage: 'radial-gradient(circle at top left, rgba(255, 255, 255, 0.03) 0%, transparent 50%)',
                        animationDelay: `${index * 50}ms`,
                        animation: 'fade-in-up 0.6s ease-out forwards'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(30, 30, 30, 0.45)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(20, 20, 20, 0.35)';
                        e.currentTarget.style.backgroundImage = 'radial-gradient(circle at top left, rgba(255, 255, 255, 0.03) 0%, transparent 50%)';
                      }}
                    >
                      {/* Layout: Icon + Content + Meta */}
                      <div className="flex items-start gap-4">
                        {/* Left Section - Icon */}
                        <div className="flex-shrink-0">
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:shadow-lg"
                            style={{ 
                              background: getProjectGradient(project.id),
                              boxShadow: '0 0 0 0 rgba(59, 130, 246, 0)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.boxShadow = '0 0 20px 4px rgba(59, 130, 246, 0.15)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.boxShadow = '0 0 0 0 rgba(59, 130, 246, 0)';
                            }}
                          >
                            {React.createElement(getProjectIcon(project.id), {
                              className: "w-5 h-5 text-white/95"
                            })}
                          </div>
                        </div>

                        {/* Center Section - Main Info */}
                        <div className="flex-1 min-w-0">
                          {/* Title */}
                          <h3 
                            className="font-semibold text-base leading-tight truncate text-white/90 mb-1"
                            title={project.name}
                          >
                            {project.name}
                          </h3>
                          
                          {/* Description */}
                          <p className="text-sm text-white/70 truncate mb-2">
                            {project.description}
                          </p>
                          
                          {/* Status Pill */}
                          <div 
                            className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold"
                            style={{
                              background: 'rgba(255, 255, 255, 0.08)',
                              color: 'rgba(255, 255, 255, 0.8)'
                            }}
                          >
                            {project.status}
                          </div>
                        </div>

                        {/* Right Section - Meta Info */}
                        <div className="flex-shrink-0 text-right">
                          <div className="text-xs text-white/60 font-medium mb-1">
                            {project.nodeCount} nodes
                          </div>
                          <div className="text-xs text-white/45">
                            {project.lastModified.toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      {/* Mobile Responsive Layout */}
                      <div className="md:hidden mt-4 pt-3 border-t border-white/5">
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-white/60 font-medium">
                            {project.nodeCount} nodes
                          </div>
                          <div className="text-xs text-white/45">
                            {project.lastModified.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Spacer */}
              <div className="py-8"></div>

              {/* All Projects Section */}
              <div className="space-y-8">
                <div className="px-1">
                  <h2 className="text-lg font-medium text-white/60 mb-1">All Projects</h2>
                  <p className="text-sm text-white/40">{filteredProjects.length} projects in your workspace</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProjects.map((project, index) => (
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
                      className="group relative p-5 text-left backdrop-blur-[12px] transition-all duration-200 ease-out cursor-pointer hover:-translate-y-0.5"
                      style={{
                        borderRadius: '14px',
                        background: 'rgba(20, 20, 20, 0.35)',
                        backgroundImage: 'radial-gradient(circle at top left, rgba(255, 255, 255, 0.03) 0%, transparent 50%)',
                        animationDelay: `${index * 20}ms`,
                        animation: 'fade-in-up 0.6s ease-out forwards'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(30, 30, 30, 0.45)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(20, 20, 20, 0.35)';
                        e.currentTarget.style.backgroundImage = 'radial-gradient(circle at top left, rgba(255, 255, 255, 0.03) 0%, transparent 50%)';
                      }}
                    >
                      {/* Layout: Icon + Content + Meta */}
                      <div className="flex items-start gap-4">
                        {/* Left Section - Icon */}
                        <div className="flex-shrink-0">
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:shadow-lg"
                            style={{ 
                              background: getProjectGradient(project.id),
                              boxShadow: '0 0 0 0 rgba(59, 130, 246, 0)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.boxShadow = '0 0 20px 4px rgba(59, 130, 246, 0.15)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.boxShadow = '0 0 0 0 rgba(59, 130, 246, 0)';
                            }}
                          >
                            {React.createElement(getProjectIcon(project.id), {
                              className: "w-5 h-5 text-white/95"
                            })}
                          </div>
                        </div>

                        {/* Center Section - Main Info */}
                        <div className="flex-1 min-w-0">
                          {/* Title */}
                          <h3 
                            className="font-semibold text-base leading-tight truncate text-white/90 mb-1"
                            title={project.name}
                          >
                            {project.name}
                          </h3>
                          
                          {/* Description */}
                          <p className="text-sm text-white/70 truncate mb-2">
                            {project.description}
                          </p>
                          
                          {/* Status Pill */}
                          <div 
                            className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold"
                            style={{
                              background: 'rgba(255, 255, 255, 0.08)',
                              color: 'rgba(255, 255, 255, 0.8)'
                            }}
                          >
                            {project.status}
                          </div>
                        </div>

                        {/* Right Section - Meta Info */}
                        <div className="flex-shrink-0 text-right">
                          <div className="text-xs text-white/60 font-medium mb-1">
                            {project.nodeCount} nodes
                          </div>
                          <div className="text-xs text-white/45">
                            {project.lastModified.toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      {/* Mobile Responsive Layout */}
                      <div className="md:hidden mt-4 pt-3 border-t border-white/5">
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-white/60 font-medium">
                            {project.nodeCount} nodes
                          </div>
                          <div className="text-xs text-white/45">
                            {project.lastModified.toLocaleDateString()}
                          </div>
                        </div>
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
