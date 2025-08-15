import {
  ToolSimulatorResult,
  ToolMockConfig,
  ToolSimulatorInput,
  ToolError,
  ToolMockOverride,
  ToolMockProfile,
  TOOL_MOCKS,
  ToolPreset
} from '@/types/toolSimulator';

/**
 * Tool Simulator Service
 * Provides mock data and behavior simulation for external tools
 */

export class ToolSimulator {
  simulate(toolName: string, inputData: Record<string, any>): ToolSimulatorResult {
    if (!this.activeProfile) {
      const error = this.generateError('server', 'system', 'simulate');
      return { ok: false, error, meta: { latencyMs: 0, mockSource: 'custom' } };
    }

    const override = this.customOverrides.get(toolName);
    const toolConfig = this.activeProfile.tools[toolName];

    const config: ToolMockConfig | ToolMockOverride | undefined = override || toolConfig;

    if (!config) {
      const error = this.generateError('notFound', toolName, 'simulate');
      return { ok: false, error, meta: { latencyMs: 0, mockSource: 'custom' } };
    }

    const errorType = (config as any).errorType;
    if (errorType) {
      const error = this.generateError(errorType, toolName, 'simulate');
      return { ok: false, error, meta: { latencyMs: 0, mockSource: 'custom' } };
    }

    const data = (config as any).mockData || {};
    return { ok: true, data, meta: { latencyMs: 0, mockSource: 'custom' } };
  }
  private activeProfile: ToolMockProfile | null = null;
  private customOverrides: Map<string, ToolMockOverride> = new Map();
  private storedProfiles: Map<string, ToolMockProfile> = new Map();

  static DEFAULT_PROFILE: ToolMockProfile = {
    id: 'default',
    name: 'Default',
    description: 'System default mock profile',
    tools: {},
    isDefault: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  constructor() {
  }

  initialize(): void {
    this.loadStoredProfiles();
    // Set active profile to default if none
    if (!this.activeProfile) {
      this.activeProfile = ToolSimulator.DEFAULT_PROFILE;
    }
  }

  private loadStoredProfiles(): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;

    try {
      const stored = localStorage.getItem('weev_mock_profiles');
      if (stored) {
        const profiles = JSON.parse(stored);
        Object.entries(profiles).forEach(([id, profile]) => {
          this.storedProfiles.set(id, profile as ToolMockProfile);
        });
      }
    } catch (error) {
      console.error('Failed to load stored profiles:', error);
    }
  }

  /**
   * Simulate tool execution with mock data
   */
  async invoke(input: ToolSimulatorInput): Promise<ToolSimulatorResult> {
    const { name, op, args, seed, latencyMs, errorMode } = input;

    // Check for custom override
    const overrideKey = `${name}:${op}`;
    const override = this.customOverrides.get(overrideKey) ||
      this.activeProfile?.tools[overrideKey];

    // Apply latency simulation
    const actualLatency = override?.latencyMs || latencyMs || this.getDefaultLatency(name);
    if (actualLatency > 0) {
      await this.delay(actualLatency);
    }

    // Handle error simulation
    if (override?.errorMode || errorMode) {
      const errorType = override?.errorMode || errorMode;
      return {
        ok: false,
        error: this.generateError(errorType!, name, op),
        meta: {
          latencyMs: actualLatency,
          mockSource: override ? 'custom' : 'preset'
        }
      };
    }

    // Generate mock response
    const mockData = this.generateMockResponse(name, op, args, override, seed);

    return {
      ok: true,
      data: mockData,
      meta: {
        usedPreset: override?.presetId,
        latencyMs: actualLatency,
        mockSource: override ? 'custom' : 'preset'
      }
    };
  }

  /**
   * Set active mock profile
   */
  setActiveProfile(profile: ToolMockProfile | null): void {
    this.activeProfile = profile;
    this.saveActiveProfile();
  }

  /**
   * Add custom tool override
   */
  setToolOverride(toolName: string, operation: string, override: ToolMockOverride): void {
    const key = `${toolName}:${operation}`;
    this.customOverrides.set(key, override);
  }

  /**
   * Remove tool override
   */
  removeToolOverride(toolName: string, operation: string): void {
    const key = `${toolName}:${operation}`;
    this.customOverrides.delete(key);
  }

  /**
   * Get available tool configurations
   */
  getAvailableTools(): Record<string, ToolMockConfig> {
    return TOOL_MOCKS;
  }

  /**
   * Get tool configuration by name
   */
  getToolConfig(toolName: string): ToolMockConfig | null {
    return TOOL_MOCKS[toolName] || null;
  }

  /**
   * Create new mock profile
   */
  createProfile(name: string, description: string): ToolMockProfile {
    const profile: ToolMockProfile = {
      id: `profile_${Date.now()}`,
      name,
      description,
      tools: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    return profile;
  }

  /**
   * Save profile to storage
   */
  saveProfile(profile: ToolMockProfile): void {
    const profiles = this.getStoredProfiles();
    profiles[profile.id] = profile;
    localStorage.setItem('tool_mock_profiles', JSON.stringify(profiles));
  }

  /**
   * Get stored profiles
   */
  getStoredProfiles(): Record<string, ToolMockProfile> {
    try {
      const stored = localStorage.getItem('tool_mock_profiles');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  /**
   * Delete profile
   */
  deleteProfile(profileId: string): void {
    const profiles = this.getStoredProfiles();
    delete profiles[profileId];
    localStorage.setItem('tool_mock_profiles', JSON.stringify(profiles));
  }

  private loadActiveProfile(): void {
    try {
      const stored = localStorage.getItem('tool_mock_active_profile');
      if (stored) {
        this.activeProfile = JSON.parse(stored);
      }
    } catch {
      this.activeProfile = null;
    }
  }

  private saveActiveProfile(): void {
    if (this.activeProfile) {
      localStorage.setItem('tool_mock_active_profile', JSON.stringify(this.activeProfile));
    } else {
      localStorage.removeItem('tool_mock_active_profile');
    }
  }

  private getDefaultLatency(toolName: string): number {
    const config = TOOL_MOCKS[toolName];
    return config?.defaultLatency || 100;
  }

  private generateMockResponse(
    toolName: string,
    operation: string,
    args: Record<string, unknown>,
    override?: ToolMockOverride,
    seed?: string
  ): unknown {
    // Use custom output if provided
    if (override?.customOutput) {
      return override.customOutput;
    }

    // Use preset if specified
    if (override?.presetId) {
      const config = TOOL_MOCKS[toolName];
      const preset = config?.presets.find((p: ToolPreset) => p.id === override.presetId);
      if (preset) {
        return preset.output;
      }
    }

    // Generate deterministic mock based on seed
    const deterministicSeed = seed || `${toolName}:${operation}:${JSON.stringify(args)}`;
    return this.generateDeterministicMock(toolName, operation, args, deterministicSeed);
  }

  private generateDeterministicMock(
    toolName: string,
    operation: string,
    args: Record<string, unknown>,
    seed: string
  ): unknown {
    // Simple hash-based deterministic generation
    const hash = this.simpleHash(seed);

    switch (toolName) {
      case 'calendar':
        return this.generateCalendarMock(operation, args, hash);
      case 'email':
        return this.generateEmailMock(operation, args, hash);
      case 'http':
        return this.generateHttpMock(operation, args, hash);
      default:
        return { message: 'Mock response', timestamp: Date.now() };
    }
  }

  private generateCalendarMock(operation: string, args: Record<string, unknown>, hash: number): unknown {
    if (operation === 'listEvents') {
      const eventCount = hash % 5;
      return Array.from({ length: eventCount }, (_, i) => ({
        id: `evt_${i}`,
        summary: `Mock Event ${i + 1}`,
        start: new Date(Date.now() + (i * 3600000)).toISOString(),
        end: new Date(Date.now() + (i * 3600000) + 1800000).toISOString(),
        attendees: [`attendee${i}@example.com`]
      }));
    }

    if (operation === 'createEvent') {
      return {
        id: `evt_${hash}`,
        htmlLink: `https://calendar.google.com/event?eid=${hash}`
      };
    }

    return {};
  }

  private generateEmailMock(operation: string, args: Record<string, unknown>, hash: number): unknown {
    if (operation === 'search') {
      const messageCount = hash % 4;
      return Array.from({ length: messageCount }, (_, i) => ({
        id: `msg_${i}`,
        subject: `Mock Email ${i + 1}`,
        from: `sender${i}@example.com`,
        snippet: `This is a mock email snippet ${i + 1}`,
        date: new Date(Date.now() - (i * 3600000)).toISOString()
      }));
    }

    if (operation === 'send') {
      return {
        id: `sent_${hash}`,
        threadId: `thread_${hash}`
      };
    }

    return {};
  }

  private generateHttpMock(operation: string, args: Record<string, unknown>, hash: number): unknown {
    if (operation === 'request') {
      const statusCodes = [200, 201, 400, 404, 500];
      const status = statusCodes[hash % statusCodes.length];
      return {
        status,
        statusText: status === 200 ? 'OK' : status === 404 ? 'Not Found' : 'Error',
        headers: { 'content-type': 'application/json' },
        data: { message: 'Mock HTTP response', timestamp: Date.now() }
      };
    }

    return {};
  }

  private generateError(type: ToolError['kind'], toolName: string, operation: string): ToolError {
    const messages = {
      timeout: `Request to ${toolName}.${operation} timed out`,
      rateLimit: `Rate limit exceeded for ${toolName}.${operation}`,
      notFound: `Resource not found in ${toolName}.${operation}`,
      server: `Server error in ${toolName}.${operation}`,
      validation: `Validation error in ${toolName}.${operation}`
    };

    return {
      kind: type,
      message: messages[type] || `Error in ${toolName}.${operation}`,
      code: type.toUpperCase()
    };
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getActiveProfile(): ToolMockProfile {
    return this.activeProfile || ToolSimulator.DEFAULT_PROFILE;
  }
}

// Export singleton instance for easy use
export const toolSimulator = new ToolSimulator();
