import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryNode } from '@/lib/nodes/memory/Executor';
import { MemoryNodeData, MemoryNodeOutput } from '@/lib/nodes/memory/types';
import { NodeContext } from '@/lib/nodes/base/BaseNode';
import { CanvasNode, Connection } from '@/types';
import { vectorStore } from '@/services/vector/VectorStore';
import { documentIngestor } from '@/lib/nodes/memory/ingest';

// Mock the LLM client
vi.mock('@/lib/llmClient', () => ({
  callLLM: vi.fn()
}));

// Mock localStorage for test environment
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Mock global objects for test environment
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
});

Object.defineProperty(global, 'window', {
  value: { localStorage: localStorageMock },
  writable: true
});

import { callLLM } from '@/lib/llmClient';

describe('MemoryNode', () => {
  let memoryNode: MemoryNode;
  let mockNode: CanvasNode;
  let mockContext: NodeContext;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    mockNode = {
      id: 'memory-1',
      type: 'conversation',
      subtype: 'memory',
      position: { x: 0, y: 0 },
      size: { width: 200, height: 100 },
      data: {
        indexName: 'test_index',
        ingestMode: 'full',
        chunkSize: 800,
        chunkOverlap: 120,
        retrievalTopK: 5
      } as any,
      inputs: [{ id: 'query', label: 'Query', type: 'any' }],
      outputs: [{ id: 'context', label: 'Retrieved Context', type: 'json' }]
    };

    mockContext = {
      nodes: [mockNode],
      connections: [],
      nodeOutputs: {},
      currentNode: mockNode,
      inputs: {},
      config: { projectId: 'test_project' },
      flowContext: {},
      mode: 'development',
      runOptions: {}
    };

    memoryNode = new MemoryNode(mockNode);
  });

  afterEach(() => {
    // Clean up vector store
    vectorStore.deleteIndex('test_index');
  });

  describe('Basic Execution', () => {
    it('should return empty context when no query provided', async () => {
      mockContext.inputs = {};

      const result = await memoryNode.execute(mockContext) as MemoryNodeOutput;

      expect(result.type).toBe('json');
      expect(result.content).toEqual({
        query: '',
        context: []
      });
      expect(result.meta.nodeType).toBe('memory');
      expect(result.meta.indexName).toBe('test_index');
      expect(result.meta.k).toBe(5);
    });

    it('should handle text input and perform retrieval', async () => {
      // Setup some test data in vector store
      await vectorStore.upsertEntries('test_index', [
        {
          id: 'chunk_1',
          text: 'This is a test document about artificial intelligence and machine learning.',
          summary: 'Document about AI and ML',
          keywords: ['artificial', 'intelligence', 'machine', 'learning'],
          embedding: [0.1, 0.2, 0.3, 0.4, 0.5],
          source: 'test.txt',
          chunkIndex: 0,
          metadata: { filename: 'test.txt' },
          createdAt: Date.now()
        }
      ]);

      const inputs = {
        query: {
          type: 'text',
          content: 'artificial intelligence'
        }
      };

      mockContext.inputs = inputs;

      const result = await memoryNode.execute(mockContext) as MemoryNodeOutput;

      expect(result.type).toBe('json');
      expect(result.content.query).toBe('artificial intelligence');
      expect(result.content.context).toHaveLength(1);
      expect(result.content.context[0]).toMatchObject({
        id: 'chunk_1',
        summary: 'Document about AI and ML',
        text: 'This is a test document about artificial intelligence and machine learning.',
        source: 'test.txt'
      });
      expect(result.meta.retrievalTime).toBeGreaterThan(0);
    });

    it('should handle JSON input and extract query', async () => {
      const inputs = {
        input: {
          type: 'json',
          content: {
            query: 'machine learning algorithms',
            context: 'research'
          }
        }
      };

      mockContext.inputs = inputs;

      const result = await memoryNode.execute(mockContext) as MemoryNodeOutput;

      expect(result.content.query).toBe('machine learning algorithms');
    });

    it('should use default index name when not specified', async () => {
      mockNode.data = {
        ingestMode: 'full',
        chunkSize: 800,
        chunkOverlap: 120,
        retrievalTopK: 5
      } as any;

      const result = await memoryNode.execute(mockContext) as MemoryNodeOutput;

      expect(result.meta.indexName).toBe('project_test_project');
    });
  });

  describe('Input Processing', () => {
    it('should extract text from multiple input types', async () => {
      const inputs = {
        text_input: {
          type: 'text',
          content: 'search for documents'
        },
        json_input: {
          type: 'json',
          content: {
            description: 'about neural networks'
          }
        }
      };

      mockContext.inputs = inputs;

      const result = await memoryNode.execute(mockContext) as MemoryNodeOutput;

      expect(result.content.query).toContain('search for documents');
      expect(result.content.query).toContain('description: about neural networks');
    });

    it('should handle inputs from connections', async () => {
      const sourceNode = {
        id: 'source-1',
        type: 'agent',
        subtype: 'agent',
        position: { x: 0, y: 0 },
        size: { width: 200, height: 100 },
        data: {},
        inputs: [],
        outputs: [{ id: 'output', label: 'Output', type: 'text' }]
      };

      const connection: Connection = {
        id: 'conn-1',
        sourceNode: 'source-1',
        sourceOutput: 'output',
        targetNode: 'memory-1',
        targetInput: 'query'
      };

      mockContext.nodes = [sourceNode, mockNode];
      mockContext.connections = [connection];
      mockContext.nodeOutputs = {
        'source-1': { type: 'text', content: 'find information about deep learning', meta: {} }
      };
      mockContext.inputs = undefined;

      const result = await memoryNode.execute(mockContext) as MemoryNodeOutput;

      expect(result.content.query).toBe('find information about deep learning');
    });
  });

  describe('Retrieval Modes', () => {
    beforeEach(async () => {
      // Setup test data
      await vectorStore.upsertEntries('test_index', [
        {
          id: 'chunk_1',
          text: 'Deep learning is a subset of machine learning.',
          summary: 'Deep learning overview',
          keywords: ['deep', 'learning', 'machine'],
          embedding: [0.8, 0.2, 0.1, 0.3, 0.4],
          source: 'ml_guide.txt',
          chunkIndex: 0,
          metadata: { filename: 'ml_guide.txt' },
          createdAt: Date.now()
        },
        {
          id: 'chunk_2',
          text: 'Neural networks are the foundation of deep learning.',
          summary: 'Neural networks basics',
          keywords: ['neural', 'networks', 'foundation'],
          embedding: [0.7, 0.3, 0.2, 0.4, 0.5],
          source: 'nn_intro.txt',
          chunkIndex: 0,
          metadata: { filename: 'nn_intro.txt' },
          createdAt: Date.now()
        }
      ]);
    });

    it('should retrieve top-K results based on similarity', async () => {
      (mockNode.data as any).retrievalTopK = 1;

      const inputs = {
        query: { type: 'text', content: 'deep learning' }
      };

      mockContext.inputs = inputs;

      const result = await memoryNode.execute(mockContext) as MemoryNodeOutput;

      expect(result.content.context).toHaveLength(1);
      expect(result.content.context[0].id).toBe('chunk_1');
      expect(result.meta.k).toBe(1);
    });

    it('should fallback to text search when embedding fails', async () => {
      // Mock embedding generation to fail
      vi.spyOn(vectorStore, 'generateEmbedding').mockRejectedValue(new Error('Embedding failed'));

      const inputs = {
        query: { type: 'text', content: 'neural networks' }
      };

      mockContext.inputs = inputs;

      const result = await memoryNode.execute(mockContext) as MemoryNodeOutput;

      expect(result.content.context.length).toBeGreaterThan(0);
      expect(result.content.context[0].text).toContain('neural');
    });
  });

  describe('Error Handling', () => {
    it('should handle retrieval errors gracefully', async () => {
      // Mock vector store to throw error
      vi.spyOn(vectorStore, 'retrieve').mockRejectedValue(new Error('Vector store error'));
      vi.spyOn(vectorStore, 'searchByText').mockRejectedValue(new Error('Text search error'));

      const inputs = {
        query: { type: 'text', content: 'test query' }
      };

      mockContext.inputs = inputs;

      const result = await memoryNode.execute(mockContext) as MemoryNodeOutput;

      expect(result.content.context).toEqual([]);
      expect(result.meta.error).toBeDefined();
    });

    it('should handle malformed node data', async () => {
      mockNode.data = {} as any;

      const result = await memoryNode.execute(mockContext) as MemoryNodeOutput;

      expect(result.meta.indexName).toBe('project_test_project');
      expect(result.meta.k).toBe(5);
    });
  });

  describe('Index Management', () => {
    it('should get index statistics', async () => {
      await vectorStore.upsertEntries('test_index', [
        {
          id: 'chunk_1',
          text: 'Test content',
          summary: 'Test summary',
          keywords: ['test'],
          embedding: [0.1, 0.2],
          source: 'test.txt',
          chunkIndex: 0,
          metadata: {},
          createdAt: Date.now()
        }
      ]);

      const stats = await memoryNode.getIndexStats('test_index');

      expect(stats.documentCount).toBe(1);
      expect(stats.chunkCount).toBe(1);
      expect(stats.lastUpdated).toBeGreaterThan(0);
    });

    it('should delete index', async () => {
      await vectorStore.upsertEntries('test_index', [
        {
          id: 'chunk_1',
          text: 'Test content',
          summary: 'Test summary',
          keywords: ['test'],
          embedding: [0.1, 0.2],
          source: 'test.txt',
          chunkIndex: 0,
          metadata: {},
          createdAt: Date.now()
        }
      ]);

      await memoryNode.deleteIndex('test_index');

      const stats = await memoryNode.getIndexStats('test_index');
      expect(stats.chunkCount).toBe(0);
    });
  });
});

describe('DocumentIngestor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('Text Processing', () => {
    it('should split text into chunks with overlap', async () => {
      const mockFile = new File(['This is a test document with multiple sentences. It should be split into chunks. Each chunk should have some overlap with the previous one.'], 'test.txt', { type: 'text/plain' });

      // Mock LLM response for summarization
      (callLLM as any).mockResolvedValue({
        text: '{"summary": "Test document about chunking", "keywords": ["test", "document", "chunks"]}'
      });

      const result = await documentIngestor.ingestDocument(mockFile, 'test_index', {
        chunkSize: 10, // Small chunk size for testing
        chunkOverlap: 2,
        ingestMode: 'full'
      });

      expect(result.status).toBe('completed');
      expect(result.chunks.length).toBeGreaterThan(1);
      expect(result.chunks[0].summary).toBe('Test document about chunking');
      expect(result.chunks[0].keywords).toEqual(['test', 'document', 'chunks']);
    });

    it('should handle LLM summarization failure with fallback', async () => {
      const mockFile = new File(['Short test content'], 'test.txt', { type: 'text/plain' });

      // Mock LLM to fail
      (callLLM as any).mockRejectedValue(new Error('LLM failed'));

      const result = await documentIngestor.ingestDocument(mockFile, 'test_index', {
        chunkSize: 800,
        chunkOverlap: 120,
        ingestMode: 'full'
      });

      expect(result.status).toBe('completed');
      expect(result.chunks[0].summary).toBeDefined();
      expect(result.chunks[0].keywords).toBeDefined();
    });

    it('should handle summary-only ingest mode', async () => {
      const mockFile = new File(['Test content for summary-only mode'], 'test.txt', { type: 'text/plain' });

      (callLLM as any).mockResolvedValue({
        text: '{"summary": "Summary of test content", "keywords": ["summary", "test"]}'
      });

      const result = await documentIngestor.ingestDocument(mockFile, 'test_index', {
        chunkSize: 800,
        chunkOverlap: 120,
        ingestMode: 'summary-only'
      });

      expect(result.status).toBe('completed');
      expect(result.chunks[0].summary).toBe('Summary of test content');
    });
  });

  describe('Error Handling', () => {
    it('should handle file reading errors', async () => {
      // Create a mock file that will fail to read
      const mockFile = {
        name: 'test.txt',
        size: 100,
        type: 'text/plain'
      } as File;

      // Mock FileReader to fail
      const originalFileReader = global.FileReader;
      global.FileReader = class {
        onerror: ((error: any) => void) | null = null;
        readAsText() {
          setTimeout(() => this.onerror?.(new Error('Read failed')), 0);
        }
      } as any;

      const result = await documentIngestor.ingestDocument(mockFile, 'test_index', {
        chunkSize: 800,
        chunkOverlap: 120,
        ingestMode: 'full'
      });

      expect(result.status).toBe('error');
      expect(result.error).toBeDefined();

      global.FileReader = originalFileReader;
    });
  });
});

describe('VectorStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vectorStore.deleteIndex('test_index');
  });

  describe('Basic Operations', () => {
    it('should create and manage indices', () => {
      const index = vectorStore.getIndex('test_index');
      
      expect(index.name).toBe('test_index');
      expect(index.entries).toEqual([]);
      expect(index.metadata.chunkCount).toBe(0);
    });

    it('should upsert entries and update metadata', async () => {
      const entries = [
        {
          id: 'test_1',
          text: 'Test content',
          summary: 'Test summary',
          keywords: ['test'],
          embedding: [0.1, 0.2, 0.3],
          source: 'test.txt',
          chunkIndex: 0,
          metadata: {},
          createdAt: Date.now()
        }
      ];

      await vectorStore.upsertEntries('test_index', entries);

      const stats = vectorStore.getIndexStats('test_index');
      expect(stats.chunkCount).toBe(1);
      expect(stats.documentCount).toBe(1);
    });

    it('should retrieve similar entries using cosine similarity', async () => {
      const entries = [
        {
          id: 'test_1',
          text: 'Machine learning algorithms',
          summary: 'ML algorithms',
          keywords: ['machine', 'learning'],
          embedding: [0.8, 0.2, 0.1],
          source: 'ml.txt',
          chunkIndex: 0,
          metadata: {},
          createdAt: Date.now()
        },
        {
          id: 'test_2',
          text: 'Deep learning networks',
          summary: 'DL networks',
          keywords: ['deep', 'learning'],
          embedding: [0.7, 0.3, 0.2],
          source: 'dl.txt',
          chunkIndex: 0,
          metadata: {},
          createdAt: Date.now()
        }
      ];

      await vectorStore.upsertEntries('test_index', entries);

      const results = await vectorStore.retrieve('test_index', [0.8, 0.2, 0.1], 2);

      expect(results).toHaveLength(2);
      expect(results[0].id).toBe('test_1'); // Should be most similar
      expect(results[0].score).toBeGreaterThan(results[1].score);
    });

    it('should perform text-based search as fallback', async () => {
      const entries = [
        {
          id: 'test_1',
          text: 'Artificial intelligence and machine learning',
          summary: 'AI and ML overview',
          keywords: ['artificial', 'intelligence'],
          embedding: [0.1, 0.2, 0.3],
          source: 'ai.txt',
          chunkIndex: 0,
          metadata: {},
          createdAt: Date.now()
        }
      ];

      await vectorStore.upsertEntries('test_index', entries);

      const results = await vectorStore.searchByText('test_index', 'artificial intelligence', 1);

      expect(results).toHaveLength(1);
      expect(results[0].text).toContain('artificial intelligence');
    });
  });

  describe('Persistence', () => {
    it('should save and load from localStorage', async () => {
      const entries = [
        {
          id: 'persist_test',
          text: 'Persistent content',
          summary: 'Persistent summary',
          keywords: ['persist'],
          embedding: [0.5, 0.5, 0.5],
          source: 'persist.txt',
          chunkIndex: 0,
          metadata: {},
          createdAt: Date.now()
        }
      ];

      await vectorStore.upsertEntries('test_index', entries);

      // Verify save was called
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'agentflow_vector_store',
        expect.any(String)
      );
    });
  });
});
