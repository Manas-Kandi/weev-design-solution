export interface MemoryNodeData {
  indexName?: string;
  ingestMode: "full" | "summary-only";
  chunkSize: number;
  chunkOverlap: number;
  retrievalTopK: number;
}

export interface DocumentChunk {
  id: string;
  text: string;
  summary: string;
  keywords: string[];
  embedding?: number[];
  source: string;
  chunkIndex: number;
  metadata: Record<string, any>;
}

export interface IngestedDocument {
  id: string;
  filename: string;
  source: string;
  status: 'processing' | 'completed' | 'error';
  error?: string;
  chunks: DocumentChunk[];
  ingestedAt: number;
  size: number;
}

export interface RetrievalResult {
  id: string;
  score: number;
  summary: string;
  text?: string;
  source: string;
  metadata?: Record<string, any>;
}

export interface MemoryNodeOutput {
  type: 'json';
  content: {
    query: string;
    context: RetrievalResult[];
  };
  meta: {
    nodeType: 'memory';
    indexName: string;
    k: number;
    retrievalTime?: number;
  };
}

export interface VectorStoreEntry {
  id: string;
  text: string;
  summary: string;
  keywords: string[];
  embedding: number[];
  source: string;
  chunkIndex: number;
  metadata: Record<string, any>;
  createdAt: number;
}

export interface VectorStoreIndex {
  name: string;
  entries: VectorStoreEntry[];
  metadata: {
    createdAt: number;
    updatedAt: number;
    documentCount: number;
    chunkCount: number;
  };
}
