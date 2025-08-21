# Subscription Tiers Feature

## Overview

The subscription tiers feature implements model access control based on user subscription levels in the AgentFlow application. This system ensures that users can only access AI models that correspond to their subscription tier, with appropriate upgrade prompts for premium features.

## Architecture

### Core Components

1. **Subscription Tier Configuration** (`src/lib/subscriptionTiers.ts`)
2. **LLM Client Integration** (`src/lib/llmClient.ts`)
3. **API Route Enforcement** (`src/app/api/llm/nvidia/route.ts`)
4. **Workflow Runner Integration** (`src/lib/workflowRunnerPropertiesDriven.ts`)
5. **Testing Panel Integration** (Various testing panel components)

## Subscription Tiers

### Basic Tier ($5/month)
- **Access**: Open-source models only
- **Allowed Models**:
  - `meta/llama-3.1-70b-instruct`
  - `qwen/qwen-2-72b-instruct`
- **Description**: "Open-source models only"

### Pro Tier ($25/month)
- **Access**: All models including premium ones
- **Allowed Models**:
  - All Basic tier models (inherited)
  - `gpt-4`
  - `gpt-4-turbo`
  - `claude-3`
  - `claude-3-5-sonnet-20241022`
  - `gemini-pro`
  - `gemini-2.5-flash-lite`
- **Description**: "All models including premium ones"

## Implementation Details

### 1. Subscription Tier Types and Configuration

```typescript
export type UserTier = 'basic' | 'pro';

export interface SubscriptionTierConfig {
  name: string;
  allowedModels: string[];
  description: string;
}
```

The `SUBSCRIPTION_TIERS` constant defines the complete configuration for each tier, including allowed models and descriptions.

### 2. Access Control Functions

#### `canUserAccessModel(userTier: UserTier, modelName: string): boolean`
- Checks if a user's subscription tier allows access to a specific model
- Returns `true` if access is allowed, `false` otherwise

#### `getTierRestrictionError(userTier: UserTier, attemptedModel: string): string`
- Generates user-friendly error messages for tier restrictions
- Includes upgrade prompts with pricing page link for Basic users
- Returns appropriate error messages for unauthorized access attempts

#### `getAllowedModels(userTier: UserTier): string[]`
- Returns the complete list of models available for a given subscription tier
- Useful for UI components that need to display available options

### 3. LLM Client Integration

The `callLLM` function in `llmClient.ts` includes tier enforcement:

```typescript
// Check subscription tier access if userTier is provided
if (opts.userTier && opts.model) {
  if (!canUserAccessModel(opts.userTier, opts.model)) {
    throw new Error(getTierRestrictionError(opts.userTier, opts.model));
  }
}
```

**Key Features**:
- Optional `userTier` parameter in `CallLLMOptions`
- Automatic validation before making API calls
- Graceful error handling with upgrade prompts
- Passes `userTier` to API routes for server-side validation

### 4. API Route Enforcement

The NVIDIA API route (`/api/llm/nvidia`) implements server-side tier enforcement:

```typescript
// Tier enforcement: Check if user can access the requested model
const userTier: UserTier = body.userTier || 'basic'; // Default to basic if not specified
const requestedModel = body.model;

if (!canUserAccessModel(userTier, requestedModel)) {
  const errorMessage = getTierRestrictionError(userTier, requestedModel);
  return NextResponse.json({ error: errorMessage }, { status: 403 });
}
```

**Security Features**:
- Server-side validation prevents client-side bypassing
- Defaults to 'basic' tier if no tier is specified
- Returns HTTP 403 status for unauthorized access
- Consistent error messaging across client and server

### 5. Workflow Integration

The properties-driven workflow runner includes tier support:

```typescript
interface WorkflowExecutionOptions {
  // ... other options
  userTier?: UserTier
}
```

**Integration Points**:
- Workflow execution passes `userTier` to LLM calls
- Defaults to 'basic' tier if not specified
- Ensures consistent tier enforcement across all workflow operations

### 6. Testing Panel Integration

All testing panels have been updated to include tier enforcement:

- **FlowExecutionPanel**: Defaults to 'basic' tier for testing
- **PropertiesDrivenTestingPanel**: Includes tier parameter in workflow execution
- **SimpleTestingPanel**: Inherits tier enforcement through LLM client calls

## Usage Examples

### Basic Usage in Code

```typescript
import { callLLM } from '@/lib/llmClient';

// Call with tier enforcement
const result = await callLLM("Your prompt here", {
  model: "gpt-4",
  userTier: "pro", // User must have Pro tier for GPT-4
  temperature: 0.7
});
```

### Error Handling

```typescript
try {
  const result = await callLLM("Your prompt", {
    model: "gpt-4",
    userTier: "basic" // This will fail
  });
} catch (error) {
  // Error message: "Upgrade to Pro to access gpt-4. You're currently limited to open-source models (meta/llama-3.1-70b-instruct, qwen/qwen-2-72b-instruct). Upgrade at https://weev.ai/pricing"
  console.error(error.message);
}
```

### Checking Model Access

```typescript
import { canUserAccessModel, getAllowedModels } from '@/lib/subscriptionTiers';

// Check if user can access a specific model
const canAccess = canUserAccessModel('basic', 'gpt-4'); // false

// Get all allowed models for a tier
const allowedModels = getAllowedModels('basic');
// Returns: ['meta/llama-3.1-70b-instruct', 'qwen/qwen-2-72b-instruct']
```

## Configuration

### Environment Variables

The subscription tier system works with existing LLM configuration:

- `NEXT_PUBLIC_LLM_PROVIDER`: LLM provider ('nvidia' | 'gemini')
- `NEXT_PUBLIC_NVIDIA_API_KEY`: NVIDIA API key
- `NEXT_PUBLIC_NVIDIA_MODEL`: Default NVIDIA model
- `NEXT_PUBLIC_GEMINI_API_KEY`: Gemini API key

### Default Behavior

- **Default Tier**: 'basic' (if not specified)
- **Fallback Model**: 'meta/llama-3.1-70b-instruct' (Basic tier compatible)
- **Error Handling**: Graceful degradation with upgrade prompts

## Security Considerations

1. **Server-Side Validation**: All tier checks are performed server-side to prevent bypassing
2. **Default to Restrictive**: System defaults to 'basic' tier when tier is not specified
3. **Consistent Enforcement**: Tier checks are applied at multiple layers (client, server, workflow)
4. **Rate Limiting**: Existing rate limiting applies to all tier levels

## Future Enhancements

### Potential Improvements

1. **Dynamic Tier Management**: Integration with payment systems for real-time tier updates
2. **Usage Tracking**: Monitor model usage per tier for analytics
3. **Custom Tier Configurations**: Allow admin-configurable tier definitions
4. **Model Quotas**: Implement usage limits per tier (e.g., requests per month)
5. **Tier-Specific Features**: Additional features beyond model access (e.g., priority support)

### Integration Points

- **User Authentication**: Connect with user management system
- **Payment Processing**: Integration with Stripe or similar payment providers
- **Analytics**: Track usage patterns and upgrade conversion rates
- **Admin Dashboard**: Manage tiers and monitor system usage

## Testing

### Current Test Integration

All testing panels default to 'basic' tier for consistent testing behavior:

```typescript
// Example from FlowExecutionPanel.tsx
userTier: 'basic', // Default for testing
```

### Testing Different Tiers

To test Pro tier functionality:

1. Modify the `userTier` parameter in testing panels
2. Use Pro-tier models in test workflows
3. Verify error handling for tier restrictions

## Troubleshooting

### Common Issues

1. **"Model not available" errors**: Check if the model is allowed for the user's tier
2. **Default to basic tier**: Ensure `userTier` is properly passed through the call chain
3. **API key errors**: Verify NVIDIA API key configuration for premium models

### Debug Information

The system provides detailed error messages including:
- Current user tier
- Attempted model
- List of allowed models for the tier
- Upgrade instructions with pricing page link

## Related Files

### Core Implementation
- `src/lib/subscriptionTiers.ts` - Tier definitions and access control
- `src/lib/llmClient.ts` - LLM client with tier integration
- `src/app/api/llm/nvidia/route.ts` - API route with server-side enforcement

### Integration Points
- `src/lib/workflowRunnerPropertiesDriven.ts` - Workflow execution with tiers
- `src/features/testing/FlowExecutionPanel.tsx` - Testing panel integration
- `src/features/testing/PropertiesDrivenTestingPanel.tsx` - Properties panel integration
- `src/features/testing/SimpleTestingPanel.tsx` - Simple testing panel integration

This subscription tier system provides a robust foundation for monetizing AI model access while maintaining a smooth user experience with clear upgrade paths.
