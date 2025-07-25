// Node definitions and color palette for AgentFlow
import { NodeCategory, NodeType, Colors } from '@/types';
import { User, Wrench, Database, Settings, Terminal, LayoutDashboard, MessageSquare } from 'lucide-react';
import { theme } from '@/data/theme';
export const colors = theme;   // ← now has everything

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
        subtype: 'micro-agent',
        defaultInputs: [{ id: 'input-1', label: 'Input' }],
        defaultOutputs: [{ id: 'output-1', label: 'Output' }],
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
        subtype: 'dashboard',
        defaultInputs: [{ id: 'input-1', label: 'Input' }],
        defaultOutputs: [{ id: 'output-1', label: 'Output' }],
      },
      {
        id: 'message',
        name: 'Message',
        icon: MessageSquare,
        color: colors.accent,
        description: 'A message UI component',
        type: 'gui',
        subtype: 'message',
        defaultInputs: [{ id: 'input-1', label: 'Input' }],
        defaultOutputs: [{ id: 'output-1', label: 'Output' }],
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
        subtype: 'if-else',
        defaultInputs: [{ id: 'input-1', label: 'Condition' }],
        defaultOutputs: [
          { id: 'output-1', label: 'True' },
          { id: 'output-2', label: 'False' },
        ],
      },
      {
        id: 'output',
        name: 'Output',
        icon: Terminal,
        color: colors.active,
        description: 'Output node',
        type: 'logic',
        subtype: 'output',
        defaultInputs: [{ id: 'input-1', label: 'Input' }],
        defaultOutputs: [{ id: 'output-1', label: 'Output' }],
      },
    ],
  },
];
