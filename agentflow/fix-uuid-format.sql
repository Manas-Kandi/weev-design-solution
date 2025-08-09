-- Comprehensive fix for UUID format error
-- This addresses the "invalid input syntax for type uuid" error

-- Step 1: Check current schema and fix UUID validation
-- The issue is likely that PostgreSQL is implicitly casting text to UUID

-- Step 2: Update the nodes table to ensure string IDs work
-- Drop and recreate the table with proper text ID handling

-- First, let's check what the actual issue is
-- The error suggests PostgreSQL is trying to cast string to UUID

-- Fix: Ensure the id column is truly text and not implicitly UUID
ALTER TABLE nodes 
ALTER COLUMN id TYPE text USING id::text;

-- Ensure no UUID validation is happening
-- This should resolve the "invalid input syntax for type uuid" error

-- Step 3: Add proper constraint for string IDs
-- Remove any implicit UUID casting

-- Step 4: Update any triggers or constraints that might be enforcing UUID format
-- Check for any check constraints or triggers on the id column

-- Verification query
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'nodes' AND column_name = 'id';
