import React, { useState } from 'react';
import { Project } from '@/types';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface ProjectCardProps {
  project: Project;
  size?: 'small' | 'large';
  showPreview?: boolean;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  size = 'small',
  showPreview = true,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Format date to relative time (e.g., "2 days ago")
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      return `${Math.floor(diffDays / 7)} weeks ago`;
    } else {
      return `${Math.floor(diffDays / 30)} months ago`;
    }
  };

  // Generate a placeholder preview if no preview is available
  const getPreviewStyle = () => {
    if (!project.previewUrl && !showPreview) return {};
    
    return {
      backgroundImage: project.previewUrl 
        ? `url(${project.previewUrl})` 
        : `linear-gradient(45deg, var(--accent-muted), var(--accent-subtle))`,
    };
  };

  return (
    <motion.div
      className={`project-card ${size === 'large' ? 'recent-project-card' : 'all-project-card'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1.0] }}
    >
      {showPreview && (
        <div 
          className={`project-card-preview ${isHovered ? 'show' : ''}`}
          style={getPreviewStyle()}
        />
      )}
      
      <div className="project-card-content">
        <h3 className="project-card-title">{project.name}</h3>
        
        <div className="project-card-meta">
          {project.updated_at && (
            <span className="project-card-date">
              {formatRelativeTime(project.updated_at)}
            </span>
          )}
        </div>
        
        {project.description && (
          <p className="project-card-description">{project.description}</p>
        )}
      </div>
      
      <div className={`project-card-actions ${isHovered ? 'show' : ''}`}>
        <Link href={`/project/${project.id}`} className="card-action-button primary">
          Open
        </Link>
        <button className="card-action-button">
          <span className="icon">⋮</span>
        </button>
      </div>
      
      {project.status && (
        <div className={`project-status status-${project.status.toLowerCase()}`}>
          {project.status}
        </div>
      )}
    </motion.div>
  );
};

export default ProjectCard;
