// Node definitions and color palette for AgentFlow
import { NodeCategory, NodeType, Colors } from '@/types';
import { User, Wrench, Database, Settings, Terminal, LayoutDashboard, MessageSquare } from 'lucide-react';

export const colors: Colors = {
  background: '#f8fafc',
  sidebar: '#f1f5f9',
  panel: '#f3f4f6',
  border: '#e5e7eb',
  text: '#1e293b',
  textSecondary: '#64748b',
  accent: '#6366f1',
  success: '#10b981',
  warning: '#f59e42',
  error: '#f43f5e',
  purple: '#a78bfa',
  orange: '#fb923c',
  blue: '#3b82f6',
  green: '#22c55e',
};

export const nodeCategories: NodeCategory[] = [
  {
    id: 'agent',
    name: 'Agents',
    type: 'agent',
    nodes: [
      {
        id: 'micro-agent',
        name: 'Micro Agent',
        icon: User,
        color: colors.accent,
        description: 'A micro-agent that can perform tasks',
        type: 'agent',
      },
    ],
  },
  {
    id: 'gui',
    name: 'UI',
    type: 'gui',
    nodes: [
      {
        id: 'dashboard',
        name: 'Dashboard',
        icon: LayoutDashboard,
        color: colors.blue,
        description: 'A dashboard UI component',
        type: 'gui',
      },
      {
        id: 'message',
        name: 'Message',
        icon: MessageSquare,
        color: colors.purple,
        description: 'A message UI component',
        type: 'gui',
      },
    ],
  },
  {
    id: 'logic',
    name: 'Logic',
    type: 'logic',
    nodes: [
      {
        id: 'if-else',
        name: 'If/Else',
        icon: Settings,
        color: colors.orange,
        description: 'Conditional logic node',
        type: 'logic',
      },
      {
        id: 'output',
        name: 'Output',
        icon: Terminal,
        color: colors.green,
        description: 'Output node',
        type: 'logic',
      },
    ],
  },
];
