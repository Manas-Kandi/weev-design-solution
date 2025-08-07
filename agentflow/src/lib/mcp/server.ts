import express from 'express';
import { exportToMcpFormat } from './export';
import { supabase } from '@/lib/supabaseClient';
import { CanvasNode, Connection } from '@/types';
import getPort from 'get-port';
import http from 'http';

const app = express();

// In-memory store for running servers
const runningServers: Map<string, http.Server> = new Map();

export const startMcpServer = async (projectId: string): Promise<number> => {
  if (runningServers.has(projectId)) {
    console.log(`Server for project ${projectId} is already running.`);
    const server = runningServers.get(projectId);
    const address = server?.address();
    if (typeof address === 'object' && address !== null) {
      return address.port;
    }
  }

  const port = await getPort({ port: getPort.makeRange(3001, 3100) });
  const server = http.createServer(app);

  app.get('/get_agent_flow', async (req, res) => {
    try {
      // Your existing data fetching logic...
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('name')
        .eq('id', projectId)
        .single();
      if (projectError) throw projectError;
      const { data: nodesData, error: nodesError } = await supabase
        .from('nodes')
        .select('*')
        .eq('project_id', projectId);
      if (nodesError) throw nodesError;
      const { data: connectionsData, error: connectionsError } = await supabase
        .from('connections')
        .select('*')
        .eq('project_id', projectId);
      if (connectionsError) throw connectionsError;
      
      const mcpData = exportToMcpFormat(projectData.name, nodesData as CanvasNode[], connectionsData as Connection[]);
      res.json(mcpData);
    } catch (error) {
      console.error('Error fetching project data for MCP:', error);
      res.status(500).json({ error: 'Failed to fetch project data' });
    }
  });

  return new Promise((resolve) => {
    server.listen(port, () => {
      console.log(`MCP Server started for project ${projectId} on http://localhost:${port}`);
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
