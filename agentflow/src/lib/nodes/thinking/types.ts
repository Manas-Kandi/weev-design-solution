// Thinking node types and contracts
export interface ThinkingNodeData {
  title: string;
  description: string;
  color: string;
  icon: string;
  systemPrompt?: string;
  style: "balanced" | "fast" | "deep";
  schemaHint?: string; // Optional JSON schema string for expected output shape
  allowToolCalls: boolean;
  [key: string]: unknown;
}

export interface ToolIntent {
  name: string;
  args: any;
}

export interface ThinkingOutput {
  answer: string;
  structured?: any;
}

export interface ThinkingMeta {
  nodeType: 'thinking';
  model: string;
  tokens?: number;
  toolIntents?: ToolIntent[];
  validation?: {
    schemaValid: boolean;
    error?: string;
  };
}

// Style presets for temperature and max tokens
export const THINKING_STYLE_PRESETS = {
  fast: {
    temperature: 0.3,
    maxTokens: 1000,
  },
  balanced: {
    temperature: 0.7,
    maxTokens: 2000,
  },
  deep: {
    temperature: 0.9,
    maxTokens: 4000,
  },
} as const;
