import { VectorStoreEntry, VectorStoreIndex, RetrievalResult } from '@/lib/nodes/memory/types';

export class VectorStore {
  private indices: Map<string, VectorStoreIndex> = new Map();
  private storageKey = 'agentflow_vector_store';

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Create or get an index
   */
  getIndex(name: string): VectorStoreIndex {
    if (!this.indices.has(name)) {
      const index: VectorStoreIndex = {
        name,
        entries: [],
        metadata: {
          createdAt: Date.now(),
          updatedAt: Date.now(),
          documentCount: 0,
          chunkCount: 0
        }
      };
      this.indices.set(name, index);
      this.saveToStorage();
    }
    return this.indices.get(name)!;
  }

  /**
   * Add entries to an index
   */
  async upsertEntries(indexName: string, entries: VectorStoreEntry[]): Promise<void> {
    const index = this.getIndex(indexName);
    
    for (const entry of entries) {
      // Remove existing entry with same ID if it exists
      const existingIndex = index.entries.findIndex(e => e.id === entry.id);
      if (existingIndex >= 0) {
        index.entries.splice(existingIndex, 1);
      }
      
      // Add new entry
      index.entries.push(entry);
    }

    // Update metadata
    index.metadata.updatedAt = Date.now();
    index.metadata.chunkCount = index.entries.length;
    
    // Count unique documents
    const uniqueSources = new Set(index.entries.map(e => e.source));
    index.metadata.documentCount = uniqueSources.size;

    this.saveToStorage();
  }

  /**
   * Retrieve similar entries using cosine similarity
   */
  async retrieve(indexName: string, queryEmbedding: number[], topK: number = 5): Promise<RetrievalResult[]> {
    const index = this.getIndex(indexName);
    
    if (index.entries.length === 0) {
      return [];
    }

    // Calculate cosine similarity for each entry
    const similarities = index.entries.map(entry => ({
      entry,
      score: this.cosineSimilarity(queryEmbedding, entry.embedding)
    }));

    // Sort by similarity score (descending) and take top K
    similarities.sort((a, b) => b.score - a.score);
    const topResults = similarities.slice(0, topK);

    // Convert to RetrievalResult format
    return topResults.map(({ entry, score }) => ({
      id: entry.id,
      score,
      summary: entry.summary,
      text: entry.text,
      source: entry.source,
      metadata: entry.metadata
    }));
  }

  /**
   * Search by text similarity (fallback when no embeddings)
   */
  async searchByText(indexName: string, query: string, topK: number = 5): Promise<RetrievalResult[]> {
    const index = this.getIndex(indexName);
    
    if (index.entries.length === 0) {
      return [];
    }

    const queryLower = query.toLowerCase();
    
    // Calculate text similarity scores
    const similarities = index.entries.map(entry => {
      const textLower = entry.text.toLowerCase();
      const summaryLower = entry.summary.toLowerCase();
      const keywordsLower = entry.keywords.join(' ').toLowerCase();
      
      // Simple text matching score
      let score = 0;
      
      // Exact phrase matches get highest score
      if (textLower.includes(queryLower)) score += 1.0;
      if (summaryLower.includes(queryLower)) score += 0.8;
      if (keywordsLower.includes(queryLower)) score += 0.6;
      
      // Word overlap scoring
      const queryWords = queryLower.split(/\s+/);
      const textWords = textLower.split(/\s+/);
      const summaryWords = summaryLower.split(/\s+/);
      
      const textOverlap = queryWords.filter(word => textWords.includes(word)).length / queryWords.length;
      const summaryOverlap = queryWords.filter(word => summaryWords.includes(word)).length / queryWords.length;
      
      score += textOverlap * 0.5;
      score += summaryOverlap * 0.3;
      
      return { entry, score };
    });

    // Sort by score and take top K
    similarities.sort((a, b) => b.score - a.score);
    const topResults = similarities.slice(0, topK);

    // Convert to RetrievalResult format
    return topResults.map(({ entry, score }) => ({
      id: entry.id,
      score,
      summary: entry.summary,
      text: entry.text,
      source: entry.source,
      metadata: entry.metadata
    }));
  }

  /**
   * Get index statistics
   */
  getIndexStats(indexName: string): { documentCount: number; chunkCount: number; lastUpdated: number } {
    const index = this.getIndex(indexName);
    return {
      documentCount: index.metadata.documentCount,
      chunkCount: index.metadata.chunkCount,
      lastUpdated: index.metadata.updatedAt
    };
  }

  /**
   * Delete an index
   */
  deleteIndex(indexName: string): void {
    this.indices.delete(indexName);
    this.saveToStorage();
  }

  /**
   * List all indices
   */
  listIndices(): string[] {
    return Array.from(this.indices.keys());
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * Simple hash function for text (fallback when no embeddings)
   */
  private textToHash(text: string): number[] {
    const hash = [];
    for (let i = 0; i < 128; i++) { // 128-dimensional hash vector
      let h = 0;
      for (let j = 0; j < text.length; j++) {
        h = ((h << 5) - h + text.charCodeAt(j) + i) & 0xffffffff;
      }
      hash.push((h / 0xffffffff + 1) / 2); // Normalize to [0, 1]
    }
    return hash;
  }

  /**
   * Generate embedding for text (with fallback to hash)
   */
  async generateEmbedding(text: string): Promise<number[]> {
    // TODO: Integrate with actual embedding service when available
    // For now, use text hash as fallback
    return this.textToHash(text);
  }

  /**
   * Save indices to localStorage
   */
  private saveToStorage(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const data = JSON.stringify(Array.from(this.indices.entries()));
        localStorage.setItem(this.storageKey, data);
      }
    } catch (error) {
      console.error('Failed to save vector store to localStorage:', error);
    }
  }

  /**
   * Load indices from localStorage
   */
  private loadFromStorage(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const data = localStorage.getItem(this.storageKey);
        if (data) {
          const entries = JSON.parse(data);
          this.indices = new Map(entries);
        }
      }
    } catch (error) {
      console.error('Failed to load vector store from localStorage:', error);
      this.indices = new Map();
    }
  }
}

// Singleton instance
export const vectorStore = new VectorStore();
