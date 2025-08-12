import { BaseNode, NodeContext } from "../base/BaseNode";
import { NodeOutput } from "@/types";
import { MemoryNodeData, MemoryNodeOutput, RetrievalResult } from "./types";
import { vectorStore } from "@/services/vector/VectorStore";

export class MemoryNode extends BaseNode {
  async execute(context: NodeContext): Promise<MemoryNodeOutput> {
    try {
      const data = this.node.data as MemoryNodeData;
      
      // Provide defaults
      const indexName = data.indexName || `project_${context.config?.projectId || 'default'}`;
      const retrievalTopK = data.retrievalTopK || 5;
      
      // Get inputs from connections or use context inputs
      const inputs = context.inputs || this.getInputsFromConnections(context);
      
      // Build query string from inputs
      const query = this.buildQueryFromInputs(inputs);
      
      if (!query || query.trim().length === 0) {
        // Return empty context if no query
        return {
          type: 'json',
          content: {
            query: '',
            context: []
          },
          meta: {
            nodeType: 'memory',
            indexName,
            k: retrievalTopK
          }
        };
      }

      const startTime = Date.now();
      
      // Retrieve relevant context
      let retrievalResults: RetrievalResult[];
      
      try {
        // Try embedding-based retrieval first
        const queryEmbedding = await vectorStore.generateEmbedding(query);
        retrievalResults = await vectorStore.retrieve(indexName, queryEmbedding, retrievalTopK);
        
        // Fallback to text-based search if no results
        if (retrievalResults.length === 0) {
          retrievalResults = await vectorStore.searchByText(indexName, query, retrievalTopK);
        }
      } catch (error) {
        console.error('Error during retrieval:', error);
        // Fallback to text search
        retrievalResults = await vectorStore.searchByText(indexName, query, retrievalTopK);
      }

      const retrievalTime = Date.now() - startTime;

      // Return memory output
      return {
        type: 'json',
        content: {
          query,
          context: retrievalResults
        },
        meta: {
          nodeType: 'memory',
          indexName,
          k: retrievalTopK,
          retrievalTime
        }
      };

    } catch (error) {
      console.error('MemoryNode execution error:', error);
      
      const data = this.node.data as MemoryNodeData;
      const indexName = data.indexName || `project_${context.config?.projectId || 'default'}`;
      
      return {
        type: 'json',
        content: {
          query: '',
          context: []
        },
        meta: {
          nodeType: 'memory',
          indexName,
          k: data.retrievalTopK || 5,
          error: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }

  private getInputsFromConnections(context: NodeContext): Record<string, any> {
    const inputs: Record<string, any> = {};
    
    // Get all connections targeting this node
    const incomingConnections = context.connections.filter(
      conn => conn.targetNode === this.node.id
    );

    // Collect outputs from connected nodes
    for (const connection of incomingConnections) {
      const sourceOutput = context.nodeOutputs[connection.sourceNode];
      if (sourceOutput) {
        inputs[connection.targetInput || 'input'] = sourceOutput;
      }
    }

    return inputs;
  }

  private buildQueryFromInputs(inputs: Record<string, any>): string {
    const queryParts: string[] = [];
    
    for (const [key, value] of Object.entries(inputs)) {
      if (value && typeof value === 'object' && 'type' in value && 'content' in value) {
        // FlowIO format
        if (value.type === 'text') {
          queryParts.push(String(value.content));
        } else if (value.type === 'json') {
          // Extract important fields from JSON content
          const content = value.content;
          if (typeof content === 'object' && content !== null) {
            // Look for common text fields
            const textFields = ['query', 'question', 'text', 'message', 'content', 'description', 'summary'];
            for (const field of textFields) {
              if (content[field] && typeof content[field] === 'string') {
                queryParts.push(content[field]);
              }
            }
            
            // If no text fields found, stringify important-looking fields
            if (queryParts.length === 0) {
              const importantFields = Object.entries(content)
                .filter(([k, v]) => typeof v === 'string' && v.length > 0 && v.length < 500)
                .map(([k, v]) => `${k}: ${v}`)
                .slice(0, 3); // Limit to first 3 fields
              
              queryParts.push(...importantFields);
            }
          } else {
            queryParts.push(JSON.stringify(content));
          }
        }
      } else if (typeof value === 'string') {
        queryParts.push(value);
      } else if (typeof value === 'object' && value !== null) {
        // Try to extract meaningful text from object
        const stringified = JSON.stringify(value);
        if (stringified.length < 500) {
          queryParts.push(stringified);
        }
      }
    }
    
    return queryParts.join(' ').trim();
  }

  /**
   * Get index statistics for the properties panel
   */
  async getIndexStats(indexName?: string): Promise<{ documentCount: number; chunkCount: number; lastUpdated: number }> {
    const actualIndexName = indexName || `project_default`;
    return vectorStore.getIndexStats(actualIndexName);
  }

  /**
   * Delete the index (for cleanup)
   */
  async deleteIndex(indexName?: string): Promise<void> {
    const actualIndexName = indexName || `project_default`;
    vectorStore.deleteIndex(actualIndexName);
  }
}
