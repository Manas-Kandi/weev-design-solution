# Subscription Tiers Feature - Changelog

## August 20, 2025

### Feature: Free Models Implementation
- **Added Free Models Option**: Implemented "Free Models" selection in the model dropdown with description "Best available free models"
- **Updated Tier Definitions**: Added `free-models` to allowed models list for both Basic and Pro tiers
- **Routing Logic**: Implemented proper routing of `free-models` requests through NVIDIA LLM Router using `meta/llama-3.1-70b-instruct` as the default model
- **UI Updates**: Modified UnifiedPropertiesPanel to include the new "Free Models" option in the model selection dropdown

### Bug Fix: NVIDIA API Parameter Filtering
- **Issue**: NVIDIA API was rejecting requests with 400 Bad Request error: "Extra inputs are not permitted"
- **Root Cause**: The `userTier` parameter was being sent in the request body to the NVIDIA API, which is not a valid parameter
- **Solution**: 
  - Modified `/src/app/api/llm/nvidia/route.ts` to properly remove the `userTier` parameter from the request body before sending to NVIDIA API
  - Updated destructuring to use `__userTier` to avoid naming conflicts
  - Maintained all existing functionality including tier enforcement and free-models routing
- **Impact**: Fixed the 400 Bad Request error that was preventing "Free Models" from working properly

### Bug Fix: Variable Naming Conflict Resolution
- **Issue**: Build errors due to duplicate variable name `userTier` in NVIDIA API route
- **Root Cause**: Variable naming conflict where `userTier` was being defined multiple times
- **Solution**: 
  - Updated variable naming in `/src/app/api/llm/nvidia/route.ts` to use `__userTier` instead of `_userTier`
  - Ensured consistent parameter filtering throughout the codebase
- **Impact**: Resolved build errors and ensured successful compilation

### Documentation Updates
- Updated `subscription-tiers.md` with accurate code examples showing proper parameter filtering
- Added detailed changelog section documenting all changes and fixes
- Clarified implementation details for free-models routing and NVIDIA API parameter handling

### Testing Verification
- All existing subscription tier tests continue to pass
- Implementation verified to properly route "free-models" requests through NVIDIA infrastructure
- Tier enforcement maintained for all model access including free-models option
- No breaking changes to existing functionality

## Summary of Changes

### Files Modified
1. `/src/components/canvas/UnifiedPropertiesPanel.tsx` - Added "Free Models" option to model selection dropdown
2. `/src/lib/subscriptionTiers.ts` - Added `free-models` to allowed models for both Basic and Pro tiers
3. `/src/app/api/llm/nvidia/route.ts` - Fixed NVIDIA API parameter filtering and variable naming conflicts
4. `/src/lib/llmClient.ts` - Updated implementation comments
5. `/readme-context/subscription-tiers.md` - Updated documentation with changelog

### Key Improvements
- **User Experience**: Users can now select "Free Models" as an option that routes through the best available free models
- **API Compatibility**: Fixed compatibility issues with NVIDIA API by properly filtering invalid parameters
- **Build Stability**: Resolved variable naming conflicts that were causing build errors
- **Documentation**: Added comprehensive changelog and updated code examples

### Verification Results
- ✅ All existing tests pass
- ✅ Project builds successfully without errors
- ✅ Free Models option works as expected
- ✅ Tier enforcement maintained for all model access
- ✅ No breaking changes to existing functionality