/**
 * Tool Simulator Registry Types
 * Provides mock data and behavior simulation for external tools
 */

export type ToolEnvironment = 'mock' | 'mixed' | 'live';

export interface ToolMockConfig {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  operations: ToolOperation[];
  presets: ToolPreset[];
  defaultLatency: number;
  maxLatency: number;
}

export type ToolCategory = 
  | 'calendar'
  | 'email'
  | 'messaging'
  | 'http'
  | 'webhook'
  | 'spreadsheet'
  | 'storage'
  | 'payment'
  | 'sms'
  | 'llm'
  | 'database'
  | 'cache'
  | 'browser'
  | 'utility';

export interface ToolOperation {
  name: string;
  description: string;
  parameters: ToolParameter[];
  responseSchema: any;
}

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description: string;
  default?: any;
  enum?: string[];
}

export interface ToolPreset {
  id: string;
  name: string;
  description: string;
  output: any;
  latency?: number;
  error?: ToolError;
}

export interface ToolError {
  kind: 'timeout' | 'rateLimit' | 'notFound' | 'server' | 'validation';
  message: string;
  code?: string;
}

export interface ToolSimulatorInput {
  name: string;
  op: string;
  args: Record<string, any>;
  seed?: string;
  latencyMs?: number;
  errorMode?: ToolError['kind'] | 'none';
}

export interface ToolSimulatorResult {
  ok: boolean;
  data?: any;
  error?: ToolError;
  meta: {
    usedPreset?: string;
    latencyMs: number;
    mockSource: 'preset' | 'custom' | 'random';
  };
}

export interface ToolMockProfile {
  id: string;
  name: string;
  description: string;
  tools: Record<string, ToolMockOverride>;
  createdAt: number;
  updatedAt: number;
}

export interface ToolMockOverride {
  toolName: string;
  operation: string;
  presetId?: string;
  customOutput?: any;
  customError?: ToolError;
  latencyMs?: number;
  errorMode?: ToolError['kind'];
}

// Common tool configurations
export const TOOL_MOCKS: Record<string, ToolMockConfig> = {
  calendar: {
    id: 'calendar',
    name: 'Calendar',
    description: 'Google Calendar and Outlook integration',
    category: 'calendar',
    defaultLatency: 200,
    maxLatency: 2000,
    operations: [
      {
        name: 'listEvents',
        description: 'List calendar events',
        parameters: [
          { name: 'calendarId', type: 'string', required: true, description: 'Calendar ID' },
          { name: 'timeMin', type: 'string', required: true, description: 'Start time (ISO)' },
          { name: 'timeMax', type: 'string', required: true, description: 'End time (ISO)' },
        ],
        responseSchema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              summary: { type: 'string' },
              start: { type: 'string' },
              end: { type: 'string' },
              attendees: { type: 'array' }
            }
          }
        }
      },
      {
        name: 'createEvent',
        description: 'Create a new calendar event',
        parameters: [
          { name: 'calendarId', type: 'string', required: true, description: 'Calendar ID' },
          { name: 'summary', type: 'string', required: true, description: 'Event title' },
          { name: 'start', type: 'string', required: true, description: 'Start time (ISO)' },
          { name: 'end', type: 'string', required: true, description: 'End time (ISO)' },
          { name: 'attendees', type: 'array', required: false, description: 'Attendee emails' },
          { name: 'location', type: 'string', required: false, description: 'Event location' },
        ],
        responseSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            htmlLink: { type: 'string' }
          }
        }
      }
    ],
    presets: [
      {
        id: 'busy-morning',
        name: 'Busy Morning',
        description: 'Calendar with back-to-back meetings',
        output: [
          { id: 'evt1', summary: 'Team Standup', start: '2024-01-15T09:00:00Z', end: '2024-01-15T09:30:00Z', attendees: ['team@company.com'] },
          { id: 'evt2', summary: 'Client Call', start: '2024-01-15T09:30:00Z', end: '2024-01-15T10:00:00Z', attendees: ['client@example.com'] }
        ]
      },
      {
        id: 'free-afternoon',
        name: 'Free Afternoon',
        description: 'Afternoon completely free',
        output: []
      },
      {
        id: 'create-success',
        name: 'Create Success',
        description: 'Successfully created event',
        output: { id: 'new-event-123', htmlLink: 'https://calendar.google.com/event?eid=abc123' }
      }
    ]
  },
  email: {
    id: 'email',
    name: 'Email',
    description: 'Gmail and email services',
    category: 'email',
    defaultLatency: 300,
    maxLatency: 1500,
    operations: [
      {
        name: 'search',
        description: 'Search emails',
        parameters: [
          { name: 'query', type: 'string', required: true, description: 'Search query' },
          { name: 'maxResults', type: 'number', required: false, description: 'Max results' }
        ],
        responseSchema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              subject: { type: 'string' },
              from: { type: 'string' },
              snippet: { type: 'string' },
              date: { type: 'string' }
            }
          }
        }
      },
      {
        name: 'send',
        description: 'Send email',
        parameters: [
          { name: 'to', type: 'array', required: true, description: 'Recipient emails' },
          { name: 'subject', type: 'string', required: true, description: 'Email subject' },
          { name: 'body', type: 'string', required: true, description: 'Email body' },
          { name: 'cc', type: 'array', required: false, description: 'CC recipients' },
          { name: 'bcc', type: 'array', required: false, description: 'BCC recipients' }
        ],
        responseSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            threadId: { type: 'string' }
          }
        }
      }
    ],
    presets: [
      {
        id: 'inbox-summary',
        name: 'Inbox Summary',
        description: 'Recent emails in inbox',
        output: [
          { id: 'msg1', subject: 'Project Update', from: 'pm@company.com', snippet: 'Here is the latest project update...', date: '2024-01-15T08:00:00Z' },
          { id: 'msg2', subject: 'Meeting Reminder', from: 'calendar@company.com', snippet: 'Don\'t forget about the meeting at 2pm...', date: '2024-01-15T07:30:00Z' }
        ]
      },
      {
        id: 'send-success',
        name: 'Send Success',
        description: 'Email sent successfully',
        output: { id: 'sent-msg-123', threadId: 'thread-456' }
      }
    ]
  },
  http: {
    id: 'http',
    name: 'HTTP Request',
    description: 'Generic HTTP client',
    category: 'http',
    defaultLatency: 150,
    maxLatency: 1000,
    operations: [
      {
        name: 'request',
        description: 'Make HTTP request',
        parameters: [
          { name: 'method', type: 'string', required: true, description: 'HTTP method' },
          { name: 'url', type: 'string', required: true, description: 'Request URL' },
          { name: 'headers', type: 'object', required: false, description: 'Request headers' },
          { name: 'body', type: 'object', required: false, description: 'Request body' }
        ],
        responseSchema: {
          type: 'object',
          properties: {
            status: { type: 'number' },
            statusText: { type: 'string' },
            headers: { type: 'object' },
            data: { type: 'any' }
          }
        }
      }
    ],
    presets: [
      {
        id: 'success-200',
        name: 'Success 200',
        description: 'Successful GET request',
        output: {
          status: 200,
          statusText: 'OK',
          headers: { 'content-type': 'application/json' },
          data: { message: 'Success', data: { id: 1, name: 'Test' } }
        }
      },
      {
        id: 'not-found-404',
        name: 'Not Found 404',
        description: 'Resource not found',
        output: {
          status: 404,
          statusText: 'Not Found',
          data: { error: 'Resource not found' }
        }
      }
    ]
  }
};
