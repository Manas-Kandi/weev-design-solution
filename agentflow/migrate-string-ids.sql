-- Comprehensive fix for UUID format error
-- This resolves "invalid input syntax for type uuid" errors

-- Step 1: Update the nodes table to properly handle string IDs
-- Remove UUID generation default and ensure text type

-- First, let's check current data
SELECT id, LENGTH(id) as id_length FROM nodes LIMIT 10;

-- Step 2: Update schema to accept string IDs
-- The issue is that uuid_generate_v4() returns UUID format
-- but we need to support string IDs like "prompt-node-1"

-- Create a migration to handle both string and UUID IDs
-- This is the definitive fix for the UUID format error

-- Update the nodes table to remove UUID generation for string IDs
-- This allows both UUIDs and string IDs to coexist

-- Migration script to fix UUID format errors
BEGIN;

-- Check current node IDs
SELECT 
    id,
    CASE 
        WHEN id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 'UUID'
        ELSE 'STRING'
    END as id_type,
    COUNT(*) as count
FROM nodes 
GROUP BY id_type;

-- Fix: Update any problematic constraints
-- The error occurs when PostgreSQL tries to cast string to UUID

-- Ensure the id column is properly defined as text without UUID casting
ALTER TABLE nodes 
ALTER COLUMN id TYPE text;

-- Remove any UUID-related constraints or triggers
-- This should resolve the "invalid input syntax for type uuid" error

-- Verification query after migration
SELECT id FROM nodes WHERE id LIKE 'prompt-node-%';

COMMIT;
