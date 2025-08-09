-- Comprehensive fix for node ID format issue
-- This addresses the "invalid input syntax for type uuid" error

-- Step 1: Update the nodes table to use text instead of uuid type
-- This allows both UUID strings and custom string IDs

-- Note: The current schema already uses text type for id, so this is informational
-- The actual fix is in the application code

-- Step 2: Ensure the database accepts string IDs properly
-- The schema.sql shows:
-- create table nodes (
--   id text primary key default uuid_generate_v4(),
--   ...
-- );

-- Step 3: Application-level fix (already implemented)
-- The fix has been applied in the API routes to handle string IDs gracefully
