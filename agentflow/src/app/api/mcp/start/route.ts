import { startMcpServer } from '@/lib/mcp/server';
import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/utils';

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (!checkRateLimit(ip)) {
    console.warn(`Rate limit exceeded for ${ip} on POST /api/mcp/start`);
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { projectId } = await req.json();

  if (!projectId) {
    return new NextResponse('Project ID is required', { status: 400 });
  }

  try {
    const port = await startMcpServer(projectId);
    return NextResponse.json({ message: `MCP server started for project ${projectId} on port ${port}`, port });
  } catch (error) {
    console.error('Failed to start MCP server:', error);
    return new NextResponse('Failed to start MCP server', { status: 500 });
  }
}

