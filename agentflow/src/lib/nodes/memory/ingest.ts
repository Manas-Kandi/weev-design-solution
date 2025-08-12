import { DocumentChunk, IngestedDocument, VectorStoreEntry } from './types';
import { vectorStore } from '@/services/vector/VectorStore';
import { callLLM } from '@/lib/llmClient';

export class DocumentIngestor {
  /**
   * Ingest a document into the memory system
   */
  async ingestDocument(
    file: File,
    indexName: string,
    options: {
      chunkSize: number;
      chunkOverlap: number;
      ingestMode: "full" | "summary-only";
    }
  ): Promise<IngestedDocument> {
    const document: IngestedDocument = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      filename: file.name,
      source: file.name,
      status: 'processing',
      chunks: [],
      ingestedAt: Date.now(),
      size: file.size
    };

    try {
      // Read file content
      const text = await this.readFileContent(file);
      
      // Split into chunks
      const chunks = this.splitIntoChunks(text, options.chunkSize, options.chunkOverlap);
      
      // Process each chunk
      const processedChunks: DocumentChunk[] = [];
      const vectorEntries: VectorStoreEntry[] = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunkText = chunks[i];
        const chunkId = `${document.id}_chunk_${i}`;

        try {
          // Generate summary and keywords
          const { summary, keywords } = await this.summarizeChunk(chunkText);
          
          // Generate embedding
          const embedding = await vectorStore.generateEmbedding(chunkText);

          // Create chunk
          const chunk: DocumentChunk = {
            id: chunkId,
            text: chunkText,
            summary,
            keywords,
            embedding,
            source: document.source,
            chunkIndex: i,
            metadata: {
              filename: file.name,
              fileSize: file.size,
              documentId: document.id
            }
          };

          processedChunks.push(chunk);

          // Create vector store entry
          const vectorEntry: VectorStoreEntry = {
            id: chunkId,
            text: options.ingestMode === "full" ? chunkText : summary,
            summary,
            keywords,
            embedding,
            source: document.source,
            chunkIndex: i,
            metadata: chunk.metadata,
            createdAt: Date.now()
          };

          vectorEntries.push(vectorEntry);
        } catch (error) {
          console.error(`Error processing chunk ${i}:`, error);
          // Continue with other chunks
        }
      }

      // Upsert to vector store
      await vectorStore.upsertEntries(indexName, vectorEntries);

      // Update document
      document.chunks = processedChunks;
      document.status = 'completed';

    } catch (error) {
      console.error('Error ingesting document:', error);
      document.status = 'error';
      document.error = error instanceof Error ? error.message : String(error);
    }

    return document;
  }

  /**
   * Read file content as text
   */
  private async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          reject(new Error('Failed to read file as text'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      
      reader.readAsText(file);
    });
  }

  /**
   * Split text into overlapping chunks
   */
  private splitIntoChunks(text: string, chunkSize: number, overlap: number): string[] {
    const chunks: string[] = [];
    const words = text.split(/\s+/);
    
    if (words.length <= chunkSize) {
      return [text];
    }

    let start = 0;
    while (start < words.length) {
      const end = Math.min(start + chunkSize, words.length);
      const chunk = words.slice(start, end).join(' ');
      chunks.push(chunk);
      
      if (end >= words.length) break;
      start = end - overlap;
    }

    return chunks;
  }

  /**
   * Generate summary and keywords for a text chunk using LLM
   */
  private async summarizeChunk(text: string): Promise<{ summary: string; keywords: string[] }> {
    try {
      const prompt = `Analyze the following text and provide:
1. A brief summary (1-2 sentences)
2. Key keywords/phrases (3-5 important terms)

Text:
${text}

Respond in JSON format:
{
  "summary": "brief summary here",
  "keywords": ["keyword1", "keyword2", "keyword3"]
}`;

      const result = await callLLM(prompt, {
        provider: "nvidia",
        model: process.env.NEXT_PUBLIC_NVIDIA_MODEL || "openai/gpt-oss-120b",
        temperature: 0.3,
        max_tokens: 200
      });

      // Try to parse JSON response
      try {
        const parsed = JSON.parse(result.text);
        return {
          summary: parsed.summary || this.extractSummary(text),
          keywords: Array.isArray(parsed.keywords) ? parsed.keywords : this.extractKeywords(text)
        };
      } catch (parseError) {
        // Fallback to simple extraction if JSON parsing fails
        return {
          summary: this.extractSummary(text),
          keywords: this.extractKeywords(text)
        };
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      // Fallback to simple extraction
      return {
        summary: this.extractSummary(text),
        keywords: this.extractKeywords(text)
      };
    }
  }

  /**
   * Simple fallback summary extraction
   */
  private extractSummary(text: string): string {
    // Take first sentence or first 100 characters
    const sentences = text.split(/[.!?]+/);
    if (sentences.length > 0 && sentences[0].length > 10) {
      return sentences[0].trim() + '.';
    }
    return text.substring(0, 100).trim() + (text.length > 100 ? '...' : '');
  }

  /**
   * Simple fallback keyword extraction
   */
  private extractKeywords(text: string): string[] {
    // Extract meaningful words (longer than 3 characters, not common words)
    const commonWords = new Set(['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'man', 'way', 'she', 'use', 'her', 'many', 'oil', 'sit', 'set', 'run', 'eat', 'far', 'sea', 'eye', 'ask', 'own', 'say', 'too', 'any', 'try', 'why', 'let', 'put', 'end', 'why', 'let', 'put', 'say', 'she', 'may', 'use']);
    
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.has(word));
    
    // Count word frequency
    const wordCount = new Map<string, number>();
    words.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });
    
    // Return top 5 most frequent words
    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }

  /**
   * Get ingestion status for multiple documents
   */
  getIngestionStatus(documentIds: string[]): Record<string, 'processing' | 'completed' | 'error'> {
    // This would typically be stored in a database or state management
    // For now, return a simple status map
    const status: Record<string, 'processing' | 'completed' | 'error'> = {};
    documentIds.forEach(id => {
      status[id] = 'completed'; // Simplified for demo
    });
    return status;
  }
}

// Singleton instance
export const documentIngestor = new DocumentIngestor();
