import { useState } from 'react';

export const useStepExpansion = () => {
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  const toggleStep = (stepId: string) => {
    setExpandedStep(prev => (prev === stepId ? null : stepId));
  };

  return { expandedStep, toggleStep };
};