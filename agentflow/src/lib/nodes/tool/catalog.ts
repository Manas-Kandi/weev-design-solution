/**
 * Tool catalog with schemas and mock presets
 */

import { ToolSchema, BuiltinToolName } from './types';

export const TOOL_CATALOG: Record<BuiltinToolName, ToolSchema> = {
  web_search: {
    name: 'web_search',
    description: 'Search the web for information',
    parameters: [
      {
        name: 'query',
        type: 'string',
        description: 'Search query',
        required: true
      },
      {
        name: 'limit',
        type: 'number',
        description: 'Number of results to return',
        required: false,
        default: 10
      },
      {
        name: 'domain',
        type: 'string',
        description: 'Specific domain to search',
        required: false
      }
    ],
    returns: 'Array of search results with title, url, and snippet',
    mockPresets: [
      {
        name: 'success',
        description: 'Successful search with results',
        args: { query: 'artificial intelligence', limit: 3 },
        result: {
          results: [
            {
              title: 'What is Artificial Intelligence?',
              url: 'https://example.com/ai-intro',
              snippet: 'Artificial Intelligence (AI) is the simulation of human intelligence in machines...'
            },
            {
              title: 'AI Applications in 2024',
              url: 'https://example.com/ai-2024',
              snippet: 'Explore the latest applications of AI technology across various industries...'
            },
            {
              title: 'Machine Learning vs AI',
              url: 'https://example.com/ml-vs-ai',
              snippet: 'Understanding the difference between Machine Learning and Artificial Intelligence...'
            }
          ],
          total: 1250000
        },
        latencyMs: 800
      },
      {
        name: 'not_found',
        description: 'No results found',
        args: { query: 'xyzabc123nonexistent' },
        result: { results: [], total: 0 },
        latencyMs: 300
      },
      {
        name: 'timeout',
        description: 'Search timeout error',
        error: 'Search request timed out',
        latencyMs: 5000
      },
      {
        name: 'rate_limit',
        description: 'Rate limit exceeded',
        error: 'Rate limit exceeded. Please try again later.',
        latencyMs: 100
      }
    ]
  },

  http_request: {
    name: 'http_request',
    description: 'Make HTTP requests to external APIs',
    parameters: [
      {
        name: 'url',
        type: 'string',
        description: 'Request URL',
        required: true
      },
      {
        name: 'method',
        type: 'string',
        description: 'HTTP method',
        required: false,
        default: 'GET',
        enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
      },
      {
        name: 'headers',
        type: 'object',
        description: 'Request headers',
        required: false
      },
      {
        name: 'body',
        type: 'object',
        description: 'Request body',
        required: false
      }
    ],
    returns: 'HTTP response with status, headers, and data',
    mockPresets: [
      {
        name: 'success',
        description: 'Successful HTTP request',
        args: { url: 'https://api.example.com/data', method: 'GET' },
        result: {
          status: 200,
          headers: { 'content-type': 'application/json' },
          data: { message: 'Success', timestamp: '2024-01-01T00:00:00Z' }
        },
        latencyMs: 500
      },
      {
        name: 'not_found',
        description: '404 Not Found',
        error: 'HTTP 404: Resource not found',
        latencyMs: 200
      },
      {
        name: 'server_error',
        description: '500 Internal Server Error',
        error: 'HTTP 500: Internal server error',
        latencyMs: 1000
      }
    ]
  },

  calendar: {
    name: 'calendar',
    description: 'Calendar operations for scheduling and events',
    operations: {
      list_events: {
        description: 'List calendar events',
        parameters: [
          {
            name: 'start_date',
            type: 'string',
            description: 'Start date (ISO format)',
            required: true
          },
          {
            name: 'end_date',
            type: 'string',
            description: 'End date (ISO format)',
            required: true
          }
        ],
        returns: 'Array of calendar events'
      },
      create_event: {
        description: 'Create a new calendar event',
        parameters: [
          {
            name: 'title',
            type: 'string',
            description: 'Event title',
            required: true
          },
          {
            name: 'start_time',
            type: 'string',
            description: 'Start time (ISO format)',
            required: true
          },
          {
            name: 'end_time',
            type: 'string',
            description: 'End time (ISO format)',
            required: true
          },
          {
            name: 'description',
            type: 'string',
            description: 'Event description',
            required: false
          }
        ],
        returns: 'Created event object'
      }
    },
    parameters: [], // Multi-operation tool
    returns: 'Varies by operation',
    mockPresets: [
      {
        name: 'list_success',
        description: 'Successful event listing',
        args: { start_date: '2024-01-01', end_date: '2024-01-07' },
        result: {
          events: [
            {
              id: 'evt_1',
              title: 'Team Meeting',
              start: '2024-01-02T10:00:00Z',
              end: '2024-01-02T11:00:00Z',
              description: 'Weekly team sync'
            },
            {
              id: 'evt_2',
              title: 'Project Review',
              start: '2024-01-04T14:00:00Z',
              end: '2024-01-04T15:30:00Z',
              description: 'Q1 project review meeting'
            }
          ]
        },
        latencyMs: 600
      },
      {
        name: 'create_success',
        description: 'Successful event creation',
        args: { title: 'New Meeting', start_time: '2024-01-10T15:00:00Z', end_time: '2024-01-10T16:00:00Z' },
        result: {
          id: 'evt_new',
          title: 'New Meeting',
          start: '2024-01-10T15:00:00Z',
          end: '2024-01-10T16:00:00Z',
          created: true
        },
        latencyMs: 400
      }
    ]
  },

  gmail: {
    name: 'gmail',
    description: 'Gmail operations for email management',
    operations: {
      list_emails: {
        description: 'List emails from inbox',
        parameters: [
          {
            name: 'query',
            type: 'string',
            description: 'Search query',
            required: false
          },
          {
            name: 'limit',
            type: 'number',
            description: 'Number of emails to return',
            required: false,
            default: 10
          }
        ],
        returns: 'Array of email objects'
      },
      send_email: {
        description: 'Send an email',
        parameters: [
          {
            name: 'to',
            type: 'string',
            description: 'Recipient email address',
            required: true
          },
          {
            name: 'subject',
            type: 'string',
            description: 'Email subject',
            required: true
          },
          {
            name: 'body',
            type: 'string',
            description: 'Email body',
            required: true
          }
        ],
        returns: 'Sent email confirmation'
      }
    },
    parameters: [],
    returns: 'Varies by operation',
    mockPresets: [
      {
        name: 'list_success',
        description: 'Successful email listing',
        result: {
          emails: [
            {
              id: 'msg_1',
              subject: 'Project Update',
              from: 'team@example.com',
              date: '2024-01-01T12:00:00Z',
              snippet: 'Here is the latest update on our project...'
            },
            {
              id: 'msg_2',
              subject: 'Meeting Reminder',
              from: 'calendar@example.com',
              date: '2024-01-01T09:00:00Z',
              snippet: 'Reminder: Team meeting at 2 PM today...'
            }
          ]
        },
        latencyMs: 700
      },
      {
        name: 'send_success',
        description: 'Successful email sending',
        args: { to: 'user@example.com', subject: 'Test Email', body: 'This is a test email.' },
        result: {
          id: 'msg_sent',
          status: 'sent',
          timestamp: '2024-01-01T12:00:00Z'
        },
        latencyMs: 900
      }
    ]
  },

  sheets: {
    name: 'sheets',
    description: 'Google Sheets operations for data management',
    operations: {
      read_range: {
        description: 'Read data from a range',
        parameters: [
          {
            name: 'spreadsheet_id',
            type: 'string',
            description: 'Spreadsheet ID',
            required: true
          },
          {
            name: 'range',
            type: 'string',
            description: 'Range to read (e.g., A1:C10)',
            required: true
          }
        ],
        returns: 'Array of rows with cell values'
      },
      write_range: {
        description: 'Write data to a range',
        parameters: [
          {
            name: 'spreadsheet_id',
            type: 'string',
            description: 'Spreadsheet ID',
            required: true
          },
          {
            name: 'range',
            type: 'string',
            description: 'Range to write (e.g., A1:C10)',
            required: true
          },
          {
            name: 'values',
            type: 'array',
            description: 'Array of rows to write',
            required: true
          }
        ],
        returns: 'Write operation result'
      }
    },
    parameters: [],
    returns: 'Varies by operation',
    mockPresets: [
      {
        name: 'read_success',
        description: 'Successful range read',
        args: { spreadsheet_id: 'sheet_123', range: 'A1:C3' },
        result: {
          values: [
            ['Name', 'Age', 'City'],
            ['John Doe', '30', 'New York'],
            ['Jane Smith', '25', 'San Francisco']
          ],
          range: 'A1:C3'
        },
        latencyMs: 500
      },
      {
        name: 'write_success',
        description: 'Successful range write',
        args: { 
          spreadsheet_id: 'sheet_123', 
          range: 'A1:B2',
          values: [['Product', 'Price'], ['Widget', '$10.99']]
        },
        result: {
          updatedRows: 2,
          updatedColumns: 2,
          updatedCells: 4
        },
        latencyMs: 600
      }
    ]
  },

  image_gen: {
    name: 'image_gen',
    description: 'AI image generation',
    parameters: [
      {
        name: 'prompt',
        type: 'string',
        description: 'Image generation prompt',
        required: true
      },
      {
        name: 'size',
        type: 'string',
        description: 'Image size',
        required: false,
        default: '1024x1024',
        enum: ['256x256', '512x512', '1024x1024', '1024x1792', '1792x1024']
      },
      {
        name: 'style',
        type: 'string',
        description: 'Image style',
        required: false,
        enum: ['natural', 'vivid']
      }
    ],
    returns: 'Generated image URL and metadata',
    mockPresets: [
      {
        name: 'success',
        description: 'Successful image generation',
        args: { prompt: 'A beautiful sunset over mountains', size: '1024x1024' },
        result: {
          url: 'https://example.com/generated-image-123.jpg',
          size: '1024x1024',
          prompt: 'A beautiful sunset over mountains',
          created: '2024-01-01T12:00:00Z'
        },
        latencyMs: 3000
      },
      {
        name: 'content_policy',
        description: 'Content policy violation',
        error: 'Image generation failed: Content policy violation',
        latencyMs: 500
      }
    ]
  },

  db_query: {
    name: 'db_query',
    description: 'Database query operations',
    parameters: [
      {
        name: 'query',
        type: 'string',
        description: 'SQL query to execute',
        required: true
      },
      {
        name: 'database',
        type: 'string',
        description: 'Database name',
        required: false,
        default: 'default'
      },
      {
        name: 'limit',
        type: 'number',
        description: 'Maximum number of rows to return',
        required: false,
        default: 100
      }
    ],
    returns: 'Query results with rows and metadata',
    mockPresets: [
      {
        name: 'select_success',
        description: 'Successful SELECT query',
        args: { query: 'SELECT * FROM users LIMIT 5' },
        result: {
          rows: [
            { id: 1, name: 'John Doe', email: 'john@example.com' },
            { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
            { id: 3, name: 'Bob Johnson', email: 'bob@example.com' }
          ],
          rowCount: 3,
          columns: ['id', 'name', 'email'],
          executionTime: 45
        },
        latencyMs: 200
      },
      {
        name: 'insert_success',
        description: 'Successful INSERT query',
        args: { query: "INSERT INTO users (name, email) VALUES ('New User', 'new@example.com')" },
        result: {
          rowsAffected: 1,
          insertId: 4,
          executionTime: 12
        },
        latencyMs: 150
      },
      {
        name: 'syntax_error',
        description: 'SQL syntax error',
        error: 'SQL syntax error: You have an error in your SQL syntax',
        latencyMs: 50
      }
    ]
  }
};

/**
 * Get tool schema by name
 */
export function getToolSchema(toolName: string): ToolSchema | null {
  return TOOL_CATALOG[toolName as BuiltinToolName] || null;
}

/**
 * Get all available tool names
 */
export function getAvailableTools(): string[] {
  return Object.keys(TOOL_CATALOG);
}

/**
 * Get mock presets for a tool
 */
export function getToolMockPresets(toolName: string): string[] {
  const schema = getToolSchema(toolName);
  return schema ? schema.mockPresets.map(p => p.name) : [];
}

/**
 * Get specific mock preset
 */
export function getMockPreset(toolName: string, presetName: string) {
  const schema = getToolSchema(toolName);
  if (!schema) return null;
  
  return schema.mockPresets.find(p => p.name === presetName) || null;
}
