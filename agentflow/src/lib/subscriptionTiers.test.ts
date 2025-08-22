import { describe, test, expect } from 'vitest';
import { canUserAccessModel, getTierRestrictionError, getAllowedModels } from './subscriptionTiers';

describe('Subscription Tier Enforcement', () => {
  test('Basic tier can access open-source models', () => {
    expect(canUserAccessModel('basic', 'meta/llama-3.1-70b-instruct')).toBe(true);
    expect(canUserAccessModel('basic', 'qwen/qwen-2-72b-instruct')).toBe(true);
    expect(canUserAccessModel('basic', 'free-models')).toBe(true);
  });

  test('Basic tier cannot access premium models', () => {
    expect(canUserAccessModel('basic', 'gpt-4')).toBe(false);
    expect(canUserAccessModel('basic', 'claude-3')).toBe(false);
    expect(canUserAccessModel('basic', 'gemini-pro')).toBe(false);
  });

  test('Pro tier can access all models', () => {
    expect(canUserAccessModel('pro', 'meta/llama-3.1-70b-instruct')).toBe(true);
    expect(canUserAccessModel('pro', 'gpt-4')).toBe(true);
    expect(canUserAccessModel('pro', 'claude-3')).toBe(true);
    expect(canUserAccessModel('pro', 'gemini-pro')).toBe(true);
    expect(canUserAccessModel('pro', 'free-models')).toBe(true);
  });

  test('Error messages for tier restrictions', () => {
    const errorMessage = getTierRestrictionError('basic', 'gpt-4');
    expect(errorMessage).toContain('Upgrade to Pro to access GPT-4');
    expect(errorMessage).toContain('limited to open-source models');
    
    const freeModelsMessage = getTierRestrictionError('basic', 'free-models');
    expect(freeModelsMessage).toBe('You will be routed through the best free models available at the time.');
  });

  test('Get allowed models for each tier', () => {
    const basicModels = getAllowedModels('basic');
    expect(basicModels).toEqual(['free-models', 'meta/llama-3.1-70b-instruct', 'qwen/qwen-2-72b-instruct']);

    const proModels = getAllowedModels('pro');
    expect(proModels).toContain('free-models');
    expect(proModels).toContain('meta/llama-3.1-70b-instruct');
    expect(proModels).toContain('gpt-4');
    expect(proModels).toContain('claude-3');
    expect(proModels).toContain('gemini-pro');
  });
});