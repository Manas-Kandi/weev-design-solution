import { stopMcpServer } from '@/lib/mcp/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { projectId } = await req.json();

  if (!projectId) {
    return new NextResponse('Project ID is required', { status: 400 });
  }

  try {
    await stopMcpServer(projectId);
    return NextResponse.json({ message: `MCP server for project ${projectId} stopped successfully.` });
  } catch (error) {
    console.error('Failed to stop MCP server:', error);
    return new NextResponse('Failed to stop MCP server', { status: 500 });
  }
}

