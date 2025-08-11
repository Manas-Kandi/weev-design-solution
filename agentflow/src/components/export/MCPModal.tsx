'use client';

import { useState } from 'react';
import { Button } from '@/components/primitives/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/primitives/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/primitives/dialog';
import { Copy, Power, PowerOff } from 'lucide-react';

interface MCPModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  projectId: string;
  onServerStatusChange: (projectId: string, isRunning: boolean) => void;
}

export default function MCPModal({ isOpen, onClose, projectName, projectId, onServerStatusChange }: MCPModalProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [port, setPort] = useState<number | null>(3001); // Example port
  const [logs, setLogs] = useState<string[]>([]);

  const handleStart = async () => {
    setIsRunning(true);
    setLogs(['Attempting to start server...']);
    try {
      const response = await fetch('/api/mcp/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId }),
      });
      const ct = response.headers.get('content-type') || '';
      const isJson = ct.includes('application/json');
      const payload = isJson ? await response.json().catch(() => ({})) : await response.text();
      if (response.ok) {
        const data: any = isJson ? payload : {};
        if (typeof data?.port !== 'number') {
          throw new Error('Start server succeeded but no port was returned');
        }
        setPort(data.port);
        onServerStatusChange(projectId, true);
        setLogs([`Server started successfully on port ${data.port}.`, 'Waiting for client connection...']);
      } else {
        const msg = isJson ? (payload as any)?.message : String(payload);
        throw new Error(msg || `Failed to start server (HTTP ${response.status})`);
      }
    } catch (error) {
      setIsRunning(false);
      setLogs(['Error starting server. Check console for details.']);
      console.error(error);
    }
  };

  const handleStop = async () => {
    setLogs(['Attempting to stop server...']);
    try {
      await fetch('/api/mcp/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId }),
      });
      setIsRunning(false);
      onServerStatusChange(projectId, false);
      setLogs(['Server stopped successfully.']);
    } catch (error) {
      setLogs(['Error stopping server. Check console for details.']);
      console.error(error);
    }
  };

  const handleCopy = () => {
    if (port) {
      navigator.clipboard.writeText(`localhost:${port}`);
      // You might want to add a toast notification here
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>MCP Server: {projectName}</DialogTitle>
          <DialogDescription>
            Manage the MCP server to share this project with a development environment.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${isRunning ? 'bg-green-500' : 'bg-red-500'}`} />
              <p className="text-sm font-medium">{isRunning ? 'Running' : 'Stopped'}</p>
            </div>
            {isRunning ? (
              <Button onClick={handleStop} variant="destructive" size="sm">
                <PowerOff className="mr-2 h-4 w-4" /> Stop Server
              </Button>
            ) : (
              <Button onClick={handleStart} variant="default" size="sm">
                <Power className="mr-2 h-4 w-4" /> Start Server
              </Button>
            )}
          </div>
          {isRunning && port && (
            <div className="flex items-center space-x-2">
              <p className="text-sm font-mono p-2 bg-muted rounded-md">
                Endpoint: localhost:{port}
              </p>
              <Button variant="outline" size="icon" onClick={handleCopy}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          )}
          <Card className="h-48 overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-base">Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs text-muted-foreground">
                {logs.join('\n')}
              </pre>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

