// testTierEnforcement.ts
// This is a test script to demonstrate subscription tier enforcement

// Mock the environment variables that would normally be set in a Next.js environment
process.env.NEXT_PUBLIC_LLM_PROVIDER = 'nvidia';
process.env.NEXT_PUBLIC_NVIDIA_API_KEY = 'test-key';
process.env.NEXT_PUBLIC_NVIDIA_MODEL = 'meta/llama-3.1-70b-instruct';

// Import the functions we want to test
import { canUserAccessModel, getTierRestrictionError } from './subscriptionTiers';

async function testTierEnforcement() {
  console.log('Testing subscription tier enforcement...\n');

  // Test basic tier access
  console.log('=== Testing Basic Tier Access ===');
  console.log('Basic tier can access meta/llama-3.1-70b-instruct:', canUserAccessModel('basic', 'meta/llama-3.1-70b-instruct'));
  console.log('Basic tier can access qwen/qwen-2-72b-instruct:', canUserAccessModel('basic', 'qwen/qwen-2-72b-instruct'));
  console.log('Basic tier can access gpt-4:', canUserAccessModel('basic', 'gpt-4'));
  console.log('Basic tier can access claude-3:', canUserAccessModel('basic', 'claude-3'));
  console.log('');

  // Test pro tier access
  console.log('=== Testing Pro Tier Access ===');
  console.log('Pro tier can access meta/llama-3.1-70b-instruct:', canUserAccessModel('pro', 'meta/llama-3.1-70b-instruct'));
  console.log('Pro tier can access gpt-4:', canUserAccessModel('pro', 'gpt-4'));
  console.log('Pro tier can access claude-3:', canUserAccessModel('pro', 'claude-3'));
  console.log('Pro tier can access gemini-pro:', canUserAccessModel('pro', 'gemini-pro'));
  console.log('');

  // Test error messages
  console.log('=== Testing Error Messages ===');
  console.log('Basic tier trying to access gpt-4:');
  console.log(getTierRestrictionError('basic', 'gpt-4'));
  console.log('');
  
  console.log('Basic tier trying to access claude-3:');
  console.log(getTierRestrictionError('basic', 'claude-3'));
  console.log('');
  
  console.log('Pro tier trying to access non-existent model:');
  console.log(getTierRestrictionError('pro', 'non-existent-model'));
  console.log('');

  console.log('All tests completed successfully!');
}

// Run the test
testTierEnforcement().catch(console.error);
