import React from 'react';
import { Shield, Globe, Database } from 'lucide-react';
import type { ToolEnvironment } from '@/types/toolSimulator';

interface EnvironmentSelectorProps {
  value: ToolEnvironment;
  onChange: (value: ToolEnvironment) => void;
  disabled?: boolean;
}

export function EnvironmentSelector({ value, onChange, disabled = false }: EnvironmentSelectorProps) {
  const environments = [
    {
      key: 'mock' as ToolEnvironment,
      label: 'Mock',
      description: 'All tools use simulated data',
      icon: Database,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20'
    },
    {
      key: 'mixed' as ToolEnvironment,
      label: 'Mixed',
      description: 'Respect individual tool modes',
      icon: Globe,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20'
    },
    {
      key: 'live' as ToolEnvironment,
      label: 'Live',
      description: 'Real API calls (feature-flagged)',
      icon: Shield,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
      disabled: true
    }
  ];

  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        Environment
      </label>
      <div className="grid grid-cols-3 gap-2">
        {environments.map((env) => {
          const Icon = env.icon;
          const isDisabled = disabled || env.disabled;
          
          return (
            <button
              key={env.key}
              onClick={() => !isDisabled && onChange(env.key)}
              disabled={isDisabled}
              className={`relative p-3 rounded-lg border transition-all ${
                value === env.key
                  ? `${env.borderColor} ${env.bgColor} ${env.color}`
                  : isDisabled
                  ? 'border-slate-700 bg-slate-800/50 text-slate-600 cursor-not-allowed'
                  : 'border-slate-600 bg-slate-700/50 text-slate-400 hover:border-slate-500 hover:bg-slate-600/50'
              }`}
            >
              <div className="flex flex-col items-center gap-1">
                <Icon size={16} />
                <span className="text-xs font-medium">{env.label}</span>
              </div>
              
              {env.disabled && (
                <div className="absolute -top-1 -right-1 text-xs bg-slate-600 text-slate-300 px-1.5 py-0.5 rounded-full">
                  Soon
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      <p className="mt-2 text-xs text-slate-500">
        {environments.find(e => e.key === value)?.description}
      </p>
    </div>
  );
}
