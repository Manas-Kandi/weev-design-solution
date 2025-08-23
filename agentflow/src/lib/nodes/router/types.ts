export interface RouterNodeData {
  mode?: "expression";
  expression?: string;
}

export interface RouterNodeOutput {
  type: 'json';
  content: {
    decision: boolean;
  };
  meta: {
    nodeType: 'router';
    mode: "expression";
    error?: string;
    evaluationResult?: any;
  };
}
