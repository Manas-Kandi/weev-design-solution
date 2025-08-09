import React from 'react';
import { Project } from '@/types';
import ProjectCard from './ProjectCard';
import { motion } from 'framer-motion';

interface RecentBlockProps {
  projects?: Project[];
}

const RecentBlock: React.FC<RecentBlockProps> = ({ projects = [] }) => {
  if (!projects || projects.length === 0) {
    return (
      <div className="mb-empty-state">
        <div className="mb-empty-icon">📂</div>
        <h3>No recent projects</h3>
        <p>Projects you work on will appear here</p>
      </div>
    );
  }

  return (
    <div className="mb-recent-grid">
      {projects.slice(0, 5).map((project, index) => (
        <motion.div 
          key={project.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.2, 
            delay: index * 0.05,
            ease: [0.25, 0.1, 0.25, 1.0]
          }}
        >
          <ProjectCard 
            project={project} 
            size="large" 
            showPreview={true} 
          />
        </motion.div>
      ))}
    </div>
  );
};

export default RecentBlock;
