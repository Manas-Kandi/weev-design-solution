// Message node preset configurations
import { PresetConfig } from './types';

export const MESSAGE_PRESETS: Record<string, PresetConfig> = {
  email: {
    name: 'Email',
    description: 'Professional email format with subject and body',
    template: `Transform the provided information into a professional email format.

Context: {context}
Tone: {tone}
{audience ? 'Audience: {audience}' : ''}

Requirements:
- Include a clear, descriptive subject line
- Use proper email structure with greeting and closing
- Keep content concise and actionable
- Use {formatHint} formatting
- Match the {tone} tone throughout

Format the response as a complete email message.`,
    defaultTone: 'formal',
    suggestedFormat: 'markdown'
  },

  chat: {
    name: 'Chat Reply',
    description: 'Conversational response for chat interfaces',
    template: `Create a natural chat response based on the provided information.

Context: {context}
Tone: {tone}
{audience ? 'Audience: {audience}' : ''}

Requirements:
- Write in a conversational, natural style
- Keep response concise and engaging
- Use {formatHint} formatting if needed
- Match the {tone} tone
- Be direct and helpful

Provide a chat-appropriate response.`,
    defaultTone: 'friendly',
    suggestedFormat: 'markdown'
  },

  report: {
    name: 'Report',
    description: 'Structured report with sections and analysis',
    template: `Generate a structured report based on the provided information.

Context: {context}
Tone: {tone}
{audience ? 'Audience: {audience}' : ''}

Requirements:
- Use clear headings and sections
- Present information logically
- Include summary and key findings
- Use {formatHint} formatting
- Maintain {tone} tone throughout
- Be comprehensive yet concise

Create a well-structured report.`,
    defaultTone: 'neutral',
    suggestedFormat: 'markdown'
  },

  custom: {
    name: 'Custom',
    description: 'Use custom template for specialized formatting',
    template: '{customTemplate}', // Will be replaced with actual custom template
    defaultTone: 'neutral',
    suggestedFormat: 'markdown'
  }
};

export function getPresetTemplate(preset: string, customTemplate?: string): string {
  if (preset === 'custom' && customTemplate) {
    return customTemplate;
  }
  
  const presetConfig = MESSAGE_PRESETS[preset];
  if (!presetConfig) {
    throw new Error(`Unknown preset: ${preset}`);
  }
  
  return presetConfig.template;
}

export function getPresetDefaults(preset: string): Pick<PresetConfig, 'defaultTone' | 'suggestedFormat'> {
  const presetConfig = MESSAGE_PRESETS[preset];
  if (!presetConfig) {
    return { defaultTone: 'neutral', suggestedFormat: 'markdown' };
  }
  
  return {
    defaultTone: presetConfig.defaultTone,
    suggestedFormat: presetConfig.suggestedFormat
  };
}
