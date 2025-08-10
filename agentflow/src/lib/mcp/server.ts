import express from 'express';
import { exportToMcpFormat } from './export';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { CanvasNode, Connection, ProjectFile } from '@/types';
import getPort, { portNumbers } from 'get-port';
import http from 'http';
import { CURRENT_EXPORT_VERSION, getMcpExportSchema } from './schema';
const runningServers = new Map<string, http.Server>();

export const startMcpServer = async (projectId: string): Promise<number> => {
  const existingServer = runningServers.get(projectId);
  if (existingServer) {
    console.log(`Server for project ${projectId} is already running.`);
    const address = existingServer.address();
    if (typeof address === 'object' && address !== null) {
      return address.port;
    }
  }

  const app = express();

  app.get('/get_agent_flow', async (req, res) => {
    try {
      // Your existing data fetching logic...
      const { data: projectData, error: projectError } = await supabaseAdmin
        .from('projects')
        .select('id, name, start_node_id')
        .eq('id', projectId)
        .single();
      if (projectError) throw projectError;
      const { data: nodesData, error: nodesError } = await supabaseAdmin
        .from('nodes')
        .select('*')
        .eq('project_id', projectId);
      if (nodesError) throw nodesError;
      const { data: connectionsData, error: connectionsError } = await supabaseAdmin
        .from('connections')
        .select('*')
        .eq('project_id', projectId);
      if (connectionsError) throw connectionsError;
      const { data: filesData, error: filesError } = await supabaseAdmin
        .from('project_files')
        .select('id, name, file_path, file_type, size_bytes, created_at, project_id')
        .eq('project_id', projectId);
      if (filesError) throw filesError;

      const startNodeId: string | null = (projectData as { start_node_id?: string | null })?.start_node_id ?? null;
      const mcpData = exportToMcpFormat(
        projectId,
        (projectData as { name: string }).name,
        nodesData as CanvasNode[],
        connectionsData as Connection[],
        startNodeId,
        (filesData || []) as ProjectFile[]
      );
      res.json(mcpData);
    } catch (error) {
      console.error('Error fetching project data for MCP:', error);
      res.status(500).json({ error: 'Failed to fetch project data' });
    }
  });

  // Health check endpoint for MCP server
  app.get('/healthz', (req, res) => {
    res.json({
      status: 'ok',
      projectId,
      version: CURRENT_EXPORT_VERSION,
      time: new Date().toISOString(),
    });
  });

  // Serve JSON Schema for MCP export with versioning support
  app.get('/schema/mcp-export/:version?', (req, res) => {
    const version = (req.params.version as string | undefined) || CURRENT_EXPORT_VERSION;
    const schema = getMcpExportSchema(version);
    if (!schema) {
      return res.status(404).json({ error: `Schema version ${version} not found` });
    }
    res.json(schema);
  });

  // Provide a signed download URL for project files, with redirect
  app.get('/files/:fileId/download', async (req, res) => {
    try {
      const fileId = req.params.fileId;
      const { data: file, error } = await supabaseAdmin
        .from('project_files')
        .select('id, name, file_path, project_id')
        .eq('id', fileId)
        .single();
      if (error) throw error;
      if (!file || file.project_id !== projectId) {
        return res.status(404).json({ error: 'File not found for this project' });
      }
      const { data: signed, error: signedErr } = await supabaseAdmin.storage
        .from('project-files')
        .createSignedUrl(file.file_path, 60);
      if (signedErr || !signed?.signedUrl) {
        throw signedErr || new Error('Failed to create signed URL');
      }
      res.redirect(signed.signedUrl);
    } catch (err) {
      console.error('Error generating file download URL:', err);
      res.status(500).json({ error: 'Failed to generate file download URL' });
    }
  });

  const port = await getPort({ port: portNumbers(3001, 3100) });
  const server = http.createServer(app);

  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => {
      console.log(
        `MCP Server started for project ${projectId} on http://localhost:${port}`
      );
      runningServers.set(projectId, server);
      resolve(port);
    });
  });
};

export const stopMcpServer = (projectId: string): Promise<void> => {
    return new Promise((resolve) => {
        const server = runningServers.get(projectId);
        if (server) {
            server.close(() => {
                console.log(`MCP Server for project ${projectId} stopped.`);
                runningServers.delete(projectId);
                resolve();
            });
        } else {
            console.log(`No server found for project ${projectId}.`);
            resolve();
        }
    });
};
