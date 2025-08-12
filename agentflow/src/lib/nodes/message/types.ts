// Message node types and contracts
export interface MessageNodeData {
  title: string;
  description: string;
  color: string;
  icon: string;
  preset: "email" | "chat" | "report" | "custom";
  tone: "neutral" | "friendly" | "formal";
  audience?: string; // Optional audience description
  formatHint: "markdown" | "plain" | "html";
  customTemplate?: string; // Only used when preset=custom
  [key: string]: unknown;
}

export interface MessageOutput {
  type: 'text';
  content: string;
  meta: {
    nodeType: 'message';
    preset: string;
    tone: string;
    formatHint: string;
    audience?: string;
    model?: string;
    tokens?: number;
  };
  timestamp: number;
  nodeId: string;
}

export interface PresetConfig {
  name: string;
  description: string;
  template: string;
  defaultTone: "neutral" | "friendly" | "formal";
  suggestedFormat: "markdown" | "plain" | "html";
}
