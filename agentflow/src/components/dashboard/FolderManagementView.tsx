"use client";

import React from 'react';
import { ArrowLeft, FolderPlus } from 'lucide-react';
import FolderTree from './FolderTree';
import type { Project } from '@/types';

interface FolderManagementViewProps {
  projects: Project[];
  onBack: () => void;
  onSelectProject: (projectId: string) => void;
}

export default function FolderManagementView({
  projects,
  onBack,
  onSelectProject,
}: FolderManagementViewProps) {
  return (
    <div className="min-h-screen relative overflow-hidden text-white flex flex-col items-center justify-start">
      {/* Same background as CleanDashboard */}
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

      <div className="relative z-10 w-full max-w-4xl px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onBack}
            className="relative overflow-hidden rounded-2xl p-3 text-white transition-all duration-300 ease-out hover:scale-105 group"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <ArrowLeft size={20} className="relative z-10" />
          </button>
          
          <div>
            <h1 className="text-2xl font-medium text-white">Your Folders</h1>
            <p className="text-sm text-gray-400">Organize your projects into folders</p>
          </div>
        </div>

        {/* Folder Management Content */}
        <div className="bg-black/20 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
          <FolderTree
            projects={projects}
            onSelectProject={onSelectProject}
            onSelectFolder={(folderId, folderName) => {
              console.log('Selected folder:', folderId, folderName);
            }}
          />
        </div>
      </div>
    </div>
  );
}
