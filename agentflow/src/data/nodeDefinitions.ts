// Node definitions and color palette for AgentFlow
import { NodeCategory, NodeType, Colors } from '@/types';
import { User, Wrench, Database, Settings, Terminal, LayoutDashboard, MessageSquare, FileText, GitBranch } from 'lucide-react';
import { theme } from './theme';
export const colors = theme;          // drop-in for legacy refs

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
        color: colors.bgElevate,
        description: 'A dashboard UI component',
        type: 'gui',
      },
      {
        id: 'message',
        name: 'Message',
        icon: MessageSquare,
        color: colors.accent,
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
        color: colors.danger,
        description: 'Conditional logic node',
        type: 'logic',
      },
      {
        id: 'output',
        name: 'Output',
        icon: Terminal,
        color: colors.active,
        description: 'Output node',
        type: 'logic',
      },
    ],
  },
  {
    id: 'core',
    name: 'Core Nodes',
    type: 'agent', // Add a valid type to match NodeCategory
    nodes: [
      {
        id: 'user_intent',
        name: 'User Intent',
        type: 'agent',
        subtype: 'intent',
        color: '#4285F4',
        icon: MessageSquare,
        description: 'Represents user input and intent detection',
        defaultInputs: [{ id: 'input-1', label: 'Trigger' }],
        defaultOutputs: [{ id: 'output-1', label: 'Detected Intent' }],
      },
      {
        id: 'agent_response',
        name: 'Agent Response',
        type: 'agent',
        subtype: 'response',
        color: '#34A853',
        icon: FileText,
        description: 'Generates agent responses',
        defaultInputs: [{ id: 'input-1', label: 'Context' }],
        defaultOutputs: [{ id: 'output-1', label: 'Response' }],
      },
      {
        id: 'branch',
        name: 'Branch/Condition',
        type: 'logic',
        subtype: 'branch',
        color: '#9C27B0',
        icon: GitBranch,
        description: 'Branch based on conditions',
        defaultInputs: [{ id: 'input-1', label: 'Input' }],
        defaultOutputs: [
          { id: 'output-1', label: 'True' },
          { id: 'output-2', label: 'False' },
        ],
      },
      {
        id: 'memory',
        name: 'Memory Object',
        type: 'agent',
        subtype: 'memory',
        color: '#FF9800',
        icon: Database,
        description: 'Stores and manages memory',
        defaultInputs: [{ id: 'input-1', label: 'Data' }],
        defaultOutputs: [{ id: 'output-1', label: 'Stored' }],
      },
    ],
  },
  // ...add other categories as needed...
];
