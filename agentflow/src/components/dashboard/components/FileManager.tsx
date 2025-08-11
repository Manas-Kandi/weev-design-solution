import React, { useState, useEffect } from 'react';
import { File, Upload, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/primitives/button';
import { Card } from '@/components/primitives/card';
import { supabase } from '@/lib/supabaseClient';
import type { ProjectFile } from '@/types';

// Build Authorization header from Supabase session
async function buildHeaders(json: boolean = true): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  if (json) headers['Content-Type'] = 'application/json';
  try {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (token) headers['Authorization'] = `Bearer ${token}`;
  } catch {
    // ignore: unauthenticated
  }
  return headers;
}

interface FileManagerProps {
  projectId: string;
}

// Use canonical ProjectFile type from types/project to ensure consistency with DB schema

export default function FileManager({ projectId }: FileManagerProps) {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchFiles();
  }, [projectId]);

  const fetchFiles = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/files?project_id=${projectId}`, {
        headers: await buildHeaders(false)
      });
      if (!res.ok) {
        const t = await res.text();
        console.error('Error fetching files:', t);
        return;
      }
      const data = await res.json().catch(() => []);
      setFiles(data || []);
    } catch (err) {
      console.error('Error fetching files:', err);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }

    const file = event.target.files[0];
    setUploading(true);

    try {
      const form = new FormData();
      form.append('file', file);
      const headers = await buildHeaders(false); // let browser set multipart boundary
      const res = await fetch(`/api/projects/${projectId}/files`, {
        method: 'POST',
        headers,
        body: form,
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || 'Upload failed');
      }
      await fetchFiles();
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleFileDelete = async (fileId: string, _filePath: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/files`, {
        method: 'DELETE',
        headers: await buildHeaders(true),
        body: JSON.stringify({ id: fileId }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || 'Delete failed');
      }
      await fetchFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const handleFileDownload = async (fileId: string, _fileName: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/files?action=download&file_id=${encodeURIComponent(fileId)}`, {
        headers: await buildHeaders(false)
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || 'Download failed');
      }
      const payload = await res.json().catch(() => null);
      const url = payload?.signedUrl;
      if (url) {
        // Open in new tab
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const formatFileSize = (bytes?: number | null) => {
    if (bytes == null) return '—';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Project Files</h2>
        <div>
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileUpload}
            disabled={uploading}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('file-upload')?.click()}
            disabled={uploading}
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? 'Uploading...' : 'Upload File'}
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {files.map((file) => (
          <Card key={file.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <File className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size_bytes)} • {file.file_type || 'unknown'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFileDownload(file.id, file.name)}
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFileDelete(file.id, file.file_path)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {files.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No files uploaded yet
          </div>
        )}
      </div>
    </div>
  );
}
