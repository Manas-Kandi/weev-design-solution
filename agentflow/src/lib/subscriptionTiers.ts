/**
 * Subscription Tier Model Access Controls
 * 
 * Defines which models are available for each subscription tier:
 * - Basic ($5/month): Open-source models only
 * - Pro ($25/month): All models including premium ones
 */

export type UserTier = 'basic' | 'pro';

export interface SubscriptionTierConfig {
  name: string;
  allowedModels: string[];
  description: string;
}

export const SUBSCRIPTION_TIERS: Record<UserTier, SubscriptionTierConfig> = {
  basic: {
    name: 'Basic',
    allowedModels: [
      'meta/llama-3.1-70b-instruct',
      'qwen/qwen-2-72b-instruct'
    ],
    description: 'Open-source models only'
  },
  pro: {
    name: 'Pro', 
    allowedModels: [
      // Open-source models (included from Basic)
      'meta/llama-3.1-70b-instruct',
      'qwen/qwen-2-72b-instruct',
      // Premium models
      'gpt-4',
      'gpt-4-turbo',
      'claude-3',
      'claude-3-5-sonnet-20241022',
      'gemini-pro',
      'gemini-2.5-flash-lite'
    ],
    description: 'All models including premium ones'
  }
};

/**
 * Check if a user can access a specific model based on their subscription tier
 */
export function canUserAccessModel(userTier: UserTier, modelName: string): boolean {
  const tierConfig = SUBSCRIPTION_TIERS[userTier];
  if (!tierConfig) {
    return false;
  }
  
  return tierConfig.allowedModels.includes(modelName);
}

/**
 * Get the tier restriction error message for upgrade prompting
 */
export function getTierRestrictionError(userTier: UserTier, attemptedModel: string): string {
  const tierConfig = SUBSCRIPTION_TIERS[userTier];
  
  if (userTier === 'basic') {
    return `Upgrade to Pro to access ${attemptedModel}. You're currently limited to open-source models (${tierConfig.allowedModels.join(', ')}). Upgrade at https://weev.ai/pricing`;
  }
  
  return `Model ${attemptedModel} is not available for your ${tierConfig.name} subscription.`;
}

/**
 * Get all allowed models for a user tier
 */
export function getAllowedModels(userTier: UserTier): string[] {
  const tierConfig = SUBSCRIPTION_TIERS[userTier];
  return tierConfig ? tierConfig.allowedModels : [];
}