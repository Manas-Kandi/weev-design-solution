import React from 'react';
import { Project } from '@/types';
import { motion } from 'framer-motion';

interface StatsBlockProps {
  projects?: Project[];
}

const StatsBlock: React.FC<StatsBlockProps> = ({ projects = [] }) => {
  // Calculate statistics
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'deployed').length;
  const draftProjects = projects.filter(p => p.status === 'draft').length;
  const testingProjects = projects.filter(p => p.status === 'testing').length;
  
  // Calculate average nodes per project
  const avgNodes = projects.length > 0 
    ? Math.round(projects.reduce((sum, p) => sum + (p.nodeCount || 0), 0) / projects.length) 
    : 0;

  return (
    <div className="mb-stats">
      <motion.div 
        className="mb-stat"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.05 }}
      >
        <div className="mb-stat-number">{totalProjects}</div>
        <div className="mb-stat-label">Total Projects</div>
      </motion.div>
      
      <motion.div 
        className="mb-stat"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.1 }}
      >
        <div className="mb-stat-number">{activeProjects}</div>
        <div className="mb-stat-label">Active Projects</div>
      </motion.div>
      
      <motion.div 
        className="mb-stat"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.15 }}
      >
        <div className="mb-stat-number">{draftProjects}</div>
        <div className="mb-stat-label">Draft Projects</div>
      </motion.div>
      
      <motion.div 
        className="mb-stat"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.2 }}
      >
        <div className="mb-stat-number">{testingProjects}</div>
        <div className="mb-stat-label">Testing Projects</div>
      </motion.div>
      
      <motion.div 
        className="mb-stat"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.25 }}
      >
        <div className="mb-stat-number">{avgNodes}</div>
        <div className="mb-stat-label">Avg. Nodes</div>
      </motion.div>
    </div>
  );
};

export default StatsBlock;
