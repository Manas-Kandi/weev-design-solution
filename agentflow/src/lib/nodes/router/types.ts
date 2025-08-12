export interface RouterNodeData {
  mode: "expression" | "llm";
  expression?: string;
  llmRule?: string;
}

export interface RouterNodeOutput {
  type: 'json';
  content: {
    decision: boolean;
  };
  meta: {
    nodeType: 'router';
    mode: "expression" | "llm";
    error?: string;
    evaluationResult?: any;
    llmResponse?: string;
  };
}
