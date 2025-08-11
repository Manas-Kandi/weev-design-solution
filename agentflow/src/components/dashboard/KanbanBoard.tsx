import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Plus, MessageCircle, CheckSquare, Users, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Project } from '@/types';
import styles from './css/KanbanBoard.module.css';

// Kanban column definitions with status colors
const KANBAN_COLUMNS = [
  {
    id: 'not-started',
    title: 'Not Started',
    color: 'rgb(100, 116, 139)', // Muted Blue
    bgColor: 'rgba(100, 116, 139, 0.1)',
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  {
    id: 'ready',
    title: 'Ready',
    color: 'rgb(139, 92, 246)', // Soft Purple
    bgColor: 'rgba(139, 92, 246, 0.1)',
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    color: 'rgb(20, 184, 166)', // Teal
    bgColor: 'rgba(20, 184, 166, 0.1)',
    borderColor: 'rgba(20, 184, 166, 0.2)',
  },
  {
    id: 'blocked',
    title: 'Blocked',
    color: 'rgb(239, 68, 68)', // Muted Red
    bgColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  {
    id: 'done',
    title: 'Done',
    color: 'rgb(34, 197, 94)', // Desaturated Green
    bgColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  {
    id: 'cancelled',
    title: 'Cancelled',
    color: 'rgb(107, 114, 128)', // Neutral Gray
    bgColor: 'rgba(107, 114, 128, 0.1)',
    borderColor: 'rgba(107, 114, 128, 0.2)',
  },
];

interface KanbanBoardProps {
  projects: Project[];
  onUpdateProjectStatus: (projectId: string, newStatus: string) => void;
  onProjectClick: (project: Project) => void;
}

interface ProjectCardProps {
  project: Project;
  onOpen: () => void;
  isDragging?: boolean;
}

// Mock data for demonstration - replace with actual project data
const mockUsers = [
  { id: '1', name: 'John Doe', avatar: '/api/placeholder/32/32' },
  { id: '2', name: 'Jane Smith', avatar: '/api/placeholder/32/32' },
  { id: '3', name: 'Mike Johnson', avatar: '/api/placeholder/32/32' },
];

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onOpen, isDragging = false }) => {
  const getStatusColor = (status: string) => {
    const column = KANBAN_COLUMNS.find(col => col.id === status || col.title.toLowerCase().replace(' ', '-') === status);
    return column?.color || KANBAN_COLUMNS[0].color;
  };

  const truncateText = (text: string, maxLength: number = 120) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -2, boxShadow: '0 8px 25px rgba(0,0,0,0.15)' }}
      whileDrag={{ 
        scale: 1.02, 
        rotate: 2,
        boxShadow: '0 15px 35px rgba(0,0,0,0.25)',
        zIndex: 1000 
      }}
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      className={cn(
        "bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-xl p-4 cursor-pointer transition-all duration-200",
        "hover:bg-white/[0.06] hover:border-white/[0.12]",
        isDragging && "shadow-2xl"
      )}
      onClick={onOpen}
    >
      {/* Project Name */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-white font-semibold text-sm leading-tight pr-2">
          {project.name}
        </h3>
        <div className="flex items-center gap-1 text-neutral-500 text-xs">
          <Calendar className="w-3 h-3" />
          <span>{project.lastModified.toLocaleDateString()}</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-neutral-400 text-xs leading-relaxed mb-4">
        {truncateText(project.description)}
      </p>

      {/* Bottom Row */}
      <div className="flex items-center justify-between">
        {/* User Avatars */}
        <div className="flex -space-x-2">
          {mockUsers.slice(0, 3).map((user, index) => (
            <div
              key={user.id}
              className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 border-2 border-gray-900 flex items-center justify-center text-white text-xs font-medium"
              style={{ zIndex: 10 - index }}
            >
              {user.name.charAt(0)}
            </div>
          ))}
          {mockUsers.length > 3 && (
            <div className="w-6 h-6 rounded-full bg-neutral-700 border-2 border-gray-900 flex items-center justify-center text-neutral-300 text-xs">
              +{mockUsers.length - 3}
            </div>
          )}
        </div>

        {/* Tags and Meta */}
        <div className="flex items-center gap-2">
          {/* Status Tag */}
          <span 
            className="px-2 py-1 rounded-full text-xs font-medium"
            style={{ 
              backgroundColor: `${getStatusColor(project.status)}20`,
              color: getStatusColor(project.status),
              border: `1px solid ${getStatusColor(project.status)}30`
            }}
          >
            {project.status}
          </span>

          {/* Meta Icons */}
          <div className="flex items-center gap-1 text-neutral-500">
            <div className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              <span className="text-xs">3</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckSquare className="w-3 h-3" />
              <span className="text-xs">12</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const KanbanColumn: React.FC<{
  column: typeof KANBAN_COLUMNS[0];
  projects: Project[];
  onProjectOpen: (project: Project) => void;
}> = ({ column, projects, onProjectOpen }) => {
  return (
    <div className="flex-shrink-0 w-80 h-full flex flex-col">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4 px-1 flex-shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-neutral-300 font-semibold text-sm">
            {column.title}
          </h2>
          <span 
            className="px-2 py-1 rounded-full text-xs font-medium"
            style={{ 
              backgroundColor: column.bgColor,
              color: column.color,
              border: `1px solid ${column.borderColor}`
            }}
          >
            {projects.length}
          </span>
        </div>
      </div>

      {/* Column Content */}
      <div 
        className={cn(
          "flex-1 rounded-xl border border-white/[0.04] p-3 space-y-3 overflow-y-auto min-h-0",
          styles.columnContent
        )}
        style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.02)'
        }}
      >
        <AnimatePresence>
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onOpen={() => onProjectOpen(project)}
            />
          ))}
        </AnimatePresence>

        {/* Empty State */}
        {projects.length === 0 && (
          <div className="flex items-center justify-center h-32 text-neutral-500 text-sm">
            No projects in {column.title.toLowerCase()}
          </div>
        )}
      </div>
    </div>
  );
};

export default function KanbanBoard({ 
  projects, 
  onProjectClick,
  onUpdateProjectStatus 
}: KanbanBoardProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Group projects by status
  const projectsByStatus = KANBAN_COLUMNS.reduce((acc, column) => {
    acc[column.id] = projects.filter(project => {
      const projectStatus = project.status.toLowerCase().replace(' ', '-');
      return projectStatus === column.id || 
             (column.id === 'not-started' && projectStatus === 'draft');
    });
    return acc;
  }, {} as Record<string, Project[]>);

  return (
    <div className="flex flex-col h-full">

      {/* Kanban Board */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-x-auto overflow-y-hidden px-6 py-6"
        style={{ scrollbarWidth: 'thin' }}
      >
        <div className="flex gap-6 h-full" style={{ minWidth: 'max-content' }}>
          {KANBAN_COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              projects={projectsByStatus[column.id] || []}
              onProjectOpen={onProjectClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
