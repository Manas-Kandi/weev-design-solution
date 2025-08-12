import React, { useState, useEffect, useCallback } from 'react';
import { MemoryNodeData, IngestedDocument } from '@/lib/nodes/memory/types';
import { figmaPropertiesTheme } from './propertiesPanelTheme';
import { documentIngestor } from '@/lib/nodes/memory/ingest';
import { vectorStore } from '@/services/vector/VectorStore';

interface MemoryPropertiesPanelProps {
  nodeData: MemoryNodeData;
  onChange: (data: Partial<MemoryNodeData>) => void;
}

export const MemoryPropertiesPanel: React.FC<MemoryPropertiesPanelProps> = ({
  nodeData,
  onChange
}) => {
  const [indexName, setIndexName] = useState(nodeData.indexName || 'project_default');
  const [ingestMode, setIngestMode] = useState<"full" | "summary-only">(nodeData.ingestMode || 'full');
  const [chunkSize, setChunkSize] = useState(nodeData.chunkSize || 800);
  const [chunkOverlap, setChunkOverlap] = useState(nodeData.chunkOverlap || 120);
  const [retrievalTopK, setRetrievalTopK] = useState(nodeData.retrievalTopK || 5);
  
  const [isDragOver, setIsDragOver] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestedDocs, setIngestedDocs] = useState<IngestedDocument[]>([]);
  const [indexStats, setIndexStats] = useState({ documentCount: 0, chunkCount: 0, lastUpdated: 0 });
  const [showManageSection, setShowManageSection] = useState(false);

  // Sync local state with node data changes
  useEffect(() => {
    setIndexName(nodeData.indexName || 'project_default');
    setIngestMode(nodeData.ingestMode || 'full');
    setChunkSize(nodeData.chunkSize || 800);
    setChunkOverlap(nodeData.chunkOverlap || 120);
    setRetrievalTopK(nodeData.retrievalTopK || 5);
  }, [nodeData]);

  // Load index stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        const stats = vectorStore.getIndexStats(indexName);
        setIndexStats(stats);
      } catch (error) {
        console.error('Error loading index stats:', error);
      }
    };
    loadStats();
  }, [indexName, ingestedDocs]);

  const handleIndexNameChange = (newIndexName: string) => {
    setIndexName(newIndexName);
    onChange({ indexName: newIndexName });
  };

  const handleIngestModeChange = (newMode: "full" | "summary-only") => {
    setIngestMode(newMode);
    onChange({ ingestMode: newMode });
  };

  const handleChunkSizeChange = (newSize: number) => {
    setChunkSize(newSize);
    onChange({ chunkSize: newSize });
  };

  const handleChunkOverlapChange = (newOverlap: number) => {
    setChunkOverlap(newOverlap);
    onChange({ chunkOverlap: newOverlap });
  };

  const handleRetrievalTopKChange = (newTopK: number) => {
    setRetrievalTopK(newTopK);
    onChange({ retrievalTopK: newTopK });
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    await handleFileIngest(files);
  }, [indexName, chunkSize, chunkOverlap, ingestMode]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await handleFileIngest(files);
  }, [indexName, chunkSize, chunkOverlap, ingestMode]);

  const handleFileIngest = async (files: File[]) => {
    if (files.length === 0) return;

    setIsIngesting(true);
    const newDocs: IngestedDocument[] = [];

    for (const file of files) {
      try {
        const doc = await documentIngestor.ingestDocument(file, indexName, {
          chunkSize,
          chunkOverlap,
          ingestMode
        });
        newDocs.push(doc);
      } catch (error) {
        console.error('Error ingesting file:', file.name, error);
      }
    }

    setIngestedDocs(prev => [...prev, ...newDocs]);
    setIsIngesting(false);
  };

  const formatTimestamp = (timestamp: number) => {
    if (timestamp === 0) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  const containerStyle: React.CSSProperties = {
    padding: '16px',
    fontFamily: figmaPropertiesTheme.typography.fontFamily,
    fontSize: figmaPropertiesTheme.typography.fontSize.sm,
    color: figmaPropertiesTheme.colors.textPrimary,
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: '16px',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '6px',
    fontSize: figmaPropertiesTheme.typography.fontSize.sm,
    fontWeight: figmaPropertiesTheme.typography.fontWeight.medium,
    color: figmaPropertiesTheme.colors.textPrimary,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '32px',
    padding: '4px 8px',
    fontSize: figmaPropertiesTheme.typography.fontSize.sm,
    fontFamily: figmaPropertiesTheme.typography.fontFamily,
    borderRadius: figmaPropertiesTheme.borderRadius.sm,
    border: `1px solid ${figmaPropertiesTheme.colors.border}`,
    backgroundColor: figmaPropertiesTheme.colors.backgroundTertiary,
    color: figmaPropertiesTheme.colors.textPrimary,
    outline: 'none',
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
  };

  const helpTextStyle: React.CSSProperties = {
    marginTop: '4px',
    fontSize: figmaPropertiesTheme.typography.fontSize.xs,
    color: figmaPropertiesTheme.colors.textSecondary,
    lineHeight: figmaPropertiesTheme.typography.lineHeight.normal,
  };

  const dropzoneStyle: React.CSSProperties = {
    border: `2px dashed ${isDragOver ? figmaPropertiesTheme.colors.borderActive : figmaPropertiesTheme.colors.border}`,
    borderRadius: figmaPropertiesTheme.borderRadius.sm,
    padding: '20px',
    textAlign: 'center' as const,
    backgroundColor: isDragOver ? figmaPropertiesTheme.colors.backgroundSecondary : figmaPropertiesTheme.colors.backgroundTertiary,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  };

  const statusChipStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: figmaPropertiesTheme.borderRadius.xs,
    fontSize: figmaPropertiesTheme.typography.fontSize.xs,
    fontWeight: figmaPropertiesTheme.typography.fontWeight.medium,
    backgroundColor: figmaPropertiesTheme.colors.backgroundSecondary,
    color: figmaPropertiesTheme.colors.textSecondary,
    marginRight: '8px',
  };

  const collapsibleHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 0',
    cursor: 'pointer',
    borderBottom: `1px solid ${figmaPropertiesTheme.colors.border}`,
    marginBottom: '12px',
  };

  return (
    <div style={containerStyle}>
      {/* Basic Configuration */}
      <div style={sectionStyle}>
        <label style={labelStyle}>
          Index Name
        </label>
        <input
          type="text"
          value={indexName}
          onChange={(e) => handleIndexNameChange(e.target.value)}
          placeholder="project_default"
          style={inputStyle}
        />
        <div style={helpTextStyle}>
          Unique identifier for this memory index
        </div>
      </div>

      <div style={sectionStyle}>
        <label style={labelStyle}>
          Ingest Mode
        </label>
        <select
          value={ingestMode}
          onChange={(e) => handleIngestModeChange(e.target.value as "full" | "summary-only")}
          style={selectStyle}
        >
          <option value="full">Full Text</option>
          <option value="summary-only">Summary Only</option>
        </select>
        <div style={helpTextStyle}>
          Store full text or summaries only for retrieval
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>
            Chunk Size
          </label>
          <input
            type="number"
            value={chunkSize}
            onChange={(e) => handleChunkSizeChange(parseInt(e.target.value) || 800)}
            min="100"
            max="2000"
            style={inputStyle}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>
            Overlap
          </label>
          <input
            type="number"
            value={chunkOverlap}
            onChange={(e) => handleChunkOverlapChange(parseInt(e.target.value) || 120)}
            min="0"
            max="500"
            style={inputStyle}
          />
        </div>
      </div>

      <div style={sectionStyle}>
        <label style={labelStyle}>
          Retrieval Top-K
        </label>
        <input
          type="number"
          value={retrievalTopK}
          onChange={(e) => handleRetrievalTopKChange(parseInt(e.target.value) || 5)}
          min="1"
          max="20"
          style={inputStyle}
        />
        <div style={helpTextStyle}>
          Number of most relevant chunks to retrieve
        </div>
      </div>

      {/* Index Status */}
      <div style={sectionStyle}>
        <div style={{ marginBottom: '8px' }}>
          <span style={statusChipStyle}>
            {indexStats.documentCount} docs
          </span>
          <span style={statusChipStyle}>
            {indexStats.chunkCount} chunks
          </span>
        </div>
        <div style={helpTextStyle}>
          Last updated: {formatTimestamp(indexStats.lastUpdated)}
        </div>
      </div>

      {/* Manage Documents Section */}
      <div style={sectionStyle}>
        <div 
          style={collapsibleHeaderStyle}
          onClick={() => setShowManageSection(!showManageSection)}
        >
          <span style={{ fontWeight: figmaPropertiesTheme.typography.fontWeight.medium }}>
            Manage Documents
          </span>
          <span style={{ transform: showManageSection ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
            ▶
          </span>
        </div>

        {showManageSection && (
          <>
            {/* File Dropzone */}
            <div
              style={dropzoneStyle}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <input
                id="file-input"
                type="file"
                multiple
                accept=".txt,.md,.json,.csv"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <div style={{ marginBottom: '8px', fontSize: '24px' }}>📄</div>
              <div style={{ fontWeight: figmaPropertiesTheme.typography.fontWeight.medium, marginBottom: '4px' }}>
                {isIngesting ? 'Processing...' : 'Drop files here or click to browse'}
              </div>
              <div style={helpTextStyle}>
                Supports .txt, .md, .json, .csv files
              </div>
            </div>

            {/* Ingested Documents List */}
            {ingestedDocs.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <div style={{ ...labelStyle, marginBottom: '8px' }}>
                  Recent Ingests
                </div>
                {ingestedDocs.slice(-5).map((doc) => (
                  <div
                    key={doc.id}
                    style={{
                      padding: '8px',
                      backgroundColor: figmaPropertiesTheme.colors.backgroundSecondary,
                      borderRadius: figmaPropertiesTheme.borderRadius.sm,
                      marginBottom: '4px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: figmaPropertiesTheme.typography.fontSize.sm, fontWeight: figmaPropertiesTheme.typography.fontWeight.medium }}>
                        {doc.filename}
                      </div>
                      <div style={{ fontSize: figmaPropertiesTheme.typography.fontSize.xs, color: figmaPropertiesTheme.colors.textSecondary }}>
                        {doc.chunks.length} chunks • {formatTimestamp(doc.ingestedAt)}
                      </div>
                    </div>
                    <div
                      style={{
                        ...statusChipStyle,
                        backgroundColor: doc.status === 'completed' ? figmaPropertiesTheme.colors.success : 
                                       doc.status === 'error' ? figmaPropertiesTheme.colors.error : 
                                       figmaPropertiesTheme.colors.warning,
                        color: 'white',
                        margin: 0,
                      }}
                    >
                      {doc.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
