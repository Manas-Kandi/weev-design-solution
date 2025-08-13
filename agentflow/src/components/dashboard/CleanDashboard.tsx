"use client";

import React, { useState } from 'react';
import { Search, Plus, Folder, Server, Clock } from 'lucide-react';
import { Button } from '@/components/primitives/button';
import { Card } from '@/components/primitives/card';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import FolderManagementView from './FolderManagementView';
import type { Project } from '@/types';

interface CleanDashboardProps {
  projects: Project[];
  onCreateProject: () => void;
  onOpenProject: (id: string) => void;
  onManageFolders: () => void;
  onManageMCPServers: () => void;
}

export default function CleanDashboard({
  projects,
  onCreateProject,
  onOpenProject,
  onManageFolders,
  onManageMCPServers,
}: CleanDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentView, setCurrentView] = useState<'dashboard' | 'folders'>('dashboard');

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const recentProjects = filteredProjects
    .sort((a, b) => new Date(b.lastModified || 0).getTime() - new Date(a.lastModified || 0).getTime())
    .slice(0, 5);

  // Show folder management view if selected
  if (currentView === 'folders') {
    return (
      <FolderManagementView
        projects={projects}
        onBack={() => setCurrentView('dashboard')}
        onSelectProject={onOpenProject}
      />
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden text-white flex flex-col items-center justify-center">
      {/* Dense Dotted Gradient Background */}
      <div className="absolute inset-0">
        <div 
          className="w-full h-full"
          style={{
            backgroundColor: '#0a0a0a',
            backgroundImage: `
              radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.4) 0%, transparent 50%),
              radial-gradient(circle at 75% 75%, rgba(139, 92, 246, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 75% 25%, rgba(34, 197, 94, 0.25) 0%, transparent 50%),
              radial-gradient(circle at 25% 75%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
              radial-gradient(1px 1px at 0px 0px, rgba(59, 130, 246, 0.6), transparent),
              radial-gradient(1px 1px at 4px 2px, rgba(139, 92, 246, 0.5), transparent),
              radial-gradient(1px 1px at 8px 4px, rgba(34, 197, 94, 0.4), transparent),
              radial-gradient(1px 1px at 12px 6px, rgba(59, 130, 246, 0.5), transparent),
              radial-gradient(1px 1px at 16px 8px, rgba(139, 92, 246, 0.6), transparent),
              radial-gradient(1px 1px at 20px 10px, rgba(34, 197, 94, 0.5), transparent),
              radial-gradient(1px 1px at 24px 12px, rgba(59, 130, 246, 0.4), transparent),
              radial-gradient(1px 1px at 28px 14px, rgba(139, 92, 246, 0.5), transparent),
              radial-gradient(1px 1px at 32px 16px, rgba(34, 197, 94, 0.6), transparent),
              radial-gradient(1px 1px at 36px 18px, rgba(59, 130, 246, 0.5), transparent),
              radial-gradient(1px 1px at 40px 20px, rgba(139, 92, 246, 0.4), transparent),
              radial-gradient(1px 1px at 2px 22px, rgba(34, 197, 94, 0.5), transparent),
              radial-gradient(1px 1px at 6px 24px, rgba(59, 130, 246, 0.6), transparent),
              radial-gradient(1px 1px at 10px 26px, rgba(139, 92, 246, 0.5), transparent),
              radial-gradient(1px 1px at 14px 28px, rgba(34, 197, 94, 0.4), transparent),
              radial-gradient(1px 1px at 18px 30px, rgba(59, 130, 246, 0.5), transparent)
            `,
            backgroundSize: '100% 100%, 100% 100%, 100% 100%, 100% 100%, 44px 32px, 44px 32px, 44px 32px, 44px 32px, 44px 32px, 44px 32px, 44px 32px, 44px 32px, 44px 32px, 44px 32px, 44px 32px, 44px 32px, 44px 32px, 44px 32px, 44px 32px, 44px 32px'
          }}
        />
        {/* Dark Translucent Overlay */}
        <div 
          className="absolute inset-0" 
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.8)' 
          }} 
        />
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo and Title - Left Aligned */}
        <div className="flex items-center mb-8">
          <div className="flex items-center gap-3">
            <Image 
              src="/weave icon no background.png" 
              alt="Weev" 
              width={48} 
              height={48}
              className="w-12 h-12"
            />
            <h1 className="text-2xl font-medium text-white">Weev</h1>
            <span className="text-sm text-gray-400">
              Pro Trial • <span className="text-blue-400">Go unlimited</span>
            </span>
          </div>
        </div>

        {/* Main Action Buttons with Enhanced Liquid Glass Effect */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={onCreateProject}
            className="flex-1 relative overflow-hidden rounded-2xl px-4 py-3 text-sm text-white flex items-center justify-center gap-2 transition-all duration-500 ease-out hover:scale-[1.02] group"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 0 20px rgba(59, 130, 246, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-blue-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out" />
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-all duration-700 ease-out" />
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-green-400/20 rounded-2xl opacity-0 group-hover:opacity-30 blur-sm transition-all duration-500 ease-out" />
            <Folder size={16} className="relative z-10 transition-all duration-300 group-hover:scale-110" />
            <span className="relative z-10 transition-all duration-300 group-hover:text-blue-100">Create project</span>
          </button>
          
          <button
            onClick={() => setCurrentView('folders')}
            className="flex-1 relative overflow-hidden rounded-2xl px-4 py-3 text-sm text-white flex items-center justify-center gap-2 transition-all duration-500 ease-out hover:scale-[1.02] group"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 0 20px rgba(139, 92, 246, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-purple-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out" />
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-all duration-700 ease-out" />
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-400/20 via-blue-400/20 to-green-400/20 rounded-2xl opacity-0 group-hover:opacity-30 blur-sm transition-all duration-500 ease-out" />
            <Server size={16} className="relative z-10 transition-all duration-300 group-hover:scale-110" />
            <span className="relative z-10 transition-all duration-300 group-hover:text-purple-100">Your folders</span>
          </button>
          
          <button
            onClick={onManageMCPServers}
            className="flex-1 relative overflow-hidden rounded-2xl px-4 py-3 text-sm text-white flex items-center justify-center gap-2 transition-all duration-500 ease-out hover:scale-[1.02] group"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 0 20px rgba(34, 197, 94, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-green-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out" />
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-all duration-700 ease-out" />
            <div className="absolute -inset-1 bg-gradient-to-r from-green-400/20 via-blue-400/20 to-purple-400/20 rounded-2xl opacity-0 group-hover:opacity-30 blur-sm transition-all duration-500 ease-out" />
            <Plus size={16} className="relative z-10 transition-all duration-300 group-hover:scale-110" />
            <span className="relative z-10 transition-all duration-300 group-hover:text-green-100">MCP servers</span>
          </button>
        </div>

        {/* Recent Projects Section */}
        {recentProjects.length > 0 && (
          <div className="mb-6">
            <div className="text-xs text-gray-500 mb-3">Recent projects</div>
            <div className="space-y-1">
              {recentProjects.map((project) => (
                <div
                  key={project.id}
                  className="relative overflow-hidden flex items-center justify-between py-2 px-3 rounded-lg cursor-pointer group transition-all duration-300 ease-out hover:scale-[1.005]"
                  style={{
                    background: 'transparent',
                    backdropFilter: 'blur(0px)',
                    border: '1px solid transparent'
                  }}
                  onClick={() => onOpenProject(project.id)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.backdropFilter = 'blur(10px)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.backdropFilter = 'blur(0px)';
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-400 ease-out" />
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/3 via-transparent to-purple-400/3 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out" />
                  <div className="flex items-center gap-3 min-w-0 relative z-10">
                    <div className="text-sm text-gray-300 truncate transition-all duration-300 group-hover:text-gray-100">{project.name}</div>
                  </div>
                  <div className="flex-shrink-0 relative z-10">
                    <span 
                      className={cn(
                        "text-xs px-2 py-1 rounded-full transition-all duration-300",
                        project.status === "draft" 
                          ? "bg-gray-600/10 text-gray-500 group-hover:bg-gray-600/15" 
                          : project.status === "testing"
                          ? "bg-gray-600/10 text-gray-500 group-hover:bg-gray-600/15"
                          : project.status === "deployed"
                          ? "bg-gray-600/10 text-gray-500 group-hover:bg-gray-600/15"
                          : "bg-gray-600/10 text-gray-500 group-hover:bg-gray-600/15"
                      )}
                    >
                      {project.status === "draft" ? "Draft" : 
                       project.status === "testing" ? "Testing" :
                       project.status === "deployed" ? "Ready" : 
                       "Unknown"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
