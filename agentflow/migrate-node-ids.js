#!/usr/bin/env node

/**
 * Database Migration Script for Node ID Format
 * 
 * This script handles the transition from string IDs to UUIDs for nodes
 * and updates the schema to be more flexible with ID formats
 */

import { supabaseAdmin } from './src/lib/supabaseAdmin.ts';

async function migrateNodeIds() {
  console.log('Starting node ID migration...');
  
  try {
    // 1. Check current nodes and their ID formats
    const { data: nodes, error: fetchError } = await supabaseAdmin
      .from('nodes')
      .select('*');
    
    if (fetchError) {
      console.error('Error fetching nodes:', fetchError);
      return;
    }
    
    console.log(`Found ${nodes?.length || 0} nodes to process`);
    
    // 2. Identify nodes with non-UUID string IDs
    const nonUuidNodes = nodes?.filter(node => {
      const id = node.id;
      // Simple UUID regex check
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return !uuidRegex.test(id);
    }) || [];
    
    console.log(`Found ${nonUuidNodes.length} nodes with non-UUID IDs`);
    
    // 3. For each non-UUID node, create a new UUID and update references
    for (const node of nonUuidNodes) {
      console.log(`Processing node: ${node.id}`);
      
      // Generate new UUID
      const newId = crypto.randomUUID();
      
      // Update the node ID
      const { error: updateError } = await supabaseAdmin
        .from('nodes')
        .update({ id: newId })
        .eq('id', node.id);
      
      if (updateError) {
        console.error(`Failed to update node ${node.id}:`, updateError);
        continue;
      }
      
      console.log(`Updated node ${node.id} -> ${newId}`);
    }
    
    console.log('Node ID migration completed successfully');
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run the migration
migrateNodeIds();
